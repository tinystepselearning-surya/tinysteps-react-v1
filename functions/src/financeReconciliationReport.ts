import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard';
import { fetchCompletedSessionsForFinanceReconciliation } from './helpers/financeReconciliationCompletedSessions';
import {
  isActiveBillingCharge,
  resolveCanonicalServiceDate,
} from './helpers/serviceDate';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;

type FirestoreRow = Record<string, unknown> & { id: string };

interface SessionReportRow extends FirestoreRow {
  sessionId?: string;
  date?: unknown;
  status?: unknown;
  teacherId?: unknown;
  parentId?: unknown;
  enrollmentId?: unknown;
  revenueAccrued?: unknown;
  revenueRepairReason?: unknown;
  revenueRepairDetectedAt?: unknown;
  monthKey?: unknown;
  kidId?: unknown;
  studentId?: unknown;
  kidIds?: unknown;
  attendance?: unknown;
  revenueSuppressed?: unknown;
  revenueSuppressedReason?: unknown;
  startAt?: unknown;
  paidAt?: unknown;
  earnedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface FinancialReportRow extends FirestoreRow {
  sessionId?: unknown;
  date?: unknown;
  status?: unknown;
  teacherId?: unknown;
  parentId?: unknown;
  enrollmentId?: unknown;
  amount?: unknown;
  monthKey?: unknown;
  method?: unknown;
  note?: unknown;
  serviceDate?: unknown;
  serviceMonthKey?: unknown;
  sessionDate?: unknown;
  chargeDate?: unknown;
  startAt?: unknown;
  createdAt?: unknown;
  paidAmount?: unknown;
  outstandingAmount?: unknown;
}

interface EnrollmentReportRow extends FirestoreRow {
  parentId?: unknown;
  teacherId?: unknown;
}

function mapDocToRow<T extends FirestoreRow = FirestoreRow>(
  docSnap: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>,
): T {
  return { id: docSnap.id, ...(docSnap.data() || {}) } as T;
}

function normalizeStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(`${trimmed}T00:00:00+05:30`);
      return Number.isFinite(d.getTime()) ? d : null;
    }
    const parsed = new Date(trimmed);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeTs = value as { toDate?: () => Date };
    if (typeof maybeTs.toDate === 'function') {
      const parsed = maybeTs.toDate();
      return parsed instanceof Date && Number.isFinite(parsed.getTime()) ? parsed : null;
    }
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

function normalizeMonthKey(value: unknown): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}$/.test(raw)) {
    throw new HttpsError('invalid-argument', 'monthKey must be YYYY-MM');
  }
  return raw;
}

function toInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function resolveMonthKey(data: Record<string, unknown>): string | null {
  const monthKey = String(data.monthKey || '').trim();
  if (/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;

  const dateText = String(data.date || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText.slice(0, 7);

  const timestampCandidate =
    toDate(data.startAt) ||
    toDate(data.paidAt) ||
    toDate(data.earnedAt) ||
    toDate(data.createdAt) ||
    toDate(data.updatedAt);

  if (!timestampCandidate) return null;
  return monthKeyFromDateIST(timestampCandidate);
}

function inMonthScope(data: Record<string, unknown>, monthKey: string | null): boolean {
  if (!monthKey) return true;
  return resolveMonthKey(data) === monthKey;
}

async function fetchLimitedDocs(
  baseQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
  maxDocs: number,
): Promise<{
  docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[];
  truncated: boolean;
}> {
  const limitedSnap = await baseQuery.limit(maxDocs).get();
  let truncated = false;
  if (limitedSnap.size === maxDocs && limitedSnap.docs.length > 0) {
    const lastDoc = limitedSnap.docs[limitedSnap.docs.length - 1];
    const probeSnap = await baseQuery.startAfter(lastDoc).limit(1).get();
    truncated = !probeSnap.empty;
  }
  return { docs: limitedSnap.docs, truncated };
}

async function fetchDocsByIds(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  ids: string[],
  maxLookups: number,
): Promise<{
  map: Map<string, FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>>;
  truncated: boolean;
}> {
  const uniqueIds = Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)));
  const limitedIds = uniqueIds.slice(0, maxLookups);
  const map = new Map<string, FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>>();

  for (let i = 0; i < limitedIds.length; i += 250) {
    const slice = limitedIds.slice(i, i + 250);
    if (slice.length === 0) continue;
    const refs = slice.map((id) => db.collection(collectionName).doc(id));
    const snaps = await db.getAll(...refs);
    snaps.forEach((snap) => map.set(snap.id, snap));
  }

  return { map, truncated: uniqueIds.length > limitedIds.length };
}

async function fetchDocsByFieldValues(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  field: string,
  values: string[],
  maxValues: number,
  maxDocs: number,
): Promise<{ rows: FirestoreRow[]; truncated: boolean }> {
  const uniqueValues = Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
  const limitedValues = uniqueValues.slice(0, maxValues);
  const rows = new Map<string, FirestoreRow>();
  let truncated = uniqueValues.length > limitedValues.length;

  for (let index = 0; index < limitedValues.length; index += 30) {
    const slice = limitedValues.slice(index, index + 30);
    if (slice.length === 0) continue;
    const snap = await db.collection(collectionName).where(field, 'in', slice).get();
    for (const docSnap of snap.docs) {
      if (rows.size >= maxDocs) {
        truncated = true;
        break;
      }
      rows.set(docSnap.id, mapDocToRow(docSnap));
    }
    if (rows.size >= maxDocs) break;
  }
  return { rows: Array.from(rows.values()), truncated };
}

function resolvePrimaryKidId(session: Record<string, unknown>): string | null {
  const direct = String(session.kidId || session.studentId || '').trim();
  if (direct) return direct;
  if (Array.isArray(session.kidIds) && session.kidIds.length > 0) {
    const first = String(session.kidIds[0] || '').trim();
    if (first) return first;
  }
  return null;
}

