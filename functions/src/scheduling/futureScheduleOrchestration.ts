import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {FieldPath, FieldValue} from 'firebase-admin/firestore';
import {onDocumentWritten} from 'firebase-functions/v2/firestore';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {
  executeFutureScheduleReconciliation,
  FutureScheduleExecutionError,
  prepareFutureScheduleExecution,
  type FutureScheduleExecutorStore,
} from './futureScheduleExecutor';
import {createFutureScheduleFirestoreStore} from './futureScheduleFirestore';
import {isCanonicalFutureScheduleEnrollment} from './futureScheduleReconciler';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const FUTURE_SCHEDULE_RECONCILER_REGION = 'asia-south1';
export const FUTURE_SCHEDULE_RECONCILER_TIME_ZONE = 'Asia/Kolkata';
export const FUTURE_SCHEDULE_RECONCILER_SWEEP_SCHEDULE = '17 */2 * * *';
export const MAX_FUTURE_SCHEDULE_SWEEP_ENROLLMENTS = 500;
export const FUTURE_SCHEDULE_SWEEP_CONCURRENCY = 6;
export const MAX_FUTURE_SCHEDULE_STALE_RETRIES = 2;
export const FUTURE_SCHEDULE_WRITES_ENV = 'FUTURE_SCHEDULE_RECONCILER_WRITES_ENABLED';

const SWEEP_STATE_COLLECTION = 'futureScheduleReconcilerState';
const SWEEP_STATE_DOCUMENT = 'periodicSweep';
const AUTOMATION_ACTOR = 'system:future_schedule_reconciler';

export type FutureScheduleAutomaticOutcome = {
  enrollmentId: string;
  status:
    | 'applied'
    | 'noop'
    | 'blocked_source'
    | 'blocked_plan'
    | 'skipped_non_operational'
    | 'shadow';
  attempts: number;
  actions: number;
  planFingerprint: string;
  blockers: string[];
};

export type FutureScheduleSweepSummary = {
  enrollmentIdsRead: number;
  applied: number;
  noop: number;
  blockedSource: number;
  blockedPlan: number;
  skippedNonOperational: number;
  shadow: number;
  failed: number;
  failedEnrollmentIds: string[];
  cursorBefore: string | null;
  cursorAfter: string | null;
  cycleCompleted: boolean;
};

export function futureScheduleWritesEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return String(env[FUTURE_SCHEDULE_WRITES_ENV] || '').trim().toLowerCase() === 'true';
}

const text = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => text(entry)).filter(Boolean))).sort();
};

const stableComparable = (value: unknown): unknown => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stableComparable);
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.toDate === 'function') {
      try {
        const date = (record.toDate as () => Date)();
        if (date instanceof Date && !Number.isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        // Fall through to stable object normalization.
      }
    }
    const normalized: Record<string, unknown> = {};
    Object.keys(record).sort().forEach((key) => {
      if (typeof record[key] === 'function') return;
      normalized[key] = stableComparable(record[key]);
    });
    return normalized;
  }
  return value;
};

export function futureScheduleEnrollmentComparable(
  enrollment: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!enrollment) return null;

  const financialFields = [
    'ratePerSession',
    'feePerSession',
    'feePerClass',
    'parentRate',
    'parentClassRate',
    'classFee',
    'feeAmount',
    'teacherPayPerSession',
    'teacherRatePerSession',
    'teacherPay',
    'teacherRate',
    'teacherFee',
    'teacherClassRate',
    'rateTeacher',
    'payoutRate',
    'currency',
  ] as const;

  const financials: Record<string, unknown> = {};
  financialFields.forEach((field) => {
    financials[field] = enrollment[field] ?? null;
  });

  return stableComparable({
    status: text(enrollment.status).toLowerCase(),
    archived: enrollment.archived === true,
    isArchived: enrollment.isArchived === true,
    archivedAt: enrollment.archivedAt ?? null,
    kidId: text(enrollment.kidId),
    kidIds: stringList(enrollment.kidIds),
    studentId: text(enrollment.studentId),
    childId: text(enrollment.childId),
    parentId: text(enrollment.parentId),
    parentIds: stringList(enrollment.parentIds),
    teacherId: text(enrollment.teacherId),
    teacherIds: stringList(enrollment.teacherIds),
    assignedTeacherId: text(enrollment.assignedTeacherId),
    primaryTeacherId: text(enrollment.primaryTeacherId),
    teacherUid: text(enrollment.teacherUid),
    teacher_id: text(enrollment.teacher_id),
    courseId: text(enrollment.courseId),
    classesStartDateYmd: enrollment.classesStartDateYmd ?? null,
    classesStartDate: enrollment.classesStartDate ?? null,
    startDateYmd: enrollment.startDateYmd ?? null,
    startDate: enrollment.startDate ?? null,
    schedule: enrollment.schedule ?? null,
    joinUrl: text(enrollment.joinUrl),
    financials,
  }) as Record<string, unknown>;
}

