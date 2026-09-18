/**
 * Brick 4: read-only Safe Repair Planner.
 *
 * Converts Brick 2 integrity evidence into deterministic repair instructions.
 * It never writes Firestore and never auto-approves conflicts or invalid source data.
 */
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {HttpsError, onCall} from 'firebase-functions/v2/https';
import {ensureAdmin} from '../helpers/adminGuard';
import {isEnrollmentOperationallyActive} from '../helpers/status';
import {
  addDaysYmd,
  buildRollingMaterializationPlan,
  buildRollingScheduledSessionPayload,
  type RollingMaterializationOccurrence,
  type RollingScheduleMaterializationState,
  ROLLING_SCHEDULE_HORIZON_DAYS,
} from './rollingScheduleMaterializer';
import {
  FirestoreScheduleIntegrityStore,
  MAX_SCHEDULE_INTEGRITY_ENROLLMENTS,
  buildScheduleIntegrityExceptionRelationIndex,
  buildScheduleIntegrityOccurrenceSessionIndex,
  classifyScheduleIntegrityEnrollmentCandidate,
  detectScheduleIntegritySurplusSessions,
  classifyScheduleIntegrityOccurrence,
  loadScheduleIntegritySessionEvidence,
  resolveScheduleIntegrityExistingOccurrenceSession,
  type ScheduleIntegrityInvalidReason,
  type ScheduleIntegrityStore,
} from './scheduleIntegrityEngine';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const SAFE_REPAIR_PLANNER_REGION = 'asia-south1';
export const SAFE_REPAIR_PLANNER_MAX_ENROLLMENTS =
  MAX_SCHEDULE_INTEGRITY_ENROLLMENTS;
export const SAFE_REPAIR_PLANNER_MAX_DETAIL_ROWS = 300;
export const SAFE_REPAIR_PLANNER_WRITES_ALLOWED = false;
export const SAFE_REPAIR_PLANNER_AUTO_REPAIR_ENABLED = false;

const IST_OFFSET_MINUTES = 330;
const REPAIR_PLANNER_ACTOR = 'system:schedule_safe_repair_planner';

export type SafeRepairActionType =
  | 'SAFE_CREATE_MISSING_SESSION'
  | 'SAFE_INITIALIZE_MATERIALIZATION'
  | 'SAFE_SYNC_MATERIALIZATION'
  | 'PRESERVE_EXCEPTION'
  | 'NO_ACTION'
  | 'BLOCK_INVALID_SOURCE'
  | 'BLOCK_IDENTITY_CONFLICT'
  | 'BLOCK_SCHEDULE_CONFLICT'
  | 'BLOCK_DUPLICATE_REGULAR_SESSION'
  | 'BLOCK_UNEXPECTED_REGULAR_SESSION'
  | 'PRESERVE_STALE_REVISION_SESSION'
  | 'BLOCK_UNSAFE_SESSION_PAYLOAD';

export type SafeRepairPlanAction = {
  type: SafeRepairActionType;
  enrollmentId: string;
  sessionId?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  reason?: string;
  invalidReason?: ScheduleIntegrityInvalidReason;
};

export type SafeRepairEnrollmentPlan = {
  enrollmentId: string;
  expectedOccurrences: number;
  safeCreates: number;
  exceptionsPreserved: number;
  blockers: number;
  metadataAction:
    | 'NONE'
    | 'INITIALIZE'
    | 'SYNC'
    | 'BLOCKED';
  actions: SafeRepairPlanAction[];
};

export type SafeRepairPlannerSummary = {
  mode: 'READ_ONLY_REPAIR_PLAN';
  writesAllowed: typeof SAFE_REPAIR_PLANNER_WRITES_ALLOWED;
  autoRepairEnabled: typeof SAFE_REPAIR_PLANNER_AUTO_REPAIR_ENABLED;
  anchorYmd: string;
  horizonEndYmd: string;
  horizonDays: typeof ROLLING_SCHEDULE_HORIZON_DAYS;
  operationalEnrollments: number;
  eligibleEnrollments: number;
  invalidEnrollments: number;
  expectedOccurrences: number;
  safeCreateSessions: number;
  exceptionsPreserved: number;
  noActionOccurrences: number;
  blockedOccurrences: number;
  metadataInitializations: number;
  metadataSynchronizations: number;
  blockedEnrollments: number;
  actionableEnrollments: number;
  invalidByReason: Record<ScheduleIntegrityInvalidReason, number>;
  actionCounts: Record<SafeRepairActionType, number>;
  plans: SafeRepairEnrollmentPlan[];
};