function resolveAttendanceStatus(session: Record<string, unknown>, kidId: string | null): string | null {
  if (!kidId) return null;
  const attendanceRaw = session.attendance;
  if (!attendanceRaw || typeof attendanceRaw !== 'object') return null;
  const attendance = attendanceRaw as Record<string, unknown>;
  const entry = attendance[kidId];
  if (!entry) return null;
  if (typeof entry === 'string') return normalizeStatus(entry);
  if (typeof entry === 'object' && entry !== null) {
    return normalizeStatus((entry as Record<string, unknown>).status);
  }
  return null;
}

function isExpectedFinanciallyCompletedSession(session: Record<string, unknown>): boolean {
  if (session.revenueSuppressed === true) return false;
  if (session.revenueAccrued === true) return true;
  if (normalizeStatus(session.status) !== 'completed') return false;
  const kidId = resolvePrimaryKidId(session);
  const attendanceStatus = resolveAttendanceStatus(session, kidId);
  if (!attendanceStatus) return true;
  return attendanceStatus === 'present' || attendanceStatus === 'late';
}

function sampleRows<T>(rows: T[], limit: number): T[] {
  if (rows.length <= limit) return rows;
  return rows.slice(0, limit);
}

function normalizeAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

type ParentMonthlyExpectedTotals = {
  billedAmount: number;
  settledAmount: number;
  dueAmount: number;
  billedClassCount: number;
};

const ZERO_PARENT_MONTHLY_EXPECTED_TOTALS: ParentMonthlyExpectedTotals = {
  billedAmount: 0,
  settledAmount: 0,
  dueAmount: 0,
  billedClassCount: 0,
};

export function findParentMonthlyReadModelMismatches(input: {
  monthKey: string;
  charges: Array<Record<string, unknown>>;
  sessionsById: Record<string, Record<string, unknown> | null | undefined>;
  readModels: Array<Record<string, unknown>>;
}): Array<Record<string, unknown>> {
  const expectedByParent = new Map<string, ParentMonthlyExpectedTotals>();
  const activeChargeCountBySession = new Map<string, number>();

  input.charges.forEach((charge) => {
    if (!isActiveBillingCharge(charge)) return;
    const sessionId = String(charge.sessionId || '').trim();
    if (!sessionId) return;
    activeChargeCountBySession.set(sessionId, (activeChargeCountBySession.get(sessionId) || 0) + 1);
  });

  input.charges.forEach((charge) => {
    if (!isActiveBillingCharge(charge)) return;
    const sessionId = String(charge.sessionId || '').trim();
    const session = sessionId ? input.sessionsById[sessionId] : null;
    if (!session) return;
    const service = resolveCanonicalServiceDate(session, null);
    if (service.serviceMonthKey !== input.monthKey || String(charge.monthKey || '').trim() !== input.monthKey) return;
    if ((activeChargeCountBySession.get(sessionId) || 0) > 1) return;
    const parentId = String(charge.parentId || '').trim();
    if (!parentId) return;
    const amount = Math.max(normalizeAmount(charge.amount), 0);
    const paid = resolveBillingChargePaidAmount(charge, amount);
    const expected = expectedByParent.get(parentId) || { ...ZERO_PARENT_MONTHLY_EXPECTED_TOTALS };
    expected.billedAmount += amount;
    expected.settledAmount += paid;
    expected.dueAmount += Math.max(amount - paid, 0);
    expected.billedClassCount += 1;
    expectedByParent.set(parentId, expected);
  });

  const readModelByParent = new Map<string, Record<string, unknown>>();
  input.readModels.forEach((readModel) => {
    if (String(readModel.monthKey || '').trim() !== input.monthKey) return;
    const parentId = String(readModel.parentId || '').trim();
    if (parentId) readModelByParent.set(parentId, readModel);
  });

  const parentIds = new Set([...expectedByParent.keys(), ...readModelByParent.keys()]);
  const mismatches: Array<Record<string, unknown>> = [];
  parentIds.forEach((parentId) => {
    const expected = expectedByParent.get(parentId) || { ...ZERO_PARENT_MONTHLY_EXPECTED_TOTALS };
    const actualModel = readModelByParent.get(parentId);
    const actual = actualModel || {};
    const deltas = {
      billedAmount: normalizeAmount(actual.billedAmount) - expected.billedAmount,
      settledAmount: normalizeAmount(actual.settledAmount) - expected.settledAmount,
      dueAmount: normalizeAmount(actual.dueAmount) - expected.dueAmount,
      billedClassCount: normalizeAmount(actual.billedClassCount) - expected.billedClassCount,
    };
    if (!actualModel || Object.values(deltas).some((delta) => Math.abs(delta) > 0.01)) {
      mismatches.push({
        parentId,
        monthKey: input.monthKey,
        readModelExists: !!actualModel,
        expected,
        actual: {
          billedAmount: normalizeAmount(actual.billedAmount),
          settledAmount: normalizeAmount(actual.settledAmount),
          dueAmount: normalizeAmount(actual.dueAmount),
          billedClassCount: normalizeAmount(actual.billedClassCount),
        },
        deltas,
      });
    }
  });
  return mismatches;
}

