import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateTeacherEarningsIncrementalReplay,
  planTeacherEarningsIncrementalTransaction,
  TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  TEACHER_EARNINGS_TRANSACTION_FENCE,
  teacherEarningsIncrementalChangeSignature,
  teacherEarningsIncrementalMarkerId,
} from '../src/helpers/teacherEarningsIncrementalProtocol';

const coordinatedRollup = {
  month: '2026-08',
  totalEarnings: 1000,
  pendingEarnings: 600,
  totalSessions: 5,
  sessionsCompleted: 5,
  demoEarnings: 100,
  demoCompletedCount: 1,
  demoEnrollmentBonusCount: 0,
  payments: [],
  rollupSource: 'teacherEarnings_events_v1',
  rollupVersion: 1,
  incrementalProtocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  incrementalTransactionFence: TEACHER_EARNINGS_TRANSACTION_FENCE,
  incrementalRecomputeState: 'idle',
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

describe('B6 Brick 7A teacher earnings incremental transaction protocol', () => {
  it('derives deterministic path-safe marker ids and change signatures', () => {
    const markerA = teacherEarningsIncrementalMarkerId('projects/demo/events/abc?retry=1');
    const markerB = teacherEarningsIncrementalMarkerId('projects/demo/events/abc?retry=1');
    expect(markerA).toBe(markerB);
    expect(markerA).toMatch(/^b7_[a-f0-9]{40}$/);

    const signatureA = teacherEarningsIncrementalChangeSignature({
      eventId: 'evt-1',
      earningId: 'earning-1',
      before: { b: 2, a: 1 },
      after: { amount: 100, teacherId: 'teacher-1' },
    });
    const signatureB = teacherEarningsIncrementalChangeSignature({
      eventId: 'evt-1',
      earningId: 'earning-1',
      before: { a: 1, b: 2 },
      after: { teacherId: 'teacher-1', amount: 100 },
    });
    expect(signatureA).toBe(signatureB);
  });

  it('fails closed for current authoritative rollups until full recompute is transaction-coordinated', () => {
    const decision = planTeacherEarningsIncrementalTransaction({
      ...demoCreate,
      rollup: {
        ...coordinatedRollup,
        incrementalProtocolVersion: undefined,
        incrementalTransactionFence: undefined,
        incrementalRevision: undefined,
      },
    });

    expect(decision).toEqual({
      mode: 'fallback',
      reason: 'recompute_not_transaction_coordinated',
    });
  });

  it('builds an exact delta candidate only for a transaction-coordinated rollup', () => {
    const decision = planTeacherEarningsIncrementalTransaction({
      ...demoCreate,
      rollup: coordinatedRollup,
    });

    expect(decision.mode).toBe('candidate');
    if (decision.mode !== 'candidate') return;

    expect(decision.target).toEqual({ teacherId: 'teacher-1', monthKey: '2026-08' });
    expect(decision.revisionBefore).toBe(12);
    expect(decision.revisionAfter).toBe(13);
    expect(decision.delta).toMatchObject({
      totalEarnings: 100,
      pendingEarnings: 100,
      demoEarnings: 100,
      demoCompletedCount: 1,
    });
    expect(decision.nextTotals).toEqual({
      totalEarnings: 1100,
      pendingEarnings: 700,
      totalSessions: 5,
      sessionsCompleted: 5,
      demoEarnings: 200,
      demoCompletedCount: 2,
      demoEnrollmentBonusCount: 0,
    });
  });

  it('still refuses a new session earning until duplicate/canonical session-create coverage is separately proven', () => {
    const decision = planTeacherEarningsIncrementalTransaction({
      eventId: 'evt-session-1',
      earningId: 'session-1',
      before: null,
      after: {
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        amount: 175,
        status: 'unpaid',
        source: 'session_present_completed',
        sessionId: 'session-1',
      },
      rollup: coordinatedRollup,
    });

    expect(decision).toEqual({
      mode: 'fallback',
      reason: 'planner_session_create_or_delete',
    });
  });

  it('keeps payout mutations on authoritative recompute', () => {
    const before = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      amount: 175,
      status: 'unpaid',
      source: 'session_present_completed',
      sessionId: 'session-1',
    };
    const decision = planTeacherEarningsIncrementalTransaction({
      eventId: 'evt-payout-1',
      earningId: 'session-1',
      before,
      after: {
        ...before,
        paidAmount: 75,
        status: 'partial',
        payoutIds: ['payout-1'],
      },
      rollup: coordinatedRollup,
    });

    expect(decision).toEqual({
      mode: 'fallback',
      reason: 'planner_payout_state_changed',
    });
  });

  it('rejects a delta that would make authoritative totals invalid', () => {
    const decision = planTeacherEarningsIncrementalTransaction({
      eventId: 'evt-delete-demo',
      earningId: 'demo-1',
      before: {
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        amount: 100,
        status: 'unpaid',
        source: 'demo_completed',
      },
      after: null,
      rollup: {
        ...coordinatedRollup,
        totalEarnings: 50,
        pendingEarnings: 50,
        demoEarnings: 50,
      },
    });

    expect(decision).toEqual({
      mode: 'fallback',
      reason: 'delta_would_violate_rollup_invariants',
    });
  });

  it('treats an exact marker match as an idempotent replay', () => {
    const candidate = planTeacherEarningsIncrementalTransaction({
      ...demoCreate,
      rollup: coordinatedRollup,
    });
    expect(candidate.mode).toBe('candidate');
    if (candidate.mode !== 'candidate') return;

    expect(
      evaluateTeacherEarningsIncrementalReplay({
        markerId: candidate.markerId,
        changeSignature: candidate.changeSignature,
        existingMarker: {
          changeSignature: candidate.changeSignature,
          protocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
        },
      }),
    ).toEqual({ mode: 'replay', markerId: candidate.markerId });
  });

  it('fails hard when an existing marker id carries a different event signature', () => {
    expect(
      evaluateTeacherEarningsIncrementalReplay({
        markerId: 'b7_marker',
        changeSignature: 'expected-signature',
        existingMarker: {
          changeSignature: 'different-signature',
          protocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
        },
      }),
    ).toEqual({ mode: 'conflict', reason: 'idempotency_marker_mismatch' });
  });

  it('refuses missing CloudEvent identity instead of fabricating an idempotency key', () => {
    expect(
      planTeacherEarningsIncrementalTransaction({
        ...demoCreate,
        eventId: '',
        rollup: coordinatedRollup,
      }),
    ).toEqual({ mode: 'fallback', reason: 'missing_event_identity' });
  });

  it('does not wire Brick 7A into the live trigger before the recompute fence exists', () => {
    const liveTriggerSource = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/teacherEarningsRollupTrigger.ts'),
      'utf8',
    );

    expect(liveTriggerSource).not.toContain('teacherEarningsIncrementalProtocol');
    expect(liveTriggerSource).not.toContain('planTeacherEarningsIncrementalTransaction');
    expect(liveTriggerSource).toContain('authoritativeTeacherEarningsRollupWrite.run(event)');
  });
});
