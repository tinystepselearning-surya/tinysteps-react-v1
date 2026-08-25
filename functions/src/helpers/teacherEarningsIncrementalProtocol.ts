import { createHash } from 'node:crypto';
import {
  planTeacherEarningsRollupChange,
  type TeacherEarningsContribution,
  type TeacherMonthRollupTarget,
} from './teacherEarningsRollupDelta';

export const TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION = 1;
export const TEACHER_EARNINGS_TRANSACTION_FENCE = 'transaction_coordinated_v1';

export type TeacherEarningsIncrementalTotals = {
  totalEarnings: number;
  pendingEarnings: number;
  totalSessions: number;
  sessionsCompleted: number;
  demoEarnings: number;
  demoCompletedCount: number;
  demoEnrollmentBonusCount: number;
};

export type TeacherEarningsIncrementalCandidate = {
  mode: 'candidate';
  target: TeacherMonthRollupTarget;
  markerId: string;
  changeSignature: string;
  protocolVersion: number;
  revisionBefore: number;
  revisionAfter: number;
  delta: TeacherEarningsContribution;
  nextTotals: TeacherEarningsIncrementalTotals;
};

export type TeacherEarningsIncrementalDecision =
  | TeacherEarningsIncrementalCandidate
  | { mode: 'covered'; reason: string }
  | { mode: 'fallback'; reason: string }
  | { mode: 'replay'; markerId: string }
  | { mode: 'conflict'; reason: string };

const MONEY_EPSILON = 0.000001;
const COUNT_FIELDS: Array<keyof TeacherEarningsIncrementalTotals> = [
  'totalSessions',
  'sessionsCompleted',
  'demoCompletedCount',
  'demoEnrollmentBonusCount',
];
const TOTAL_FIELDS: Array<keyof TeacherEarningsIncrementalTotals> = [
  'totalEarnings',
  'pendingEarnings',
  'totalSessions',
  'sessionsCompleted',
  'demoEarnings',
  'demoCompletedCount',
  'demoEnrollmentBonusCount',
];

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

const stableValue = (value: unknown): unknown => {
  if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((entry) => stableValue(entry));
  if (typeof value === 'object') {
    const row = value as Record<string, unknown> & {
      toMillis?: () => number;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof row.toMillis === 'function') {
      const millis = row.toMillis();
      return Number.isFinite(millis) ? { __timestampMillis: millis } : { __timestampMillis: null };
    }
    const seconds = finiteNumber(row.seconds ?? row._seconds);
    const nanoseconds = finiteNumber(row.nanoseconds ?? row._nanoseconds ?? 0);
    if (seconds != null) {
      return { __timestampSeconds: seconds, __timestampNanoseconds: nanoseconds ?? 0 };
    }
    return Object.keys(row)
      .sort()
      .reduce<Record<string, unknown>>((out, key) => {
        out[key] = stableValue(row[key]);
        return out;
      }, {});
  }
  return String(value);
};

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

export const teacherEarningsIncrementalMarkerId = (eventId: unknown): string | null => {
  const normalized = normalizeText(eventId);
  if (!normalized) return null;
  return `b7_${sha256(normalized).slice(0, 40)}`;
};

