import {
  buildParentPaymentBackfillDryRunReport,
  type ParentPaymentBackfillAuditInput,
  type ParentPaymentBackfillAuditReport,
  type ParentPaymentBackfillChargeInput,
  type ParentPaymentBackfillPaymentInput,
  type ParentPaymentBackfillParentReport,
} from './parentPaymentBackfillAudit';

const EPSILON = 0.01;
const IST_OFFSET_MINUTES = 330;
const DEFAULT_MAX_PARENTS = 5;
const DEFAULT_MAX_PAYMENTS_PER_PARENT = 50;
const MAX_WRITES_PER_PARENT = 350;
const ALLOCATION_BACKFILL_VERSION = 1;

export type ParentPaymentBackfillWriteMode = 'write';

export type ParentPaymentBackfillWritePlanInput = Omit<
  ParentPaymentBackfillAuditInput,
  'mode' | 'includeArchived' | 'parentId'
> & {
  mode: ParentPaymentBackfillWriteMode;
  parentIds: string[];
  includeArchived?: boolean;
  maxParents?: number;
  maxPaymentsPerParent?: number;
  allowWalletDrift?: boolean;
  allowAnomalies?: boolean;
  runId?: string;
};

export type ParentPaymentBackfillPaymentPatchPlan = {
  paymentId: string;
  parentId: string;
  paidAtIso: string | null;
  allocationDocIds: string[];
  sourceVerification: NormalizedParentPaymentBackfillPaymentSourceState;
  data: {
    allocationModeUsed: 'fifo_then_wallet_backfill';
    receiptMonthKey: string | null;
    monthKey: string | null;
    paidDateKey: string | null;
    allocatedAmount: number;
    legacyAppliedAmount: number;
    appliedAmount: number;
    unallocatedAmount: number;
    unappliedAmount: number;
    advanceAmount: number;
    walletTopupAmount: number;
    appliedChargeIds: string[];
    appliedAllocations: Array<{ chargeId: string; amount: number }>;
    allocations: Array<Record<string, unknown>>;
    allocationBackfilled: true;
    backfilledBy: 'parentPaymentBackfill';
    backfillRunId: string;
    backfillSourcePaymentId: string;
    allocationBackfillVersion: number;
  };
};

export type ParentPaymentBackfillAllocationDocPlan = {
  paymentId: string;
  allocationDocId: string;
  chargeId: string;
  parentId: string;
  chargeMonthKey: string | null;
  paidAtIso: string | null;
  data: Record<string, unknown>;
};

export type ParentPaymentBackfillChargePatchPlan = {
  chargeId: string;
  parentId: string;
  monthKey: string | null;
  clearPaidAt: boolean;
  paidAtIso: string | null;
  lastAllocatedAtIso: string | null;
  sourceVerification: NormalizedParentPaymentBackfillChargeSourceState;
  data: {
    paidAmount: number;
    outstandingAmount: number;
    status: 'paid' | 'partial' | 'unpaid';
    lastPaymentId: string | null;
    lastAllocationRef: string | null;
    lastAllocationReceiptMonthKey: string | null;
    paymentIds: string[];
    allocationBackfilled: true;
    backfilledBy: 'parentPaymentBackfill';
    backfillRunId: string;
    allocationBackfillVersion: number;
  };
};

export type ParentPaymentBackfillParentWritePlan = {
  parentId: string;
  status: 'apply' | 'skip';
  recommendedActionBefore: string;
  recommendedActionAfter: string;
  monthsImpacted: string[];
  paymentsBackfilled: string[];
  paymentPatches: ParentPaymentBackfillPaymentPatchPlan[];
  allocationDocPatches: ParentPaymentBackfillAllocationDocPlan[];
  chargePatches: ParentPaymentBackfillChargePatchPlan[];
  writeCountEstimate: number;
};

