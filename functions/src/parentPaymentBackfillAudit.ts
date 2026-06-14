import {
  buildParentPaymentAllocationPlan,
  type BillingChargeDocLike,
  type ParentPaymentAllocationPreview,
} from './parentPaymentAllocator';
import {
  buildParentMonthlyBillingReadModel,
  type ParentMonthlyBillingChargeInput,
} from './parentMonthlyBillingReadModel';

const EPSILON = 0.01;
const IST_OFFSET_MINUTES = 330;

export type ParentPaymentBackfillMode = 'dry_run';

export type ParentPaymentBackfillClassification =
  | 'new_fifo_allocated'
  | 'old_wallet_only'
  | 'legacy_allocated'
  | 'mixed_schema'
  | 'duplicate_suspect'
  | 'archived_or_ignored';

export type ParentPaymentBackfillRecommendedAction =
  | 'safe_to_backfill'
  | 'needs_manual_review'
  | 'already_current'
  | 'blocked_due_to_drift';

export type ParentPaymentBackfillPaymentInput = {
  id: string;
  data: Record<string, unknown>;
  allocationDocs?: Array<{
    id: string;
    data: Record<string, unknown>;
  }>;
};

export type ParentPaymentBackfillChargeInput = {
  id: string;
  data: Record<string, unknown>;
};

export type ParentPaymentBackfillWalletInput = {
  parentId: string;
  data: Record<string, unknown>;
};

export type ParentPaymentBackfillWalletTransactionInput = {
  id: string;
  parentId: string;
  data: Record<string, unknown>;
};

export type ParentPaymentBackfillMonthlyReadModelInput = {
  parentId: string;
  monthKey: string;
  data: Record<string, unknown>;
};

export type ParentPaymentBackfillParentProfileInput = {
  parentId: string;
  parentName?: string | null;
};

export type ParentPaymentBackfillAuditInput = {
  mode: ParentPaymentBackfillMode;
  fromMonth?: string | null;
  toMonth?: string | null;
  includeArchived?: boolean;
  parentId?: string | null;
  now?: Date;
  payments: ParentPaymentBackfillPaymentInput[];
  charges: ParentPaymentBackfillChargeInput[];
  wallets?: ParentPaymentBackfillWalletInput[];
  walletTransactions?: ParentPaymentBackfillWalletTransactionInput[];
  monthlyReadModels?: ParentPaymentBackfillMonthlyReadModelInput[];
  parentProfiles?: ParentPaymentBackfillParentProfileInput[];
};

export type ParentPaymentBackfillAuditWarning = {
  code: string;
  message: string;
};

export type ParentPaymentBackfillAllocationRow = {
  chargeId: string;
  chargeMonthKey: string | null;
  previousPaidAmount: number;
  allocationAmount: number;
  remainingDueAfter: number;
};

export type ParentPaymentBackfillPaymentPreview = {
  paymentId: string;
  parentId: string;
  paidAt: string | null;
  amount: number;
  classification: ParentPaymentBackfillClassification;
  baseClassification: Exclude<
    ParentPaymentBackfillClassification,
    'duplicate_suspect' | 'archived_or_ignored'
  > | 'archived_or_ignored';
  existingAllocatedAmount: number;
  dryRunAllocatedAmount: number;
  dryRunAdvanceAmount: number;
  allocationRows: ParentPaymentBackfillAllocationRow[];
  warnings: string[];
  duplicateSuspect: boolean;
};

export type ParentPaymentBackfillMonthSummary = {
  monthKey: string;
  billedAmount: number;
  existingSettledAmount: number;
  existingDueAmount: number;
  dryRunSettledAmount: number;
  dryRunDueAmount: number;
  deltaSettled: number;
  deltaDue: number;
  statusBefore: string;
  statusAfterDryRun: string;
  paymentsThatWouldSettleThisMonth: string[];
};

export type ParentPaymentBackfillParentSummary = {
  parentId: string;
  parentName: string | null;
  existingWalletBalance: number;
  derivedLedgerBalance: number;
  walletDrift: number;
  totalActiveBilledCharges: number;
  totalExistingPaidAmount: number;
  totalExistingOutstanding: number;
  totalPaymentsReceived: number;
  totalAlreadyAllocated: number;
  totalWalletOnlyCandidateAmount: number;
  totalWouldAllocate: number;
  totalWouldRemainAdvance: number;
  monthsImpacted: string[];
  anomalyCount: number;
  recommendedAction: ParentPaymentBackfillRecommendedAction;
};

export type ParentPaymentBackfillParentReport = {
  summary: ParentPaymentBackfillParentSummary;
  months: ParentPaymentBackfillMonthSummary[];
  payments: ParentPaymentBackfillPaymentPreview[];
  anomalies: ParentPaymentBackfillAuditWarning[];
  drifts: {
    walletBalanceVsLedgerDrift: number;
    chargeSettlementDriftCount: number;
    paymentAllocationDriftCount: number;
    monthlyReadModelDriftCount: number;
  };
};

export type ParentPaymentBackfillAuditReport = {
  mode: ParentPaymentBackfillMode;
  dryRun: true;
  generatedAtMs: number;
  filters: {
    parentId: string | null;
    fromMonth: string | null;
    toMonth: string | null;
    includeArchived: boolean;
  };
  totals: {
    parents: number;
    payments: number;
    anomalies: number;
    classificationCounts: Record<ParentPaymentBackfillClassification, number>;
  };
  parents: ParentPaymentBackfillParentReport[];
};

