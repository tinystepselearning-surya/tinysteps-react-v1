import * as admin from 'firebase-admin';
import {
  collectParentMonthClassAttendanceTargets,
  type ParentMonthClassAttendanceTarget,
} from '../parentMonthlyClassAttendanceProjectionV3';
import {
  PARENT_CLASS_ATTENDANCE_BASELINE_SOURCE,
  classifyParentClassAttendanceEventAgainstBaseline,
  recomputeParentClassAttendanceAuthoritativeBaselines,
  type ParentClassAttendanceBaselineBatchTransactionResult,
} from './parentClassAttendanceAuthoritativeBaseline';
import {
  evaluateParentClassAttendanceIncrementalReplay,
  parentClassAttendanceIncrementalChangeSignature,
  parentClassAttendanceIncrementalMarkerId,
  planParentClassAttendanceIncrementalTransaction,
  PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
  PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE,
  PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE,
  type ParentClassAttendanceIncrementalBaseline,
} from './parentClassAttendanceIncrementalProtocol';
import {
  planParentClassAttendanceRollupChange,
  type ParentClassAttendanceRollupTarget,
} from './parentClassAttendanceRollupDelta';

const MAX_INCREMENTAL_TARGETS_PER_EVENT = 2;

export type ParentClassAttendanceIncrementalAppliedTarget = {
  parentId: string;
  monthKey: string;
  revisionBefore: number;
  revisionAfter: number;
};

export type ParentClassAttendanceIncrementalExecutionResult =
  | {
      mode: 'applied';
      markerId: string;
      targets: ParentClassAttendanceIncrementalAppliedTarget[];
    }
  | {
      mode: 'covered';
      markerId: string;
      targetCount: number;
    }
  | {
      mode: 'replay';
      markerId: string;
      previousOutcome: 'applied' | 'covered' | 'authoritative' | 'unknown';
    }
  | { mode: 'noop'; reason: string }
  | { mode: 'fallback'; reason: string }
  | { mode: 'conflict'; reason: string };

export type ParentClassAttendanceGuardedExecutionResult =
  | ParentClassAttendanceIncrementalExecutionResult
  | {
      mode: 'authoritative_recomputed';
      reason: string;
      targetCount: number;
    }
  | {
      mode: 'delegate_v3';
      reason: string;
    };

export type ParentClassAttendanceAuthoritativeRecompute = (input: {
  db: admin.firestore.Firestore;
  targets: ParentMonthClassAttendanceTarget[];
  authoritativeEventId: unknown;
  generatedAtMs?: number;
}) => Promise<ParentClassAttendanceBaselineBatchTransactionResult>;

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const finiteNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const nonNegativeInteger = (value: unknown): number | null => {
  const parsed = finiteNumber(value);
  if (parsed == null || parsed < 0 || !Number.isInteger(parsed)) return null;
  return parsed;
};

const targetKey = (target: ParentClassAttendanceRollupTarget): string =>
  `${target.parentId}__${target.monthKey}`;

const normalizeMarkerOutcome = (
  value: unknown,
): 'applied' | 'covered' | 'authoritative' | 'unknown' => {
  const normalized = normalizeText(value);
  if (normalized === 'applied' || normalized === 'covered' || normalized === 'authoritative') {
    return normalized;
  }
  return 'unknown';
};

const readAttendance = (
  readModel: Record<string, unknown> | null,
): Record<string, unknown> | null => {
  const attendance = readModel?.attendance;
  return attendance && typeof attendance === 'object' && !Array.isArray(attendance)
    ? (attendance as Record<string, unknown>)
    : null;
};

/**
 * Brick 1D certification preflight.
 *
 * Coverage must be evaluated before applying a delta because an authoritative baseline may already
 * contain the event's AFTER state. This preflight verifies that a watermark belongs to a Brick 1C
 * transaction-certified V3 baseline before it is trusted for covered/uncovered classification.
 */