export type ParentPaymentBackfillWritePlan = {
  mode: ParentPaymentBackfillWriteMode;
  runId: string;
  writeSafety: {
    changesWalletBalances: false;
    createsWalletTransactions: false;
    writesPayments: boolean;
    writesBillingCharges: boolean;
    writesParentMonthlyReadModels: boolean;
  };
  beforeReport: ParentPaymentBackfillAuditReport;
  afterReport: ParentPaymentBackfillAuditReport;
  parentPlans: ParentPaymentBackfillParentWritePlan[];
};

type MutableChargeState = {
  chargeId: string;
  parentId: string;
  monthKey: string | null;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  paidAtIso: string | null;
  lastAllocatedAtIso: string | null;
  lastPaymentId: string | null;
  lastAllocationRef: string | null;
  lastAllocationReceiptMonthKey: string | null;
  paymentIds: string[];
  changed: boolean;
};

export type NormalizedParentPaymentBackfillPaymentSourceState = {
  parentId: string | null;
  archived: boolean;
  amount: number;
  paidAtIso: string | null;
  createdAtIso: string | null;
  receiptMonthKey: string | null;
  monthKey: string | null;
  paidDateKey: string | null;
  allocationModeUsed: string | null;
  allocatedAmount: number;
  legacyAppliedAmount: number;
  appliedAmount: number;
  unallocatedAmount: number;
  unappliedAmount: number;
  advanceAmount: number;
  walletTopupAmount: number;
  walletTransactionId: string | null;
  appliedChargeIds: string[];
  appliedAllocations: Array<{ chargeId: string; amount: number }>;
  allocations: Array<{
    chargeId: string;
    monthKey: string | null;
    chargeMonthKey: string | null;
    amount: number;
    allocatedAmount: number;
    previousPaidAmount: number;
    remainingDueAfter: number;
  }>;
};

export type NormalizedParentPaymentBackfillChargeSourceState = {
  parentId: string | null;
  archived: boolean;
  amount: number;
  monthKey: string | null;
  status: string;
  paidAmount: number;
  outstandingAmount: number;
  paidAtIso: string | null;
  lastAllocatedAtIso: string | null;
  lastPaymentId: string | null;
  lastAllocationRef: string | null;
  lastAllocationReceiptMonthKey: string | null;
  paymentIds: string[];
};

function normalizeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function normalizeOptionalText(value: unknown, maxLength = 200): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  return raw.slice(0, maxLength);
}

function normalizeOptionalId(value: unknown, maxLength = 150): string | null {
  const normalized = normalizeOptionalText(value, maxLength);
  if (!normalized || normalized === '.' || normalized === '..' || normalized.includes('/')) {
    return null;
  }
  return normalized;
}

function normalizeMonthKey(value: unknown): string | null {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
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

function normalizeAllocationMode(value: unknown): string | null {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'legacy_then_wallet') return 'fifo_then_wallet';
  return raw;
}

function normalizeAllocationList(
  value: unknown
): Array<{
  chargeId: string;
  monthKey: string | null;
  chargeMonthKey: string | null;
  amount: number;
  allocatedAmount: number;
  previousPaidAmount: number;
  remainingDueAfter: number;
}> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = (item || {}) as Record<string, unknown>;
      return {
        chargeId: String(row.chargeId || '').trim(),
        monthKey: normalizeMonthKey(row.monthKey),
        chargeMonthKey: normalizeMonthKey(row.chargeMonthKey),
        amount: roundCurrency(normalizeNumber(row.amount, 0)),
        allocatedAmount: roundCurrency(
          normalizeNumber(row.allocatedAmount ?? row.amount, 0)
        ),
        previousPaidAmount: roundCurrency(normalizeNumber(row.previousPaidAmount, 0)),
        remainingDueAfter: roundCurrency(normalizeNumber(row.remainingDueAfter, 0)),
      };
    })
    .filter((row) => row.chargeId)
    .sort(
      (left, right) =>
        left.chargeId.localeCompare(right.chargeId) ||
        String(left.chargeMonthKey || left.monthKey || '').localeCompare(
          String(right.chargeMonthKey || right.monthKey || '')
        ) ||
        left.allocatedAmount - right.allocatedAmount
    );
}

