import { createHash } from 'node:crypto';
import {
  applyParentClassAttendanceRollupOperation,
  planParentClassAttendanceRollupChange,
  type ParentClassAttendanceRollupOperation,
  type ParentClassAttendanceRollupTarget,
} from './parentClassAttendanceRollupDelta';
import type {
  ParentMonthClassAttendanceProjection,
} from '../parentMonthlyClassAttendanceProjectionV3';

export const PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION = 1;
export const PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE = 'parent_class_attendance_transaction_v1';
export const PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE = 'idle';

export type ParentClassAttendanceIncrementalMutation = {
  target: ParentClassAttendanceRollupTarget;
  revisionBefore: number;
  revisionAfter: number;
  nextProjection: ParentMonthClassAttendanceProjection;
};

export type ParentClassAttendanceIncrementalCandidate = {
  mode: 'candidate';
  markerId: string;
  changeSignature: string;
  protocolVersion: number;
  mutations: ParentClassAttendanceIncrementalMutation[];
};

export type ParentClassAttendanceIncrementalDecision =
  | ParentClassAttendanceIncrementalCandidate
  | { mode: 'noop'; reason: string }
  | { mode: 'fallback'; reason: string }
  | { mode: 'replay'; markerId: string }
  | { mode: 'conflict'; reason: string };