export function shouldReconcileFutureScheduleEnrollmentWrite(args: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): boolean {
  if (!args.after) return false;

  const beforeWasCanonical = args.before
    ? isCanonicalFutureScheduleEnrollment(args.before)
    : false;
  const afterIsCanonical = isCanonicalFutureScheduleEnrollment(args.after);

  // Brick 5 owns canonical rolling enrollments only. A transition away from the
  // canonical contract still triggers once so the source defect is surfaced;
  // unrelated legacy enrollment writes stay on their existing compatibility path.
  if (!beforeWasCanonical && !afterIsCanonical) return false;
  if (!args.before) return true;

  return JSON.stringify(futureScheduleEnrollmentComparable(args.before)) !==
    JSON.stringify(futureScheduleEnrollmentComparable(args.after));
}

const blockerReasons = (
  blockers: Array<{reasons: string[]}>,
): string[] => Array.from(
  new Set(blockers.flatMap((blocker) => blocker.reasons)),
).sort();

const isLifecycleOnlyBlocked = (
  issues: string[],
): boolean =>
  issues.length > 0 &&
  issues.every((issue) => issue === 'archived' || issue === 'non_operational_status');

export async function reconcileFutureScheduleEnrollmentAutomatically(
  store: FutureScheduleExecutorStore,
  enrollmentId: string,
  options: {
    actorId?: string;
    staleRetries?: number;
    writesEnabled?: boolean;
  } = {},
): Promise<FutureScheduleAutomaticOutcome> {
  const id = text(enrollmentId);
  if (!id) throw new Error('enrollmentId is required');

  const actorId = text(options.actorId) || AUTOMATION_ACTOR;
  const staleRetries = Number.isInteger(options.staleRetries)
    ? Math.max(0, Number(options.staleRetries))
    : MAX_FUTURE_SCHEDULE_STALE_RETRIES;
  const writesEnabled = options.writesEnabled !== false;

  for (let attempt = 1; attempt <= staleRetries + 1; attempt += 1) {
    const preview = await prepareFutureScheduleExecution(store, {
      enrollmentId: id,
    });

    const sourceIssues = preview.inspection.kind === 'blocked_source'
      ? preview.inspection.assessment.issues
      : [];
    const previewBlockers = Array.from(new Set([
      ...blockerReasons(preview.plan.blockers),
      ...preview.executorBlockers,
    ])).sort();

    if (!writesEnabled) {
      if (preview.inspection.kind === 'blocked_source') {
        return {
          enrollmentId: id,
          status: isLifecycleOnlyBlocked(sourceIssues)
            ? 'skipped_non_operational'
            : 'blocked_source',
          attempts: attempt,
          actions: 0,
          planFingerprint: preview.plan.planFingerprint,
          blockers: sourceIssues.map((issue) => `source:${issue}`).sort(),
        };
      }
      if (previewBlockers.length > 0) {
        return {
          enrollmentId: id,
          status: 'blocked_plan',
          attempts: attempt,
          actions: 0,
          planFingerprint: preview.plan.planFingerprint,
          blockers: previewBlockers,
        };
      }
      return {
        enrollmentId: id,
        status: 'shadow',
        attempts: attempt,
        actions: preview.plan.actions.length,
        planFingerprint: preview.plan.planFingerprint,
        blockers: [],
      };
    }

    // Every automatic decision, including no-op and blocked outcomes, is
    // transactionally re-read by Brick 4. This turns a concurrent source/session
    // change into STALE_APPROVAL instead of accepting a stale decision.
    try {
      const result = await executeFutureScheduleReconciliation(store, {
        enrollmentId: id,
        expectedApprovalFingerprint: preview.approvalFingerprint,
        actorId,
      });
      return {
        enrollmentId: id,
        status: result.status,
        attempts: attempt,
        actions: result.appliedActions,
        planFingerprint: result.planFingerprint,
        blockers: [],
      };
    } catch (error) {
      if (
        error instanceof FutureScheduleExecutionError &&
        error.code === 'STALE_APPROVAL' &&
        attempt <= staleRetries
      ) {
        continue;
      }

      if (
        error instanceof FutureScheduleExecutionError &&
        error.code === 'SOURCE_BLOCKED' &&
        preview.inspection.kind === 'blocked_source'
      ) {
        return {
          enrollmentId: id,
          status: isLifecycleOnlyBlocked(sourceIssues)
            ? 'skipped_non_operational'
            : 'blocked_source',
          attempts: attempt,
          actions: 0,
          planFingerprint: preview.plan.planFingerprint,
          blockers: sourceIssues.map((issue) => `source:${issue}`).sort(),
        };
      }

      if (
        error instanceof FutureScheduleExecutionError &&
        error.code === 'PLAN_BLOCKED' &&
        preview.inspection.kind === 'inspected'
      ) {
        return {
          enrollmentId: id,
          status: 'blocked_plan',
          attempts: attempt,
          actions: 0,
          planFingerprint: preview.plan.planFingerprint,
          blockers: previewBlockers,
        };
      }

      throw error;
    }
  }

  throw new Error('Future schedule stale retry loop exited unexpectedly');
}