function normalizeAppliedAllocations(
  value: unknown
): Array<{ chargeId: string; amount: number }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = (item || {}) as Record<string, unknown>;
      return {
        chargeId: String(row.chargeId || '').trim(),
        amount: roundCurrency(normalizeNumber(row.amount, 0)),
      };
    })
    .filter((row) => row.chargeId)
    .sort(
      (left, right) =>
        left.chargeId.localeCompare(right.chargeId) || left.amount - right.amount
    );
}

export function normalizeParentPaymentBackfillPaymentSourceState(
  data: Record<string, unknown>
): NormalizedParentPaymentBackfillPaymentSourceState {
  return {
    parentId: normalizeOptionalId(data.parentId),
    archived: data.archived === true,
    amount: roundCurrency(normalizeNumber(data.amount, 0)),
    paidAtIso: toDate(data.paidAt || data.date)?.toISOString() || null,
    createdAtIso: toDate(data.createdAt)?.toISOString() || null,
    receiptMonthKey: normalizeMonthKey(data.receiptMonthKey),
    monthKey: normalizeMonthKey(data.monthKey),
    paidDateKey: normalizeOptionalText(data.paidDateKey, 20),
    allocationModeUsed: normalizeAllocationMode(data.allocationModeUsed),
    allocatedAmount: roundCurrency(normalizeNumber(data.allocatedAmount, 0)),
    legacyAppliedAmount: roundCurrency(normalizeNumber(data.legacyAppliedAmount, 0)),
    appliedAmount: roundCurrency(normalizeNumber(data.appliedAmount, 0)),
    unallocatedAmount: roundCurrency(normalizeNumber(data.unallocatedAmount, 0)),
    unappliedAmount: roundCurrency(normalizeNumber(data.unappliedAmount, 0)),
    advanceAmount: roundCurrency(normalizeNumber(data.advanceAmount, 0)),
    walletTopupAmount: roundCurrency(normalizeNumber(data.walletTopupAmount, 0)),
    walletTransactionId: normalizeOptionalId(data.walletTransactionId),
    appliedChargeIds: uniqueSorted(
      Array.isArray(data.appliedChargeIds)
        ? data.appliedChargeIds.map((item) => String(item || '').trim())
        : []
    ),
    appliedAllocations: normalizeAppliedAllocations(data.appliedAllocations),
    allocations: normalizeAllocationList(data.allocations),
  };
}

export function normalizeParentPaymentBackfillChargeSourceState(
  data: Record<string, unknown>
): NormalizedParentPaymentBackfillChargeSourceState {
  return {
    parentId: normalizeOptionalId(data.parentId),
    archived: data.archived === true,
    amount: roundCurrency(normalizeNumber(data.amount, 0)),
    monthKey: normalizeMonthKey(data.monthKey),
    status: String(data.status || '').trim().toLowerCase(),
    paidAmount: roundCurrency(normalizeNumber(data.paidAmount, 0)),
    outstandingAmount: roundCurrency(normalizeNumber(data.outstandingAmount, 0)),
    paidAtIso: toDate(data.paidAt)?.toISOString() || null,
    lastAllocatedAtIso: toDate(data.lastAllocatedAt)?.toISOString() || null,
    lastPaymentId: normalizeOptionalId(data.lastPaymentId),
    lastAllocationRef: normalizeOptionalText(data.lastAllocationRef, 250),
    lastAllocationReceiptMonthKey: normalizeMonthKey(data.lastAllocationReceiptMonthKey),
    paymentIds: uniqueSorted(
      Array.isArray(data.paymentIds)
        ? data.paymentIds.map((item) => String(item || '').trim())
        : []
    ),
  };
}

export function validateParentPaymentBackfillParentIds(values: unknown[]): string[] {
  return uniqueSorted(
    values.map((value) => {
      const normalized = normalizeOptionalId(value, 150);
      if (!normalized) {
        throw new Error(`Invalid parentId: ${String(value || '').trim() || '(empty)'}`);
      }
      return normalized;
    })
  );
}

