import {createHash} from 'node:crypto';
import {FieldValue, Timestamp} from 'firebase-admin/firestore';
import {resolveCanonicalTeacherIdForWrite} from '../helpers/teacherIdentity';
import {
  inspectFutureScheduleEnrollment,
  loadFutureScheduleEvidence,
  type FutureScheduleEnrollmentInspection,
  type FutureScheduleEvidenceStore,
  type FutureScheduleSessionEvidence,
} from './futureScheduleInspection';
import {
  buildFutureScheduleReconciliationPlan,
  type FutureSchedulePlanAction,
  type FutureScheduleReconciliationPlan,
} from './futureSchedulePlan';
import {
  assessFutureScheduleEnrollmentSource,
  buildFutureScheduleWindowPlan,
  resolveFutureScheduleTodayYmd,
} from './futureScheduleReconciler';
import {
  MAX_ROLLING_WINDOW_OCCURRENCES,
  ROLLING_SCHEDULE_DELIVERY_MODE,
  ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
  ROLLING_SCHEDULE_SESSION_SOURCE,
  buildRollingScheduledSessionPayload,
  type RollingMaterializationOccurrence,
} from './rollingScheduleMaterializer';

export type FutureScheduleExecutionErrorCode =
  | 'INVALID_ARGUMENT'
  | 'ENROLLMENT_NOT_FOUND'
  | 'SOURCE_BLOCKED'
  | 'STALE_APPROVAL'
  | 'PLAN_BLOCKED'
  | 'UNSAFE_ACTION';

export class FutureScheduleExecutionError extends Error {
  readonly code: FutureScheduleExecutionErrorCode;

  constructor(code: FutureScheduleExecutionErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'FutureScheduleExecutionError';
  }
}

export interface FutureScheduleExecutionReadStore extends FutureScheduleEvidenceStore {
  getNow(): Date;
  getEnrollment(enrollmentId: string): Promise<Record<string, unknown> | null>;
  getExternallyFinanceLinkedSessionIds(sessionIds: string[]): Promise<string[]>;
}

export interface FutureScheduleExecutionTransaction
  extends FutureScheduleExecutionReadStore {
  createSession(
    sessionId: string,
    payload: Record<string, unknown>,
  ): Promise<void>;
  patchSession(
    sessionId: string,
    patch: Record<string, unknown>,
  ): Promise<void>;
}

export interface FutureScheduleExecutorStore extends FutureScheduleExecutionReadStore {
  runTransaction<T>(
    handler: (tx: FutureScheduleExecutionTransaction) => Promise<T>,
  ): Promise<T>;
}

export type FutureScheduleExecutionPreview = {
  enrollmentId: string;
  todayYmd: string;
  enrollment: Record<string, unknown>;
  evidence: FutureScheduleSessionEvidence[];
  externallyFinanceLinkedSessionIds: string[];
  executorBlockers: string[];
  inspection: FutureScheduleEnrollmentInspection;
  plan: FutureScheduleReconciliationPlan;
  approvalFingerprint: string;
};

export type FutureScheduleExecutionInput = {
  enrollmentId: string;
  expectedApprovalFingerprint: string;
  actorId: string;
};

export type FutureScheduleExecutionResult = {
  status: 'noop' | 'applied';
  enrollmentId: string;
  planFingerprint: string;
  approvalFingerprint: string;
  actionIds: string[];
  appliedActions: number;
};

const text = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => text(entry)).filter(Boolean)));
};

