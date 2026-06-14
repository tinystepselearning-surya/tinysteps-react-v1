import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';
import {
  buildParentPaymentAllocationPlan,
  type BillingChargeDocLike,
  type ParentPaymentAllocationPlan,
  type ParentPaymentAllocationPreview,
} from './parentPaymentAllocator';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY = '2026-05';

type WalletDirection = 'credit' | 'debit';
type WalletTransactionType =
  | 'topup'
  | 'manual_adjustment'
  | 'opening_deficit'
  | 'class_deduction'
  | 'class_deduction_reversal';

const EXCLUDED_BILLING_CHARGE_STATUSES = new Set([
  'void',
  'cancelled',
  'canceled',
  'reversed',
  'refunded',
]);

interface AdminTopupParentWalletRequest {
  parentId?: string;
  amount?: number;
  method?: string;
  paidAt?: string | number;
  note?: string;
  reference?: string;
  studentId?: string;
  enrollmentId?: string;
  idempotencyKey?: string;
}

interface AdminAdjustParentWalletRequest {
  parentId?: string;
  amount?: number;
  direction?: WalletDirection;
  reason?: string;
  note?: string;
  reference?: string;
  studentId?: string;
  enrollmentId?: string;
  idempotencyKey?: string;
}

interface InitParentWalletOpeningDeficitRequest {
  parentId?: string;
  cutoverMonthKey?: string;
  cutoverDate?: string;
  dryRun?: boolean;
  idempotencyKey?: string;
  note?: string;
}

interface ReconcileParentWalletRequest {
  parentId?: string;
  fixSummary?: boolean;
}

interface SetWalletAutomationConfigRequest {
  walletClassDeductionsEnabled?: boolean;
  walletCutoverMonthKey?: string | null;
  walletCutoverDate?: string | null;
  note?: string;
  confirmationText?: string;
}

interface PreviewMissingWalletDeductionsRequest {
  monthKey?: string;
  batchLimit?: number;
}

interface BackfillMissingWalletDeductionsRequest {
  monthKey?: string;
  dryRun?: boolean;
  confirmationText?: string;
  batchLimit?: number;
}

type ParentPaymentAllocationMode = 'fifo_then_wallet' | 'wallet_only';
type ParentPaymentAllocationModeInput = ParentPaymentAllocationMode | 'legacy_then_wallet';

interface AdminReceiveParentPaymentRequest {
  parentId?: string;
  amount?: number;
  method?: string;
  paidAt?: string;
  note?: string;
  reference?: string;
  idempotencyKey?: string;
  dryRun?: boolean;
  allocationMode?: ParentPaymentAllocationModeInput;
}

interface AppendWalletTransactionInput {
  parentId: string;
  type: WalletTransactionType;
  direction: WalletDirection;
  amount: number;
  idempotencyKey: string;
  monthKey: string | null;
  description: string | null;
  method: string | null;
  paidAt: admin.firestore.Timestamp | null;
  note: string | null;
  reference: string | null;
  reason: string | null;
  studentId: string | null;
  enrollmentId: string | null;
  classSessionId?: string | null;
  billingChargeId?: string | null;
  reversalOfTransactionId?: string | null;
  createdBy: string | null;
  sourceSystem?: string | null;
}

interface AppendWalletTransactionResult {
  parentId: string;
  transactionId: string;
  signedAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  currentBalance: number;
  idempotentReplay: boolean;
}

interface PreparedAppendWalletTransactionState {
  walletRef: admin.firestore.DocumentReference;
  transactionRef: admin.firestore.DocumentReference;
  walletExists: boolean;
  walletData: Record<string, unknown>;
  existingTransactionId: string | null;
  existingTransactionData: Record<string, unknown> | null;
}

type WalletWriteOnlyTransaction = Pick<admin.firestore.Transaction, 'set'>;
type ReceiveParentPaymentApplyStage = { current: string };

type WalletAnomalySeverity = 'info' | 'warning' | 'critical';

interface WalletReconcileAnomaly {
  code: string;
  message: string;
  transactionId?: string;
  severity: WalletAnomalySeverity;
}

interface WalletTransactionForSequenceCheck {
  id: string;
  createdAtMs: number;
  signedAmount: number;
  balanceBefore: number;
  balanceAfter: number;
}

const KNOWN_WALLET_TRANSACTION_TYPES = new Set([
  'topup',
  'manual_adjustment',
  'opening_deficit',
  'class_deduction',
  'class_deduction_reversal',
  'refund',
]);

interface WalletAutomationConfig {
  walletClassDeductionsEnabled: boolean;
  walletCutoverMonthKey: string | null;
  walletCutoverDate: Date | null;
}

interface WalletAutomationConfigResolved {
  exists: boolean;
  walletClassDeductionsEnabled: boolean;
  walletCutoverMonthKey: string | null;
  walletCutoverDate: string | null;
  updatedAt: Date | null;
  updatedBy: string | null;
  lastEnabledAt: Date | null;
  lastDisabledAt: Date | null;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeIdempotencyKey(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
}

function normalizeOptionalText(value: unknown, maxLength = 300): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  return raw.slice(0, maxLength);
}

function normalizeOptionalId(value: unknown): string | null {
  return normalizeOptionalText(value, 150);
}

function hasOwnProp(obj: unknown, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    const parsed = (value as { toDate: () => unknown }).toDate();
    if (parsed instanceof Date && !isNaN(parsed.getTime())) return parsed;
    return null;
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = new Date(`${value}T00:00:00+05:30`);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
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

function resolveTopupPaidAt(value: unknown): admin.firestore.Timestamp {
  const parsed = value == null ? new Date() : toDate(value);
  if (!parsed) {
    throw new HttpsError('invalid-argument', 'paidAt must be a valid date string or timestamp');
  }
  return admin.firestore.Timestamp.fromDate(parsed);
}

function resolveSignedAmount(amount: number, direction: WalletDirection): number {
  return direction === 'credit' ? amount : -amount;
}

function resolveActor(auth: { uid?: unknown; token?: { email?: unknown } } | null | undefined): string | null {
  const uid = typeof auth?.uid === 'string' ? auth.uid.trim() : '';
  if (uid) return uid;
  const email = typeof auth?.token?.email === 'string' ? auth.token.email.trim().toLowerCase() : '';
  return email || null;
}

function resolveActorEmail(auth: { token?: { email?: unknown } } | null | undefined): string | null {
  const email = typeof auth?.token?.email === 'string' ? auth.token.email.trim().toLowerCase() : '';
  return email || null;
}

function normalizeDirection(value: unknown): WalletDirection | null {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (raw === 'credit') return 'credit';
  if (raw === 'debit') return 'debit';
  return null;
}

function normalizeTransactionType(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function hasNumericDrift(left: number, right: number, tolerance = 0.01): boolean {
  return Math.abs(left - right) > tolerance;
}

function normalizeCurrency(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return raw || 'INR';
}

function normalizeStatus(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return raw || 'active';
}

function normalizeOptionalPaymentMethod(value: unknown): string | null {
  const raw = normalizeOptionalText(value, 80);
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'upi') return 'UPI';
  if (normalized === 'bank_transfer' || normalized === 'bank' || normalized === 'transfer') {
    return 'bank_transfer';
  }
  if (normalized === 'online') return 'online';
  return raw;
}

function normalizeMonthKey(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  if (!/^\d{4}-\d{2}$/.test(raw)) return null;
  return raw;
}

const BILLING_CHARGE_SETTLEMENT_ONLY_KEYS = new Set([
  'paidamount',
  'outstandingamount',
  'paidat',
  'lastallocatedat',
  'lastpaymentid',
  'lastallocationref',
  'lastallocationreceiptmonthkey',
  'paymentids',
  'allocations',
  'appliedamount',
  'settledamount',
  'allocationbackfilled',
  'allocationbackfillversion',
  'backfilledby',
  'updatedat',
  'updatedby',
  'refreshedat',
]);

function stableValueForWalletChargeSync(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stableValueForWalletChargeSync(item));
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof (value as { toDate?: unknown })?.toDate === 'function') {
    const parsed = toDate(value);
    return parsed ? parsed.toISOString() : null;
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort((left, right) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = stableValueForWalletChargeSync((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value ?? null;
}

export function shouldSkipWalletChargeDeductionSync(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null
): boolean {
  if (!beforeData || !afterData) return false;

  const triggerRelevantBefore = {
    parentId: normalizeOptionalId(beforeData.parentId),
    amount: roundCurrency(Math.max(normalizeNumber(beforeData.amount, 0), 0)),
    status: normalizeChargeStatus(beforeData.status),
    archived: beforeData.archived === true,
    monthKey: normalizeMonthKey(beforeData.monthKey),
    eventDate: resolveChargeEventDateForCutover(beforeData)?.toISOString() || null,
    studentId: resolveChargeStudentId(beforeData),
    enrollmentId: normalizeOptionalId(beforeData.enrollmentId),
    classSessionId: resolveChargeClassSessionId('', beforeData),
    source: normalizeOptionalText(beforeData.source, 150),
  };
  const triggerRelevantAfter = {
    parentId: normalizeOptionalId(afterData.parentId),
    amount: roundCurrency(Math.max(normalizeNumber(afterData.amount, 0), 0)),
    status: normalizeChargeStatus(afterData.status),
    archived: afterData.archived === true,
    monthKey: normalizeMonthKey(afterData.monthKey),
    eventDate: resolveChargeEventDateForCutover(afterData)?.toISOString() || null,
    studentId: resolveChargeStudentId(afterData),
    enrollmentId: normalizeOptionalId(afterData.enrollmentId),
    classSessionId: resolveChargeClassSessionId('', afterData),
    source: normalizeOptionalText(afterData.source, 150),
  };
  if (JSON.stringify(triggerRelevantBefore) === JSON.stringify(triggerRelevantAfter)) {
    return true;
  }

  const changedKeys = new Set<string>();
  Object.keys(beforeData).forEach((key) => {
    if (
      JSON.stringify(stableValueForWalletChargeSync(beforeData[key])) !==
      JSON.stringify(stableValueForWalletChargeSync(afterData[key]))
    ) {
      changedKeys.add(key.toLowerCase());
    }
  });
  Object.keys(afterData).forEach((key) => {
    if (
      JSON.stringify(stableValueForWalletChargeSync(beforeData[key])) !==
      JSON.stringify(stableValueForWalletChargeSync(afterData[key]))
    ) {
      changedKeys.add(key.toLowerCase());
    }
  });

  return changedKeys.size > 0 && Array.from(changedKeys).every((key) => BILLING_CHARGE_SETTLEMENT_ONLY_KEYS.has(key));
}

function normalizeDateOnlyYmd(value: unknown): string | null {
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  }
  const parsed = toDate(value);
  if (!parsed) return null;
  return dayKeyFromDateIST(parsed);
}

function normalizeParentPaymentAllocationMode(value: unknown): ParentPaymentAllocationMode | null {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!raw) return null;
  if (raw === 'wallet_only') return 'wallet_only';
  if (raw === 'fifo_then_wallet' || raw === 'legacy_then_wallet') return 'fifo_then_wallet';
  return null;
}

function normalizeChargeStatus(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!raw) return '';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'settled') return 'paid';
  return raw;
}

function isSettledCharge(status: string): boolean {
  return status === 'paid' || status === 'settled';
}

function resolveChargePaidAmount(data: Record<string, unknown>, amount: number): number {
  const paidRaw = Number(data.paidAmount);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }
  const status = normalizeChargeStatus(data.status);
  if (isSettledCharge(status)) {
    return Math.max(amount, 0);
  }
  return 0;
}

function revenueMonthlyRef(db: admin.firestore.Firestore, monthKey: string) {
  return db
    .collection('adminStats')
    .doc('revenueMonthly')
    .collection('months')
    .doc(monthKey);
}

interface BillingChargeEntry extends BillingChargeDocLike {
  ref: admin.firestore.DocumentReference;
}

interface OpeningDeficitMigrationDetectionResult {
  walletRef: admin.firestore.DocumentReference;
  walletExists: boolean;
  walletCurrentBalance: number;
  openingDeficit: number;
  migratedByOpeningDeficit: boolean;
  openingDeficitTransactionFound: boolean;
  warnings: string[];
}

function resolveSingleAllocationValue(
  allocations: ParentPaymentAllocationPreview[],
  field: 'enrollmentId' | 'kidId' | 'courseId'
): string | null {
  const values = Array.from(
    new Set(
      allocations
        .map((allocation) => normalizeOptionalId(allocation[field]))
        .filter((value): value is string => Boolean(value))
    )
  );
  return values.length === 1 ? values[0] : null;
}

function assertExistingReceiveParentPaymentMatchesInput(
  existing: Record<string, unknown>,
  parentId: string,
  amount: number,
  idempotencyKey: string
): void {
  const existingParentId = String(existing.parentId || '').trim();
  const existingAmount = normalizeNumber(existing.amount, Number.NaN);
  const existingIdempotencyKey = String(existing.idempotencyKey || '').trim();
  const sourceSystem = String(existing.sourceSystem || '').trim();

  if (
    (existingParentId && existingParentId !== parentId) ||
    (Number.isFinite(existingAmount) && Math.abs(existingAmount - amount) > 0.01) ||
    (existingIdempotencyKey && existingIdempotencyKey !== idempotencyKey) ||
    (sourceSystem && sourceSystem !== 'admin_receive_parent_payment')
  ) {
    throw new HttpsError(
      'failed-precondition',
      'idempotencyKey already used for a different parent payment intake request'
    );
  }
}

