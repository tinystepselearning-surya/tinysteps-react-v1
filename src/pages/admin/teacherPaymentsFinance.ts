export const TEACHER_PAYOUT_UI_SCHEMA_VERSION = 2;

const normalizeStatus = (value: unknown): string => String(value || '').trim().toLowerCase();

export const monthKeyFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const dateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const resolveTeacherNetEntitlementAmount = (earning: Record<string, unknown>): number => {
  const baseRaw = Number(earning.amount);
  const baseAmount = Number.isFinite(baseRaw) && baseRaw > 0 ? baseRaw : 0;
  const adjustmentStatus = normalizeStatus(earning.teacherPayAdjustmentStatus);
  const netRaw = Number(earning.teacherPayNetEntitlementAmount);
  if (
    adjustmentStatus === 'posted' &&
    earning.teacherPayAdjustmentRequired === false &&
    Number.isFinite(netRaw) &&
    netRaw >= 0
  ) {
    return netRaw;
  }
  return baseAmount;
};

export const resolveTeacherCashPaidAmount = (
  earning: Record<string, unknown>,
  entitlementAmount = resolveTeacherNetEntitlementAmount(earning),
): number => {
  const paidRaw = Number(earning.paidAmount);
  if (
    earning.paidAmount !== undefined &&
    earning.paidAmount !== null &&
    Number.isFinite(paidRaw) &&
    paidRaw >= 0
  ) return paidRaw;
  const status = normalizeStatus(earning.status);
  return status === 'paid' || status === 'settled' ? Math.max(entitlementAmount, 0) : 0;
};

export const resolveTeacherOffsetAppliedAmount = (earning: Record<string, unknown>): number => {
  const offsetRaw = Number(earning.teacherPayOffsetAppliedAmount);
  return Number.isFinite(offsetRaw) && offsetRaw > 0 ? offsetRaw : 0;
};

export const resolveTeacherSettlementAmounts = (earning: Record<string, unknown>) => {
  const entitlement = resolveTeacherNetEntitlementAmount(earning);
  const cashPaid = resolveTeacherCashPaidAmount(earning, entitlement);
  const offsetApplied = resolveTeacherOffsetAppliedAmount(earning);
  return {
    entitlement,
    cashPaid,
    offsetApplied,
    satisfied: cashPaid + offsetApplied,
    pending: Math.max(entitlement - cashPaid - offsetApplied, 0),
  };
};

export const resolveTeacherPaymentStatusLabel = (
  earning: Record<string, unknown>,
  fallback: string,
): string => {
  if (
    normalizeStatus(earning.status) === 'withheld' ||
    normalizeStatus(earning.teacherPayDisposition) === 'retain_school'
  ) {
    return 'School Retained';
  }

  if (normalizeStatus(earning.teacherPayAdjustmentStatus) === 'posted') {
    const baseRaw = Number(earning.amount);
    const base = Number.isFinite(baseRaw) && baseRaw > 0 ? baseRaw : 0;
    const net = resolveTeacherNetEntitlementAmount(earning);
    if (net < base - 0.01) return 'Adjusted — School Retained';
    if (net >= base - 0.01 && Number(earning.teacherPayAdjustmentNetAmount) === 0) {
      return 'Restored After Adjustment';
    }
    return 'Adjusted';
  }

  const offsetApplied = resolveTeacherOffsetAppliedAmount(earning);
  const settledBy = normalizeStatus(earning.settledBy);
  if (settledBy === 'cash_and_offset') return 'Settled by Cash + Carry';
  if (settledBy === 'offset') return 'Settled by Carry';
  if (offsetApplied > 0) return 'Carry Applied';

  return fallback;
};

export const buildTeacherPayoutV2Request = (input: {
  teacherId: string;
  amount: number;
  earningMonthKey: string;
  paymentDate: string;
  note?: string;
  idempotencyKey: string;
}) => {
  const earningMonthKey = String(input.earningMonthKey || '').trim();
  const paymentDate = String(input.paymentDate || '').trim();
  if (!/^\d{4}-\d{2}$/.test(earningMonthKey)) {
    throw new Error('Select a valid earning month.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    throw new Error('Select the actual payment date.');
  }
  if (!input.teacherId.trim()) throw new Error('Select a teacher.');
  if (!Number.isFinite(input.amount) || input.amount === 0) {
    throw new Error('Enter a non-zero payout amount.');
  }
  if (!input.idempotencyKey.trim()) throw new Error('Payout request key is missing.');

  return {
    teacherId: input.teacherId.trim(),
    amount: input.amount,
    earningMonthKey,
    // Date-only is intentional. Backend interprets this as an IST calendar date and stores a timestamp.
    paidAt: paymentDate,
    method: 'bank_transfer' as const,
    note: input.note?.trim() || undefined,
    idempotencyKey: input.idempotencyKey.trim(),
  };
};

export const resolvePayoutEarningMonthKey = (payout: Record<string, unknown>): string => {
  const explicit = String(payout.earningMonthKey || '').trim();
  if (/^\d{4}-\d{2}$/.test(explicit)) return explicit;
  const legacy = String(payout.monthKey || '').trim();
  return /^\d{4}-\d{2}$/.test(legacy) ? legacy : '';
};