const canonicalize = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (value instanceof Date) return {__date: value.toISOString()};
  if (Array.isArray(value)) return value.map((entry) => canonicalize(entry));
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    // Firestore DocumentReference instances carry a Firestore client object
    // internally and are not safe to recursively serialize. Their path is the
    // stable value that matters for stale-approval detection.
    if (
      typeof record.path === 'string' &&
      typeof record.id === 'string' &&
      typeof record.get === 'function'
    ) {
      return {__documentReference: record.path};
    }

    if (typeof record.toDate === 'function') {
      try {
        const converted = (record.toDate as () => Date)();
        if (converted instanceof Date && !Number.isNaN(converted.getTime())) {
          return {__timestamp: converted.toISOString()};
        }
      } catch {
        // Fall through to stable object handling.
      }
    }
    const seconds = Number(record.seconds ?? record._seconds);
    const nanos = Number(record.nanoseconds ?? record._nanoseconds ?? 0);
    if (Number.isFinite(seconds)) {
      return {
        __timestampSeconds: seconds,
        __timestampNanos: Number.isFinite(nanos) ? nanos : 0,
      };
    }
    const result: Record<string, unknown> = {};
    Object.keys(record).sort().forEach((key) => {
      if (typeof record[key] === 'function') return;
      result[key] = canonicalize(record[key]);
    });
    return result;
  }
  return value;
};

const stableStringify = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

const fingerprintExecutionState = (args: {
  enrollmentId: string;
  todayYmd: string;
  enrollment: Record<string, unknown>;
  evidence: FutureScheduleSessionEvidence[];
  externallyFinanceLinkedSessionIds: string[];
  planFingerprint: string;
}): string => {
  const evidence = [...args.evidence]
    .map((row) => ({id: row.id, data: row.data}))
    .sort((a, b) => a.id.localeCompare(b.id));
  return createHash('sha256')
    .update(stableStringify({
      enrollmentId: args.enrollmentId,
      todayYmd: args.todayYmd,
      enrollment: args.enrollment,
      evidence,
      externallyFinanceLinkedSessionIds: [...args.externallyFinanceLinkedSessionIds].sort(),
      planFingerprint: args.planFingerprint,
    }))
    .digest('hex');
};

export function buildFutureScheduleExecutionPreview(args: {
  enrollmentId: string;
  todayYmd: string;
  enrollment: Record<string, unknown>;
  evidence: FutureScheduleSessionEvidence[];
  externallyFinanceLinkedSessionIds?: string[];
}): FutureScheduleExecutionPreview {
  const enrollmentId = text(args.enrollmentId);
  const todayYmd = text(args.todayYmd);
  if (!enrollmentId || !todayYmd) {
    throw new FutureScheduleExecutionError(
      'INVALID_ARGUMENT',
      'enrollmentId and todayYmd are required',
    );
  }

  const externallyFinanceLinkedSessionIds = Array.from(new Set(
    (args.externallyFinanceLinkedSessionIds || []).map((value) => text(value)).filter(Boolean),
  )).sort();
  const externallyLinked = new Set(externallyFinanceLinkedSessionIds);
  const evidence = args.evidence.map((row) => ({
    id: row.id,
    data: externallyLinked.has(row.id)
      ? {...row.data, externallyFinanceLinked: true}
      : row.data,
  }));

  const inspection = inspectFutureScheduleEnrollment({
    enrollmentId,
    enrollment: args.enrollment,
    todayYmd,
    sessions: evidence,
  });
  const plan = buildFutureScheduleReconciliationPlan(inspection);
  const evidenceIds = new Set(evidence.map((row) => row.id));
  const executorBlockers = [
    ...(plan.actions.some((action) => action.kind === 'CREATE_EXPECTED_REGULAR') &&
      (typeof args.enrollment.teacherName !== 'string' ||
        !args.enrollment.teacherName.trim())
      ? ['missing_teacher_name_for_create']
      : []),
    ...externallyFinanceLinkedSessionIds
      .filter((sessionId) => !evidenceIds.has(sessionId))
      .map((sessionId) => `external_finance_without_session:${sessionId}`),
  ].sort();

  const approvalFingerprint = fingerprintExecutionState({
    enrollmentId,
    todayYmd,
    enrollment: args.enrollment,
    evidence,
    externallyFinanceLinkedSessionIds,
    planFingerprint: plan.planFingerprint,
  });

  return {
    enrollmentId,
    todayYmd,
    enrollment: args.enrollment,
    evidence: [...evidence].sort((a, b) => a.id.localeCompare(b.id)),
    externallyFinanceLinkedSessionIds,
    executorBlockers,
    inspection,
    plan,
    approvalFingerprint,
  };
}

