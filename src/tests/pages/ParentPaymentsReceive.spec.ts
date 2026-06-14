import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE,
  isReceiveParentPaymentAllocationMode,
  isSameReceiveParentPaymentPreviewInput,
  normalizeReceivePaymentAllocationRows,
  RECEIVE_PARENT_PAYMENT_STALE_PREVIEW_MESSAGE,
  receiveParentPaymentModeLabel,
} from '../../pages/admin/parentPaymentReceive';

describe('parentPaymentReceive helpers', () => {
  it('defaults to auto-applying receipts to oldest dues', () => {
    expect(DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE).toBe('fifo_then_wallet');
  });

  it('keeps wallet-only as an explicit advanced mode', () => {
    expect(isReceiveParentPaymentAllocationMode('wallet_only')).toBe(true);
    expect(receiveParentPaymentModeLabel('wallet_only')).toBe('Advance wallet only');
  });

  it('maps FIFO allocation rows for the admin preview table', () => {
    const rows = normalizeReceivePaymentAllocationRows([
      {
        chargeId: 'charge-may',
        monthKey: '2026-05',
        eventDateKey: '2026-05-10',
        studentName: 'Student One',
        chargeAmount: 12000,
        previousPaidAmount: 4000,
        allocatedAmount: 8000,
        remainingDueAfter: 0,
      },
    ]);

    expect(rows).toEqual([
      {
        chargeId: 'charge-may',
        monthKey: '2026-05',
        eventDateKey: '2026-05-10',
        studentName: 'Student One',
        chargeAmount: 12000,
        previousPaidAmount: 4000,
        allocatedAmount: 8000,
        remainingDueAfter: 0,
      },
    ]);
  });

  it('treats legacy FIFO mode labels as auto-apply oldest dues for compatibility', () => {
    expect(receiveParentPaymentModeLabel('legacy_then_wallet')).toBe(
      'Auto-apply to oldest dues'
    );
  });

  it('compares preview inputs exactly before allowing apply', () => {
    const base = {
      parentId: 'parent-1',
      amount: 12000,
      paidAt: '2026-06-14',
      method: 'UPI',
      reference: 'ref-1',
      note: 'note',
      allocationMode: 'fifo_then_wallet' as const,
    };

    expect(isSameReceiveParentPaymentPreviewInput(base, { ...base })).toBe(true);
    expect(
      isSameReceiveParentPaymentPreviewInput(base, {
        ...base,
        allocationMode: 'wallet_only',
      })
    ).toBe(false);
    expect(RECEIVE_PARENT_PAYMENT_STALE_PREVIEW_MESSAGE).toMatch(/preview allocation again/i);
  });
});
