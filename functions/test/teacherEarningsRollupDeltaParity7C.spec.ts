import { describe, expect, it } from 'vitest';
import {
  planTeacherEarningsRollupChange,
  teacherEarningContributionFor,
} from '../src/helpers/teacherEarningsRollupDelta';

describe('B6 Brick 7C1 teacher earnings delta parity hardening', () => {
  it('matches authoritative amount semantics by refusing numeric-string coercion', () => {
    expect(
      teacherEarningContributionFor({
        amount: '175',
        status: 'unpaid',
        source: 'demo_completed',
      }),
    ).toMatchObject({
      totalEarnings: 0,
      pendingEarnings: 0,
      demoEarnings: 0,
      demoCompletedCount: 1,
    });
  });

  it('matches authoritative processed-status semantics instead of treating processed as paid', () => {
    expect(
      teacherEarningContributionFor({
        amount: 175,
        status: 'processed',
        source: 'demo_completed',
      }).pendingEarnings,
    ).toBe(175);
  });

  it('forces canonical session archive/unarchive through full recompute because dedupe membership can change', () => {
    const before = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      amount: 175,
      status: 'unpaid',
      source: 'session_present_completed',
      sessionId: 'session-1',
      archived: false,
    };

    expect(
      planTeacherEarningsRollupChange({
        earningId: 'session-1',
        before,
        after: { ...before, archived: true },
      }),
    ).toEqual({
      mode: 'recompute',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
      reason: 'session_archived_state_changed',
    });

    expect(
      planTeacherEarningsRollupChange({
        earningId: 'session-1',
        before: { ...before, archived: true },
        after: before,
      }),
    ).toEqual({
      mode: 'recompute',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
      reason: 'session_archived_state_changed',
    });
  });

  it('still allows an amount change on an existing non-archived canonical session to be planned as an exact delta', () => {
    const before = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      amount: 175,
      status: 'unpaid',
      source: 'session_present_completed',
      sessionId: 'session-1',
      archived: false,
    };

    expect(
      planTeacherEarningsRollupChange({
        earningId: 'session-1',
        before,
        after: { ...before, amount: 200 },
      }),
    ).toEqual({
      mode: 'delta',
      target: { teacherId: 'teacher-1', monthKey: '2026-08' },
      delta: {
        totalEarnings: 25,
        pendingEarnings: 25,
        totalSessions: 0,
        sessionsCompleted: 0,
        demoEarnings: 0,
        demoCompletedCount: 0,
        demoEnrollmentBonusCount: 0,
      },
    });
  });
});