export async function prepareFutureScheduleExecution(
  store: FutureScheduleExecutionReadStore,
  input: {
    enrollmentId: string;
  },
): Promise<FutureScheduleExecutionPreview> {
  const enrollmentId = text(input.enrollmentId);
  if (!enrollmentId) {
    throw new FutureScheduleExecutionError(
      'INVALID_ARGUMENT',
      'enrollmentId is required',
    );
  }
  const todayYmd = resolveFutureScheduleTodayYmd(store.getNow());

  const enrollment = await store.getEnrollment(enrollmentId);
  if (!enrollment) {
    throw new FutureScheduleExecutionError(
      'ENROLLMENT_NOT_FOUND',
      `Enrollment ${enrollmentId} was not found`,
    );
  }

  const assessment = assessFutureScheduleEnrollmentSource(enrollment);
  if (!assessment.ready) {
    return buildFutureScheduleExecutionPreview({
      enrollmentId,
      todayYmd,
      enrollment,
      evidence: [],
    });
  }

  const expected = buildFutureScheduleWindowPlan({
    enrollmentId,
    enrollment,
    todayYmd,
  });
  const evidence = await loadFutureScheduleEvidence({
    store,
    plan: expected,
  });
  const financeCandidateIds = Array.from(new Set([
    ...expected.occurrences.map((row) => row.sessionId),
    ...evidence.map((row) => row.id),
  ]));
  const externallyFinanceLinkedSessionIds =
    await store.getExternallyFinanceLinkedSessionIds(financeCandidateIds);

  return buildFutureScheduleExecutionPreview({
    enrollmentId,
    todayYmd,
    enrollment,
    evidence,
    externallyFinanceLinkedSessionIds,
  });
}

const occurrenceMapFromInspection = (
  inspection: FutureScheduleEnrollmentInspection,
): Map<string, RollingMaterializationOccurrence> => {
  if (inspection.kind !== 'inspected') return new Map();
  return new Map(
    inspection.inspection.occurrences.map((row) => [
      row.occurrence.sessionId,
      row.occurrence,
    ]),
  );
};

const sessionOccurrenceDate = (
  inspection: FutureScheduleEnrollmentInspection,
  sessionId: string,
): string | null => {
  if (inspection.kind !== 'inspected') return null;
  const match = inspection.inspection.occurrences.find(
    (row) =>
      row.canonicalSessionId === sessionId ||
      row.relatedSessionIds.includes(sessionId),
  );
  return match?.occurrence.date || null;
};

const MAX_FUTURE_SCHEDULE_EXECUTION_ACTIONS =
  MAX_ROLLING_WINDOW_OCCURRENCES * 2;

const assertBoundedUniqueActions = (
  actions: FutureSchedulePlanAction[],
): void => {
  if (actions.length > MAX_FUTURE_SCHEDULE_EXECUTION_ACTIONS) {
    throw new FutureScheduleExecutionError(
      'UNSAFE_ACTION',
      `Future schedule execution exceeds safe action cap of ${MAX_FUTURE_SCHEDULE_EXECUTION_ACTIONS}`,
    );
  }

  const actionIds = new Set<string>();
  const mutationTargets = new Set<string>();
  for (const action of actions) {
    if (actionIds.has(action.actionId)) {
      throw new FutureScheduleExecutionError(
        'UNSAFE_ACTION',
        `Duplicate future schedule action id ${action.actionId}`,
      );
    }
    actionIds.add(action.actionId);

    const target =
      action.kind === 'CREATE_EXPECTED_REGULAR'
        ? action.occurrenceSessionId
        : action.sessionId;
    if (mutationTargets.has(target)) {
      throw new FutureScheduleExecutionError(
        'UNSAFE_ACTION',
        `Multiple future schedule actions target session ${target}`,
      );
    }
    mutationTargets.add(target);
  }
};