async function mapWithConcurrency<T>(
  values: string[],
  concurrency: number,
  worker: (value: string) => Promise<T>,
): Promise<Array<{id: string; value?: T; error?: unknown}>> {
  const results: Array<{id: string; value?: T; error?: unknown}> =
    new Array(values.length);
  let nextIndex = 0;

  const runner = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= values.length) return;
      const id = values[index];
      try {
        results[index] = {id, value: await worker(id)};
      } catch (error) {
        results[index] = {id, error};
      }
    }
  };

  await Promise.all(
    Array.from(
      {length: Math.min(Math.max(concurrency, 1), Math.max(values.length, 1))},
      () => runner(),
    ),
  );
  return results;
}

export async function runFutureScheduleSweepBatch(args: {
  enrollmentIds: string[];
  reconcile: (enrollmentId: string) => Promise<FutureScheduleAutomaticOutcome>;
  concurrency?: number;
}): Promise<Omit<FutureScheduleSweepSummary, 'cursorBefore' | 'cursorAfter' | 'cycleCompleted'>> {
  const ids = Array.from(new Set(args.enrollmentIds.map((id) => text(id)).filter(Boolean)));
  const results = await mapWithConcurrency(
    ids,
    args.concurrency ?? FUTURE_SCHEDULE_SWEEP_CONCURRENCY,
    args.reconcile,
  );

  const summary = {
    enrollmentIdsRead: ids.length,
    applied: 0,
    noop: 0,
    blockedSource: 0,
    blockedPlan: 0,
    skippedNonOperational: 0,
    shadow: 0,
    failed: 0,
    failedEnrollmentIds: [] as string[],
  };

  results.forEach((row) => {
    if (row.error || !row.value) {
      summary.failed += 1;
      summary.failedEnrollmentIds.push(row.id);
      return;
    }
    switch (row.value.status) {
      case 'applied':
        summary.applied += 1;
        break;
      case 'noop':
        summary.noop += 1;
        break;
      case 'blocked_source':
        summary.blockedSource += 1;
        break;
      case 'blocked_plan':
        summary.blockedPlan += 1;
        break;
      case 'skipped_non_operational':
        summary.skippedNonOperational += 1;
        break;
      case 'shadow':
        summary.shadow += 1;
        break;
    }
  });

  summary.failedEnrollmentIds.sort();
  return summary;
}

