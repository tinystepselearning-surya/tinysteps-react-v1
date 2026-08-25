import { describe, expect, it } from 'vitest';
import { summarizeTeacherFinanceRollups } from '../../pages/admin/teacherFinanceRollupMetrics';

describe('B6 Brick 6A/6B2 teacher finance rollup projection', () => {
  it('reproduces the Finance summary from analytics-ready monthly rollups', () => {
    const summary = summarizeTeacherFinanceRollups(
      [
        {
          id: '2026-08',
          monthKey: '2026-08',
          totalEarnings: 1200,
          pendingEarnings: 500,
          totalSessions: 6,
          demoEarnings: 200,
          demoCompletedCount: 1,
          demoEnrollmentBonusCount: 1,
          analyticsProjectionPreparedSessionEarnings: 1000,
          unclassifiedEarnings: 0,
          analyticsProjectionVersion: 1,
        },
        {
          id: '2026-08',
          monthKey: '2026-08',
          totalEarnings: 650,
          pendingEarnings: 175,
          totalSessions: 3,
          demoEarnings: 100,
          demoCompletedCount: 1,
          demoEnrollmentBonusCount: 0,
          analyticsProjectionPreparedSessionEarnings: 550,
          unclassifiedEarnings: 0,
          analyticsProjectionVersion: 1,
        },
      ],
      '2026-08',
    );

    expect(summary).toEqual({
      totalCombinedEarned: 1850,
      totalSessionEarned: 1550,
      totalDemoEarned: 300,
      totalSessionCount: 9,
      totalDemoCount: 3,
      totalPending: 675,
      rollupCount: 2,
      unsafeRollupCount: 0,
      safeForFinanceSummary: true,
    });
  });

  it('derives live session earnings from authoritative total minus demo instead of stale prepared metadata', () => {
    const summary = summarizeTeacherFinanceRollups(
      [
        {
          monthKey: '2026-08',
          totalEarnings: 1400,
          pendingEarnings: 700,
          totalSessions: 7,
          demoEarnings: 200,
          demoCompletedCount: 1,
          demoEnrollmentBonusCount: 1,
          analyticsProjectionPreparedSessionEarnings: 999,
          unclassifiedEarnings: 0,
          analyticsProjectionVersion: 1,
        },
      ],
      '2026-08',
    );

    expect(summary.safeForFinanceSummary).toBe(true);
    expect(summary.totalCombinedEarned).toBe(1400);
    expect(summary.totalSessionEarned).toBe(1200);
    expect(summary.totalDemoEarned).toBe(200);
  });

  it('does not silently use legacy v1 rollups that lack the analytics projection', () => {
    const summary = summarizeTeacherFinanceRollups(
      [
        {
          id: '2026-08',
          month: '2026-08',
          totalEarnings: 1200,
          pendingEarnings: 500,
          totalSessions: 6,
          demoEarnings: 200,
          demoCompletedCount: 1,
          demoEnrollmentBonusCount: 1,
          rollupVersion: 1,
        },
      ],
      '2026-08',
    );

    expect(summary.rollupCount).toBe(1);
    expect(summary.unsafeRollupCount).toBe(1);
    expect(summary.safeForFinanceSummary).toBe(false);
    expect(summary.totalCombinedEarned).toBe(0);
  });

  it('fails closed when a rollup contains unclassified earnings', () => {
    const summary = summarizeTeacherFinanceRollups(
      [
        {
          monthKey: '2026-08',
          totalEarnings: 1200,
          demoEarnings: 200,
          unclassifiedEarnings: 50,
          analyticsProjectionVersion: 1,
        },
      ],
      '2026-08',
    );

    expect(summary.safeForFinanceSummary).toBe(false);
    expect(summary.unsafeRollupCount).toBe(1);
  });

  it('ignores rollups outside the selected month', () => {
    const summary = summarizeTeacherFinanceRollups(
      [
        {
          id: '2026-07',
          monthKey: '2026-07',
          totalEarnings: 1200,
          demoEarnings: 200,
          unclassifiedEarnings: 0,
          analyticsProjectionVersion: 1,
        },
      ],
      '2026-08',
    );

    expect(summary.rollupCount).toBe(0);
    expect(summary.safeForFinanceSummary).toBe(false);
  });
});