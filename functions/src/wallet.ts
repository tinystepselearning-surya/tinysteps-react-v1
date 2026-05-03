import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;

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
  walletCutoverDate: Date | null;
  updatedAt: Date | null;
  updatedBy: string | null;
  lastEnabledAt: Date | null;
  lastDisabledAt: Date | null;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
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

function normalizeMonthKey(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  if (!/^\d{4}-\d{2}$/.test(raw)) return null;
  return raw;
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

async function loadWalletAutomationConfig(
  db: admin.firestore.Firestore
): Promise<WalletAutomationConfig> {
  const financeSnap = await db.collection('config').doc('finance').get();
  const financeData = (financeSnap.data() || {}) as Record<string, unknown>;

  const walletClassDeductionsEnabled = financeData.walletClassDeductionsEnabled === true;
  const walletCutoverMonthKey = normalizeMonthKey(financeData.walletCutoverMonthKey);
  const parsedCutoverDate = toDate(financeData.walletCutoverDate);
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
    walletCutoverDate: toDate(source.walletCutoverDate),
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
    walletCutoverDate: config.walletCutoverDate ? config.walletCutoverDate.toISOString() : null,
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

function isExcludedBillingChargeStatus(status: string): boolean {
  return EXCLUDED_BILLING_CHARGE_STATUSES.has(status);
}

function walletTransactionDocId(idempotencyKey: string): string {
  return `tx_${idempotencyKey}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 150);
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

async function appendWalletTransactionAtomic(
  db: admin.firestore.Firestore,
  input: AppendWalletTransactionInput
): Promise<AppendWalletTransactionResult> {
  const walletRef = db.collection('parentWallets').doc(input.parentId);
  const transactionRef = walletRef.collection('transactions').doc(walletTransactionDocId(input.idempotencyKey));

  return db.runTransaction(async (tx) => {
    const walletSnap = await tx.get(walletRef);
    const existingTxSnap = await tx.get(transactionRef);
    const walletData = (walletSnap.data() || {}) as Record<string, unknown>;
    const walletCurrentBalance = normalizeNumber(walletData.currentBalance, 0);

    if (existingTxSnap.exists) {
      const existingTx = (existingTxSnap.data() || {}) as Record<string, unknown>;
      assertExistingTransactionMatchesInput(existingTx, input);

      const signedAmount = normalizeNumber(
        existingTx.signedAmount,
        resolveSignedAmount(input.amount, input.direction)
      );
      const balanceAfter = normalizeNumber(existingTx.balanceAfter, walletCurrentBalance);
      const balanceBefore = normalizeNumber(existingTx.balanceBefore, balanceAfter - signedAmount);
      const currentBalance = walletSnap.exists
        ? walletCurrentBalance
        : balanceAfter;

      return {
        parentId: input.parentId,
        transactionId: existingTxSnap.id,
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

    if (!walletSnap.exists) {
      walletPatch.createdAt = now;
    }

    tx.set(walletRef, walletPatch, { merge: true });
    tx.set(transactionRef, {
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
      transactionId: transactionRef.id,
      signedAmount,
      balanceBefore,
      balanceAfter,
      currentBalance: balanceAfter,
      idempotentReplay: false,
    };
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

    let normalizedCutoverDateInput: Date | null | undefined;
    if (hasWalletCutoverDate) {
      const rawDate = data.walletCutoverDate;
      if (rawDate == null || String(rawDate).trim() === '') {
        normalizedCutoverDateInput = null;
      } else {
        const parsedDate = toDate(rawDate);
        if (!parsedDate) {
          throw new HttpsError('invalid-argument', 'walletCutoverDate must be a valid date');
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
      const previousCutoverDateMs = previousConfig.walletCutoverDate
        ? previousConfig.walletCutoverDate.getTime()
        : null;
      const nextCutoverDateMs = nextWalletCutoverDate ? nextWalletCutoverDate.getTime() : null;
      const cutoverChanged =
        previousConfig.walletCutoverMonthKey !== nextWalletCutoverMonthKey ||
        previousCutoverDateMs !== nextCutoverDateMs;

      const now = admin.firestore.FieldValue.serverTimestamp();
      const patch: Record<string, unknown> = {
        walletClassDeductionsEnabled,
        walletCutoverMonthKey: nextWalletCutoverMonthKey || null,
        walletCutoverDate: nextWalletCutoverDate
          ? admin.firestore.Timestamp.fromDate(nextWalletCutoverDate)
          : null,
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