export const teacherEarningsIncrementalChangeSignature = (input: {
  eventId: unknown;
  earningId: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): string | null => {
  const eventId = normalizeText(input.eventId);
  const earningId = normalizeText(input.earningId);
  if (!eventId || !earningId) return null;
  return sha256(
    JSON.stringify(
      stableValue({
        eventId,
        earningId,
        before: input.before,
        after: input.after,
      }),
    ),
  );
};

const rollupMatchesTarget = (
  rollup: Record<string, unknown>,
  target: TeacherMonthRollupTarget,
): boolean => {
  const month = normalizeText(rollup.monthKey || rollup.month);
  return Boolean(month && month === target.monthKey);
};

const readRollupTotals = (
  rollup: Record<string, unknown>,
): TeacherEarningsIncrementalTotals | null => {
  const out = {} as TeacherEarningsIncrementalTotals;
  for (const field of TOTAL_FIELDS) {
    const value = finiteNumber(rollup[field]);
    if (value == null || value < -MONEY_EPSILON) return null;
    out[field] = Math.max(value, 0);
  }
  for (const field of COUNT_FIELDS) {
    if (!Number.isInteger(out[field])) return null;
  }
  return out;
};

const addDelta = (
  totals: TeacherEarningsIncrementalTotals,
  delta: TeacherEarningsContribution,
): TeacherEarningsIncrementalTotals | null => {
  const next = {} as TeacherEarningsIncrementalTotals;
  for (const field of TOTAL_FIELDS) {
    const value = totals[field] + delta[field];
    if (!Number.isFinite(value) || value < -MONEY_EPSILON) return null;
    next[field] = Math.abs(value) < MONEY_EPSILON ? 0 : value;
  }
  for (const field of COUNT_FIELDS) {
    if (!Number.isInteger(next[field]) || next[field] < 0) return null;
  }
  if (next.pendingEarnings - next.totalEarnings > MONEY_EPSILON) return null;
  if (next.demoEarnings - next.totalEarnings > MONEY_EPSILON) return null;
  if (next.sessionsCompleted > next.totalSessions) return null;
  return next;
};

/**
 * Pure Brick 7C gate for a future incremental transaction.
 *
 * The rollup must be transaction-coordinated, idle, and carry an authoritative Firestore commit
 * watermark from the atomic full-recompute transaction. The source teacherEarnings document
 * updateTime is compared with that watermark:
 * - older event => already covered by the authoritative transaction, so no delta is needed;
 * - newer event => not covered and may proceed as an exact delta candidate;
 * - equal/missing timestamps => fail closed to a full recompute.
 *
 * Deletes remain on authoritative recompute at this stage because a deleted document has no
 * post-delete DocumentSnapshot updateTime to use as the source commit watermark.
 */
export const planTeacherEarningsIncrementalTransaction = (input: {
  eventId: unknown;
  earningId: unknown;
  eventUpdateTime: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  rollup: Record<string, unknown> | null;
  allowCertifiedSessionCreate?: boolean;
}): TeacherEarningsIncrementalDecision => {
  const markerId = teacherEarningsIncrementalMarkerId(input.eventId);
  const changeSignature = teacherEarningsIncrementalChangeSignature(input);
  if (!markerId || !changeSignature) return { mode: 'fallback', reason: 'missing_event_identity' };

  const plan = planTeacherEarningsRollupChange({
    earningId: normalizeText(input.earningId),
    before: input.before,
    after: input.after,
    allowCertifiedSessionCreate: input.allowCertifiedSessionCreate,
  });
  if (plan.mode !== 'delta') {
    return {
      mode: 'fallback',
      reason: plan.mode === 'recompute' ? `planner_${plan.reason}` : 'planner_noop',
    };
  }

  if (!input.after) {
    return { mode: 'fallback', reason: 'incremental_delete_requires_recompute' };
  }

  if (!input.rollup) return { mode: 'fallback', reason: 'rollup_missing' };
  const rollup = input.rollup;
  const source = normalizeText(rollup.rollupSource);
  const rollupVersion = finiteNumber(rollup.rollupVersion);
  const protocolVersion = finiteNumber(rollup.incrementalProtocolVersion);
  const transactionFence = normalizeText(rollup.incrementalTransactionFence);
  const recomputeState = normalizeText(rollup.incrementalRecomputeState);
  const revisionBefore = nonNegativeInteger(rollup.incrementalRevision);

  if (source !== 'teacherEarnings_events_v1' || rollupVersion == null || rollupVersion < 1) {
    return { mode: 'fallback', reason: 'rollup_not_authoritative_v1' };
  }
  if (!rollupMatchesTarget(rollup, plan.target)) {
    return { mode: 'fallback', reason: 'rollup_target_mismatch' };
  }
  if (
    protocolVersion == null ||
    protocolVersion < TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION ||
    transactionFence !== TEACHER_EARNINGS_TRANSACTION_FENCE ||
    revisionBefore == null
  ) {
    return { mode: 'fallback', reason: 'recompute_not_transaction_coordinated' };
  }
  if (recomputeState !== 'idle') {
    return { mode: 'fallback', reason: 'recompute_in_progress' };
  }

  const authoritativeCommittedAt = timestampMillis(rollup.incrementalAuthoritativeCommittedAt);
  const eventUpdateAt = timestampMillis(input.eventUpdateTime);
  if (authoritativeCommittedAt == null || eventUpdateAt == null) {
    return { mode: 'fallback', reason: 'authoritative_watermark_missing' };
  }
  if (eventUpdateAt < authoritativeCommittedAt) {
    return { mode: 'covered', reason: 'event_already_in_authoritative_baseline' };
  }
  if (eventUpdateAt === authoritativeCommittedAt) {
    return { mode: 'fallback', reason: 'authoritative_watermark_ambiguous' };
  }

  const currentTotals = readRollupTotals(rollup);
  if (!currentTotals) return { mode: 'fallback', reason: 'rollup_totals_invalid' };
  const nextTotals = addDelta(currentTotals, plan.delta);
  if (!nextTotals) return { mode: 'fallback', reason: 'delta_would_violate_rollup_invariants' };

  return {
    mode: 'candidate',
    target: plan.target,
    markerId,
    changeSignature,
    protocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
    revisionBefore,
    revisionAfter: revisionBefore + 1,
    delta: plan.delta,
    nextTotals,
  };
};

/**
 * Validates an existing idempotency marker before treating an event as an exact replay.
 * A marker with the same document id but a different change signature is a hard conflict and must
 * never be silently accepted as idempotent.
 */
export const evaluateTeacherEarningsIncrementalReplay = (input: {
  markerId: string;
  changeSignature: string;
  existingMarker: Record<string, unknown> | null;
}): TeacherEarningsIncrementalDecision | null => {
  if (!input.existingMarker) return null;
  const existingSignature = normalizeText(input.existingMarker.changeSignature);
  const existingProtocolVersion = finiteNumber(input.existingMarker.protocolVersion);
  if (
    existingSignature === input.changeSignature &&
    existingProtocolVersion != null &&
    existingProtocolVersion >= TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION
  ) {
    return { mode: 'replay', markerId: input.markerId };
  }
  return { mode: 'conflict', reason: 'idempotency_marker_mismatch' };
};