const baselineCertificationReason = (
  baseline: ParentClassAttendanceIncrementalBaseline,
): string | null => {
  const readModel = baseline.readModel;
  if (!readModel) return 'baseline_missing';
  if (
    normalizeText(readModel.parentId) !== baseline.target.parentId ||
    normalizeText(readModel.monthKey) !== baseline.target.monthKey
  ) {
    return 'baseline_target_mismatch';
  }

  const attendance = readAttendance(readModel);
  if (!attendance) return 'attendance_projection_missing';
  if (
    finiteNumber(attendance.schemaVersion) !== 3 ||
    normalizeText(attendance.modelType) !== 'class_attendance_v3'
  ) {
    return 'attendance_projection_not_authoritative_v3';
  }
  if (
    finiteNumber(attendance.incrementalProtocolVersion) !==
      PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION ||
    normalizeText(attendance.incrementalTransactionFence) !==
      PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE ||
    normalizeText(attendance.incrementalRecomputeState) !==
      PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE ||
    nonNegativeInteger(attendance.incrementalRevision) == null
  ) {
    return 'baseline_not_transaction_coordinated';
  }
  if (
    normalizeText(attendance.incrementalBaselineSource) !==
      PARENT_CLASS_ATTENDANCE_BASELINE_SOURCE ||
    (nonNegativeInteger(attendance.incrementalBaselineEpoch) ?? 0) < 1
  ) {
    return 'baseline_not_authoritatively_certified';
  }
  if (
    !attendance.totals ||
    typeof attendance.totals !== 'object' ||
    !attendance.byKid ||
    typeof attendance.byKid !== 'object' ||
    Array.isArray(attendance.byKid)
  ) {
    return 'attendance_projection_shape_invalid';
  }
  return null;
};

const parentMonthReadModelRef = (
  db: admin.firestore.Firestore,
  target: ParentClassAttendanceRollupTarget,
) =>
  db
    .collection('parentMonthlyReadModels')
    .doc(target.parentId)
    .collection('months')
    .doc(target.monthKey);

const markerRefFor = (db: admin.firestore.Firestore, markerId: string) =>
  db
    .collection('adminStats')
    .doc('parentClassAttendanceIncremental')
    .collection('events')
    .doc(markerId);

const projectionWrite = (input: {
  baseline: ParentClassAttendanceIncrementalBaseline;
  nextProjection: NonNullable<
    Extract<
      ReturnType<typeof planParentClassAttendanceIncrementalTransaction>,
      { mode: 'candidate' }
    >['mutations'][number]['nextProjection']
  >;
  revisionAfter: number;
  eventId: string;
  eventUpdateTime: unknown;
  nowMs: number;
}): Record<string, unknown> | null => {
  const attendance = readAttendance(input.baseline.readModel);
  if (!attendance) return null;
  return {
    parentId: input.baseline.target.parentId,
    monthKey: input.baseline.target.monthKey,
    attendance: {
      ...attendance,
      timeClassificationAsOfMs: input.nowMs,
      generatedAtMs: input.nowMs,
      sourceSessionCount: input.nextProjection.sourceSessionRecords,
      unassignedSessionRecords: input.nextProjection.unassignedSessionRecords,
      legacyKidAliasOnlySessionRecords:
        input.nextProjection.legacyKidAliasOnlySessionRecords,
      totals: input.nextProjection.totals,
      byKid: input.nextProjection.byKid,
      incrementalProtocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
      incrementalTransactionFence: PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE,
      incrementalRecomputeState: PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE,
      incrementalRevision: input.revisionAfter,
      incrementalLastEventId: input.eventId,
      incrementalLastEventUpdateTime: input.eventUpdateTime,
      incrementalLastAppliedAt: admin.firestore.FieldValue.serverTimestamp(),
      refreshedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  };
};

const exactOperationTargets = (input: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  nowMs: number;
}):
  | { mode: 'targets'; targets: ParentClassAttendanceRollupTarget[] }
  | { mode: 'noop'; reason: string }
  | { mode: 'fallback'; reason: string } => {
  const plan = planParentClassAttendanceRollupChange(input);
  if (plan.mode === 'noop') return { mode: 'noop', reason: 'planner_noop' };
  if (plan.mode === 'recompute') {
    return { mode: 'fallback', reason: `planner_${plan.reason}` };
  }
  if (plan.operations.length === 0 || plan.operations.length > MAX_INCREMENTAL_TARGETS_PER_EVENT) {
    return { mode: 'fallback', reason: 'incremental_target_cap_exceeded' };
  }
  const seen = new Set<string>();
  const targets: ParentClassAttendanceRollupTarget[] = [];
  for (const operation of plan.operations) {
    const key = targetKey(operation.target);
    if (seen.has(key)) return { mode: 'fallback', reason: 'duplicate_incremental_target' };
    seen.add(key);
    targets.push(operation.target);
  }
  return { mode: 'targets', targets };
};

/**
 * Brick 1D transactional executor.
 *
 * The fast path reads only one global idempotency marker and one/two certified parent-month read
 * models. It never queries classSessions. Marker + all affected baselines are read before any write,
 * then one/two exact projections and the marker are committed atomically.
 *
 * The authoritative commit watermark and baseline epoch are deliberately preserved by incremental
 * writes. Only Brick 1C's full source transaction may advance those fields.
 */