function monthKeyFromDateIST(date: Date): string {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function dayKeyFromDateIST(date: Date): string {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveChargePaidAmount(data: Record<string, unknown>, amount: number): number {
  const paidRaw = normalizeNumber(data.paidAmount, Number.NaN);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }

  const outstandingRaw = normalizeNumber(data.outstandingAmount, Number.NaN);
  if (Number.isFinite(outstandingRaw) && outstandingRaw >= 0) {
    const boundedOutstanding = Math.min(Math.max(outstandingRaw, 0), Math.max(amount, 0));
    return roundCurrency(Math.max(amount - boundedOutstanding, 0));
  }

  const status = String(data.status || '').trim().toLowerCase();
  if (status === 'paid' || status === 'settled') return Math.max(amount, 0);
  return 0;
}

function createRunId(now: Date): string {
  return `parent_payment_backfill_${now.getTime()}`;
}

function clonePaymentInput(payment: ParentPaymentBackfillPaymentInput): ParentPaymentBackfillPaymentInput {
  return {
    id: payment.id,
    data: { ...(payment.data || {}) },
    allocationDocs: Array.isArray(payment.allocationDocs)
      ? payment.allocationDocs.map((doc) => ({
          id: doc.id,
          data: { ...(doc.data || {}) },
        }))
      : [],
  };
}

function cloneChargeInput(charge: ParentPaymentBackfillChargeInput): ParentPaymentBackfillChargeInput {
  return {
    id: charge.id,
    data: { ...(charge.data || {}) },
  };
}

function createMutableChargeState(charge: ParentPaymentBackfillChargeInput): MutableChargeState | null {
  const parentId = String(charge.data.parentId || '').trim();
  const amount = roundCurrency(Math.max(normalizeNumber(charge.data.amount, 0), 0));
  if (!parentId || amount <= 0) return null;

  const paidAmount = roundCurrency(resolveChargePaidAmount(charge.data, amount));
  const outstandingAmount = roundCurrency(
    Math.max(
      Number.isFinite(Number(charge.data.outstandingAmount))
        ? normalizeNumber(charge.data.outstandingAmount, 0)
        : amount - paidAmount,
      0
    )
  );
  const rawStatus = String(charge.data.status || '').trim().toLowerCase();
  const status =
    outstandingAmount <= EPSILON ? 'paid' : paidAmount > EPSILON ? 'partial' : rawStatus === 'partial' ? 'partial' : 'unpaid';
  const paymentIds = Array.isArray(charge.data.paymentIds)
    ? charge.data.paymentIds.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  return {
    chargeId: charge.id,
    parentId,
    monthKey: normalizeMonthKey(charge.data.monthKey),
    amount,
    paidAmount,
    outstandingAmount,
    status,
    paidAtIso: toDate(charge.data.paidAt)?.toISOString() || null,
    lastAllocatedAtIso: toDate(charge.data.lastAllocatedAt)?.toISOString() || null,
    lastPaymentId: normalizeOptionalText(charge.data.lastPaymentId, 150),
    lastAllocationRef: normalizeOptionalText(charge.data.lastAllocationRef, 250),
    lastAllocationReceiptMonthKey: normalizeMonthKey(charge.data.lastAllocationReceiptMonthKey),
    paymentIds,
    changed: false,
  };
}

function ensureParentReportSafe(parentReport: ParentPaymentBackfillParentReport): void {
  if (Math.abs(parentReport.summary.walletDrift) > EPSILON) {
    throw new Error(`parent ${parentReport.summary.parentId} has wallet drift`);
  }
  if (parentReport.summary.anomalyCount > 0) {
    throw new Error(`parent ${parentReport.summary.parentId} has anomalies`);
  }
  const blockedPayment = parentReport.payments.find(
    (payment) =>
      payment.classification === 'duplicate_suspect' ||
      payment.baseClassification === 'mixed_schema' ||
      payment.baseClassification === 'legacy_allocated'
  );
  if (blockedPayment) {
    throw new Error(
      `parent ${parentReport.summary.parentId} contains blocked payment ${blockedPayment.paymentId} (${blockedPayment.classification})`
    );
  }
  const recommended = parentReport.summary.recommendedAction;
  if (recommended !== 'safe_to_backfill' && recommended !== 'already_current') {
    throw new Error(
      `parent ${parentReport.summary.parentId} is not safe to backfill (recommendedAction=${recommended})`
    );
  }
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => String(value || '').trim()).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right));
}

