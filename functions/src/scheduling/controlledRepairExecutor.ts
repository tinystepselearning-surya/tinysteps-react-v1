/**
 * Brick 5: Controlled Repair Executor.
 *
 * Manual, admin-only, one-enrollment-at-a-time execution of Brick 4 plans.
 * Every apply requires a fresh preview fingerprint and revalidates the complete
 * enrollment/session state inside a Firestore transaction before the first write.
 */
import {createHash} from 'node:crypto';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {FieldValue} from 'firebase-admin/firestore';
import {HttpsError, onCall} from 'firebase-functions/v2/https';
import {ensureAdmin} from '../helpers/adminGuard';
import {isEnrollmentOperationallyActive} from '../helpers/status';
import {
  ROLLING_SCHEDULE_HORIZON_DAYS,
  addDaysYmd,
  buildRollingMaterializationPlan,
  buildRollingScheduledSessionPayload,
  type RollingMaterializationOccurrence,
  type RollingScheduleMaterializationState,
} from './rollingScheduleMaterializer';
import {
  FirestoreScheduleIntegrityStore,
  buildScheduleIntegrityExceptionRelationIndex,
  buildScheduleIntegrityOccurrenceSessionIndex,
  classifyScheduleIntegrityEnrollmentCandidate,
  classifyScheduleIntegrityOccurrence,
  resolveScheduleIntegrityExistingOccurrenceSession,
  type ScheduleIntegrityStore,
} from './scheduleIntegrityEngine';
import {
  materializationMatchesPlan,
  runSafeRepairPlannerWithStore,
  validateSafeMissingSessionPayload,
  type SafeRepairActionType,
  type SafeRepairEnrollmentPlan,
  type SafeRepairPlanAction,
} from './safeRepairPlanner';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const CONTROLLED_REPAIR_EXECUTOR_REGION = 'asia-south1';
export const CONTROLLED_REPAIR_CONFIRMATION =
  'EXECUTE_CONTROLLED_SCHEDULE_REPAIR';
export const CONTROLLED_REPAIR_MAX_ENROLLMENTS_PER_EXECUTION = 1;
export const CONTROLLED_REPAIR_AUTO_EXECUTION_ENABLED = false;
export const CONTROLLED_REPAIR_REQUIRES_CURRENT_DAY_ANCHOR = true;

const IST_OFFSET_MINUTES = 330;
const EXCEPTION_QUERY_CHUNK_SIZE = 30;
const EXECUTOR_ACTOR = 'system:controlled_schedule_repair_executor';

const EXCEPTION_BACK_REFERENCE_FIELDS = [
  'replacementForSessionId',
  'originalSessionId',
  'makeupForSessionId',
  'rescheduledFromSessionId',
] as const;

export type ControlledRepairActionType =
  | SafeRepairActionType
  | 'BLOCK_PAST_DUE_OCCURRENCE';

export type ControlledRepairPlanAction =
  Omit<SafeRepairPlanAction, 'type'> & {
    type: ControlledRepairActionType;
  };

export type ControlledRepairEnrollmentPlan =
  Omit<SafeRepairEnrollmentPlan, 'actions'> & {
    actions: ControlledRepairPlanAction[];
  };

export type ControlledRepairPreview = {
  mode: 'CONTROLLED_REPAIR_PREVIEW';
  writesAllowed: false;
  autoExecutionEnabled: typeof CONTROLLED_REPAIR_AUTO_EXECUTION_ENABLED;
  enrollmentId: string;
  anchorYmd: string;
  horizonEndYmd: string;
  planFingerprint: string;
  safeCreateSessions: number;
  metadataAction: ControlledRepairEnrollmentPlan['metadataAction'];
  blockers: number;
  exceptionsPreserved: number;
  plan: ControlledRepairEnrollmentPlan;
};