function pickFirstPositiveNumber(...values: unknown[]): number {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function resolveSessionFee(session: Record<string, unknown>, enrollment: Record<string, unknown>): number {
  return pickFirstPositiveNumber(
    enrollment.ratePerSession,
    enrollment.feePerSession,
    enrollment.feePerClass,
    enrollment.parentRate,
    enrollment.parentClassRate,
    enrollment.classFee,
    enrollment.feeAmount,
    session.feeAmount,
    session.feePerClass,
    session.feePerSession,
    session.ratePerSession,
    session.parentRate,
    session.classFee,
  );
}

function resolveBillingChargePaidAmount(charge: Record<string, unknown>, amount: number): number {
  const paid = Number(charge.paidAmount);
  if (Number.isFinite(paid) && paid > 0) return Math.min(Math.max(paid, 0), amount);
  const outstanding = Number(charge.outstandingAmount);
  if (Number.isFinite(outstanding) && outstanding >= 0) {
    return Math.max(amount - Math.min(Math.max(outstanding, 0), amount), 0);
  }
  const status = normalizeStatus(charge.status);
  return status === 'paid' || status === 'settled' ? amount : 0;
}

function hasPresentAttendance(session: Record<string, unknown>): boolean {
  const attendance = session.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return false;
  return Object.values(attendance).some((entry) => {
    if (typeof entry === 'string') return normalizeStatus(entry) === 'present';
    if (entry && typeof entry === 'object') {
      return normalizeStatus((entry as Record<string, unknown>).status) === 'present';
    }
    return false;
  });
}

export function diagnosePresentSessionBilling(input: {
  sessionId: string;
  session: Record<string, unknown>;
  enrollment: Record<string, unknown> | null;
  enrollmentExists: boolean;
  activeChargeExists: boolean;
}): Record<string, unknown> | null {
  const { sessionId, session, enrollment, enrollmentExists, activeChargeExists } = input;
  if (normalizeStatus(session.status) !== 'completed' || !hasPresentAttendance(session)) return null;
  const enrollmentId = String(session.enrollmentId || '').trim();
  const resolvedEnrollment = enrollment || {};
  const parentId = String(session.parentId || resolvedEnrollment.parentId || '').trim();
  const fee = resolveSessionFee(session, resolvedEnrollment);
  const reasons: string[] = [];
  if (session.revenueSuppressed === true) reasons.push('suppressed_revenue');
  if (!enrollmentId) reasons.push('missing_enrollment');
  else if (!enrollmentExists) reasons.push('enrollment_not_found');
  if (!parentId) reasons.push('missing_parent');
  if (fee <= 0) reasons.push('zero_or_unresolved_fee');
  if (!activeChargeExists) reasons.push('charge_missing_or_void');
  return {
    sessionId,
    enrollmentId: enrollmentId || null,
    parentId: parentId || null,
    kidId: resolvePrimaryKidId(session),
    serviceDate: resolveCanonicalServiceDate(session, null).serviceDate,
    fee,
    activeChargeExists,
    billable: reasons.length === 1 && reasons[0] === 'charge_missing_or_void',
    reasons,
  };
}

function resolveTeacherEarningPaidAmount(earning: Record<string, unknown>, amount: number): number {
  const paidRaw = normalizeAmount(earning.paidAmount);
  if (paidRaw > 0) return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  const status = normalizeStatus(earning.status);
  if (status === 'paid' || status === 'settled') return Math.max(amount, 0);
  return 0;
}

function duplicateFingerprintGroups(
  rows: Array<Record<string, unknown>>,
  idField: string,
  buildFingerprint: (row: Record<string, unknown>) => string,
): Array<{ fingerprint: string; count: number; ids: string[] }> {
  const groups = new Map<string, string[]>();

  rows.forEach((row) => {
    const id = String(row[idField] || '').trim();
    if (!id) return;
    const key = buildFingerprint(row);
    if (!key) return;
    const bucket = groups.get(key) || [];
    bucket.push(id);
    groups.set(key, bucket);
  });

  return Array.from(groups.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([fingerprint, ids]) => ({ fingerprint, count: ids.length, ids }))
    .sort((a, b) => b.count - a.count);
}

type ReconciliationTriggerType = 'manual' | 'scheduled';

interface ReconciliationRunOptions {
  monthKey: string | null;
  sampleLimit: number;
  maxDocsPerCollection: number;
  maxLinkedLookups: number;
}

interface ReconciliationPersistMeta {
  triggerType: ReconciliationTriggerType;
  createdByUid?: string | null;
  scheduleLabel?: string | null;
}

function monthKeyNowIST(): string {
  return monthKeyFromDateIST(new Date());
}

async function buildFinanceReconciliationReport(
  options: ReconciliationRunOptions,
): Promise<Record<string, unknown>> {
  const { monthKey, sampleLimit, maxDocsPerCollection, maxLinkedLookups } = options;
  const db = admin.firestore();
  const warnings: string[] = [];

  const [repairSnap, completedSnap, chargesSnap, earningsSnap, paymentsSnap, payoutsSnap, parentReadModelsSnap] =
    await Promise.all([
      fetchLimitedDocs(db.collection('classSessions').where('revenueRepairRequired', '==', true), maxDocsPerCollection),
      fetchCompletedSessionsForFinanceReconciliation({
        db,
        monthKey,
        maxDocs: maxDocsPerCollection,
      }),
      fetchLimitedDocs(
        monthKey
          ? db.collection('billingCharges').where('monthKey', '==', monthKey)
          : db.collection('billingCharges'),
        maxDocsPerCollection,
      ),
      fetchLimitedDocs(
        monthKey
          ? db.collection('teacherEarnings').where('monthKey', '==', monthKey)
          : db.collection('teacherEarnings'),
        maxDocsPerCollection,
      ),
      fetchLimitedDocs(
        monthKey ? db.collection('payments').where('monthKey', '==', monthKey) : db.collection('payments'),
        maxDocsPerCollection,
      ),
      fetchLimitedDocs(
        monthKey
          ? db.collection('teacherPayouts').where('monthKey', '==', monthKey)
          : db.collection('teacherPayouts'),
        maxDocsPerCollection,
      ),
      monthKey
        ? fetchLimitedDocs(
            db.collectionGroup('months').where('monthKey', '==', monthKey),
            maxDocsPerCollection,
          )
        : Promise.resolve({ docs: [], truncated: false }),
    ]);

  if (repairSnap.truncated) warnings.push('classSessions(revenueRepairRequired) scan truncated');
  if (completedSnap.truncated) warnings.push('classSessions(completed) scan truncated');
  if (chargesSnap.truncated) warnings.push('billingCharges scan truncated');
  if (earningsSnap.truncated) warnings.push('teacherEarnings scan truncated');
  if (paymentsSnap.truncated) warnings.push('payments scan truncated');
  if (payoutsSnap.truncated) warnings.push('teacherPayouts scan truncated');
  if (parentReadModelsSnap.truncated) warnings.push('parentMonthlyReadModels scan truncated');

  const repairSessions: SessionReportRow[] = repairSnap.docs
    .map((docSnap) => mapDocToRow<SessionReportRow>(docSnap))
    .filter((row) => inMonthScope(row, monthKey));

  const completedSessions: SessionReportRow[] = completedSnap.docs
    .map((docSnap) => mapDocToRow<SessionReportRow>(docSnap))
    .filter((row) => inMonthScope(row, monthKey));

  let charges: FinancialReportRow[] = chargesSnap.docs.map((docSnap) =>
    mapDocToRow<FinancialReportRow>(docSnap),
  );
  const earnings: FinancialReportRow[] = earningsSnap.docs.map((docSnap) =>
    mapDocToRow<FinancialReportRow>(docSnap),
  );
  const payments: FinancialReportRow[] = paymentsSnap.docs.map((docSnap) =>
    mapDocToRow<FinancialReportRow>(docSnap),
  );
  const payouts: FinancialReportRow[] = payoutsSnap.docs.map((docSnap) =>
    mapDocToRow<FinancialReportRow>(docSnap),
  );

  if (monthKey) {
    const chargesForScopedSessions = await fetchDocsByFieldValues(
      db,
      'billingCharges',
      'sessionId',
      completedSessions.map((session) => session.id),
      maxLinkedLookups,
      maxDocsPerCollection,
    );
    if (chargesForScopedSessions.truncated) warnings.push('billingCharges lookup by scoped sessionId truncated');
    const chargeMap = new Map(charges.map((charge) => [charge.id, charge]));
    chargesForScopedSessions.rows.forEach((row) => chargeMap.set(row.id, row as FinancialReportRow));
    charges = Array.from(chargeMap.values());
  }

  const chargeSessionIds = charges
    .map((row) => String(row.sessionId || '').trim())
    .filter(Boolean);
  const earningSessionIds = earnings
    .map((row) => String(row.sessionId || '').trim())
    .filter(Boolean);

  const linkedSessionIds = Array.from(new Set([...chargeSessionIds, ...earningSessionIds]));
  const linkedSessionFetch = await fetchDocsByIds(db, 'classSessions', linkedSessionIds, maxLinkedLookups);
  if (linkedSessionFetch.truncated) {
    warnings.push('linked classSessions lookup truncated');
  }

  const linkedSessionMap = new Map<string, SessionReportRow>();
  linkedSessionFetch.map.forEach((snap, id) => {
    if (!snap.exists) return;
    linkedSessionMap.set(id, { id, ...(snap.data() || {}) } as SessionReportRow);
  });

  const billingChargeServiceMonthMismatch: Array<Record<string, unknown>> = [];
  const billingChargesWithUnresolvedServiceDate: Array<Record<string, unknown>> = [];
  const billingChargesUsingNonCanonicalLegacyDate: Array<Record<string, unknown>> = [];
  const activeChargeIdsBySession = new Map<string, string[]>();

  charges.forEach((charge) => {
    const sessionId = String(charge.sessionId || '').trim();
    const session = sessionId ? linkedSessionMap.get(sessionId) : null;
    const resolved = resolveCanonicalServiceDate(session, charge);
    const chargeMonthKey = String(charge.monthKey || '').trim() || null;
    const sample = {
      chargeId: charge.id,
      sessionId: sessionId || null,
      parentId: charge.parentId || null,
      chargeMonthKey,
      serviceDate: resolved.serviceDate,
      serviceMonthKey: resolved.serviceMonthKey,
      dateSource: resolved.source,
    };

    if (!resolved.serviceDate) billingChargesWithUnresolvedServiceDate.push(sample);
    if (chargeMonthKey && resolved.serviceMonthKey && chargeMonthKey !== resolved.serviceMonthKey) {
      billingChargeServiceMonthMismatch.push(sample);
    }
    if (resolved.usedLegacyChargeDate) billingChargesUsingNonCanonicalLegacyDate.push(sample);

    if (sessionId && isActiveBillingCharge(charge)) {
      const ids = activeChargeIdsBySession.get(sessionId) || [];
      ids.push(charge.id);
      activeChargeIdsBySession.set(sessionId, ids);
    }
  });

  const duplicateActiveBillingChargesBySession = Array.from(activeChargeIdsBySession.entries())
    .filter(([, chargeIds]) => chargeIds.length > 1)
    .map(([sessionId, chargeIds]) => ({ sessionId, chargeIds, count: chargeIds.length }));

  const expectedCompletedSessions = completedSessions.filter((session) =>
    isExpectedFinanciallyCompletedSession(session),
  );

  const sessionIdsWithCharges = new Set(chargeSessionIds);
  const sessionIdsWithEarnings = new Set(earningSessionIds);

  const missingChargeSessions = expectedCompletedSessions
    .filter((session) => !sessionIdsWithCharges.has(String(session.id)))
    .map((session) => ({
      sessionId: String(session.id),
      date: session.date || null,
      status: session.status || null,
      teacherId: session.teacherId || null,
      parentId: session.parentId || null,
      enrollmentId: session.enrollmentId || null,
      revenueAccrued: session.revenueAccrued === true,
    }));

  const missingEarningSessions = expectedCompletedSessions
    .filter((session) => !sessionIdsWithEarnings.has(String(session.id)))
    .map((session) => ({
      sessionId: String(session.id),
      date: session.date || null,
      status: session.status || null,
      teacherId: session.teacherId || null,
      parentId: session.parentId || null,
      enrollmentId: session.enrollmentId || null,
      revenueAccrued: session.revenueAccrued === true,
    }));

  const completedSessionsMissingFinancialWithoutValidSuppression = completedSessions
    .filter((session) => {
      if (normalizeStatus(session.status) !== 'completed') return false;
      const sessionId = String(session.id || '').trim();
      if (!sessionId) return false;
      const missingCharge = !sessionIdsWithCharges.has(sessionId);
      const missingEarning = !sessionIdsWithEarnings.has(sessionId);
      if (!missingCharge && !missingEarning) return false;
      const hasValidSuppressionReason =
        session.revenueSuppressed === true &&
        String(session.revenueSuppressedReason || '').trim().length > 0;
      return !hasValidSuppressionReason;
    })
    .map((session) => {
      const sessionId = String(session.id || '').trim();
      return {
        sessionId,
        date: session.date || null,
        status: session.status || null,
        teacherId: session.teacherId || null,
        parentId: session.parentId || null,
        enrollmentId: session.enrollmentId || null,
        missingCharge: !sessionIdsWithCharges.has(sessionId),
        missingEarning: !sessionIdsWithEarnings.has(sessionId),
        revenueSuppressed: session.revenueSuppressed === true,
        revenueSuppressedReason: String(session.revenueSuppressedReason || '').trim() || null,
      };
    });

  const chargesMissingSession = charges
    .filter((charge) => {
      const sessionId = String(charge.sessionId || '').trim();
      return !!sessionId && !linkedSessionMap.has(sessionId);
    })
    .map((charge) => ({
      chargeId: String(charge.id),
      sessionId: String(charge.sessionId || '').trim() || null,
      enrollmentId: charge.enrollmentId || null,
      parentId: charge.parentId || null,
      teacherId: charge.teacherId || null,
      status: charge.status || null,
      amount: normalizeAmount(charge.amount),
      monthKey: charge.monthKey || resolveMonthKey(charge) || null,
    }));

  const earningsMissingSession = earnings
    .filter((earning) => {
      const sessionId = String(earning.sessionId || '').trim();
      return !!sessionId && !linkedSessionMap.has(sessionId);
    })
    .map((earning) => ({
      earningId: String(earning.id),
      sessionId: String(earning.sessionId || '').trim() || null,
      enrollmentId: earning.enrollmentId || null,
      parentId: earning.parentId || null,
      teacherId: earning.teacherId || null,
      status: earning.status || null,
      amount: normalizeAmount(earning.amount),
      monthKey: earning.monthKey || resolveMonthKey(earning) || null,
    }));

  const paymentDuplicateGroups = duplicateFingerprintGroups(
    payments,
    'id',
    (payment) => {
      const enrollmentId = String(payment.enrollmentId || '').trim();
      const amount = normalizeAmount(payment.amount).toFixed(2);
      const method = normalizeStatus(payment.method);
      const date = String(payment.date || '').trim();
      const note = String(payment.note || '').trim().toLowerCase();
      if (!enrollmentId || !date) return '';
      return `${enrollmentId}|${amount}|${method}|${date}|${note}`;
    },
  );

  const payoutDuplicateGroups = duplicateFingerprintGroups(
    payouts,
    'id',
    (payout) => {
      const teacherId = String(payout.teacherId || '').trim();
      const amount = normalizeAmount(payout.amount).toFixed(2);
      const method = normalizeStatus(payout.method);
      const date = String(payout.date || '').trim();
      const note = String(payout.note || '').trim().toLowerCase();
      if (!teacherId || !date) return '';
      return `${teacherId}|${amount}|${method}|${date}|${note}`;
    },
  );

  const sessionFinancialInconsistencyMap = new Map<
    string,
    {
      sessionId: string;
      status: string;
      reasons: Set<string>;
      chargeIds: Set<string>;
      earningIds: Set<string>;
    }
  >();
  const allowedFinancialStatuses = new Set(['completed']);

  const upsertInconsistentSession = (sessionId: string, status: string, reason: string) => {
    const existing = sessionFinancialInconsistencyMap.get(sessionId);
    if (existing) {
      existing.reasons.add(reason);
      return existing;
    }
    const next = {
      sessionId,
      status,
      reasons: new Set([reason]),
      chargeIds: new Set<string>(),
      earningIds: new Set<string>(),
    };
    sessionFinancialInconsistencyMap.set(sessionId, next);
    return next;
  };

  charges.forEach((charge) => {
    const status = normalizeStatus(charge.status);
    if (status === 'void') return;
    const sessionId = String(charge.sessionId || '').trim();
    if (!sessionId) return;
    const session = linkedSessionMap.get(sessionId);
    if (!session) return;
    const sessionStatus = normalizeStatus(session.status);
    if (!allowedFinancialStatuses.has(sessionStatus)) {
      const issue = upsertInconsistentSession(
        sessionId,
        sessionStatus || 'unknown',
        'charge_linked_to_non_completed_session',
      );
      issue.chargeIds.add(String(charge.id));
    }
  });

  earnings.forEach((earning) => {
    const status = normalizeStatus(earning.status);
    if (status === 'void') return;
    const sessionId = String(earning.sessionId || '').trim();
    if (!sessionId) return;
    const session = linkedSessionMap.get(sessionId);
    if (!session) return;
    const sessionStatus = normalizeStatus(session.status);
    if (!allowedFinancialStatuses.has(sessionStatus)) {
      const issue = upsertInconsistentSession(
        sessionId,
        sessionStatus || 'unknown',
        'earning_linked_to_non_completed_session',
      );
      issue.earningIds.add(String(earning.id));
    }
  });

  linkedSessionMap.forEach((session, sessionId) => {
    const sessionStatus = normalizeStatus(session.status);
    if (session.revenueAccrued === true && sessionStatus !== 'completed') {
      upsertInconsistentSession(sessionId, sessionStatus || 'unknown', 'revenue_accrued_but_not_completed');
    }
  });

  const inconsistentStatusSessions = Array.from(sessionFinancialInconsistencyMap.values()).map((row) => ({
    sessionId: row.sessionId,
    status: row.status,
    reasons: Array.from(row.reasons),
    chargeIds: Array.from(row.chargeIds),
    earningIds: Array.from(row.earningIds),
  }));

  const enrollmentIdsForLookup = Array.from(
    new Set(
      [...charges, ...earnings]
        .map((row) => String(row.enrollmentId || '').trim())
        .filter(Boolean),
    ),
  );
  const enrollmentFetch = await fetchDocsByIds(db, 'enrollments', enrollmentIdsForLookup, maxLinkedLookups);
  if (enrollmentFetch.truncated) warnings.push('linked enrollments lookup truncated');

  const enrollmentMap = new Map<string, EnrollmentReportRow>();
  enrollmentFetch.map.forEach((snap, id) => {
    if (!snap.exists) return;
    enrollmentMap.set(id, { id, ...(snap.data() || {}) } as EnrollmentReportRow);
  });

  const linkageIssues: Array<Record<string, unknown>> = [];
  const collectLinkageIssues = (docType: 'billingCharge' | 'teacherEarning', row: Record<string, unknown>) => {
    const reasons: string[] = [];
    const sessionId = String(row.sessionId || '').trim();
    const enrollmentId = String(row.enrollmentId || '').trim();
    const parentId = String(row.parentId || '').trim();
    const teacherId = String(row.teacherId || '').trim();

    if (!sessionId) reasons.push('missing_sessionId');
    if (!enrollmentId) reasons.push('missing_enrollmentId');
    if (!parentId) reasons.push('missing_parentId');
    if (!teacherId) reasons.push('missing_teacherId');

    const session = sessionId ? linkedSessionMap.get(sessionId) : null;
    const enrollment = enrollmentId ? enrollmentMap.get(enrollmentId) : null;

    if (sessionId && !session) reasons.push('session_not_found');
    if (enrollmentId && !enrollment) reasons.push('enrollment_not_found');

    if (session) {
      const sessionEnrollmentId = String(session.enrollmentId || '').trim();
      const sessionParentId = String(session.parentId || '').trim();
      const sessionTeacherId = String(session.teacherId || '').trim();
      if (enrollmentId && sessionEnrollmentId && enrollmentId !== sessionEnrollmentId) {
        reasons.push('enrollment_mismatch_with_session');
      }
      if (parentId && sessionParentId && parentId !== sessionParentId) {
        reasons.push('parent_mismatch_with_session');
      }
      if (teacherId && sessionTeacherId && teacherId !== sessionTeacherId) {
        reasons.push('teacher_mismatch_with_session');
      }
    }

    if (enrollment) {
      const enrollmentParentId = String(enrollment.parentId || '').trim();
      const enrollmentTeacherId = String(enrollment.teacherId || '').trim();
      if (parentId && enrollmentParentId && parentId !== enrollmentParentId) {
        reasons.push('parent_mismatch_with_enrollment');
      }
      if (teacherId && enrollmentTeacherId && teacherId !== enrollmentTeacherId) {
        reasons.push('teacher_mismatch_with_enrollment');
      }
    }

    if (reasons.length === 0) return;
    linkageIssues.push({
      docType,
      docId: String(row.id || ''),
      sessionId: sessionId || null,
      enrollmentId: enrollmentId || null,
      parentId: parentId || null,
      teacherId: teacherId || null,
      reasons,
    });
  };

  charges.forEach((row) => collectLinkageIssues('billingCharge', row));
  earnings.forEach((row) => collectLinkageIssues('teacherEarning', row));

  const expectedSessionEnrollmentIds = Array.from(
    new Set(
      expectedCompletedSessions
        .map((session) => String(session.enrollmentId || '').trim())
        .filter(Boolean),
    ),
  );
  const expectedEnrollmentFetch = await fetchDocsByIds(
    db,
    'enrollments',
    expectedSessionEnrollmentIds,
    maxLinkedLookups,
  );
  if (expectedEnrollmentFetch.truncated) warnings.push('expected session enrollments lookup truncated');

  const missingEnrollmentReferenceSessions = expectedCompletedSessions
    .filter((session) => {
      const enrollmentId = String(session.enrollmentId || '').trim();
      if (!enrollmentId) return true;
      return !expectedEnrollmentFetch.map.get(enrollmentId)?.exists;
    })
    .map((session) => ({
      sessionId: String(session.id || ''),
      enrollmentId: String(session.enrollmentId || '').trim() || null,
      kidId: String(session.kidId || session.studentId || '').trim() || null,
      parentId: String(session.parentId || '').trim() || null,
      teacherId: String(session.teacherId || '').trim() || null,
      status: normalizeStatus(session.status) || null,
    }));

  const activeChargeSessionIds = new Set(
    charges
      .filter((charge) => isActiveBillingCharge(charge))
      .map((charge) => String(charge.sessionId || '').trim())
      .filter(Boolean),
  );
  const presentSessionsMissingBillingCharge: Array<Record<string, unknown>> = [];
  const presentSessionsWithZeroOrUnresolvedFee: Array<Record<string, unknown>> = [];

  completedSessions.forEach((session) => {
    const sessionId = String(session.id || '').trim();
    const enrollmentId = String(session.enrollmentId || '').trim();
    const enrollmentSnap = enrollmentId ? expectedEnrollmentFetch.map.get(enrollmentId) : null;
    const enrollment = enrollmentSnap?.exists
      ? ((enrollmentSnap.data() || {}) as Record<string, unknown>)
      : null;
    const diagnostic = diagnosePresentSessionBilling({
      sessionId,
      session,
      enrollment,
      enrollmentExists: enrollmentSnap?.exists === true,
      activeChargeExists: activeChargeSessionIds.has(sessionId),
    });
    if (!diagnostic) return;
    if (Number(diagnostic.fee) <= 0) presentSessionsWithZeroOrUnresolvedFee.push(diagnostic);
    if (diagnostic.activeChargeExists !== true) presentSessionsMissingBillingCharge.push(diagnostic);
  });

  const teacherMonthlyRollupMismatches: Array<Record<string, unknown>> = [];
  const staleTeacherMonthlyRollups: Array<Record<string, unknown>> = [];
  if (monthKey) {
    const expectedByTeacher = new Map<
      string,
      {
        totalEarnings: number;
        pendingEarnings: number;
        totalSessions: number;
        sessionsCompleted: number;
        latestEventAtMs: number | null;
      }
    >();

    earnings.forEach((earning) => {
      const status = normalizeStatus(earning.status);
      if (status === 'void') return;
      const teacherId = String(earning.teacherId || '').trim();
      if (!teacherId) return;
      const amount = Math.max(normalizeAmount(earning.amount), 0);
      const paidAmount = resolveTeacherEarningPaidAmount(earning, amount);
      const pendingAmount = Math.max(amount - paidAmount, 0);
      const source = normalizeStatus(earning.source);
      const isSessionLinked = source === 'session_present_completed' || Boolean(String(earning.sessionId || '').trim());
      const row = expectedByTeacher.get(teacherId) || {
        totalEarnings: 0,
        pendingEarnings: 0,
        totalSessions: 0,
        sessionsCompleted: 0,
        latestEventAtMs: null,
      };
      row.totalEarnings += amount;
      row.pendingEarnings += pendingAmount;
      if (isSessionLinked) {
        row.totalSessions += 1;
        row.sessionsCompleted += 1;
      }
      const eventTime =
        toDate(earning.earnedAt || earning.updatedAt || earning.createdAt)?.getTime() || null;
      if (eventTime && (!row.latestEventAtMs || eventTime > row.latestEventAtMs)) {
        row.latestEventAtMs = eventTime;
      }
      expectedByTeacher.set(teacherId, row);
    });

    const teacherIds = Array.from(expectedByTeacher.keys());
    for (const teacherId of teacherIds) {
      const rollupSnap = await db
        .collection('teachers')
        .doc(teacherId)
        .collection('earnings')
        .doc(monthKey)
        .get();

      const expected = expectedByTeacher.get(teacherId)!;
      const actual = rollupSnap.exists ? ((rollupSnap.data() || {}) as Record<string, unknown>) : {};
      const actualTotal = normalizeAmount(actual.totalEarnings);
      const actualPending = normalizeAmount(actual.pendingEarnings);
      const actualSessions = normalizeAmount(actual.totalSessions || actual.sessionsCompleted);
      const actualCompleted = normalizeAmount(actual.sessionsCompleted || actual.totalSessions);
      const actualRollupUpdatedAtMs = toDate(actual.updatedAt)?.getTime() || null;

      const totalDelta = Math.round((actualTotal - expected.totalEarnings) * 100) / 100;
      const pendingDelta = Math.round((actualPending - expected.pendingEarnings) * 100) / 100;
      const sessionsDelta = actualSessions - expected.totalSessions;
      const completedDelta = actualCompleted - expected.sessionsCompleted;

      if (
        Math.abs(totalDelta) > 0.01 ||
        Math.abs(pendingDelta) > 0.01 ||
        Math.abs(sessionsDelta) > 0 ||
        Math.abs(completedDelta) > 0
      ) {
        teacherMonthlyRollupMismatches.push({
          teacherId,
          monthKey,
          rollupDocExists: rollupSnap.exists,
          expected: {
            totalEarnings: Math.round(expected.totalEarnings),
            pendingEarnings: Math.round(expected.pendingEarnings),
            totalSessions: expected.totalSessions,
            sessionsCompleted: expected.sessionsCompleted,
          },
          actual: {
            totalEarnings: Math.round(actualTotal),
            pendingEarnings: Math.round(actualPending),
            totalSessions: actualSessions,
            sessionsCompleted: actualCompleted,
          },
          deltas: {
            totalEarnings: totalDelta,
            pendingEarnings: pendingDelta,
            totalSessions: sessionsDelta,
            sessionsCompleted: completedDelta,
          },
        });
      }

      if (
        rollupSnap.exists &&
        expected.latestEventAtMs &&
        actualRollupUpdatedAtMs &&
        actualRollupUpdatedAtMs + 5 * 60 * 1000 < expected.latestEventAtMs
      ) {
        staleTeacherMonthlyRollups.push({
          teacherId,
          monthKey,
          latestEventAtMs: expected.latestEventAtMs,
          rollupUpdatedAtMs: actualRollupUpdatedAtMs,
          lagMs: expected.latestEventAtMs - actualRollupUpdatedAtMs,
        });
      }
    }
  }

  const parentMonthlyReadModelMismatchAgainstCharges = monthKey
    ? findParentMonthlyReadModelMismatches({
        monthKey,
        charges,
        sessionsById: Object.fromEntries(linkedSessionMap.entries()),
        readModels: parentReadModelsSnap.docs.map((docSnap) => docSnap.data() || {}),
      })
    : [];

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    scope: {
      monthKey: monthKey || 'all_time_scanned',
      sampleLimit,
      maxDocsPerCollection,
      maxLinkedLookups,
    },
    counts: {
      sessionsRevenueRepairRequired: repairSessions.length,
      completedSessionsMissingBillingCharge: missingChargeSessions.length,
      completedSessionsMissingTeacherEarning: missingEarningSessions.length,
      completedSessionsMissingFinancialWithoutValidSuppression:
        completedSessionsMissingFinancialWithoutValidSuppression.length,
      billingChargesMissingSession: chargesMissingSession.length,
      teacherEarningsMissingSession: earningsMissingSession.length,
      duplicateLookingPayments: paymentDuplicateGroups.reduce((sum, group) => sum + group.count, 0),
      duplicateLookingPaymentGroups: paymentDuplicateGroups.length,
      duplicateLookingPayouts: payoutDuplicateGroups.reduce((sum, group) => sum + group.count, 0),
      duplicateLookingPayoutGroups: payoutDuplicateGroups.length,
      financiallyLinkedSessionsInconsistentStatus: inconsistentStatusSessions.length,
      financeLinkageIssues: linkageIssues.length,
      completedSessionsWithUnresolvedEnrollment: missingEnrollmentReferenceSessions.length,
      teacherMonthlyRollupMismatches: teacherMonthlyRollupMismatches.length,
      staleTeacherMonthlyRollups: staleTeacherMonthlyRollups.length,
      presentSessionsMissingBillingCharge: presentSessionsMissingBillingCharge.length,
      billingChargeServiceMonthMismatch: billingChargeServiceMonthMismatch.length,
      duplicateActiveBillingChargesBySession: duplicateActiveBillingChargesBySession.length,
      billingChargesWithUnresolvedServiceDate: billingChargesWithUnresolvedServiceDate.length,
      billingChargesUsingNonCanonicalLegacyDate: billingChargesUsingNonCanonicalLegacyDate.length,
      presentSessionsWithZeroOrUnresolvedFee: presentSessionsWithZeroOrUnresolvedFee.length,
      parentMonthlyReadModelMismatchAgainstCharges: parentMonthlyReadModelMismatchAgainstCharges.length,
    },
    samples: {
      sessionsRevenueRepairRequired: sampleRows(
        repairSessions.map((row) => ({
          sessionId: String(row.id || ''),
          date: row.date || null,
          status: row.status || null,
          revenueRepairReason: row.revenueRepairReason || null,
          revenueRepairDetectedAt: row.revenueRepairDetectedAt || null,
          revenueAccrued: row.revenueAccrued === true,
        })),
        sampleLimit,
      ),
      completedSessionsMissingBillingCharge: sampleRows(missingChargeSessions, sampleLimit),
      completedSessionsMissingTeacherEarning: sampleRows(missingEarningSessions, sampleLimit),
      completedSessionsMissingFinancialWithoutValidSuppression: sampleRows(
        completedSessionsMissingFinancialWithoutValidSuppression,
        sampleLimit,
      ),
      billingChargesMissingSession: sampleRows(chargesMissingSession, sampleLimit),
      teacherEarningsMissingSession: sampleRows(earningsMissingSession, sampleLimit),
      duplicateLookingPayments: sampleRows(paymentDuplicateGroups, sampleLimit),
      duplicateLookingPayouts: sampleRows(payoutDuplicateGroups, sampleLimit),
      financiallyLinkedSessionsInconsistentStatus: sampleRows(inconsistentStatusSessions, sampleLimit),
      financeLinkageIssues: sampleRows(linkageIssues, sampleLimit),
      completedSessionsWithUnresolvedEnrollment: sampleRows(
        missingEnrollmentReferenceSessions,
        sampleLimit,
      ),
      teacherMonthlyRollupMismatches: sampleRows(teacherMonthlyRollupMismatches, sampleLimit),
      staleTeacherMonthlyRollups: sampleRows(staleTeacherMonthlyRollups, sampleLimit),
      presentSessionsMissingBillingCharge: sampleRows(presentSessionsMissingBillingCharge, sampleLimit),
      billingChargeServiceMonthMismatch: sampleRows(billingChargeServiceMonthMismatch, sampleLimit),
      duplicateActiveBillingChargesBySession: sampleRows(duplicateActiveBillingChargesBySession, sampleLimit),
      billingChargesWithUnresolvedServiceDate: sampleRows(billingChargesWithUnresolvedServiceDate, sampleLimit),
      billingChargesUsingNonCanonicalLegacyDate: sampleRows(billingChargesUsingNonCanonicalLegacyDate, sampleLimit),
      presentSessionsWithZeroOrUnresolvedFee: sampleRows(presentSessionsWithZeroOrUnresolvedFee, sampleLimit),
      parentMonthlyReadModelMismatchAgainstCharges: sampleRows(parentMonthlyReadModelMismatchAgainstCharges, sampleLimit),
    },
    warnings,
  };
}