type NormalizedPayment = {
  id: string;
  parentId: string;
  archived: boolean;
  amount: number;
  paidAtMs: number | null;
  createdAtMs: number | null;
  paidAtIso: string | null;
  paidDateKey: string | null;
  receiptMonthKey: string | null;
  method: string | null;
  reference: string | null;
  idempotencyKey: string | null;
  allocationModeUsed: 'fifo_then_wallet' | 'wallet_only' | null;
  walletTransactionId: string | null;
  warnings: string[];
  baseClassification: ParentPaymentBackfillPaymentPreview['baseClassification'];
  classification: ParentPaymentBackfillClassification;
  duplicateSuspect: boolean;
  existingAllocatedAmount: number;
  candidateReplayAmount: number;
  existingAllocationRows: ParentPaymentAllocationPreview[];
  source: ParentPaymentBackfillPaymentInput;
};

type ShadowCharge = {
  id: string;
  parentId: string;
  monthKey: string | null;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  archived: boolean;
  eventDate: string | null;
  createdAt: string | null;
  lastAllocatedAt: string | null;
  paidAt: string | null;
  lastPaymentId: string | null;
  lastAllocationRef: string | null;
  paymentIds: string[];
  raw: Record<string, unknown>;
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

function dayKeyFromDateIST(date: Date): string {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeMonthKey(value: unknown): string | null {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
}

function normalizeChargeStatus(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'settled') return 'paid';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

function isExcludedChargeStatus(status: string): boolean {
  return (
    status === 'void' ||
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'reversed' ||
    status === 'refunded'
  );
}

function normalizeAllocationMode(value: unknown): 'fifo_then_wallet' | 'wallet_only' | null {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (
    raw === 'fifo_then_wallet' ||
    raw === 'legacy_then_wallet' ||
    raw === 'fifo_then_wallet_backfill'
  ) {
    return 'fifo_then_wallet';
  }
  if (raw === 'wallet_only') return 'wallet_only';
  return null;
}

function resolvePaymentAllocatedAmount(data: Record<string, unknown>): number {
  const allocationsTotal = roundCurrency(sumAllocationRows(resolveExistingAllocationRows(data, [])));
  const direct = roundCurrency(
    normalizeNumber(
      data.allocatedAmount,
      normalizeNumber(
        data.legacyAppliedAmount,
        normalizeNumber(data.appliedAmount, allocationsTotal)
      )
    )
  );
  return Math.max(direct, allocationsTotal);
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

  const status = normalizeChargeStatus(data.status);
  if (status === 'paid') return Math.max(amount, 0);
  return 0;
}

function sumAllocationRows(rows: ParentPaymentAllocationPreview[]): number {
  return rows.reduce((sum, row) => sum + roundCurrency(normalizeNumber(row.allocatedAmount)), 0);
}

function resolveExistingAllocationRows(
  data: Record<string, unknown>,
  allocationDocs: Array<{ id: string; data: Record<string, unknown> }>
): ParentPaymentAllocationPreview[] {
  if (allocationDocs.length > 0) {
    return allocationDocs
      .map((doc, index) => ({
        sequence: Math.max(index + 1, normalizeNumber(doc.data.sequence, index + 1)),
        chargeId: String(doc.data.chargeId || doc.data.billingChargeId || '').trim(),
        monthKey: normalizeMonthKey(doc.data.monthKey || doc.data.chargeMonthKey),
        eventDateKey: normalizeOptionalText(doc.data.eventDateKey, 20),
        chargeAmount: roundCurrency(normalizeNumber(doc.data.chargeAmount, 0)),
        previousPaidAmount: roundCurrency(normalizeNumber(doc.data.previousPaidAmount, 0)),
        outstandingBefore: roundCurrency(normalizeNumber(doc.data.outstandingBefore, 0)),
        allocatedAmount: roundCurrency(
          normalizeNumber(doc.data.allocatedAmount, normalizeNumber(doc.data.amount, 0))
        ),
        remainingDueAfter: roundCurrency(normalizeNumber(doc.data.remainingDueAfter, 0)),
        enrollmentId: normalizeOptionalText(doc.data.enrollmentId, 150),
        kidId: normalizeOptionalText(doc.data.kidId, 150),
        courseId: normalizeOptionalText(doc.data.courseId, 150),
        studentName: normalizeOptionalText(doc.data.studentName, 150),
        classSessionId: normalizeOptionalText(doc.data.classSessionId, 150),
      }))
      .filter((row) => Boolean(row.chargeId));
  }

  const inlineAllocations = Array.isArray(data.allocations)
    ? (data.allocations as Array<Record<string, unknown>>)
    : Array.isArray(data.appliedAllocations)
      ? (data.appliedAllocations as Array<Record<string, unknown>>)
      : [];

  return inlineAllocations
    .map((row, index) => ({
      sequence: index + 1,
      chargeId: String(row.chargeId || row.billingChargeId || '').trim(),
      monthKey: normalizeMonthKey(row.monthKey || row.chargeMonthKey),
      eventDateKey: normalizeOptionalText(row.eventDateKey, 20),
      chargeAmount: roundCurrency(normalizeNumber(row.chargeAmount, 0)),
      previousPaidAmount: roundCurrency(normalizeNumber(row.previousPaidAmount, 0)),
      outstandingBefore: roundCurrency(normalizeNumber(row.outstandingBefore, 0)),
      allocatedAmount: roundCurrency(
        normalizeNumber(row.allocatedAmount, normalizeNumber(row.amount, 0))
      ),
      remainingDueAfter: roundCurrency(normalizeNumber(row.remainingDueAfter, 0)),
      enrollmentId: normalizeOptionalText(row.enrollmentId, 150),
      kidId: normalizeOptionalText(row.kidId, 150),
      courseId: normalizeOptionalText(row.courseId, 150),
      studentName: normalizeOptionalText(row.studentName, 150),
      classSessionId: normalizeOptionalText(row.classSessionId, 150),
    }))
    .filter((row) => Boolean(row.chargeId));
}

function normalizeWalletSignedAmount(data: Record<string, unknown>): number {
  const signed = normalizeNumber(data.signedAmount, Number.NaN);
  if (Number.isFinite(signed)) return roundCurrency(signed);
  const amount = roundCurrency(Math.max(normalizeNumber(data.amount, 0), 0));
  const direction = String(data.direction || '').trim().toLowerCase();
  return direction === 'debit' ? -amount : amount;
}

function normalizeChargeForShadow(input: ParentPaymentBackfillChargeInput): ShadowCharge | null {
  const parentId = String(input.data.parentId || '').trim();
  if (!parentId) return null;
  const amount = roundCurrency(Math.max(normalizeNumber(input.data.amount, 0), 0));
  if (amount <= 0) return null;
  const paidAmount = roundCurrency(resolveChargePaidAmount(input.data, amount));
  const outstandingAmount = roundCurrency(
    Math.max(
      Number.isFinite(Number(input.data.outstandingAmount))
        ? normalizeNumber(input.data.outstandingAmount, 0)
        : amount - paidAmount,
      0
    )
  );
  const status = normalizeChargeStatus(input.data.status);
  const eventDate = toDate(
    input.data.chargeDate ||
      input.data.date ||
      input.data.sessionDate ||
      input.data.startAt ||
      input.data.endAt
  );
  const createdAt = toDate(input.data.createdAt || input.data.updatedAt);
  const paymentIds = Array.isArray(input.data.paymentIds)
    ? input.data.paymentIds.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  return {
    id: input.id,
    parentId,
    monthKey: normalizeMonthKey(input.data.monthKey),
    amount,
    paidAmount,
    outstandingAmount,
    status,
    archived: input.data.archived === true,
    eventDate: eventDate ? eventDate.toISOString() : null,
    createdAt: createdAt ? createdAt.toISOString() : null,
    lastAllocatedAt: toDate(input.data.lastAllocatedAt)?.toISOString() || null,
    paidAt: toDate(input.data.paidAt)?.toISOString() || null,
    lastPaymentId: normalizeOptionalText(input.data.lastPaymentId, 150),
    lastAllocationRef: normalizeOptionalText(input.data.lastAllocationRef, 250),
    paymentIds,
    raw: { ...input.data },
  };
}

function buildChargeEntriesFromShadow(charges: ShadowCharge[]): BillingChargeDocLike[] {
  return charges.map((charge) => ({
    id: charge.id,
    data: {
      ...charge.raw,
      parentId: charge.parentId,
      monthKey: charge.monthKey,
      amount: charge.amount,
      paidAmount: charge.paidAmount,
      outstandingAmount: charge.outstandingAmount,
      status: charge.status,
      archived: charge.archived,
      date: charge.eventDate || charge.raw.date || null,
      createdAt: charge.createdAt || charge.raw.createdAt || null,
    },
  }));
}

function buildReadModelChargesFromShadow(charges: ShadowCharge[]): ParentMonthlyBillingChargeInput[] {
  return charges.map((charge) => ({
    id: charge.id,
    amount: charge.amount,
    paidAmount: charge.paidAmount,
    outstandingAmount: charge.outstandingAmount,
    status: charge.status,
    monthKey: charge.monthKey,
    lastPaymentId: charge.lastPaymentId,
    lastAllocationRef: charge.lastAllocationRef,
    paymentIds: charge.paymentIds,
    lastAllocatedAt: charge.lastAllocatedAt,
    paidAt: charge.paidAt,
    archived: charge.archived,
  }));
}

function buildDuplicateKey(payment: {
  parentId: string;
  amount: number;
  paidDateKey: string | null;
  reference: string | null;
  idempotencyKey: string | null;
  method: string | null;
}): string {
  return [
    payment.parentId,
    payment.amount.toFixed(2),
    payment.paidDateKey || '',
    payment.reference || '',
    payment.idempotencyKey || '',
    payment.method || '',
  ].join('__');
}

function shouldIncludePaymentInRange(
  payment: {
    receiptMonthKey: string | null;
    paidAtMs: number | null;
  },
  fromMonth: string | null,
  toMonth: string | null
): boolean {
  if (!fromMonth && !toMonth) return true;
  const paymentMonth =
    payment.receiptMonthKey ||
    (payment.paidAtMs ? monthKeyFromDateIST(new Date(payment.paidAtMs)) : null);
  if (!paymentMonth) return false;
  if (fromMonth && paymentMonth.localeCompare(fromMonth) < 0) return false;
  if (toMonth && paymentMonth.localeCompare(toMonth) > 0) return false;
  return true;
}

function classifyPayment(
  source: ParentPaymentBackfillPaymentInput,
  duplicateSuspect: boolean
): NormalizedPayment {
  const data = source.data || {};
  const parentId = String(data.parentId || '').trim();
  const amount = roundCurrency(normalizeNumber(data.amount, 0));
  const paidAt = toDate(data.paidAt || data.date || data.createdAt);
  const createdAt = toDate(data.createdAt || data.updatedAt);
  const allocationModeUsed = normalizeAllocationMode(data.allocationModeUsed);
  const allocationDocs = Array.isArray(source.allocationDocs) ? source.allocationDocs : [];
  const existingAllocationRows = resolveExistingAllocationRows(data, allocationDocs);
  const inlineAllocatedAmount = resolvePaymentAllocatedAmount(data);
  const sumExistingAllocations = roundCurrency(sumAllocationRows(existingAllocationRows));
  const existingAllocatedAmount = roundCurrency(Math.max(inlineAllocatedAmount, sumExistingAllocations));
  const appliedChargeIds = Array.isArray(data.appliedChargeIds)
    ? data.appliedChargeIds.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const walletCreditHint =
    Boolean(normalizeOptionalText(data.walletTransactionId, 150)) ||
    normalizeNumber(data.walletTopupAmount, 0) > EPSILON ||
    normalizeNumber(data.advanceAmount, 0) > EPSILON ||
    normalizeNumber(data.unallocatedAmount, 0) > EPSILON ||
    normalizeNumber(data.unappliedAmount, 0) > EPSILON;
  const legacyMarkers =
    appliedChargeIds.length > 0 ||
    (Array.isArray(data.appliedAllocations) && data.appliedAllocations.length > 0) ||
    normalizeNumber(data.legacyAppliedAmount, 0) > EPSILON ||
    (normalizeNumber(data.appliedAmount, 0) > EPSILON && !allocationModeUsed);
  const fifoMarkers =
    allocationModeUsed === 'fifo_then_wallet' ||
    (Array.isArray(data.allocations) && data.allocations.length > 0) ||
    (allocationDocs.length > 0 && existingAllocatedAmount > EPSILON);
  const archived = data.archived === true;
  const warnings: string[] = [];

  if (!parentId) warnings.push('missing parentId');
  if (amount <= 0) warnings.push('payment amount <= 0');
  if (!paidAt) warnings.push('missing paidAt');
  if (!normalizeOptionalText(data.walletTransactionId, 150)) warnings.push('missing walletTransactionId');

  let baseClassification: NormalizedPayment['baseClassification'] = 'mixed_schema';
  if (archived) {
    baseClassification = 'archived_or_ignored';
  } else if (
    allocationModeUsed === 'fifo_then_wallet' &&
    existingAllocationRows.length > 0 &&
    existingAllocatedAmount > EPSILON
  ) {
    baseClassification = 'new_fifo_allocated';
  } else if (allocationModeUsed === 'wallet_only' && existingAllocationRows.length === 0 && walletCreditHint) {
    baseClassification = 'old_wallet_only';
  } else if (legacyMarkers && allocationModeUsed !== 'fifo_then_wallet') {
    baseClassification = 'legacy_allocated';
  } else if (!fifoMarkers && walletCreditHint && existingAllocationRows.length === 0) {
    baseClassification = 'old_wallet_only';
  }

  let classification: ParentPaymentBackfillClassification = baseClassification;
  if (duplicateSuspect && !archived) {
    classification = 'duplicate_suspect';
    warnings.push('duplicate suspect based on parent, amount, date, and reference/idempotency pattern');
  }

  if (
    allocationModeUsed === 'fifo_then_wallet' &&
    (existingAllocationRows.length === 0 || existingAllocatedAmount < sumExistingAllocations - EPSILON)
  ) {
    warnings.push('fifo markers exist but allocation rows/amounts are incomplete');
    if (classification !== 'duplicate_suspect') classification = 'mixed_schema';
    if (baseClassification !== 'archived_or_ignored') baseClassification = 'mixed_schema';
  }

  const replayableAmount =
    archived || classification === 'duplicate_suspect'
      ? 0
      : baseClassification === 'old_wallet_only'
        ? amount
        : baseClassification === 'mixed_schema'
          ? roundCurrency(Math.max(amount - existingAllocatedAmount, 0))
          : 0;

  return {
    id: source.id,
    parentId,
    archived,
    amount,
    paidAtMs: paidAt ? paidAt.getTime() : null,
    createdAtMs: createdAt ? createdAt.getTime() : null,
    paidAtIso: paidAt ? paidAt.toISOString() : null,
    paidDateKey: paidAt ? dayKeyFromDateIST(paidAt) : normalizeOptionalText(data.paidDateKey, 20),
    receiptMonthKey:
      normalizeMonthKey(data.receiptMonthKey) ||
      normalizeMonthKey(data.monthKey) ||
      (paidAt ? monthKeyFromDateIST(paidAt) : null),
    method: normalizeOptionalText(data.method, 80),
    reference: normalizeOptionalText(data.reference, 120),
    idempotencyKey: normalizeOptionalText(data.idempotencyKey, 120),
    allocationModeUsed,
    walletTransactionId: normalizeOptionalText(data.walletTransactionId, 150),
    warnings,
    baseClassification,
    classification,
    duplicateSuspect,
    existingAllocatedAmount,
    candidateReplayAmount: replayableAmount,
    existingAllocationRows,
    source,
  };
}

function collectChargeAnomalies(
  charge: ShadowCharge,
  knownPaymentIds: Set<string>,
  anomalies: ParentPaymentBackfillAuditWarning[]
): number {
  let count = 0;
  const rawPaidAmount = normalizeNumber(charge.raw.paidAmount, charge.paidAmount);
  const rawOutstandingAmount = normalizeNumber(charge.raw.outstandingAmount, charge.outstandingAmount);
  const add = (code: string, message: string) => {
    anomalies.push({ code, message });
    count += 1;
  };

  if (rawPaidAmount - charge.amount > EPSILON) {
    add('CHARGE_OVERPAID', `charge ${charge.id}: paidAmount exceeds amount`);
  }
  if (rawOutstandingAmount < -EPSILON) {
    add('CHARGE_NEGATIVE_OUTSTANDING', `charge ${charge.id}: outstandingAmount is negative`);
  }
  if (charge.status === 'paid' && charge.outstandingAmount > EPSILON) {
    add('CHARGE_STATUS_DRIFT', `charge ${charge.id}: status is paid but outstandingAmount > 0`);
  }
  if ((charge.status === 'unpaid' || charge.status === 'pending') && charge.paidAmount > EPSILON) {
    add('CHARGE_STATUS_DRIFT', `charge ${charge.id}: status is unpaid but paidAmount > 0`);
  }
  if (charge.lastAllocationRef) {
    const match = /^payments\/([^/]+)\//.exec(charge.lastAllocationRef);
    const paymentId = match?.[1] || '';
    if (paymentId && !knownPaymentIds.has(paymentId)) {
      add('ORPHAN_ALLOCATION_REF', `charge ${charge.id}: lastAllocationRef points to missing payment ${paymentId}`);
    }
  }
  charge.paymentIds.forEach((paymentId) => {
    if (!knownPaymentIds.has(paymentId)) {
      add('ORPHAN_PAYMENT_ID', `charge ${charge.id}: paymentId ${paymentId} not found in loaded payments`);
    }
  });
  return count;
}

function buildMonthlyReadModelDrift(
  parentId: string,
  currentCharges: ShadowCharge[],
  monthlyReadModels: ParentPaymentBackfillMonthlyReadModelInput[],
  walletBalance: number,
  now: Date,
  anomalies: ParentPaymentBackfillAuditWarning[]
): number {
  let driftCount = 0;
  const monthKeys = Array.from(
    new Set(
      currentCharges
        .map((charge) => charge.monthKey)
        .filter((monthKey): monthKey is string => Boolean(monthKey))
        .concat(monthlyReadModels.map((model) => model.monthKey))
    )
  ).sort();

  monthKeys.forEach((monthKey) => {
    const derived = buildParentMonthlyBillingReadModel({
      parentId,
      monthKey,
      walletBalance,
      now,
      charges: buildReadModelChargesFromShadow(currentCharges.filter((charge) => charge.monthKey === monthKey)),
    });
    const stored = monthlyReadModels.find((item) => item.monthKey === monthKey)?.data || null;
    if (!stored) return;

    const storedBilled = roundCurrency(
      normalizeNumber(stored.billedAmount, normalizeNumber((stored.totals as Record<string, unknown> | undefined)?.billedAmount, 0))
    );
    const storedSettled = roundCurrency(
      normalizeNumber(
        stored.settledAmount,
        normalizeNumber(
          stored.appliedAmount,
          normalizeNumber(
            (stored.totals as Record<string, unknown> | undefined)?.settledAmount,
            normalizeNumber(
              (stored.totals as Record<string, unknown> | undefined)?.paidAmountFromCharges,
              0
            )
          )
        )
      )
    );
    const storedDue = roundCurrency(
      normalizeNumber(
        stored.dueAmount,
        normalizeNumber(
          stored.outstandingAmount,
          normalizeNumber((stored.totals as Record<string, unknown> | undefined)?.dueAmount, 0)
        )
      )
    );
    const storedStatus = String(stored.status || (stored.totals as Record<string, unknown> | undefined)?.status || '').trim();

    if (
      Math.abs(storedBilled - derived.billedAmount) > EPSILON ||
      Math.abs(storedSettled - derived.settledAmount) > EPSILON ||
      Math.abs(storedDue - derived.dueAmount) > EPSILON ||
      (storedStatus && storedStatus !== derived.status)
    ) {
      anomalies.push({
        code: 'MONTHLY_READ_MODEL_DRIFT',
        message: `parent ${parentId} month ${monthKey}: stored monthly read model differs from derived charge state`,
      });
      driftCount += 1;
    }
  });

  return driftCount;
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => String(value || '').trim()).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right));
}

