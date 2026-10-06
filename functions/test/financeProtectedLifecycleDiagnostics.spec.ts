import { describe, expect, it } from 'vitest';
import {
  isFinanciallyEarnedProtectedLifecycleSessionData,
} from '../src/helpers/financeReconciliationProtectedLifecycleSessions';

describe('financially-earned protected lifecycle diagnostics', () => {
  it('detects cancelled Present attendance', () => {
    expect(
      isFinanciallyEarnedProtectedLifecycleSessionData({
        status: 'cancelled',
        attendance: {
          kid: { status: 'present' },
        },
      }),
    ).toBe(true);
  });

  it('detects rescheduled Late attendance', () => {
    expect(
      isFinanciallyEarnedProtectedLifecycleSessionData({
        status: 'rescheduled',
        attendance: {
          kid: { status: 'late' },
        },
      }),
    ).toBe(true);
  });

  it('ignores cancelled Absent attendance', () => {
    expect(
      isFinanciallyEarnedProtectedLifecycleSessionData({
        status: 'cancelled',
        attendance: {
          kid: { status: 'absent' },
        },
      }),
    ).toBe(false);
  });

  it('ignores normal completed Present attendance', () => {
    expect(
      isFinanciallyEarnedProtectedLifecycleSessionData({
        status: 'completed',
        attendance: {
          kid: { status: 'present' },
        },
      }),
    ).toBe(false);
  });

  it('supports legacy string attendance values', () => {
    expect(
      isFinanciallyEarnedProtectedLifecycleSessionData({
        status: 'reschedule_requested',
        attendance: {
          kid: 'present',
        },
      }),
    ).toBe(true);
  });
});
