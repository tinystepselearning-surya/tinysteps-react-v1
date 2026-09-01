import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import {
  MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS,
  MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
  buildParentMonthClassAttendanceProjection,
  classAttendanceProjectionInvariantErrors,
  collectParentMonthClassAttendanceTargets,
  isMissingAttendanceIndexError,
  resolveSessionClassAttendanceTarget,
  shouldRefreshParentMonthClassAttendance,
  type ParentMonthClassAttendanceTarget,
} from './parentMonthlyClassAttendanceProjectionV3';
import {
  PARENT_CLASS_ATTENDANCE_BASELINE_SOURCE,
  classifyParentClassAttendanceEventAgainstBaseline,
  recomputeParentClassAttendanceAuthoritativeBaselines,
  type ParentClassAttendanceBaselineBatchTransactionResult,
} from './helpers/parentClassAttendanceAuthoritativeBaseline';
import {
  executeParentClassAttendanceGuardedEvent,
  isParentClassAttendanceIncrementalCutoverEnabled,
  type ParentClassAttendanceGuardedExecutionResult,
} from './helpers/parentClassAttendanceIncrementalExecutor';
import {
  PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
  PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE,
  PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE,
  planParentClassAttendanceIncrementalTransaction,
  type ParentClassAttendanceIncrementalBaseline,
} from './helpers/parentClassAttendanceIncrementalProtocol';
import {
  evaluateParentClassAttendanceShadowParity,
  type ParentClassAttendanceShadowParityResult,
} from './helpers/parentClassAttendanceShadowParity';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

export const PARENT_CLASS_ATTENDANCE_INCREMENTAL_ENABLED_ENV =
  'PARENT_CLASS_ATTENDANCE_INCREMENTAL_ENABLED';
export const PARENT_CLASS_ATTENDANCE_SHADOW_ENABLED_ENV =
  'PARENT_CLASS_ATTENDANCE_SHADOW_ENABLED';

export type ParentClassAttendanceV4LiveOutcome =
  | 'applied'
  | 'covered'
  | 'replay'
  | 'fallback'
  | 'delegate_v3'
  | 'noop';

export type ParentClassAttendanceV4ShadowOutcome =
  | 'match'
  | 'mismatch'
  | 'covered'
  | 'not_evaluable'
  | 'skipped';

export type ParentClassAttendanceV4ShadowPreview =
  | {
      mode: 'candidate';
      baselines: ParentClassAttendanceIncrementalBaseline[];
    }
  | { mode: 'covered'; targetCount: number }
  | { mode: 'not_evaluable'; reason: string };

export type ParentClassAttendanceV4ProcessingResult = {
  liveOutcome: ParentClassAttendanceV4LiveOutcome;
  liveReason: string;
  rawMode?: ParentClassAttendanceGuardedExecutionResult['mode'] | 'v3_recomputed';
  shadowOutcome: ParentClassAttendanceV4ShadowOutcome;
  shadowReason?: string;
  targetCount: number;
};

type V3TargetResult = {
  sourceSessionCount: number;
  sourceDocumentsRead: number;
  queryMode: 'parentId_date_month_bounded' | 'parentId_capped_compatibility';
  childRowCount: number;
};

type V4TelemetryInput = {
  db: admin.firestore.Firestore;
  eventId: string;
  sessionId: string;
  incrementalEnabled: boolean;
  shadowEnabled: boolean;
  result: ParentClassAttendanceV4ProcessingResult;
};

type V4Dependencies = {
  guardedExecute: typeof executeParentClassAttendanceGuardedEvent;
  authoritativeRecompute: typeof recomputeParentClassAttendanceAuthoritativeBaselines;
  shadowPreview: typeof inspectParentClassAttendanceShadowReadiness;
  v3RecomputeTarget: typeof recomputeParentMonthClassAttendanceV3Compatible;
  recordTelemetry: typeof recordParentClassAttendanceV4Telemetry;
};

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

const readAttendance = (
  readModel: Record<string, unknown> | null,
): Record<string, unknown> | null => {
  const attendance = readModel?.attendance;
  return attendance && typeof attendance === 'object' && !Array.isArray(attendance)
    ? (attendance as Record<string, unknown>)
    : null;
};

