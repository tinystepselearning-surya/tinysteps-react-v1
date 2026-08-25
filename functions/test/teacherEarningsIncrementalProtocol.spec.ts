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
  incrementalAuthoritativeCommittedAt: { toMillis: () => 2000 },
};

const demoCreate = {
  eventId: 'evt-demo-1',
  earningId: 'demo_demo-1_completion',
  eventUpdateTime: { toMillis: () => 3000 },
  before: null,
  after: {
    teacherId: 'teacher-1',
    monthKey: '2026-08',
    amount: 100,
    status: 'unpaid',
    source: 'demo_completed',
  },
};

describe('B6 Brick 7A/7C1 teacher earnings incremental transaction protocol', () => {
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

  it('builds an exact delta candidate only when the event is newer than the authoritative commit watermark', () => {
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

  it('treats a delayed event older than the authoritative commit as already covered', () => {
    expect(
      planTeacherEarningsIncrementalTransaction({
        ...demoCreate,
        eventUpdateTime: { toMillis: () => 1000 },
        rollup: coordinatedRollup,
      }),
    ).toEqual({ mode: 'covered', reason: 'event_already_in_authoritative_baseline' });
  });

  it('fails closed when the authoritative/event watermark is missing or exactly equal', () => {
    expect(
      planTeacherEarningsIncrementalTransaction({
        ...demoCreate,
        rollup: { ...coordinatedRollup, incrementalAuthoritativeCommittedAt: undefined },
      }),
    ).toEqual({ mode: 'fallback', reason: 'authoritative_watermark_missing' });

    expect(
      planTeacherEarningsIncrementalTransaction({
        ...demoCreate,
        eventUpdateTime: { toMillis: () => 2000 },
        rollup: coordinatedRollup,
      }),
    ).toEqual({ mode: 'fallback', reason: 'authoritative_watermark_ambiguous' });
  });

  it('still refuses a new session earning until duplicate/canonical session-create coverage is separately proven', () => {
    const decision = planTeacherEarningsIncrementalTransaction({
      eventId: 'evt-session-1',
      earningId: 'session-1',
      eventUpdateTime: { toMillis: () => 3000 },
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
      eventUpdateTime: { toMillis: () => 3000 },
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

  it('keeps deletes on authoritative recompute because there is no post-delete snapshot updateTime', () => {
    const decision = planTeacherEarningsIncrementalTransaction({
      eventId: 'evt-delete-demo',
      earningId: 'demo-1',
      eventUpdateTime: { toMillis: () => 3000 },
      before: {
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        amount: 100,
        status: 'unpaid',
        source: 'demo_completed',
      },
      after: null,
      rollup: coordinatedRollup,
    });

    expect(decision).toEqual({
      mode: 'fallback',
      reason: 'incremental_delete_requires_recompute',
    });
  });

  it('rejects an update delta that would make authoritative totals invalid', () => {
    const before = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      amount: 100,
      status: 'unpaid',
      source: 'demo_completed',
    };
    const decision = planTeacherEarningsIncrementalTransaction({
      eventId: 'evt-reduce-demo',
      earningId: 'demo-1',
      eventUpdateTime: { toMillis: () => 3000 },
      before,
      after: { ...before, amount: 0 },
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

  it('keeps Brick 7C incremental execution disabled during the 7C1 atomic-baseline checkpoint', () => {
    const liveTriggerSource = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/teacherEarningsRollupTrigger.ts'),
      'utf8',
    );

    expect(liveTriggerSource).not.toContain('teacherEarningsIncrementalProtocol');
    expect(liveTriggerSource).not.toContain('planTeacherEarningsIncrementalTransaction');
    expect(liveTriggerSource).toContain('recomputeTeacherEarningsEventCoordinated');
    expect(liveTriggerSource).not.toContain('authoritativeTeacherEarningsRollupWrite.run(event)');
  });
});