export const tryApplyParentClassAttendanceIncrementalEvent = async (input: {
  db: admin.firestore.Firestore;
  eventId: unknown;
  sessionId: unknown;
  eventUpdateTime: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  nowMs?: number;
}): Promise<ParentClassAttendanceIncrementalExecutionResult> => {
  const eventId = normalizeText(input.eventId);
  const sessionId = normalizeText(input.sessionId);
  if (!eventId || !sessionId) return { mode: 'fallback', reason: 'missing_event_identity' };

  const nowMs = input.nowMs ?? Date.now();
  const targetDecision = exactOperationTargets({
    before: input.before,
    after: input.after,
    nowMs,
  });
  if (targetDecision.mode !== 'targets') return targetDecision;

  const canonicalTargets = collectParentMonthClassAttendanceTargets(input.before, input.after);
  if (
    canonicalTargets.length !== targetDecision.targets.length ||
    canonicalTargets.some((target) => target.requiresCompatibility)
  ) {
    return { mode: 'fallback', reason: 'legacy_or_mismatched_target_requires_authoritative' };
  }

  const markerId = parentClassAttendanceIncrementalMarkerId(eventId);
  const changeSignature = parentClassAttendanceIncrementalChangeSignature({
    eventId,
    sessionId,
    before: input.before,
    after: input.after,
  });
  if (!markerId || !changeSignature) {
    return { mode: 'fallback', reason: 'missing_event_identity' };
  }

  const markerRef = markerRefFor(input.db, markerId);
  const entries = targetDecision.targets.map((target) => ({
    target,
    ref: parentMonthReadModelRef(input.db, target),
  }));

  return input.db.runTransaction(async (tx) => {
    const markerSnap = await tx.get(markerRef);
    const baselines: ParentClassAttendanceIncrementalBaseline[] = [];
    for (const entry of entries) {
      const snap = await tx.get(entry.ref);
      baselines.push({
        target: entry.target,
        readModel: snap.exists
          ? ((snap.data() || {}) as Record<string, unknown>)
          : null,
      });
    }

    const existingMarker = markerSnap.exists
      ? ((markerSnap.data() || {}) as Record<string, unknown>)
      : null;
    const replayDecision = evaluateParentClassAttendanceIncrementalReplay({
      markerId,
      changeSignature,
      existingMarker,
    });
    if (replayDecision?.mode === 'replay') {
      return {
        mode: 'replay' as const,
        markerId,
        previousOutcome: normalizeMarkerOutcome(existingMarker?.outcome),
      };
    }
    if (replayDecision?.mode === 'conflict') {
      return { mode: 'conflict' as const, reason: replayDecision.reason };
    }

    for (const baseline of baselines) {
      const reason = baselineCertificationReason(baseline);
      if (reason) return { mode: 'fallback' as const, reason };
    }

    if (!input.after) {
      return {
        mode: 'fallback' as const,
        reason: 'delete_event_requires_authoritative_recompute',
      };
    }

    const coverage = baselines.map((baseline) => {
      const attendance = readAttendance(baseline.readModel);
      return classifyParentClassAttendanceEventAgainstBaseline({
        afterExists: true,
        eventUpdateTime: input.eventUpdateTime,
        authoritativeCommittedAt: attendance?.incrementalAuthoritativeCommittedAt,
      });
    });
    const ambiguous = coverage.find((entry) => entry.mode === 'fallback');
    if (ambiguous?.mode === 'fallback') {
      return { mode: 'fallback' as const, reason: ambiguous.reason };
    }

    const coveredCount = coverage.filter((entry) => entry.mode === 'covered').length;
    if (coveredCount > 0 && coveredCount !== coverage.length) {
      return { mode: 'fallback' as const, reason: 'mixed_authoritative_coverage' };
    }
    if (coveredCount === coverage.length) {
      tx.set(
        markerRef,
        {
          eventId,
          sessionId,
          changeSignature,
          protocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
          outcome: 'covered',
          eventUpdateTime: input.eventUpdateTime,
          targetKeys: targetDecision.targets.map(targetKey).sort(),
          recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: false },
      );
      return { mode: 'covered' as const, markerId, targetCount: baselines.length };
    }

    const decision = planParentClassAttendanceIncrementalTransaction({
      eventId,
      sessionId,
      before: input.before,
      after: input.after,
      baselines,
      nowMs,
    });
    if (decision.mode === 'noop') return decision;
    if (decision.mode === 'fallback') return decision;
    if (decision.mode === 'conflict') return decision;
    if (decision.mode === 'replay') {
      return {
        mode: 'replay' as const,
        markerId,
        previousOutcome: normalizeMarkerOutcome(existingMarker?.outcome),
      };
    }

    const baselineByKey = new Map(
      baselines.map((baseline) => [targetKey(baseline.target), baseline] as const),
    );
    const refByKey = new Map(entries.map((entry) => [targetKey(entry.target), entry.ref] as const));
    const appliedTargets: ParentClassAttendanceIncrementalAppliedTarget[] = [];

    for (const mutation of decision.mutations) {
      const key = targetKey(mutation.target);
      const baseline = baselineByKey.get(key);
      const ref = refByKey.get(key);
      if (!baseline || !ref) {
        return { mode: 'fallback' as const, reason: 'baseline_target_set_mismatch' };
      }
      const write = projectionWrite({
        baseline,
        nextProjection: mutation.nextProjection,
        revisionAfter: mutation.revisionAfter,
        eventId,
        eventUpdateTime: input.eventUpdateTime,
        nowMs,
      });
      if (!write) return { mode: 'fallback' as const, reason: 'attendance_projection_missing' };
      tx.set(ref, write, { merge: true });
      appliedTargets.push({
        parentId: mutation.target.parentId,
        monthKey: mutation.target.monthKey,
        revisionBefore: mutation.revisionBefore,
        revisionAfter: mutation.revisionAfter,
      });
    }

    tx.set(
      markerRef,
      {
        eventId,
        sessionId,
        changeSignature,
        protocolVersion: decision.protocolVersion,
        outcome: 'applied',
        eventUpdateTime: input.eventUpdateTime,
        targetKeys: appliedTargets
          .map((target) => `${target.parentId}__${target.monthKey}`)
          .sort(),
        revisions: appliedTargets,
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: false },
    );

    return { mode: 'applied' as const, markerId, targets: appliedTargets };
  });
};

