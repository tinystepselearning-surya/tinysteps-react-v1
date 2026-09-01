import type { ParentMonthClassAttendanceProjection } from '../parentMonthlyClassAttendanceProjectionV3';
import {
  planParentClassAttendanceIncrementalTransaction,
  type ParentClassAttendanceIncrementalBaseline,
} from './parentClassAttendanceIncrementalProtocol';
import type { ParentClassAttendanceRollupTarget } from './parentClassAttendanceRollupDelta';

export type ParentClassAttendanceAuthoritativeShadowTarget = {
  target: ParentClassAttendanceRollupTarget;
  projection: ParentMonthClassAttendanceProjection;
};

export type ParentClassAttendanceShadowParityResult =
  | { mode: 'match'; targetCount: number }
  | { mode: 'mismatch'; mismatchedTargetKeys: string[] }
  | { mode: 'not_evaluable'; reason: string };

const targetKey = (target: ParentClassAttendanceRollupTarget): string =>
  `${target.parentId}__${target.monthKey}`;

const stableValue = (value: unknown): unknown => {
  if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (Array.isArray(value)) return value.map((entry) => stableValue(entry));
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return Object.keys(row)
      .sort()
      .reduce<Record<string, unknown>>((out, key) => {
        out[key] = stableValue(row[key]);
        return out;
      }, {});
  }
  return String(value);
};

const projectionSignature = (projection: ParentMonthClassAttendanceProjection): string =>
  JSON.stringify(stableValue(projection));

const authoritativeMapFor = (
  authoritative: ParentClassAttendanceAuthoritativeShadowTarget[],
): Map<string, ParentClassAttendanceAuthoritativeShadowTarget> | null => {
  const map = new Map<string, ParentClassAttendanceAuthoritativeShadowTarget>();
  for (const entry of authoritative) {
    const key = targetKey(entry.target);
    if (map.has(key)) return null;
    map.set(key, entry);
  }
  return map;
};

/**
 * Brick 1C shadow comparator.
 *
 * This never writes Firestore. It asks Brick 1B what the incremental transaction would produce from
 * a certified baseline, then compares those exact next projections against full authoritative V3
 * projections built from the post-event source snapshot at the same reference time.
 */
export const evaluateParentClassAttendanceShadowParity = (input: {
  eventId: unknown;
  sessionId: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  baselines: ParentClassAttendanceIncrementalBaseline[];
  authoritative: ParentClassAttendanceAuthoritativeShadowTarget[];
  nowMs?: number;
}): ParentClassAttendanceShadowParityResult => {
  const decision = planParentClassAttendanceIncrementalTransaction({
    eventId: input.eventId,
    sessionId: input.sessionId,
    before: input.before,
    after: input.after,
    baselines: input.baselines,
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

  const authoritativeMap = authoritativeMapFor(input.authoritative);
  if (!authoritativeMap) {
    return { mode: 'not_evaluable', reason: 'duplicate_authoritative_target' };
  }
  if (authoritativeMap.size !== decision.mutations.length) {
    return { mode: 'not_evaluable', reason: 'authoritative_target_set_mismatch' };
  }

  const mismatchedTargetKeys: string[] = [];
  for (const mutation of decision.mutations) {
    const key = targetKey(mutation.target);
    const authoritative = authoritativeMap.get(key);
    if (!authoritative) {
      return { mode: 'not_evaluable', reason: 'authoritative_target_set_mismatch' };
    }
    if (
      projectionSignature(mutation.nextProjection) !==
      projectionSignature(authoritative.projection)
    ) {
      mismatchedTargetKeys.push(key);
    }
  }

  if (mismatchedTargetKeys.length > 0) {
    return { mode: 'mismatch', mismatchedTargetKeys: mismatchedTargetKeys.sort() };
  }
  return { mode: 'match', targetCount: decision.mutations.length };
};