export type ControlledRepairExecutionResult = {
  mode: 'CONTROLLED_REPAIR_APPLY';
  enrollmentId: string;
  anchorYmd: string;
  horizonEndYmd: string;
  confirmedPlanFingerprint: string;
  transactionPlanFingerprint: string;
  sessionsCreated: number;
  createdSessionIds: string[];
  healthySessionsPreserved: number;
  exceptionsPreserved: number;
  metadataUpdated: boolean;
  metadataAction: 'NONE' | 'INITIALIZE' | 'SYNC';
  stateRevalidatedImmediatelyBeforeWrite: true;
  autoExecutionEnabled: false;
};

type ControlledRepairPreviewInput = {
  enrollmentId?: unknown;
  anchorYmd?: unknown;
};

type ControlledRepairExecuteInput = {
  enrollmentId?: unknown;
  anchorYmd?: unknown;
  confirmation?: unknown;
  expectedPlanFingerprint?: unknown;
  expectedSafeCreateSessions?: unknown;
  expectedMetadataAction?: unknown;
};

type DerivedControlledRepair = {
  plan: ControlledRepairEnrollmentPlan;
  rollingMaterialization: RollingScheduleMaterializationState | null;
  scheduleRevision: number | null;
  createOccurrences: RollingMaterializationOccurrence[];
  createPayloads: Array<{
    occurrence: RollingMaterializationOccurrence;
    payload: Record<string, unknown>;
  }>;
  healthySessionsPreserved: number;
};

const text = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const isRecordLike = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const todayInIndiaYmd = (now = new Date()): string => {
  const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

const validateYmd = (value: unknown): string => {
  const normalized = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new HttpsError('invalid-argument', 'anchorYmd must use YYYY-MM-DD.');
  }
  try {
    addDaysYmd(normalized, 0);
  } catch {
    throw new HttpsError('invalid-argument', 'anchorYmd must be a valid date.');
  }
  return normalized;
};

const normalizeEnrollmentId = (value: unknown): string => {
  const enrollmentId = text(value);
  if (!enrollmentId) {
    throw new HttpsError('invalid-argument', 'enrollmentId is required.');
  }
  return enrollmentId;
};

