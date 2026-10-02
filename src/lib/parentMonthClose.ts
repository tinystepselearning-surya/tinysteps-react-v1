export type ParentMonthCloseNextAction =
  | 'review_attendance'
  | 'continue_attendance'
  | 'review_billing'
  | 'send_invoice'
  | 'send_revised_invoice'
  | 'await_payment'
  | 'partial_payment'
  | 'closed'
  | 'closed_no_charge';

export interface ParentMonthCloseBillingSnapshot {
  parentId: string;
  monthKey: string;
  sessionCount: number;
  billedClassCount: number;
  billedAmount: number;
  settledAmount: number;
  dueAmount: number;
  chargeIds: string[];
  fingerprint: string;
}

export interface ParentMonthCloseProgressLike {
  status?: 'not_started' | 'in_progress' | 'completed' | null;
  billingReviewedAt?: string | null;
  billingReviewedFingerprint?: string | null;
  invoiceSentAt?: string | null;
  sentBillingFingerprint?: string | null;
}

const amount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

const integer = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(Math.floor(parsed), 0) : 0;
};

const readAttendanceSessionCount = (data: Record<string, unknown>): number => {
  const attendance = data.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return 0;
  const row = attendance as Record<string, unknown>;
  const direct = Number(row.sourceSessionCount ?? row.sourceSessionRecords);
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);
  const totals = row.totals;
  if (!totals || typeof totals !== 'object' || Array.isArray(totals)) return 0;
  const total = Number((totals as Record<string, unknown>).totalSessions ?? (totals as Record<string, unknown>).total);
  return Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
};

const uniqueSortedStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(
    value
      .map((item) => String(item || '').trim())
      .filter(Boolean),
  )).sort();
};

const stableHash = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export function buildParentMonthCloseBillingFingerprint(input: {
  billedClassCount: number;
  billedAmount: number;
  chargeIds?: string[];
}): string {
  const normalized = [
    Math.max(Math.floor(Number(input.billedClassCount) || 0), 0),
    Math.round(Math.max(Number(input.billedAmount) || 0, 0) * 100),
    ...(input.chargeIds || []).map((item) => String(item || '').trim()).filter(Boolean).sort(),
  ].join('|');
  return `v1:${stableHash(normalized)}`;
}

export function parentMonthCloseBillingSnapshot(
  data: Record<string, unknown>,
  fallbackParentId = '',
  fallbackMonthKey = '',
): ParentMonthCloseBillingSnapshot {
  const totals = data.totals && typeof data.totals === 'object' && !Array.isArray(data.totals)
    ? data.totals as Record<string, unknown>
    : {};
  const parentId = String(data.parentId || fallbackParentId || '').trim();
  const monthKey = String(data.monthKey || fallbackMonthKey || '').trim();
  const sessionCount = readAttendanceSessionCount(data);
  const billedClassCount = integer(data.billedClassCount ?? totals.billedClassCount ?? totals.chargesCount);
  const billedAmount = amount(data.billedAmount ?? totals.billedAmount);
  const settledAmount = Math.min(
    amount(
      data.settledAmount
      ?? data.appliedAmount
      ?? totals.settledAmount
      ?? totals.appliedAmount
      ?? totals.paidAmountFromCharges,
    ),
    billedAmount,
  );
  const rawDue = data.dueAmount ?? data.outstandingAmount ?? totals.dueAmount ?? totals.outstandingAmount;
  const dueAmount = rawDue == null
    ? Math.max(billedAmount - settledAmount, 0)
    : Math.min(amount(rawDue), billedAmount);
  const chargeIds = uniqueSortedStrings(data.chargeIds ?? totals.chargeIds);
  return {
    parentId,
    monthKey,
    sessionCount,
    billedClassCount,
    billedAmount,
    settledAmount,
    dueAmount,
    chargeIds,
    fingerprint: buildParentMonthCloseBillingFingerprint({
      billedClassCount,
      billedAmount,
      chargeIds,
    }),
  };
}

export function deriveParentMonthCloseNextAction(input: {
  progress?: ParentMonthCloseProgressLike | null;
  billing?: ParentMonthCloseBillingSnapshot | null;
}): ParentMonthCloseNextAction {
  const status = input.progress?.status ?? 'not_started';
  if (status === 'not_started') return 'review_attendance';
  if (status !== 'completed') return 'continue_attendance';

  const billing = input.billing;
  if (!billing) return 'review_billing';
  if (
    !input.progress?.billingReviewedAt
    || input.progress.billingReviewedFingerprint !== billing.fingerprint
  ) {
    return 'review_billing';
  }

  if (billing.billedAmount <= 0.01) return 'closed_no_charge';

  if (!input.progress.invoiceSentAt) return 'send_invoice';
  if (input.progress.sentBillingFingerprint !== billing.fingerprint) {
    return 'send_revised_invoice';
  }

  if (billing.dueAmount <= 0.01) return 'closed';
  if (billing.settledAmount > 0.01) return 'partial_payment';
  return 'await_payment';
}

export function parentMonthCloseNextActionLabel(action: ParentMonthCloseNextAction): string {
  switch (action) {
    case 'review_attendance': return 'Review attendance';
    case 'continue_attendance': return 'Continue attendance';
    case 'review_billing': return 'Review billing';
    case 'send_invoice': return 'Send invoice';
    case 'send_revised_invoice': return 'Send revised invoice';
    case 'partial_payment': return 'Follow up payment';
    case 'await_payment': return 'Await payment';
    case 'closed_no_charge': return 'Closed · no charges';
    case 'closed': return 'Closed';
    default: return 'Review';
  }
}

export function parentMonthClosePaymentLabel(
  billing?: ParentMonthCloseBillingSnapshot | null,
): string {
  if (!billing || billing.billedAmount <= 0.01) return 'No charges';
  if (billing.dueAmount <= 0.01) return 'Paid';
  if (billing.settledAmount > 0.01) return 'Partial';
  return 'Unpaid';
}
