import { describe, expect, it } from 'vitest';
import {
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
});
