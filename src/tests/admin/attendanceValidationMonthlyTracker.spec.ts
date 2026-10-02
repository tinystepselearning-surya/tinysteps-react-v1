import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  collectionGroup: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));
import {
  avsMonthlyReadModelHasSessions,
  avsMonthlyReadModelSessionCount,
  completedMonthOptions,
  formatMonthKey,
  monthDateRange,
  previousCompletedMonthKey,
} from '../../lib/attendanceValidationMonthlyParentProgress';

describe('attendance validation monthly tracker month helpers', () => {
  const octoberSecondIst = new Date('2026-10-02T04:00:00.000Z');

  it('defaults to the previous fully completed IST month', () => {
    expect(previousCompletedMonthKey(octoberSecondIst)).toBe('2026-09');
  });

  it('builds inclusive month boundaries including leap/calendar endings', () => {
    expect(monthDateRange('2026-09')).toEqual({
      fromDate: '2026-09-01',
      toDate: '2026-09-30',
    });
    expect(monthDateRange('2027-02')).toEqual({
      fromDate: '2027-02-01',
      toDate: '2027-02-28',
    });
  });

  it('lists only completed months from the AVS start month', () => {
    expect(completedMonthOptions(new Date('2026-12-10T00:00:00.000Z')))
      .toEqual(['2026-11', '2026-10', '2026-09']);
    expect(formatMonthKey('2026-09')).toBe('September 2026');
  });

  it('identifies parent-month read models with real session coverage', () => {
    const canonical = {
      attendance: {
        schemaVersion: 3,
        modelType: 'class_attendance_v3',
        sourceSessionCount: 2,
        totals: { totalSessions: 2, total: 2 },
      },
    };
    expect(avsMonthlyReadModelHasSessions(canonical)).toBe(true);
    expect(avsMonthlyReadModelSessionCount(canonical)).toBe(2);
    expect(avsMonthlyReadModelHasSessions({
      attendance: {
        schemaVersion: 1,
        modelType: 'attendance_v1',
        totals: { total: 1 },
      },
    })).toBe(true);
    expect(avsMonthlyReadModelHasSessions({
      attendance: {
        schemaVersion: 3,
        modelType: 'class_attendance_v3',
        sourceSessionCount: 0,
        totals: { totalSessions: 0, total: 0 },
      },
    })).toBe(false);
    expect(avsMonthlyReadModelHasSessions({
      billedClassCount: 8,
      dueAmount: 1200,
    })).toBe(false);
  });
});