const normalizeExpectedCount = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} must be a non-negative integer.`,
    );
  }
  return parsed;
};

const normalizeExpectedMetadataAction = (
  value: unknown,
): ControlledRepairEnrollmentPlan['metadataAction'] => {
  const normalized = text(value).toUpperCase();
  if (
    normalized !== 'NONE' &&
    normalized !== 'INITIALIZE' &&
    normalized !== 'SYNC' &&
    normalized !== 'BLOCKED'
  ) {
    throw new HttpsError(
      'invalid-argument',
      'expectedMetadataAction must be NONE, INITIALIZE, SYNC, or BLOCKED.',
    );
  }
  return normalized;
};

const ymdTimeToUtcMs = (ymd: string, hhmm: string): number => {
  const [year, month, day] = ymd.split('-').map(Number);
  const [hour, minute] = hhmm.split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) -
    IST_OFFSET_MINUTES * 60 * 1000;
};

const isBlockingAction = (type: ControlledRepairActionType): boolean =>
  type.startsWith('BLOCK_');

const isMetadataAction = (type: ControlledRepairActionType): boolean =>
  type === 'SAFE_INITIALIZE_MATERIALIZATION' ||
  type === 'SAFE_SYNC_MATERIALIZATION';

const structuralAction = (action: ControlledRepairPlanAction) => ({
  type: action.type,
  enrollmentId: action.enrollmentId,
  sessionId: action.sessionId || null,
  date: action.date || null,
  startTime: action.startTime || null,
  durationMinutes: action.durationMinutes ?? null,
  invalidReason: action.invalidReason || null,
});

export function fingerprintControlledRepairPlan(
  plan: ControlledRepairEnrollmentPlan,
): string {
  const canonical = {
    enrollmentId: plan.enrollmentId,
    expectedOccurrences: plan.expectedOccurrences,
    safeCreates: plan.safeCreates,
    exceptionsPreserved: plan.exceptionsPreserved,
    blockers: plan.blockers,
    metadataAction: plan.metadataAction,
    actions: plan.actions
      .map(structuralAction)
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      ),
  };
  return createHash('sha256')
    .update(JSON.stringify(canonical))
    .digest('hex');
}

export function hardenSafeRepairPlanForExecution(
  plan: SafeRepairEnrollmentPlan,
  nowMs = Date.now(),
): ControlledRepairEnrollmentPlan {
  let introducedPastDueBlocker = false;
  const actions: ControlledRepairPlanAction[] = [];

  plan.actions.forEach((action) => {
    if (isMetadataAction(action.type)) return;

    if (
      action.type === 'SAFE_CREATE_MISSING_SESSION' &&
      action.date &&
      action.startTime &&
      ymdTimeToUtcMs(action.date, action.startTime) <= nowMs
    ) {
      introducedPastDueBlocker = true;
      actions.push({
        ...action,
        type: 'BLOCK_PAST_DUE_OCCURRENCE',
        reason:
          'Occurrence start time has already passed; controlled repair will not create retroactive scheduled sessions.',
      });
      return;
    }

    actions.push(action as ControlledRepairPlanAction);
  });

  const blockers = actions.filter((action) =>
    isBlockingAction(action.type),
  ).length;
  const safeCreates = actions.filter((action) =>
    action.type === 'SAFE_CREATE_MISSING_SESSION',
  ).length;
  const exceptionsPreserved = actions.filter((action) =>
    action.type === 'PRESERVE_EXCEPTION',
  ).length;

  let metadataAction: ControlledRepairEnrollmentPlan['metadataAction'] =
    introducedPastDueBlocker || blockers > 0 ? 'BLOCKED' : plan.metadataAction;

  if (metadataAction !== 'BLOCKED') {
    const originalMetadataAction = plan.actions.find((action) =>
      isMetadataAction(action.type),
    );
    if (originalMetadataAction) {
      actions.push(originalMetadataAction as ControlledRepairPlanAction);
    }
  }

  if (blockers > 0) metadataAction = 'BLOCKED';

  return {
    enrollmentId: plan.enrollmentId,
    expectedOccurrences: plan.expectedOccurrences,
    safeCreates,
    exceptionsPreserved,
    blockers,
    metadataAction,
    actions,
  };
}

class SelectedEnrollmentIntegrityStore implements ScheduleIntegrityStore {
  private readonly base: FirestoreScheduleIntegrityStore;

  constructor(
    private readonly db: admin.firestore.Firestore,
    private readonly enrollmentId: string,
  ) {
    this.base = new FirestoreScheduleIntegrityStore(db);
  }

  async listEnrollments() {
    const snap = await this.db
      .collection('enrollments')
      .doc(this.enrollmentId)
      .get();
    if (!snap.exists) return [];
    return [{
      id: snap.id,
      data: (snap.data() || {}) as Record<string, unknown>,
    }];
  }

  async getSessionsByIds(sessionIds: string[]) {
    return this.base.getSessionsByIds(sessionIds);
  }

  async listSessionsInWindow(fromYmd: string, toYmd: string) {
    const all = await this.base.listSessionsInWindow(fromYmd, toYmd);
    const selected = new Map<string, Record<string, unknown>>();
    all.forEach((session, sessionId) => {
      if (text(session.enrollmentId) === this.enrollmentId) {
        selected.set(sessionId, session);
        return;
      }
      if (
        EXCEPTION_BACK_REFERENCE_FIELDS.some((field) =>
          Boolean(text(session[field])),
        )
      ) {
        selected.set(sessionId, session);
      }
    });
    return selected;
  }
}

export async function previewControlledRepairWithStore(
  store: ScheduleIntegrityStore,
  args: {
    enrollmentId: string;
    anchorYmd: string;
    nowMs?: number;
  },
): Promise<ControlledRepairPreview> {
  const summary = await runSafeRepairPlannerWithStore(store, {
    anchorYmd: args.anchorYmd,
    maxEnrollments: CONTROLLED_REPAIR_MAX_ENROLLMENTS_PER_EXECUTION,
  });

  if (summary.operationalEnrollments !== 1 || summary.plans.length !== 1) {
    throw new HttpsError(
      'failed-precondition',
      'Selected enrollment is missing or no longer operationally active.',
    );
  }

  const sourcePlan = summary.plans[0];
  if (sourcePlan.enrollmentId !== args.enrollmentId) {
    throw new HttpsError(
      'failed-precondition',
      'Planner selection did not resolve to the requested enrollment.',
    );
  }

  const plan = hardenSafeRepairPlanForExecution(
    sourcePlan,
    args.nowMs ?? Date.now(),
  );

  return {
    mode: 'CONTROLLED_REPAIR_PREVIEW',
    writesAllowed: false,
    autoExecutionEnabled: CONTROLLED_REPAIR_AUTO_EXECUTION_ENABLED,
    enrollmentId: args.enrollmentId,
    anchorYmd: summary.anchorYmd,
    horizonEndYmd: summary.horizonEndYmd,
    planFingerprint: fingerprintControlledRepairPlan(plan),
    safeCreateSessions: plan.safeCreates,
    metadataAction: plan.metadataAction,
    blockers: plan.blockers,
    exceptionsPreserved: plan.exceptionsPreserved,
    plan,
  };
}

export async function previewControlledRepair(
  db: admin.firestore.Firestore,
  input: ControlledRepairPreviewInput,
): Promise<ControlledRepairPreview> {
  const enrollmentId = normalizeEnrollmentId(input.enrollmentId);
  const anchorYmd = validateYmd(
    input.anchorYmd || todayInIndiaYmd(),
  );
  return previewControlledRepairWithStore(
    new SelectedEnrollmentIntegrityStore(db, enrollmentId),
    {enrollmentId, anchorYmd},
  );
}

const emptyBlockedPlan = (
  enrollmentId: string,
  type: ControlledRepairActionType,
  reason: string,
): ControlledRepairEnrollmentPlan => ({
  enrollmentId,
  expectedOccurrences: 0,
  safeCreates: 0,
  exceptionsPreserved: 0,
  blockers: 1,
  metadataAction: 'BLOCKED',
  actions: [{
    type,
    enrollmentId,
    reason,
  }],
});

export function deriveControlledRepairFromCurrentState(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  anchorYmd: string;
  sessions: Map<string, Record<string, unknown>>;
  nowMs?: number;
}): DerivedControlledRepair {
  const invalidReason =
    classifyScheduleIntegrityEnrollmentCandidate(args.enrollment);
  if (invalidReason) {
    const plan = emptyBlockedPlan(
      args.enrollmentId,
      'BLOCK_INVALID_SOURCE',
      invalidReason,
    );
    plan.actions[0].invalidReason = invalidReason;
    return {
      plan,
      rollingMaterialization: null,
      scheduleRevision: null,
      createOccurrences: [],
      createPayloads: [],
      healthySessionsPreserved: 0,
    };
  }

  let rolling;
  try {
    rolling = buildRollingMaterializationPlan({
      enrollmentId: args.enrollmentId,
      enrollment: args.enrollment,
      anchorYmd: args.anchorYmd,
    });
  } catch (error) {
    return {
      plan: emptyBlockedPlan(
        args.enrollmentId,
        'BLOCK_INVALID_SOURCE',
        error instanceof Error ? error.message : String(error),
      ),
      rollingMaterialization: null,
      scheduleRevision: null,
      createOccurrences: [],
      createPayloads: [],
      healthySessionsPreserved: 0,
    };
  }

  const exceptionIndex =
    buildScheduleIntegrityExceptionRelationIndex(args.sessions);
  const occurrenceIndex =
    buildScheduleIntegrityOccurrenceSessionIndex(args.sessions);
  const actions: ControlledRepairPlanAction[] = [];
  const createOccurrences: RollingMaterializationOccurrence[] = [];
  const createPayloads: Array<{
    occurrence: RollingMaterializationOccurrence;
    payload: Record<string, unknown>;
  }> = [];
  let healthySessionsPreserved = 0;

  rolling.occurrences.forEach((occurrence) => {
    const classification = classifyScheduleIntegrityOccurrence({
      enrollmentId: args.enrollmentId,
      enrollment: args.enrollment,
      occurrence,
      scheduleRevision: rolling.scheduleRevision,
      existingSession: resolveScheduleIntegrityExistingOccurrenceSession({
        enrollmentId: args.enrollmentId,
        occurrence,
        deterministicSession: args.sessions.get(occurrence.sessionId),
        occurrenceIndex,
      }),
      relatedExceptionSessionId: exceptionIndex.get(occurrence.sessionId),
    });

    if (classification.state === 'healthy') {
      healthySessionsPreserved += 1;
      actions.push({
        type: 'NO_ACTION',
        enrollmentId: args.enrollmentId,
        sessionId: occurrence.sessionId,
        date: occurrence.date,
        startTime: occurrence.startTime,
        durationMinutes: occurrence.durationMinutes,
        reason: 'Expected occurrence is already healthy.',
      });
      return;
    }

    if (classification.state === 'schedule_exception') {
      actions.push({
        type: 'PRESERVE_EXCEPTION',
        enrollmentId: args.enrollmentId,
        sessionId: occurrence.sessionId,
        date: occurrence.date,
        startTime: occurrence.startTime,
        durationMinutes: occurrence.durationMinutes,
        reason: classification.relatedExceptionSessionId
          ? `Linked exception/replacement: ${classification.relatedExceptionSessionId}`
          : 'Existing occurrence is an intentional scheduling exception.',
      });
      return;
    }

    if (classification.state === 'missing') {
      if (occurrence.startAtUtcMs <= (args.nowMs ?? Date.now())) {
        actions.push({
          type: 'BLOCK_PAST_DUE_OCCURRENCE',
          enrollmentId: args.enrollmentId,
          sessionId: occurrence.sessionId,
          date: occurrence.date,
          startTime: occurrence.startTime,
          durationMinutes: occurrence.durationMinutes,
          reason:
            'Occurrence start time has already passed; controlled repair will not create retroactive scheduled sessions.',
        });
        return;
      }

      const payloadCheck = validateSafeMissingSessionPayload({
        enrollmentId: args.enrollmentId,
        enrollment: args.enrollment,
        occurrence,
        scheduleRevision: rolling.scheduleRevision,
      });
      if (!payloadCheck.safe) {
        actions.push({
          type: 'BLOCK_UNSAFE_SESSION_PAYLOAD',
          enrollmentId: args.enrollmentId,
          sessionId: occurrence.sessionId,
          date: occurrence.date,
          startTime: occurrence.startTime,
          durationMinutes: occurrence.durationMinutes,
          reason: payloadCheck.reason,
        });
        return;
      }

      const payload = buildRollingScheduledSessionPayload({
        enrollmentId: args.enrollmentId,
        enrollment: args.enrollment,
        occurrence,
        scheduleRevision: rolling.scheduleRevision,
        actorId: EXECUTOR_ACTOR,
      });
      createOccurrences.push(occurrence);
      createPayloads.push({occurrence, payload});
      actions.push({
        type: 'SAFE_CREATE_MISSING_SESSION',
        enrollmentId: args.enrollmentId,
        sessionId: occurrence.sessionId,
        date: occurrence.date,
        startTime: occurrence.startTime,
        durationMinutes: occurrence.durationMinutes,
        reason:
          'Occurrence is still missing, future-dated, unexceptioned, and payload preflight succeeds.',
      });
      return;
    }

    const type: ControlledRepairActionType =
      classification.state === 'identity_mismatch'
        ? 'BLOCK_IDENTITY_CONFLICT'
        : classification.state === 'schedule_mismatch'
          ? 'BLOCK_SCHEDULE_CONFLICT'
          : 'BLOCK_STALE_REVISION';
    actions.push({
      type,
      enrollmentId: args.enrollmentId,
      sessionId: occurrence.sessionId,
      date: occurrence.date,
      startTime: occurrence.startTime,
      durationMinutes: occurrence.durationMinutes,
      reason:
        classification.state === 'identity_mismatch'
          ? 'Existing session identity conflicts with enrollment identity.'
          : classification.state === 'schedule_mismatch'
            ? 'Existing session date/time/duration conflicts with expected recurrence.'
            : 'Existing session belongs to a different schedule revision.',
    });
  });

  const blockers = actions.filter((action) =>
    isBlockingAction(action.type),
  ).length;
  const safeCreates = actions.filter((action) =>
    action.type === 'SAFE_CREATE_MISSING_SESSION',
  ).length;
  const exceptionsPreserved = actions.filter((action) =>
    action.type === 'PRESERVE_EXCEPTION',
  ).length;

  let metadataAction: ControlledRepairEnrollmentPlan['metadataAction'] = 'NONE';
  if (blockers > 0) {
    metadataAction = 'BLOCKED';
  } else if (!isRecordLike(args.enrollment.scheduleMaterialization)) {
    metadataAction = 'INITIALIZE';
    actions.push({
      type: 'SAFE_INITIALIZE_MATERIALIZATION',
      enrollmentId: args.enrollmentId,
      reason:
        'Valid operational enrollment has no scheduleMaterialization metadata.',
    });
  } else if (
    !materializationMatchesPlan(
      args.enrollment.scheduleMaterialization,
      rolling.materialization,
    )
  ) {
    metadataAction = 'SYNC';
    actions.push({
      type: 'SAFE_SYNC_MATERIALIZATION',
      enrollmentId: args.enrollmentId,
      reason:
        'Existing materialization metadata differs from deterministic current plan.',
    });
  }

  return {
    plan: {
      enrollmentId: args.enrollmentId,
      expectedOccurrences: rolling.occurrences.length,
      safeCreates,
      exceptionsPreserved,
      blockers,
      metadataAction,
      actions,
    },
    rollingMaterialization: rolling.materialization,
    scheduleRevision: rolling.scheduleRevision,
    createOccurrences,
    createPayloads,
    healthySessionsPreserved,
  };
}

const chunk = <T>(values: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
};

async function readTransactionSessions(
  tx: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  enrollmentId: string,
  occurrences: RollingMaterializationOccurrence[],
): Promise<Map<string, Record<string, unknown>>> {
  const sessions = new Map<string, Record<string, unknown>>();

  for (const occurrence of occurrences) {
    const snap = await tx.get(
      db.collection('classSessions').doc(occurrence.sessionId),
    );
    if (snap.exists) {
      sessions.set(
        snap.id,
        (snap.data() || {}) as Record<string, unknown>,
      );
    }
  }

  const linkedSnap = await tx.get(
    db.collection('classSessions').where('enrollmentId', '==', enrollmentId),
  );
  linkedSnap.docs.forEach((snap) => {
    sessions.set(
      snap.id,
      (snap.data() || {}) as Record<string, unknown>,
    );
  });

  const expectedIds = occurrences.map((occurrence) => occurrence.sessionId);
  for (const field of EXCEPTION_BACK_REFERENCE_FIELDS) {
    for (const idChunk of chunk(expectedIds, EXCEPTION_QUERY_CHUNK_SIZE)) {
      if (!idChunk.length) continue;
      const exceptionSnap = await tx.get(
        db.collection('classSessions').where(field, 'in', idChunk),
      );
      exceptionSnap.docs.forEach((snap) => {
        sessions.set(
          snap.id,
          (snap.data() || {}) as Record<string, unknown>,
        );
      });
    }
  }

  return sessions;
}

const buildMaterializationPatch = (
  materialization: RollingScheduleMaterializationState,
) => ({
  'scheduleMaterialization.schemaVersion': materialization.schemaVersion,
  'scheduleMaterialization.horizonDays': materialization.horizonDays,
  'scheduleMaterialization.scheduleRevision': materialization.scheduleRevision,
  'scheduleMaterialization.materializedThroughYmd':
    materialization.materializedThroughYmd,
  'scheduleMaterialization.nextOccurrenceYmd':
    materialization.nextOccurrenceYmd,
  'scheduleMaterialization.nextMaterializationDueYmd':
    materialization.nextMaterializationDueYmd,
  'scheduleMaterialization.updatedAt': FieldValue.serverTimestamp(),
  'scheduleMaterialization.updatedBy': EXECUTOR_ACTOR,
  updatedAt: FieldValue.serverTimestamp(),
  updatedBy: EXECUTOR_ACTOR,
});

async function applyControlledRepairTransaction(
  db: admin.firestore.Firestore,
  args: {
    enrollmentId: string;
    anchorYmd: string;
    expectedPlanFingerprint: string;
  },
): Promise<ControlledRepairExecutionResult> {
  return db.runTransaction(async (tx) => {
    const enrollmentRef = db
      .collection('enrollments')
      .doc(args.enrollmentId);
    const enrollmentSnap = await tx.get(enrollmentRef);
    if (!enrollmentSnap.exists) {
      throw new HttpsError(
        'aborted',
        'Enrollment disappeared before controlled repair.',
      );
    }

    const enrollment =
      (enrollmentSnap.data() || {}) as Record<string, unknown>;
    if (!isEnrollmentOperationallyActive(enrollment)) {
      throw new HttpsError(
        'aborted',
        'Enrollment is no longer operationally active.',
      );
    }

    const rolling = buildRollingMaterializationPlan({
      enrollmentId: args.enrollmentId,
      enrollment,
      anchorYmd: args.anchorYmd,
    });

    const sessions = await readTransactionSessions(
      tx,
      db,
      args.enrollmentId,
      rolling.occurrences,
    );

    const derived = deriveControlledRepairFromCurrentState({
      enrollmentId: args.enrollmentId,
      enrollment,
      anchorYmd: args.anchorYmd,
      sessions,
      nowMs: Date.now(),
    });
    const transactionPlanFingerprint =
      fingerprintControlledRepairPlan(derived.plan);

    if (
      transactionPlanFingerprint !== args.expectedPlanFingerprint
    ) {
      throw new HttpsError(
        'aborted',
        'Repair state changed during final transaction revalidation; no writes were applied.',
      );
    }
    if (derived.plan.blockers > 0) {
      throw new HttpsError(
        'failed-precondition',
        'Final transaction revalidation contains blockers; no writes were applied.',
      );
    }
    if (!derived.rollingMaterialization) {
      throw new HttpsError(
        'failed-precondition',
        'Final transaction revalidation could not build materialization metadata.',
      );
    }

    // Every payload was constructed above before the first write.
    derived.createPayloads.forEach(({occurrence, payload}) => {
      tx.create(
        db.collection('classSessions').doc(occurrence.sessionId),
        payload,
      );
    });

    const metadataAction = derived.plan.metadataAction;
    const metadataUpdated =
      metadataAction === 'INITIALIZE' || metadataAction === 'SYNC';
    if (metadataUpdated) {
      tx.update(
        enrollmentRef,
        buildMaterializationPatch(derived.rollingMaterialization),
      );
    }

    return {
      mode: 'CONTROLLED_REPAIR_APPLY',
      enrollmentId: args.enrollmentId,
      anchorYmd: args.anchorYmd,
      horizonEndYmd: addDaysYmd(
        args.anchorYmd,
        ROLLING_SCHEDULE_HORIZON_DAYS,
      ),
      confirmedPlanFingerprint: args.expectedPlanFingerprint,
      transactionPlanFingerprint,
      sessionsCreated: derived.createPayloads.length,
      createdSessionIds: derived.createPayloads.map(
        ({occurrence}) => occurrence.sessionId,
      ),
      healthySessionsPreserved: derived.healthySessionsPreserved,
      exceptionsPreserved: derived.plan.exceptionsPreserved,
      metadataUpdated,
      metadataAction:
        metadataAction === 'BLOCKED'
          ? 'NONE'
          : metadataAction,
      stateRevalidatedImmediatelyBeforeWrite: true,
      autoExecutionEnabled: false,
    };
  });
}

export async function executeControlledRepair(
  db: admin.firestore.Firestore,
  input: ControlledRepairExecuteInput,
): Promise<ControlledRepairExecutionResult> {
  if (text(input.confirmation) !== CONTROLLED_REPAIR_CONFIRMATION) {
    throw new HttpsError(
      'failed-precondition',
      `confirmation must equal ${CONTROLLED_REPAIR_CONFIRMATION}.`,
    );
  }

  const enrollmentId = normalizeEnrollmentId(input.enrollmentId);
  const anchorYmd = validateYmd(input.anchorYmd);
  const currentYmd = todayInIndiaYmd();
  if (
    CONTROLLED_REPAIR_REQUIRES_CURRENT_DAY_ANCHOR &&
    anchorYmd !== currentYmd
  ) {
    throw new HttpsError(
      'failed-precondition',
      `Apply requires anchorYmd=${currentYmd}; run a fresh preview for today.`,
    );
  }

  const expectedPlanFingerprint = text(input.expectedPlanFingerprint);
  if (!/^[a-f0-9]{64}$/.test(expectedPlanFingerprint)) {
    throw new HttpsError(
      'invalid-argument',
      'expectedPlanFingerprint must be the SHA-256 fingerprint from a fresh controlled preview.',
    );
  }

  const expectedSafeCreateSessions = normalizeExpectedCount(
    input.expectedSafeCreateSessions,
    'expectedSafeCreateSessions',
  );
  const expectedMetadataAction =
    normalizeExpectedMetadataAction(input.expectedMetadataAction);

  const preview = await previewControlledRepair(
    db,
    {enrollmentId, anchorYmd},
  );

  if (preview.blockers > 0) {
    throw new HttpsError(
      'failed-precondition',
      `Controlled preview contains ${preview.blockers} blocker(s); repair is not allowed.`,
    );
  }
  if (
    preview.safeCreateSessions === 0 &&
    preview.metadataAction === 'NONE'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Controlled preview has no actionable repair.',
    );
  }
  if (preview.planFingerprint !== expectedPlanFingerprint) {
    throw new HttpsError(
      'aborted',
      'Repair plan fingerprint changed; run preview again before apply.',
    );
  }
  if (preview.safeCreateSessions !== expectedSafeCreateSessions) {
    throw new HttpsError(
      'aborted',
      `Safe-create count changed from ${expectedSafeCreateSessions} to ${preview.safeCreateSessions}; run preview again.`,
    );
  }
  if (preview.metadataAction !== expectedMetadataAction) {
    throw new HttpsError(
      'aborted',
      `Metadata action changed from ${expectedMetadataAction} to ${preview.metadataAction}; run preview again.`,
    );
  }

  // Fresh read-only revalidation immediately before opening the write transaction.
  const immediatePreview = await previewControlledRepair(
    db,
    {enrollmentId, anchorYmd},
  );
  if (
    immediatePreview.planFingerprint !== expectedPlanFingerprint ||
    immediatePreview.blockers > 0
  ) {
    throw new HttpsError(
      'aborted',
      'Repair state changed during immediate pre-write revalidation; no writes were attempted.',
    );
  }

  const result = await applyControlledRepairTransaction(
    db,
    {
      enrollmentId,
      anchorYmd,
      expectedPlanFingerprint,
    },
  );

  logger.warn('controlledRepairExecutor: manual repair applied', {
    enrollmentId,
    anchorYmd,
    planFingerprint: expectedPlanFingerprint,
    sessionsCreated: result.sessionsCreated,
    metadataUpdated: result.metadataUpdated,
    metadataAction: result.metadataAction,
    stateRevalidatedImmediatelyBeforeWrite:
      result.stateRevalidatedImmediatelyBeforeWrite,
    autoExecutionEnabled: CONTROLLED_REPAIR_AUTO_EXECUTION_ENABLED,
  });

  return result;
}

export const adminPreviewControlledScheduleRepair = onCall(
  {
    region: CONTROLLED_REPAIR_EXECUTOR_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (request) => {
    await ensureAdmin(request.auth);
    return previewControlledRepair(
      admin.firestore(),
      (request.data || {}) as ControlledRepairPreviewInput,
    );
  },
);

export const adminExecuteControlledScheduleRepair = onCall(
  {
    region: CONTROLLED_REPAIR_EXECUTOR_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (request) => {
    await ensureAdmin(request.auth);
    return executeControlledRepair(
      admin.firestore(),
      (request.data || {}) as ControlledRepairExecuteInput,
    );
  },
);