type ReceiveParentPaymentWriteResult = {
  paymentId: string;
  idempotentReplay: boolean;
  amountReceived: number;
  allocationModeUsed: ParentPaymentAllocationMode;
  parentOutstandingBefore: number;
  legacyOutstandingBefore: number;
  allocatedAmount: number;
  appliedToLegacy: number;
  walletTopupAmount: number;
  advanceAmount: number;
  unallocatedAmount: number;
  remainingUnapplied: number;
  chargesScanned: number;
  chargesIncluded: number;
  allocations: ParentPaymentAllocationPreview[];
  walletTransactionId: string | null;
  walletBalanceAfter: number;
  migratedByOpeningDeficit: boolean;
  warnings: string[];
};

export function buildExistingReceiveParentPaymentReplayResult(params: {
  existing: Record<string, unknown>;
  parentId: string;
  amount: number;
  idempotencyKey: string;
  allocationModeUsed: ParentPaymentAllocationMode;
  migration: OpeningDeficitMigrationDetectionResult;
  warnings: string[];
  paymentId: string;
}): ReceiveParentPaymentWriteResult {
  const { existing, parentId, amount, idempotencyKey, allocationModeUsed, migration, warnings, paymentId } =
    params;
  assertExistingReceiveParentPaymentMatchesInput(existing, parentId, amount, idempotencyKey);

  const replayAllocations =
    Array.isArray(existing.allocations) && existing.allocations.length > 0
      ? (existing.allocations as ParentPaymentAllocationPreview[])
      : Array.isArray(existing.appliedAllocations)
        ? (existing.appliedAllocations as Array<Record<string, unknown>>).map((item) => ({
            sequence: 0,
            chargeId: String(item.chargeId || '').trim(),
            monthKey: null,
            eventDateKey: null,
            chargeAmount: 0,
            previousPaidAmount: 0,
            outstandingBefore: 0,
            allocatedAmount: roundCurrency(normalizeNumber(item.amount, 0)),
            remainingDueAfter: 0,
            enrollmentId: null,
            kidId: null,
            courseId: null,
            studentName: null,
            classSessionId: null,
          }))
        : [];

  const existingAllocatedAmount = roundCurrency(
    normalizeNumber(
      existing.allocatedAmount,
      normalizeNumber(
        existing.legacyAppliedAmount,
        normalizeNumber(existing.appliedAmount, 0)
      )
    )
  );
  const existingUnallocatedAmount = roundCurrency(
    normalizeNumber(
      existing.unallocatedAmount,
      normalizeNumber(existing.unappliedAmount, 0)
    )
  );
  const existingOutstandingBefore = roundCurrency(
    normalizeNumber(
      existing.parentOutstandingBefore,
      normalizeNumber(existing.legacyOutstandingBefore, 0)
    )
  );

  return {
    paymentId,
    idempotentReplay: true,
    amountReceived: roundCurrency(normalizeNumber(existing.amount, amount)),
    allocationModeUsed:
      normalizeParentPaymentAllocationMode(existing.allocationModeUsed) || allocationModeUsed,
    parentOutstandingBefore: existingOutstandingBefore,
    legacyOutstandingBefore: existingOutstandingBefore,
    allocatedAmount: existingAllocatedAmount,
    appliedToLegacy: existingAllocatedAmount,
    walletTopupAmount: roundCurrency(
      normalizeNumber(existing.walletTopupAmount, existingUnallocatedAmount)
    ),
    advanceAmount: roundCurrency(
      normalizeNumber(existing.advanceAmount, existingUnallocatedAmount)
    ),
    unallocatedAmount: existingUnallocatedAmount,
    remainingUnapplied: existingUnallocatedAmount,
    chargesScanned: Math.max(Math.floor(normalizeNumber(existing.chargesScanned, 0)), 0),
    chargesIncluded: Math.max(Math.floor(normalizeNumber(existing.chargesIncluded, 0)), 0),
    allocations: replayAllocations,
    walletTransactionId: normalizeOptionalId(existing.walletTransactionId),
    walletBalanceAfter: roundCurrency(normalizeNumber(existing.walletBalanceAfter, 0)),
    migratedByOpeningDeficit:
      existing.migratedByOpeningDeficit === true || migration.migratedByOpeningDeficit,
    warnings:
      Array.isArray(existing.warnings)
        ? existing.warnings.map((item) => String(item || '').trim()).filter(Boolean)
        : warnings,
  };
}