const text = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const todayInIndiaYmd = (now = new Date()): string => {
  const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

const validateYmd = (value: string): string => {
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

const normalizeMaxEnrollments = (value: unknown): number => {
  const parsed = Number(value ?? SAFE_REPAIR_PLANNER_MAX_ENROLLMENTS);
  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > SAFE_REPAIR_PLANNER_MAX_ENROLLMENTS
  ) {
    throw new HttpsError(
      'invalid-argument',
      `maxEnrollments must be between 1 and ${SAFE_REPAIR_PLANNER_MAX_ENROLLMENTS}.`,
    );
  }
  return parsed;
};

const emptyInvalidCounts = (): Record<ScheduleIntegrityInvalidReason, number> => ({
  invalid_schedule: 0,
  missing_teacher: 0,
  ambiguous_teacher: 0,
  missing_child_identity: 0,
});

const emptyActionCounts = (): Record<SafeRepairActionType, number> => ({
  SAFE_CREATE_MISSING_SESSION: 0,
  SAFE_INITIALIZE_MATERIALIZATION: 0,
  SAFE_SYNC_MATERIALIZATION: 0,
  PRESERVE_EXCEPTION: 0,
  NO_ACTION: 0,
  BLOCK_INVALID_SOURCE: 0,
  BLOCK_IDENTITY_CONFLICT: 0,
  BLOCK_SCHEDULE_CONFLICT: 0,
  BLOCK_DUPLICATE_REGULAR_SESSION: 0,
  BLOCK_UNEXPECTED_REGULAR_SESSION: 0,
  PRESERVE_STALE_REVISION_SESSION: 0,
  BLOCK_UNSAFE_SESSION_PAYLOAD: 0,
});

const isRecordLike = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeNullableText = (value: unknown): string | null => {
  const normalized = text(value);
  return normalized || null;
};

export function materializationMatchesPlan(
  existing: unknown,
  expected: RollingScheduleMaterializationState,
): boolean {
  if (!isRecordLike(existing)) return false;
  return (
    Number(existing.schemaVersion) === expected.schemaVersion &&
    Number(existing.horizonDays) === expected.horizonDays &&
    Number(existing.scheduleRevision) === expected.scheduleRevision &&
    text(existing.materializedThroughYmd) === expected.materializedThroughYmd &&
    normalizeNullableText(existing.nextOccurrenceYmd) === expected.nextOccurrenceYmd &&
    normalizeNullableText(existing.nextMaterializationDueYmd) ===
      expected.nextMaterializationDueYmd
  );
}

const actionForOccurrenceBlocker = (
  state: 'identity_mismatch' | 'schedule_mismatch',
): SafeRepairActionType => {
  if (state === 'identity_mismatch') return 'BLOCK_IDENTITY_CONFLICT';
  return 'BLOCK_SCHEDULE_CONFLICT';
};

const occurrenceFields = (
  occurrence: RollingMaterializationOccurrence,
): Pick<
  SafeRepairPlanAction,
  'sessionId' | 'date' | 'startTime' | 'durationMinutes'
> => ({
  sessionId: occurrence.sessionId,
  date: occurrence.date,
  startTime: occurrence.startTime,
  durationMinutes: occurrence.durationMinutes,
});

export function validateSafeMissingSessionPayload(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  occurrence: RollingMaterializationOccurrence;
  scheduleRevision: number;
}): {safe: true} | {safe: false; reason: string} {
  try {
    buildRollingScheduledSessionPayload({
      enrollmentId: args.enrollmentId,
      enrollment: args.enrollment,
      occurrence: args.occurrence,
      scheduleRevision: args.scheduleRevision,
      actorId: REPAIR_PLANNER_ACTOR,
    });
    return {safe: true};
  } catch (error) {
    return {
      safe: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runSafeRepairPlannerWithStore(
  store: ScheduleIntegrityStore,
  input: {anchorYmd?: string; maxEnrollments?: number} = {},
): Promise<SafeRepairPlannerSummary> {
  const anchorYmd = validateYmd(input.anchorYmd || todayInIndiaYmd());
  const horizonEndYmd = addDaysYmd(anchorYmd, ROLLING_SCHEDULE_HORIZON_DAYS);
  const maxEnrollments = normalizeMaxEnrollments(input.maxEnrollments);

  const enrollments = await store.listEnrollments();
  const operational = enrollments.filter((row) =>
    isEnrollmentOperationallyActive(row.data),
  );

  if (operational.length > maxEnrollments) {
    throw new HttpsError(
      'failed-precondition',
      `Safety stop: ${operational.length} operational enrollments exceeds cap ${maxEnrollments}.`,
    );
  }

  const invalidByReason = emptyInvalidCounts();
  const actionCounts = emptyActionCounts();
  const plans: SafeRepairEnrollmentPlan[] = [];
  const prepared: Array<{
    enrollmentId: string;
    enrollment: Record<string, unknown>;
    plan: ReturnType<typeof buildRollingMaterializationPlan>;
  }> = [];

  for (const row of operational) {
    const invalidReason = classifyScheduleIntegrityEnrollmentCandidate(row.data);
    if (invalidReason) {
      invalidByReason[invalidReason] += 1;
      actionCounts.BLOCK_INVALID_SOURCE += 1;
      plans.push({
        enrollmentId: row.id,
        expectedOccurrences: 0,
        safeCreates: 0,
        exceptionsPreserved: 0,
        blockers: 1,
        metadataAction: 'BLOCKED',
        actions: [{
          type: 'BLOCK_INVALID_SOURCE',
          enrollmentId: row.id,
          invalidReason,
          reason: invalidReason,
        }],
      });
      continue;
    }

    try {
      prepared.push({
        enrollmentId: row.id,
        enrollment: row.data,
        plan: buildRollingMaterializationPlan({
          enrollmentId: row.id,
          enrollment: row.data,
          anchorYmd,
        }),
      });
    } catch (error) {
      invalidByReason.invalid_schedule += 1;
      actionCounts.BLOCK_INVALID_SOURCE += 1;
      plans.push({
        enrollmentId: row.id,
        expectedOccurrences: 0,
        safeCreates: 0,
        exceptionsPreserved: 0,
        blockers: 1,
        metadataAction: 'BLOCKED',
        actions: [{
          type: 'BLOCK_INVALID_SOURCE',
          enrollmentId: row.id,
          invalidReason: 'invalid_schedule',
          reason: error instanceof Error ? error.message : String(error),
        }],
      });
    }
  }

  const expectedSessionIds = Array.from(new Set(
    prepared.flatMap(({plan}) =>
      plan.occurrences.map((occurrence) => occurrence.sessionId),
    ),
  ));

  const {existingById, evidenceSessions} =
    await loadScheduleIntegritySessionEvidence(
      store,
      expectedSessionIds,
      anchorYmd,
      horizonEndYmd,
    );
  const exceptionIndex =
    buildScheduleIntegrityExceptionRelationIndex(evidenceSessions);
  const occurrenceIndex =
    buildScheduleIntegrityOccurrenceSessionIndex(evidenceSessions);

  let expectedOccurrences = 0;
  let safeCreateSessions = 0;
  let exceptionsPreserved = 0;
  let noActionOccurrences = 0;
  let blockedOccurrences = 0;
  let metadataInitializations = 0;
  let metadataSynchronizations = 0;

  prepared.forEach(({enrollmentId, enrollment, plan}) => {
    const actions: SafeRepairPlanAction[] = [];
    let safeCreates = 0;
    let enrollmentExceptions = 0;
    let blockers = 0;

    const surplus = detectScheduleIntegritySurplusSessions({
      enrollmentId,
      occurrences: plan.occurrences,
      sessions: evidenceSessions,
      fromYmd: anchorYmd,
      toYmd: horizonEndYmd,
    });
    surplus.duplicateRegularSessions.forEach((finding) => {
      blockers += 1;
      blockedOccurrences += 1;
      actionCounts.BLOCK_DUPLICATE_REGULAR_SESSION += 1;
      actions.push({
        type: 'BLOCK_DUPLICATE_REGULAR_SESSION',
        enrollmentId,
        sessionId: finding.sessionId,
        date: finding.date,
        startTime: finding.startTime,
        durationMinutes: finding.durationMinutes ?? undefined,
        reason:
          'Additional regular session duplicates an expected occurrence; controlled repair must fail closed until the duplicate is resolved.',
      });
    });
    surplus.unexpectedRegularSessions.forEach((finding) => {
      blockers += 1;
      blockedOccurrences += 1;
      actionCounts.BLOCK_UNEXPECTED_REGULAR_SESSION += 1;
      actions.push({
        type: 'BLOCK_UNEXPECTED_REGULAR_SESSION',
        enrollmentId,
        sessionId: finding.sessionId,
        date: finding.date,
        startTime: finding.startTime,
        durationMinutes: finding.durationMinutes ?? undefined,
        reason:
          'Regular session exists inside the rolling horizon but does not match the current recurrence; controlled repair must fail closed until it is resolved.',
      });
    });

    plan.occurrences.forEach((occurrence) => {
      expectedOccurrences += 1;
      const existingSession = resolveScheduleIntegrityExistingOccurrenceSession({
        enrollmentId,
        occurrence,
        deterministicSession: existingById.get(occurrence.sessionId),
        occurrenceIndex,
      });
      const classification = classifyScheduleIntegrityOccurrence({
        enrollmentId,
        enrollment,
        occurrence,
        scheduleRevision: plan.scheduleRevision,
        existingSession,
        relatedExceptionCandidates: exceptionIndex.get(occurrence.sessionId),
      });

      if (classification.state === 'healthy') {
        noActionOccurrences += 1;
        actionCounts.NO_ACTION += 1;
        actions.push({
          type: 'NO_ACTION',
          enrollmentId,
          ...occurrenceFields(occurrence),
          reason: 'Expected occurrence is already healthy.',
        });
        return;
      }

      if (classification.state === 'schedule_exception') {
        exceptionsPreserved += 1;
        enrollmentExceptions += 1;
        actionCounts.PRESERVE_EXCEPTION += 1;
        actions.push({
          type: 'PRESERVE_EXCEPTION',
          enrollmentId,
          ...occurrenceFields(occurrence),
          reason: classification.relatedExceptionSessionId
            ? `Linked exception/replacement: ${classification.relatedExceptionSessionId}`
            : 'Existing occurrence is an intentional scheduling exception.',
        });
        return;
      }

      if (classification.state === 'missing') {
        const payloadCheck = validateSafeMissingSessionPayload({
          enrollmentId,
          enrollment,
          occurrence,
          scheduleRevision: plan.scheduleRevision,
        });
        if (payloadCheck.safe) {
          safeCreateSessions += 1;
          safeCreates += 1;
          actionCounts.SAFE_CREATE_MISSING_SESSION += 1;
          actions.push({
            type: 'SAFE_CREATE_MISSING_SESSION',
            enrollmentId,
            ...occurrenceFields(occurrence),
            reason: 'Occurrence is absent, unexceptioned, and payload preflight succeeds.',
          });
        } else {
          blockedOccurrences += 1;
          blockers += 1;
          actionCounts.BLOCK_UNSAFE_SESSION_PAYLOAD += 1;
          actions.push({
            type: 'BLOCK_UNSAFE_SESSION_PAYLOAD',
            enrollmentId,
            ...occurrenceFields(occurrence),
            reason: payloadCheck.reason,
          });
        }
        return;
      }

      if (classification.state === 'stale_revision') {
        noActionOccurrences += 1;
        actionCounts.PRESERVE_STALE_REVISION_SESSION += 1;
        actions.push({
          type: 'PRESERVE_STALE_REVISION_SESSION',
          enrollmentId,
          ...occurrenceFields(occurrence),
          reason:
            'Existing session matches enrollment/date/time/duration and is preserved; only its scheduleRevision is stale.',
        });
        return;
      }

      blockedOccurrences += 1;
      blockers += 1;
      const type = actionForOccurrenceBlocker(classification.state);
      actionCounts[type] += 1;
      actions.push({
        type,
        enrollmentId,
        ...occurrenceFields(occurrence),
        reason:
          classification.state === 'identity_mismatch'
            ? 'Existing session identity conflicts with enrollment identity.'
            : 'Existing session date/time/duration conflicts with expected recurrence.',
      });
    });

    let metadataAction: SafeRepairEnrollmentPlan['metadataAction'] = 'NONE';
    if (blockers > 0) {
      metadataAction = 'BLOCKED';
    } else if (!isRecordLike(enrollment.scheduleMaterialization)) {
      metadataAction = 'INITIALIZE';
      metadataInitializations += 1;
      actionCounts.SAFE_INITIALIZE_MATERIALIZATION += 1;
      actions.push({
        type: 'SAFE_INITIALIZE_MATERIALIZATION',
        enrollmentId,
        reason: 'Valid operational enrollment has no scheduleMaterialization metadata.',
      });
    } else if (
      !materializationMatchesPlan(
        enrollment.scheduleMaterialization,
        plan.materialization,
      )
    ) {
      metadataAction = 'SYNC';
      metadataSynchronizations += 1;
      actionCounts.SAFE_SYNC_MATERIALIZATION += 1;
      actions.push({
        type: 'SAFE_SYNC_MATERIALIZATION',
        enrollmentId,
        reason: 'Existing materialization metadata differs from deterministic current plan.',
      });
    }

    plans.push({
      enrollmentId,
      expectedOccurrences: plan.occurrences.length,
      safeCreates,
      exceptionsPreserved: enrollmentExceptions,
      blockers,
      metadataAction,
      actions,
    });
  });

  plans.sort((left, right) =>
    right.blockers - left.blockers ||
    right.safeCreates - left.safeCreates ||
    left.enrollmentId.localeCompare(right.enrollmentId),
  );

  const blockedEnrollments = plans.filter((plan) => plan.blockers > 0).length;
  const actionableEnrollments = plans.filter((plan) =>
    plan.safeCreates > 0 ||
    plan.metadataAction === 'INITIALIZE' ||
    plan.metadataAction === 'SYNC',
  ).length;

  return {
    mode: 'READ_ONLY_REPAIR_PLAN',
    writesAllowed: SAFE_REPAIR_PLANNER_WRITES_ALLOWED,
    autoRepairEnabled: SAFE_REPAIR_PLANNER_AUTO_REPAIR_ENABLED,
    anchorYmd,
    horizonEndYmd,
    horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
    operationalEnrollments: operational.length,
    eligibleEnrollments: prepared.length,
    invalidEnrollments: operational.length - prepared.length,
    expectedOccurrences,
    safeCreateSessions,
    exceptionsPreserved,
    noActionOccurrences,
    blockedOccurrences,
    metadataInitializations,
    metadataSynchronizations,
    blockedEnrollments,
    actionableEnrollments,
    invalidByReason,
    actionCounts,
    plans: plans.slice(0, SAFE_REPAIR_PLANNER_MAX_DETAIL_ROWS),
  };
}

export async function runSafeRepairPlanner(
  db: admin.firestore.Firestore,
  input: {anchorYmd?: string; maxEnrollments?: number} = {},
): Promise<SafeRepairPlannerSummary> {
  return runSafeRepairPlannerWithStore(
    new FirestoreScheduleIntegrityStore(db),
    input,
  );
}

export const adminPlanScheduleRepairs = onCall(
  {
    region: SAFE_REPAIR_PLANNER_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (request) => {
    await ensureAdmin(request.auth);
    const summary = await runSafeRepairPlanner(
      admin.firestore(),
      (request.data || {}) as {
        anchorYmd?: string;
        maxEnrollments?: number;
      },
    );
    logger.info('safeRepairPlanner: read-only plan complete', {
      anchorYmd: summary.anchorYmd,
      horizonEndYmd: summary.horizonEndYmd,
      operationalEnrollments: summary.operationalEnrollments,
      safeCreateSessions: summary.safeCreateSessions,
      metadataInitializations: summary.metadataInitializations,
      metadataSynchronizations: summary.metadataSynchronizations,
      blockedEnrollments: summary.blockedEnrollments,
      writesAllowed: summary.writesAllowed,
      autoRepairEnabled: summary.autoRepairEnabled,
    });
    return summary;
  },
);