const assertManagedDate = (
  plan: FutureScheduleReconciliationPlan,
  date: string | null,
  actionId: string,
): void => {
  if (
    !date ||
    !plan.todayYmd ||
    !plan.managedFromYmd ||
    !plan.managedThroughYmd ||
    date <= plan.todayYmd ||
    date < plan.managedFromYmd ||
    date > plan.managedThroughYmd
  ) {
    throw new FutureScheduleExecutionError(
      'UNSAFE_ACTION',
      `Action ${actionId} escaped the tomorrow-forward managed window`,
    );
  }
};

const resolveActionDate = (
  action: FutureSchedulePlanAction,
  preview: FutureScheduleExecutionPreview,
): string | null => {
  if (action.kind === 'RETIRE_UNEXPECTED_REGULAR') return action.date;
  if ('occurrenceSessionId' in action) {
    if (preview.inspection.kind !== 'inspected') return null;
    return preview.inspection.inspection.occurrences.find(
      (row) => row.occurrence.sessionId === action.occurrenceSessionId,
    )?.occurrence.date || null;
  }
  if (action.kind === 'SYNC_REGULAR_METADATA') {
    return sessionOccurrenceDate(preview.inspection, action.sessionId);
  }
  return null;
};

const schedulingPatchForOccurrence = (args: {
  enrollment: Record<string, unknown>;
  occurrence: RollingMaterializationOccurrence;
  scheduleRevision: number;
  actorId: string;
  restore: boolean;
}): Record<string, unknown> => {
  const teacher = resolveCanonicalTeacherIdForWrite(args.enrollment);
  if (!teacher.teacherId || teacher.source === 'ambiguous_legacy') {
    throw new FutureScheduleExecutionError(
      'SOURCE_BLOCKED',
      'Canonical teacher is required before future schedule execution',
    );
  }

  const teacherName = text(args.enrollment.teacherName);
  const teacherEmail = text(args.enrollment.teacherEmail);
  const parentIds = stringList(args.enrollment.parentIds);
  const parentId = text(args.enrollment.parentId) || parentIds[0] || '';
  if (parentId && !parentIds.includes(parentId)) parentIds.unshift(parentId);

  const patch: Record<string, unknown> = {
    teacherId: teacher.teacherId,
    ...(teacherName ? {teacherName} : {}),
    ...(teacherEmail ? {teacherEmail} : {}),
    ...(parentId ? {parentId, parentIds} : {}),
    startAt: Timestamp.fromMillis(args.occurrence.startAtUtcMs),
    endAt: Timestamp.fromMillis(args.occurrence.endAtUtcMs),
    date: args.occurrence.date,
    startTime: args.occurrence.startTime,
    endTime: args.occurrence.endTime,
    durationMins: args.occurrence.durationMinutes,
    durationMinutes: args.occurrence.durationMinutes,
    status: 'scheduled',
    source: ROLLING_SCHEDULE_SESSION_SOURCE,
    scheduleDeliveryMode: ROLLING_SCHEDULE_DELIVERY_MODE,
    scheduleRevision: args.scheduleRevision,
    scheduleOccurrenceKey: args.occurrence.occurrenceKey,
    scheduleMaterializationVersion: ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
    joinUrl: text(args.enrollment.joinUrl) || null,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: args.actorId,
  };

  if (args.restore) {
    patch.attendance = null;
    patch.cancelledReason = null;
    patch.canceledReason = null;
    patch.cancelledAt = null;
    patch.cancelledBy = null;
    patch.rollingScheduleReconciliationCancellation = null;
    patch.rollingLifecycleCancellation = null;
  }

  return patch;
};

const metadataPatch = (args: {
  enrollment: Record<string, unknown>;
  scheduleRevision: number;
  reasons: string[];
  actorId: string;
}): Record<string, unknown> => {
  const patch: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: args.actorId,
  };

  if (args.reasons.includes('stale_schedule_revision')) {
    patch.scheduleRevision = args.scheduleRevision;
  }

  if (args.reasons.includes('parent_identity_drift')) {
    const parentIds = stringList(args.enrollment.parentIds);
    const parentId = text(args.enrollment.parentId) || parentIds[0] || '';
    if (!parentId) {
      throw new FutureScheduleExecutionError(
        'SOURCE_BLOCKED',
        'Parent identity is required before parent metadata synchronization',
      );
    }
    if (!parentIds.includes(parentId)) parentIds.unshift(parentId);
    patch.parentId = parentId;
    patch.parentIds = parentIds;
  }

  if (args.reasons.includes('join_url_drift')) {
    patch.joinUrl = text(args.enrollment.joinUrl) || null;
  }

  if (args.reasons.includes('teacher_name_drift')) {
    const teacherName = text(args.enrollment.teacherName);
    if (!teacherName) {
      throw new FutureScheduleExecutionError(
        'SOURCE_BLOCKED',
        'Teacher name is required before teacher metadata synchronization',
      );
    }
    patch.teacherName = teacherName;
  }

  return patch;
};

