import { describe, expect, it } from 'vitest';
import {
  buildTeacherPayoutPeriod,
  resolvePayoutEarningMonthKey,
  resolveTeacherEarningCashAllocatedAmount,
  TEACHER_PAYOUT_PERIOD_SEMANTICS,
  TEACHER_PAYOUT_SCHEMA_VERSION,
} from '../src/helpers/teacherPayoutPeriod';

describe('Brick 5 teacher payout period semantics', () => {
  it('keeps the earning month separate from the actual cash payment month', () => {
    const period = buildTeacherPayoutPeriod({
      earningMonthKey: '2026-08',
      paidAt: '2026-09-07',
    });

    expect(period).toEqual({
      earningMonthKey: '2026-08',
      monthKey: '2026-08',
      paymentMonthKey: '2026-09',
      paymentDate: '2026-09-07',
    });
    expect(TEACHER_PAYOUT_SCHEMA_VERSION).toBe(2);
    expect(TEACHER_PAYOUT_PERIOD_SEMANTICS).toBe('earning_month_separate_from_payment_date');
  });

  it('does not infer the earning month from paidAt', () => {
    const period = buildTeacherPayoutPeriod({
      earningMonthKey: '2026-07',
      paidAt: '2026-09-30',
    });

    expect(period?.earningMonthKey).toBe('2026-07');
    expect(period?.monthKey).toBe('2026-07');
    expect(period?.paymentMonthKey).toBe('2026-09');
  });

  it('fails closed for malformed earning periods or payment dates', () => {
    expect(buildTeacherPayoutPeriod({ earningMonthKey: '2026-8', paidAt: '2026-09-07' })).toBeNull();
    expect(buildTeacherPayoutPeriod({ earningMonthKey: '2026-13', paidAt: '2026-09-07' })).toBeNull();
    expect(buildTeacherPayoutPeriod({ earningMonthKey: '2026-08', paidAt: 'not-a-date' })).toBeNull();
    expect(buildTeacherPayoutPeriod({ earningMonthKey: '2026-08', paidAt: '2026-02-31' })).toBeNull();
  });

  it('prefers the explicit earningMonthKey and falls back to legacy monthKey', () => {
    expect(resolvePayoutEarningMonthKey({ earningMonthKey: '2026-08', monthKey: '2026-07' })).toBe('2026-08');
    expect(resolvePayoutEarningMonthKey({ monthKey: '2026-07' })).toBe('2026-07');
    expect(resolvePayoutEarningMonthKey({ monthKey: 'invalid' })).toBeNull();
    expect(resolvePayoutEarningMonthKey({ monthKey: '2026-13' })).toBeNull();
  });

  it('caps allocated cash at the Brick 4 net entitlement', () => {
    expect(resolveTeacherEarningCashAllocatedAmount({ paidAmount: 175 }, 0)).toBe(0);
    expect(resolveTeacherEarningCashAllocatedAmount({ paidAmount: 175 }, 100)).toBe(100);
    expect(resolveTeacherEarningCashAllocatedAmount({ status: 'paid' }, 125)).toBe(125);
    expect(resolveTeacherEarningCashAllocatedAmount({ status: 'unpaid' }, 125)).toBe(0);
  });
});