export const isParentClassAttendanceIncrementalCutoverEnabled = (value: unknown): boolean => {
  if (value === true) return true;
  return normalizeText(value).toLowerCase() === 'true';
};

/**
 * Guarded Brick 1D orchestration layer.
 *
 * The deployed V3 trigger is intentionally not switched by this helper. A future V4 trigger may
 * call this function only when its explicit cutover gate is enabled. Canonical ambiguous/conflict
 * cases immediately run the Brick 1C authoritative transaction; compatibility/index cases return
 * delegate_v3 so the existing safe compatibility path remains available instead of dropping work.
 */
export const executeParentClassAttendanceGuardedEvent = async (input: {
  db: admin.firestore.Firestore;
  incrementalEnabled: unknown;
  eventId: unknown;
  sessionId: unknown;
  eventUpdateTime: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  nowMs?: number;
  authoritativeRecompute?: ParentClassAttendanceAuthoritativeRecompute;
}): Promise<ParentClassAttendanceGuardedExecutionResult> => {
  if (!isParentClassAttendanceIncrementalCutoverEnabled(input.incrementalEnabled)) {
    return { mode: 'delegate_v3', reason: 'incremental_cutover_disabled' };
  }

  const incremental = await tryApplyParentClassAttendanceIncrementalEvent(input);
  if (
    incremental.mode === 'applied' ||
    incremental.mode === 'covered' ||
    incremental.mode === 'replay' ||
    incremental.mode === 'noop'
  ) {
    return incremental;
  }

  const targets = collectParentMonthClassAttendanceTargets(input.before, input.after);
  if (targets.length === 0) {
    return { mode: 'delegate_v3', reason: `incremental_${incremental.reason}_target_unresolved` };
  }
  if (targets.some((target) => target.requiresCompatibility)) {
    return { mode: 'delegate_v3', reason: `incremental_${incremental.reason}_compatibility_target` };
  }

  const recompute = input.authoritativeRecompute ?? recomputeParentClassAttendanceAuthoritativeBaselines;
  const authoritative = await recompute({
    db: input.db,
    targets,
    authoritativeEventId: input.eventId,
    generatedAtMs: input.nowMs,
  });
  if (authoritative.mode === 'certified') {
    return {
      mode: 'authoritative_recomputed',
      reason: incremental.mode === 'conflict'
        ? `incremental_conflict_${incremental.reason}`
        : `incremental_fallback_${incremental.reason}`,
      targetCount: authoritative.baselines.length,
    };
  }

  return {
    mode: 'delegate_v3',
    reason: `authoritative_${authoritative.reason}`,
  };
};