async function persistFinanceReconciliationReport(
  reportPayload: Record<string, unknown>,
  meta: ReconciliationPersistMeta,
): Promise<{ reportId: string; reportPath: string }> {
  const db = admin.firestore();
  const warnings = Array.isArray(reportPayload.warnings) ? reportPayload.warnings : [];
  const counts =
    reportPayload.counts && typeof reportPayload.counts === 'object' ?
      (reportPayload.counts as Record<string, unknown>) :
      {};

  const reportRef = db
    .collection('adminStats')
    .doc('financeReconciliationReports')
    .collection('runs')
    .doc();

  await reportRef.set(
    {
      ...reportPayload,
      triggerType: meta.triggerType,
      runStatus: 'success',
      warningState: warnings.length > 0 ? 'warnings_present' : 'clean',
      warningCount: warnings.length,
      summaryCounts: counts,
      createdBy: meta.createdByUid || null,
      scheduleLabel: meta.scheduleLabel || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedAtServer: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: false },
  );

  return {
    reportId: reportRef.id,
    reportPath: reportRef.path,
  };
}

async function persistFinanceReconciliationFailure(
  error: unknown,
  options: ReconciliationRunOptions,
  meta: ReconciliationPersistMeta,
): Promise<void> {
  const db = admin.firestore();
  const reportRef = db
    .collection('adminStats')
    .doc('financeReconciliationReports')
    .collection('runs')
    .doc();

  const errorMessage = error instanceof Error ? error.message : String(error);
  await reportRef.set(
    {
      ok: false,
      generatedAt: new Date().toISOString(),
      scope: {
        monthKey: options.monthKey || 'all_time_scanned',
        sampleLimit: options.sampleLimit,
        maxDocsPerCollection: options.maxDocsPerCollection,
        maxLinkedLookups: options.maxLinkedLookups,
      },
      counts: {},
      samples: {},
      warnings: [`run_failed:${errorMessage}`],
      triggerType: meta.triggerType,
      runStatus: 'failed',
      warningState: 'failed',
      warningCount: 1,
      summaryCounts: {},
      createdBy: meta.createdByUid || null,
      scheduleLabel: meta.scheduleLabel || null,
      errorMessage,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedAtServer: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: false },
  );
}

