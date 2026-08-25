import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';
import { normalizeFinancialStatus, normalizeLowerStatus } from './helpers/status';
import { resolveCanonicalServiceDate } from './helpers/serviceDate';
import {
  resolveRevenueAccrualLedgerRepairReason,
  shouldPersistRevenueRepairMarker,
} from './helpers/revenueAccrualSafety';

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

function normalizeNumber(value: any, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
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

function monthKeyFromTimestampIST(value: any): string | null {
  const baseDate = toDate(value);
  if (!baseDate) return null;
  const istMs = baseDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function dayKeyFromTimestampIST(value: any): string | null {
  const baseDate = toDate(value);
  if (!baseDate) return null;
  const istMs = baseDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMillis(value: any): number | null {
  const d = toDate(value);
  return d ? d.getTime() : null;
}

function normalizeChargeStatus(value: any): string {
  return normalizeFinancialStatus(value);
}

function isSettledCharge(status: string): boolean {
  return status === 'paid' || status === 'settled';
}

function normalizeStatus(value: any): string {
  return normalizeLowerStatus(value);
}

function resolveAttendanceEntryStatus(entry: any): string | null {
  if (typeof entry === 'string') return entry.trim().toLowerCase();
  if (typeof entry?.status === 'string') return entry.status.trim().toLowerCase();
  return null;
}

function resolveAttendanceStatus(session: any, kidId: string | null): string | null {
  if (!kidId) return null;
  const attendance = session?.attendance || {};
  const entry = attendance?.[kidId];
  if (!entry) return null;
  return resolveAttendanceEntryStatus(entry);
}

function isBillableAttendance(status: string | null): boolean {
  return status === 'present';
}

function hasAnyBillableAttendance(session: any): boolean {
  const attendance = session?.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return false;
  return Object.values(attendance).some((entry: any) =>
    isBillableAttendance(resolveAttendanceEntryStatus(entry))
  );
}

function isSessionBillableByAttendance(session: any, kidId: string | null): boolean {
  const attendance = session?.attendance;
  if (attendance && typeof attendance === 'object' && !Array.isArray(attendance)) {
    const hasTrackedStatuses = Object.values(attendance).some(
      (entry: any) => Boolean(resolveAttendanceEntryStatus(entry))
    );
    if (hasTrackedStatuses) {
      return hasAnyBillableAttendance(session);
    }
  }

  const directStatus = resolveAttendanceStatus(session, kidId);
  return isBillableAttendance(directStatus);
}

function revenueMonthlyRef(db: admin.firestore.Firestore, monthKey: string) {
  return db
    .collection('adminStats')
    .doc('revenueMonthly')
    .collection('months')
    .doc(monthKey);
}

function teacherEarningsMonthlyRef(
  db: admin.firestore.Firestore,
  teacherId: string,
  monthKey: string
) {
  // Derived monthly read model.
  // Source-of-truth remains teacherEarnings event docs.
  return db.collection('teachers').doc(teacherId).collection('earnings').doc(monthKey);
}

function resolveKidId(data: any): string | null {
  return (
    data?.kidId ||
    data?.studentId ||
    (Array.isArray(data?.kidIds) ? data.kidIds[0] : null) ||
    null
  );
}

function resolveBillableKidId(data: any): string | null {
  const attendance = data?.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return null;

  const sessionKidIds = new Set<string>(
    [
      String(data?.kidId || '').trim(),
      String(data?.studentId || '').trim(),
      ...(Array.isArray(data?.kidIds)
        ? data.kidIds.map((kidId: unknown) => String(kidId || '').trim())
        : []),
    ].filter(Boolean)
  );

  let fallback: string | null = null;
  for (const [rawKidId, entry] of Object.entries(attendance)) {
    const kidId = String(rawKidId || '').trim();
    if (!kidId) continue;
    if (!isBillableAttendance(resolveAttendanceEntryStatus(entry))) continue;
    if (!fallback) fallback = kidId;
    if (sessionKidIds.size === 0 || sessionKidIds.has(kidId)) {
      return kidId;
    }
  }

  return fallback;
}

function normalizeTeacherId(value: any): string | null {
  const raw = String(value || '').trim();
  return raw ? raw : null;
}

function pickFirstPositiveNumber(...values: any[]): number {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function resolveFeeAmount(session: any, enrollment: any): number {
  return pickFirstPositiveNumber(
    enrollment?.ratePerSession,
    enrollment?.feePerSession,
    enrollment?.feePerClass,
    enrollment?.parentRate,
    enrollment?.parentClassRate,
    enrollment?.classFee,
    enrollment?.feeAmount,
    session?.feeAmount,
    session?.feePerClass,
    session?.feePerSession,
    session?.ratePerSession,
    session?.parentRate,
    session?.classFee,
  );
}

function resolveTeacherPay(session: any, enrollment: any): number {
  return pickFirstPositiveNumber(
    enrollment?.teacherPayPerSession,
    enrollment?.teacherRatePerSession,
    enrollment?.teacherPay,
    enrollment?.teacherRate,
    enrollment?.teacherFee,
    enrollment?.teacherClassRate,
    enrollment?.rateTeacher,
    enrollment?.payoutRate,
    session?.teacherPayPerSession,
    session?.teacherRatePerSession,
    session?.teacherPay,
    session?.teacherRate,
    session?.teacherFee,
    session?.teacherClassRate,
  );
}

function isSessionRevenueSuppressed(session: any): boolean {
  return session?.revenueSuppressed === true;
}

function resolveChargePaidAmount(data: any, amount: number): number {
  const paidRaw = Number(data?.paidAmount);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }
  const status = normalizeChargeStatus(data?.status);
  if (isSettledCharge(status)) {
    return Math.max(amount, 0);
  }
  return 0;
}

function normalizeCorrectionReason(value: any, fallback: string): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return fallback;
  return raw.slice(0, 300);
}

function normalizeEnrollmentLifecycleStatus(value: any): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

function resolveEnrollmentKidIds(enrollment: any): string[] {
  const out: string[] = [];
  const push = (value: unknown) => {
    const id = String(value || '').trim();
    if (id) out.push(id);
  };

  push(enrollment?.kidId);
  push(enrollment?.studentId);
  if (Array.isArray(enrollment?.kidIds)) {
    enrollment.kidIds.forEach((kidId: unknown) => push(kidId));
  }

  return Array.from(new Set(out));
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

function scoreEnrollmentCandidate(enrollmentData: any, kidId: string): { score: number; recencyMs: number } {
  const status = normalizeEnrollmentLifecycleStatus(enrollmentData?.status);
  const statusScore = ENROLLMENT_STATUS_PRIORITY[status] ?? (ACTIVE_LIKE.has(status) ? 40 : 0);
  const enrollmentKidIds = resolveEnrollmentKidIds(enrollmentData);
  const directKidMatch = String(enrollmentData?.kidId || '').trim() === kidId ? 6 : 0;
  const studentIdMatch = String(enrollmentData?.studentId || '').trim() === kidId ? 4 : 0;
  const kidArrayMatch = enrollmentKidIds.includes(kidId) ? 2 : 0;
  const recencyMs =
    toMillis(enrollmentData?.updatedAt) ||
    toMillis(enrollmentData?.enrollmentDate) ||
    toMillis(enrollmentData?.createdAt) ||
    0;

  return {
    score: statusScore + directKidMatch + studentIdMatch + kidArrayMatch,
    recencyMs,
  };
}

async function resolveEnrollmentId(
  db: admin.firestore.Firestore,
  session: any,
  preferredKidId?: string | null
): Promise<string | null> {
  if (session?.enrollmentId) return String(session.enrollmentId);

  const kidId = String(preferredKidId || '').trim() || resolveKidId(session);
  const courseId = session?.courseId || null;
  if (!kidId || !courseId) return null;

  const statusList = Array.from(ACTIVE_LIKE);
  const candidates = new Map<string, admin.firestore.QueryDocumentSnapshot>();

  const runCandidateQueries = async (withStatusFilter: boolean): Promise<boolean> => {
    let queryFailed = false;
    const runQuery = async (
      source: 'kidId' | 'studentId' | 'kidIds',
      baseQuery: admin.firestore.Query,
    ) => {
      try {
        const queryRef = withStatusFilter
          ? baseQuery.where('status', 'in', statusList)
          : baseQuery;
        const snap = await queryRef.limit(10).get();
        snap.docs.forEach((docSnap) => {
          candidates.set(docSnap.id, docSnap);
        });
      } catch (err) {
        queryFailed = true;
        logger.warn('resolveEnrollmentId: enrollment candidate query failed', {
          kidId,
          courseId,
          source,
          withStatusFilter,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    await runQuery(
      'kidId',
      db.collection('enrollments').where('kidId', '==', kidId).where('courseId', '==', courseId),
    );
    await runQuery(
      'studentId',
      db.collection('enrollments').where('studentId', '==', kidId).where('courseId', '==', courseId),
    );
    await runQuery(
      'kidIds',
      db.collection('enrollments').where('kidIds', 'array-contains', kidId).where('courseId', '==', courseId),
    );

    return queryFailed;
  };

  const statusQueriesFailed = await runCandidateQueries(true);
  if (candidates.size === 0 || statusQueriesFailed) {
    await runCandidateQueries(false);
  }

  if (candidates.size === 0) return null;

  const ranked = Array.from(candidates.values())
    .map((docSnap) => {
      const rank = scoreEnrollmentCandidate(docSnap.data() || {}, kidId);
      return { docSnap, score: rank.score, recencyMs: rank.recencyMs };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.recencyMs - a.recencyMs;
    });

  return ranked[0]?.docSnap.id || null;
}

export const onSessionRevenueWrite = onDocumentWritten(
  {
    document: 'classSessions/{sessionId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;

    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.data() || {};

    const beforeStatus = normalizeStatus(beforeData?.status);
    const afterStatus = normalizeStatus(afterData?.status);
    const beforeCompleted = beforeStatus === 'completed';
    const afterCompleted = afterStatus === 'completed';
    const beforeKidIdForCheck = resolveBillableKidId(beforeData) || resolveKidId(beforeData);
    const afterKidIdForCheck = resolveBillableKidId(afterData) || resolveKidId(afterData);
    const beforeBillable = beforeCompleted && isSessionBillableByAttendance(beforeData, beforeKidIdForCheck);
    const afterBillable = afterCompleted && isSessionBillableByAttendance(afterData, afterKidIdForCheck);
    const beforeAccrued = beforeData?.revenueAccrued === true;
    const afterAccrued = afterData?.revenueAccrued === true;

    if (!beforeCompleted && !afterCompleted) return;

    const db = admin.firestore();
    const sessionRef = change.after.ref;

    if (afterBillable) {
      const enrollmentId = await resolveEnrollmentId(db, afterData, afterKidIdForCheck);
      if (!enrollmentId) {
        logger.warn('Revenue accrual skipped: missing enrollmentId', {
          sessionId: change.after.id,
        });
        return;
      }

      await db.runTransaction(async (tx) => {
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists) return;

        const session = sessionSnap.data() || {};
        const currentStatus = normalizeStatus(session.status);
        if (currentStatus !== 'completed') return;

        const currentKidId = resolveBillableKidId(session) || resolveKidId(session);
        if (!isSessionBillableByAttendance(session, currentKidId)) return;
        if (isSessionRevenueSuppressed(session)) return;

        const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
        const enrollmentSnap = await tx.get(enrollmentRef);
        if (!enrollmentSnap.exists) {
          logger.warn('Revenue accrual skipped: enrollment not found', {
            sessionId: change.after.id,
            enrollmentId,
          });
          return;
        }

        const enrollment = enrollmentSnap.data() || {};
        const ratePerSession = resolveFeeAmount(session, enrollment);
        const teacherPayPerSession = resolveTeacherPay(session, enrollment);
        const currency = session.currency || enrollment.currency || 'INR';
        // Keep teacher attribution anchored to the session itself.
        // Do not fallback to mutable enrollment.teacherId, otherwise reassignments can
        // retroactively shift earnings ownership.
        const sessionTeacherId = normalizeTeacherId(session.teacherId);
        const beforeSessionTeacherId = normalizeTeacherId(beforeData?.teacherId);
        const resolvedTeacherId = sessionTeacherId || beforeSessionTeacherId || null;

        const canonicalService = resolveCanonicalServiceDate(session, null);
        const monthKey = canonicalService.serviceMonthKey;

        if (!monthKey) {
          logger.error('Revenue accrual skipped: session missing valid date fields', {
            sessionId: change.after.id,
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
            tx.set(
              sessionRef,
              {
                revenueRepairRequired: true,
                revenueRepairDetectedAt: FieldValue.serverTimestamp(),
                revenueRepairReason: repairReason,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          logger.warn('Revenue accrual failed closed: session fee is zero or unresolved', {
            sessionId: change.after.id,
            enrollmentId,
            ratePerSession,
          });
          return;
        }

        const rollupRef = revenueMonthlyRef(db, monthKey);
        const alreadyAccrued = session.revenueAccrued === true;
        const sessionId = change.after.id;

        const chargeRef = db.collection('billingCharges').doc(sessionId);
        const chargeSnap = await tx.get(chargeRef);
        const chargeStatusRaw = chargeSnap.exists ? String(chargeSnap.data()?.status || '') : '';
        const chargeStatus = chargeStatusRaw.toLowerCase();
        const nextChargeStatus =
          !chargeSnap.exists ? 'open' : chargeStatus;
        const existingChargeData = (chargeSnap.data() || {}) as any;
        const existingChargeAmount = normalizeNumber(existingChargeData.amount, 0);
        const chargeAmount = chargeSnap.exists ? existingChargeAmount : ratePerSession;
        const preservedChargeMonthKey = String(existingChargeData.monthKey || '').trim();
        const chargeMonthKey = chargeSnap.exists && /^\d{4}-\d{2}$/.test(preservedChargeMonthKey)
          ? preservedChargeMonthKey
          : monthKey;

        const chargePayload: Record<string, any> = {
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
          ...(existingChargeData.sessionStartAt || !session.startAt ? {} : { sessionStartAt: session.startAt }),
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (!chargeSnap.exists) {
          chargePayload.createdAt = FieldValue.serverTimestamp();
        }

        const earningRef = db.collection('teacherEarnings').doc(sessionId);
        const earningSnap = await tx.get(earningRef);
        const earningStatusRaw = earningSnap.exists ? String(earningSnap.data()?.status || '') : '';
        const earningStatus = earningStatusRaw.toLowerCase();
        const nextEarningStatus =
          !earningSnap.exists ? 'unpaid' : earningStatus;
        const existingEarningData = (earningSnap.data() || {}) as any;
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
            tx.set(
              sessionRef,
              {
                revenueRepairRequired: true,
                revenueRepairDetectedAt: FieldValue.serverTimestamp(),
                revenueRepairReason: repairReason,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
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
        const earningPayload: Record<string, any> = {
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
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (!earningSnap.exists) {
          earningPayload.createdAt = FieldValue.serverTimestamp();
        }

        if (!alreadyAccrued) {
          tx.set(
            sessionRef,
            {
              revenueAccrued: true,
              accruedAmount: ratePerSession,
              accruedMonthKey: monthKey,
              accruedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          tx.set(
            rollupRef,
            {
              expected: FieldValue.increment(ratePerSession),
              completedSessions: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          tx.set(
            enrollmentRef,
            {
              'metrics.completedSessionsCount': FieldValue.increment(1),
              'metrics.expectedRevenueAccrued': FieldValue.increment(ratePerSession),
              'metrics.lastCompletedAt': FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          // Teacher rollups are recomputed from teacherEarnings docs by
          // onTeacherEarningsRollupWrite to avoid multi-writer drift.
          tx.set(chargeRef, chargePayload, { merge: true });
          tx.set(earningRef, earningPayload, { merge: true });
        } else if (!chargeSnap.exists || !earningSnap.exists) {
          const repairReason =
            !chargeSnap.exists && !earningSnap.exists
              ? 'missing_charge_and_earning_docs'
              : !chargeSnap.exists
                ? 'missing_billing_charge_doc'
                : 'missing_teacher_earning_doc';
          if (shouldPersistRevenueRepairMarker({
            existingRepairRequired: session.revenueRepairRequired,
            existingRepairReason: session.revenueRepairReason,
            nextRepairReason: repairReason,
          })) {
            tx.set(
              sessionRef,
              {
                revenueRepairRequired: true,
                revenueRepairDetectedAt: FieldValue.serverTimestamp(),
                revenueRepairReason: repairReason,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          logger.warn('Revenue ledger immutable after accrual; missing ledger docs were not auto-recreated', {
            sessionId,
            chargeExists: chargeSnap.exists,
            earningExists: earningSnap.exists,
            repairReason,
          });
        }
      });

      return;
    }

    if ((beforeBillable || beforeAccrued || afterAccrued) && !afterBillable) {
      await db.runTransaction(async (tx) => {
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists) return;

        const session = sessionSnap.data() || {};
        const currentStatus = normalizeStatus(session.status);
        const currentKidId = resolveBillableKidId(session) || resolveKidId(session);
        const stillBillable =
          currentStatus === 'completed' &&
          isSessionBillableByAttendance(session, currentKidId);
        if (stillBillable) return;

        const accruedAmount = normalizeNumber(
          session.accruedAmount ?? beforeData?.accruedAmount,
          0
        );
        const accruedMonthKey =
          (session.accruedMonthKey || beforeData?.accruedMonthKey) ??
          monthKeyFromTimestampIST(session.date || session.startAt || session.endAt);

        if (!accruedMonthKey) {
          logger.warn('Revenue reversal skipped: cannot determine month key', {
            sessionId: change.after.id,
            startAt: session.startAt,
            date: session.date,
            endAt: session.endAt,
          });
          return;
        }

        const rollupRef = revenueMonthlyRef(db, accruedMonthKey);
        const sessionId = change.after.id;
        const chargeRef = db.collection('billingCharges').doc(sessionId);
        const earningRef = db.collection('teacherEarnings').doc(sessionId);
        // Firestore transactions require every read to complete before the first write.
        const [chargeSnap, earningSnap] = await Promise.all([
          tx.get(chargeRef),
          tx.get(earningRef),
        ]);

        if (session.revenueAccrued === true) {
          tx.set(
            rollupRef,
            {
              expected: FieldValue.increment(-accruedAmount),
              completedSessions: FieldValue.increment(-1),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          const enrollmentId = session.enrollmentId || beforeData?.enrollmentId || null;
          if (enrollmentId) {
            const enrollmentRef = db.collection('enrollments').doc(String(enrollmentId));
            tx.set(
              enrollmentRef,
              {
                'metrics.completedSessionsCount': FieldValue.increment(-1),
                'metrics.expectedRevenueAccrued': FieldValue.increment(-accruedAmount),
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }

          tx.set(
            sessionRef,
            {
              revenueAccrued: false,
              accruedAmount: FieldValue.delete(),
              accruedMonthKey: FieldValue.delete(),
              accruedAt: FieldValue.delete(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        if (chargeSnap.exists) {
          const statusRaw = String(chargeSnap.data()?.status || '').toLowerCase();
          if (statusRaw && statusRaw !== 'paid' && statusRaw !== 'settled') {
            tx.set(
              chargeRef,
              {
                status: 'void',
                voidedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        }

        if (earningSnap.exists) {
          const statusRaw = String(earningSnap.data()?.status || '').toLowerCase();
          const paidAmount = normalizeNumber(earningSnap.data()?.paidAmount, 0);
          const isPaid = statusRaw === 'paid';
          const isVoid = statusRaw === 'void';
          const hasPayment = paidAmount > 0;
          if (!isPaid && !isVoid && !hasPayment) {
            tx.set(
              earningRef,
              {
                status: 'void',
                voidedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

          }
        }
      });
    }
  }
);

function normalizePaymentMethod(value: any): 'UPI' | 'bank_transfer' | 'online' {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'upi') return 'UPI';
  if (raw === 'bank_transfer' || raw === 'bank' || raw === 'transfer') return 'bank_transfer';
  if (raw === 'online') return 'online';
  throw new HttpsError('invalid-argument', 'Invalid payment method');
}

function toPaidAtTimestamp(value: any): Timestamp {
  const parsed = toDate(value);
  return Timestamp.fromDate(parsed || new Date());
}

function normalizeIdempotencyKey(value: any): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
}

function resolveTeacherEarningPaidAmount(data: any, amount: number): number {
  const paidRaw = Number(data?.paidAmount);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }
  const status = normalizeChargeStatus(data?.status);
  if (isSettledCharge(status)) {
    return Math.max(amount, 0);
  }
  return 0;
}

function isSessionLinkedTeacherEarning(data: any): boolean {
  const source = normalizeStatus(data?.source);
  if (source === 'session_present_completed') return true;
  return Boolean(String(data?.sessionId || '').trim());
}

function resolveTeacherEarningMonthKey(data: any): string | null {
  const monthRaw = String(data?.monthKey || '').trim();
  if (/^\d{4}-\d{2}$/.test(monthRaw)) return monthRaw;
  const ts = data?.earnedAt || data?.createdAt || data?.updatedAt || null;
  if (!ts) return null;
  return monthKeyFromTimestampIST(ts);
}

function isDemoTeacherEarningSource(value: any): boolean {
  const source = normalizeStatus(value);
  return source === 'demo_completed' || source === 'demo_enrolled_bonus';
}

interface TeacherMonthRollupTarget {
  teacherId: string;
  monthKey: string;
}

function toTeacherMonthRollupTarget(data: any): TeacherMonthRollupTarget | null {
  const teacherId = normalizeTeacherId(data?.teacherId);
  const monthKey = resolveTeacherEarningMonthKey(data);
  if (!teacherId || !monthKey) return null;
  return { teacherId, monthKey };
}

async function recomputeTeacherMonthlyRollup(
  db: admin.firestore.Firestore,
  teacherId: string,
  monthKey: string
): Promise<void> {
  // Authoritative ownership model:
  // 1) teacherEarnings docs are source-of-truth earning events.
  // 2) teachers/{teacherId}/earnings/{monthKey} is a derived monthly read model.
  // 3) Only this recompute path writes rollup totals/pending/session counts.
  const earningsSnap = await db
    .collection('teacherEarnings')
    .where('teacherId', '==', teacherId)
    .where('monthKey', '==', monthKey)
    .get();
  const payoutsSnap = await db
    .collection('teacherPayouts')
    .where('teacherId', '==', teacherId)
    .where('monthKey', '==', monthKey)
    .get();
  const activeEarningDocs = earningsSnap.docs.filter((docSnap) => {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    return data.archived !== true;
  });
  const activePayoutDocs = payoutsSnap.docs.filter((docSnap) => {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    return data.archived !== true;
  });

  let totalEarnings = 0;
  let pendingEarnings = 0;
  let totalSessions = 0;
  let sessionsCompleted = 0;
  let demoEarnings = 0;
  let demoCompletedCount = 0;
  let demoEnrollmentBonusCount = 0;

  type TeacherEarningCandidate = {
    id: string;
    data: any;
    status: string;
    source: string;
    sessionId: string;
    sortMs: number;
  };

  const standaloneCandidates: TeacherEarningCandidate[] = [];
  const sessionCandidates = new Map<string, TeacherEarningCandidate>();

  const pickPreferredSessionCandidate = (
    current: TeacherEarningCandidate,
    incoming: TeacherEarningCandidate
  ): TeacherEarningCandidate => {
    const currentCanonical = current.id === current.sessionId;
    const incomingCanonical = incoming.id === incoming.sessionId;
    if (currentCanonical !== incomingCanonical) {
      return incomingCanonical ? incoming : current;
    }

    if ((current.status === 'void') !== (incoming.status === 'void')) {
      return incoming.status === 'void' ? current : incoming;
    }

    return incoming.sortMs > current.sortMs ? incoming : current;
  };

  for (const docSnap of activeEarningDocs) {
    const earning = docSnap.data() || {};
    const status = normalizeChargeStatus(earning.status);
    const source = normalizeStatus(earning.source);
    const sessionId = String(earning.sessionId || '').trim();
    const sortMs =
      toMillis(earning.updatedAt) ||
      toMillis(earning.earnedAt) ||
      toMillis(earning.createdAt) ||
      0;
    const candidate: TeacherEarningCandidate = {
      id: docSnap.id,
      data: earning,
      status,
      source,
      sessionId,
      sortMs,
    };

    if (sessionId && isSessionLinkedTeacherEarning(earning)) {
      const existing = sessionCandidates.get(sessionId);
      if (!existing) {
        sessionCandidates.set(sessionId, candidate);
      } else {
        sessionCandidates.set(sessionId, pickPreferredSessionCandidate(existing, candidate));
      }
      continue;
    }

    standaloneCandidates.push(candidate);
  }

  const selectedCandidates = [
    ...standaloneCandidates,
    ...Array.from(sessionCandidates.values()),
  ].filter((candidate) => candidate.status !== 'void');

  for (const candidate of selectedCandidates) {
    const amount = Math.max(normalizeNumber(candidate.data.amount, 0), 0);
    const paidAmount = resolveTeacherEarningPaidAmount(candidate.data, amount);
    const pendingAmount = Math.max(amount - paidAmount, 0);

    totalEarnings += amount;
    pendingEarnings += pendingAmount;

    if (isSessionLinkedTeacherEarning(candidate.data)) {
      totalSessions += 1;
      sessionsCompleted += 1;
    }

    if (isDemoTeacherEarningSource(candidate.source)) {
      demoEarnings += amount;
      if (candidate.source === 'demo_completed') demoCompletedCount += 1;
      if (candidate.source === 'demo_enrolled_bonus') demoEnrollmentBonusCount += 1;
    }
  }

  const payments = activePayoutDocs
    .map((docSnap) => {
      const payout = docSnap.data() || {};
      const paidAtMs =
        toMillis(payout.paidAt) ||
        toMillis(payout.updatedAt) ||
        toMillis(payout.createdAt) ||
        0;
      return {
        id: docSnap.id,
        amount: Math.max(normalizeNumber(payout.amount, 0), 0),
        date: String(payout.date || '').trim() || dayKeyFromTimestampIST(payout.paidAt) || 'unknown',
        status: normalizeChargeStatus(payout.status) || 'completed',
        paidAtMs,
      };
    })
    .sort((a, b) => b.paidAtMs - a.paidAtMs)
    .slice(0, 5)
    .map(({ id, amount, date, status }) => ({ id, amount, date, status }));

  const rollupRef = teacherEarningsMonthlyRef(db, teacherId, monthKey);
  await rollupRef.set(
    {
      month: monthKey,
      totalEarnings,
      pendingEarnings,
      totalSessions,
      sessionsCompleted,
      demoEarnings,
      demoCompletedCount,
      demoEnrollmentBonusCount,
      payments,
      rollupSource: 'teacherEarnings_events_v1',
      rollupVersion: 1,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export const onTeacherEarningsRollupWrite = onDocumentWritten(
  {
    document: 'teacherEarnings/{earningId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.exists ? change.before.data() || {} : null;
    const afterData = change.after.exists ? change.after.data() || {} : null;

    const targets = new Map<string, TeacherMonthRollupTarget>();
    const beforeTarget = toTeacherMonthRollupTarget(beforeData);
    const afterTarget = toTeacherMonthRollupTarget(afterData);
    if (beforeTarget) targets.set(`${beforeTarget.teacherId}__${beforeTarget.monthKey}`, beforeTarget);
    if (afterTarget) targets.set(`${afterTarget.teacherId}__${afterTarget.monthKey}`, afterTarget);
    if (targets.size === 0) return;

    const db = admin.firestore();
    for (const target of targets.values()) {
      await recomputeTeacherMonthlyRollup(db, target.teacherId, target.monthKey);
    }
  }
);

export const recordPayment = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const enrollmentId = String(request.data?.enrollmentId || '').trim();
    if (!enrollmentId) throw new HttpsError('invalid-argument', 'enrollmentId is required');

    const amount = Number(request.data?.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      throw new HttpsError('invalid-argument', 'amount must be a non-zero number');
    }

    const method = normalizePaymentMethod(request.data?.method);
    const note = typeof request.data?.note === 'string' ? request.data.note.trim() : '';
    const paidAt = toPaidAtTimestamp(request.data?.paidAt);
    const monthKey = monthKeyFromTimestampIST(paidAt.toDate());
    if (!monthKey) {
      throw new HttpsError('internal', 'Failed to determine payment month');
    }
    const dateKey = dayKeyFromTimestampIST(paidAt.toDate());
    if (!dateKey) {
      throw new HttpsError('internal', 'Failed to determine payment date');
    }
    const idempotencyKey = normalizeIdempotencyKey(request.data?.idempotencyKey);
    if (!idempotencyKey) {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required');
    }

    const db = admin.firestore();
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
    const paymentDocId = `payment_${enrollmentId}_${monthKey}_${idempotencyKey}`.replace(/\//g, '_');
    const paymentRef = db.collection('payments').doc(paymentDocId);
    const rollupRef = revenueMonthlyRef(db, monthKey);
    const chargesQuery = db.collection('billingCharges').where('enrollmentId', '==', enrollmentId);

    const allocation = await db.runTransaction(async (tx) => {
      const existingPaymentSnap = await tx.get(paymentRef);
      if (existingPaymentSnap.exists) {
        const existing = existingPaymentSnap.data() || {};
        const existingEnrollmentId = String(existing.enrollmentId || '').trim();
        const existingMonthKey = String(existing.monthKey || '').trim();
        const existingAmount = normalizeNumber(existing.amount, Number.NaN);
        const existingMethod = String(existing.method || '').trim();
        const existingDate = String(existing.date || '').trim();

        if (
          (existingEnrollmentId && existingEnrollmentId !== enrollmentId) ||
          (existingMonthKey && existingMonthKey !== monthKey) ||
          (existingMethod && existingMethod !== method) ||
          (existingDate && existingDate !== dateKey) ||
          (Number.isFinite(existingAmount) && Math.abs(existingAmount - amount) > 0.01)
        ) {
          throw new HttpsError(
            'failed-precondition',
            'idempotencyKey already used for a different payment request',
          );
        }

        return {
          paymentId: paymentRef.id,
          monthKey: existingMonthKey || monthKey,
          appliedChargeIds: Array.isArray(existing.appliedChargeIds) ? existing.appliedChargeIds : [],
          appliedAmount: normalizeNumber(existing.appliedAmount, 0),
          unappliedAmount: normalizeNumber(existing.unappliedAmount, 0),
          idempotentReplay: true,
        };
      }

      const enrollmentSnap = await tx.get(enrollmentRef);
      if (!enrollmentSnap.exists) {
        throw new HttpsError('not-found', 'Enrollment not found');
      }

      const enrollment = enrollmentSnap.data() || {};
      const paymentDoc = {
        enrollmentId,
        kidId: resolveKidId(enrollment),
        parentId: enrollment.parentId || null,
        teacherId: enrollment.teacherId || null,
        courseId: enrollment.courseId || null,
        amount,
        currency: 'INR',
        paidAt,
        monthKey,
        date: dateKey,
        method,
        status: amount < 0 ? 'refunded' : 'completed',
        note: note || null,
        idempotencyKey,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: request.auth?.uid || null,
      };

      const chargesSnap = await tx.get(chargesQuery);
      const charges = chargesSnap.docs.map((doc) => ({
        id: doc.id,
        ref: doc.ref,
        data: doc.data() || {},
      }));

      let remaining = amount;
      const appliedChargeIds: string[] = [];
      const appliedAllocations: Array<{ chargeId: string; amount: number }> = [];

      if (remaining !== 0) {
        if (remaining > 0) {
          const openCharges = charges
            .filter((item) => {
              const status = normalizeChargeStatus(item.data.status);
              if (status === 'void') return false;
              const amountValue = normalizeNumber(item.data.amount, 0);
              const paidValue = normalizeNumber(item.data.paidAmount, 0);
              const effectivePaid = paidValue > 0 ? paidValue : isSettledCharge(status) ? amountValue : 0;
              return amountValue > 0 && effectivePaid < amountValue;
            })
            .sort((a, b) => {
              const aKey = toMillis(a.data.createdAt) ?? toMillis(a.data.updatedAt) ?? 0;
              const bKey = toMillis(b.data.createdAt) ?? toMillis(b.data.updatedAt) ?? 0;
              return aKey - bKey;
            });

          for (const charge of openCharges) {
            if (remaining <= 0) break;
            const amountValue = normalizeNumber(charge.data.amount, 0);
            if (amountValue <= 0) continue;
            const paidValue = normalizeNumber(charge.data.paidAmount, 0);
            const due = Math.max(amountValue - paidValue, 0);
            if (due <= 0) continue;

            const applyAmount = Math.min(remaining, due);
            const nextPaid = paidValue + applyAmount;
            remaining -= applyAmount;

            const updates: Record<string, any> = {
              paidAmount: nextPaid,
              updatedAt: FieldValue.serverTimestamp(),
              paymentIds: FieldValue.arrayUnion(paymentRef.id),
            };

            if (nextPaid >= amountValue - 0.01) {
              updates.status = 'paid';
              updates.paidAt = paidAt;
            } else {
              updates.status = 'partial';
              updates.paidAt = FieldValue.delete();
            }

            tx.set(charge.ref, updates, { merge: true });
            appliedChargeIds.push(charge.id);
            appliedAllocations.push({ chargeId: charge.id, amount: applyAmount });
          }
        } else {
          const paidCharges = charges
            .filter((item) => {
              const status = normalizeChargeStatus(item.data.status);
              if (status === 'void') return false;
              const amountValue = normalizeNumber(item.data.amount, 0);
              const paidValue = normalizeNumber(item.data.paidAmount, 0);
              const effectivePaid = paidValue > 0 ? paidValue : isSettledCharge(status) ? amountValue : 0;
              return amountValue > 0 && effectivePaid > 0;
            })
            .sort((a, b) => {
              const aKey =
                toMillis(a.data.paidAt) ?? toMillis(a.data.updatedAt) ?? toMillis(a.data.createdAt) ?? 0;
              const bKey =
                toMillis(b.data.paidAt) ?? toMillis(b.data.updatedAt) ?? toMillis(b.data.createdAt) ?? 0;
              return bKey - aKey;
            });

          for (const charge of paidCharges) {
            if (remaining >= 0) break;
            const amountValue = normalizeNumber(charge.data.amount, 0);
            if (amountValue <= 0) continue;
            const paidValue = normalizeNumber(charge.data.paidAmount, 0);
            const effectivePaid = paidValue > 0 ? paidValue : amountValue;
            if (effectivePaid <= 0) continue;

            const applyAmount = Math.min(Math.abs(remaining), effectivePaid);
            const nextPaid = effectivePaid - applyAmount;
            remaining += applyAmount;

            const updates: Record<string, any> = {
              paidAmount: nextPaid,
              updatedAt: FieldValue.serverTimestamp(),
              paymentIds: FieldValue.arrayUnion(paymentRef.id),
            };

            if (nextPaid <= 0.01) {
              updates.status = 'open';
              updates.paidAt = FieldValue.delete();
            } else if (nextPaid < amountValue - 0.01) {
              updates.status = 'partial';
              updates.paidAt = FieldValue.delete();
            } else {
              updates.status = 'paid';
              updates.paidAt = paidAt;
            }

            tx.set(charge.ref, updates, { merge: true });
            appliedChargeIds.push(charge.id);
            appliedAllocations.push({ chargeId: charge.id, amount: -applyAmount });
          }
        }
      }

      const appliedAmount = amount - remaining;
      tx.set(
        paymentRef,
        {
          ...paymentDoc,
          appliedChargeIds,
          appliedAllocations,
          appliedAmount,
          unappliedAmount: remaining,
        },
        { merge: true }
      );

      tx.set(
        rollupRef,
        {
          earned: FieldValue.increment(amount),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        paymentId: paymentRef.id,
        monthKey,
        appliedChargeIds,
        appliedAmount,
        unappliedAmount: remaining,
        idempotentReplay: false,
      };
    });

    return {
      ok: true,
      paymentId: allocation.paymentId || paymentRef.id,
      monthKey: allocation.monthKey || monthKey,
      appliedChargeIds: allocation.appliedChargeIds,
      appliedAmount: allocation.appliedAmount,
      unappliedAmount: allocation.unappliedAmount,
      idempotentReplay: allocation.idempotentReplay === true,
    };
  }
);

export const recordTeacherPayout = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const teacherId = String(request.data?.teacherId || '').trim();
    if (!teacherId) throw new HttpsError('invalid-argument', 'teacherId is required');

    const amount = Number(request.data?.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      throw new HttpsError('invalid-argument', 'amount must be a non-zero number');
    }

    const method = normalizePaymentMethod(request.data?.method);
    const note = typeof request.data?.note === 'string' ? request.data.note.trim() : '';
    const paidAt = toPaidAtTimestamp(request.data?.paidAt);
    const monthKey = monthKeyFromTimestampIST(paidAt.toDate());
    if (!monthKey) {
      throw new HttpsError('internal', 'Failed to determine payout month');
    }
    const dateKey = dayKeyFromTimestampIST(paidAt.toDate());
    if (!dateKey) {
      throw new HttpsError('internal', 'Failed to determine payout date');
    }
    const idempotencyKey = normalizeIdempotencyKey(request.data?.idempotencyKey);
    if (!idempotencyKey) {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required');
    }

    const db = admin.firestore();
    const payoutDocId = `payout_${teacherId}_${monthKey}_${idempotencyKey}`.replace(/\//g, '_');
    const payoutRef = db.collection('teacherPayouts').doc(payoutDocId);
    const earningsQuery = db
      .collection('teacherEarnings')
      .where('monthKey', '==', monthKey)
      .where('teacherId', '==', teacherId);

    const allocation = await db.runTransaction(async (tx) => {
      const existingPayoutSnap = await tx.get(payoutRef);
      if (existingPayoutSnap.exists) {
        const existing = existingPayoutSnap.data() || {};
        const existingTeacherId = String(existing.teacherId || '').trim();
        const existingMonthKey = String(existing.monthKey || '').trim();
        const existingAmount = normalizeNumber(existing.amount, Number.NaN);

        if (
          (existingTeacherId && existingTeacherId !== teacherId) ||
          (existingMonthKey && existingMonthKey !== monthKey) ||
          (Number.isFinite(existingAmount) && Math.abs(existingAmount - amount) > 0.01)
        ) {
          throw new HttpsError(
            'failed-precondition',
            'idempotencyKey already used for a different payout request',
          );
        }

        return {
          payoutId: payoutRef.id,
          monthKey: existingMonthKey || monthKey,
          appliedEarningIds: Array.isArray(existing.appliedEarningIds)
            ? existing.appliedEarningIds
            : [],
          appliedAmount: normalizeNumber(existing.appliedAmount, 0),
          unappliedAmount: normalizeNumber(existing.unappliedAmount, 0),
          idempotentReplay: true,
        };
      }

      const earningsSnap = await tx.get(earningsQuery);
      const earnings = earningsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ref: docSnap.ref,
        data: docSnap.data() || {},
      }));

      let remaining = amount;
      const appliedEarningIds: string[] = [];
      const appliedAllocations: Array<{ earningId: string; amount: number }> = [];
      if (remaining !== 0) {
        if (remaining > 0) {
          const openEarnings = earnings
            .filter((item) => {
              const status = normalizeChargeStatus(item.data.status);
              if (status === 'void') return false;
              const amountValue = normalizeNumber(item.data.amount, 0);
              const paidValue = normalizeNumber(item.data.paidAmount, 0);
              const effectivePaid = paidValue > 0 ? paidValue : isSettledCharge(status) ? amountValue : 0;
              return amountValue > 0 && effectivePaid < amountValue;
            })
            .sort((a, b) => {
              const aKey =
                toMillis(a.data.earnedAt) ??
                toMillis(a.data.createdAt) ??
                toMillis(a.data.updatedAt) ??
                0;
              const bKey =
                toMillis(b.data.earnedAt) ??
                toMillis(b.data.createdAt) ??
                toMillis(b.data.updatedAt) ??
                0;
              return aKey - bKey;
            });

          for (const earning of openEarnings) {
            if (remaining <= 0) break;

            const latestSnap = await tx.get(earning.ref);
            if (!latestSnap.exists) continue;
            const latest = latestSnap.data() || {};
            const latestTeacherId = String(latest.teacherId || '').trim();
            if (latestTeacherId !== teacherId) {
              logger.warn('recordTeacherPayout: skipped earning with mismatched teacherId', {
                payoutTeacherId: teacherId,
                earningId: earning.id,
                earningTeacherId: latestTeacherId || null,
              });
              continue;
            }

            const latestStatus = normalizeChargeStatus(latest.status);
            if (latestStatus === 'void') continue;
            const amountValue = normalizeNumber(latest.amount, 0);
            if (amountValue <= 0) continue;
            const paidValue = normalizeNumber(latest.paidAmount, 0);
            const due = Math.max(amountValue - paidValue, 0);
            if (due <= 0) continue;

            const applyAmount = Math.min(remaining, due);
            const nextPaid = paidValue + applyAmount;
            remaining -= applyAmount;

            const updates: Record<string, any> = {
              paidAmount: nextPaid,
              updatedAt: FieldValue.serverTimestamp(),
              payoutIds: FieldValue.arrayUnion(payoutRef.id),
            };

            if (nextPaid >= amountValue - 0.01) {
              updates.status = 'paid';
              updates.paidAt = paidAt;
            } else {
              updates.status = 'partial';
              updates.paidAt = FieldValue.delete();
            }

            tx.set(earning.ref, updates, { merge: true });
            appliedEarningIds.push(earning.id);
            appliedAllocations.push({ earningId: earning.id, amount: applyAmount });

          }
        } else {
          const paidEarnings = earnings
            .filter((item) => {
              const status = normalizeChargeStatus(item.data.status);
              if (status === 'void') return false;
              const amountValue = normalizeNumber(item.data.amount, 0);
              const paidValue = normalizeNumber(item.data.paidAmount, 0);
              const effectivePaid = paidValue > 0 ? paidValue : isSettledCharge(status) ? amountValue : 0;
              return amountValue > 0 && effectivePaid > 0;
            })
            .sort((a, b) => {
              const aKey =
                toMillis(a.data.paidAt) ??
                toMillis(a.data.updatedAt) ??
                toMillis(a.data.earnedAt) ??
                0;
              const bKey =
                toMillis(b.data.paidAt) ??
                toMillis(b.data.updatedAt) ??
                toMillis(b.data.earnedAt) ??
                0;
              return bKey - aKey;
            });

          for (const earning of paidEarnings) {
            if (remaining >= 0) break;

            const latestSnap = await tx.get(earning.ref);
            if (!latestSnap.exists) continue;
            const latest = latestSnap.data() || {};
            const latestTeacherId = String(latest.teacherId || '').trim();
            if (latestTeacherId !== teacherId) {
              logger.warn('recordTeacherPayout: skipped earning with mismatched teacherId', {
                payoutTeacherId: teacherId,
                earningId: earning.id,
                earningTeacherId: latestTeacherId || null,
              });
              continue;
            }

            const latestStatus = normalizeChargeStatus(latest.status);
            if (latestStatus === 'void') continue;
            const amountValue = normalizeNumber(latest.amount, 0);
            if (amountValue <= 0) continue;
            const paidValue = normalizeNumber(latest.paidAmount, 0);
            const effectivePaid = paidValue > 0 ? paidValue : amountValue;
            if (effectivePaid <= 0) continue;

            const applyAmount = Math.min(Math.abs(remaining), effectivePaid);
            const nextPaid = effectivePaid - applyAmount;
            remaining += applyAmount;

            const updates: Record<string, any> = {
              paidAmount: nextPaid,
              updatedAt: FieldValue.serverTimestamp(),
              payoutIds: FieldValue.arrayUnion(payoutRef.id),
            };

            if (nextPaid <= 0.01) {
              updates.status = 'unpaid';
              updates.paidAt = FieldValue.delete();
            } else if (nextPaid < amountValue - 0.01) {
              updates.status = 'partial';
              updates.paidAt = FieldValue.delete();
            } else {
              updates.status = 'paid';
              updates.paidAt = paidAt;
            }

            tx.set(earning.ref, updates, { merge: true });
            appliedEarningIds.push(earning.id);
            appliedAllocations.push({ earningId: earning.id, amount: -applyAmount });

          }
        }
      }

      const appliedAmount = amount - remaining;
      tx.set(
        payoutRef,
        {
          teacherId,
          amount,
          currency: 'INR',
          paidAt,
          monthKey,
          date: dateKey,
          method,
          status: amount < 0 ? 'refunded' : 'completed',
          note: note || null,
          idempotencyKey,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: request.auth?.uid || null,
          appliedEarningIds,
          appliedAllocations,
          appliedAmount,
          unappliedAmount: remaining,
        },
        { merge: true }
      );

      return {
        payoutId: payoutRef.id,
        monthKey,
        appliedEarningIds,
        appliedAmount,
        unappliedAmount: remaining,
        idempotentReplay: false,
      };
    });

    return {
      ok: true,
      payoutId: allocation.payoutId || payoutRef.id,
      monthKey: allocation.monthKey || monthKey,
      appliedEarningIds: allocation.appliedEarningIds,
      appliedAmount: allocation.appliedAmount,
      unappliedAmount: allocation.unappliedAmount,
      idempotentReplay: allocation.idempotentReplay === true,
    };
  }
);

export const voidTeacherOrphanEarnings = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const teacherId = String(request.data?.teacherId || '').trim();
    const monthKey = String(request.data?.monthKey || '').trim();
    const note =
      typeof request.data?.note === 'string'
        ? request.data.note.trim().slice(0, 300)
        : '';

    if (!teacherId) {
      throw new HttpsError('invalid-argument', 'teacherId is required');
    }
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      throw new HttpsError('invalid-argument', 'monthKey must be in YYYY-MM format');
    }

    const db = admin.firestore();
    const earningsQuery = db.collection('teacherEarnings').where('teacherId', '==', teacherId);
    const result = await db.runTransaction(async (tx) => {
      const earningsSnap = await tx.get(earningsQuery);
      const earnings = earningsSnap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ref: docSnap.ref,
          data: docSnap.data() || {},
        }))
        .filter((earning) => String(earning.data.teacherId || '').trim() === teacherId);

      const sessionIds = Array.from(
        new Set(
          earnings
            .map((earning) => String(earning.data.sessionId || '').trim())
            .filter(Boolean)
        )
      );
      const sessionSnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>();
      for (const sessionId of sessionIds) {
        const snap = await tx.get(db.collection('classSessions').doc(sessionId));
        sessionSnaps.set(sessionId, snap);
      }

      let orphanCount = 0;
      let voidedCount = 0;
      let skippedPaidCount = 0;
      let skippedAlreadyVoidCount = 0;
      const voidedIds: string[] = [];
      const skippedPaidIds: string[] = [];

      for (const earning of earnings) {
        const status = normalizeChargeStatus(earning.data.status);
        if (status === 'void') {
          skippedAlreadyVoidCount += 1;
          continue;
        }

        const sessionId = String(earning.data.sessionId || '').trim();
        if (!sessionId) {
          continue;
        }

        const sessionSnap = sessionSnaps.get(sessionId);
        const sessionData = sessionSnap?.exists ? sessionSnap.data() || {} : null;
        const sessionStatus = normalizeStatus(sessionData?.status);
        const earningKidId =
          String(
            earning.data.kidId || resolveKidId(sessionData) || ''
          ).trim() || null;
        const isBillable =
          Boolean(sessionSnap?.exists) &&
          sessionStatus === 'completed' &&
          isSessionBillableByAttendance(sessionData, earningKidId);

        if (isBillable) {
          continue;
        }

        orphanCount += 1;

        const amount = Math.max(normalizeNumber(earning.data.amount, 0), 0);
        const paidAmount = resolveTeacherEarningPaidAmount(earning.data, amount);
        if (paidAmount > 0 || status === 'paid') {
          skippedPaidCount += 1;
          skippedPaidIds.push(earning.id);
          continue;
        }

        tx.set(
          earning.ref,
          {
            status: 'void',
            voidedAt: FieldValue.serverTimestamp(),
            voidReason: note || 'Admin correction: orphan/invalid session earning',
            correctedBy: request.auth?.uid || null,
            correctedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        voidedCount += 1;
        voidedIds.push(earning.id);

      }

      return {
        checkedCount: earnings.length,
        orphanCount,
        voidedCount,
        skippedPaidCount,
        skippedAlreadyVoidCount,
        voidedIds,
        skippedPaidIds,
      };
    });

    logger.info('Admin voided orphan teacher earnings', {
      teacherId,
      monthKey,
      checkedCount: result.checkedCount,
      orphanCount: result.orphanCount,
      voidedCount: result.voidedCount,
      skippedPaidCount: result.skippedPaidCount,
      actorUid: request.auth?.uid || null,
    });

    return {
      ok: true,
      teacherId,
      monthKey,
      ...result,
    };
  }
);

export const adminVoidSessionCharge = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
    invoker: 'public',
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const sessionId = String(request.data?.sessionId || '').trim();
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required');
    }

    const note = normalizeCorrectionReason(
      request.data?.reason,
      'Admin correction: attendance/session charge voided'
    );

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const chargeRef = db.collection('billingCharges').doc(sessionId);
    const earningRef = db.collection('teacherEarnings').doc(sessionId);

    const result = await db.runTransaction(async (tx) => {
      const [sessionSnap, chargeSnap, earningSnap] = await Promise.all([
        tx.get(sessionRef),
        tx.get(chargeRef),
        tx.get(earningRef),
      ]);

      if (!sessionSnap.exists) {
        throw new HttpsError('not-found', 'Session not found');
      }

      const session = sessionSnap.data() || {};
      const chargeExists = chargeSnap.exists;
      const chargeData = chargeSnap.data() || {};
      const chargeStatus = normalizeChargeStatus(chargeData.status);
      const chargeAmount = Math.max(
        normalizeNumber(chargeData.amount ?? session.accruedAmount, 0),
        0
      );
      const chargePaidAmount = resolveChargePaidAmount(chargeData, chargeAmount);

      const earningExists = earningSnap.exists;
      const earningData = earningSnap.data() || {};
      const earningStatus = normalizeChargeStatus(earningData.status);
      const earningAmount = Math.max(normalizeNumber(earningData.amount, 0), 0);
      const earningPaidAmount = resolveTeacherEarningPaidAmount(earningData, earningAmount);

      if (!chargeExists && !earningExists && session.revenueAccrued !== true) {
        throw new HttpsError('not-found', 'No session-linked charge or earning found');
      }

      if (chargeExists && chargeStatus !== 'void' && chargePaidAmount > 0) {
        throw new HttpsError(
          'failed-precondition',
          'This charge already has payment applied. Reverse payment allocation first.'
        );
      }

      if (earningExists && earningStatus !== 'void' && earningPaidAmount > 0) {
        throw new HttpsError(
          'failed-precondition',
          'This teacher earning is already paid. Reverse payout allocation first.'
        );
      }

      let chargeVoided = false;
      if (chargeExists && chargeStatus !== 'void') {
        tx.set(
          chargeRef,
          {
            status: 'void',
            voidedAt: FieldValue.serverTimestamp(),
            voidReason: note,
            correctedBy: request.auth?.uid || null,
            correctedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        chargeVoided = true;
      }

      let earningVoided = false;
      if (earningExists && earningStatus !== 'void') {
        tx.set(
          earningRef,
          {
            status: 'void',
            voidedAt: FieldValue.serverTimestamp(),
            voidReason: note,
            correctedBy: request.auth?.uid || null,
            correctedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        earningVoided = true;
      }

      const accruedAmount = Math.max(normalizeNumber(session.accruedAmount, chargeAmount), 0);
      const accruedMonthKey = (
        session.accruedMonthKey ||
        chargeData.monthKey ||
        earningData.monthKey ||
        monthKeyFromTimestampIST(session.date || session.startAt || session.endAt) ||
        ''
      );

      if (!accruedMonthKey) {
        logger.error('Void session revenue: cannot determine month key', {
          sessionId,
          startAt: session.startAt,
          date: session.date,
          endAt: session.endAt,
        });
        throw new HttpsError('internal', 'Cannot determine session month for revenue void');
      }

      let revenueRollupReversed = false;
      if (session.revenueAccrued === true) {
        const revenueRollupRef = revenueMonthlyRef(db, accruedMonthKey);
        tx.set(
          revenueRollupRef,
          {
            expected: FieldValue.increment(-accruedAmount),
            completedSessions: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        const enrollmentId = String(
          session.enrollmentId || chargeData.enrollmentId || earningData.enrollmentId || ''
        ).trim();
        if (enrollmentId) {
          const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
          tx.set(
            enrollmentRef,
            {
              'metrics.completedSessionsCount': FieldValue.increment(-1),
              'metrics.expectedRevenueAccrued': FieldValue.increment(-accruedAmount),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        revenueRollupReversed = true;
      }

      const teacherRollupReversed = false;

      const shouldSuppressRevenue = chargeVoided || earningVoided || revenueRollupReversed;
      if (shouldSuppressRevenue) {
        tx.set(
          sessionRef,
          {
            revenueAccrued: false,
            accruedAmount: FieldValue.delete(),
            accruedMonthKey: FieldValue.delete(),
            accruedAt: FieldValue.delete(),
            revenueSuppressed: true,
            revenueSuppressedAt: FieldValue.serverTimestamp(),
            revenueSuppressedBy: request.auth?.uid || null,
            revenueSuppressedReason: note,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      return {
        sessionId,
        chargeFound: chargeExists,
        chargeVoided,
        earningFound: earningExists,
        earningVoided,
        revenueRollupReversed,
        teacherRollupReversed,
        alreadyVoided:
          !chargeVoided && !earningVoided && !revenueRollupReversed && !teacherRollupReversed,
      };
    });

    logger.info('Admin voided session charge', {
      sessionId,
      actorUid: request.auth?.uid || null,
      chargeVoided: result.chargeVoided,
      earningVoided: result.earningVoided,
      revenueRollupReversed: result.revenueRollupReversed,
      teacherRollupReversed: result.teacherRollupReversed,
      alreadyVoided: result.alreadyVoided,
    });

    return {
      ok: true,
      ...result,
    };
  }
);

function normalizeMonthKeyOrThrow(value: any): string {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}$/.test(raw)) {
    throw new HttpsError('invalid-argument', 'monthKey must be in YYYY-MM format');
  }
  return raw;
}

function monthDateRange(monthKey: string): { fromDate: string; toDate: string } {
  const [yearText, monthText] = monthKey.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    fromDate: `${monthKey}-01`,
    toDate: `${monthKey}-${String(lastDay).padStart(2, '0')}`,
  };
}

function normalizeStoredMonthKey(value: any): string | null {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
}

type FinanceArchiveCollectionName =
  | 'billingCharges'
  | 'payments'
  | 'teacherEarnings'
  | 'teacherPayouts'
  | 'parentWallets';

interface FinanceArchiveMonthBucket {
  count: number;
  amountTotal: number;
  paidAmountTotal: number;
  alreadyArchivedCount: number;
  activeCount: number;
}

interface FinanceArchiveCollectionTotals extends FinanceArchiveMonthBucket {
  monthWise: Record<string, FinanceArchiveMonthBucket>;
}

function coerceFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function isAlreadyArchivedRecord(data: Record<string, unknown>): boolean {
  if (data.archived === true) return true;
  if (data.isArchived === true) return true;
  if (data.archivedAt != null) return true;
  if (data.deletedAt != null) return true;
  const status = normalizeStatus(data.status);
  return status === 'archived';
}

function emptyFinanceArchiveBucket(): FinanceArchiveMonthBucket {
  return {
    count: 0,
    amountTotal: 0,
    paidAmountTotal: 0,
    alreadyArchivedCount: 0,
    activeCount: 0,
  };
}

function addRecordToFinanceArchiveBucket(
  bucket: FinanceArchiveMonthBucket,
  data: Record<string, unknown>
): void {
  bucket.count += 1;

  const amount = coerceFiniteNumber(data.amount);
  if (amount != null) bucket.amountTotal += amount;

  const paidAmount = coerceFiniteNumber(data.paidAmount);
  if (paidAmount != null) bucket.paidAmountTotal += paidAmount;

  if (isAlreadyArchivedRecord(data)) {
    bucket.alreadyArchivedCount += 1;
  } else {
    bucket.activeCount += 1;
  }
}

async function previewFinanceCutoverArchiveForCollection(
  db: admin.firestore.Firestore,
  collectionName: FinanceArchiveCollectionName,
  archiveThroughMonthKey: string
): Promise<{ totals: FinanceArchiveCollectionTotals; warning: string | null }> {
  const snap = await db.collection(collectionName).get();
  const totals: FinanceArchiveCollectionTotals = {
    ...emptyFinanceArchiveBucket(),
    monthWise: {},
  };

  let missingMonthKeyCount = 0;
  const missingMonthKeySampleIds: string[] = [];

  for (const docSnap of snap.docs) {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    const monthKey = normalizeStoredMonthKey(data.monthKey);

    if (!monthKey) {
      missingMonthKeyCount += 1;
      if (missingMonthKeySampleIds.length < 10) {
        missingMonthKeySampleIds.push(docSnap.id);
      }
      continue;
    }

    if (monthKey.localeCompare(archiveThroughMonthKey) > 0) continue;

    addRecordToFinanceArchiveBucket(totals, data);
    if (!totals.monthWise[monthKey]) {
      totals.monthWise[monthKey] = emptyFinanceArchiveBucket();
    }
    addRecordToFinanceArchiveBucket(totals.monthWise[monthKey], data);
  }

  const warning =
    missingMonthKeyCount > 0
      ? `${collectionName}: ${missingMonthKeyCount} docs missing/invalid monthKey (sample ids: ${missingMonthKeySampleIds.join(', ') || 'n/a'})`
      : null;

  return { totals, warning };
}

function normalizeArchiveThroughMonthKeyOrThrow(value: any): string {
  const raw = String(value || '').trim();
  if (!raw) {
    throw new HttpsError('invalid-argument', 'archiveThroughMonthKey is required');
  }
  if (!/^\d{4}-\d{2}$/.test(raw)) {
    throw new HttpsError(
      'invalid-argument',
      'archiveThroughMonthKey must be in YYYY-MM format'
    );
  }
  return raw;
}

export const previewFinanceCutoverArchive = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const archiveThroughMonthKey = normalizeArchiveThroughMonthKeyOrThrow(
      request.data?.archiveThroughMonthKey
    );

    const db = admin.firestore();
    const collections: FinanceArchiveCollectionName[] = [
      'billingCharges',
      'payments',
      'teacherEarnings',
      'teacherPayouts',
      'parentWallets',
    ];

    const totalsByCollection: Record<FinanceArchiveCollectionName, FinanceArchiveCollectionTotals> = {
      billingCharges: { ...emptyFinanceArchiveBucket(), monthWise: {} },
      payments: { ...emptyFinanceArchiveBucket(), monthWise: {} },
      teacherEarnings: { ...emptyFinanceArchiveBucket(), monthWise: {} },
      teacherPayouts: { ...emptyFinanceArchiveBucket(), monthWise: {} },
      parentWallets: { ...emptyFinanceArchiveBucket(), monthWise: {} },
    };
    const warnings: string[] = [];

    for (const collectionName of collections) {
      const result = await previewFinanceCutoverArchiveForCollection(
        db,
        collectionName,
        archiveThroughMonthKey
      );
      totalsByCollection[collectionName] = result.totals;
      if (result.warning) warnings.push(result.warning);
    }

    return {
      ok: true,
      archiveThroughMonthKey,
      totalsByCollection,
      warnings,
    };
  }
);

type FinanceWritableArchiveCollectionName =
  | 'billingCharges'
  | 'payments'
  | 'teacherEarnings'
  | 'teacherPayouts';

interface FinanceArchiveWriteMonthSummary {
  eligibleCount: number;
  alreadyArchivedCount: number;
  archivedCount: number;
}

interface FinanceArchiveWriteCollectionSummary {
  scannedCount: number;
  eligibleCount: number;
  alreadyArchivedCount: number;
  missingOrInvalidMonthKeyCount: number;
  archivedCount: number;
  monthWise: Record<string, FinanceArchiveWriteMonthSummary>;
  warningSampleDocIds: string[];
}

const FINANCE_ARCHIVE_CONFIRMATION_TEXT = 'ARCHIVE FINANCE THROUGH 2026-04';
const FINANCE_ARCHIVE_REASON =
  'Finance cutover: archived historical finance records through April 2026';
const FINANCE_CUTOVER_VERSION = 'may_2026_v1';

function resolveDryRunOrThrow(value: any): boolean {
  if (value === undefined) return true;
  if (typeof value !== 'boolean') {
    throw new HttpsError('invalid-argument', 'dryRun must be a boolean');
  }
  return value;
}

function resolveArchiveBatchLimitOrThrow(value: any): number {
  if (value === undefined || value === null || value === '') return 300;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new HttpsError('invalid-argument', 'batchLimit must be a valid number');
  }
  const normalized = Math.floor(parsed);
  if (normalized < 1) {
    throw new HttpsError('invalid-argument', 'batchLimit must be at least 1');
  }
  if (normalized > 400) {
    throw new HttpsError('invalid-argument', 'batchLimit cannot exceed 400');
  }
  return normalized;
}

function emptyFinanceArchiveWriteMonthSummary(): FinanceArchiveWriteMonthSummary {
  return {
    eligibleCount: 0,
    alreadyArchivedCount: 0,
    archivedCount: 0,
  };
}

function emptyFinanceArchiveWriteCollectionSummary(): FinanceArchiveWriteCollectionSummary {
  return {
    scannedCount: 0,
    eligibleCount: 0,
    alreadyArchivedCount: 0,
    missingOrInvalidMonthKeyCount: 0,
    archivedCount: 0,
    monthWise: {},
    warningSampleDocIds: [],
  };
}

function appendWarningSample(summary: FinanceArchiveWriteCollectionSummary, docId: string): void {
  if (summary.warningSampleDocIds.length < 10) {
    summary.warningSampleDocIds.push(docId);
  }
}

function upsertFinanceArchiveWriteMonthSummary(
  monthWise: Record<string, FinanceArchiveWriteMonthSummary>,
  monthKey: string
): FinanceArchiveWriteMonthSummary {
  if (!monthWise[monthKey]) {
    monthWise[monthKey] = emptyFinanceArchiveWriteMonthSummary();
  }
  return monthWise[monthKey];
}

export const archiveFinanceRecordsThroughMonth = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const archiveThroughMonthKey = normalizeArchiveThroughMonthKeyOrThrow(
      request.data?.archiveThroughMonthKey
    );
    const dryRun = resolveDryRunOrThrow(request.data?.dryRun);
    const batchLimit = resolveArchiveBatchLimitOrThrow(request.data?.batchLimit);

    if (!dryRun) {
      const confirmationText = String(request.data?.confirmationText || '').trim();
      if (confirmationText !== FINANCE_ARCHIVE_CONFIRMATION_TEXT) {
        throw new HttpsError(
          'failed-precondition',
          `confirmationText must exactly match "${FINANCE_ARCHIVE_CONFIRMATION_TEXT}"`
        );
      }
    }

    const db = admin.firestore();
    const actorUid = request.auth?.uid || null;
    const now = FieldValue.serverTimestamp();
    const collections: FinanceWritableArchiveCollectionName[] = [
      'billingCharges',
      'payments',
      'teacherEarnings',
      'teacherPayouts',
    ];
    const perCollection: Record<
      FinanceWritableArchiveCollectionName,
      FinanceArchiveWriteCollectionSummary
    > = {
      billingCharges: emptyFinanceArchiveWriteCollectionSummary(),
      payments: emptyFinanceArchiveWriteCollectionSummary(),
      teacherEarnings: emptyFinanceArchiveWriteCollectionSummary(),
      teacherPayouts: emptyFinanceArchiveWriteCollectionSummary(),
    };
    const monthWiseSummary: Record<string, FinanceArchiveWriteMonthSummary> = {};
    const warnings: string[] = [];

    let writeCount = 0;
    let hasMore = false;
    const batch = db.batch();

    for (const collectionName of collections) {
      const summary = perCollection[collectionName];
      const snap = await db.collection(collectionName).get();

      for (const docSnap of snap.docs) {
        summary.scannedCount += 1;
        const data = (docSnap.data() || {}) as Record<string, unknown>;
        const monthKey = normalizeStoredMonthKey(data.monthKey);

        if (!monthKey) {
          summary.missingOrInvalidMonthKeyCount += 1;
          appendWarningSample(summary, docSnap.id);
          continue;
        }

        if (monthKey.localeCompare(archiveThroughMonthKey) > 0) continue;

        const collectionMonthSummary = upsertFinanceArchiveWriteMonthSummary(
          summary.monthWise,
          monthKey
        );
        const overallMonthSummary = upsertFinanceArchiveWriteMonthSummary(
          monthWiseSummary,
          monthKey
        );

        if (data.archived === true) {
          summary.alreadyArchivedCount += 1;
          collectionMonthSummary.alreadyArchivedCount += 1;
          overallMonthSummary.alreadyArchivedCount += 1;
          continue;
        }

        summary.eligibleCount += 1;
        collectionMonthSummary.eligibleCount += 1;
        overallMonthSummary.eligibleCount += 1;

        if (dryRun) continue;

        if (writeCount < batchLimit) {
          batch.set(
            docSnap.ref,
            {
              archived: true,
              archivedAt: now,
              archivedBy: actorUid,
              archiveReason: FINANCE_ARCHIVE_REASON,
              financeCutoverVersion: FINANCE_CUTOVER_VERSION,
              updatedAt: now,
            },
            { merge: true }
          );
          writeCount += 1;
          summary.archivedCount += 1;
          collectionMonthSummary.archivedCount += 1;
          overallMonthSummary.archivedCount += 1;
        } else {
          hasMore = true;
        }
      }

      if (summary.missingOrInvalidMonthKeyCount > 0) {
        warnings.push(
          `${collectionName}: ${summary.missingOrInvalidMonthKeyCount} docs missing/invalid monthKey (sample ids: ${summary.warningSampleDocIds.join(', ') || 'n/a'})`
        );
      }
    }

    if (!dryRun && writeCount > 0) {
      await batch.commit();
    }

    const scannedCount = collections.reduce(
      (sum, collectionName) => sum + perCollection[collectionName].scannedCount,
      0
    );
    const eligibleCount = collections.reduce(
      (sum, collectionName) => sum + perCollection[collectionName].eligibleCount,
      0
    );
    const alreadyArchivedCount = collections.reduce(
      (sum, collectionName) => sum + perCollection[collectionName].alreadyArchivedCount,
      0
    );
    const missingOrInvalidMonthKeyCount = collections.reduce(
      (sum, collectionName) => sum + perCollection[collectionName].missingOrInvalidMonthKeyCount,
      0
    );
    const archivedCount = collections.reduce(
      (sum, collectionName) => sum + perCollection[collectionName].archivedCount,
      0
    );

    return {
      ok: true,
      archiveThroughMonthKey,
      dryRun,
      batchLimit,
      scannedCount,
      eligibleCount,
      alreadyArchivedCount,
      missingOrInvalidMonthKeyCount,
      archivedCount,
      skippedAlreadyArchivedCount: alreadyArchivedCount,
      skippedInvalidMonthKeyCount: missingOrInvalidMonthKeyCount,
      perCollection,
      monthWiseSummary,
      warnings,
      hasMore: dryRun ? false : hasMore,
      financeCutoverVersion: FINANCE_CUTOVER_VERSION,
    };
  }
);

export const reconcileSessionRevenueMonthKeys = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const monthKey = normalizeMonthKeyOrThrow(request.data?.monthKey);
    const apply = request.data?.apply === true;
    const maxSessionsRaw = Number(request.data?.maxSessions);
    const maxSessions = Number.isFinite(maxSessionsRaw)
      ? Math.max(1, Math.min(Math.floor(maxSessionsRaw), 1500))
      : 500;
    const sampleLimitRaw = Number(request.data?.sampleLimit);
    const sampleLimit = Number.isFinite(sampleLimitRaw)
      ? Math.max(1, Math.min(Math.floor(sampleLimitRaw), 50))
      : 20;

    const { fromDate, toDate } = monthDateRange(monthKey);
    const db = admin.firestore();
    const sessionsSnap = await db
      .collection('classSessions')
      .where('date', '>=', fromDate)
      .where('date', '<=', toDate)
      .limit(maxSessions)
      .get();

    let scannedSessions = 0;
    let accruedSessions = 0;
    let mismatchedSessions = 0;
    let missingCanonicalMonth = 0;
    let updatedSessions = 0;
    let updatedCharges = 0;
    let updatedEarnings = 0;
    let movedRevenueRollups = 0;
    let rollupMoveSkippedUnknownSource = 0;
    let applyErrors = 0;
    const samples: Array<{
      sessionId: string;
      canonicalMonthKey: string | null;
      accruedMonthKey: string | null;
      chargeMonthKey: string | null;
      earningMonthKey: string | null;
      revenueAccrued: boolean;
      needsSessionUpdate: boolean;
      needsChargeUpdate: boolean;
      needsEarningUpdate: boolean;
    }> = [];

    for (const sessionDoc of sessionsSnap.docs) {
      scannedSessions += 1;
      const sessionRef = sessionDoc.ref;
      const sessionData = sessionDoc.data() || {};
      const revenueAccrued = sessionData.revenueAccrued === true;
      if (!revenueAccrued) continue;
      accruedSessions += 1;

      const sessionId = sessionDoc.id;
      const canonicalMonthKey = monthKeyFromTimestampIST(
        sessionData.date || sessionData.startAt || sessionData.endAt
      );
      if (!canonicalMonthKey) {
        missingCanonicalMonth += 1;
        if (samples.length < sampleLimit) {
          samples.push({
            sessionId,
            canonicalMonthKey: null,
            accruedMonthKey: normalizeStoredMonthKey(sessionData.accruedMonthKey),
            chargeMonthKey: null,
            earningMonthKey: null,
            revenueAccrued,
            needsSessionUpdate: false,
            needsChargeUpdate: false,
            needsEarningUpdate: false,
          });
        }
        continue;
      }

      const chargeRef = db.collection('billingCharges').doc(sessionId);
      const earningRef = db.collection('teacherEarnings').doc(sessionId);
      const [chargeSnap, earningSnap] = await db.getAll(chargeRef, earningRef);

      const accruedMonthKey = normalizeStoredMonthKey(sessionData.accruedMonthKey);
      const chargeMonthKey = chargeSnap.exists
        ? normalizeStoredMonthKey((chargeSnap.data() || {}).monthKey)
        : null;
      const earningMonthKey = earningSnap.exists
        ? normalizeStoredMonthKey((earningSnap.data() || {}).monthKey)
        : null;

      const needsSessionUpdate = accruedMonthKey !== canonicalMonthKey;
      const needsChargeUpdate = chargeSnap.exists && chargeMonthKey !== canonicalMonthKey;
      const needsEarningUpdate = earningSnap.exists && earningMonthKey !== canonicalMonthKey;
      const hasMismatch = needsSessionUpdate || needsChargeUpdate || needsEarningUpdate;
      if (!hasMismatch) continue;

      mismatchedSessions += 1;

      if (samples.length < sampleLimit) {
        samples.push({
          sessionId,
          canonicalMonthKey,
          accruedMonthKey,
          chargeMonthKey,
          earningMonthKey,
          revenueAccrued,
          needsSessionUpdate,
          needsChargeUpdate,
          needsEarningUpdate,
        });
      }

      if (!apply) continue;

      try {
        const applied = await db.runTransaction(async (tx) => {
          const [sessionLiveSnap, chargeLiveSnap, earningLiveSnap] = await Promise.all([
            tx.get(sessionRef),
            tx.get(chargeRef),
            tx.get(earningRef),
          ]);
          if (!sessionLiveSnap.exists) {
            return {
              sessionUpdated: false,
              chargeUpdated: false,
              earningUpdated: false,
              rollupMoved: false,
              rollupSkippedUnknown: false,
            };
          }

          const liveSession = sessionLiveSnap.data() || {};
          if (liveSession.revenueAccrued !== true) {
            return {
              sessionUpdated: false,
              chargeUpdated: false,
              earningUpdated: false,
              rollupMoved: false,
              rollupSkippedUnknown: false,
            };
          }

          const liveCanonicalMonthKey = monthKeyFromTimestampIST(
            liveSession.date || liveSession.startAt || liveSession.endAt
          );
          if (!liveCanonicalMonthKey) {
            return {
              sessionUpdated: false,
              chargeUpdated: false,
              earningUpdated: false,
              rollupMoved: false,
              rollupSkippedUnknown: false,
            };
          }

          const liveAccruedMonthKey = normalizeStoredMonthKey(liveSession.accruedMonthKey);
          const liveChargeMonthKey = chargeLiveSnap.exists
            ? normalizeStoredMonthKey((chargeLiveSnap.data() || {}).monthKey)
            : null;
          const liveEarningMonthKey = earningLiveSnap.exists
            ? normalizeStoredMonthKey((earningLiveSnap.data() || {}).monthKey)
            : null;

          const liveNeedsSessionUpdate = liveAccruedMonthKey !== liveCanonicalMonthKey;
          const liveNeedsChargeUpdate = chargeLiveSnap.exists && liveChargeMonthKey !== liveCanonicalMonthKey;
          const liveNeedsEarningUpdate =
            earningLiveSnap.exists && liveEarningMonthKey !== liveCanonicalMonthKey;

          if (!liveNeedsSessionUpdate && !liveNeedsChargeUpdate && !liveNeedsEarningUpdate) {
            return {
              sessionUpdated: false,
              chargeUpdated: false,
              earningUpdated: false,
              rollupMoved: false,
              rollupSkippedUnknown: false,
            };
          }

          const now = FieldValue.serverTimestamp();
          const actorUid = request.auth?.uid || null;

          if (liveNeedsSessionUpdate) {
            tx.set(
              sessionRef,
              {
                accruedMonthKey: liveCanonicalMonthKey,
                revenueMonthReconciledAt: now,
                revenueMonthReconciledBy: actorUid,
                updatedAt: now,
              },
              { merge: true },
            );
          }

          if (liveNeedsChargeUpdate && chargeLiveSnap.exists) {
            tx.set(
              chargeRef,
              {
                monthKey: liveCanonicalMonthKey,
                updatedAt: now,
                reconciledAt: now,
                reconciledBy: actorUid,
              },
              { merge: true },
            );
          }

          if (liveNeedsEarningUpdate && earningLiveSnap.exists) {
            tx.set(
              earningRef,
              {
                monthKey: liveCanonicalMonthKey,
                updatedAt: now,
                reconciledAt: now,
                reconciledBy: actorUid,
              },
              { merge: true },
            );
          }

          let rollupMoved = false;
          let rollupSkippedUnknown = false;
          if (liveNeedsSessionUpdate) {
            if (liveAccruedMonthKey) {
              const liveAccruedAmount = Math.max(
                normalizeNumber(
                  liveSession.accruedAmount ?? (chargeLiveSnap.exists ? (chargeLiveSnap.data() || {}).amount : 0),
                  0,
                ),
                0,
              );
              const oldRollupRef = revenueMonthlyRef(db, liveAccruedMonthKey);
              const newRollupRef = revenueMonthlyRef(db, liveCanonicalMonthKey);
              tx.set(
                oldRollupRef,
                {
                  expected: FieldValue.increment(-liveAccruedAmount),
                  completedSessions: FieldValue.increment(-1),
                  updatedAt: now,
                },
                { merge: true },
              );
              tx.set(
                newRollupRef,
                {
                  expected: FieldValue.increment(liveAccruedAmount),
                  completedSessions: FieldValue.increment(1),
                  updatedAt: now,
                },
                { merge: true },
              );
              rollupMoved = true;
            } else {
              rollupSkippedUnknown = true;
            }
          }

          return {
            sessionUpdated: liveNeedsSessionUpdate,
            chargeUpdated: liveNeedsChargeUpdate,
            earningUpdated: liveNeedsEarningUpdate,
            rollupMoved,
            rollupSkippedUnknown,
          };
        });

        if (applied.sessionUpdated) updatedSessions += 1;
        if (applied.chargeUpdated) updatedCharges += 1;
        if (applied.earningUpdated) updatedEarnings += 1;
        if (applied.rollupMoved) movedRevenueRollups += 1;
        if (applied.rollupSkippedUnknown) rollupMoveSkippedUnknownSource += 1;
      } catch (error) {
        applyErrors += 1;
        logger.error('reconcileSessionRevenueMonthKeys: failed to apply session fix', {
          sessionId,
          monthKey,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('reconcileSessionRevenueMonthKeys completed', {
      monthKey,
      apply,
      scannedSessions,
      accruedSessions,
      mismatchedSessions,
      missingCanonicalMonth,
      updatedSessions,
      updatedCharges,
      updatedEarnings,
      movedRevenueRollups,
      rollupMoveSkippedUnknownSource,
      applyErrors,
      maxSessions,
      actorUid: request.auth?.uid || null,
    });

    return {
      ok: true,
      monthKey,
      apply,
      scannedSessions,
      accruedSessions,
      mismatchedSessions,
      missingCanonicalMonth,
      updatedSessions,
      updatedCharges,
      updatedEarnings,
      movedRevenueRollups,
      rollupMoveSkippedUnknownSource,
      applyErrors,
      maxSessions,
      scannedLimitHit: sessionsSnap.size >= maxSessions,
      samples,
    };
  }
);