export function applyReceiveParentPaymentWithPreparedState(params: {
  tx: WalletWriteOnlyTransaction;
  paymentRef: admin.firestore.DocumentReference;
  rollupRef: admin.firestore.DocumentReference;
  parentId: string;
  amount: number;
  allocationModeUsed: ParentPaymentAllocationMode;
  paidAt: admin.firestore.Timestamp;
  dateKey: string;
  monthKey: string;
  method: string | null;
  note: string | null;
  reference: string | null;
  idempotencyKey: string;
  createdBy: string | null;
  migration: OpeningDeficitMigrationDetectionResult;
  warnings: string[];
  chargeEntries: BillingChargeEntry[];
  plan: ParentPaymentAllocationPlan;
  preparedWalletState: PreparedAppendWalletTransactionState;
  walletTopupIdempotencyKey: string;
  stage?: ReceiveParentPaymentApplyStage;
}): ReceiveParentPaymentWriteResult {
  const {
    tx,
    paymentRef,
    rollupRef,
    parentId,
    amount,
    allocationModeUsed,
    paidAt,
    dateKey,
    monthKey,
    method,
    note,
    reference,
    idempotencyKey,
    createdBy,
    migration,
    warnings,
    chargeEntries,
    plan,
    preparedWalletState,
    walletTopupIdempotencyKey,
    stage,
  } = params;

  const chargeEntryById = new Map(chargeEntries.map((entry) => [entry.id, entry]));
  if (stage) stage.current = 'settle_billing_charges';
  for (const allocation of plan.allocations) {
    const chargeEntry = chargeEntryById.get(allocation.chargeId);
    if (!chargeEntry) {
      throw new HttpsError(
        'failed-precondition',
        `Charge ${allocation.chargeId} disappeared before allocation could be applied`
      );
    }

    const nextPaid = roundCurrency(allocation.previousPaidAmount + allocation.allocatedAmount);
    const nextOutstanding = roundCurrency(Math.max(allocation.chargeAmount - nextPaid, 0));
    const updates: Record<string, unknown> = {
      paidAmount: nextPaid,
      outstandingAmount: nextOutstanding,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentIds: admin.firestore.FieldValue.arrayUnion(paymentRef.id),
      lastAllocatedAt: paidAt,
      lastPaymentId: paymentRef.id,
      lastAllocationRef: `payments/${paymentRef.id}/allocations/${String(allocation.sequence).padStart(4, '0')}`,
      lastAllocationReceiptMonthKey: monthKey,
    };
    if (nextOutstanding <= 0.01) {
      updates.status = 'paid';
      updates.paidAt = paidAt;
    } else {
      updates.status = 'partial';
      updates.paidAt = admin.firestore.FieldValue.delete();
    }
    tx.set(chargeEntry.ref, updates, { merge: true });
  }

  const allWarnings = [...warnings, ...plan.warnings];
  const allocatedAmount = roundCurrency(plan.allocatedAmount);
  const unallocatedAmount = roundCurrency(plan.unallocatedAmount);
  const singleEnrollmentId = resolveSingleAllocationValue(plan.allocations, 'enrollmentId');
  const singleKidId = resolveSingleAllocationValue(plan.allocations, 'kidId');
  const singleCourseId = resolveSingleAllocationValue(plan.allocations, 'courseId');

  if (stage) stage.current = 'wallet_credit';
  const walletResult = appendWalletTransactionWithPreparedState(
    tx,
    {
      parentId,
      type: 'topup',
      direction: 'credit',
      amount,
      idempotencyKey: walletTopupIdempotencyKey,
      monthKey,
      description:
        allocationModeUsed === 'wallet_only'
          ? 'Parent payment received (advance wallet only)'
          : 'Parent payment received (auto-applied to oldest dues first)',
      method,
      paidAt,
      note,
      reference,
      reason: null,
      studentId: singleKidId,
      enrollmentId: singleEnrollmentId,
      classSessionId: null,
      billingChargeId: null,
      reversalOfTransactionId: null,
      createdBy,
      sourceSystem: 'admin_receive_parent_payment',
    },
    preparedWalletState
  );

  if (stage) stage.current = 'write_payment_doc';
  tx.set(
    paymentRef,
    {
      parentId,
      enrollmentId: singleEnrollmentId,
      kidId: singleKidId,
      courseId: singleCourseId,
      amount,
      currency: 'INR',
      paidAt,
      paidDateKey: dateKey,
      receiptMonthKey: monthKey,
      monthKey,
      date: dateKey,
      method,
      status: 'completed',
      note: note || null,
      reference: reference || null,
      idempotencyKey,
      sourceSystem: 'admin_receive_parent_payment',
      sourceFunction: 'adminReceiveParentPayment',
      allocationModeUsed,
      parentOutstandingBefore: plan.outstandingBefore,
      legacyOutstandingBefore: plan.outstandingBefore,
      allocatedAmount,
      legacyAppliedAmount: allocatedAmount,
      appliedAmount: allocatedAmount,
      unallocatedAmount,
      unappliedAmount: unallocatedAmount,
      advanceAmount: unallocatedAmount,
      walletTopupAmount: unallocatedAmount,
      walletCreditedAmount: amount,
      chargesScanned: plan.chargesScanned,
      chargesIncluded: plan.chargesIncluded,
      appliedChargeIds: plan.allocations.map((allocation) => allocation.chargeId),
      appliedAllocations: plan.allocations.map((allocation) => ({
        chargeId: allocation.chargeId,
        amount: allocation.allocatedAmount,
      })),
      allocations: plan.allocations,
      walletTransactionId: walletResult.transactionId,
      walletBalanceAfter: roundCurrency(walletResult.currentBalance),
      migratedByOpeningDeficit: migration.migratedByOpeningDeficit,
      warnings: allWarnings,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (stage) stage.current = 'write_allocation_subdocs';
  plan.allocations.forEach((allocation) => {
    const allocationRef = paymentRef
      .collection('allocations')
      .doc(String(allocation.sequence).padStart(4, '0'));
    tx.set(allocationRef, {
      parentId,
      paymentId: paymentRef.id,
      chargeId: allocation.chargeId,
      chargeMonthKey: allocation.monthKey,
      eventDateKey: allocation.eventDateKey,
      amount: allocation.allocatedAmount,
      chargeAmount: allocation.chargeAmount,
      previousPaidAmount: allocation.previousPaidAmount,
      outstandingBefore: allocation.outstandingBefore,
      remainingDueAfter: allocation.remainingDueAfter,
      paidAt,
      receiptMonthKey: monthKey,
      sequence: allocation.sequence,
      studentName: allocation.studentName,
      kidId: allocation.kidId,
      enrollmentId: allocation.enrollmentId,
      courseId: allocation.courseId,
      classSessionId: allocation.classSessionId,
      source: 'adminReceiveParentPayment',
      allocatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  if (stage) stage.current = 'write_revenue_rollup';
  tx.set(
    rollupRef,
    {
      earned: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (stage) stage.current = 'complete';
  return {
    paymentId: paymentRef.id,
    idempotentReplay: false,
    amountReceived: amount,
    allocationModeUsed,
    parentOutstandingBefore: plan.outstandingBefore,
    legacyOutstandingBefore: plan.outstandingBefore,
    allocatedAmount,
    appliedToLegacy: allocatedAmount,
    walletTopupAmount: unallocatedAmount,
    advanceAmount: unallocatedAmount,
    unallocatedAmount,
    remainingUnapplied: unallocatedAmount,
    chargesScanned: plan.chargesScanned,
    chargesIncluded: plan.chargesIncluded,
    allocations: plan.allocations,
    walletTransactionId: walletResult.transactionId,
    walletBalanceAfter: roundCurrency(walletResult.currentBalance),
    migratedByOpeningDeficit: migration.migratedByOpeningDeficit,
    warnings: allWarnings,
  };
}

async function detectOpeningDeficitMigration(
  db: admin.firestore.Firestore,
  parentId: string
): Promise<OpeningDeficitMigrationDetectionResult> {
  const walletRef = db.collection('parentWallets').doc(parentId);
  const walletSnap = await walletRef.get();
  const walletData = (walletSnap.data() || {}) as Record<string, unknown>;
  const openingDeficit = Math.max(normalizeNumber(walletData.openingDeficit, 0), 0);
  const walletCurrentBalance = normalizeNumber(walletData.currentBalance, 0);
  const warnings: string[] = [];

  let openingDeficitTransactionFound = false;
  if (!(openingDeficit > 0)) {
    try {
      const openingDeficitTxSnap = await walletRef
        .collection('transactions')
        .where('type', '==', 'opening_deficit')
        .limit(1)
        .get();
      openingDeficitTransactionFound = !openingDeficitTxSnap.empty;
    } catch (err) {
      warnings.push('Opening deficit transaction lookup failed; using wallet summary only.');
      logger.warn('opening deficit migration detection: transaction lookup failed', {
        parentId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    walletRef,
    walletExists: walletSnap.exists,
    walletCurrentBalance,
    openingDeficit,
    migratedByOpeningDeficit: openingDeficit > 0 || openingDeficitTransactionFound,
    openingDeficitTransactionFound,
    warnings,
  };
}

async function loadWalletAutomationConfig(
  db: admin.firestore.Firestore
): Promise<WalletAutomationConfig> {
  const financeSnap = await db.collection('config').doc('finance').get();
  const financeData = (financeSnap.data() || {}) as Record<string, unknown>;

  const walletClassDeductionsEnabled = financeData.walletClassDeductionsEnabled === true;
  const walletCutoverMonthKey = normalizeMonthKey(financeData.walletCutoverMonthKey);
  const walletCutoverDateKey = normalizeDateOnlyYmd(financeData.walletCutoverDate);
  const parsedCutoverDate = walletCutoverDateKey ? toDate(walletCutoverDateKey) : null;
  const walletCutoverDate = parsedCutoverDate && !isNaN(parsedCutoverDate.getTime())
    ? parsedCutoverDate
    : null;

  return {
    walletClassDeductionsEnabled,
    walletCutoverMonthKey,
    walletCutoverDate,
  };
}

function resolveWalletAutomationConfigFromData(
  data: Record<string, unknown> | null | undefined,
  exists: boolean
): WalletAutomationConfigResolved {
  const source = data || {};
  return {
    exists,
    walletClassDeductionsEnabled: source.walletClassDeductionsEnabled === true,
    walletCutoverMonthKey: normalizeMonthKey(source.walletCutoverMonthKey),
    walletCutoverDate: normalizeDateOnlyYmd(source.walletCutoverDate),
    updatedAt: toDate(source.updatedAt),
    updatedBy: normalizeOptionalId(source.updatedBy),
    lastEnabledAt: toDate(source.lastEnabledAt),
    lastDisabledAt: toDate(source.lastDisabledAt),
  };
}

function toWalletAutomationConfigResponse(config: WalletAutomationConfigResolved) {
  return {
    walletClassDeductionsEnabled: config.walletClassDeductionsEnabled === true,
    walletCutoverMonthKey: config.walletCutoverMonthKey,
    walletCutoverDate: config.walletCutoverDate || null,
    updatedAt: config.updatedAt ? config.updatedAt.toISOString() : null,
    updatedBy: config.updatedBy,
    lastEnabledAt: config.lastEnabledAt ? config.lastEnabledAt.toISOString() : null,
    lastDisabledAt: config.lastDisabledAt ? config.lastDisabledAt.toISOString() : null,
  };
}

function resolveChargeEventDateForCutover(data: Record<string, unknown>): Date | null {
  const candidates: unknown[] = [
    data.chargeDate,
    data.date,
    data.sessionDate,
    data.startAt,
    data.endAt,
    data.createdAt,
    data.updatedAt,
  ];
  for (const value of candidates) {
    const parsed = toDate(value);
    if (parsed) return parsed;
  }
  return null;
}

function resolveChargeStudentId(data: Record<string, unknown>): string | null {
  return normalizeOptionalId(data.kidId) || normalizeOptionalId(data.studentId);
}

function resolveChargeClassSessionId(chargeId: string, data: Record<string, unknown>): string | null {
  const sessionId = normalizeOptionalId(data.sessionId);
  if (sessionId && sessionId === chargeId) return chargeId;
  const source = normalizeOptionalText(data.source, 120);
  if (!sessionId && source === 'session_present_completed') return chargeId;
  return null;
}

function resolveChargeStudentName(data: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    data.kidName,
    data.studentName,
    data.childName,
    data.kidDisplayName,
    data.studentDisplayName,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeOptionalText(candidate, 120);
    if (normalized) return normalized;
  }
  return null;
}

function isExcludedBillingChargeStatus(status: string): boolean {
  return EXCLUDED_BILLING_CHARGE_STATUSES.has(status);
}

function walletTransactionDocId(idempotencyKey: string): string {
  return `tx_${idempotencyKey}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 150);
}

export function prepareAppendWalletTransactionState(
  walletRef: admin.firestore.DocumentReference,
  transactionRef: admin.firestore.DocumentReference,
  walletSnap: Pick<admin.firestore.DocumentSnapshot, 'exists' | 'data'>,
  existingTxSnap: Pick<admin.firestore.DocumentSnapshot, 'exists' | 'id' | 'data'>
): PreparedAppendWalletTransactionState {
  return {
    walletRef,
    transactionRef,
    walletExists: walletSnap.exists,
    walletData: ((walletSnap.data() || {}) as Record<string, unknown>) || {},
    existingTransactionId: existingTxSnap.exists ? existingTxSnap.id : null,
    existingTransactionData: existingTxSnap.exists
      ? (((existingTxSnap.data() || {}) as Record<string, unknown>) || {})
      : null,
  };
}

function assertExistingTransactionMatchesInput(
  existing: Record<string, unknown>,
  input: AppendWalletTransactionInput
): void {
  const existingParentId = String(existing.parentId || '').trim();
  const existingType = String(existing.type || '').trim();
  const existingDirection = String(existing.direction || '').trim();
  const existingAmount = normalizeNumber(existing.amount, Number.NaN);
  const existingIdempotencyKey = String(existing.idempotencyKey || '').trim();

  if (
    (existingParentId && existingParentId !== input.parentId) ||
    (existingType && existingType !== input.type) ||
    (existingDirection && existingDirection !== input.direction) ||
    (existingIdempotencyKey && existingIdempotencyKey !== input.idempotencyKey) ||
    (Number.isFinite(existingAmount) && Math.abs(existingAmount - input.amount) > 0.01)
  ) {
    throw new HttpsError(
      'failed-precondition',
      'idempotencyKey already used for a different wallet transaction request'
    );
  }
}

export function appendWalletTransactionWithPreparedState(
  tx: WalletWriteOnlyTransaction,
  input: AppendWalletTransactionInput,
  preparedState: PreparedAppendWalletTransactionState
): AppendWalletTransactionResult {
  const walletData = preparedState.walletData;
  const walletCurrentBalance = normalizeNumber(walletData.currentBalance, 0);

  if (preparedState.existingTransactionData && preparedState.existingTransactionId) {
    const existingTx = preparedState.existingTransactionData;
    assertExistingTransactionMatchesInput(existingTx, input);

    const signedAmount = normalizeNumber(
      existingTx.signedAmount,
      resolveSignedAmount(input.amount, input.direction)
    );
    const balanceAfter = normalizeNumber(existingTx.balanceAfter, walletCurrentBalance);
    const balanceBefore = normalizeNumber(existingTx.balanceBefore, balanceAfter - signedAmount);
    const currentBalance = preparedState.walletExists
      ? walletCurrentBalance
      : balanceAfter;

    return {
      parentId: input.parentId,
      transactionId: preparedState.existingTransactionId,
      signedAmount,
      balanceBefore,
      balanceAfter,
      currentBalance,
      idempotentReplay: true,
    };
  }

  const signedAmount = resolveSignedAmount(input.amount, input.direction);
  const balanceBefore = walletCurrentBalance;
  const balanceAfter = balanceBefore + signedAmount;
  const currentTopups = normalizeNumber(walletData.totalTopups, 0);
  const currentDeductions = normalizeNumber(walletData.totalDeductions, 0);
  const currentAdjustments = normalizeNumber(walletData.totalAdjustments, 0);
  const openingDeficit = normalizeNumber(walletData.openingDeficit, 0);

  const topupIncrement = input.type === 'topup' && input.direction === 'credit' ? input.amount : 0;
  const adjustmentIncrement = input.type === 'manual_adjustment' ? input.amount : 0;
  const deductionIncrement =
    input.type === 'class_deduction' && input.direction === 'debit' ? input.amount : 0;
  const openingDeficitIncrement =
    input.type === 'opening_deficit' && input.direction === 'debit' ? input.amount : 0;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const walletPatch: Record<string, unknown> = {
    parentId: input.parentId,
    currentBalance: balanceAfter,
    openingDeficit: openingDeficit + openingDeficitIncrement,
    totalTopups: currentTopups + topupIncrement,
    totalDeductions: currentDeductions + deductionIncrement,
    totalAdjustments: currentAdjustments + adjustmentIncrement,
    status: normalizeStatus(walletData.status),
    currency: normalizeCurrency(walletData.currency),
    lastUpdatedAt: now,
    updatedBy: input.createdBy,
  };

  if (!preparedState.walletExists) {
    walletPatch.createdAt = now;
  }

  tx.set(preparedState.walletRef, walletPatch, { merge: true });
  tx.set(preparedState.transactionRef, {
    parentId: input.parentId,
    type: input.type,
    direction: input.direction,
    amount: input.amount,
    signedAmount,
    balanceBefore,
    balanceAfter,
    studentId: input.studentId,
    enrollmentId: input.enrollmentId,
    classSessionId: input.classSessionId || null,
    billingChargeId: input.billingChargeId || null,
    monthKey: input.monthKey || null,
    description: input.description,
    method: input.method,
    paidAt: input.paidAt,
    note: input.note,
    reference: input.reference,
    reason: input.reason,
    createdAt: now,
    createdBy: input.createdBy,
    idempotencyKey: input.idempotencyKey,
    sourceSystem: input.sourceSystem || 'admin_callable',
    reversalOfTransactionId: input.reversalOfTransactionId || null,
  });

  return {
    parentId: input.parentId,
    transactionId: preparedState.transactionRef.id,
    signedAmount,
    balanceBefore,
    balanceAfter,
    currentBalance: balanceAfter,
    idempotentReplay: false,
  };
}

async function appendWalletTransactionWithTx(
  tx: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  input: AppendWalletTransactionInput
): Promise<AppendWalletTransactionResult> {
  const walletRef = db.collection('parentWallets').doc(input.parentId);
  const transactionRef = walletRef.collection('transactions').doc(
    walletTransactionDocId(input.idempotencyKey)
  );

  const walletSnap = await tx.get(walletRef);
  const existingTxSnap = await tx.get(transactionRef);
  const preparedState = prepareAppendWalletTransactionState(
    walletRef,
    transactionRef,
    walletSnap,
    existingTxSnap
  );

  return appendWalletTransactionWithPreparedState(tx, input, preparedState);
}

async function appendWalletTransactionAtomic(
  db: admin.firestore.Firestore,
  input: AppendWalletTransactionInput
): Promise<AppendWalletTransactionResult> {
  return db.runTransaction(async (tx) => {
    return appendWalletTransactionWithTx(tx, db, input);
  });
}

interface OutstandingDuesComputationResult {
  outstandingAmount: number;
  chargesScanned: number;
  chargesIncluded: number;
  chargesExcluded: number;
  warnings: string[];
}

async function computeOutstandingDuesFromBillingCharges(
  db: admin.firestore.Firestore,
  parentId: string,
  cutoverMonthKey: string | null
): Promise<OutstandingDuesComputationResult> {
  const warnings: string[] = [];
  const pushWarning = (message: string) => {
    if (warnings.length < 100) warnings.push(message);
  };

  const snap = await db
    .collection('billingCharges')
    .where('parentId', '==', parentId)
    .get();

  let outstandingAmount = 0;
  let chargesIncluded = 0;
  let chargesExcluded = 0;

  for (const chargeSnap of snap.docs) {
    const data = (chargeSnap.data() || {}) as Record<string, unknown>;
    const status = normalizeChargeStatus(data.status);

    if (EXCLUDED_BILLING_CHARGE_STATUSES.has(status)) {
      chargesExcluded += 1;
      pushWarning(`charge ${chargeSnap.id}: excluded status "${status}"`);
      continue;
    }

    if (cutoverMonthKey) {
      const chargeMonthKey = normalizeMonthKey(data.monthKey);
      if (!chargeMonthKey) {
        pushWarning(
          `charge ${chargeSnap.id}: cutover filter ambiguous (missing/invalid monthKey); included in full-dues calculation`
        );
      } else if (chargeMonthKey.localeCompare(cutoverMonthKey) > 0) {
        chargesExcluded += 1;
        continue;
      }
    }

    if (!Number.isFinite(Number(data.amount))) {
      pushWarning(`charge ${chargeSnap.id}: missing/invalid amount, treated as 0`);
    }
    const amount = Math.max(normalizeNumber(data.amount, 0), 0);
    if (amount <= 0) {
      chargesExcluded += 1;
      continue;
    }

    if (!Number.isFinite(Number(data.paidAmount))) {
      pushWarning(
        `charge ${chargeSnap.id}: missing/invalid paidAmount, resolved using status fallback`
      );
    }
    const paidAmount = resolveChargePaidAmount(data, amount);
    const outstanding = Math.max(amount - paidAmount, 0);
    if (outstanding <= 0) {
      chargesExcluded += 1;
      continue;
    }

    outstandingAmount += outstanding;
    chargesIncluded += 1;
  }

  return {
    outstandingAmount,
    chargesScanned: snap.size,
    chargesIncluded,
    chargesExcluded,
    warnings,
  };
}

function defaultOpeningDeficitIdempotencyKey(
  parentId: string,
  cutoverMonthKey: string | null,
  cutoverDate: string | null
): string {
  const suffix = cutoverMonthKey || cutoverDate || 'all';
  return normalizeIdempotencyKey(`opening_${suffix}_${parentId}`);
}

export const getWalletAutomationConfig = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const db = admin.firestore();
    const configRef = db.collection('config').doc('finance');
    const configSnap = await configRef.get();
    const resolvedConfig = resolveWalletAutomationConfigFromData(
      configSnap.exists ? ((configSnap.data() || {}) as Record<string, unknown>) : null,
      configSnap.exists
    );

    return {
      ok: true,
      exists: configSnap.exists,
      config: toWalletAutomationConfigResponse(resolvedConfig),
    };
  }
);

export const setWalletAutomationConfig = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as SetWalletAutomationConfigRequest;
    if (typeof data.walletClassDeductionsEnabled !== 'boolean') {
      throw new HttpsError(
        'invalid-argument',
        'walletClassDeductionsEnabled must be a boolean value'
      );
    }

    const walletClassDeductionsEnabled = data.walletClassDeductionsEnabled === true;
    const hasWalletCutoverMonthKey = hasOwnProp(data, 'walletCutoverMonthKey');
    const hasWalletCutoverDate = hasOwnProp(data, 'walletCutoverDate');
    const hasNote = hasOwnProp(data, 'note');

    let normalizedCutoverMonthKeyInput: string | null | undefined;
    if (hasWalletCutoverMonthKey) {
      const rawMonth = data.walletCutoverMonthKey;
      if (rawMonth == null || String(rawMonth).trim() === '') {
        normalizedCutoverMonthKeyInput = null;
      } else {
        const parsedMonth = normalizeMonthKey(rawMonth);
        if (!parsedMonth) {
          throw new HttpsError('invalid-argument', 'walletCutoverMonthKey must be in YYYY-MM format');
        }
        normalizedCutoverMonthKeyInput = parsedMonth;
      }
    }

    let normalizedCutoverDateInput: string | null | undefined;
    if (hasWalletCutoverDate) {
      const rawDate = data.walletCutoverDate;
      if (rawDate == null || String(rawDate).trim() === '') {
        normalizedCutoverDateInput = null;
      } else {
        const parsedDate = normalizeDateOnlyYmd(rawDate);
        if (!parsedDate) {
          throw new HttpsError('invalid-argument', 'walletCutoverDate must be in YYYY-MM-DD format');
        }
        normalizedCutoverDateInput = parsedDate;
      }
    }

    const confirmationText =
      typeof data.confirmationText === 'string' ? data.confirmationText : '';
    if (
      walletClassDeductionsEnabled &&
      confirmationText !== 'ENABLE WALLET DEDUCTIONS'
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Confirmation text is required to enable wallet class deductions.'
      );
    }

    const actor = resolveActor(request.auth);
    const actorEmail = resolveActorEmail(request.auth);
    const note = normalizeOptionalText(data.note, 500);
    const db = admin.firestore();
    const configRef = db.collection('config').doc('finance');

    const txOutcome = await db.runTransaction(async (tx) => {
      const snap = await tx.get(configRef);
      const previousData = (snap.data() || {}) as Record<string, unknown>;
      const previousConfig = resolveWalletAutomationConfigFromData(previousData, snap.exists);

      const nextWalletCutoverMonthKey = hasWalletCutoverMonthKey
        ? (normalizedCutoverMonthKeyInput ?? null)
        : previousConfig.walletCutoverMonthKey;
      const nextWalletCutoverDate = hasWalletCutoverDate
        ? (normalizedCutoverDateInput ?? null)
        : previousConfig.walletCutoverDate;
      const nextEffectiveCutoverMonthKey =
        nextWalletCutoverMonthKey ||
        (nextWalletCutoverDate ? nextWalletCutoverDate.slice(0, 7) : null);

      if (
        (walletClassDeductionsEnabled || hasWalletCutoverMonthKey || hasWalletCutoverDate) &&
        nextEffectiveCutoverMonthKey &&
        nextEffectiveCutoverMonthKey.localeCompare(MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY) < 0
      ) {
        throw new HttpsError(
          'invalid-argument',
          `wallet cutover cannot be earlier than ${MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY}`
        );
      }

      if (
        walletClassDeductionsEnabled &&
        !nextWalletCutoverMonthKey &&
        !nextWalletCutoverDate
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Cannot enable wallet class deductions without a cutover month or cutover date.'
        );
      }

      const enabledChanged =
        previousConfig.walletClassDeductionsEnabled !== walletClassDeductionsEnabled;
      const cutoverChanged =
        previousConfig.walletCutoverMonthKey !== nextWalletCutoverMonthKey ||
        previousConfig.walletCutoverDate !== nextWalletCutoverDate;

      const now = admin.firestore.FieldValue.serverTimestamp();
      const patch: Record<string, unknown> = {
        walletClassDeductionsEnabled,
        walletCutoverMonthKey: nextWalletCutoverMonthKey || null,
        walletCutoverDate: nextWalletCutoverDate || null,
        updatedAt: now,
        updatedBy: actor,
        updatedByEmail: actorEmail,
      };

      if (hasNote) {
        patch.note = note;
      }

      if (enabledChanged && walletClassDeductionsEnabled) {
        patch.lastEnabledAt = now;
        patch.lastEnabledBy = actor;
      } else if (enabledChanged && !walletClassDeductionsEnabled) {
        patch.lastDisabledAt = now;
        patch.lastDisabledBy = actor;
      }

      tx.set(configRef, patch, { merge: true });

      return {
        enabledChanged,
        cutoverChanged,
      };
    });

    const latestConfigSnap = await configRef.get();
    const latestConfig = resolveWalletAutomationConfigFromData(
      latestConfigSnap.exists
        ? ((latestConfigSnap.data() || {}) as Record<string, unknown>)
        : null,
      latestConfigSnap.exists
    );

    return {
      ok: true,
      config: toWalletAutomationConfigResponse(latestConfig),
      changed: txOutcome,
    };
  }
);

export const previewMissingWalletDeductions = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as PreviewMissingWalletDeductionsRequest;
    if (hasOwnProp(data, 'monthKey') && data.monthKey != null && typeof data.monthKey !== 'string') {
      throw new HttpsError('invalid-argument', 'monthKey must be a string in YYYY-MM format');
    }
    const rawMonthKey = typeof data.monthKey === 'string' ? data.monthKey.trim() : '';
    const monthKey = rawMonthKey ? normalizeMonthKey(rawMonthKey) : '2026-05';
    if (!monthKey) {
      throw new HttpsError('invalid-argument', 'monthKey must be in YYYY-MM format');
    }
    if (monthKey.localeCompare(MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY) < 0) {
      throw new HttpsError(
        'invalid-argument',
        `monthKey cannot be earlier than ${MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY}`
      );
    }

    const batchLimitRaw = hasOwnProp(data, 'batchLimit') ? Number(data.batchLimit) : 300;
    if (!Number.isFinite(batchLimitRaw)) {
      throw new HttpsError('invalid-argument', 'batchLimit must be a number');
    }
    const batchLimit = Math.floor(batchLimitRaw);
    if (batchLimit < 1 || batchLimit > 400) {
      throw new HttpsError('invalid-argument', 'batchLimit must be between 1 and 400');
    }

    const db = admin.firestore();
    const chargesSnap = await db
      .collection('billingCharges')
      .where('monthKey', '==', monthKey)
      .limit(batchLimit + 1)
      .get();

    const hasMoreCharges = chargesSnap.size > batchLimit;
    const chargeDocs = hasMoreCharges ? chargesSnap.docs.slice(0, batchLimit) : chargesSnap.docs;

    const warnings: string[] = [];
    const missingParentIdsSample: string[] = [];
    const invalidAmountSample: string[] = [];
    const ambiguousMatchSample: string[] = [];
    const addWarning = (message: string) => {
      if (warnings.length < 150) warnings.push(message);
    };
    const addSample = (target: string[], id: string) => {
      if (!id) return;
      if (target.length >= 20) return;
      if (!target.includes(id)) target.push(id);
    };

    type EligibleCharge = {
      chargeId: string;
      parentId: string;
      amount: number;
      classSessionMatchKeys: string[];
      sessionId: string | null;
      studentName: string | null;
    };
    const eligibleCharges: EligibleCharge[] = [];

    for (const chargeSnap of chargeDocs) {
      const chargeId = chargeSnap.id;
      const chargeData = (chargeSnap.data() || {}) as Record<string, unknown>;
      if (chargeData.archived === true) continue;

      const status = normalizeChargeStatus(chargeData.status);
      const voidedByFlag =
        chargeData.voided === true ||
        chargeData.isVoided === true ||
        chargeData.cancelled === true ||
        chargeData.canceled === true;
      if (isExcludedBillingChargeStatus(status) || voidedByFlag) continue;

      const parentId = normalizeOptionalId(chargeData.parentId);
      if (!parentId) {
        addSample(missingParentIdsSample, chargeId);
        addWarning(`charge ${chargeId}: missing parentId`);
        continue;
      }

      const amountRaw = Number(chargeData.amount);
      if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
        addSample(invalidAmountSample, chargeId);
        addWarning(`charge ${chargeId}: missing/invalid amount`);
        continue;
      }
      const amount = roundCurrency(Math.max(amountRaw, 0));
      if (!(amount > 0)) {
        addSample(invalidAmountSample, chargeId);
        addWarning(`charge ${chargeId}: amount must be greater than zero`);
        continue;
      }

      eligibleCharges.push({
        chargeId,
        parentId,
        amount,
        classSessionMatchKeys: Array.from(
          new Set(
            [
              resolveChargeClassSessionId(chargeId, chargeData),
              normalizeOptionalId(chargeData.sessionId),
            ].filter((value): value is string => Boolean(value))
          )
        ),
        sessionId: normalizeOptionalId(chargeData.sessionId),
        studentName: resolveChargeStudentName(chargeData),
      });
    }

    const parentIds = Array.from(new Set(eligibleCharges.map((charge) => charge.parentId)));
    const parentTxSnaps = await Promise.all(
      parentIds.map((parentId) =>
        db
          .collection('parentWallets')
          .doc(parentId)
          .collection('transactions')
          .where('type', '==', 'class_deduction')
          .get()
      )
    );

    type WalletDeductionTx = {
      transactionId: string;
      billingChargeId: string | null;
      classSessionId: string | null;
      monthKey: string | null;
    };
    const txByParent = new Map<string, WalletDeductionTx[]>();
    parentTxSnaps.forEach((snap, index) => {
      const parentId = parentIds[index];
      const entries: WalletDeductionTx[] = [];
      snap.docs.forEach((docSnap) => {
        const txData = (docSnap.data() || {}) as Record<string, unknown>;
        if (normalizeDirection(txData.direction) !== 'debit') return;
        entries.push({
          transactionId: docSnap.id,
          billingChargeId: normalizeOptionalId(txData.billingChargeId),
          classSessionId: normalizeOptionalId(txData.classSessionId),
          monthKey: normalizeMonthKey(txData.monthKey),
        });
      });
      txByParent.set(parentId, entries);
    });

    const missingByParent = new Map<string, { missingCount: number; missingAmountTotal: number; sampleChargeIds: string[] }>();
    const sampleMissingCharges: Array<{
      chargeId: string;
      parentId: string;
      studentName: string | null;
      amount: number;
      sessionId: string | null;
    }> = [];

    let chargesWithExistingDeductionCount = 0;
    let missingDeductionCount = 0;
    let amountMissingDeductionTotal = 0;

    for (const charge of eligibleCharges) {
      const parentTransactions = txByParent.get(charge.parentId) || [];
      const directMatches = parentTransactions.filter(
        (tx) => tx.billingChargeId === charge.chargeId
      );
      if (directMatches.length > 0) {
        chargesWithExistingDeductionCount += 1;
        if (directMatches.length > 1) {
          addSample(ambiguousMatchSample, charge.chargeId);
          addWarning(
            `charge ${charge.chargeId}: multiple class_deduction transactions matched by billingChargeId`
          );
        }
        continue;
      }

      if (charge.classSessionMatchKeys.length > 0) {
        const sessionMatches = parentTransactions.filter((tx) => {
          if (!tx.classSessionId) return false;
          if (!(tx.monthKey === monthKey || !tx.monthKey)) return false;
          return charge.classSessionMatchKeys.includes(tx.classSessionId);
        });
        if (sessionMatches.length > 1) {
          addSample(ambiguousMatchSample, charge.chargeId);
          addWarning(
            `charge ${charge.chargeId}: ambiguous classSessionId match for class_deduction transaction`
          );
        } else if (sessionMatches.length === 1) {
          const matchedTx = sessionMatches[0];
          if (!matchedTx.billingChargeId) {
            chargesWithExistingDeductionCount += 1;
            addWarning(
              `charge ${charge.chargeId}: matched class_deduction by classSessionId because billingChargeId was missing`
            );
            continue;
          }
          addSample(ambiguousMatchSample, charge.chargeId);
          addWarning(
            `charge ${charge.chargeId}: classSessionId matched a deduction with a different billingChargeId`
          );
        }
      }

      missingDeductionCount += 1;
      amountMissingDeductionTotal = roundCurrency(amountMissingDeductionTotal + charge.amount);

      const parentRow = missingByParent.get(charge.parentId) || {
        missingCount: 0,
        missingAmountTotal: 0,
        sampleChargeIds: [],
      };
      parentRow.missingCount += 1;
      parentRow.missingAmountTotal = roundCurrency(parentRow.missingAmountTotal + charge.amount);
      if (parentRow.sampleChargeIds.length < 10 && !parentRow.sampleChargeIds.includes(charge.chargeId)) {
        parentRow.sampleChargeIds.push(charge.chargeId);
      }
      missingByParent.set(charge.parentId, parentRow);

      if (sampleMissingCharges.length < 30) {
        sampleMissingCharges.push({
          chargeId: charge.chargeId,
          parentId: charge.parentId,
          studentName: charge.studentName,
          amount: charge.amount,
          sessionId: charge.sessionId,
        });
      }
    }

    if (hasMoreCharges) {
      addWarning(
        `Scan truncated at batchLimit=${batchLimit}. More billingCharges exist for month ${monthKey}.`
      );
    }
    if (missingParentIdsSample.length > 0) {
      addWarning(`missing parentId sample chargeIds: ${missingParentIdsSample.join(', ')}`);
    }
    if (invalidAmountSample.length > 0) {
      addWarning(`missing/invalid amount sample chargeIds: ${invalidAmountSample.join(', ')}`);
    }
    if (ambiguousMatchSample.length > 0) {
      addWarning(`ambiguous transaction matching sample chargeIds: ${ambiguousMatchSample.join(', ')}`);
    }

    const parentWise = Array.from(missingByParent.entries())
      .map(([parentId, row]) => ({
        parentId,
        missingCount: row.missingCount,
        missingAmountTotal: roundCurrency(row.missingAmountTotal),
        sampleChargeIds: row.sampleChargeIds,
      }))
      .sort((left, right) => {
        if (right.missingAmountTotal !== left.missingAmountTotal) {
          return right.missingAmountTotal - left.missingAmountTotal;
        }
        if (right.missingCount !== left.missingCount) return right.missingCount - left.missingCount;
        return left.parentId.localeCompare(right.parentId);
      });

    return {
      ok: true,
      monthKey,
      batchLimit,
      scannedChargesCount: chargeDocs.length,
      eligibleChargesCount: eligibleCharges.length,
      chargesWithExistingDeductionCount,
      missingDeductionCount,
      amountMissingDeductionTotal: roundCurrency(amountMissingDeductionTotal),
      parentWise,
      sampleMissingCharges,
      warnings,
      hasMoreCharges,
    };
  }
);

export const backfillMissingWalletDeductions = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as BackfillMissingWalletDeductionsRequest;
    if (hasOwnProp(data, 'monthKey') && data.monthKey != null && typeof data.monthKey !== 'string') {
      throw new HttpsError('invalid-argument', 'monthKey must be a string in YYYY-MM format');
    }
    const rawMonthKey = typeof data.monthKey === 'string' ? data.monthKey.trim() : '';
    const monthKey = rawMonthKey ? normalizeMonthKey(rawMonthKey) : MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY;
    if (!monthKey) {
      throw new HttpsError('invalid-argument', 'monthKey must be in YYYY-MM format');
    }
    if (monthKey.localeCompare(MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY) < 0) {
      throw new HttpsError(
        'invalid-argument',
        `monthKey cannot be earlier than ${MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY}`
      );
    }

    const dryRun = data.dryRun !== false;
    const applyMonthKey = MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY;
    const applyConfirmationText = 'BACKFILL WALLET DEDUCTIONS FOR 2026-05';
    if (!dryRun) {
      if (monthKey !== applyMonthKey) {
        throw new HttpsError(
          'failed-precondition',
          `dryRun=false is only allowed for monthKey ${applyMonthKey}`
        );
      }
      const confirmationText = typeof data.confirmationText === 'string' ? data.confirmationText : '';
      if (confirmationText !== applyConfirmationText) {
        throw new HttpsError(
          'failed-precondition',
          `confirmationText must be exactly: ${applyConfirmationText}`
        );
      }
    }

    const batchLimitRaw = hasOwnProp(data, 'batchLimit') ? Number(data.batchLimit) : 100;
    if (!Number.isFinite(batchLimitRaw)) {
      throw new HttpsError('invalid-argument', 'batchLimit must be a number');
    }
    const batchLimit = Math.floor(batchLimitRaw);
    if (batchLimit < 1 || batchLimit > 200) {
      throw new HttpsError('invalid-argument', 'batchLimit must be between 1 and 200');
    }

    const db = admin.firestore();
    const chargeDocs: admin.firestore.QueryDocumentSnapshot[] = [];
    const MAX_CHARGES_SCAN = 2000;
    const CHARGE_SCAN_PAGE_SIZE = 400;
    let lastChargeDoc: admin.firestore.QueryDocumentSnapshot | null = null;
    let hasUnscannedCharges = false;
    let scanTruncatedByCap = false;

    while (chargeDocs.length < MAX_CHARGES_SCAN) {
      const remaining = MAX_CHARGES_SCAN - chargeDocs.length;
      const pageLimit = Math.min(CHARGE_SCAN_PAGE_SIZE, remaining);
      let chargesQuery = db
        .collection('billingCharges')
        .where('monthKey', '==', monthKey)
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(pageLimit);
      if (lastChargeDoc) {
        chargesQuery = chargesQuery.startAfter(lastChargeDoc);
      }
      const pageSnap = await chargesQuery.get();
      if (pageSnap.empty) {
        hasUnscannedCharges = false;
        break;
      }

      chargeDocs.push(...pageSnap.docs);
      lastChargeDoc = pageSnap.docs[pageSnap.docs.length - 1];

      if (pageSnap.size < pageLimit) {
        hasUnscannedCharges = false;
        break;
      }

      hasUnscannedCharges = true;
      if (chargeDocs.length >= MAX_CHARGES_SCAN) {
        scanTruncatedByCap = true;
        break;
      }
    }

    const warnings: string[] = [];
    const missingParentIdsSample: string[] = [];
    const invalidAmountSample: string[] = [];
    const ambiguousMatchSample: string[] = [];
    const addWarning = (message: string) => {
      if (warnings.length < 200) warnings.push(message);
    };
    const addSample = (target: string[], id: string) => {
      if (!id) return;
      if (target.length >= 20) return;
      if (!target.includes(id)) target.push(id);
    };

    type EligibleCharge = {
      chargeId: string;
      parentId: string;
      amount: number;
      monthKey: string;
      classSessionMatchKeys: string[];
      sessionId: string | null;
      studentName: string | null;
      studentId: string | null;
      enrollmentId: string | null;
      deductionClassSessionId: string | null;
    };
    const eligibleCharges: EligibleCharge[] = [];
    let skippedInvalidCount = 0;

    for (const chargeSnap of chargeDocs) {
      const chargeId = chargeSnap.id;
      const chargeData = (chargeSnap.data() || {}) as Record<string, unknown>;
      if (chargeData.archived === true) {
        skippedInvalidCount += 1;
        continue;
      }

      const status = normalizeChargeStatus(chargeData.status);
      const voidedByFlag =
        chargeData.voided === true ||
        chargeData.isVoided === true ||
        chargeData.cancelled === true ||
        chargeData.canceled === true;
      if (isExcludedBillingChargeStatus(status) || voidedByFlag) {
        skippedInvalidCount += 1;
        continue;
      }

      const parentId = normalizeOptionalId(chargeData.parentId);
      if (!parentId) {
        skippedInvalidCount += 1;
        addSample(missingParentIdsSample, chargeId);
        addWarning(`charge ${chargeId}: missing parentId`);
        continue;
      }

      const amountRaw = Number(chargeData.amount);
      if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
        skippedInvalidCount += 1;
        addSample(invalidAmountSample, chargeId);
        addWarning(`charge ${chargeId}: missing/invalid amount`);
        continue;
      }
      const amount = roundCurrency(Math.max(amountRaw, 0));
      if (!(amount > 0)) {
        skippedInvalidCount += 1;
        addSample(invalidAmountSample, chargeId);
        addWarning(`charge ${chargeId}: amount must be greater than zero`);
        continue;
      }

      const normalizedChargeMonthKey = normalizeMonthKey(chargeData.monthKey);
      if (!normalizedChargeMonthKey) {
        skippedInvalidCount += 1;
        addWarning(`charge ${chargeId}: missing/invalid monthKey`);
        continue;
      }
      if (normalizedChargeMonthKey.localeCompare(MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY) < 0) {
        skippedInvalidCount += 1;
        continue;
      }

      const explicitSessionId = normalizeOptionalId(chargeData.sessionId);
      eligibleCharges.push({
        chargeId,
        parentId,
        amount,
        monthKey: normalizedChargeMonthKey,
        classSessionMatchKeys: Array.from(
          new Set(
            [resolveChargeClassSessionId(chargeId, chargeData), explicitSessionId].filter(
              (value): value is string => Boolean(value)
            )
          )
        ),
        sessionId: explicitSessionId,
        studentName: resolveChargeStudentName(chargeData),
        studentId: resolveChargeStudentId(chargeData),
        enrollmentId: normalizeOptionalId(chargeData.enrollmentId),
        deductionClassSessionId: resolveChargeClassSessionId(chargeId, chargeData),
      });
    }

    const parentIds = Array.from(new Set(eligibleCharges.map((charge) => charge.parentId)));
    const parentTxSnaps = await Promise.all(
      parentIds.map((parentId) =>
        db
          .collection('parentWallets')
          .doc(parentId)
          .collection('transactions')
          .where('type', '==', 'class_deduction')
          .get()
      )
    );

    type WalletDeductionTx = {
      billingChargeId: string | null;
      classSessionId: string | null;
      monthKey: string | null;
    };
    const txByParent = new Map<string, WalletDeductionTx[]>();
    parentTxSnaps.forEach((snap, index) => {
      const parentId = parentIds[index];
      const entries: WalletDeductionTx[] = [];
      snap.docs.forEach((docSnap) => {
        const txData = (docSnap.data() || {}) as Record<string, unknown>;
        if (normalizeDirection(txData.direction) !== 'debit') return;
        entries.push({
          billingChargeId: normalizeOptionalId(txData.billingChargeId),
          classSessionId: normalizeOptionalId(txData.classSessionId),
          monthKey: normalizeMonthKey(txData.monthKey),
        });
      });
      txByParent.set(parentId, entries);
    });

    type MissingCharge = EligibleCharge & { ambiguous: boolean };
    const missingCharges: MissingCharge[] = [];

    let alreadyDeductedCount = 0;
    let skippedAmbiguousCount = 0;
    let missingDeductionCount = 0;
    let amountMissingDeductionTotal = 0;
    let additionalMissingBeyondBatch = false;

    for (const charge of eligibleCharges) {
      const parentTransactions = txByParent.get(charge.parentId) || [];
      const directMatches = parentTransactions.filter(
        (tx) => tx.billingChargeId === charge.chargeId
      );
      if (directMatches.length > 0) {
        alreadyDeductedCount += 1;
        if (directMatches.length > 1) {
          addSample(ambiguousMatchSample, charge.chargeId);
          addWarning(
            `charge ${charge.chargeId}: multiple class_deduction transactions matched by billingChargeId`
          );
        }
        continue;
      }

      if (charge.classSessionMatchKeys.length > 0) {
        const sessionMatches = parentTransactions.filter((tx) => {
          if (!tx.classSessionId) return false;
          if (!(tx.monthKey === monthKey || !tx.monthKey)) return false;
          return charge.classSessionMatchKeys.includes(tx.classSessionId);
        });
        if (sessionMatches.length > 1) {
          skippedAmbiguousCount += 1;
          addSample(ambiguousMatchSample, charge.chargeId);
          addWarning(
            `charge ${charge.chargeId}: ambiguous classSessionId match for class_deduction transaction`
          );
          continue;
        } else if (sessionMatches.length === 1) {
          const matchedTx = sessionMatches[0];
          if (!matchedTx.billingChargeId) {
            alreadyDeductedCount += 1;
            addWarning(
              `charge ${charge.chargeId}: matched class_deduction by classSessionId because billingChargeId was missing`
            );
            continue;
          }
          skippedAmbiguousCount += 1;
          addSample(ambiguousMatchSample, charge.chargeId);
          addWarning(
            `charge ${charge.chargeId}: classSessionId matched a deduction with a different billingChargeId`
          );
          continue;
        }
      }

      if (missingCharges.length < batchLimit) {
        missingDeductionCount += 1;
        amountMissingDeductionTotal = roundCurrency(amountMissingDeductionTotal + charge.amount);
        missingCharges.push({ ...charge, ambiguous: false });
      } else {
        additionalMissingBeyondBatch = true;
      }
    }

    const parentWiseMap = new Map<
      string,
      { missingCount: number; backfilledCount: number; amountTotal: number; sampleChargeIds: string[] }
    >();
    const upsertParentWise = (
      parentId: string,
      patch: { missing?: number; backfilled?: number; amount?: number; sampleChargeId?: string | null }
    ) => {
      const row = parentWiseMap.get(parentId) || {
        missingCount: 0,
        backfilledCount: 0,
        amountTotal: 0,
        sampleChargeIds: [],
      };
      row.missingCount += patch.missing || 0;
      row.backfilledCount += patch.backfilled || 0;
      row.amountTotal = roundCurrency(row.amountTotal + (patch.amount || 0));
      const sampleChargeId = String(patch.sampleChargeId || '').trim();
      if (sampleChargeId && row.sampleChargeIds.length < 10 && !row.sampleChargeIds.includes(sampleChargeId)) {
        row.sampleChargeIds.push(sampleChargeId);
      }
      parentWiseMap.set(parentId, row);
    };
    missingCharges.forEach((charge) => {
      upsertParentWise(charge.parentId, {
        missing: 1,
        amount: charge.amount,
        sampleChargeId: charge.chargeId,
      });
    });

    const sampleMissingCharges: Array<{
      chargeId: string;
      parentId: string;
      studentName: string | null;
      amount: number;
      sessionId: string | null;
    }> = [];
    for (const charge of missingCharges) {
      if (sampleMissingCharges.length >= 30) break;
      sampleMissingCharges.push({
        chargeId: charge.chargeId,
        parentId: charge.parentId,
        studentName: charge.studentName,
        amount: charge.amount,
        sessionId: charge.sessionId,
      });
    }

    let backfilledCount = 0;
    let amountBackfilledTotal = 0;
    const sampleBackfilledCharges: Array<{
      chargeId: string;
      parentId: string;
      studentName: string | null;
      amount: number;
      sessionId: string | null;
    }> = [];

    if (!dryRun) {
      for (const charge of missingCharges) {
        const idempotencyKey = normalizeIdempotencyKey(`charge_${charge.chargeId}`);
        if (!idempotencyKey) {
          skippedInvalidCount += 1;
          addWarning(`charge ${charge.chargeId}: failed to build idempotency key`);
          continue;
        }
        try {
          const result = await appendWalletTransactionAtomic(db, {
            parentId: charge.parentId,
            type: 'class_deduction',
            direction: 'debit',
            amount: charge.amount,
            idempotencyKey,
            monthKey: charge.monthKey,
            description: 'Class fee deduction',
            method: null,
            paidAt: null,
            note: null,
            reference: null,
            reason: null,
            studentId: charge.studentId,
            enrollmentId: charge.enrollmentId,
            classSessionId: charge.deductionClassSessionId,
            billingChargeId: charge.chargeId,
            reversalOfTransactionId: null,
            createdBy: 'system:billing_charge_trigger',
            sourceSystem: 'billing_charge_trigger',
          });

          if (result.idempotentReplay) {
            alreadyDeductedCount += 1;
            addWarning(`charge ${charge.chargeId}: deduction already exists (idempotent replay)`);
            continue;
          }

          backfilledCount += 1;
          amountBackfilledTotal = roundCurrency(amountBackfilledTotal + charge.amount);
          upsertParentWise(charge.parentId, {
            backfilled: 1,
          });
          if (sampleBackfilledCharges.length < 30) {
            sampleBackfilledCharges.push({
              chargeId: charge.chargeId,
              parentId: charge.parentId,
              studentName: charge.studentName,
              amount: charge.amount,
              sessionId: charge.sessionId,
            });
          }
        } catch (err) {
          if (err instanceof HttpsError && err.code === 'failed-precondition') {
            skippedAmbiguousCount += 1;
            addWarning(`charge ${charge.chargeId}: skipped due to idempotency conflict (${err.message})`);
            continue;
          }
          throw err;
        }
      }
    }

    const hasMoreCharges = additionalMissingBeyondBatch || hasUnscannedCharges;

    if (additionalMissingBeyondBatch) {
      addWarning(
        `More missing deductions exist beyond batchLimit=${batchLimit}. Run another batch to continue.`
      );
    }
    if (scanTruncatedByCap || hasUnscannedCharges) {
      addWarning(
        `Charge scan reached internal limit (${MAX_CHARGES_SCAN}) or more charges remain for month ${monthKey}; run again to continue scanning.`
      );
    }
    if (missingParentIdsSample.length > 0) {
      addWarning(`missing parentId sample chargeIds: ${missingParentIdsSample.join(', ')}`);
    }
    if (invalidAmountSample.length > 0) {
      addWarning(`missing/invalid amount sample chargeIds: ${invalidAmountSample.join(', ')}`);
    }
    if (ambiguousMatchSample.length > 0) {
      addWarning(`ambiguous transaction matching sample chargeIds: ${ambiguousMatchSample.join(', ')}`);
    }

    const parentWise = Array.from(parentWiseMap.entries())
      .map(([parentId, row]) => ({
        parentId,
        missingCount: row.missingCount,
        backfilledCount: row.backfilledCount,
        amountTotal: roundCurrency(row.amountTotal),
        sampleChargeIds: row.sampleChargeIds,
      }))
      .sort((left, right) => {
        if (right.amountTotal !== left.amountTotal) return right.amountTotal - left.amountTotal;
        if (right.missingCount !== left.missingCount) return right.missingCount - left.missingCount;
        return left.parentId.localeCompare(right.parentId);
      });

    return {
      ok: true,
      monthKey,
      dryRun,
      batchLimit,
      scannedChargesCount: chargeDocs.length,
      eligibleChargesCount: eligibleCharges.length,
      alreadyDeductedCount,
      missingDeductionCount,
      backfilledCount,
      skippedAmbiguousCount,
      skippedInvalidCount,
      amountMissingDeductionTotal: roundCurrency(amountMissingDeductionTotal),
      amountBackfilledTotal: roundCurrency(amountBackfilledTotal),
      parentWise,
      sampleBackfilledCharges,
      sampleMissingCharges,
      warnings,
      hasMoreCharges,
    };
  }
);

export const onBillingChargeWalletSync = onDocumentWritten(
  {
    document: 'billingCharges/{chargeId}',
    region: REGION,
  },
  async (event) => {
    const chargeId = String(event.params.chargeId || '').trim();
    if (!chargeId) return;

    const change = event.data;
    if (!change) {
      logger.warn('wallet billing sync no-op: missing event data', { chargeId });
      return;
    }

    const beforeData = change.before.exists
      ? ((change.before.data() || {}) as Record<string, unknown>)
      : null;
    const afterData = change.after.exists
      ? ((change.after.data() || {}) as Record<string, unknown>)
      : null;
    const currentChargeData = afterData || beforeData;
    if (!currentChargeData) {
      logger.info('wallet billing sync no-op: charge deleted with no data', { chargeId });
      return;
    }

    const db = admin.firestore();
    const config = await loadWalletAutomationConfig(db);
    if (config.walletClassDeductionsEnabled !== true) {
      logger.info('wallet billing sync no-op: feature disabled', { chargeId });
      return;
    }

    const parentId = normalizeOptionalId(currentChargeData.parentId);
    if (!parentId) {
      logger.warn('wallet billing sync no-op: missing parentId', { chargeId });
      return;
    }

    const afterStatus = normalizeChargeStatus(afterData?.status);
    const beforeStatus = normalizeChargeStatus(beforeData?.status);
    const wasExcluded = beforeData ? isExcludedBillingChargeStatus(beforeStatus) : true;
    const isExcluded = afterData ? isExcludedBillingChargeStatus(afterStatus) : true;
    const wasVoidedNow = Boolean(beforeData && afterData && !wasExcluded && isExcluded);

    if (wasVoidedNow) {
      const deductionIdempotencyKey = normalizeIdempotencyKey(`charge_${chargeId}`);
      const reversalIdempotencyKey = normalizeIdempotencyKey(`reverse_charge_${chargeId}`);
      if (!deductionIdempotencyKey || !reversalIdempotencyKey) {
        logger.warn('wallet reversal no-op: invalid idempotency key', { chargeId, parentId });
        return;
      }

      const walletRef = db.collection('parentWallets').doc(parentId);
      const deductionTransactionId = walletTransactionDocId(deductionIdempotencyKey);
      const deductionRef = walletRef.collection('transactions').doc(deductionTransactionId);
      const deductionSnap = await deductionRef.get();
      if (!deductionSnap.exists) {
        logger.warn('wallet reversal skipped: original deduction missing', { chargeId, parentId });
        return;
      }

      const deductionData = (deductionSnap.data() || {}) as Record<string, unknown>;
      const deductionType = normalizeTransactionType(deductionData.type);
      const deductionDirection = normalizeDirection(deductionData.direction);
      const deductionAmount = Math.max(normalizeNumber(deductionData.amount, 0), 0);
      if (deductionType !== 'class_deduction' || deductionDirection !== 'debit' || deductionAmount <= 0) {
        logger.warn('wallet reversal skipped: original deduction transaction invalid', {
          chargeId,
          parentId,
          deductionTransactionId,
        });
        return;
      }

      const chargeMonthKey =
        normalizeMonthKey(currentChargeData.monthKey) || normalizeMonthKey(deductionData.monthKey);
      const studentId =
        resolveChargeStudentId(currentChargeData) || normalizeOptionalId(deductionData.studentId);
      const enrollmentId =
        normalizeOptionalId(currentChargeData.enrollmentId) ||
        normalizeOptionalId(deductionData.enrollmentId);
      const classSessionId =
        resolveChargeClassSessionId(chargeId, currentChargeData) ||
        normalizeOptionalId(deductionData.classSessionId);

      try {
        const result = await appendWalletTransactionAtomic(db, {
          parentId,
          type: 'class_deduction_reversal',
          direction: 'credit',
          amount: deductionAmount,
          idempotencyKey: reversalIdempotencyKey,
          monthKey: chargeMonthKey,
          description: 'Class fee deduction reversal',
          method: null,
          paidAt: null,
          note: null,
          reference: null,
          reason: null,
          studentId,
          enrollmentId,
          classSessionId,
          billingChargeId: chargeId,
          reversalOfTransactionId: deductionTransactionId,
          createdBy: 'system:billing_charge_trigger',
          sourceSystem: 'billing_charge_trigger',
        });

        if (result.idempotentReplay) {
          logger.info('wallet reversal idempotent replay', {
            chargeId,
            parentId,
            transactionId: result.transactionId,
          });
        } else {
          logger.info('wallet reversal created', {
            chargeId,
            parentId,
            transactionId: result.transactionId,
          });
        }
      } catch (err) {
        if (err instanceof HttpsError && err.code === 'failed-precondition') {
          logger.warn('wallet reversal skipped due to idempotency conflict', {
            chargeId,
            parentId,
            message: err.message,
          });
          return;
        }
        throw err;
      }

      return;
    }

    if (!afterData) {
      logger.info('wallet billing sync no-op: billing charge deleted', { chargeId, parentId });
      return;
    }

    if (isExcluded) {
      logger.info('wallet billing sync no-op: ineligible charge status', {
        chargeId,
        parentId,
        status: afterStatus || 'unknown',
      });
      return;
    }
    if (afterData.archived === true) {
      logger.info('wallet billing sync no-op: billing charge archived', {
        chargeId,
        parentId,
      });
      return;
    }
    if (shouldSkipWalletChargeDeductionSync(beforeData, afterData)) {
      logger.info('wallet billing sync no-op: settlement-only update', {
        chargeId,
        parentId,
      });
      return;
    }

    const amount = Math.max(normalizeNumber(afterData.amount, 0), 0);
    if (!(amount > 0)) {
      logger.warn('wallet billing sync no-op: invalid amount', { chargeId, parentId });
      return;
    }

    if (!config.walletCutoverMonthKey && !config.walletCutoverDate) {
      logger.warn('wallet billing sync no-op: cutover not configured', { chargeId, parentId });
      return;
    }

    const chargeMonthKey = normalizeMonthKey(afterData.monthKey);
    if (
      chargeMonthKey &&
      chargeMonthKey.localeCompare(MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY) < 0
    ) {
      logger.info('wallet billing sync no-op: charge before global wallet cutover month', {
        chargeId,
        parentId,
        chargeMonthKey,
        minCutoverMonthKey: MIN_WALLET_DEDUCTION_CUTOVER_MONTH_KEY,
      });
      return;
    }
    if (config.walletCutoverMonthKey) {
      if (!chargeMonthKey) {
        logger.warn('wallet billing sync no-op: missing charge monthKey while cutover month is enabled', {
          chargeId,
          parentId,
          cutoverMonthKey: config.walletCutoverMonthKey,
        });
        return;
      }
      if (chargeMonthKey.localeCompare(config.walletCutoverMonthKey) < 0) {
        logger.info('wallet billing sync no-op: charge before month cutover', {
          chargeId,
          parentId,
          chargeMonthKey,
          cutoverMonthKey: config.walletCutoverMonthKey,
        });
        return;
      }
    }

    if (config.walletCutoverDate) {
      const chargeDate = resolveChargeEventDateForCutover(afterData);
      if (!chargeDate) {
        logger.warn('wallet billing sync no-op: missing charge date while cutover date is enabled', {
          chargeId,
          parentId,
        });
        return;
      }
      if (chargeDate.getTime() < config.walletCutoverDate.getTime()) {
        logger.info('wallet billing sync no-op: charge before date cutover', {
          chargeId,
          parentId,
          cutoverDate: config.walletCutoverDate.toISOString(),
        });
        return;
      }
    }

    const idempotencyKey = normalizeIdempotencyKey(`charge_${chargeId}`);
    if (!idempotencyKey) {
      logger.warn('wallet billing sync no-op: failed to build idempotency key', { chargeId, parentId });
      return;
    }

    try {
      const result = await appendWalletTransactionAtomic(db, {
        parentId,
        type: 'class_deduction',
        direction: 'debit',
        amount,
        idempotencyKey,
        monthKey: chargeMonthKey,
        description: 'Class fee deduction',
        method: null,
        paidAt: null,
        note: null,
        reference: null,
        reason: null,
        studentId: resolveChargeStudentId(afterData),
        enrollmentId: normalizeOptionalId(afterData.enrollmentId),
        classSessionId: resolveChargeClassSessionId(chargeId, afterData),
        billingChargeId: chargeId,
        reversalOfTransactionId: null,
        createdBy: 'system:billing_charge_trigger',
        sourceSystem: 'billing_charge_trigger',
      });

      if (result.idempotentReplay) {
        logger.info('wallet class deduction idempotent replay', {
          chargeId,
          parentId,
          transactionId: result.transactionId,
        });
      } else {
        logger.info('wallet class deduction created', {
          chargeId,
          parentId,
          transactionId: result.transactionId,
          balanceAfter: result.currentBalance,
        });
      }
    } catch (err) {
      if (err instanceof HttpsError && err.code === 'failed-precondition') {
        logger.warn('wallet class deduction skipped due to idempotency conflict', {
          chargeId,
          parentId,
          message: err.message,
        });
        return;
      }
      throw err;
    }
  }
);

export const adminReceiveParentPayment = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as AdminReceiveParentPaymentRequest;
    const parentId = String(data.parentId || '').trim();
    if (!parentId) throw new HttpsError('invalid-argument', 'parentId is required');

    const amount = roundCurrency(Number(data.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpsError('invalid-argument', 'amount must be a positive number');
    }

    const dryRun = data.dryRun !== false;
    const requestedMode = normalizeParentPaymentAllocationMode(data.allocationMode);
    if (hasOwnProp(data, 'allocationMode') && !requestedMode) {
      throw new HttpsError(
        'invalid-argument',
        'allocationMode must be either fifo_then_wallet or wallet_only'
      );
    }

    const paidAt = resolveTopupPaidAt(data.paidAt);
    const paidAtDate = paidAt.toDate();
    const monthKey = monthKeyFromDateIST(paidAtDate);
    const dateKey = dayKeyFromDateIST(paidAtDate);
    const method = normalizeOptionalPaymentMethod(data.method);
    const note = normalizeOptionalText(data.note, 500);
    const reference = normalizeOptionalText(data.reference, 150);
    const createdBy = resolveActor(request.auth);

    const db = admin.firestore();
    const migration = await detectOpeningDeficitMigration(db, parentId);
    const warnings: string[] = [...migration.warnings];
    if (migration.migratedByOpeningDeficit) {
      warnings.push(
        'Wallet opening deficit migration exists. FIFO allocation updates active billing charges only; historical migrated deficit remains represented through wallet balance.'
      );
    }

    const allocationModeUsed: ParentPaymentAllocationMode = requestedMode || 'fifo_then_wallet';
    if (!requestedMode) {
      warnings.push('Defaulted allocationModeUsed to fifo_then_wallet.');
    }

    if (dryRun) {
      const plan: ParentPaymentAllocationPlan =
        allocationModeUsed === 'wallet_only'
          ? {
              chargesScanned: 0,
              chargesIncluded: 0,
              outstandingBefore: 0,
              allocatedAmount: 0,
              unallocatedAmount: amount,
              walletTopupAmount: amount,
              allocations: [],
              warnings: [],
            }
          : buildParentPaymentAllocationPlan(
              (
                await db.collection('billingCharges').where('parentId', '==', parentId).get()
              ).docs.map((docSnap) => ({
                id: docSnap.id,
                data: (docSnap.data() || {}) as Record<string, unknown>,
              })),
              amount
            );
      const allWarnings = [...warnings, ...plan.warnings];

      return {
        ok: true,
        dryRun: true,
        parentId,
        amountReceived: amount,
        allocationModeUsed,
        parentOutstandingBefore: plan.outstandingBefore,
        legacyOutstandingBefore: plan.outstandingBefore,
        allocatedAmount: plan.allocatedAmount,
        appliedToLegacy: plan.allocatedAmount,
        walletTopupAmount: plan.walletTopupAmount,
        advanceAmount: plan.unallocatedAmount,
        unallocatedAmount: plan.unallocatedAmount,
        remainingUnapplied: plan.unallocatedAmount,
        chargesScanned: plan.chargesScanned,
        chargesIncluded: plan.chargesIncluded,
        allocationsPreview: plan.allocations,
        migratedByOpeningDeficit: migration.migratedByOpeningDeficit,
        warnings: allWarnings,
      };
    }

    const idempotencyKey = normalizeIdempotencyKey(data.idempotencyKey);
    if (!idempotencyKey) {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required when dryRun is false');
    }

    const paymentDocId = `receive_parent_payment_${idempotencyKey}`.replace(/[^A-Za-z0-9_-]/g, '_');
    const paymentRef = db.collection('payments').doc(paymentDocId);
    const walletTopupIdempotencyKey = normalizeIdempotencyKey(
      `receive_parent_payment_wallet_${idempotencyKey}`
    );
    if (!walletTopupIdempotencyKey) {
      throw new HttpsError('internal', 'Failed to derive wallet idempotency key');
    }
    const rollupRef = revenueMonthlyRef(db, monthKey);

    const applyStage: ReceiveParentPaymentApplyStage = { current: 'start' };

    try {
      const writeResult = await db.runTransaction(async (tx) => {
        applyStage.current = 'load_existing_payment';
        const existingPaymentSnap = await tx.get(paymentRef);
        if (existingPaymentSnap.exists) {
          applyStage.current = 'existing_payment_replay';
          const existing = (existingPaymentSnap.data() || {}) as Record<string, unknown>;
          return buildExistingReceiveParentPaymentReplayResult({
            existing,
            parentId,
            amount,
            idempotencyKey,
            allocationModeUsed,
            migration,
            warnings,
            paymentId: paymentRef.id,
          });
        }

        applyStage.current = 'load_billing_charges';
        const chargesSnap = await tx.get(
          db.collection('billingCharges').where('parentId', '==', parentId)
        );
        const chargeEntries: BillingChargeEntry[] = chargesSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ref: docSnap.ref,
          data: (docSnap.data() || {}) as Record<string, unknown>,
        }));

        const plan: ParentPaymentAllocationPlan =
          allocationModeUsed === 'wallet_only'
            ? {
                chargesScanned: 0,
                chargesIncluded: 0,
                outstandingBefore: 0,
                allocatedAmount: 0,
                unallocatedAmount: amount,
                walletTopupAmount: amount,
                allocations: [],
                warnings: [],
              }
            : buildParentPaymentAllocationPlan(chargeEntries, amount);

        const walletRef = db.collection('parentWallets').doc(parentId);
        const walletTransactionRef = walletRef
          .collection('transactions')
          .doc(walletTransactionDocId(walletTopupIdempotencyKey));

        applyStage.current = 'load_wallet_doc';
        const walletSnap = await tx.get(walletRef);
        applyStage.current = 'load_wallet_transaction_doc';
        const existingWalletTxSnap = await tx.get(walletTransactionRef);
        const preparedWalletState = prepareAppendWalletTransactionState(
          walletRef,
          walletTransactionRef,
          walletSnap,
          existingWalletTxSnap
        );

        applyStage.current = 'apply_writes';
        return applyReceiveParentPaymentWithPreparedState({
          tx,
          paymentRef,
          rollupRef,
          parentId,
          amount,
          allocationModeUsed,
          paidAt,
          dateKey,
          monthKey,
          method,
          note,
          reference,
          idempotencyKey,
          createdBy,
          migration,
          warnings,
          chargeEntries,
          plan,
          preparedWalletState,
          walletTopupIdempotencyKey,
          stage: applyStage,
        });
      });

      return {
        ok: true,
        dryRun: false,
        parentId,
        paymentId: writeResult.paymentId,
        idempotentReplay: writeResult.idempotentReplay === true,
        amountReceived: writeResult.amountReceived,
        allocationModeUsed: writeResult.allocationModeUsed,
        parentOutstandingBefore: writeResult.parentOutstandingBefore,
        legacyOutstandingBefore: writeResult.legacyOutstandingBefore,
        allocatedAmount: writeResult.allocatedAmount,
        appliedToLegacy: writeResult.appliedToLegacy,
        walletTopupAmount: writeResult.walletTopupAmount,
        advanceAmount: writeResult.advanceAmount,
        unallocatedAmount: writeResult.unallocatedAmount,
        remainingUnapplied: writeResult.remainingUnapplied,
        chargesScanned: writeResult.chargesScanned,
        chargesIncluded: writeResult.chargesIncluded,
        allocations: writeResult.allocations,
        walletTransactionId: writeResult.walletTransactionId,
        walletBalanceAfter: writeResult.walletBalanceAfter,
        migratedByOpeningDeficit: writeResult.migratedByOpeningDeficit,
        warnings: writeResult.warnings,
      };
    } catch (err) {
      logger.error('adminReceiveParentPayment apply failed', {
        functionName: 'adminReceiveParentPayment',
        stage: applyStage.current,
        parentId,
        amount,
        allocationMode: allocationModeUsed,
        dryRun: false,
        paymentDocId,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      if (err instanceof HttpsError) throw err;
      throw new HttpsError(
        'internal',
        'Failed to apply parent payment. No payment was recorded. Please retry once.'
      );
    }
  }
);

export const adminTopupParentWallet = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as AdminTopupParentWalletRequest;
    const parentId = String(data.parentId || '').trim();
    if (!parentId) throw new HttpsError('invalid-argument', 'parentId is required');

    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpsError('invalid-argument', 'amount must be a positive number');
    }

    const idempotencyKey = normalizeIdempotencyKey(data.idempotencyKey);
    if (!idempotencyKey) {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required');
    }

    const paidAt = resolveTopupPaidAt(data.paidAt);
    const monthKey = monthKeyFromDateIST(paidAt.toDate());
    const createdBy = resolveActor(request.auth);
    const db = admin.firestore();

    const result = await appendWalletTransactionAtomic(db, {
      parentId,
      type: 'topup',
      direction: 'credit',
      amount,
      idempotencyKey,
      monthKey,
      description: 'Admin wallet top-up',
      method: normalizeOptionalText(data.method, 80),
      paidAt,
      note: normalizeOptionalText(data.note, 500),
      reference: normalizeOptionalText(data.reference, 150),
      reason: null,
      studentId: normalizeOptionalId(data.studentId),
      enrollmentId: normalizeOptionalId(data.enrollmentId),
      createdBy,
    });

    return {
      ok: true,
      parentId: result.parentId,
      transactionId: result.transactionId,
      type: 'topup',
      direction: 'credit',
      amount,
      signedAmount: result.signedAmount,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      currentBalance: result.currentBalance,
      idempotentReplay: result.idempotentReplay === true,
    };
  }
);

export const adminAdjustParentWallet = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as AdminAdjustParentWalletRequest;
    const parentId = String(data.parentId || '').trim();
    if (!parentId) throw new HttpsError('invalid-argument', 'parentId is required');

    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpsError('invalid-argument', 'amount must be a positive number');
    }

    const direction = normalizeDirection(data.direction);
    if (!direction) {
      throw new HttpsError('invalid-argument', 'direction must be either credit or debit');
    }

    const reason = normalizeOptionalText(data.reason, 300);
    if (!reason) {
      throw new HttpsError('invalid-argument', 'reason is required');
    }

    const idempotencyKey = normalizeIdempotencyKey(data.idempotencyKey);
    if (!idempotencyKey) {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required');
    }

    const createdBy = resolveActor(request.auth);
    const now = new Date();
    const monthKey = monthKeyFromDateIST(now);
    const db = admin.firestore();

    const result = await appendWalletTransactionAtomic(db, {
      parentId,
      type: 'manual_adjustment',
      direction,
      amount,
      idempotencyKey,
      monthKey,
      description: `Admin manual wallet adjustment (${direction})`,
      method: null,
      paidAt: null,
      note: normalizeOptionalText(data.note, 500),
      reference: normalizeOptionalText(data.reference, 150),
      reason,
      studentId: normalizeOptionalId(data.studentId),
      enrollmentId: normalizeOptionalId(data.enrollmentId),
      createdBy,
    });

    return {
      ok: true,
      parentId: result.parentId,
      transactionId: result.transactionId,
      type: 'manual_adjustment',
      direction,
      amount,
      signedAmount: result.signedAmount,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      currentBalance: result.currentBalance,
      idempotentReplay: result.idempotentReplay === true,
    };
  }
);

export const initParentWalletOpeningDeficit = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as InitParentWalletOpeningDeficitRequest;
    const parentId = String(data.parentId || '').trim();
    if (!parentId) throw new HttpsError('invalid-argument', 'parentId is required');

    const dryRun = data.dryRun !== false;
    const warnings: string[] = [];

    const inputCutoverMonthKey = normalizeOptionalText(data.cutoverMonthKey, 7);
    const cutoverMonthKey = normalizeMonthKey(inputCutoverMonthKey);
    if (inputCutoverMonthKey && !cutoverMonthKey) {
      throw new HttpsError('invalid-argument', 'cutoverMonthKey must be in YYYY-MM format');
    }

    const inputCutoverDate = normalizeOptionalText(data.cutoverDate, 40);
    let parsedCutoverDate: Date | null = null;
    if (inputCutoverDate) {
      parsedCutoverDate = toDate(inputCutoverDate);
      if (!parsedCutoverDate) {
        throw new HttpsError('invalid-argument', 'cutoverDate must be a valid date string');
      }
    }

    const cutoverDateMonthKey = parsedCutoverDate ? monthKeyFromDateIST(parsedCutoverDate) : null;
    if (inputCutoverDate && !inputCutoverMonthKey) {
      warnings.push('cutoverDate is applied as month-level filter using IST monthKey');
    }
    if (cutoverMonthKey && cutoverDateMonthKey && cutoverMonthKey !== cutoverDateMonthKey) {
      warnings.push('cutoverMonthKey and cutoverDate differ; cutoverMonthKey takes precedence');
    }

    const effectiveCutoverMonthKey = cutoverMonthKey || cutoverDateMonthKey || null;
    const providedIdempotencyKey = normalizeIdempotencyKey(data.idempotencyKey);
    const idempotencyKey =
      providedIdempotencyKey ||
      defaultOpeningDeficitIdempotencyKey(parentId, effectiveCutoverMonthKey, inputCutoverDate);
    if (!idempotencyKey) {
      throw new HttpsError('internal', 'Failed to generate idempotencyKey');
    }

    const db = admin.firestore();
    const computation = await computeOutstandingDuesFromBillingCharges(
      db,
      parentId,
      effectiveCutoverMonthKey
    );
    const allWarnings = [...warnings, ...computation.warnings];

    const walletRef = db.collection('parentWallets').doc(parentId);
    const walletSnap = await walletRef.get();
    const currentBalance = normalizeNumber((walletSnap.data() || {}).currentBalance, 0);

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        parentId,
        outstandingAmount: computation.outstandingAmount,
        chargesScanned: computation.chargesScanned,
        chargesIncluded: computation.chargesIncluded,
        chargesExcluded: computation.chargesExcluded,
        transactionCreated: false,
        idempotentReplay: false,
        balanceAfter: currentBalance - computation.outstandingAmount,
        idempotencyKey,
        warnings: allWarnings,
      };
    }

    if (computation.outstandingAmount <= 0) {
      return {
        ok: true,
        dryRun: false,
        parentId,
        outstandingAmount: 0,
        chargesScanned: computation.chargesScanned,
        chargesIncluded: computation.chargesIncluded,
        chargesExcluded: computation.chargesExcluded,
        transactionCreated: false,
        idempotentReplay: false,
        balanceAfter: currentBalance,
        idempotencyKey,
        warnings: allWarnings,
      };
    }

    const createdBy = resolveActor(request.auth);
    const result = await appendWalletTransactionAtomic(db, {
      parentId,
      type: 'opening_deficit',
      direction: 'debit',
      amount: computation.outstandingAmount,
      idempotencyKey,
      monthKey: effectiveCutoverMonthKey,
      description: 'Opening deficit from historical unpaid dues',
      method: null,
      paidAt: null,
      note: normalizeOptionalText(data.note, 500),
      reference: null,
      reason: null,
      studentId: null,
      enrollmentId: null,
      createdBy,
      sourceSystem: 'admin_migration_callable',
    });

    return {
      ok: true,
      dryRun: false,
      parentId,
      outstandingAmount: computation.outstandingAmount,
      chargesScanned: computation.chargesScanned,
      chargesIncluded: computation.chargesIncluded,
      chargesExcluded: computation.chargesExcluded,
      transactionCreated: result.idempotentReplay !== true,
      idempotentReplay: result.idempotentReplay === true,
      balanceAfter: result.currentBalance,
      idempotencyKey,
      warnings: allWarnings,
    };
  }
);

export const reconcileParentWallet = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as ReconcileParentWalletRequest;
    const parentId = String(data.parentId || '').trim();
    if (!parentId) throw new HttpsError('invalid-argument', 'parentId is required');

    const fixSummary = data.fixSummary === true;
    const db = admin.firestore();
    const walletRef = db.collection('parentWallets').doc(parentId);

    const [walletSnap, transactionsSnap] = await Promise.all([
      walletRef.get(),
      walletRef.collection('transactions').get(),
    ]);

    const walletData = (walletSnap.data() || {}) as Record<string, unknown>;
    const summaryCurrentBalance = roundCurrency(normalizeNumber(walletData.currentBalance, 0));
    const summaryOpeningDeficit = roundCurrency(normalizeNumber(walletData.openingDeficit, 0));
    const summaryTotalTopups = roundCurrency(normalizeNumber(walletData.totalTopups, 0));
    const summaryTotalDeductions = roundCurrency(normalizeNumber(walletData.totalDeductions, 0));
    const summaryTotalAdjustments = roundCurrency(normalizeNumber(walletData.totalAdjustments, 0));

    let ledgerBalance = 0;
    let computedOpeningDeficit = 0;
    let computedTopups = 0;
    let computedDeductions = 0;
    let computedAdjustments = 0;
    let creditCount = 0;
    let debitCount = 0;

    const anomalies: WalletReconcileAnomaly[] = [];
    const warnings: string[] = [];
    const idempotencyKeyToTxIds = new Map<string, string[]>();
    const openingDeficitTxIds: string[] = [];
    const sequenceCandidates: WalletTransactionForSequenceCheck[] = [];

    const addAnomaly = (
      code: string,
      message: string,
      severity: WalletAnomalySeverity,
      transactionId?: string
    ) => {
      anomalies.push({ code, message, severity, transactionId });
    };

    for (const docSnap of transactionsSnap.docs) {
      const txId = docSnap.id;
      const txData = (docSnap.data() || {}) as Record<string, unknown>;
      const direction = normalizeDirection(txData.direction);
      const txType = normalizeTransactionType(txData.type);
      const amountRaw = Number(txData.amount);
      const amount = Number.isFinite(amountRaw) ? amountRaw : Number.NaN;
      const signedAmountRaw = Number(txData.signedAmount);
      const signedAmount = Number.isFinite(signedAmountRaw) ? signedAmountRaw : Number.NaN;
      const idempotencyKey = normalizeOptionalText(txData.idempotencyKey, 120) || '';
      const billingChargeId = normalizeOptionalId(txData.billingChargeId);
      const reversalOfTransactionId = normalizeOptionalId(txData.reversalOfTransactionId);
      const createdAtDate = toDate(txData.createdAt);
      const balanceBefore = normalizeNumber(txData.balanceBefore, Number.NaN);
      const balanceAfter = normalizeNumber(txData.balanceAfter, Number.NaN);

      if (!direction) {
        addAnomaly('INVALID_DIRECTION', 'direction is missing or invalid', 'critical', txId);
      } else if (direction === 'credit') {
        creditCount += 1;
      } else {
        debitCount += 1;
      }

      if (!txType) {
        addAnomaly('MISSING_TRANSACTION_TYPE', 'type is missing', 'warning', txId);
      } else if (!KNOWN_WALLET_TRANSACTION_TYPES.has(txType) && !txType.includes('reversal')) {
        addAnomaly('UNKNOWN_TRANSACTION_TYPE', `unknown transaction type "${txType}"`, 'warning', txId);
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        addAnomaly('INVALID_AMOUNT', 'amount must be a positive number', 'critical', txId);
      }

      if (!Number.isFinite(signedAmount)) {
        addAnomaly(
          'MISSING_SIGNED_AMOUNT',
          'signedAmount is missing/invalid and was treated as 0 in ledger sum',
          'critical',
          txId
        );
      } else {
        ledgerBalance += signedAmount;
      }

      if (direction === 'credit' && Number.isFinite(signedAmount) && signedAmount <= 0) {
        addAnomaly(
          'SIGNED_AMOUNT_DIRECTION_MISMATCH',
          'credit transaction must have a positive signedAmount',
          'critical',
          txId
        );
      }
      if (direction === 'debit' && Number.isFinite(signedAmount) && signedAmount >= 0) {
        addAnomaly(
          'SIGNED_AMOUNT_DIRECTION_MISMATCH',
          'debit transaction must have a negative signedAmount',
          'critical',
          txId
        );
      }

      if (!idempotencyKey) {
        addAnomaly('MISSING_IDEMPOTENCY_KEY', 'idempotencyKey is missing', 'warning', txId);
      } else {
        const txIds = idempotencyKeyToTxIds.get(idempotencyKey) || [];
        txIds.push(txId);
        idempotencyKeyToTxIds.set(idempotencyKey, txIds);
      }

      const amountForTotals = Number.isFinite(amount) ? Math.abs(amount) : 0;
      if (txType === 'opening_deficit' && direction === 'debit') {
        computedOpeningDeficit += amountForTotals;
        openingDeficitTxIds.push(txId);
      }
      if (txType === 'topup' && direction === 'credit') {
        computedTopups += amountForTotals;
      }
      if (txType === 'class_deduction' && direction === 'debit') {
        computedDeductions += amountForTotals;
        if (!billingChargeId) {
          addAnomaly(
            'CLASS_DEDUCTION_MISSING_BILLING_CHARGE_ID',
            'class_deduction transaction is missing billingChargeId',
            'warning',
            txId
          );
        }
      }
      if (txType === 'manual_adjustment') {
        computedAdjustments += amountForTotals;
      }

      if (txType.includes('reversal') && !reversalOfTransactionId) {
        addAnomaly(
          'REVERSAL_MISSING_REFERENCE',
          'reversal transaction is missing reversalOfTransactionId',
          'warning',
          txId
        );
      }

      if (!createdAtDate) {
        addAnomaly('MISSING_CREATED_AT', 'createdAt is missing/invalid', 'warning', txId);
      } else {
        sequenceCandidates.push({
          id: txId,
          createdAtMs: createdAtDate.getTime(),
          signedAmount,
          balanceBefore,
          balanceAfter,
        });
      }
    }

    for (const [key, txIds] of idempotencyKeyToTxIds.entries()) {
      if (txIds.length > 1) {
        addAnomaly(
          'DUPLICATE_IDEMPOTENCY_KEY',
          `duplicate idempotencyKey "${key}" found in ${txIds.length} transactions`,
          'critical'
        );
      }
    }

    if (openingDeficitTxIds.length > 1) {
      addAnomaly(
        'DUPLICATE_OPENING_DEFICIT',
        `multiple opening_deficit debit transactions found (${openingDeficitTxIds.length})`,
        'critical'
      );
    }

    if (sequenceCandidates.length !== transactionsSnap.size) {
      warnings.push('Some transactions are missing createdAt; balance sequence check is partial.');
    }

    if (sequenceCandidates.length > 0) {
      sequenceCandidates.sort(
        (left, right) => left.createdAtMs - right.createdAtMs || left.id.localeCompare(right.id)
      );

      let previousBalanceAfter: number | null = null;
      for (const item of sequenceCandidates) {
        const hasSignedAmount = Number.isFinite(item.signedAmount);
        const hasBalanceBefore = Number.isFinite(item.balanceBefore);
        const hasBalanceAfter = Number.isFinite(item.balanceAfter);

        if (hasSignedAmount && hasBalanceBefore && hasBalanceAfter) {
          const expectedBalanceAfter = item.balanceBefore + item.signedAmount;
          if (hasNumericDrift(expectedBalanceAfter, item.balanceAfter)) {
            addAnomaly(
              'BALANCE_AFTER_MISMATCH',
              'balanceAfter does not match balanceBefore + signedAmount',
              'critical',
              item.id
            );
          }
        }

        if (previousBalanceAfter != null && hasBalanceBefore) {
          if (hasNumericDrift(previousBalanceAfter, item.balanceBefore)) {
            addAnomaly(
              'BALANCE_SEQUENCE_MISMATCH',
              'balanceBefore does not match previous transaction balanceAfter',
              'critical',
              item.id
            );
          }
        }

        if (hasBalanceAfter) {
          previousBalanceAfter = item.balanceAfter;
        }
      }
    }

    const computedLedgerBalance = roundCurrency(ledgerBalance);
    const computedOpeningDeficitValue = roundCurrency(computedOpeningDeficit);
    const computedTopupsValue = roundCurrency(computedTopups);
    const computedDeductionsValue = roundCurrency(computedDeductions);
    const computedAdjustmentsValue = roundCurrency(computedAdjustments);

    const driftCurrentBalance = roundCurrency(summaryCurrentBalance - computedLedgerBalance);
    const driftOpeningDeficit = roundCurrency(summaryOpeningDeficit - computedOpeningDeficitValue);
    const driftTopups = roundCurrency(summaryTotalTopups - computedTopupsValue);
    const driftDeductions = roundCurrency(summaryTotalDeductions - computedDeductionsValue);
    const driftAdjustments = roundCurrency(summaryTotalAdjustments - computedAdjustmentsValue);

    const hasDrift =
      hasNumericDrift(summaryCurrentBalance, computedLedgerBalance) ||
      hasNumericDrift(summaryOpeningDeficit, computedOpeningDeficitValue) ||
      hasNumericDrift(summaryTotalTopups, computedTopupsValue) ||
      hasNumericDrift(summaryTotalDeductions, computedDeductionsValue) ||
      hasNumericDrift(summaryTotalAdjustments, computedAdjustmentsValue);

    const hasCriticalAnomalies = anomalies.some((anomaly) => anomaly.severity === 'critical');

    let summaryFixed = false;
    let fixedFields: string[] = [];

    if (fixSummary) {
      if (hasCriticalAnomalies) {
        warnings.push('fixSummary was skipped because critical transaction integrity anomalies were found.');
      } else if (!hasDrift) {
        warnings.push('fixSummary requested, but no summary drift was detected.');
      } else {
        const actor = resolveActor(request.auth);
        await db.runTransaction(async (tx) => {
          const latestWalletSnap = await tx.get(walletRef);
          const latestWalletData = (latestWalletSnap.data() || {}) as Record<string, unknown>;
          const now = admin.firestore.FieldValue.serverTimestamp();
          const walletPatch: Record<string, unknown> = {
            parentId,
            currentBalance: computedLedgerBalance,
            openingDeficit: computedOpeningDeficitValue,
            totalTopups: computedTopupsValue,
            totalDeductions: computedDeductionsValue,
            totalAdjustments: computedAdjustmentsValue,
            status: normalizeStatus(latestWalletData.status),
            currency: normalizeCurrency(latestWalletData.currency),
            lastUpdatedAt: now,
            updatedBy: actor,
            reconciliationFixedAt: now,
            reconciliationFixedBy: actor,
          };

          if (!latestWalletSnap.exists) {
            walletPatch.createdAt = now;
          }

          tx.set(walletRef, walletPatch, { merge: true });
        });

        summaryFixed = true;
        fixedFields = [
          'currentBalance',
          'openingDeficit',
          'totalTopups',
          'totalDeductions',
          'totalAdjustments',
          'lastUpdatedAt',
          'updatedBy',
          'reconciliationFixedAt',
          'reconciliationFixedBy',
        ];
      }
    }

    return {
      ok: true,
      parentId,
      walletExists: walletSnap.exists,
      transactionCount: transactionsSnap.size,
      summary: {
        currentBalance: summaryCurrentBalance,
        openingDeficit: summaryOpeningDeficit,
        totalTopups: summaryTotalTopups,
        totalDeductions: summaryTotalDeductions,
        totalAdjustments: summaryTotalAdjustments,
      },
      computed: {
        ledgerBalance: computedLedgerBalance,
        openingDeficit: computedOpeningDeficitValue,
        totalTopups: computedTopupsValue,
        totalDeductions: computedDeductionsValue,
        totalAdjustments: computedAdjustmentsValue,
        creditCount,
        debitCount,
      },
      drift: {
        currentBalance: driftCurrentBalance,
        openingDeficit: driftOpeningDeficit,
        totalTopups: driftTopups,
        totalDeductions: driftDeductions,
        totalAdjustments: driftAdjustments,
        hasDrift,
      },
      anomalies,
      warnings,
      fixSummary,
      summaryFixed,
      fixedFields: summaryFixed ? fixedFields : undefined,
    };
  }
);
