import { describe, expect, it } from 'vitest';
import { isFinanciallyEarnedAttendanceStatus } from '../src/helpers/status';

describe('canonical attendance financial policy', () => {
  it('treats Present and Late as financially earned', () => {
    expect(isFinanciallyEarnedAttendanceStatus('present')).toBe(true);
    expect(isFinanciallyEarnedAttendanceStatus('Present')).toBe(true);
    expect(isFinanciallyEarnedAttendanceStatus(' late ')).toBe(true);
    expect(isFinanciallyEarnedAttendanceStatus('LATE')).toBe(true);
  });

  it('does not financially earn non-attended statuses', () => {
    for (const status of [
      'absent',
      'cancelled',
      'canceled',
      'rescheduled',
      'no_show',
      'reschedule_requested',
      '',
      null,
      undefined,
    ]) {
      expect(isFinanciallyEarnedAttendanceStatus(status)).toBe(false);
    }
  });
});