export type ParentClassAttendanceIncrementalBaseline = {
  target: ParentClassAttendanceRollupTarget;
  readModel: Record<string, unknown> | null;
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

const stableValue = (value: unknown): unknown => {
  if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (value instanceof Date) return { __dateMillis: value.getTime() };
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

const targetKey = (target: ParentClassAttendanceRollupTarget): string =>
  `${target.parentId}__${target.monthKey}`;

const sameTarget = (
  a: ParentClassAttendanceRollupTarget,
  b: ParentClassAttendanceRollupTarget,
): boolean => a.parentId === b.parentId && a.monthKey === b.monthKey;

export const parentClassAttendanceIncrementalMarkerId = (eventId: unknown): string | null => {
  const normalized = normalizeText(eventId);
  if (!normalized) return null;
  return `pca1_${sha256(normalized).slice(0, 40)}`;
};

export const parentClassAttendanceIncrementalChangeSignature = (input: {
  eventId: unknown;
  sessionId: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): string | null => {
  const eventId = normalizeText(input.eventId);
  const sessionId = normalizeText(input.sessionId);
  if (!eventId || !sessionId) return null;
  return sha256(
    JSON.stringify(
      stableValue({
        eventId,
        sessionId,
        before: input.before,
        after: input.after,
      }),
    ),
  );
};

const readProjection = (
  baseline: ParentClassAttendanceIncrementalBaseline,
): {
  revision: number;
  projection: ParentMonthClassAttendanceProjection;
} | { reason: string } => {
  const readModel = baseline.readModel;
  if (!readModel) return { reason: 'baseline_missing' };

  const parentId = normalizeText(readModel.parentId);
  const monthKey = normalizeText(readModel.monthKey);
  if (
    !parentId ||
    !monthKey ||
    parentId !== baseline.target.parentId ||
    monthKey !== baseline.target.monthKey
  ) {
    return { reason: 'baseline_target_mismatch' };
  }

  const attendanceRaw = readModel.attendance;
  if (!attendanceRaw || typeof attendanceRaw !== 'object') {
    return { reason: 'attendance_projection_missing' };
  }
  const attendance = attendanceRaw as Record<string, unknown>;
  const schemaVersion = finiteNumber(attendance.schemaVersion);
  const modelType = normalizeText(attendance.modelType);
  if (schemaVersion !== 3 || modelType !== 'class_attendance_v3') {
    return { reason: 'attendance_projection_not_authoritative_v3' };
  }

  const protocolVersion = finiteNumber(attendance.incrementalProtocolVersion);
  const transactionFence = normalizeText(attendance.incrementalTransactionFence);
  const recomputeState = normalizeText(attendance.incrementalRecomputeState);
  const revision = nonNegativeInteger(attendance.incrementalRevision);
  if (
    protocolVersion == null ||
    protocolVersion < PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION ||
    transactionFence !== PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE ||
    revision == null
  ) {
    return { reason: 'baseline_not_transaction_coordinated' };
  }
  if (recomputeState !== PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE) {
    return { reason: 'recompute_in_progress' };
  }

  const totals = attendance.totals;
  const byKid = attendance.byKid;
  const sourceSessionRecords = nonNegativeInteger(
    attendance.sourceSessionRecords ?? attendance.sourceSessionCount,
  );
  const unassignedSessionRecords = nonNegativeInteger(attendance.unassignedSessionRecords ?? 0);
  const legacyKidAliasOnlySessionRecords = nonNegativeInteger(
    attendance.legacyKidAliasOnlySessionRecords ?? 0,
  );
  if (
    !totals ||
    typeof totals !== 'object' ||
    !byKid ||
    typeof byKid !== 'object' ||
    Array.isArray(byKid) ||
    sourceSessionRecords == null ||
    unassignedSessionRecords == null ||
    legacyKidAliasOnlySessionRecords == null
  ) {
    return { reason: 'attendance_projection_shape_invalid' };
  }

  return {
    revision,
    projection: {
      totals: totals as ParentMonthClassAttendanceProjection['totals'],
      byKid: byKid as ParentMonthClassAttendanceProjection['byKid'],
      sourceSessionRecords,
      unassignedSessionRecords,
      legacyKidAliasOnlySessionRecords,
    },
  };
};

const baselineMapFor = (
  baselines: ParentClassAttendanceIncrementalBaseline[],
): Map<string, ParentClassAttendanceIncrementalBaseline> | null => {
  const map = new Map<string, ParentClassAttendanceIncrementalBaseline>();
  for (const baseline of baselines) {
    const key = targetKey(baseline.target);
    if (map.has(key)) return null;
    map.set(key, baseline);
  }
  return map;
};

/**
 * Pure Brick 1B gate for a future transaction executor.
 *
 * This helper deliberately does not infer whether a CloudEvent is already covered by an
 * authoritative classSessions snapshot. Brick 1C must establish that baseline coordination first.
 * Until then, only explicitly certified V3 read models carrying this protocol/fence/revision can
 * produce a candidate. Any missing or ambiguous prerequisite fails closed to the existing full
 * parent-month recompute path.
 */
export const planParentClassAttendanceIncrementalTransaction = (input: {
  eventId: unknown;
  sessionId: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  baselines: ParentClassAttendanceIncrementalBaseline[];
  nowMs?: number;
}): ParentClassAttendanceIncrementalDecision => {
  const markerId = parentClassAttendanceIncrementalMarkerId(input.eventId);
  const changeSignature = parentClassAttendanceIncrementalChangeSignature(input);
  if (!markerId || !changeSignature) {
    return { mode: 'fallback', reason: 'missing_event_identity' };
  }

  const plan = planParentClassAttendanceRollupChange({
    before: input.before,
    after: input.after,
    nowMs: input.nowMs,
  });
  if (plan.mode === 'noop') return { mode: 'noop', reason: 'planner_noop' };
  if (plan.mode === 'recompute') {
    return { mode: 'fallback', reason: `planner_${plan.reason}` };
  }

  const baselineMap = baselineMapFor(input.baselines);
  if (!baselineMap) return { mode: 'fallback', reason: 'duplicate_baseline_target' };
  if (baselineMap.size !== plan.operations.length) {
    return { mode: 'fallback', reason: 'baseline_target_set_mismatch' };
  }

  const mutations: ParentClassAttendanceIncrementalMutation[] = [];
  for (const operation of plan.operations) {
    const baseline = baselineMap.get(targetKey(operation.target));
    if (!baseline || !sameTarget(baseline.target, operation.target)) {
      return { mode: 'fallback', reason: 'baseline_target_set_mismatch' };
    }
    const parsed = readProjection(baseline);
    if ('reason' in parsed) return { mode: 'fallback', reason: parsed.reason };

    const nextProjection = applyParentClassAttendanceRollupOperation({
      base: parsed.projection,
      operation,
      nowMs: input.nowMs,
    });
    if (!nextProjection) {
      return { mode: 'fallback', reason: 'delta_would_violate_projection_invariants' };
    }

    mutations.push({
      target: operation.target,
      revisionBefore: parsed.revision,
      revisionAfter: parsed.revision + 1,
      nextProjection,
    });
  }

  return {
    mode: 'candidate',
    markerId,
    changeSignature,
    protocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
    mutations,
  };
};

/**
 * Validates an existing event marker before treating a delivery as an exact replay.
 * Reusing the same marker id with any other signature/protocol is a hard conflict.
 */
export const evaluateParentClassAttendanceIncrementalReplay = (input: {
  markerId: string;
  changeSignature: string;
  existingMarker: Record<string, unknown> | null;
}): ParentClassAttendanceIncrementalDecision | null => {
  if (!input.existingMarker) return null;
  const existingSignature = normalizeText(input.existingMarker.changeSignature);
  const existingProtocolVersion = finiteNumber(input.existingMarker.protocolVersion);
  if (
    existingSignature === input.changeSignature &&
    existingProtocolVersion === PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION
  ) {
    return { mode: 'replay', markerId: input.markerId };
  }
  return { mode: 'conflict', reason: 'idempotency_marker_mismatch' };
};

export const parentClassAttendanceOperationTargetKey = (
  operation: ParentClassAttendanceRollupOperation,
): string => targetKey(operation.target);
