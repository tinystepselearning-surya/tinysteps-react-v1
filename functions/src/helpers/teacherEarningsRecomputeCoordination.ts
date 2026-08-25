import {
  TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  TEACHER_EARNINGS_TRANSACTION_FENCE,
} from './teacherEarningsIncrementalProtocol';

export const TEACHER_EARNINGS_RECOMPUTE_STATE_IDLE = 'idle';
export const TEACHER_EARNINGS_RECOMPUTE_STATE_IN_PROGRESS = 'in_progress';

export type TeacherEarningsRecomputeClaim = {
  mode: 'claim';
  claimId: string;
  claimEpoch: number;
  revisionBefore: number;
  patch: Record<string, unknown>;
};

export type TeacherEarningsRecomputeClaimDecision =
  | TeacherEarningsRecomputeClaim
  | { mode: 'reject'; reason: string };

export type TeacherEarningsRecomputeFinalizeDecision =
  | {
      mode: 'finalize';
      revisionBefore: number;
      revisionAfter: number;
      patch: Record<string, unknown>;
    }
  | { mode: 'superseded'; reason: string }
  | { mode: 'reject'; reason: string };

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const nonNegativeInteger = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && Number.isInteger(parsed) ? parsed : fallback;
};

/**
 * Pure Brick 7B1 state transition for claiming an authoritative full recompute.
 *
 * The claim increments a monotonic epoch but deliberately does not advance the finance revision.
 * A later claimant supersedes an earlier scan. Only the claimant that still owns the latest epoch
 * may finalize authoritative totals.
 */
export const planTeacherEarningsRecomputeClaim = (input: {
  claimId: unknown;
  rollup: Record<string, unknown> | null;
}): TeacherEarningsRecomputeClaimDecision => {
  const claimId = normalizeText(input.claimId);
  if (!claimId) return { mode: 'reject', reason: 'missing_recompute_claim_id' };

  const rollup = input.rollup || {};
  const currentEpoch = nonNegativeInteger(rollup.incrementalRecomputeEpoch, 0);
  const revisionBefore = nonNegativeInteger(rollup.incrementalRevision, 0);
  const claimEpoch = currentEpoch + 1;

  return {
    mode: 'claim',
    claimId,
    claimEpoch,
    revisionBefore,
    patch: {
      incrementalProtocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
      incrementalTransactionFence: TEACHER_EARNINGS_TRANSACTION_FENCE,
      incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IN_PROGRESS,
      incrementalRecomputeClaimId: claimId,
      incrementalRecomputeEpoch: claimEpoch,
      incrementalRevision: revisionBefore,
    },
  };
};

/**
 * Pure Brick 7B1 state transition for finalizing one authoritative full recompute.
 *
 * A stale scan must never overwrite a newer claimant. Matching claim id + epoch are therefore
 * mandatory. Successful finalization advances the shared revision exactly once and returns the
 * rollup to `idle`, which is the only state a future incremental transaction may accept.
 */
export const planTeacherEarningsRecomputeFinalize = (input: {
  claimId: unknown;
  claimEpoch: unknown;
  rollup: Record<string, unknown> | null;
}): TeacherEarningsRecomputeFinalizeDecision => {
  const claimId = normalizeText(input.claimId);
  const claimEpoch = nonNegativeInteger(input.claimEpoch, -1);
  if (!claimId || claimEpoch < 0) {
    return { mode: 'reject', reason: 'invalid_recompute_claim' };
  }
  if (!input.rollup) return { mode: 'superseded', reason: 'rollup_missing' };

  const rollup = input.rollup;
  const protocolVersion = Number(rollup.incrementalProtocolVersion);
  const fence = normalizeText(rollup.incrementalTransactionFence);
  if (
    !Number.isFinite(protocolVersion) ||
    protocolVersion < TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION ||
    fence !== TEACHER_EARNINGS_TRANSACTION_FENCE
  ) {
    return { mode: 'reject', reason: 'recompute_fence_not_coordinated' };
  }

  const state = normalizeText(rollup.incrementalRecomputeState);
  if (state !== TEACHER_EARNINGS_RECOMPUTE_STATE_IN_PROGRESS) {
    return { mode: 'superseded', reason: 'recompute_not_in_progress' };
  }

  const currentClaimId = normalizeText(rollup.incrementalRecomputeClaimId);
  const currentEpoch = nonNegativeInteger(rollup.incrementalRecomputeEpoch, -1);
  if (currentClaimId !== claimId || currentEpoch !== claimEpoch) {
    return { mode: 'superseded', reason: 'recompute_claim_superseded' };
  }

  const revisionBefore = nonNegativeInteger(rollup.incrementalRevision, 0);
  const revisionAfter = revisionBefore + 1;
  return {
    mode: 'finalize',
    revisionBefore,
    revisionAfter,
    patch: {
      incrementalProtocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
      incrementalTransactionFence: TEACHER_EARNINGS_TRANSACTION_FENCE,
      incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IDLE,
      incrementalRecomputeClaimId: null,
      incrementalRecomputeEpoch: claimEpoch,
      incrementalRevision: revisionAfter,
    },
  };
};
