export type ReceiveParentPaymentAllocationMode = 'fifo_then_wallet' | 'wallet_only';

export type ReceiveParentPaymentPreviewInput = {
  parentId: string;
  amount: number;
  paidAt: string;
  method: string;
  reference: string;
  note: string;
  allocationMode: ReceiveParentPaymentAllocationMode;
};

export type ReceiveParentPaymentAllocationRow = {
  chargeId: string;
  monthKey: string | null;
  eventDateKey: string | null;
  studentName: string | null;
  chargeAmount: number;
  previousPaidAmount: number;
  allocatedAmount: number;
  remainingDueAfter: number;
};

export const DEFAULT_RECEIVE_PARENT_PAYMENT_ALLOCATION_MODE: ReceiveParentPaymentAllocationMode =
  'fifo_then_wallet';

export const RECEIVE_PARENT_PAYMENT_STALE_PREVIEW_MESSAGE =
  'Inputs changed after preview. Preview allocation again before applying payment.';

export const receiveParentPaymentModeLabel = (mode: unknown): string => {
  const normalized = String(mode || '').trim().toLowerCase();
  if (normalized === 'wallet_only') return 'Advance wallet only';
  if (normalized === 'fifo_then_wallet' || normalized === 'legacy_then_wallet') {
    return 'Auto-apply to oldest dues';
  }
  return normalized ? normalized.replace(/_/g, ' ') : '—';
};

export const isReceiveParentPaymentAllocationMode = (
  value: string
): value is ReceiveParentPaymentAllocationMode => value === 'fifo_then_wallet' || value === 'wallet_only';

export const isSameReceiveParentPaymentPreviewInput = (
  a: ReceiveParentPaymentPreviewInput | null,
  b: ReceiveParentPaymentPreviewInput | null
): boolean => {
  if (!a || !b) return false;
  return (
    a.parentId === b.parentId &&
    a.amount === b.amount &&
    a.paidAt === b.paidAt &&
    a.method === b.method &&
    a.reference === b.reference &&
    a.note === b.note &&
    a.allocationMode === b.allocationMode
  );
};

export const normalizeReceivePaymentAllocationRows = (
  allocations: unknown[]
): ReceiveParentPaymentAllocationRow[] => {
  return allocations.map((allocation) => {
    const row = (allocation || {}) as Record<string, unknown>;
    return {
      chargeId: String(row.chargeId || row.billingChargeId || row.id || '').trim(),
      monthKey: typeof row.monthKey === 'string' ? row.monthKey : null,
      eventDateKey: typeof row.eventDateKey === 'string' ? row.eventDateKey : null,
      studentName: typeof row.studentName === 'string' ? row.studentName : null,
      chargeAmount: Number(row.chargeAmount ?? row.amountValue ?? row.chargeTotal ?? 0) || 0,
      previousPaidAmount:
        Number(row.previousPaidAmount ?? row.paidAmountBefore ?? row.previousPaid ?? 0) || 0,
      allocatedAmount: Number(row.allocatedAmount ?? row.amount ?? 0) || 0,
      remainingDueAfter:
        Number(row.remainingDueAfter ?? row.outstandingAfter ?? row.after ?? 0) || 0,
    };
  });
};