export async function runFutureSchedulePeriodicSweep(
  db: admin.firestore.Firestore,
  options: {writesEnabled?: boolean} = {},
): Promise<FutureScheduleSweepSummary> {
  const stateRef = db.collection(SWEEP_STATE_COLLECTION).doc(SWEEP_STATE_DOCUMENT);
  const stateSnap = await stateRef.get();
  const cursorBefore = stateSnap.exists
    ? text((stateSnap.data() || {}).cursorEnrollmentId) || null
    : null;

  const buildQuery = (cursor: string | null) => {
    let query: admin.firestore.Query = db
      .collection('enrollments')
      .orderBy(FieldPath.documentId())
      .limit(MAX_FUTURE_SCHEDULE_SWEEP_ENROLLMENTS);
    if (cursor) query = query.startAfter(cursor);
    return query;
  };

  let snapshot = await buildQuery(cursorBefore).get();
  let effectiveCursorBefore = cursorBefore;

  // If a prior run ended exactly on the final page, the next run observes an
  // empty tail. Wrap immediately so that this scheduled invocation still does
  // useful work instead of burning a two-hour cycle.
  if (snapshot.empty && cursorBefore) {
    effectiveCursorBefore = null;
    snapshot = await buildQuery(null).get();
  }

  // Inspect every bounded enrollment row. Canonical rows may reconcile; active
  // non-canonical rows are surfaced as blocked_source instead of disappearing.
  const enrollmentIds = snapshot.docs.map((doc) => doc.id);
  const store = createFutureScheduleFirestoreStore(db);
  const batch = await runFutureScheduleSweepBatch({
    enrollmentIds,
    concurrency: FUTURE_SCHEDULE_SWEEP_CONCURRENCY,
    reconcile: (enrollmentId) =>
      reconcileFutureScheduleEnrollmentAutomatically(store, enrollmentId, {
        actorId: AUTOMATION_ACTOR,
        writesEnabled: options.writesEnabled !== false,
      }),
  });

  const cycleCompleted =
    snapshot.size < MAX_FUTURE_SCHEDULE_SWEEP_ENROLLMENTS;
  const cursorAfter =
    cycleCompleted || snapshot.empty
      ? null
      : snapshot.docs[snapshot.docs.length - 1].id;

  await stateRef.set(
    {
      cursorEnrollmentId: cursorAfter,
      lastBatchStartedAfter: effectiveCursorBefore,
      lastBatchSize: snapshot.size,
      lastApplied: batch.applied,
      lastNoop: batch.noop,
      lastBlockedSource: batch.blockedSource,
      lastBlockedPlan: batch.blockedPlan,
      lastSkippedNonOperational: batch.skippedNonOperational,
      lastShadow: batch.shadow,
      lastFailed: batch.failed,
      lastFailedEnrollmentIds: batch.failedEnrollmentIds.slice(0, 100),
      lastCycleCompleted: cycleCompleted,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true},
  );

  return {
    ...batch,
    cursorBefore: effectiveCursorBefore,
    cursorAfter,
    cycleCompleted,
  };
}

export const onFutureScheduleEnrollmentWrite = onDocumentWritten(
  {
    document: 'enrollments/{enrollmentId}',
    region: FUTURE_SCHEDULE_RECONCILER_REGION,
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async (event) => {
    const before = event.data?.before.exists
      ? ((event.data.before.data() || {}) as Record<string, unknown>)
      : null;
    const after = event.data?.after.exists
      ? ((event.data.after.data() || {}) as Record<string, unknown>)
      : null;

    if (!shouldReconcileFutureScheduleEnrollmentWrite({before, after})) return;

    const enrollmentId = event.params.enrollmentId;
    const store = createFutureScheduleFirestoreStore(admin.firestore());
    const writesEnabled = futureScheduleWritesEnabled();

    try {
      const outcome = await reconcileFutureScheduleEnrollmentAutomatically(
        store,
        enrollmentId,
        {actorId: AUTOMATION_ACTOR, writesEnabled},
      );

      const payload = {
        enrollmentId,
        status: outcome.status,
        attempts: outcome.attempts,
        actions: outcome.actions,
        blockers: outcome.blockers,
        writesEnabled,
      };

      if (
        outcome.status === 'blocked_source' ||
        outcome.status === 'blocked_plan'
      ) {
        logger.warn('futureScheduleReconciler: enrollment write blocked safely', payload);
      } else {
        logger.info('futureScheduleReconciler: enrollment write reconciled', payload);
      }
    } catch (error) {
      logger.error('futureScheduleReconciler: enrollment write failed', {
        enrollmentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
);

export const futureScheduleReconcilerEveryTwoHours = onSchedule(
  {
    schedule: FUTURE_SCHEDULE_RECONCILER_SWEEP_SCHEDULE,
    timeZone: FUTURE_SCHEDULE_RECONCILER_TIME_ZONE,
    region: FUTURE_SCHEDULE_RECONCILER_REGION,
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const summary = await runFutureSchedulePeriodicSweep(admin.firestore());
    const payload = {
      ...summary,
      schedule: FUTURE_SCHEDULE_RECONCILER_SWEEP_SCHEDULE,
      timeZone: FUTURE_SCHEDULE_RECONCILER_TIME_ZONE,
      writesEnabled,
    };

    if (
      summary.failed > 0 ||
      summary.blockedSource > 0 ||
      summary.blockedPlan > 0
    ) {
      logger.warn('futureScheduleReconciler: periodic sweep completed with blocked/failed enrollments', payload);
      return;
    }
    logger.info('futureScheduleReconciler: periodic sweep completed', payload);
  },
);
