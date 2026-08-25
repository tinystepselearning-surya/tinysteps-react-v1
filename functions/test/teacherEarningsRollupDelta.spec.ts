import { describe, expect, it } from 'vitest';
import {
  planTeacherEarningsRollupChange,
  teacherEarningContributionFor,
} from '../src/helpers/teacherEarningsRollupDelta';

describe('teacher earnings rollup delta planner', () => {
  it('computes unpaid, partial, paid, and void contributions without changing ledger semantics', () => {
    expect(
      teacherEarningContributionFor({
        amount: 175,
        status: 'unpaid',
        source: 'session_present_completed',
        sessionId: 'session-1',
      }),
    ).toEqual({
      totalEarnings: 175,
      pendingEarnings: 175,
      totalSessions: 1,
      sessionsCompleted: 1,
      demoEarnings: 0,
      demoCompletedCount: 0,
      demoEnrollmentBonusCount: 0,
    });

    expect(
      teacherEarningContributionFor({
        amount: 175,
        paidAmount: 75,
        status: 'partial',
        source: 'session_present_completed',
        sessionId: 'session-1',
      }).pendingEarnings,
    ).toBe(100);

    expect(
      teacherEarningContributionFor({ amount: 175, status: 'paid', sessionId: 'session-1' }).pendingEarnings,
    ).toBe(0);

    expect(
      teacherEarningContributionFor({ amount: 175, status: 'void', sessionId: 'session-1' }),
    ).toEqual({
      totalEarnings: 0,
      pendingEarnings: 0,
      totalSessions: 0,
      sessionsCompleted: 0,
      demoEarnings: 0,
      demoCompletedCount: 0,
      demoEnrollmentBonusCount: 0,
    });
  });

  it('tracks demo completion and enrollment bonus contributions separately', () => {
    expect(
      teacherEarningContributionFor({ amount: 100, status: 'unpaid', source: 'demo_completed' }),
    ).toMatchObject({
      totalEarnings: 100,
      pendingEarnings: 100,
      demoEarnings: 100,
      demoCompletedCount: 1,
      demoEnrollmentBonusCount: 0,
    });

    expect(
      teacherEarningContributionFor({ amount: 100, status: 'unpaid', source: 'demo_enrolled_bonus' }),
    ).toMatchObject({
      totalEarnings: 100,
      pendingEarnings: 100,
      demoEarnings: 100,
      demoCompletedCount: 0,
      demoEnrollmentBonusCount: 1,
    });
  });

  it('keeps a partial payout on authoritative recompute so payout history stays in sync', () => {
    const plan = planTeacherEarningsRollupChange({
      earningId: 'session-1',
      before: {
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        amount: 175,
        paidAmount: 0,
        status: 'unpaid',
        source: 'session_present_completed',
        sessionId: 'session-1',
      },
      after: {
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        amount: 175,
        paidAmount: 75,
        status: 'partial',
        source: 'session_present_completed',
        sessionId: 'session-1',
        payoutIds: ['payout-1'],
      },
    });

    expect(plan).toEqual({
      mode: 'recompute',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
      reason: 'payout_state_changed',
    });
  });

  it('keeps paidAt and payoutIds mutations on authoritative recompute even when totals are unchanged', () => {
    const base = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      amount: 175,
      paidAmount: 175,
      status: 'paid',
      source: 'session_present_completed',
      sessionId: 'session-1',
      payoutIds: ['payout-1'],
      paidAt: { seconds: 100, nanoseconds: 0 },
    };

    const plan = planTeacherEarningsRollupChange({
      earningId: 'session-1',
      before: base,
      after: {
        ...base,
        payoutIds: ['payout-1', 'payout-2'],
        paidAt: { seconds: 200, nanoseconds: 0 },
      },
    });

    expect(plan).toEqual({
      mode: 'recompute',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
      reason: 'payout_state_changed',
    });
  });

  it('still returns noop for metadata-only changes on an already-paid earning', () => {
    const before = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      amount: 175,
      paidAmount: 175,
      status: 'paid',
      source: 'session_present_completed',
      sessionId: 'session-1',
      payoutIds: ['payout-1'],
      paidAt: { seconds: 100, nanoseconds: 0 },
      note: 'old',
    };

    const plan = planTeacherEarningsRollupChange({
      earningId: 'session-1',
      before,
      after: { ...before, note: 'new' },
    });

    expect(plan).toEqual({
      mode: 'noop',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
    });
  });

  it('plans a safe standalone demo creation delta', () => {
    const plan = planTeacherEarningsRollupChange({
      earningId: 'demo_demo-1_completion',
      before: null,
      after: {
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        amount: 100,
        status: 'unpaid',
        source: 'demo_completed',
      },
    });

    expect(plan).toEqual({
      mode: 'delta',
      target: { teacherId: 'teacher-1', monthKey: '2026-08' },
      delta: {
        totalEarnings: 100,
        pendingEarnings: 100,
        totalSessions: 0,
        sessionsCompleted: 0,
        demoEarnings: 100,
        demoCompletedCount: 1,
        demoEnrollmentBonusCount: 0,
      },
    });
  });

  it('forces full recompute for a new session earning because legacy duplicate selection is not yet proven absent', () => {
    const plan = planTeacherEarningsRollupChange({
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
    });

    expect(plan).toEqual({
      mode: 'recompute',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
      reason: 'session_create_or_delete',
    });
  });

  it('forces full recompute for non-canonical legacy session rows', () => {
    const plan = planTeacherEarningsRollupChange({
      earningId: 'legacy-earning-1',
      before: {
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        amount: 175,
        status: 'unpaid',
        sessionId: 'session-1',
      },
      after: {
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        amount: 175,
        status: 'unpaid',
        sessionId: 'session-1',
        note: 'changed',
      },
    });

    expect(plan.mode).toBe('recompute');
    if (plan.mode === 'recompute') {
      expect(plan.reason).toBe('ambiguous_or_legacy_session_row');
    }
  });

  it('forces both affected rollups to recompute when teacher or month ownership changes', () => {
    const plan = planTeacherEarningsRollupChange({
      earningId: 'demo-demo-1',
      before: {
        teacherId: 'teacher-1',
        monthKey: '2026-07',
        amount: 100,
        status: 'unpaid',
        source: 'demo_completed',
      },
      after: {
        teacherId: 'teacher-2',
        monthKey: '2026-08',
        amount: 100,
        status: 'unpaid',
        source: 'demo_completed',
      },
    });

    expect(plan).toEqual({
      mode: 'recompute',
      targets: [
        { teacherId: 'teacher-1', monthKey: '2026-07' },
        { teacherId: 'teacher-2', monthKey: '2026-08' },
      ],
      reason: 'teacher_or_month_changed',
    });
  });

  it('returns noop for metadata-only changes that do not alter finance totals', () => {
    const before = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      amount: 100,
      status: 'unpaid',
      source: 'demo_completed',
      note: 'old',
    };
    const plan = planTeacherEarningsRollupChange({
      earningId: 'demo-demo-1',
      before,
      after: { ...before, note: 'new' },
    });

    expect(plan).toEqual({
      mode: 'noop',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
    });
  });
});
