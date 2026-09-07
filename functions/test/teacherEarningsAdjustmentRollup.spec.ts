import { describe, expect, it } from 'vitest';
import {
  canSkipTeacherEarningsRollupRecompute,
  planTeacherEarningsRollupChange,
  teacherEarningContributionFor,
} from '../src/helpers/teacherEarningsRollupDelta';

describe('Brick 4 teacher earning adjustment rollup integration', () => {
  const paidBase = {
    teacherId: 'teacher-1',
    monthKey: '2026-08',
    amount: 175,
    paidAmount: 175,
    status: 'paid',
    source: 'session_present_completed',
    sessionId: 'session-1',
  };

  it('projects a posted retain-school adjustment as zero entitlement while preserving paid cash', () => {
    const contribution = teacherEarningContributionFor({
      ...paidBase,
      teacherPayAdjustmentRequired: false,
      teacherPayAdjustmentStatus: 'posted',
      teacherPayNetEntitlementAmount: 0,
    });

    expect(contribution).toEqual({
      totalEarnings: 0,
      pendingEarnings: 0,
      totalSessions: 1,
      sessionsCompleted: 1,
      demoEarnings: 0,
      demoCompletedCount: 0,
      demoEnrollmentBonusCount: 0,
    });
  });

  it('plans an exact -175 delta when Brick 4 posts the zero-entitlement projection', () => {
    const after = {
      ...paidBase,
      teacherPayAdjustmentRequired: false,
      teacherPayAdjustmentStatus: 'posted',
      teacherPayAdjustmentDecisionId: 'decision-1',
      teacherPayAdjustmentNetAmount: -175,
      teacherPayNetEntitlementAmount: 0,
    };

    const plan = planTeacherEarningsRollupChange({
      earningId: 'session-1',
      before: paidBase,
      after,
    });

    expect(plan).toEqual({
      mode: 'delta',
      target: { teacherId: 'teacher-1', monthKey: '2026-08' },
      delta: {
        totalEarnings: -175,
        pendingEarnings: 0,
        totalSessions: 0,
        sessionsCompleted: 0,
        demoEarnings: 0,
        demoCompletedCount: 0,
        demoEnrollmentBonusCount: 0,
      },
    });
    expect(
      canSkipTeacherEarningsRollupRecompute({
        earningId: 'session-1',
        before: paidBase,
        after,
      }),
    ).toBe(false);
  });

  it('plans +175 restoration when a later adjustment restores normal entitlement', () => {
    const retained = {
      ...paidBase,
      teacherPayAdjustmentRequired: false,
      teacherPayAdjustmentStatus: 'posted',
      teacherPayAdjustmentDecisionId: 'decision-1',
      teacherPayAdjustmentNetAmount: -175,
      teacherPayNetEntitlementAmount: 0,
    };
    const restored = {
      ...retained,
      teacherPayAdjustmentDecisionId: 'decision-2',
      teacherPayAdjustmentNetAmount: 0,
      teacherPayNetEntitlementAmount: 175,
    };

    const plan = planTeacherEarningsRollupChange({
      earningId: 'session-1',
      before: retained,
      after: restored,
    });

    expect(plan).toEqual({
      mode: 'delta',
      target: { teacherId: 'teacher-1', monthKey: '2026-08' },
      delta: {
        totalEarnings: 175,
        pendingEarnings: 0,
        totalSessions: 0,
        sessionsCompleted: 0,
        demoEarnings: 0,
        demoCompletedCount: 0,
        demoEnrollmentBonusCount: 0,
      },
    });
  });

  it('fails closed to the original amount while adjustment state is incomplete', () => {
    expect(
      teacherEarningContributionFor({
        ...paidBase,
        teacherPayAdjustmentRequired: true,
        teacherPayAdjustmentStatus: 'posted',
        teacherPayNetEntitlementAmount: 0,
      }).totalEarnings,
    ).toBe(175);
  });
});
