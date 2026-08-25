import { describe, expect, it } from 'vitest';
import {
  buildTeacherFinanceAnalyticsProjection,
  evaluateTeacherFinanceRollupParity,
} from '../src/helpers/teacherFinanceAnalyticsProjection';

describe('B6 Brick 6B1 teacher finance analytics projection', () => {
  it('partitions canonical session and demo earnings without changing authoritative totals', () => {
    const projection = buildTeacherFinanceAnalyticsProjection([
      {
        id: 'session-1',
        sessionId: 'session-1',
        teacherId: 'teacher-1',
        source: 'session_present_completed',
        status: 'unpaid',
        amount: 175,
      },
      {
        id: 'session-2',
        sessionId: 'session-2',
        teacherId: 'teacher-1',
        source: 'session_present_completed',
        status: 'partial',
        amount: 175,
        paidAmount: 75,
      },
      {
        id: 'demo-1',
        demoId: 'demo-1',
        teacherId: 'teacher-1',
        source: 'demo_completed',
        status: 'paid',
        amount: 100,
      },
      {
        id: 'demo-1-bonus',
        demoId: 'demo-1',
        teacherId: 'teacher-1',
        source: 'demo_enrolled_bonus',
        status: 'unpaid',
        amount: 100,
      },
    ]);

    expect(projection).toMatchObject({
      totalEarnings: 550,
      pendingEarnings: 375,
      totalSessions: 2,
      demoEarnings: 200,
      demoCompletedCount: 1,
      demoEnrollmentBonusCount: 1,
      sessionEarnings: 350,
      unclassifiedEarnings: 0,
      unclassifiedEarningCount: 0,
      classificationConflictCount: 0,
      safeForAnalyticsProjection: true,
    });
  });

  it('matches authoritative session dedupe preference: canonical id, non-void, then newest', () => {
    const projection = buildTeacherFinanceAnalyticsProjection([
      {
        id: 'legacy-session-1',
        sessionId: 'session-1',
        source: 'session_present_completed',
        status: 'unpaid',
        amount: 999,
        updatedAt: new Date('2026-08-10T00:00:00Z'),
      },
      {
        id: 'session-1',
        sessionId: 'session-1',
        source: 'session_present_completed',
        status: 'unpaid',
        amount: 175,
        updatedAt: new Date('2026-08-01T00:00:00Z'),
      },
      {
        id: 'session-2-old',
        sessionId: 'session-2',
        source: 'session_present_completed',
        status: 'void',
        amount: 300,
        updatedAt: new Date('2026-08-20T00:00:00Z'),
      },
      {
        id: 'session-2-new',
        sessionId: 'session-2',
        source: 'session_present_completed',
        status: 'unpaid',
        amount: 200,
        updatedAt: new Date('2026-08-01T00:00:00Z'),
      },
    ]);

    expect(projection.totalEarnings).toBe(375);
    expect(projection.sessionEarnings).toBe(375);
    expect(projection.totalSessions).toBe(2);
    expect(projection.safeForAnalyticsProjection).toBe(true);
  });

  it('excludes archived and void rows from the analytics projection', () => {
    const projection = buildTeacherFinanceAnalyticsProjection([
      {
        id: 'archived-session',
        sessionId: 'archived-session',
        source: 'session_present_completed',
        status: 'unpaid',
        amount: 175,
        archived: true,
      },
      {
        id: 'void-demo',
        source: 'demo_completed',
        status: 'void',
        amount: 100,
      },
    ]);

    expect(projection.totalEarnings).toBe(0);
    expect(projection.activeEarningCount).toBe(1);
    expect(projection.selectedEarningCount).toBe(0);
    expect(projection.safeForAnalyticsProjection).toBe(true);
  });

  it('fails closed for standalone earnings that are neither session nor demo', () => {
    const projection = buildTeacherFinanceAnalyticsProjection([
      {
        id: 'manual-adjustment',
        source: 'manual_adjustment',
        status: 'unpaid',
        amount: 250,
      },
    ]);

    expect(projection.unclassifiedEarnings).toBe(250);
    expect(projection.unclassifiedEarningCount).toBe(1);
    expect(projection.safeForAnalyticsProjection).toBe(false);
  });

  it('fails closed when a demo earning also carries a session identity', () => {
    const projection = buildTeacherFinanceAnalyticsProjection([
      {
        id: 'odd-demo',
        sessionId: 'odd-demo',
        source: 'demo_completed',
        status: 'unpaid',
        amount: 100,
      },
    ]);

    expect(projection.classificationConflictCount).toBe(1);
    expect(projection.safeForAnalyticsProjection).toBe(false);
  });

  it('allows migration only when projection and authoritative rollup are in parity', () => {
    const projection = buildTeacherFinanceAnalyticsProjection([
      {
        id: 'session-1',
        sessionId: 'session-1',
        source: 'session_present_completed',
        status: 'unpaid',
        amount: 175,
      },
      {
        id: 'demo-1',
        source: 'demo_completed',
        status: 'unpaid',
        amount: 100,
      },
    ]);

    const parity = evaluateTeacherFinanceRollupParity(projection, {
      rollupVersion: 1,
      totalEarnings: 275,
      pendingEarnings: 275,
      totalSessions: 1,
      demoEarnings: 100,
      demoCompletedCount: 1,
      demoEnrollmentBonusCount: 0,
    });

    expect(parity.safeToPrepare).toBe(true);
    expect(parity.reasons).toEqual([]);
  });

  it('refuses migration when an authoritative total disagrees', () => {
    const projection = buildTeacherFinanceAnalyticsProjection([
      {
        id: 'session-1',
        sessionId: 'session-1',
        source: 'session_present_completed',
        status: 'unpaid',
        amount: 175,
      },
    ]);

    const parity = evaluateTeacherFinanceRollupParity(projection, {
      rollupVersion: 1,
      totalEarnings: 350,
      pendingEarnings: 175,
      totalSessions: 1,
      demoEarnings: 0,
      demoCompletedCount: 0,
      demoEnrollmentBonusCount: 0,
    });

    expect(parity.safeToPrepare).toBe(false);
    expect(parity.reasons).toContain('totalEarnings_mismatch');
  });

  it('refuses migration when the existing derived rollup is missing or legacy', () => {
    const projection = buildTeacherFinanceAnalyticsProjection([]);

    expect(evaluateTeacherFinanceRollupParity(projection, null).safeToPrepare).toBe(false);
    expect(
      evaluateTeacherFinanceRollupParity(projection, {
        totalEarnings: 0,
        pendingEarnings: 0,
        totalSessions: 0,
        demoEarnings: 0,
        demoCompletedCount: 0,
        demoEnrollmentBonusCount: 0,
      }).safeToPrepare,
    ).toBe(false);
  });
});