const retirementPatch = (args: {
  action: FutureSchedulePlanAction;
  scheduleRevision: number;
  actorId: string;
}): Record<string, unknown> => ({
  status: 'cancelled',
  cancelledReason: 'rolling_schedule_reconciled',
  cancelledAt: FieldValue.serverTimestamp(),
  cancelledBy: args.actorId,
  rollingScheduleReconciliationCancellation: {
    source: 'rolling_schedule_reconciliation',
    reconciler: 'future_schedule_reconciler',
    scheduleRevision: args.scheduleRevision,
    actionKind: args.action.kind,
    actionId: args.action.actionId,
  },
  updatedAt: FieldValue.serverTimestamp(),
  updatedBy: args.actorId,
});

async function applyAction(args: {
  tx: FutureScheduleExecutionTransaction;
  preview: FutureScheduleExecutionPreview;
  action: FutureSchedulePlanAction;
  actorId: string;
}): Promise<void> {
  const {tx, preview, action, actorId} = args;
  if (
    preview.inspection.kind !== 'inspected' ||
    preview.plan.scheduleRevision == null
  ) {
    throw new FutureScheduleExecutionError(
      'PLAN_BLOCKED',
      'Blocked source inspection cannot be executed',
    );
  }

  const occurrenceMap = occurrenceMapFromInspection(preview.inspection);
  const occurrence =
    'occurrenceSessionId' in action
      ? occurrenceMap.get(action.occurrenceSessionId)
      : undefined;

  switch (action.kind) {
    case 'CREATE_EXPECTED_REGULAR': {
      if (!occurrence) {
        throw new FutureScheduleExecutionError(
          'UNSAFE_ACTION',
          `Missing occurrence for ${action.actionId}`,
        );
      }
      const payload = buildRollingScheduledSessionPayload({
        enrollmentId: preview.enrollmentId,
        enrollment: preview.enrollment,
        occurrence,
        scheduleRevision: preview.plan.scheduleRevision,
        actorId,
      });
      await tx.createSession(action.occurrenceSessionId, payload);
      return;
    }

    case 'RESTORE_EXPECTED_REGULAR':
    case 'REWRITE_EXPECTED_REGULAR': {
      if (!occurrence) {
        throw new FutureScheduleExecutionError(
          'UNSAFE_ACTION',
          `Missing occurrence for ${action.actionId}`,
        );
      }
      await tx.patchSession(
        action.sessionId,
        schedulingPatchForOccurrence({
          enrollment: preview.enrollment,
          occurrence,
          scheduleRevision: preview.plan.scheduleRevision,
          actorId,
          restore: action.kind === 'RESTORE_EXPECTED_REGULAR',
        }),
      );
      return;
    }

    case 'RETIRE_DUPLICATE_REGULAR':
    case 'RETIRE_UNEXPECTED_REGULAR':
    case 'RETIRE_MISMATCHED_REGULAR':
      await tx.patchSession(
        action.sessionId,
        retirementPatch({
          action,
          scheduleRevision: preview.plan.scheduleRevision,
          actorId,
        }),
      );
      return;

    case 'SYNC_REGULAR_METADATA':
      await tx.patchSession(
        action.sessionId,
        metadataPatch({
          enrollment: preview.enrollment,
          scheduleRevision: preview.plan.scheduleRevision,
          reasons: action.reasons,
          actorId,
        }),
      );
      return;
  }
}

