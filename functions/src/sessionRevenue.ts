import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { normalizeFinancialStatus, normalizeLowerStatus } from './helpers/status';
import { resolveCanonicalServiceDate } from './helpers/serviceDate';
import {
  resolveRevenueAccrualLedgerRepairReason,
  shouldPersistRevenueRepairMarker,
} from './helpers/revenueAccrualSafety';
import {
  buildSessionFinancialTermsSnapshot,
  hasCompleteSessionFinancialTermsSnapshot,
  resolveSessionBillingRate,
  resolveSessionFinancialCurrency,
  resolveSessionTeacherPayRate,
} from './helpers/sessionFinancialRates';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;

const ACTIVE_LIKE = new Set([
  'trial',
  'active',
  'paused',
  'pending_teacher',
  'pending_payment',
  'enrolled',
  'current',
  'ongoing',
]);

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof (value as { toDate?: unknown })?.toDate === 'function') {
    const parsed = (value as { toDate: () => unknown }).toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = new Date(`${value}T00:00:00+05:30`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function monthKeyFromTimestampIST(value: unknown): string | null {
  const baseDate = toDate(value);
  if (!baseDate) return null;
  const istMs = baseDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function toMillis(value: unknown): number | null {
  const date = toDate(value);
  return date ? date.getTime() : null;
}

function normalizeStatus(value: unknown): string {
  return normalizeLowerStatus(value);
}

function normalizeChargeStatus(value: unknown): string {
  return normalizeFinancialStatus(value);
}

function resolveAttendanceEntryStatus(entry: unknown): string | null {
  if (typeof entry === 'string') return entry.trim().toLowerCase();
  if (entry && typeof entry === 'object' && typeof (entry as Record<string, unknown>).status === 'string') {
    return String((entry as Record<string, unknown>).status).trim().toLowerCase();
  }
  return null;
}

function isBillableAttendance(status: string | null): boolean {
  return status === 'present';
}

function resolveKidId(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  const direct = String(data.kidId || data.studentId || '').trim();
  if (direct) return direct;
  if (Array.isArray(data.kidIds) && data.kidIds.length > 0) {
    const first = String(data.kidIds[0] || '').trim();
    return first || null;
  }
  return null;
}

function resolveBillableKidId(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  const attendance = data.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return null;

  const sessionKidIds = new Set<string>([
    String(data.kidId || '').trim(),
    String(data.studentId || '').trim(),
    ...(Array.isArray(data.kidIds) ? data.kidIds.map((id) => String(id || '').trim()) : []),
  ].filter(Boolean));

  let fallback: string | null = null;
  for (const [rawKidId, entry] of Object.entries(attendance as Record<string, unknown>)) {
    const kidId = String(rawKidId || '').trim();
    if (!kidId || !isBillableAttendance(resolveAttendanceEntryStatus(entry))) continue;
    if (!fallback) fallback = kidId;
    if (sessionKidIds.size === 0 || sessionKidIds.has(kidId)) return kidId;
  }
  return fallback;
}

function isSessionBillableByAttendance(
  session: Record<string, unknown> | null | undefined,
  kidId: string | null,
): boolean {
  if (!session) return false;
  const attendance = session.attendance;
  if (attendance && typeof attendance === 'object' && !Array.isArray(attendance)) {
    const entries = Object.values(attendance as Record<string, unknown>);
    const hasTrackedStatuses = entries.some((entry) => Boolean(resolveAttendanceEntryStatus(entry)));
    if (hasTrackedStatuses) {
      return entries.some((entry) => isBillableAttendance(resolveAttendanceEntryStatus(entry)));
    }
  }
  if (!kidId || !attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return false;
  return isBillableAttendance(
    resolveAttendanceEntryStatus((attendance as Record<string, unknown>)[kidId]),
  );
}

function normalizeTeacherId(value: unknown): string | null {
  const raw = String(value || '').trim();
  return raw || null;
}

function isSessionRevenueSuppressed(session: Record<string, unknown>): boolean {
  return session.revenueSuppressed === true;
}

function revenueMonthlyRef(db: admin.firestore.Firestore, monthKey: string) {
  return db.collection('adminStats').doc('revenueMonthly').collection('months').doc(monthKey);
}

function normalizeEnrollmentLifecycleStatus(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'active';
  return raw === 'canceled' ? 'cancelled' : raw;
}

function resolveEnrollmentKidIds(enrollment: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    const id = String(value || '').trim();
    if (id) ids.add(id);
  };
  add(enrollment.kidId);
  add(enrollment.studentId);
  if (Array.isArray(enrollment.kidIds)) enrollment.kidIds.forEach(add);
  return Array.from(ids);
}

const ENROLLMENT_STATUS_PRIORITY: Record<string, number> = {
  current: 100,
  active: 95,
  enrolled: 90,
  ongoing: 88,
  trial: 84,
  pending_teacher: 80,
  pending_payment: 78,
  paused: 70,
};

function scoreEnrollmentCandidate(
  enrollment: Record<string, unknown>,
  kidId: string,
): { score: number; recencyMs: number } {
  const status = normalizeEnrollmentLifecycleStatus(enrollment.status);
  const statusScore = ENROLLMENT_STATUS_PRIORITY[status] ?? (ACTIVE_LIKE.has(status) ? 40 : 0);
  const enrollmentKidIds = resolveEnrollmentKidIds(enrollment);
  const directKidMatch = String(enrollment.kidId || '').trim() === kidId ? 6 : 0;
  const studentIdMatch = String(enrollment.studentId || '').trim() === kidId ? 4 : 0;
  const kidArrayMatch = enrollmentKidIds.includes(kidId) ? 2 : 0;
  const recencyMs =
    toMillis(enrollment.updatedAt) ||
    toMillis(enrollment.enrollmentDate) ||
    toMillis(enrollment.createdAt) ||
    0;
  return { score: statusScore + directKidMatch + studentIdMatch + kidArrayMatch, recencyMs };
}

async function resolveEnrollmentId(
  db: admin.firestore.Firestore,
  session: Record<string, unknown>,
  preferredKidId?: string | null,
): Promise<string | null> {
  const direct = String(session.enrollmentId || '').trim();
  if (direct) return direct;

  const kidId = String(preferredKidId || '').trim() || resolveKidId(session);
  const courseId = String(session.courseId || '').trim();
  if (!kidId || !courseId) return null;

  const statusList = Array.from(ACTIVE_LIKE);
  const candidates = new Map<string, admin.firestore.QueryDocumentSnapshot>();

  const runCandidateQueries = async (withStatusFilter: boolean): Promise<boolean> => {
    let queryFailed = false;
    const runQuery = async (source: string, baseQuery: admin.firestore.Query) => {
      try {
        const queryRef = withStatusFilter ? baseQuery.where('status', 'in', statusList) : baseQuery;
        const snap = await queryRef.limit(10).get();
        snap.docs.forEach((docSnap) => candidates.set(docSnap.id, docSnap));
      } catch (error) {
        queryFailed = true;
        logger.warn('sessionRevenue: enrollment candidate query failed', {
          kidId,
          courseId,
          source,
          withStatusFilter,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    await runQuery('kidId', db.collection('enrollments').where('kidId', '==', kidId).where('courseId', '==', courseId));
    await runQuery('studentId', db.collection('enrollments').where('studentId', '==', kidId).where('courseId', '==', courseId));
    await runQuery('kidIds', db.collection('enrollments').where('kidIds', 'array-contains', kidId).where('courseId', '==', courseId));
    return queryFailed;
  };

  const filteredFailed = await runCandidateQueries(true);
  if (candidates.size === 0 || filteredFailed) await runCandidateQueries(false);
  if (candidates.size === 0) return null;

  return Array.from(candidates.values())
    .map((docSnap) => ({ docSnap, ...scoreEnrollmentCandidate(docSnap.data() || {}, kidId) }))
    .sort((left, right) => right.score - left.score || right.recencyMs - left.recencyMs)[0]?.docSnap.id || null;
}

async function ensureSessionFinancialTermsSnapshot(args: {
  db: admin.firestore.Firestore;
  sessionRef: admin.firestore.DocumentReference;
  eventSession: Record<string, unknown>;
  preferredKidId: string | null;
  sessionId: string;
}): Promise<void> {
  const { db, sessionRef, eventSession, preferredKidId, sessionId } = args;
  if (hasCompleteSessionFinancialTermsSnapshot(eventSession)) return;

  const fallbackEnrollmentId = await resolveEnrollmentId(db, eventSession, preferredKidId);
  if (!fallbackEnrollmentId) return;

  await db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    if (!sessionSnap.exists) return;
    const session = (sessionSnap.data() || {}) as Record<string, unknown>;
    if (hasCompleteSessionFinancialTermsSnapshot(session)) return;

    const enrollmentId = String(session.enrollmentId || fallbackEnrollmentId).trim();
    if (!enrollmentId) return;
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
    const enrollmentSnap = await tx.get(enrollmentRef);
    if (!enrollmentSnap.exists) return;
    const enrollment = (enrollmentSnap.data() || {}) as Record<string, unknown>;
    const snapshot = buildSessionFinancialTermsSnapshot(session, enrollment);
    if (!snapshot) {
      logger.warn('sessionRevenue: financial terms snapshot skipped because billing rate is unresolved', {
        sessionId,
        enrollmentId,
      });
      return;
    }

    tx.set(
      sessionRef,
      {
        ...snapshot,
        financialTermsCapturedAt: FieldValue.serverTimestamp(),
        financialTermsSnapshotSource: 'session_creation_or_first_finance_touch',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

export const onSessionRevenueWrite = onDocumentWritten(
  {
    document: 'classSessions/{sessionId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;

    const beforeData = change.before.exists
      ? ((change.before.data() || {}) as Record<string, unknown>)
      : null;
    const afterData = (change.after.data() || {}) as Record<string, unknown>;
    const beforeStatus = normalizeStatus(beforeData?.status);
    const afterStatus = normalizeStatus(afterData.status);
    const beforeCompleted = beforeStatus === 'completed';
    const afterCompleted = afterStatus === 'completed';
    const beforeKidIdForCheck = resolveBillableKidId(beforeData) || resolveKidId(beforeData);
    const afterKidIdForCheck = resolveBillableKidId(afterData) || resolveKidId(afterData);
    const beforeBillable = beforeCompleted && isSessionBillableByAttendance(beforeData, beforeKidIdForCheck);
    const afterBillable = afterCompleted && isSessionBillableByAttendance(afterData, afterKidIdForCheck);
    const beforeAccrued = beforeData?.revenueAccrued === true;
    const afterAccrued = afterData.revenueAccrued === true;

    const db = admin.firestore();
    const sessionRef = change.after.ref;
    const sessionId = change.after.id;

    if (!hasCompleteSessionFinancialTermsSnapshot(afterData)) {
      await ensureSessionFinancialTermsSnapshot({
        db,
        sessionRef,
        eventSession: afterData,
        preferredKidId: afterKidIdForCheck,
        sessionId,
      });
    }

    if (!beforeCompleted && !afterCompleted) return;

    if (afterBillable) {
      const enrollmentId = await resolveEnrollmentId(db, afterData, afterKidIdForCheck);
      if (!enrollmentId) {
        logger.warn('Revenue accrual skipped: missing enrollmentId', { sessionId });
        return;
      }

      await db.runTransaction(async (tx) => {
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists) return;
        const session = (sessionSnap.data() || {}) as Record<string, unknown>;
        if (normalizeStatus(session.status) !== 'completed') return;

        const currentKidId = resolveBillableKidId(session) || resolveKidId(session);
        if (!isSessionBillableByAttendance(session, currentKidId)) return;
        if (isSessionRevenueSuppressed(session)) return;

        const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
        const enrollmentSnap = await tx.get(enrollmentRef);
        if (!enrollmentSnap.exists) {
          logger.warn('Revenue accrual skipped: enrollment not found', { sessionId, enrollmentId });
          return;
        }
        const enrollment = (enrollmentSnap.data() || {}) as Record<string, unknown>;

        const ratePerSession = resolveSessionBillingRate(session, enrollment);
        const teacherPayPerSession = resolveSessionTeacherPayRate(session, enrollment);
        const currency = resolveSessionFinancialCurrency(session, enrollment);
        const sessionTeacherId = normalizeTeacherId(session.teacherId);
        const beforeSessionTeacherId = normalizeTeacherId(beforeData?.teacherId);
        const resolvedTeacherId = sessionTeacherId || beforeSessionTeacherId || null;
        const canonicalService = resolveCanonicalServiceDate(session, null);
        const monthKey = canonicalService.serviceMonthKey;

        if (!monthKey) {
          logger.error('Revenue accrual skipped: session missing valid service date', {
            sessionId,
            startAt: session.startAt,
            date: session.date,
            endAt: session.endAt,
          });
          return;
        }

        if (!(ratePerSession > 0)) {
          const repairReason = 'zero_or_unresolved_session_fee';
          if (shouldPersistRevenueRepairMarker({
            existingRepairRequired: session.revenueRepairRequired,
            existingRepairReason: session.revenueRepairReason,
            nextRepairReason: repairReason,
          })) {
            tx.set(sessionRef, {
              revenueRepairRequired: true,
              revenueRepairDetectedAt: FieldValue.serverTimestamp(),
              revenueRepairReason: repairReason,
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          logger.warn('Revenue accrual failed closed: session fee is zero or unresolved', {
            sessionId,
            enrollmentId,
          });
          return;
        }

        const rollupRef = revenueMonthlyRef(db, monthKey);
        const alreadyAccrued = session.revenueAccrued === true;
        const chargeRef = db.collection('billingCharges').doc(sessionId);
        const chargeSnap = await tx.get(chargeRef);
        const chargeStatusRaw = chargeSnap.exists ? String(chargeSnap.data()?.status || '') : '';
        const chargeStatus = chargeStatusRaw.toLowerCase();
        const nextChargeStatus = !chargeSnap.exists ? 'open' : chargeStatus;
        const existingChargeData = (chargeSnap.data() || {}) as Record<string, unknown>;
        const existingChargeAmount = normalizeNumber(existingChargeData.amount, 0);
        const chargeAmount = chargeSnap.exists ? existingChargeAmount : ratePerSession;
        const preservedChargeMonthKey = String(existingChargeData.monthKey || '').trim();
        const chargeMonthKey = chargeSnap.exists && /^\d{4}-\d{2}$/.test(preservedChargeMonthKey)
          ? preservedChargeMonthKey
          : monthKey;

        const earningRef = db.collection('teacherEarnings').doc(sessionId);
        const earningSnap = await tx.get(earningRef);
        const earningStatusRaw = earningSnap.exists ? String(earningSnap.data()?.status || '') : '';
        const earningStatus = earningStatusRaw.toLowerCase();
        const nextEarningStatus = !earningSnap.exists ? 'unpaid' : earningStatus;
        const existingEarningData = (earningSnap.data() || {}) as Record<string, unknown>;
        const existingEarningAmount = normalizeNumber(existingEarningData.amount, 0);
        const teacherEarningAmount = earningSnap.exists ? existingEarningAmount : teacherPayPerSession;
        const preservedEarningMonthKey = String(existingEarningData.monthKey || '').trim();
        const earningMonthKey = earningSnap.exists && /^\d{4}-\d{2}$/.test(preservedEarningMonthKey)
          ? preservedEarningMonthKey
          : monthKey;

        const repairReason = resolveRevenueAccrualLedgerRepairReason({
          alreadyAccrued,
          chargeExists: chargeSnap.exists,
          chargeStatus,
          earningExists: earningSnap.exists,
          earningStatus,
        });
        if (repairReason) {
          if (shouldPersistRevenueRepairMarker({
            existingRepairRequired: session.revenueRepairRequired,
            existingRepairReason: session.revenueRepairReason,
            nextRepairReason: repairReason,
          })) {
            tx.set(sessionRef, {
              revenueRepairRequired: true,
              revenueRepairDetectedAt: FieldValue.serverTimestamp(),
              revenueRepairReason: repairReason,
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          logger.warn('Revenue accrual failed closed for ambiguous pre-existing ledger state', {
            sessionId,
            chargeExists: chargeSnap.exists,
            chargeStatus,
            earningExists: earningSnap.exists,
            earningStatus,
            repairReason,
          });
          return;
        }

        const chargePayload: Record<string, unknown> = {
          sessionId,
          enrollmentId,
          kidId: currentKidId,
          parentId: session.parentId || enrollment.parentId || null,
          teacherId: resolvedTeacherId,
          courseId: session.courseId || enrollment.courseId || null,
          amount: chargeAmount,
          currency,
          status: nextChargeStatus || 'open',
          source: 'session_present_completed',
          monthKey: chargeMonthKey,
          serviceDate: existingChargeData.serviceDate || canonicalService.serviceDate,
          serviceMonthKey: existingChargeData.serviceMonthKey || monthKey,
          billingRateSnapshot: ratePerSession,
          financialTermsSnapshotVersion: session.financialTermsSnapshotVersion || 1,
          ...(existingChargeData.sessionStartAt || !session.startAt ? {} : { sessionStartAt: session.startAt }),
          updatedAt: FieldValue.serverTimestamp(),
          ...(!chargeSnap.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
        };

        const earningPayload: Record<string, unknown> = {
          sessionId,
          enrollmentId,
          kidId: currentKidId,
          teacherId: resolvedTeacherId,
          parentId: session.parentId || enrollment.parentId || null,
          courseId: session.courseId || enrollment.courseId || null,
          amount: teacherEarningAmount,
          currency,
          status: nextEarningStatus || 'unpaid',
          source: 'session_present_completed',
          earnedAt: FieldValue.serverTimestamp(),
          monthKey: earningMonthKey,
          teacherPayRateSnapshot: teacherPayPerSession,
          financialTermsSnapshotVersion: session.financialTermsSnapshotVersion || 1,
          updatedAt: FieldValue.serverTimestamp(),
          ...(!earningSnap.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
        };

        if (!alreadyAccrued) {
          tx.set(sessionRef, {
            revenueAccrued: true,
            accruedAmount: ratePerSession,
            accruedMonthKey: monthKey,
            accruedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          tx.set(rollupRef, {
            expected: FieldValue.increment(ratePerSession),
            completedSessions: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          tx.set(enrollmentRef, {
            'metrics.completedSessionsCount': FieldValue.increment(1),
            'metrics.expectedRevenueAccrued': FieldValue.increment(ratePerSession),
            'metrics.lastCompletedAt': FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          tx.set(chargeRef, chargePayload, { merge: true });
          tx.set(earningRef, earningPayload, { merge: true });
        } else if (!chargeSnap.exists || !earningSnap.exists) {
          const missingReason = !chargeSnap.exists && !earningSnap.exists
            ? 'missing_charge_and_earning_docs'
            : !chargeSnap.exists
              ? 'missing_billing_charge_doc'
              : 'missing_teacher_earning_doc';
          if (shouldPersistRevenueRepairMarker({
            existingRepairRequired: session.revenueRepairRequired,
            existingRepairReason: session.revenueRepairReason,
            nextRepairReason: missingReason,
          })) {
            tx.set(sessionRef, {
              revenueRepairRequired: true,
              revenueRepairDetectedAt: FieldValue.serverTimestamp(),
              revenueRepairReason: missingReason,
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          logger.warn('Revenue ledger immutable after accrual; missing ledger docs were not auto-recreated', {
            sessionId,
            chargeExists: chargeSnap.exists,
            earningExists: earningSnap.exists,
            repairReason: missingReason,
          });
        }
      });
      return;
    }

    if ((beforeBillable || beforeAccrued || afterAccrued) && !afterBillable) {
      await db.runTransaction(async (tx) => {
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists) return;
        const session = (sessionSnap.data() || {}) as Record<string, unknown>;
        const currentStatus = normalizeStatus(session.status);
        const currentKidId = resolveBillableKidId(session) || resolveKidId(session);
        const stillBillable = currentStatus === 'completed' && isSessionBillableByAttendance(session, currentKidId);
        if (stillBillable) return;

        const accruedAmount = normalizeNumber(session.accruedAmount ?? beforeData?.accruedAmount, 0);
        const accruedMonthKey = String(
          session.accruedMonthKey ||
          beforeData?.accruedMonthKey ||
          monthKeyFromTimestampIST(session.date || session.startAt || session.endAt) ||
          '',
        ).trim();
        if (!accruedMonthKey) {
          logger.warn('Revenue reversal skipped: cannot determine month key', { sessionId });
          return;
        }

        const rollupRef = revenueMonthlyRef(db, accruedMonthKey);
        const chargeRef = db.collection('billingCharges').doc(sessionId);
        const earningRef = db.collection('teacherEarnings').doc(sessionId);
        const [chargeSnap, earningSnap] = await Promise.all([tx.get(chargeRef), tx.get(earningRef)]);

        if (session.revenueAccrued === true) {
          tx.set(rollupRef, {
            expected: FieldValue.increment(-accruedAmount),
            completedSessions: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          const enrollmentId = String(session.enrollmentId || beforeData?.enrollmentId || '').trim();
          if (enrollmentId) {
            tx.set(db.collection('enrollments').doc(enrollmentId), {
              'metrics.completedSessionsCount': FieldValue.increment(-1),
              'metrics.expectedRevenueAccrued': FieldValue.increment(-accruedAmount),
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }

          tx.set(sessionRef, {
            revenueAccrued: false,
            accruedAmount: FieldValue.delete(),
            accruedMonthKey: FieldValue.delete(),
            accruedAt: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }

        if (chargeSnap.exists) {
          const status = normalizeChargeStatus(chargeSnap.data()?.status);
          if (status && status !== 'paid' && status !== 'settled') {
            tx.set(chargeRef, {
              status: 'void',
              voidedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
        }

        if (earningSnap.exists) {
          const status = normalizeChargeStatus(earningSnap.data()?.status);
          const paidAmount = normalizeNumber(earningSnap.data()?.paidAmount, 0);
          if (status !== 'paid' && status !== 'void' && paidAmount <= 0) {
            tx.set(earningRef, {
              status: 'void',
              voidedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
        }
      });
    }
  },
);
