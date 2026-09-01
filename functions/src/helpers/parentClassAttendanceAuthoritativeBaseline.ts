import * as admin from 'firebase-admin';
import {
  MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
  buildParentMonthClassAttendanceProjection,
  classAttendanceProjectionInvariantErrors,
  isMissingAttendanceIndexError,
  resolveSessionClassAttendanceTarget,
  type ParentMonthClassAttendanceProjection,
  type ParentMonthClassAttendanceTarget,
} from '../parentMonthlyClassAttendanceProjectionV3';
import {
  PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
  PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE,
  PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE,
} from './parentClassAttendanceIncrementalProtocol';

const MONTH_RE = /^(\d{4})-(\d{2})$/;

export const PARENT_CLASS_ATTENDANCE_BASELINE_SOURCE =
  'class_sessions_parent_date_transaction_v1';

export type ParentClassAttendanceBaselineTarget = Pick<
  ParentMonthClassAttendanceTarget,
  'parentId' | 'monthKey' | 'requiresCompatibility'
>;

export type ParentClassAttendanceCertifiedBaseline = {
  mode: 'certified';
  target: ParentClassAttendanceBaselineTarget;
  projection: ParentMonthClassAttendanceProjection;
  revisionBefore: number;
  revisionAfter: number;
  baselineEpochBefore: number;
  baselineEpochAfter: number;
  sourceDocumentsRead: number;
  generatedAtMs: number;
  readModelPatch: Record<string, unknown>;
};

export type ParentClassAttendanceBaselineDecision =
  | ParentClassAttendanceCertifiedBaseline
  | { mode: 'fallback'; reason: string };

export type ParentClassAttendanceBaselineTransactionResult =
  | {
      mode: 'certified';
      target: ParentClassAttendanceBaselineTarget;
      projection: ParentMonthClassAttendanceProjection;
      revisionAfter: number;
      baselineEpochAfter: number;
      sourceDocumentsRead: number;
    }
  | { mode: 'fallback'; reason: string };

export type ParentClassAttendanceBaselineCoverage =
  | { mode: 'covered'; reason: 'event_precedes_authoritative_commit' }
  | { mode: 'uncovered'; reason: 'event_follows_authoritative_commit' }
  | { mode: 'fallback'; reason: string };

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const finiteNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const optionalNonNegativeInteger = (
  value: unknown,
): { ok: true; value: number } | { ok: false } => {
  if (value == null || value === '') return { ok: true, value: 0 };
  const parsed = finiteNumber(value);
  if (parsed == null || parsed < 0 || !Number.isInteger(parsed)) return { ok: false };
  return { ok: true, value: parsed };
};

const timestampMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object') {
    const row = value as {
      toMillis?: () => number;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof row.toMillis === 'function') {
      const millis = row.toMillis();
      return Number.isFinite(millis) ? millis : null;
    }
    const seconds = finiteNumber(row.seconds ?? row._seconds);
    const nanoseconds = finiteNumber(row.nanoseconds ?? row._nanoseconds ?? 0);
    if (seconds != null) return seconds * 1000 + (nanoseconds ?? 0) / 1_000_000;
  }
  return null;
};

