const IST_OFFSET_MINUTES = 330;
const EPSILON = 0.01;

export type ParentMonthlyBillingChargeInput = {
  id: string;
  amount?: unknown;
  paidAmount?: unknown;
  outstandingAmount?: unknown;
  status?: unknown;
  monthKey?: unknown;
  kidId?: unknown;
  studentId?: unknown;
  paymentIds?: unknown;
  lastPaymentId?: unknown;
  lastAllocationRef?: unknown;
  paidAt?: unknown;
  lastAllocatedAt?: unknown;
  archived?: unknown;
};

export type ParentMonthlyBillingReadModelInput = {
  parentId: string;
  monthKey: string;
  charges: ParentMonthlyBillingChargeInput[];
  walletBalance?: number | null;
  now?: Date;
};

type KidBucket = {
  kidId: string;
  chargesCount: number;
  billedAmount: number;
  billedClassCount: number;
  settledAmount: number;
  appliedAmount: number;
  paidAmountFromCharges: number;
  outstandingAmount: number;
  dueAmount: number;
  paymentsCount: number;
  paymentsTotal: number;
  paymentsApplied: number;
  paymentsUnapplied: number;
  lastSettlementAtMs: number | null;
  lastPaymentAtMs: number | null;
  lastPaymentId: string | null;
  allocationRefs: string[];
  chargeIds: string[];
  status: string;
};