export const runFinanceReconciliationAudit = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const options: ReconciliationRunOptions = {
      monthKey: normalizeMonthKey(request.data?.monthKey),
      sampleLimit: toInt(request.data?.sampleLimit, 20, 5, 100),
      maxDocsPerCollection: toInt(request.data?.maxDocsPerCollection, 5000, 500, 20000),
      maxLinkedLookups: toInt(request.data?.maxLinkedLookups, 7000, 500, 25000),
    };

    const reportPayload = await buildFinanceReconciliationReport(options);
    try {
      const persisted = await persistFinanceReconciliationReport(reportPayload, {
        triggerType: 'manual',
        createdByUid: request.auth?.uid || null,
      });
      return {
        ...reportPayload,
        ...persisted,
      };
    } catch (err) {
      const warnings = Array.isArray(reportPayload.warnings) ? reportPayload.warnings : [];
      warnings.push(`report_persist_failed:${err instanceof Error ? err.message : String(err)}`);
      reportPayload.warnings = warnings;
      return reportPayload;
    }
  },
);

export const runFinanceReconciliationAuditDaily = onSchedule(
  {
    schedule: '15 2 * * *',
    timeZone: 'Asia/Kolkata',
    region: REGION,
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  async () => {
    const options: ReconciliationRunOptions = {
      monthKey: monthKeyNowIST(),
      sampleLimit: 20,
      maxDocsPerCollection: 5000,
      maxLinkedLookups: 7000,
    };

    try {
      const reportPayload = await buildFinanceReconciliationReport(options);
      await persistFinanceReconciliationReport(reportPayload, {
        triggerType: 'scheduled',
        scheduleLabel: 'daily_0215_ist',
      });
    } catch (error) {
      await persistFinanceReconciliationFailure(error, options, {
        triggerType: 'scheduled',
        scheduleLabel: 'daily_0215_ist',
      });
      throw error;
    }
  },
);