const monthDateRange = (monthKey: string): { startYmd: string; endYmd: string } | null => {
  const match = MONTH_RE.exec(monthKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  const lastDay = new Date(year, month, 0).getDate();
  return {
    startYmd: `${match[1]}-${match[2]}-01`,
    endYmd: `${match[1]}-${match[2]}-${String(lastDay).padStart(2, '0')}`,
  };
};

const shadowBaselineCertificationReason = (
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
  return null;
};

const parentMonthReadModelRef = (
  db: admin.firestore.Firestore,
  target: ParentMonthClassAttendanceTarget,
) =>
  db
    .collection('parentMonthlyReadModels')
    .doc(target.parentId)
    .collection('months')
    .doc(target.monthKey);

export const inspectParentClassAttendanceShadowReadiness = async (input: {
  db: admin.firestore.Firestore;
  eventId: unknown;
  sessionId: unknown;
  eventUpdateTime: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  targets: ParentMonthClassAttendanceTarget[];
  nowMs?: number;
}): Promise<ParentClassAttendanceV4ShadowPreview> => {
  if (input.targets.length === 0) {
    return { mode: 'not_evaluable', reason: 'target_unresolved' };
  }
  if (input.targets.some((target) => target.requiresCompatibility)) {
    return { mode: 'not_evaluable', reason: 'compatibility_target' };
  }
  if (!input.after) {
    return { mode: 'not_evaluable', reason: 'delete_event_requires_authoritative_recompute' };
  }

  const baselines: ParentClassAttendanceIncrementalBaseline[] = [];
  for (const target of input.targets) {
    const snap = await parentMonthReadModelRef(input.db, target).get();
    baselines.push({
      target,
      readModel: snap.exists
        ? ((snap.data() || {}) as Record<string, unknown>)
        : null,
    });
  }

  for (const baseline of baselines) {
    const reason = shadowBaselineCertificationReason(baseline);
    if (reason) return { mode: 'not_evaluable', reason };
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
    return { mode: 'not_evaluable', reason: ambiguous.reason };
  }
  const coveredCount = coverage.filter((entry) => entry.mode === 'covered').length;
  if (coveredCount > 0 && coveredCount !== coverage.length) {
    return { mode: 'not_evaluable', reason: 'mixed_authoritative_coverage' };
  }
  if (coveredCount === coverage.length) {
    return { mode: 'covered', targetCount: baselines.length };
  }

  const decision = planParentClassAttendanceIncrementalTransaction({
    eventId: input.eventId,
    sessionId: input.sessionId,
    before: input.before,
    after: input.after,
    baselines,
    nowMs: input.nowMs,
  });
  if (decision.mode !== 'candidate') {
    return {
      mode: 'not_evaluable',
      reason: decision.mode === 'noop'
        ? 'incremental_planner_noop'
        : decision.mode === 'fallback'
          ? `incremental_${decision.reason}`
          : decision.mode === 'replay'
            ? 'incremental_replay'
            : `incremental_${decision.reason}`,
    };
  }
  return { mode: 'candidate', baselines };
};

const loadCappedCompatibilitySessions = async (
  db: admin.firestore.Firestore,
  target: ParentMonthClassAttendanceTarget,
  reason: 'missing_index' | 'legacy_session_without_date',
): Promise<{
  sessions: Array<Record<string, unknown>>;
  sourceDocumentsRead: number;
  queryMode: V3TargetResult['queryMode'];
}> => {
  logger.warn('V4 delegating to capped V3 class-attendance compatibility query', {
    parentId: target.parentId,
    monthKey: target.monthKey,
    reason,
    maxDocuments: MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS + 1,
  });

  const compatibilitySnap = await db
    .collection('classSessions')
    .where('parentId', '==', target.parentId)
    .limit(MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS + 1)
    .get();
  if (compatibilitySnap.size > MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS) {
    throw new Error(
      `Parent class-attendance compatibility query exceeded safe cap (${target.parentId}, >${MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS} sessions).`,
    );
  }

  const sessions = compatibilitySnap.docs
    .map((docSnap) => (docSnap.data() || {}) as Record<string, unknown>)
    .filter((session) => {
      const resolved = resolveSessionClassAttendanceTarget(session);
      return resolved?.parentId === target.parentId && resolved.monthKey === target.monthKey;
    });
  if (sessions.length > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
    throw new Error(
      `Parent-month class-attendance projection exceeded safe cap (${target.parentId}/${target.monthKey}, >${MAX_PARENT_MONTH_ATTENDANCE_SESSIONS} sessions)`,
    );
  }
  return {
    sessions,
    sourceDocumentsRead: compatibilitySnap.size,
    queryMode: 'parentId_capped_compatibility',
  };
};

export const recomputeParentMonthClassAttendanceV3Compatible = async (input: {
  db: admin.firestore.Firestore;
  target: ParentMonthClassAttendanceTarget;
  nowMs?: number;
}): Promise<V3TargetResult> => {
  const range = monthDateRange(input.target.monthKey);
  let source: {
    sessions: Array<Record<string, unknown>>;
    sourceDocumentsRead: number;
    queryMode: V3TargetResult['queryMode'];
  };

  if (!range) {
    source = {
      sessions: [],
      sourceDocumentsRead: 0,
      queryMode: 'parentId_date_month_bounded',
    };
  } else if (input.target.requiresCompatibility) {
    source = await loadCappedCompatibilitySessions(
      input.db,
      input.target,
      'legacy_session_without_date',
    );
  } else {
    try {
      const boundedSnap = await input.db
        .collection('classSessions')
        .where('parentId', '==', input.target.parentId)
        .where('date', '>=', range.startYmd)
        .where('date', '<=', range.endYmd)
        .limit(MAX_PARENT_MONTH_ATTENDANCE_SESSIONS + 1)
        .get();
      if (boundedSnap.size > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
        throw new Error(
          `Parent-month class-attendance projection exceeded safe cap (${input.target.parentId}/${input.target.monthKey}, >${MAX_PARENT_MONTH_ATTENDANCE_SESSIONS} sessions)`,
        );
      }
      source = {
        sessions: boundedSnap.docs.map(
          (docSnap) => (docSnap.data() || {}) as Record<string, unknown>,
        ),
        sourceDocumentsRead: boundedSnap.size,
        queryMode: 'parentId_date_month_bounded',
      };
    } catch (error) {
      if (!isMissingAttendanceIndexError(error)) throw error;
      source = await loadCappedCompatibilitySessions(input.db, input.target, 'missing_index');
    }
  }

  const generatedAtMs = input.nowMs ?? Date.now();
  const projection = buildParentMonthClassAttendanceProjection(
    source.sessions,
    input.target.monthKey,
    generatedAtMs,
  );
  const invariantErrors = classAttendanceProjectionInvariantErrors(projection);
  if (invariantErrors.length > 0) {
    throw new Error(`Class-attendance projection invariant failure: ${invariantErrors.join('; ')}`);
  }

  const docRef = parentMonthReadModelRef(input.db, input.target);
  await docRef.set(
    {
      parentId: input.target.parentId,
      monthKey: input.target.monthKey,
      attendance: {
        schemaVersion: 3,
        modelType: 'class_attendance_v3',
        classAuthority: 'class_sessions',
        attendanceAuthority: 'completed_session_attendance',
        childRowsAuthoritative: true,
        totalsScope: 'parent_month_child_session_instances',
        timeClassificationAsOfMs: generatedAtMs,
        timeBucketsRecomputableFromPendingStarts: true,
        queryMode: source.queryMode,
        sourceSessionCount: source.sessions.length,
        sourceDocumentsRead: source.sourceDocumentsRead,
        maxSourceSessionCount: MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
        unassignedSessionRecords: projection.unassignedSessionRecords,
        legacyKidAliasOnlySessionRecords: projection.legacyKidAliasOnlySessionRecords,
        refreshedAt: FieldValue.serverTimestamp(),
        generatedAtMs,
        totals: projection.totals,
        byKid: projection.byKid,
      },
    },
    { merge: true },
  );

  return {
    sourceSessionCount: source.sessions.length,
    sourceDocumentsRead: source.sourceDocumentsRead,
    queryMode: source.queryMode,
    childRowCount: Object.keys(projection.byKid).length,
  };
};

const sanitizeMetricKey = (value: unknown): string => {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return 'unknown';
  return raw.replace(/[^a-z0-9_-]/g, '_').slice(0, 96) || 'unknown';
};

const dayKeyIST = (nowMs = Date.now()): string => {
  const shifted = new Date(nowMs + IST_OFFSET_MINUTES * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const recordParentClassAttendanceV4Telemetry = async (
  input: V4TelemetryInput,
): Promise<void> => {
  try {
    const dayKey = dayKeyIST();
    const liveOutcome = sanitizeMetricKey(input.result.liveOutcome);
    const liveReason = sanitizeMetricKey(input.result.liveReason);
    const shadowOutcome = sanitizeMetricKey(input.result.shadowOutcome);
    const shadowReason = sanitizeMetricKey(input.result.shadowReason || 'none');
    const docRef = input.db
      .collection('adminStats')
      .doc('parentClassAttendanceV4')
      .collection('days')
      .doc(dayKey);

    await docRef.set(
      {
        dayKey,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalEvents: admin.firestore.FieldValue.increment(1),
        [`byLiveOutcome.${liveOutcome}`]: admin.firestore.FieldValue.increment(1),
        [`byLiveReason.${liveReason}`]: admin.firestore.FieldValue.increment(1),
        [`byShadowOutcome.${shadowOutcome}`]: admin.firestore.FieldValue.increment(1),
        [`byShadowReason.${shadowReason}`]: admin.firestore.FieldValue.increment(1),
        incrementalEnabledEvents: admin.firestore.FieldValue.increment(
          input.incrementalEnabled ? 1 : 0,
        ),
        shadowEnabledEvents: admin.firestore.FieldValue.increment(input.shadowEnabled ? 1 : 0),
        targetCountTotal: admin.firestore.FieldValue.increment(input.result.targetCount),
        lastEvent: {
          eventId: input.eventId,
          sessionId: input.sessionId,
          liveOutcome: input.result.liveOutcome,
          liveReason: input.result.liveReason,
          rawMode: input.result.rawMode || null,
          shadowOutcome: input.result.shadowOutcome,
          shadowReason: input.result.shadowReason || null,
          incrementalEnabled: input.incrementalEnabled,
          shadowEnabled: input.shadowEnabled,
          targetCount: input.result.targetCount,
          atMs: Date.now(),
        },
      },
      { merge: true },
    );
  } catch (error) {
    logger.warn('Parent class-attendance V4 telemetry write failed', {
      sessionId: input.sessionId,
      error: error instanceof Error ? error.message : String(error || ''),
    });
  }
};

const recomputeTargetsV3 = async (input: {
  db: admin.firestore.Firestore;
  targets: ParentMonthClassAttendanceTarget[];
  nowMs?: number;
  v3RecomputeTarget: V4Dependencies['v3RecomputeTarget'];
}): Promise<void> => {
  for (const target of input.targets) {
    await input.v3RecomputeTarget({ db: input.db, target, nowMs: input.nowMs });
  }
};

const mapGuardedLiveOutcome = (
  result: ParentClassAttendanceGuardedExecutionResult,
): ParentClassAttendanceV4LiveOutcome => {
  if (result.mode === 'applied') return 'applied';
  if (result.mode === 'covered') return 'covered';
  if (result.mode === 'replay') return 'replay';
  if (result.mode === 'authoritative_recomputed') return 'fallback';
  if (result.mode === 'delegate_v3') return 'delegate_v3';
  if (result.mode === 'fallback' || result.mode === 'conflict') return 'fallback';
  return 'noop';
};

const guardedReason = (result: ParentClassAttendanceGuardedExecutionResult): string => {
  if ('reason' in result) return result.reason;
  if (result.mode === 'applied') return 'incremental_applied';
  if (result.mode === 'covered') return 'authoritative_covered';
  if (result.mode === 'replay') return `exact_replay_${result.previousOutcome}`;
  return result.mode;
};

const authoritativeShadowTargets = (
  result: Extract<ParentClassAttendanceBaselineBatchTransactionResult, { mode: 'certified' }>,
) => result.baselines.map((baseline) => ({
  target: baseline.target,
  projection: baseline.projection,
}));

const shadowResultFromParity = (
  parity: ParentClassAttendanceShadowParityResult,
): Pick<ParentClassAttendanceV4ProcessingResult, 'shadowOutcome' | 'shadowReason'> => {
  if (parity.mode === 'match') {
    return { shadowOutcome: 'match', shadowReason: `parity_match_${parity.targetCount}` };
  }
  if (parity.mode === 'mismatch') {
    return {
      shadowOutcome: 'mismatch',
      shadowReason: `parity_mismatch_${parity.mismatchedTargetKeys.join('_')}`,
    };
  }
  return { shadowOutcome: 'not_evaluable', shadowReason: parity.reason };
};

const DEFAULT_DEPENDENCIES: V4Dependencies = {
  guardedExecute: executeParentClassAttendanceGuardedEvent,
  authoritativeRecompute: recomputeParentClassAttendanceAuthoritativeBaselines,
  shadowPreview: inspectParentClassAttendanceShadowReadiness,
  v3RecomputeTarget: recomputeParentMonthClassAttendanceV3Compatible,
  recordTelemetry: recordParentClassAttendanceV4Telemetry,
};

export const processParentClassAttendanceV4Write = async (input: {
  db: admin.firestore.Firestore;
  eventId: unknown;
  sessionId: unknown;
  eventUpdateTime: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  incrementalEnabled: unknown;
  shadowEnabled: unknown;
  nowMs?: number;
  dependencies?: Partial<V4Dependencies>;
}): Promise<ParentClassAttendanceV4ProcessingResult> => {
  const eventId = normalizeText(input.eventId);
  const sessionId = normalizeText(input.sessionId);
  const incrementalEnabled = isParentClassAttendanceIncrementalCutoverEnabled(
    input.incrementalEnabled,
  );
  const shadowEnabled = isParentClassAttendanceIncrementalCutoverEnabled(input.shadowEnabled);
  const dependencies: V4Dependencies = { ...DEFAULT_DEPENDENCIES, ...input.dependencies };

  if (!shouldRefreshParentMonthClassAttendance(input.before, input.after)) {
    return {
      liveOutcome: 'noop',
      liveReason: 'projection_irrelevant_change',
      shadowOutcome: 'skipped',
      shadowReason: 'projection_irrelevant_change',
      targetCount: 0,
    };
  }

  const targets = collectParentMonthClassAttendanceTargets(input.before, input.after);
  if (targets.length === 0) {
    const result: ParentClassAttendanceV4ProcessingResult = {
      liveOutcome: 'delegate_v3',
      liveReason: 'target_unresolved',
      shadowOutcome: 'not_evaluable',
      shadowReason: 'target_unresolved',
      targetCount: 0,
    };
    await dependencies.recordTelemetry({
      db: input.db,
      eventId,
      sessionId,
      incrementalEnabled,
      shadowEnabled,
      result,
    });
    return result;
  }

  if (incrementalEnabled) {
    const guarded = await dependencies.guardedExecute({
      db: input.db,
      incrementalEnabled: true,
      eventId,
      sessionId,
      eventUpdateTime: input.eventUpdateTime,
      before: input.before,
      after: input.after,
      nowMs: input.nowMs,
      authoritativeRecompute: dependencies.authoritativeRecompute,
    });
    if (guarded.mode === 'delegate_v3') {
      await recomputeTargetsV3({
        db: input.db,
        targets,
        nowMs: input.nowMs,
        v3RecomputeTarget: dependencies.v3RecomputeTarget,
      });
    }
    const result: ParentClassAttendanceV4ProcessingResult = {
      liveOutcome: mapGuardedLiveOutcome(guarded),
      liveReason: guardedReason(guarded),
      rawMode: guarded.mode,
      shadowOutcome: 'skipped',
      shadowReason: 'incremental_cutover_enabled',
      targetCount: targets.length,
    };
    await dependencies.recordTelemetry({
      db: input.db,
      eventId,
      sessionId,
      incrementalEnabled,
      shadowEnabled,
      result,
    });
    return result;
  }

  if (shadowEnabled && targets.every((target) => !target.requiresCompatibility)) {
    const preview = await dependencies.shadowPreview({
      db: input.db,
      eventId,
      sessionId,
      eventUpdateTime: input.eventUpdateTime,
      before: input.before,
      after: input.after,
      targets,
      nowMs: input.nowMs,
    });
    const authoritative = await dependencies.authoritativeRecompute({
      db: input.db,
      targets,
      authoritativeEventId: eventId,
      generatedAtMs: input.nowMs,
    });

    if (authoritative.mode === 'certified') {
      let shadow: Pick<ParentClassAttendanceV4ProcessingResult, 'shadowOutcome' | 'shadowReason'>;
      if (preview.mode === 'candidate') {
        shadow = shadowResultFromParity(
          evaluateParentClassAttendanceShadowParity({
            eventId,
            sessionId,
            before: input.before,
            after: input.after,
            baselines: preview.baselines,
            authoritative: authoritativeShadowTargets(authoritative),
            nowMs: input.nowMs,
          }),
        );
      } else if (preview.mode === 'covered') {
        shadow = {
          shadowOutcome: 'covered',
          shadowReason: `authoritative_covered_${preview.targetCount}`,
        };
      } else {
        shadow = { shadowOutcome: 'not_evaluable', shadowReason: preview.reason };
      }

      const result: ParentClassAttendanceV4ProcessingResult = {
        liveOutcome: 'delegate_v3',
        liveReason: 'incremental_cutover_disabled_shadow_authoritative',
        rawMode: 'v3_recomputed',
        ...shadow,
        targetCount: targets.length,
      };
      await dependencies.recordTelemetry({
        db: input.db,
        eventId,
        sessionId,
        incrementalEnabled,
        shadowEnabled,
        result,
      });
      return result;
    }

    await recomputeTargetsV3({
      db: input.db,
      targets,
      nowMs: input.nowMs,
      v3RecomputeTarget: dependencies.v3RecomputeTarget,
    });
    const result: ParentClassAttendanceV4ProcessingResult = {
      liveOutcome: 'delegate_v3',
      liveReason: `shadow_authoritative_${authoritative.reason}_delegate_v3`,
      rawMode: 'v3_recomputed',
      shadowOutcome: 'not_evaluable',
      shadowReason: `authoritative_${authoritative.reason}`,
      targetCount: targets.length,
    };
    await dependencies.recordTelemetry({
      db: input.db,
      eventId,
      sessionId,
      incrementalEnabled,
      shadowEnabled,
      result,
    });
    return result;
  }

  await recomputeTargetsV3({
    db: input.db,
    targets,
    nowMs: input.nowMs,
    v3RecomputeTarget: dependencies.v3RecomputeTarget,
  });
  const compatibility = targets.some((target) => target.requiresCompatibility);
  const result: ParentClassAttendanceV4ProcessingResult = {
    liveOutcome: 'delegate_v3',
    liveReason: incrementalEnabled
      ? 'incremental_delegate_v3'
      : 'incremental_cutover_disabled',
    rawMode: 'v3_recomputed',
    shadowOutcome: shadowEnabled ? 'not_evaluable' : 'skipped',
    shadowReason: shadowEnabled && compatibility
      ? 'compatibility_target'
      : 'shadow_disabled',
    targetCount: targets.length,
  };
  await dependencies.recordTelemetry({
    db: input.db,
    eventId,
    sessionId,
    incrementalEnabled,
    shadowEnabled,
    result,
  });
  return result;
};

export const onClassSessionReadModelWriteV4 = onDocumentWritten(
  {
    document: 'classSessions/{sessionId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.exists
      ? (change.before.data() as Record<string, unknown>)
      : null;
    const afterData = change.after.exists
      ? (change.after.data() as Record<string, unknown>)
      : null;
    const eventUpdateTime = change.after.exists ? change.after.updateTime : null;
    const db = admin.firestore();

    try {
      const result = await processParentClassAttendanceV4Write({
        db,
        eventId: event.id,
        sessionId: event.params.sessionId,
        eventUpdateTime,
        before: beforeData,
        after: afterData,
        incrementalEnabled: process.env[PARENT_CLASS_ATTENDANCE_INCREMENTAL_ENABLED_ENV],
        shadowEnabled: process.env[PARENT_CLASS_ATTENDANCE_SHADOW_ENABLED_ENV],
      });
      logger.info('Parent class-attendance V4 write processed', {
        sessionId: event.params.sessionId,
        ...result,
      });
    } catch (error) {
      logger.error('Parent class-attendance V4 write failed', {
        sessionId: event.params.sessionId,
        error: error instanceof Error ? error.message : String(error || ''),
      });
      throw error;
    }
  },
);
