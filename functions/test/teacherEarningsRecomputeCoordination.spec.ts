import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  planTeacherEarningsRecomputeClaim,
  planTeacherEarningsRecomputeFinalize,
  TEACHER_EARNINGS_RECOMPUTE_STATE_IDLE,
  TEACHER_EARNINGS_RECOMPUTE_STATE_IN_PROGRESS,
} from '../src/helpers/teacherEarningsRecomputeCoordination';
import {
  planTeacherEarningsIncrementalTransaction,
  TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  TEACHER_EARNINGS_TRANSACTION_FENCE,
} from '../src/helpers/teacherEarningsIncrementalProtocol';

const baseRollup = {
  month: '2026-08',
  totalEarnings: 1000,
  pendingEarnings: 600,
  totalSessions: 5,
  sessionsCompleted: 5,
  demoEarnings: 100,
  demoCompletedCount: 1,
  demoEnrollmentBonusCount: 0,
  rollupSource: 'teacherEarnings_events_v1',
  rollupVersion: 1,
  incrementalProtocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  incrementalTransactionFence: TEACHER_EARNINGS_TRANSACTION_FENCE,
  incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IDLE,
  incrementalRecomputeEpoch: 7,
  incrementalRevision: 12,
};

const demoCreate = {
  eventId: 'evt-demo-1',
  earningId: 'demo_demo-1_completion',
  before: null,
  after: {
    teacherId: 'teacher-1',
    monthKey: '2026-08',
    amount: 100,
    status: 'unpaid',
    source: 'demo_completed',
  },
};

describe('B6 Brick 7B1 authoritative recompute coordination', () => {
  it('claims a recompute by incrementing epoch without advancing finance revision', () => {
    const decision = planTeacherEarningsRecomputeClaim({
      claimId: 'evt-1__teacher-1__2026-08',
      rollup: baseRollup,
    });

    expect(decision).toEqual({
      mode: 'claim',
      claimId: 'evt-1__teacher-1__2026-08',
      claimEpoch: 8,
      revisionBefore: 12,
      patch: {
        incrementalProtocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
        incrementalTransactionFence: TEACHER_EARNINGS_TRANSACTION_FENCE,
        incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IN_PROGRESS,
        incrementalRecomputeClaimId: 'evt-1__teacher-1__2026-08',
        incrementalRecomputeEpoch: 8,
        incrementalRevision: 12,
      },
    });
  });

  it('allows a later claim to supersede an earlier scan with a higher epoch', () => {
    const first = planTeacherEarningsRecomputeClaim({ claimId: 'claim-a', rollup: baseRollup });
    expect(first.mode).toBe('claim');
    if (first.mode !== 'claim') return;

    const second = planTeacherEarningsRecomputeClaim({
      claimId: 'claim-b',
      rollup: { ...baseRollup, ...first.patch },
    });
    expect(second.mode).toBe('claim');
    if (second.mode !== 'claim') return;
    expect(second.claimEpoch).toBe(first.claimEpoch + 1);
    expect(second.revisionBefore).toBe(first.revisionBefore);
  });

  it('refuses a stale finalizer after a newer claim supersedes it', () => {
    const decision = planTeacherEarningsRecomputeFinalize({
      claimId: 'claim-a',
      claimEpoch: 8,
      rollup: {
        ...baseRollup,
        incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IN_PROGRESS,
        incrementalRecomputeClaimId: 'claim-b',
        incrementalRecomputeEpoch: 9,
      },
    });

    expect(decision).toEqual({ mode: 'superseded', reason: 'recompute_claim_superseded' });
  });

  it('finalizes only the current claim, advances revision once, and returns to idle', () => {
    const decision = planTeacherEarningsRecomputeFinalize({
      claimId: 'claim-a',
      claimEpoch: 8,
      rollup: {
        ...baseRollup,
        incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IN_PROGRESS,
        incrementalRecomputeClaimId: 'claim-a',
        incrementalRecomputeEpoch: 8,
      },
    });

    expect(decision).toEqual({
      mode: 'finalize',
      revisionBefore: 12,
      revisionAfter: 13,
      patch: {
        incrementalProtocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
        incrementalTransactionFence: TEACHER_EARNINGS_TRANSACTION_FENCE,
        incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IDLE,
        incrementalRecomputeClaimId: null,
        incrementalRecomputeEpoch: 8,
        incrementalRevision: 13,
      },
    });
  });

  it('rejects malformed claims rather than fabricating coordination identity', () => {
    expect(planTeacherEarningsRecomputeClaim({ claimId: '', rollup: baseRollup })).toEqual({
      mode: 'reject',
      reason: 'missing_recompute_claim_id',
    });
    expect(
      planTeacherEarningsRecomputeFinalize({ claimId: '', claimEpoch: 8, rollup: baseRollup }),
    ).toEqual({ mode: 'reject', reason: 'invalid_recompute_claim' });
  });

  it('blocks a future incremental candidate while an authoritative recompute is in progress', () => {
    const decision = planTeacherEarningsIncrementalTransaction({
      ...demoCreate,
      rollup: {
        ...baseRollup,
        incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IN_PROGRESS,
        incrementalRecomputeClaimId: 'claim-a',
      },
    });

    expect(decision).toEqual({ mode: 'fallback', reason: 'recompute_in_progress' });
  });

  it('does not wire the 7B coordinator into the live trigger before the 7B1 checkpoint is green', () => {
    const liveTriggerSource = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/teacherEarningsRollupTrigger.ts'),
      'utf8',
    );

    expect(liveTriggerSource).not.toContain('teacherEarningsRecomputeCoordination');
    expect(liveTriggerSource).toContain('authoritativeTeacherEarningsRollupWrite.run(event)');
  });
});
