import { describe, expect, it } from 'vitest';
import {
  applyBillingProjectionMutation,
  buildBillingProjectionState,
  shouldRefreshBillingChargeProjection,
  shouldRefreshPaymentProjection,
} from '../../../functions/src/parentMonthlyBillingProjectionV2';

const target = { parentId: 'parent-1', monthKey: '2026-08' };

const chargeData = (overrides: Record<string, unknown> = {}) => ({
  parentId: target.parentId,
  monthKey: target.monthKey,
  amount: 400,
  paidAmount: 0,
  outstandingAmount: 400,
  status: 'open',
  kidId: 'kid-1',
  ...overrides,
});

describe('parentMonthlyBillingProjectionV2', () => {
  it('skips billing-charge writes that only change operational metadata', () => {
    const before = chargeData({ updatedAt: '2026-08-24T00:00:00.000Z' });
    const after = chargeData({ updatedAt: '2026-08-24T00:01:00.000Z', updatedBy: 'admin-1' });

    expect(shouldRefreshBillingChargeProjection(before, after)).toBe(false);
  });

  it('refreshes when settlement state changes', () => {
    const before = chargeData();
    const after = chargeData({
      paidAmount: 400,
      outstandingAmount: 0,
      status: 'paid',
      lastPaymentId: 'payment-1',
    });

    expect(shouldRefreshBillingChargeProjection(before, after)).toBe(true);
  });

  it('skips payment metadata edits but refreshes allocation changes', () => {
    const before = {
      parentId: 'parent-1',
      receiptMonthKey: '2026-08',
      amount: 1200,
      allocations: [{ chargeId: 'charge-1', monthKey: '2026-08', allocatedAmount: 400 }],
      note: 'first note',
    };
    const metadataOnly = { ...before, note: 'updated note', reference: 'upi-123' };
    const changedAllocation = {
      ...before,
      allocations: [{ chargeId: 'charge-1', monthKey: '2026-08', allocatedAmount: 800 }],
    };

    expect(shouldRefreshPaymentProjection(before, metadataOnly)).toBe(false);
    expect(shouldRefreshPaymentProjection(before, changedAllocation)).toBe(true);
  });

  it('applies a newer charge mutation without rescanning unrelated charges', () => {
    const initial = buildBillingProjectionState([
      { id: 'charge-1', versionMs: 100, data: chargeData() },
      { id: 'charge-2', versionMs: 100, data: chargeData({ kidId: 'kid-2' }) },
    ], 100);

    const next = applyBillingProjectionMutation(initial, {
      chargeId: 'charge-1',
      versionMs: 200,
      ...target,
      afterData: chargeData({ paidAmount: 400, outstandingAmount: 0, status: 'paid' }),
    });

    expect(next.charges).toHaveLength(2);
    expect(next.charges.find((entry) => entry.id === 'charge-1')?.data.paidAmount).toBe(400);
    expect(next.charges.find((entry) => entry.id === 'charge-2')?.data.kidId).toBe('kid-2');
  });

  it('ignores an out-of-order older event', () => {
    const current = buildBillingProjectionState([
      {
        id: 'charge-1',
        versionMs: 300,
        data: chargeData({ paidAmount: 400, outstandingAmount: 0, status: 'paid' }),
      },
    ], 300);

    const stale = applyBillingProjectionMutation(current, {
      chargeId: 'charge-1',
      versionMs: 200,
      ...target,
      afterData: chargeData({ paidAmount: 0, outstandingAmount: 400, status: 'open' }),
    });

    expect(stale).toBe(current);
    expect(stale.charges[0].data.status).toBe('paid');
  });

  it('keeps a deletion tombstone so an older delayed update cannot resurrect a charge', () => {
    const initial = buildBillingProjectionState([
      { id: 'charge-1', versionMs: 100, data: chargeData() },
    ], 100);

    const deleted = applyBillingProjectionMutation(initial, {
      chargeId: 'charge-1',
      versionMs: 300,
      ...target,
      afterData: null,
    });
    expect(deleted.charges).toHaveLength(0);
    expect(deleted.tombstones).toEqual([{ id: 'charge-1', versionMs: 300 }]);

    const staleUpdate = applyBillingProjectionMutation(deleted, {
      chargeId: 'charge-1',
      versionMs: 200,
      ...target,
      afterData: chargeData(),
    });

    expect(staleUpdate.charges).toHaveLength(0);
    expect(staleUpdate.tombstones).toEqual([{ id: 'charge-1', versionMs: 300 }]);
  });

  it('removes a charge from the old parent-month when it moves', () => {
    const initial = buildBillingProjectionState([
      { id: 'charge-1', versionMs: 100, data: chargeData() },
    ], 100);

    const movedOut = applyBillingProjectionMutation(initial, {
      chargeId: 'charge-1',
      versionMs: 200,
      ...target,
      afterData: chargeData({ monthKey: '2026-09' }),
    });

    expect(movedOut.charges).toHaveLength(0);
    expect(movedOut.tombstones[0]).toEqual({ id: 'charge-1', versionMs: 200 });
  });
});
