import { describe, expect, it } from 'vitest';
import { buildParentPaymentAllocationPlan } from '../../../functions/src/parentPaymentAllocator';

const charge = (
  id: string,
  monthKey: string,
  amount: number,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  data: {
    parentId: 'parent-1',
    monthKey,
    amount,
    createdAt: `${monthKey}-01T10:00:00.000Z`,
    ...overrides,
  },
});

describe('buildParentPaymentAllocationPlan', () => {
  it('fully settles oldest unpaid dues first', () => {
    const plan = buildParentPaymentAllocationPlan(
      [
        charge('may-charge', '2026-05', 12000, { date: '2026-05-10' }),
        charge('june-charge', '2026-06', 4000, { date: '2026-06-05' }),
      ],
      16000
    );

    expect(plan.allocatedAmount).toBe(16000);
    expect(plan.unallocatedAmount).toBe(0);
    expect(plan.allocations).toMatchObject([
      {
        chargeId: 'may-charge',
        allocatedAmount: 12000,
        remainingDueAfter: 0,
      },
      {
        chargeId: 'june-charge',
        allocatedAmount: 4000,
        remainingDueAfter: 0,
      },
    ]);
  });

  it('partially settles the oldest month before newer dues', () => {
    const plan = buildParentPaymentAllocationPlan(
      [
        charge('may-charge', '2026-05', 12000, { date: '2026-05-10' }),
        charge('june-charge', '2026-06', 4000, { date: '2026-06-05' }),
      ],
      10000
    );

    expect(plan.allocatedAmount).toBe(10000);
    expect(plan.unallocatedAmount).toBe(0);
    expect(plan.allocations).toHaveLength(1);
    expect(plan.allocations[0]).toMatchObject({
      chargeId: 'may-charge',
      allocatedAmount: 10000,
      remainingDueAfter: 2000,
    });
  });

  it('keeps excess payment as advance after active dues are cleared', () => {
    const plan = buildParentPaymentAllocationPlan(
      [charge('may-charge', '2026-05', 12000, { date: '2026-05-10' })],
      15000
    );

    expect(plan.allocatedAmount).toBe(12000);
    expect(plan.unallocatedAmount).toBe(3000);
    expect(plan.walletTopupAmount).toBe(3000);
  });

  it('sorts by month, then service date, then createdAt, then charge id', () => {
    const plan = buildParentPaymentAllocationPlan(
      [
        charge('charge-c', '2026-05', 3000, {
          date: '2026-05-20',
          createdAt: '2026-05-01T12:00:00.000Z',
        }),
        charge('charge-a', '2026-05', 3000, {
          date: '2026-05-05',
          createdAt: '2026-05-02T12:00:00.000Z',
        }),
        charge('charge-b', '2026-05', 3000, {
          date: '2026-05-05',
          createdAt: '2026-05-01T12:00:00.000Z',
        }),
        charge('charge-d', '2026-06', 3000, {
          date: '2026-06-02',
          createdAt: '2026-06-01T12:00:00.000Z',
        }),
      ],
      12000
    );

    expect(plan.allocations.map((item) => item.chargeId)).toEqual([
      'charge-b',
      'charge-a',
      'charge-c',
      'charge-d',
    ]);
  });

  it('excludes archived and voided charges from allocation', () => {
    const plan = buildParentPaymentAllocationPlan(
      [
        charge('void-charge', '2026-05', 5000, { status: 'void' }),
        charge('archived-charge', '2026-05', 5000, { archived: true }),
        charge('active-charge', '2026-05', 5000, { date: '2026-05-08' }),
      ],
      5000
    );

    expect(plan.chargesScanned).toBe(3);
    expect(plan.chargesIncluded).toBe(1);
    expect(plan.allocations).toHaveLength(1);
    expect(plan.allocations[0].chargeId).toBe('active-charge');
  });

  it('respects existing paidAmount and allocates only the remaining due', () => {
    const plan = buildParentPaymentAllocationPlan(
      [
        charge('partially-paid-charge', '2026-05', 12000, {
          paidAmount: 4000,
          date: '2026-05-08',
        }),
      ],
      8000
    );

    expect(plan.allocations).toHaveLength(1);
    expect(plan.allocations[0]).toMatchObject({
      chargeId: 'partially-paid-charge',
      previousPaidAmount: 4000,
      outstandingBefore: 8000,
      allocatedAmount: 8000,
      remainingDueAfter: 0,
    });
  });

  it('accepts numeric strings in finance fields without dropping service-month dues', () => {
    const plan = buildParentPaymentAllocationPlan(
      [
        charge('string-charge', '2026-05', 0, {
          amount: '12000',
          paidAmount: '4000',
          outstandingAmount: '8000',
          date: '2026-05-08',
        }),
      ],
      8000
    );

    expect(plan.chargesIncluded).toBe(1);
    expect(plan.allocations[0]).toMatchObject({
      chargeId: 'string-charge',
      previousPaidAmount: 4000,
      outstandingBefore: 8000,
      allocatedAmount: 8000,
      remainingDueAfter: 0,
    });
  });
});
