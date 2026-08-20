import { describe, expect, it } from 'vitest';
import { buildParentPaymentsMonthAudit } from '../../../functions/src/reconcileParentPaymentsMonthReadModels';

describe('buildParentPaymentsMonthAudit', () => {
  it('derives billed, collected, due and parent counts from billing charges rather than read-model coverage', () => {
    const audit = buildParentPaymentsMonthAudit({
      monthKey: '2026-05',
      now: new Date('2026-08-20T12:00:00+05:30'),
      charges: [
        {
          id: 'charge-a',
          parentId: 'parent-a',
          monthKey: '2026-05',
          amount: 100,
          status: 'paid',
          paidAmount: 100,
          outstandingAmount: 0,
          lastPaymentId: 'payment-a',
        },
        {
          id: 'charge-b',
          parentId: 'parent-b',
          monthKey: '2026-05',
          amount: 100,
          status: 'partial',
          paidAmount: 40,
          outstandingAmount: 60,
          lastPaymentId: 'payment-b',
        },
        {
          id: 'charge-c',
          parentId: 'parent-c',
          monthKey: '2026-05',
          amount: 100,
          status: 'open',
          outstandingAmount: 0,
        },
      ],
      existingReadModels: [
        {
          parentId: 'parent-a',
          monthKey: '2026-05',
          billedAmount: 100,
          billedClassCount: 1,
          settledAmount: 100,
          dueAmount: 0,
          status: 'paid',
        },
        {
          parentId: 'parent-b',
          monthKey: '2026-05',
          billedAmount: 100,
          billedClassCount: 1,
          settledAmount: 100,
          dueAmount: 0,
          status: 'paid',
        },
      ],
      walletBalances: {
        'parent-a': 0,
        'parent-b': 0,
        'parent-c': 0,
      },
    });

    expect(audit.summary).toMatchObject({
      billedAmount: 300,
      settledAmount: 140,
      dueAmount: 160,
      parentsBilled: 3,
      paidParents: 1,
      partialParents: 1,
      unpaidParents: 1,
      parentsWithDue: 2,
      missingReadModels: 1,
      mismatchedReadModels: 1,
    });
    expect(audit.summary.collectionRate).toBeCloseTo(46.67, 2);
    expect(audit.mismatches.map((row) => [row.parentId, row.reason])).toEqual([
      ['parent-b', 'totals_mismatch'],
      ['parent-c', 'missing_read_model'],
    ]);
  });

  it('flags a stale read model when the parent has no active charges for the month', () => {
    const audit = buildParentPaymentsMonthAudit({
      monthKey: '2026-05',
      now: new Date('2026-08-20T12:00:00+05:30'),
      charges: [],
      existingReadModels: [
        {
          parentId: 'parent-stale',
          monthKey: '2026-05',
          billedAmount: 500,
          billedClassCount: 1,
          settledAmount: 500,
          dueAmount: 0,
          status: 'paid',
        },
      ],
    });

    expect(audit.summary.billedAmount).toBe(0);
    expect(audit.summary.parentsBilled).toBe(0);
    expect(audit.summary.staleReadModels).toBe(1);
    expect(audit.mismatches[0]).toMatchObject({
      parentId: 'parent-stale',
      reason: 'stale_read_model',
    });
  });
});