export type ParentMonthlyBillingReadModelOutput = {
  parentId: string;
  monthKey: string;
  schemaVersion: number;
  modelType: string;
  allocationAware: true;
  computedFrom: string;
  generatedAtMs: number;
  billedAmount: number;
  billedClassCount: number;
  settledAmount: number;
  appliedAmount: number;
  outstandingAmount: number;
  dueAmount: number;
  status: string;
  lastSettlementAtMs: number | null;
  lastPaymentAtMs: number | null;
  lastPaymentId: string | null;
  allocationRefs: string[];
  chargeIds: string[];
  totals: {
    chargesCount: number;
    billedAmount: number;
    billedClassCount: number;
    settledAmount: number;
    appliedAmount: number;
    paidAmountFromCharges: number;
    outstandingAmount: number;
    dueAmount: number;
    paymentsCount: number;
    paymentsTotal: number;
    paymentsApplied: number;
    paymentsUnapplied: number;
    status: string;
    lastSettlementAtMs: number | null;
    lastPaymentAtMs: number | null;
    lastPaymentId: string | null;
    allocationRefs: string[];
    chargeIds: string[];
    allocationAware: true;
  };
  byKid: Record<string, KidBucket>;
};

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    const parsed = (value as { toDate: () => unknown }).toDate();
    if (parsed instanceof Date && !isNaN(parsed.getTime())) return parsed;
    return null;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parsed = new Date(`${raw}T00:00:00+05:30`);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function monthKeyFromDateIST(date: Date): string {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function normalizeStatus(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'settled') return 'paid';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

function isExcludedStatus(status: string): boolean {
  return (
    status === 'void' ||
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'reversed' ||
    status === 'refunded'
  );
}

function sanitizeKidId(value: unknown): string {
  const id = String(value || '').trim();
  return id || '_unassigned';
}

function normalizeMonthKey(value: unknown): string | null {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
}

function hasOwnNumber(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function hasSettlementEvidence(charge: ParentMonthlyBillingChargeInput): boolean {
  const paymentIds = Array.isArray(charge.paymentIds)
    ? charge.paymentIds.map((value) => String(value || '').trim()).filter(Boolean)
    : [];
  return Boolean(
    paymentIds.length > 0 ||
      String(charge.lastPaymentId || '').trim() ||
      String(charge.lastAllocationRef || '').trim() ||
      toDate(charge.lastAllocatedAt || charge.paidAt || null)
  );
}

export function resolveParentMonthlyChargePaidAmount(
  charge: ParentMonthlyBillingChargeInput,
  amount: number
): number {
  const boundedAmount = Math.max(amount, 0);
  const status = normalizeStatus(charge.status);

  if (status === 'paid') return boundedAmount;

  if (hasOwnNumber(charge.paidAmount)) {
    const paidRaw = Number(charge.paidAmount);
    return roundCurrency(Math.min(Math.max(paidRaw, 0), boundedAmount));
  }

  if (hasOwnNumber(charge.outstandingAmount)) {
    const outstandingRaw = Number(charge.outstandingAmount);
    const boundedOutstanding = Math.min(Math.max(outstandingRaw, 0), boundedAmount);

    // A legacy/default outstandingAmount=0 is not proof of payment by itself.
    // Only accept it as fully settled when there is independent settlement evidence.
    if (boundedOutstanding <= EPSILON && !hasSettlementEvidence(charge)) return 0;

    return roundCurrency(Math.max(boundedAmount - boundedOutstanding, 0));
  }

  return 0;
}

function toMonthOrdinal(monthKey: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return year * 12 + (month - 1);
}

export function resolveServiceMonthStatus(
  monthKey: string,
  billedAmount: number,
  settledAmount: number,
  dueAmount: number,
  walletBalance: number | null | undefined,
  now: Date
): string {
  if (billedAmount <= EPSILON) {
    const wallet = Number(walletBalance);
    return Number.isFinite(wallet) && wallet > EPSILON ? 'advance' : 'current';
  }
  if (dueAmount <= EPSILON) {
    const wallet = Number(walletBalance);
    if (Number.isFinite(wallet) && wallet > EPSILON) return 'advance';
    return 'paid';
  }
  if (settledAmount > EPSILON) return 'partial';

  const selectedOrdinal = toMonthOrdinal(monthKey);
  const currentOrdinal = toMonthOrdinal(monthKeyFromDateIST(now));
  if (selectedOrdinal == null || currentOrdinal == null) return 'unpaid';
  if (selectedOrdinal === currentOrdinal) return 'current';
  if (selectedOrdinal === currentOrdinal - 1) return 'in_grace';
  if (selectedOrdinal <= currentOrdinal - 2) return 'overdue';
  return 'unpaid';
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => String(value || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

export function buildParentMonthlyBillingReadModel(
  input: ParentMonthlyBillingReadModelInput
): ParentMonthlyBillingReadModelOutput {
  const now = input.now || new Date();
  const walletBalance =
    input.walletBalance == null || !Number.isFinite(Number(input.walletBalance))
      ? null
      : Number(input.walletBalance);

  const byKid = new Map<string, KidBucket>();
  const paymentIds = new Set<string>();
  const allocationRefs = new Set<string>();
  const chargeIds: string[] = [];

  let billedAmount = 0;
  let billedClassCount = 0;
  let settledAmount = 0;
  let dueAmount = 0;
  let outstandingAmount = 0;
  let lastSettlementAtMs: number | null = null;
  let lastPaymentId: string | null = null;

  const getKidBucket = (kidId: string): KidBucket => {
    let bucket = byKid.get(kidId);
    if (!bucket) {
      bucket = {
        kidId,
        chargesCount: 0,
        billedAmount: 0,
        billedClassCount: 0,
        settledAmount: 0,
        appliedAmount: 0,
        paidAmountFromCharges: 0,
        outstandingAmount: 0,
        dueAmount: 0,
        paymentsCount: 0,
        paymentsTotal: 0,
        paymentsApplied: 0,
        paymentsUnapplied: 0,
        lastSettlementAtMs: null,
        lastPaymentAtMs: null,
        lastPaymentId: null,
        allocationRefs: [],
        chargeIds: [],
        status: 'current',
      };
      byKid.set(kidId, bucket);
    }
    return bucket;
  };

  input.charges.forEach((charge) => {
    if (charge.archived === true) return;
    if (normalizeMonthKey(charge.monthKey) !== input.monthKey) return;

    const status = normalizeStatus(charge.status);
    if (isExcludedStatus(status)) return;

    const amount = Math.max(normalizeNumber(charge.amount), 0);
    if (amount <= 0) return;

    const paidAmount = roundCurrency(resolveParentMonthlyChargePaidAmount(charge, amount));
    const outstanding = roundCurrency(Math.max(amount - paidAmount, 0));
    const kidId = sanitizeKidId(charge.kidId ?? charge.studentId);
    const bucket = getKidBucket(kidId);
    const chargeId = String(charge.id || '').trim();

    billedAmount += amount;
    billedClassCount += 1;
    settledAmount += paidAmount;
    dueAmount += outstanding;
    outstandingAmount += outstanding;
    if (chargeId) chargeIds.push(chargeId);

    bucket.chargesCount += 1;
    bucket.billedAmount += amount;
    bucket.billedClassCount += 1;
    bucket.settledAmount += paidAmount;
    bucket.appliedAmount += paidAmount;
    bucket.paidAmountFromCharges += paidAmount;
    bucket.outstandingAmount += outstanding;
    bucket.dueAmount += outstanding;
    if (chargeId) bucket.chargeIds.push(chargeId);

    const directPaymentIds = Array.isArray(charge.paymentIds)
      ? charge.paymentIds.map((value) => String(value || '').trim()).filter(Boolean)
      : [];
    const lastPaymentIdCandidate = String(charge.lastPaymentId || '').trim();
    directPaymentIds.forEach((paymentId) => paymentIds.add(paymentId));
    if (lastPaymentIdCandidate) paymentIds.add(lastPaymentIdCandidate);

    const allocationRef = String(charge.lastAllocationRef || '').trim();
    if (allocationRef) {
      allocationRefs.add(allocationRef);
      bucket.allocationRefs.push(allocationRef);
    }

    const settlementMs =
      toDate(charge.lastAllocatedAt || charge.paidAt || null)?.getTime() || null;
    if (settlementMs && (!lastSettlementAtMs || settlementMs > lastSettlementAtMs)) {
      lastSettlementAtMs = settlementMs;
      lastPaymentId = lastPaymentIdCandidate || directPaymentIds[directPaymentIds.length - 1] || null;
    }
    if (settlementMs && (!bucket.lastSettlementAtMs || settlementMs > bucket.lastSettlementAtMs)) {
      bucket.lastSettlementAtMs = settlementMs;
      bucket.lastPaymentAtMs = settlementMs;
      bucket.lastPaymentId =
        lastPaymentIdCandidate || directPaymentIds[directPaymentIds.length - 1] || null;
    }
  });

  const roundedBilledAmount = roundCurrency(billedAmount);
  const roundedSettledAmount = roundCurrency(settledAmount);
  const roundedDueAmount = roundCurrency(dueAmount);
  const roundedOutstandingAmount = roundCurrency(outstandingAmount);
  const sortedChargeIds = uniqueSorted(chargeIds);
  const sortedAllocationRefs = uniqueSorted(Array.from(allocationRefs));
  const paymentsCount = paymentIds.size;
  const status = resolveServiceMonthStatus(
    input.monthKey,
    roundedBilledAmount,
    roundedSettledAmount,
    roundedDueAmount,
    walletBalance,
    now
  );

  const byKidObject: Record<string, KidBucket> = {};
  Array.from(byKid.values())
    .sort((left, right) => left.kidId.localeCompare(right.kidId))
    .forEach((bucket) => {
      const roundedKidBilled = roundCurrency(bucket.billedAmount);
      const roundedKidSettled = roundCurrency(bucket.settledAmount);
      const roundedKidDue = roundCurrency(bucket.dueAmount);
      const roundedKidOutstanding = roundCurrency(bucket.outstandingAmount);
      const uniquePaymentCount = new Set(
        bucket.allocationRefs
          .map((ref) => {
            const match = /^payments\/([^/]+)/.exec(ref);
            return match?.[1] || '';
          })
          .filter(Boolean)
      ).size;

      byKidObject[bucket.kidId] = {
        ...bucket,
        billedAmount: roundedKidBilled,
        settledAmount: roundedKidSettled,
        appliedAmount: roundedKidSettled,
        paidAmountFromCharges: roundedKidSettled,
        dueAmount: roundedKidDue,
        outstandingAmount: roundedKidOutstanding,
        paymentsCount: uniquePaymentCount,
        paymentsTotal: roundedKidSettled,
        paymentsApplied: roundedKidSettled,
        paymentsUnapplied: 0,
        allocationRefs: uniqueSorted(bucket.allocationRefs),
        chargeIds: uniqueSorted(bucket.chargeIds),
        status: resolveServiceMonthStatus(
          input.monthKey,
          roundedKidBilled,
          roundedKidSettled,
          roundedKidDue,
          walletBalance,
          now
        ),
      };
    });

  return {
    parentId: input.parentId,
    monthKey: input.monthKey,
    schemaVersion: 2,
    modelType: 'billing_v2',
    allocationAware: true,
    computedFrom: 'billingCharges + charge settlement metadata',
    generatedAtMs: Date.now(),
    billedAmount: roundedBilledAmount,
    billedClassCount,
    settledAmount: roundedSettledAmount,
    appliedAmount: roundedSettledAmount,
    outstandingAmount: roundedOutstandingAmount,
    dueAmount: roundedDueAmount,
    status,
    lastSettlementAtMs,
    lastPaymentAtMs: lastSettlementAtMs,
    lastPaymentId,
    allocationRefs: sortedAllocationRefs,
    chargeIds: sortedChargeIds,
    totals: {
      chargesCount: billedClassCount,
      billedAmount: roundedBilledAmount,
      billedClassCount,
      settledAmount: roundedSettledAmount,
      appliedAmount: roundedSettledAmount,
      paidAmountFromCharges: roundedSettledAmount,
      outstandingAmount: roundedOutstandingAmount,
      dueAmount: roundedDueAmount,
      paymentsCount,
      paymentsTotal: roundedSettledAmount,
      paymentsApplied: roundedSettledAmount,
      paymentsUnapplied: 0,
      status,
      lastSettlementAtMs,
      lastPaymentAtMs: lastSettlementAtMs,
      lastPaymentId,
      allocationRefs: sortedAllocationRefs,
      chargeIds: sortedChargeIds,
      allocationAware: true,
    },
    byKid: byKidObject,
  };
}
