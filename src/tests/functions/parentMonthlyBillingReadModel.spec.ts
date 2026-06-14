import { describe, expect, it } from 'vitest';
import {
  buildParentMonthlyBillingReadModel,
  resolveServiceMonthStatus,
} from '../../../functions/src/parentMonthlyBillingReadModel';
import { collectParentMonthlyBillingTargets } from '../../../functions/src/parentMonthlyReadModels';

const NOW = new Date('2026-06-14T12:00:00+05:30');

const charge = (overrides: Record<string, unknown> = {}) => ({
  id: 'charge-1',
  monthKey: '2026-05',
  amount: 12000,
  ...overrides,
});

describe('buildParentMonthlyBillingReadModel', () => {
  it('treats a June receipt clearing May as May service-month settlement', () => {
    const model = buildParentMonthlyBillingReadModel({
      parentId: 'parent-1',
      monthKey: '2026-05',
      now: NOW,
      walletBalance: 0,
      charges: [
        charge({
          paidAmount: 12000,
          outstandingAmount: 0,
          paidAt: '2026-06-10T09:00:00.000Z',
          lastAllocatedAt: '2026-06-10T09:00:00.000Z',
          lastPaymentId: 'payment-june',
          lastAllocationRef: 'payments/payment-june/allocations/0001',
          paymentIds: ['payment-june'],
        }),
      ],
    });

    expect(model.billedAmount).toBe(12000);
    expect(model.settledAmount).toBe(12000);
    expect(model.dueAmount).toBe(0);
    expect(model.status).toBe('paid');
    expect(model.lastSettlementAtMs).toBe(Date.parse('2026-06-10T09:00:00.000Z'));
    expect(model.lastPaymentId).toBe('payment-june');
    expect(model.allocationRefs).toEqual(['payments/payment-june/allocations/0001']);
  });

  it('keeps partial settlement and due amount correct', () => {
    const model = buildParentMonthlyBillingReadModel({
      parentId: 'parent-1',
      monthKey: '2026-05',
      now: NOW,
      walletBalance: -2000,
      charges: [
        charge({
          paidAmount: 10000,
          outstandingAmount: 2000,
          lastAllocatedAt: '2026-06-10T09:00:00.000Z',
          lastPaymentId: 'payment-june',
        }),
      ],
    });

    expect(model.settledAmount).toBe(10000);
    expect(model.dueAmount).toBe(2000);
    expect(model.status).toBe('partial');
  });

  it('marks current month unpaid charges as current', () => {
    const model = buildParentMonthlyBillingReadModel({
      parentId: 'parent-1',
      monthKey: '2026-06',
      now: NOW,
      walletBalance: -12000,
      charges: [
        {
          id: 'charge-current',
          monthKey: '2026-06',
          amount: 12000,
          outstandingAmount: 12000,
        },
      ],
    });

    expect(model.status).toBe('current');
  });

  it('marks previous month unpaid charges as in_grace', () => {
    expect(resolveServiceMonthStatus('2026-05', 12000, 0, 12000, -12000, NOW)).toBe('in_grace');
  });

  it('marks older unpaid charges as overdue', () => {
    expect(resolveServiceMonthStatus('2026-04', 12000, 0, 12000, -12000, NOW)).toBe('overdue');
  });

  it('marks fully paid month with positive wallet balance as advance', () => {
    const model = buildParentMonthlyBillingReadModel({
      parentId: 'parent-1',
      monthKey: '2026-05',
      now: NOW,
      walletBalance: 3000,
      charges: [
        charge({
          paidAmount: 12000,
          outstandingAmount: 0,
          lastAllocatedAt: '2026-06-10T09:00:00.000Z',
        }),
      ],
    });

    expect(model.status).toBe('advance');
  });

  it('does not misuse receipt month as settlement when there are no service-month charges', () => {
    const model = buildParentMonthlyBillingReadModel({
      parentId: 'parent-1',
      monthKey: '2026-06',
      now: NOW,
      walletBalance: 0,
      charges: [],
    });

    expect(model.billedAmount).toBe(0);
    expect(model.settledAmount).toBe(0);
    expect(model.dueAmount).toBe(0);
    expect(model.status).not.toBe('paid');
  });

  it('collects service-month targets from payment allocation rows for read-model refreshes', () => {
    const targets = collectParentMonthlyBillingTargets(
      null,
      {
        parentId: 'parent-1',
        monthKey: '2026-06',
        allocations: [
          { chargeId: 'charge-may', chargeMonthKey: '2026-05' },
          { chargeId: 'charge-june', monthKey: '2026-06' },
        ],
      }
    );

    expect(targets).toEqual([
      { parentId: 'parent-1', monthKey: '2026-06' },
      { parentId: 'parent-1', monthKey: '2026-05' },
    ]);
  });
});