export async function executeFutureScheduleReconciliation(
  store: FutureScheduleExecutorStore,
  input: FutureScheduleExecutionInput,
): Promise<FutureScheduleExecutionResult> {
  const enrollmentId = text(input.enrollmentId);
  const expectedApprovalFingerprint = text(input.expectedApprovalFingerprint);
  const actorId = text(input.actorId) || 'future-schedule-reconciler';

  if (!enrollmentId || !expectedApprovalFingerprint) {
    throw new FutureScheduleExecutionError(
      'INVALID_ARGUMENT',
      'enrollmentId and expectedApprovalFingerprint are required',
    );
  }

  return store.runTransaction(async (tx) => {
    // Resolve the business day inside the transaction callback so an internal
    // retry that crosses IST midnight cannot reuse yesterday's mutation window.
    const todayYmd = resolveFutureScheduleTodayYmd(tx.getNow());
    const liveEnrollment = await tx.getEnrollment(enrollmentId);
    if (!liveEnrollment) {
      throw new FutureScheduleExecutionError(
        'ENROLLMENT_NOT_FOUND',
        `Enrollment ${enrollmentId} was not found`,
      );
    }

    const assessment = assessFutureScheduleEnrollmentSource(liveEnrollment);
    let evidence: FutureScheduleSessionEvidence[] = [];
    if (assessment.ready) {
      const expected = buildFutureScheduleWindowPlan({
        enrollmentId,
        enrollment: liveEnrollment,
        todayYmd,
      });
      evidence = await loadFutureScheduleEvidence({
        store: tx,
        plan: expected,
      });
      const financeCandidateIds = Array.from(new Set([
        ...expected.occurrences.map((row) => row.sessionId),
        ...evidence.map((row) => row.id),
      ]));
      const externallyFinanceLinkedSessionIds =
        await tx.getExternallyFinanceLinkedSessionIds(financeCandidateIds);
      const preview = buildFutureScheduleExecutionPreview({
        enrollmentId,
        todayYmd,
        enrollment: liveEnrollment,
        evidence,
        externallyFinanceLinkedSessionIds,
      });

      if (preview.approvalFingerprint !== expectedApprovalFingerprint) {
        throw new FutureScheduleExecutionError(
          'STALE_APPROVAL',
          'Future schedule state changed after preview; rebuild the plan before execution',
        );
      }

      if (!preview.plan.readyToApply || preview.executorBlockers.length > 0) {
        throw new FutureScheduleExecutionError(
          'PLAN_BLOCKED',
          'Future schedule reconciliation plan is blocked and cannot be executed',
        );
      }

      if (preview.plan.isNoop) {
        return {
          status: 'noop',
          enrollmentId,
          planFingerprint: preview.plan.planFingerprint,
          approvalFingerprint: preview.approvalFingerprint,
          actionIds: [],
          appliedActions: 0,
        };
      }

      assertBoundedUniqueActions(preview.plan.actions);
      for (const action of preview.plan.actions) {
        assertManagedDate(
          preview.plan,
          resolveActionDate(action, preview),
          action.actionId,
        );
      }

      for (const action of preview.plan.actions) {
        await applyAction({tx, preview, action, actorId});
      }

      return {
        status: 'applied',
        enrollmentId,
        planFingerprint: preview.plan.planFingerprint,
        approvalFingerprint: preview.approvalFingerprint,
        actionIds: preview.plan.actions.map((action) => action.actionId),
        appliedActions: preview.plan.actions.length,
      };
    }

    const preview = buildFutureScheduleExecutionPreview({
      enrollmentId,
      todayYmd,
      enrollment: liveEnrollment,
      evidence,
      externallyFinanceLinkedSessionIds: [],
    });

    if (preview.approvalFingerprint !== expectedApprovalFingerprint) {
      throw new FutureScheduleExecutionError(
        'STALE_APPROVAL',
        'Future schedule state changed after preview; rebuild the plan before execution',
      );
    }

    throw new FutureScheduleExecutionError(
      'SOURCE_BLOCKED',
      'Future schedule enrollment source is blocked and cannot be executed',
    );
  });
}