function estimateWriteCount(
  paymentPatches: ParentPaymentBackfillPaymentPatchPlan[],
  allocationDocPatches: ParentPaymentBackfillAllocationDocPlan[],
  chargePatches: ParentPaymentBackfillChargePatchPlan[],
  monthsImpacted: string[]
): number {
  return (
    paymentPatches.length +
    allocationDocPatches.length +
    chargePatches.length +
    monthsImpacted.length
  );
}

export function buildParentPaymentBackfillWritePlan(
  input: ParentPaymentBackfillWritePlanInput
): ParentPaymentBackfillWritePlan {
  if (input.mode !== 'write') {
    throw new Error('mode must be "write"');
  }
  if (input.includeArchived === true) {
    throw new Error('includeArchived must remain false in write mode');
  }

  const now = input.now || new Date();
  const runId = normalizeOptionalText(input.runId, 200) || createRunId(now);
  const parentIds = validateParentPaymentBackfillParentIds(input.parentIds);
  if (parentIds.length === 0) {
    throw new Error('parentIds is required');
  }
  const maxParents = Math.max(1, Math.floor(input.maxParents || DEFAULT_MAX_PARENTS));
  if (parentIds.length > maxParents) {
    throw new Error(`parentIds exceeds maxParents (${maxParents})`);
  }
  const maxPaymentsPerParent = Math.max(
    1,
    Math.floor(input.maxPaymentsPerParent || DEFAULT_MAX_PAYMENTS_PER_PARENT)
  );

  const beforeReport = buildParentPaymentBackfillDryRunReport({
    ...input,
    mode: 'dry_run',
    includeArchived: false,
  });

  const simulatedPayments = input.payments.map(clonePaymentInput);
  const simulatedCharges = input.charges.map(cloneChargeInput);
  const paymentInputById = new Map(simulatedPayments.map((payment) => [payment.id, payment]));
  const chargeInputById = new Map(simulatedCharges.map((charge) => [charge.id, charge]));

  const parentPlans: ParentPaymentBackfillParentWritePlan[] = [];

  parentIds.forEach((parentId) => {
    const parentReport = beforeReport.parents.find((parent) => parent.summary.parentId === parentId);
    if (!parentReport) {
      throw new Error(`selected parent ${parentId} is missing from recomputed dry-run report`);
    }

    ensureParentReportSafe(parentReport);

    if (parentReport.payments.length > maxPaymentsPerParent) {
      throw new Error(
        `parent ${parentId} exceeds maxPaymentsPerParent (${parentReport.payments.length} > ${maxPaymentsPerParent})`
      );
    }

    if (parentReport.summary.recommendedAction === 'already_current') {
      parentPlans.push({
        parentId,
        status: 'skip',
        recommendedActionBefore: parentReport.summary.recommendedAction,
        recommendedActionAfter: parentReport.summary.recommendedAction,
        monthsImpacted: [],
        paymentsBackfilled: [],
        paymentPatches: [],
        allocationDocPatches: [],
        chargePatches: [],
        writeCountEstimate: 0,
      });
      return;
    }

    const mutableChargeStateById = new Map<string, MutableChargeState>();
    simulatedCharges
      .filter((charge) => String(charge.data.parentId || '').trim() === parentId)
      .forEach((charge) => {
        const state = createMutableChargeState(charge);
        if (!state) return;
        mutableChargeStateById.set(charge.id, state);
      });

    const paymentPatches: ParentPaymentBackfillPaymentPatchPlan[] = [];
    const allocationDocPatches: ParentPaymentBackfillAllocationDocPlan[] = [];
    const monthsImpacted = new Set<string>();

    parentReport.payments.forEach((paymentPreview) => {
      if (paymentPreview.classification !== 'old_wallet_only') return;
      if (paymentPreview.dryRunAllocatedAmount <= EPSILON) return;
      const paymentInput = paymentInputById.get(paymentPreview.paymentId);
      if (!paymentInput) {
        throw new Error(`payment ${paymentPreview.paymentId} not found for parent ${parentId}`);
      }
      const sourceVerification = normalizeParentPaymentBackfillPaymentSourceState(paymentInput.data);

      const paidAt = toDate(paymentInput.data.paidAt || paymentInput.data.date || paymentInput.data.createdAt);
      const paidAtIso = paidAt ? paidAt.toISOString() : paymentPreview.paidAt;
      const receiptMonthKey =
        normalizeMonthKey(paymentInput.data.receiptMonthKey) ||
        normalizeMonthKey(paymentInput.data.monthKey) ||
        (paidAt ? monthKeyFromDateIST(paidAt) : null);
      const appliedChargeIds: string[] = [];
      const appliedAllocations: Array<{ chargeId: string; amount: number }> = [];
      const inlineAllocations: Array<Record<string, unknown>> = [];
      const allocationDocIds: string[] = [];

      paymentPreview.allocationRows.forEach((allocationRow, index) => {
        const chargeState = mutableChargeStateById.get(allocationRow.chargeId);
        if (!chargeState) {
          throw new Error(`charge ${allocationRow.chargeId} not found for parent ${parentId}`);
        }
        if (Math.abs(chargeState.paidAmount - allocationRow.previousPaidAmount) > EPSILON) {
          throw new Error(
            `charge ${allocationRow.chargeId} previousPaidAmount drifted before payment ${paymentPreview.paymentId} could be backfilled`
          );
        }

        const sequence = index + 1;
        const allocationDocId = String(sequence).padStart(4, '0');
        const allocationRef = `payments/${paymentPreview.paymentId}/allocations/${allocationDocId}`;
        const nextPaidAmount = roundCurrency(chargeState.paidAmount + allocationRow.allocationAmount);
        const nextOutstandingAmount = roundCurrency(
          Math.max(chargeState.amount - nextPaidAmount, 0)
        );

        chargeState.paidAmount = nextPaidAmount;
        chargeState.outstandingAmount = nextOutstandingAmount;
        chargeState.status =
          nextOutstandingAmount <= EPSILON
            ? 'paid'
            : nextPaidAmount > EPSILON
              ? 'partial'
              : 'unpaid';
        chargeState.lastAllocatedAtIso = paidAtIso;
        chargeState.lastPaymentId = paymentPreview.paymentId;
        chargeState.lastAllocationRef = allocationRef;
        chargeState.lastAllocationReceiptMonthKey = receiptMonthKey;
        chargeState.paymentIds = uniqueSorted([...chargeState.paymentIds, paymentPreview.paymentId]);
        chargeState.paidAtIso = nextOutstandingAmount <= EPSILON ? paidAtIso : null;
        chargeState.changed = true;

        if (chargeState.monthKey) monthsImpacted.add(chargeState.monthKey);
        if (allocationRow.chargeMonthKey) monthsImpacted.add(allocationRow.chargeMonthKey);

        appliedChargeIds.push(allocationRow.chargeId);
        appliedAllocations.push({
          chargeId: allocationRow.chargeId,
          amount: allocationRow.allocationAmount,
        });
        inlineAllocations.push({
          chargeId: allocationRow.chargeId,
          monthKey: allocationRow.chargeMonthKey,
          chargeMonthKey: allocationRow.chargeMonthKey,
          amount: allocationRow.allocationAmount,
          allocatedAmount: allocationRow.allocationAmount,
          previousPaidAmount: allocationRow.previousPaidAmount,
          remainingDueAfter: allocationRow.remainingDueAfter,
          receiptMonthKey,
          paidAt: paidAtIso,
          eventDateKey: paidAt ? dayKeyFromDateIST(paidAt) : null,
          sequence,
          source: 'historical_wallet_only_backfill',
          backfillRunId: runId,
          backfillSourcePaymentId: paymentPreview.paymentId,
          allocationBackfillVersion: ALLOCATION_BACKFILL_VERSION,
        });
        allocationDocIds.push(allocationDocId);
        allocationDocPatches.push({
          paymentId: paymentPreview.paymentId,
          allocationDocId,
          chargeId: allocationRow.chargeId,
          parentId,
          chargeMonthKey: allocationRow.chargeMonthKey,
          paidAtIso,
          data: {
            parentId,
            paymentId: paymentPreview.paymentId,
            chargeId: allocationRow.chargeId,
            chargeMonthKey: allocationRow.chargeMonthKey,
            amount: allocationRow.allocationAmount,
            allocatedAmount: allocationRow.allocationAmount,
            previousPaidAmount: allocationRow.previousPaidAmount,
            remainingDueAfter: allocationRow.remainingDueAfter,
            paidAt: paidAtIso,
            sequence,
            source: 'historical_wallet_only_backfill',
            backfillRunId: runId,
            backfilledBy: 'parentPaymentBackfill',
            backfillSourcePaymentId: paymentPreview.paymentId,
            allocationBackfillVersion: ALLOCATION_BACKFILL_VERSION,
          },
        });
      });

      paymentPatches.push({
        paymentId: paymentPreview.paymentId,
        parentId,
        paidAtIso,
        allocationDocIds,
        sourceVerification,
        data: {
          allocationModeUsed: 'fifo_then_wallet_backfill',
          receiptMonthKey,
          monthKey: receiptMonthKey,
          paidDateKey: paidAt ? dayKeyFromDateIST(paidAt) : null,
          allocatedAmount: paymentPreview.dryRunAllocatedAmount,
          legacyAppliedAmount: paymentPreview.dryRunAllocatedAmount,
          appliedAmount: paymentPreview.dryRunAllocatedAmount,
          unallocatedAmount: paymentPreview.dryRunAdvanceAmount,
          unappliedAmount: paymentPreview.dryRunAdvanceAmount,
          advanceAmount: paymentPreview.dryRunAdvanceAmount,
          walletTopupAmount: paymentPreview.dryRunAdvanceAmount,
          appliedChargeIds: uniqueSorted(appliedChargeIds),
          appliedAllocations,
          allocations: inlineAllocations,
          allocationBackfilled: true,
          backfilledBy: 'parentPaymentBackfill',
          backfillRunId: runId,
          backfillSourcePaymentId: paymentPreview.paymentId,
          allocationBackfillVersion: ALLOCATION_BACKFILL_VERSION,
        },
      });

      paymentInput.data = {
        ...paymentInput.data,
        ...paymentPatches[paymentPatches.length - 1].data,
      };
      paymentInput.allocationDocs = allocationDocPatches
        .filter((allocation) => allocation.paymentId === paymentPreview.paymentId)
        .map((allocation) => ({
          id: allocation.allocationDocId,
          data: { ...allocation.data },
        }));
    });

    const chargePatches: ParentPaymentBackfillChargePatchPlan[] = Array.from(
      mutableChargeStateById.values()
    )
      .filter((charge) => charge.changed)
      .sort((left, right) => left.chargeId.localeCompare(right.chargeId))
      .map((chargeState) => {
        const chargeInput = chargeInputById.get(chargeState.chargeId);
        if (!chargeInput) {
          throw new Error(`charge ${chargeState.chargeId} not found for patch creation`);
        }
        const sourceVerification = normalizeParentPaymentBackfillChargeSourceState(chargeInput.data);
        chargeInput.data = {
          ...chargeInput.data,
          paidAmount: chargeState.paidAmount,
          outstandingAmount: chargeState.outstandingAmount,
          status: chargeState.status,
          lastAllocatedAt: chargeState.lastAllocatedAtIso,
          lastPaymentId: chargeState.lastPaymentId,
          lastAllocationRef: chargeState.lastAllocationRef,
          lastAllocationReceiptMonthKey: chargeState.lastAllocationReceiptMonthKey,
          paymentIds: chargeState.paymentIds,
          allocationBackfilled: true,
          backfilledBy: 'parentPaymentBackfill',
          backfillRunId: runId,
          allocationBackfillVersion: ALLOCATION_BACKFILL_VERSION,
        };
        if (chargeState.paidAtIso) chargeInput.data.paidAt = chargeState.paidAtIso;
        else delete chargeInput.data.paidAt;

        return {
          chargeId: chargeState.chargeId,
          parentId,
          monthKey: chargeState.monthKey,
          clearPaidAt: !chargeState.paidAtIso,
          paidAtIso: chargeState.paidAtIso,
          lastAllocatedAtIso: chargeState.lastAllocatedAtIso,
          sourceVerification,
          data: {
            paidAmount: chargeState.paidAmount,
            outstandingAmount: chargeState.outstandingAmount,
            status: chargeState.status,
            lastPaymentId: chargeState.lastPaymentId,
            lastAllocationRef: chargeState.lastAllocationRef,
            lastAllocationReceiptMonthKey: chargeState.lastAllocationReceiptMonthKey,
            paymentIds: chargeState.paymentIds,
            allocationBackfilled: true,
            backfilledBy: 'parentPaymentBackfill',
            backfillRunId: runId,
            allocationBackfillVersion: ALLOCATION_BACKFILL_VERSION,
          },
        };
      });

    const sortedMonthsImpacted = Array.from(monthsImpacted).sort((left, right) =>
      left.localeCompare(right)
    );
    const writeCountEstimate = estimateWriteCount(
      paymentPatches,
      allocationDocPatches,
      chargePatches,
      sortedMonthsImpacted
    );
    if (writeCountEstimate > MAX_WRITES_PER_PARENT) {
      throw new Error(
        `parent ${parentId} exceeds safe write count (${writeCountEstimate} > ${MAX_WRITES_PER_PARENT})`
      );
    }

    parentPlans.push({
      parentId,
      status: 'apply',
      recommendedActionBefore: parentReport.summary.recommendedAction,
      recommendedActionAfter: 'already_current',
      monthsImpacted: sortedMonthsImpacted,
      paymentsBackfilled: paymentPatches.map((patch) => patch.paymentId),
      paymentPatches,
      allocationDocPatches,
      chargePatches,
      writeCountEstimate,
    });
  });

  const afterReport = buildParentPaymentBackfillDryRunReport({
    ...input,
    mode: 'dry_run',
    includeArchived: false,
    payments: simulatedPayments,
    charges: simulatedCharges,
  });

  parentPlans.forEach((plan) => {
    const afterParent = afterReport.parents.find((parent) => parent.summary.parentId === plan.parentId);
    if (!afterParent) {
      throw new Error(`post-write verification report missing parent ${plan.parentId}`);
    }
    plan.recommendedActionAfter = afterParent.summary.recommendedAction;
    if (plan.status === 'apply' && afterParent.summary.recommendedAction === 'safe_to_backfill') {
      throw new Error(`post-write verification still reports parent ${plan.parentId} as safe_to_backfill`);
    }
  });

  const writesPayments = parentPlans.some((plan) => plan.paymentPatches.length > 0);
  const writesBillingCharges = parentPlans.some((plan) => plan.chargePatches.length > 0);
  const writesParentMonthlyReadModels = parentPlans.some((plan) => plan.monthsImpacted.length > 0);

  return {
    mode: 'write',
    runId,
    writeSafety: {
      changesWalletBalances: false,
      createsWalletTransactions: false,
      writesPayments,
      writesBillingCharges,
      writesParentMonthlyReadModels,
    },
    beforeReport,
    afterReport,
    parentPlans,
  };
}
