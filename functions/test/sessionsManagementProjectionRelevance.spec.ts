import { describe, expect, it } from 'vitest';
import {
  hasSessionsManagementEnrollmentProjectionChange,
  hasSessionsManagementSessionProjectionChange,
} from '../src/helpers/sessionsManagementProjectionRelevance';

describe('Sessions Management projection relevance', () => {
  it('ignores enrollment finance metrics and write metadata', () => {
    expect(
      hasSessionsManagementEnrollmentProjectionChange(
        {
          status: 'active',
          teacherId: 'teacher-1',
          metrics: { completedSessionsCount: 4, expectedRevenueAccrued: 1600 },
          updatedAt: { toMillis: () => 1000 },
        },
        {
          status: 'active',
          teacherId: 'teacher-1',
          metrics: { completedSessionsCount: 5, expectedRevenueAccrued: 2000 },
          updatedAt: { toMillis: () => 2000 },
        },
      ),
    ).toBe(false);
  });

  it('keeps enrollment schedule, assignment and lifecycle changes projection-relevant', () => {
    expect(
      hasSessionsManagementEnrollmentProjectionChange(
        { status: 'active', teacherId: 'teacher-1', schedule: { weekdays: [1, 3] } },
        { status: 'active', teacherId: 'teacher-2', schedule: { weekdays: [1, 3] } },
      ),
    ).toBe(true);
    expect(
      hasSessionsManagementEnrollmentProjectionChange(
        { status: 'active', schedule: { weekdays: [1, 3] } },
        { status: 'paused', schedule: { weekdays: [1, 3] } },
      ),
    ).toBe(true);
  });

  it('ignores session finance snapshot/accrual bookkeeping', () => {
    expect(
      hasSessionsManagementSessionProjectionChange(
        {
          date: '2026-10-02',
          status: 'completed',
          parentNotified: false,
          financialTermsSnapshotVersion: 1,
          billingRateSnapshot: 400,
          teacherPayRateSnapshot: 175,
          financialTermsCurrency: 'INR',
          revenueAccrued: false,
          updatedAt: { toMillis: () => 1000 },
        },
        {
          date: '2026-10-02',
          status: 'completed',
          parentNotified: false,
          financialTermsSnapshotVersion: 1,
          billingRateSnapshot: 400,
          teacherPayRateSnapshot: 175,
          financialTermsCurrency: 'INR',
          revenueAccrued: true,
          accruedAmount: 400,
          accruedMonthKey: '2026-10',
          updatedAt: { toMillis: () => 2000 },
        },
      ),
    ).toBe(false);
  });

  it('keeps session operational and reminder changes projection-relevant', () => {
    expect(
      hasSessionsManagementSessionProjectionChange(
        { date: '2026-10-02', status: 'scheduled', parentNotified: false },
        { date: '2026-10-02', status: 'completed', parentNotified: false },
      ),
    ).toBe(true);
    expect(
      hasSessionsManagementSessionProjectionChange(
        { date: '2026-10-02', status: 'scheduled', parentNotified: false },
        { date: '2026-10-02', status: 'scheduled', parentNotified: true },
      ),
    ).toBe(true);
  });
});