const monthDateRange = (
  monthKey: string,
): { startYmd: string; endYmd: string } | null => {
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

const readPreviousAttendance = (
  readModel: Record<string, unknown> | null,
): Record<string, unknown> => {
  if (!readModel) return {};
  const attendance = readModel.attendance;
  return attendance && typeof attendance === 'object'
    ? (attendance as Record<string, unknown>)
    : {};
};

const sessionsForExactTarget = (
  sessions: Array<Record<string, unknown>>,
  target: ParentClassAttendanceBaselineTarget,
): Array<Record<string, unknown>> =>
  sessions.filter((session) => {
    const resolved = resolveSessionClassAttendanceTarget(session);
    return resolved?.parentId === target.parentId && resolved.monthKey === target.monthKey;
  });

/**
 * Pure Brick 1C baseline builder.
 *
 * A baseline is certifiable only from the canonical parentId + date bounded source set. Legacy
 * compatibility scans deliberately remain outside the incremental protocol because they cannot
 * prove a precise month snapshot cheaply or safely.
 */
export const buildParentClassAttendanceCertifiedBaseline = (input: {
  target: ParentClassAttendanceBaselineTarget;
  sessions: Array<Record<string, unknown>>;
  sourceDocumentsRead?: number;
  previousReadModel: Record<string, unknown> | null;
  authoritativeEventId: unknown;
  generatedAtMs?: number;
}): ParentClassAttendanceBaselineDecision => {
  const eventId = normalizeText(input.authoritativeEventId);
  if (!eventId) return { mode: 'fallback', reason: 'missing_authoritative_event_identity' };
  if (input.target.requiresCompatibility) {
    return { mode: 'fallback', reason: 'legacy_target_requires_compatibility' };
  }
  if (!monthDateRange(input.target.monthKey)) {
    return { mode: 'fallback', reason: 'invalid_target_month' };
  }

  const sourceDocumentsRead = input.sourceDocumentsRead ?? input.sessions.length;
  if (
    !Number.isInteger(sourceDocumentsRead) ||
    sourceDocumentsRead < 0 ||
    sourceDocumentsRead > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS ||
    input.sessions.length > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS
  ) {
    return { mode: 'fallback', reason: 'authoritative_source_cap_exceeded' };
  }

  const exactSessions = sessionsForExactTarget(input.sessions, input.target);
  if (exactSessions.length !== input.sessions.length) {
    return { mode: 'fallback', reason: 'authoritative_source_target_mismatch' };
  }

  const generatedAtMs = input.generatedAtMs ?? Date.now();
  if (!Number.isFinite(generatedAtMs) || generatedAtMs <= 0) {
    return { mode: 'fallback', reason: 'invalid_generated_at' };
  }

  const projection = buildParentMonthClassAttendanceProjection(
    exactSessions,
    input.target.monthKey,
    generatedAtMs,
  );
  const invariantErrors = classAttendanceProjectionInvariantErrors(projection);
  if (invariantErrors.length > 0) {
    return { mode: 'fallback', reason: 'authoritative_projection_invariant_failure' };
  }

  const previousAttendance = readPreviousAttendance(input.previousReadModel);
  const revision = optionalNonNegativeInteger(previousAttendance.incrementalRevision);
  const epoch = optionalNonNegativeInteger(previousAttendance.incrementalBaselineEpoch);
  if (!revision.ok) return { mode: 'fallback', reason: 'existing_revision_invalid' };
  if (!epoch.ok) return { mode: 'fallback', reason: 'existing_baseline_epoch_invalid' };

  const revisionAfter = revision.value + 1;
  const baselineEpochAfter = epoch.value + 1;
  const attendancePatch: Record<string, unknown> = {
    schemaVersion: 3,
    modelType: 'class_attendance_v3',
    classAuthority: 'class_sessions',
    attendanceAuthority: 'completed_session_attendance',
    childRowsAuthoritative: true,
    totalsScope: 'parent_month_child_session_instances',
    timeClassificationAsOfMs: generatedAtMs,
    timeBucketsRecomputableFromPendingStarts: true,
    queryMode: 'parentId_date_month_transaction',
    sourceSessionCount: exactSessions.length,
    sourceDocumentsRead,
    maxSourceSessionCount: MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
    unassignedSessionRecords: projection.unassignedSessionRecords,
    legacyKidAliasOnlySessionRecords: projection.legacyKidAliasOnlySessionRecords,
    generatedAtMs,
    totals: projection.totals,
    byKid: projection.byKid,
    incrementalProtocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
    incrementalTransactionFence: PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE,
    incrementalRecomputeState: PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE,
    incrementalRevision: revisionAfter,
    incrementalBaselineEpoch: baselineEpochAfter,
    incrementalBaselineSource: PARENT_CLASS_ATTENDANCE_BASELINE_SOURCE,
    incrementalLastAuthoritativeEventId: eventId,
  };

  return {
    mode: 'certified',
    target: input.target,
    projection,
    revisionBefore: revision.value,
    revisionAfter,
    baselineEpochBefore: epoch.value,
    baselineEpochAfter,
    sourceDocumentsRead,
    generatedAtMs,
    readModelPatch: {
      parentId: input.target.parentId,
      monthKey: input.target.monthKey,
      attendance: attendancePatch,
    },
  };
};

/**
 * Classifies whether a create/update CloudEvent is already represented by a transaction-certified
 * baseline. Deletes intentionally fail closed because the deleted document has no post-delete
 * updateTime that can prove the delete commit preceded the baseline transaction.
 */
export const classifyParentClassAttendanceEventAgainstBaseline = (input: {
  afterExists: boolean;
  eventUpdateTime: unknown;
  authoritativeCommittedAt: unknown;
}): ParentClassAttendanceBaselineCoverage => {
  if (!input.afterExists) {
    return { mode: 'fallback', reason: 'delete_event_requires_authoritative_recompute' };
  }
  const eventMs = timestampMillis(input.eventUpdateTime);
  const baselineMs = timestampMillis(input.authoritativeCommittedAt);
  if (eventMs == null || baselineMs == null) {
    return { mode: 'fallback', reason: 'authoritative_watermark_missing' };
  }
  if (eventMs < baselineMs) {
    return { mode: 'covered', reason: 'event_precedes_authoritative_commit' };
  }
  if (eventMs > baselineMs) {
    return { mode: 'uncovered', reason: 'event_follows_authoritative_commit' };
  }
  return { mode: 'fallback', reason: 'authoritative_watermark_ambiguous' };
};

const parentMonthReadModelRef = (
  db: admin.firestore.Firestore,
  target: ParentClassAttendanceBaselineTarget,
) =>
  db
    .collection('parentMonthlyReadModels')
    .doc(target.parentId)
    .collection('months')
    .doc(target.monthKey);

const canonicalMonthQuery = (
  db: admin.firestore.Firestore,
  target: ParentClassAttendanceBaselineTarget,
) => {
  const range = monthDateRange(target.monthKey);
  if (!range) return null;
  return db
    .collection('classSessions')
    .where('parentId', '==', target.parentId)
    .where('date', '>=', range.startYmd)
    .where('date', '<=', range.endYmd)
    .limit(MAX_PARENT_MONTH_ATTENDANCE_SESSIONS + 1);
};

/**
 * Brick 1C transaction coordinator for a future cutover/shadow runner.
 *
 * The read-model document and canonical parent-month classSessions query are read inside the same
 * Firestore transaction. Firestore retries the transaction when either the rollup document or the
 * query result changes concurrently, so the certification fence/revision describes one serializable
 * authoritative source snapshot. This helper is intentionally not wired to the deployed trigger yet.
 */
export const recomputeParentClassAttendanceAuthoritativeBaseline = async (input: {
  db: admin.firestore.Firestore;
  target: ParentClassAttendanceBaselineTarget;
  authoritativeEventId: unknown;
  generatedAtMs?: number;
}): Promise<ParentClassAttendanceBaselineTransactionResult> => {
  const eventId = normalizeText(input.authoritativeEventId);
  if (!eventId) return { mode: 'fallback', reason: 'missing_authoritative_event_identity' };
  if (input.target.requiresCompatibility) {
    return { mode: 'fallback', reason: 'legacy_target_requires_compatibility' };
  }
  const query = canonicalMonthQuery(input.db, input.target);
  if (!query) return { mode: 'fallback', reason: 'invalid_target_month' };

  const readModelRef = parentMonthReadModelRef(input.db, input.target);
  const generatedAtMs = input.generatedAtMs ?? Date.now();

  try {
    return await input.db.runTransaction(async (tx) => {
      const readModelSnap = await tx.get(readModelRef);
      const sessionSnap = await tx.get(query);
      if (sessionSnap.size > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
        return { mode: 'fallback', reason: 'authoritative_source_cap_exceeded' } as const;
      }

      const sessions = sessionSnap.docs.map(
        (docSnap) => (docSnap.data() || {}) as Record<string, unknown>,
      );
      const previousReadModel = readModelSnap.exists
        ? ((readModelSnap.data() || {}) as Record<string, unknown>)
        : null;
      const built = buildParentClassAttendanceCertifiedBaseline({
        target: input.target,
        sessions,
        sourceDocumentsRead: sessionSnap.size,
        previousReadModel,
        authoritativeEventId: eventId,
        generatedAtMs,
      });
      if (built.mode !== 'certified') return built;

      const attendance = (built.readModelPatch.attendance || {}) as Record<string, unknown>;
      tx.set(
        readModelRef,
        {
          ...built.readModelPatch,
          attendance: {
            ...attendance,
            incrementalAuthoritativeCommittedAt: admin.firestore.FieldValue.serverTimestamp(),
            refreshedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        },
        { merge: true },
      );

      return {
        mode: 'certified',
        target: built.target,
        projection: built.projection,
        revisionAfter: built.revisionAfter,
        baselineEpochAfter: built.baselineEpochAfter,
        sourceDocumentsRead: built.sourceDocumentsRead,
      } as const;
    });
  } catch (error) {
    if (isMissingAttendanceIndexError(error)) {
      return { mode: 'fallback', reason: 'authoritative_query_requires_index' };
    }
    throw error;
  }
};