export function buildParentPaymentBackfillDryRunReport(
  input: ParentPaymentBackfillAuditInput
): ParentPaymentBackfillAuditReport {
  const now = input.now || new Date();
  const includeArchived = input.includeArchived === true;
  const fromMonth = normalizeMonthKey(input.fromMonth);
  const toMonth = normalizeMonthKey(input.toMonth);
  const requestedParentId = String(input.parentId || '').trim() || null;

  const profileNameByParentId = new Map(
    (input.parentProfiles || []).map((profile) => [
      profile.parentId,
      normalizeOptionalText(profile.parentName, 200),
    ])
  );

  const initialPayments = input.payments
    .map((payment) => {
      const data = payment.data || {};
      const paidAt = toDate(data.paidAt || data.date || data.createdAt);
      return {
        source: payment,
        parentId: String(data.parentId || '').trim(),
        amount: roundCurrency(normalizeNumber(data.amount, 0)),
        paidDateKey: paidAt ? dayKeyFromDateIST(paidAt) : normalizeOptionalText(data.paidDateKey, 20),
        reference: normalizeOptionalText(data.reference, 120),
        idempotencyKey: normalizeOptionalText(data.idempotencyKey, 120),
        method: normalizeOptionalText(data.method, 80),
        receiptMonthKey:
          normalizeMonthKey(data.receiptMonthKey) ||
          normalizeMonthKey(data.monthKey) ||
          (paidAt ? monthKeyFromDateIST(paidAt) : null),
        paidAtMs: paidAt ? paidAt.getTime() : null,
      };
    })
    .filter((payment) => {
      if (requestedParentId && payment.parentId !== requestedParentId) return false;
      return shouldIncludePaymentInRange(
        { receiptMonthKey: payment.receiptMonthKey, paidAtMs: payment.paidAtMs },
        fromMonth,
        toMonth
      );
    });

  const duplicateKeyCounts = new Map<string, number>();
  initialPayments.forEach((payment) => {
    const key = buildDuplicateKey(payment);
    duplicateKeyCounts.set(key, (duplicateKeyCounts.get(key) || 0) + 1);
  });

  const normalizedPayments = initialPayments.map((payment) =>
    classifyPayment(payment.source, (duplicateKeyCounts.get(buildDuplicateKey(payment)) || 0) > 1)
  );

  const parentIds = uniqueSorted([
    requestedParentId,
    ...normalizedPayments.map((payment) => payment.parentId),
    ...(input.charges || []).map((charge) => String(charge.data.parentId || '').trim()),
    ...(input.wallets || []).map((wallet) => wallet.parentId),
    ...(input.monthlyReadModels || []).map((model) => model.parentId),
  ]);

  const walletsByParentId = new Map(
    (input.wallets || []).map((wallet) => [wallet.parentId, wallet.data || {}])
  );
  const walletTransactionsByParentId = new Map<string, ParentPaymentBackfillWalletTransactionInput[]>();
  (input.walletTransactions || []).forEach((transaction) => {
    const list = walletTransactionsByParentId.get(transaction.parentId) || [];
    list.push(transaction);
    walletTransactionsByParentId.set(transaction.parentId, list);
  });
  const chargesByParentId = new Map<string, ShadowCharge[]>();
  (input.charges || []).forEach((chargeInput) => {
    const charge = normalizeChargeForShadow(chargeInput);
    if (!charge) return;
    const list = chargesByParentId.get(charge.parentId) || [];
    list.push(charge);
    chargesByParentId.set(charge.parentId, list);
  });
  const readModelsByParentId = new Map<string, ParentPaymentBackfillMonthlyReadModelInput[]>();
  (input.monthlyReadModels || []).forEach((model) => {
    const list = readModelsByParentId.get(model.parentId) || [];
    list.push(model);
    readModelsByParentId.set(model.parentId, list);
  });
  const paymentsByParentId = new Map<string, NormalizedPayment[]>();
  normalizedPayments.forEach((payment) => {
    const list = paymentsByParentId.get(payment.parentId) || [];
    list.push(payment);
    paymentsByParentId.set(payment.parentId, list);
  });

  const classificationCounts: Record<ParentPaymentBackfillClassification, number> = {
    new_fifo_allocated: 0,
    old_wallet_only: 0,
    legacy_allocated: 0,
    mixed_schema: 0,
    duplicate_suspect: 0,
    archived_or_ignored: 0,
  };
  normalizedPayments.forEach((payment) => {
    classificationCounts[payment.classification] += 1;
  });
  const parentReports: ParentPaymentBackfillParentReport[] = [];

  parentIds.forEach((parentId) => {
    if (!parentId) return;
    const anomalies: ParentPaymentBackfillAuditWarning[] = [];
    const currentCharges = (chargesByParentId.get(parentId) || []).map((charge) => ({
      ...charge,
      raw: { ...charge.raw },
      paymentIds: [...charge.paymentIds],
    }));
    const shadowCharges = currentCharges.map((charge) => ({
      ...charge,
      raw: { ...charge.raw },
      paymentIds: [...charge.paymentIds],
    }));
    const parentPayments = [...(paymentsByParentId.get(parentId) || [])].sort((left, right) => {
      const leftPaid = left.paidAtMs ?? Number.MAX_SAFE_INTEGER;
      const rightPaid = right.paidAtMs ?? Number.MAX_SAFE_INTEGER;
      if (leftPaid !== rightPaid) return leftPaid - rightPaid;
      const leftCreated = left.createdAtMs ?? Number.MAX_SAFE_INTEGER;
      const rightCreated = right.createdAtMs ?? Number.MAX_SAFE_INTEGER;
      if (leftCreated !== rightCreated) return leftCreated - rightCreated;
      return left.id.localeCompare(right.id);
    });
    const knownPaymentIds = new Set(parentPayments.map((payment) => payment.id));

    const walletData = walletsByParentId.get(parentId) || {};
    const existingWalletBalance = roundCurrency(normalizeNumber(walletData.currentBalance, 0));
    const walletTransactions = walletTransactionsByParentId.get(parentId) || [];
    const derivedLedgerBalance = roundCurrency(
      walletTransactions.reduce((sum, transaction) => sum + normalizeWalletSignedAmount(transaction.data || {}), 0)
    );
    const walletDrift = roundCurrency(existingWalletBalance - derivedLedgerBalance);
    if (Math.abs(walletDrift) > EPSILON) {
      anomalies.push({
        code: 'WALLET_LEDGER_DRIFT',
        message: `parent ${parentId}: wallet currentBalance differs from transaction ledger by ${walletDrift}`,
      });
    }

    const walletTransactionIds = new Map<string, string[]>();
    walletTransactions.forEach((transaction) => {
      const key =
        normalizeOptionalText(transaction.data.transactionId, 150) ||
        normalizeOptionalText(transaction.id, 150) ||
        '';
      if (!key) return;
      const list = walletTransactionIds.get(key) || [];
      list.push(transaction.id);
      walletTransactionIds.set(key, list);
    });
    walletTransactionIds.forEach((txIds, key) => {
      if (txIds.length > 1) {
        anomalies.push({
          code: 'DUPLICATE_WALLET_TRANSACTION_ID',
          message: `parent ${parentId}: wallet transaction id ${key} appears ${txIds.length} times`,
        });
      }
    });

    let chargeSettlementDriftCount = 0;
    currentCharges.forEach((charge) => {
      chargeSettlementDriftCount += collectChargeAnomalies(charge, knownPaymentIds, anomalies);
    });

    let paymentAllocationDriftCount = 0;
    const perMonthPaymentIds = new Map<string, Set<string>>();
    const paymentPreviews: ParentPaymentBackfillPaymentPreview[] = [];
    let totalPaymentsReceived = 0;
    let totalAlreadyAllocated = 0;
    let totalWalletOnlyCandidateAmount = 0;
    let totalWouldAllocate = 0;
    let totalWouldRemainAdvance = 0;

    parentPayments.forEach((payment) => {
      totalPaymentsReceived += payment.amount;
      totalAlreadyAllocated += payment.existingAllocatedAmount;
      if (payment.baseClassification === 'old_wallet_only') {
        totalWalletOnlyCandidateAmount += payment.amount;
      }

      const existingAllocationTotal = roundCurrency(sumAllocationRows(payment.existingAllocationRows));
      const warnings = [...payment.warnings];
      if (Math.abs(existingAllocationTotal - payment.existingAllocatedAmount) > EPSILON) {
        warnings.push('allocatedAmount differs from summed allocation rows');
        paymentAllocationDriftCount += 1;
        anomalies.push({
          code: 'PAYMENT_ALLOCATION_DRIFT',
          message: `payment ${payment.id}: allocatedAmount differs from allocation rows`,
        });
      }

      let dryRunAllocatedAmount = 0;
      let dryRunAdvanceAmount = payment.amount;
      let allocationRows: ParentPaymentBackfillAllocationRow[] = [];

      if (payment.candidateReplayAmount > EPSILON) {
        const plan = buildParentPaymentAllocationPlan(
          buildChargeEntriesFromShadow(shadowCharges),
          payment.candidateReplayAmount
        );
        dryRunAllocatedAmount = roundCurrency(plan.allocatedAmount);
        dryRunAdvanceAmount = roundCurrency(payment.amount - dryRunAllocatedAmount);
        warnings.push(...plan.warnings);
        allocationRows = plan.allocations.map((allocation) => ({
          chargeId: allocation.chargeId,
          chargeMonthKey: allocation.monthKey,
          previousPaidAmount: allocation.previousPaidAmount,
          allocationAmount: allocation.allocatedAmount,
          remainingDueAfter: allocation.remainingDueAfter,
        }));

        if (dryRunAllocatedAmount > EPSILON) {
          totalWouldAllocate += dryRunAllocatedAmount;
          totalWouldRemainAdvance += dryRunAdvanceAmount;
        } else {
          totalWouldRemainAdvance += payment.amount;
        }

        plan.allocations.forEach((allocation) => {
          const charge = shadowCharges.find((item) => item.id === allocation.chargeId);
          if (!charge) return;
          charge.paidAmount = roundCurrency(charge.paidAmount + allocation.allocatedAmount);
          charge.outstandingAmount = roundCurrency(
            Math.max(charge.amount - charge.paidAmount, 0)
          );
          charge.status = charge.outstandingAmount <= EPSILON ? 'paid' : 'partial';
          charge.lastAllocatedAt = payment.paidAtIso || charge.lastAllocatedAt;
          charge.lastPaymentId = payment.id;
          charge.lastAllocationRef = `payments/${payment.id}/allocations/${String(allocation.sequence).padStart(4, '0')}`;
          charge.paymentIds = uniqueSorted([...charge.paymentIds, payment.id]);
          if (payment.paidAtIso && charge.outstandingAmount <= EPSILON) {
            charge.paidAt = payment.paidAtIso;
          }
          const monthKey = allocation.monthKey || charge.monthKey;
          if (monthKey) {
            const set = perMonthPaymentIds.get(monthKey) || new Set<string>();
            set.add(payment.id);
            perMonthPaymentIds.set(monthKey, set);
          }
        });
      } else if (payment.baseClassification === 'new_fifo_allocated' || payment.baseClassification === 'legacy_allocated') {
        dryRunAllocatedAmount = payment.existingAllocatedAmount;
        dryRunAdvanceAmount = roundCurrency(Math.max(payment.amount - payment.existingAllocatedAmount, 0));
      } else if (payment.baseClassification === 'archived_or_ignored') {
        dryRunAdvanceAmount = payment.amount;
      } else if (payment.baseClassification === 'mixed_schema') {
        totalWouldRemainAdvance += payment.amount;
      }

      if (!payment.archived || includeArchived) {
        paymentPreviews.push({
          paymentId: payment.id,
          parentId,
          paidAt: payment.paidAtIso,
          amount: payment.amount,
          classification: payment.classification,
          baseClassification: payment.baseClassification,
          existingAllocatedAmount: payment.existingAllocatedAmount,
          dryRunAllocatedAmount,
          dryRunAdvanceAmount,
          allocationRows,
          warnings,
          duplicateSuspect: payment.duplicateSuspect,
        });
      }
    });

    const activeCurrentCharges = currentCharges.filter(
      (charge) => !charge.archived && !isExcludedChargeStatus(charge.status)
    );
    const impactedMonths = uniqueSorted(
      activeCurrentCharges.map((charge) => charge.monthKey).concat(
        Array.from(perMonthPaymentIds.keys())
      )
    );

    const months = impactedMonths.map((monthKey) => {
      const before = buildParentMonthlyBillingReadModel({
        parentId,
        monthKey,
        now,
        walletBalance: existingWalletBalance,
        charges: buildReadModelChargesFromShadow(currentCharges.filter((charge) => charge.monthKey === monthKey)),
      });
      const after = buildParentMonthlyBillingReadModel({
        parentId,
        monthKey,
        now,
        walletBalance: existingWalletBalance,
        charges: buildReadModelChargesFromShadow(shadowCharges.filter((charge) => charge.monthKey === monthKey)),
      });

      return {
        monthKey,
        billedAmount: before.billedAmount,
        existingSettledAmount: before.settledAmount,
        existingDueAmount: before.dueAmount,
        dryRunSettledAmount: after.settledAmount,
        dryRunDueAmount: after.dueAmount,
        deltaSettled: roundCurrency(after.settledAmount - before.settledAmount),
        deltaDue: roundCurrency(after.dueAmount - before.dueAmount),
        statusBefore: before.status,
        statusAfterDryRun: after.status,
        paymentsThatWouldSettleThisMonth: uniqueSorted(Array.from(perMonthPaymentIds.get(monthKey) || [])),
      };
    });

    const monthlyReadModelDriftCount = buildMonthlyReadModelDrift(
      parentId,
      currentCharges,
      readModelsByParentId.get(parentId) || [],
      existingWalletBalance,
      now,
      anomalies
    );

    const totalActiveBilledCharges = roundCurrency(
      activeCurrentCharges.reduce((sum, charge) => sum + charge.amount, 0)
    );
    const totalExistingPaidAmount = roundCurrency(
      activeCurrentCharges.reduce((sum, charge) => sum + charge.paidAmount, 0)
    );
    const totalExistingOutstanding = roundCurrency(
      activeCurrentCharges.reduce((sum, charge) => sum + charge.outstandingAmount, 0)
    );

    const hasCriticalDrift =
      Math.abs(walletDrift) > EPSILON ||
      chargeSettlementDriftCount > 0 ||
      paymentAllocationDriftCount > 0;
    const hasManualReviewSignals =
      paymentPreviews.some(
        (payment) =>
          payment.classification === 'duplicate_suspect' ||
          payment.baseClassification === 'legacy_allocated' ||
          payment.baseClassification === 'mixed_schema'
      ) || anomalies.length > 0;
    const wouldBackfill = totalWouldAllocate > EPSILON;

    let recommendedAction: ParentPaymentBackfillRecommendedAction = 'already_current';
    if (hasCriticalDrift) recommendedAction = 'blocked_due_to_drift';
    else if (hasManualReviewSignals) recommendedAction = 'needs_manual_review';
    else if (wouldBackfill) recommendedAction = 'safe_to_backfill';

    parentReports.push({
      summary: {
        parentId,
        parentName: profileNameByParentId.get(parentId) || null,
        existingWalletBalance,
        derivedLedgerBalance,
        walletDrift,
        totalActiveBilledCharges,
        totalExistingPaidAmount,
        totalExistingOutstanding,
        totalPaymentsReceived: roundCurrency(totalPaymentsReceived),
        totalAlreadyAllocated: roundCurrency(totalAlreadyAllocated),
        totalWalletOnlyCandidateAmount: roundCurrency(totalWalletOnlyCandidateAmount),
        totalWouldAllocate: roundCurrency(totalWouldAllocate),
        totalWouldRemainAdvance: roundCurrency(totalWouldRemainAdvance),
        monthsImpacted: impactedMonths,
        anomalyCount: anomalies.length,
        recommendedAction,
      },
      months,
      payments: paymentPreviews,
      anomalies,
      drifts: {
        walletBalanceVsLedgerDrift: walletDrift,
        chargeSettlementDriftCount,
        paymentAllocationDriftCount,
        monthlyReadModelDriftCount,
      },
    });
  });

  return {
    mode: 'dry_run',
    dryRun: true,
    generatedAtMs: Date.now(),
    filters: {
      parentId: requestedParentId,
      fromMonth,
      toMonth,
      includeArchived,
    },
    totals: {
      parents: parentReports.length,
      payments: normalizedPayments.length,
      anomalies: parentReports.reduce((sum, parent) => sum + parent.anomalies.length, 0),
      classificationCounts,
    },
    parents: parentReports.sort((left, right) =>
      left.summary.parentId.localeCompare(right.summary.parentId)
    ),
  };
}
