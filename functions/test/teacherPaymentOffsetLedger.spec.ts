import { describe, expect, it } from 'vitest';
import {
  buildTeacherPaymentOffsetId,
  planTeacherPaymentCarry,
  resolveTeacherEarningHistoricalCashAmount,
  resolveTeacherEarningSettlement,
  validateTeacherOffsetRestoration,
} from '../src/helpers/teacherPaymentOffsetLedger';

const adjustedAugust = {
  id: 'earning-august',
  data: {
    teacherId: 'teacher-1',
    sessionId: 'session-august',
    monthKey: '2026-08',
    amount: 175,
    paidAmount: 175,
    paidAt: '2026-08-31T12:00:00+05:30',
    status: 'paid',
    teacherPayAdjustmentStatus: 'posted',
    teacherPayAdjustmentRequired: false,
    teacherPayNetEntitlementAmount: 0,
  },
};

const september = {
  id: 'earning-september',
  data: {
    teacherId: 'teacher-1',
    sessionId: 'session-september',
    monthKey: '2026-09',
    amount: 1000,
    paidAmount: 0,
    status: 'unpaid',
  },
};

describe('teacher payment offset ledger', () => {
  it('derives ₹175 carry without mutating historical cash evidence', () => {
    expect(resolveTeacherEarningHistoricalCashAmount(adjustedAugust.data)).toBe(175);
    const plan = planTeacherPaymentCarry({
      teacherId: 'teacher-1',
      targetEarningMonthKey: '2026-09',
      idempotencyKey: 'request-1',
      earnings: [adjustedAugust, september],
      offsets: [],
    });

    expect(plan).toMatchObject({
      availableCarryBefore: 175,
      offsetAppliedAmount: 175,
      remainingCarry: 0,
      conflict: null,
    });
    expect(plan.allocations[0]).toMatchObject({
      sourceEarningId: 'earning-august',
      sourceEarningMonthKey: '2026-08',
      targetEarningId: 'earning-september',
      targetEarningMonthKey: '2026-09',
      amount: 175,
      targetEntitlementBeforeOffset: 1000,
      targetCashDueAfterOffset: 825,
    });
    expect(adjustedAugust.data.paidAmount).toBe(175);
    expect(adjustedAugust.data.paidAt).toBe('2026-08-31T12:00:00+05:30');
  });

  it('is deterministic and does not duplicate an already-applied carry', () => {
    const offsetId = buildTeacherPaymentOffsetId({
      sourceEarningId: 'earning-august',
      targetEarningId: 'earning-september',
      idempotencyKey: 'request-1',
    });
    expect(offsetId).toBe(buildTeacherPaymentOffsetId({
      sourceEarningId: 'earning-august',
      targetEarningId: 'earning-september',
      idempotencyKey: 'request-1',
    }));

    const plan = planTeacherPaymentCarry({
      teacherId: 'teacher-1',
      targetEarningMonthKey: '2026-09',
      idempotencyKey: 'request-1',
      earnings: [adjustedAugust, september],
      offsets: [{
        id: offsetId,
        data: {
          teacherId: 'teacher-1',
          recordType: 'teacher_payment_offset',
          status: 'applied',
          sourceEarningId: 'earning-august',
          targetEarningId: 'earning-september',
          amount: 175,
        },
      }],
    });
    expect(plan.offsetAppliedAmount).toBe(0);
    expect(plan.allocations).toEqual([]);
  });

  it('applies only target outstanding and carries ₹75 onward', () => {
    const plan = planTeacherPaymentCarry({
      teacherId: 'teacher-1',
      targetEarningMonthKey: '2026-09',
      idempotencyKey: 'partial',
      earnings: [adjustedAugust, {
        ...september,
        data: { ...september.data, amount: 100 },
      }],
      offsets: [],
    });
    expect(plan.offsetAppliedAmount).toBe(100);
    expect(plan.remainingCarry).toBe(75);
    expect(plan.allocations[0]?.targetCashDueAfterOffset).toBe(0);
  });

  it('uses remaining carry on a later earning without consuming it twice', () => {
    const firstOffset = {
      id: 'first-offset',
      data: {
        teacherId: 'teacher-1',
        recordType: 'teacher_payment_offset',
        status: 'applied',
        sourceEarningId: 'earning-august',
        targetEarningId: 'earning-september',
        amount: 100,
      },
    };
    const october = {
      id: 'earning-october',
      data: { teacherId: 'teacher-1', monthKey: '2026-10', amount: 200, status: 'unpaid' },
    };
    const plan = planTeacherPaymentCarry({
      teacherId: 'teacher-1',
      targetEarningMonthKey: '2026-10',
      idempotencyKey: 'october',
      earnings: [adjustedAugust, september, october],
      offsets: [firstOffset],
    });
    expect(plan.availableCarryBefore).toBe(75);
    expect(plan.offsetAppliedAmount).toBe(75);
    expect(plan.allocations[0]?.targetEarningId).toBe('earning-october');
  });

  it('represents ₹175 carry plus ₹825 cash as a fully settled ₹1,000 entitlement', () => {
    expect(resolveTeacherEarningHistoricalCashAmount({
      amount: 175,
      paidAmount: 0,
      status: 'paid',
      settledBy: 'offset',
    })).toBe(0);
    expect(resolveTeacherEarningSettlement({
      entitlementAmount: 1000,
      cashPaidAmount: 0,
      offsetAppliedAmount: 175,
    })).toEqual({
      satisfiedAmount: 175,
      pendingAmount: 825,
      settlementStatus: 'partial',
      settledBy: null,
    });
    expect(resolveTeacherEarningSettlement({
      entitlementAmount: 1000,
      cashPaidAmount: 825,
      offsetAppliedAmount: 175,
    })).toEqual({
      satisfiedAmount: 1000,
      pendingAmount: 0,
      settlementStatus: 'settled',
      settledBy: 'cash_and_offset',
    });
  });

  it('fails closed if restoration would invalidate already-consumed carry', () => {
    const result = validateTeacherOffsetRestoration({
      sourceEarningId: 'earning-august',
      historicalCashAmount: 175,
      resultingNetEntitlement: 175,
      offsets: [{
        id: 'offset-1',
        data: {
          recordType: 'teacher_payment_offset',
          status: 'applied',
          sourceEarningId: 'earning-august',
          amount: 175,
        },
      }],
    });
    expect(result).toEqual({
      valid: false,
      reason: 'offset_consumed_before_entitlement_restoration',
      consumedAmount: 175,
      availableOverpayment: 0,
    });
  });
});
