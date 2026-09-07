import { describe, expect, it } from 'vitest';
import {
  buildTeacherPayoutV2Request,
  resolvePayoutEarningMonthKey,
  resolveTeacherSettlementAmounts,
  resolveTeacherNetEntitlementAmount,
  resolveTeacherPaymentStatusLabel,
} from '../../pages/admin/teacherPaymentsFinance';

describe('Brick 5 Teacher Payments finance helpers', () => {
  it('builds a payout request with separate earning month and actual payment date', () => {
    expect(buildTeacherPayoutV2Request({
      teacherId: 'teacher-1',
      amount: 4800,
      earningMonthKey: '2026-08',
      paymentDate: '2026-09-07',
      note: 'August payout',
      idempotencyKey: 'request-1',
    })).toEqual({
      teacherId: 'teacher-1',
      amount: 4800,
      earningMonthKey: '2026-08',
      paidAt: '2026-09-07',
      method: 'bank_transfer',
      note: 'August payout',
      idempotencyKey: 'request-1',
    });
  });

  it('fails validation when the payment date or earning month is missing/malformed', () => {
    expect(() => buildTeacherPayoutV2Request({
      teacherId: 'teacher-1',
      amount: 175,
      earningMonthKey: '2026-8',
      paymentDate: '2026-09-07',
      idempotencyKey: 'request-1',
    })).toThrow('Select a valid earning month.');

    expect(() => buildTeacherPayoutV2Request({
      teacherId: 'teacher-1',
      amount: 175,
      earningMonthKey: '2026-08',
      paymentDate: '',
      idempotencyKey: 'request-1',
    })).toThrow('Select the actual payment date.');
  });

  it('uses Brick 4 posted net entitlement instead of raw settled history', () => {
    expect(resolveTeacherNetEntitlementAmount({ amount: 175 })).toBe(175);
    expect(resolveTeacherNetEntitlementAmount({
      amount: 175,
      teacherPayAdjustmentStatus: 'posted',
      teacherPayAdjustmentRequired: false,
      teacherPayNetEntitlementAmount: 0,
    })).toBe(0);
    expect(resolveTeacherNetEntitlementAmount({
      amount: 175,
      teacherPayAdjustmentStatus: 'posted',
      teacherPayAdjustmentRequired: false,
      teacherPayNetEntitlementAmount: 175,
    })).toBe(175);
  });

  it('labels direct withholding and post-payment adjustments explicitly', () => {
    expect(resolveTeacherPaymentStatusLabel({ status: 'withheld' }, 'Completed')).toBe('School Retained');
    expect(resolveTeacherPaymentStatusLabel({
      amount: 175,
      teacherPayAdjustmentStatus: 'posted',
      teacherPayAdjustmentRequired: false,
      teacherPayNetEntitlementAmount: 0,
      teacherPayAdjustmentNetAmount: -175,
    }, 'Completed')).toBe('Adjusted — School Retained');
    expect(resolveTeacherPaymentStatusLabel({
      amount: 175,
      teacherPayAdjustmentStatus: 'posted',
      teacherPayAdjustmentRequired: false,
      teacherPayNetEntitlementAmount: 175,
      teacherPayAdjustmentNetAmount: 0,
    }, 'Completed')).toBe('Restored After Adjustment');
  });

  it('reads explicit earningMonthKey before the legacy monthKey alias', () => {
    expect(resolvePayoutEarningMonthKey({ earningMonthKey: '2026-08', monthKey: '2026-07' })).toBe('2026-08');
    expect(resolvePayoutEarningMonthKey({ monthKey: '2026-07' })).toBe('2026-07');
  });

  it('shows carry separately from actual cash in settlement math and status', () => {
    const earning = {
      amount: 1000,
      paidAmount: 825,
      teacherPayOffsetAppliedAmount: 175,
      settlementStatus: 'settled',
      settledBy: 'cash_and_offset',
      status: 'paid',
    };
    expect(resolveTeacherSettlementAmounts(earning)).toEqual({
      entitlement: 1000,
      cashPaid: 825,
      offsetApplied: 175,
      satisfied: 1000,
      pending: 0,
    });
    expect(resolveTeacherPaymentStatusLabel(earning, 'Completed')).toBe('Settled by Cash + Carry');
    expect(resolveTeacherSettlementAmounts({
      amount: 175,
      paidAmount: 0,
      teacherPayOffsetAppliedAmount: 175,
      status: 'paid',
      settledBy: 'offset',
    })).toMatchObject({ cashPaid: 0, offsetApplied: 175, pending: 0 });
  });
});
