import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';

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

function monthKeyFromTimestampIST(value: any): string {
  const baseDate = toDate(value) || new Date();
  const istMs = baseDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function normalizeStatus(value: any): string {
  return String(value || '').trim().toLowerCase();
}

function resolveKidId(data: any): string | null {
  return (
    data?.kidId ||
    data?.studentId ||
    (Array.isArray(data?.kidIds) ? data.kidIds[0] : null) ||
    null
  );
}

async function resolveEnrollmentId(
  db: admin.firestore.Firestore,
  session: any
): Promise<string | null> {
  if (session?.enrollmentId) return String(session.enrollmentId);

  const kidId = resolveKidId(session);
  const courseId = session?.courseId || null;
  if (!kidId || !courseId) return null;

  const statusList = Array.from(ACTIVE_LIKE);
  const queryAttempts: Array<() => Promise<admin.firestore.QuerySnapshot>> = [
    () =>
      db
        .collection('enrollments')
        .where('kidId', '==', kidId)
        .where('courseId', '==', courseId)
        .where('status', 'in', statusList)
        .limit(1)
        .get(),
    () =>
      db
        .collection('enrollments')
        .where('studentId', '==', kidId)
        .where('courseId', '==', courseId)
        .where('status', 'in', statusList)
        .limit(1)
        .get(),
    () =>
      db
        .collection('enrollments')
        .where('kidIds', 'array-contains', kidId)
        .where('courseId', '==', courseId)
        .where('status', 'in', statusList)
        .limit(1)
        .get(),
  ];

  for (const runQuery of queryAttempts) {
    try {
      const snap = await runQuery();
      if (!snap.empty) return snap.docs[0].id;
    } catch (err) {
      logger.warn('resolveEnrollmentId: query failed, will retry without status filter', {
        kidId,
        courseId,
        error: err instanceof Error ? err.message : String(err),
      });
      break;
    }
  }

  const fallbackQueries: Array<() => Promise<admin.firestore.QuerySnapshot>> = [
    () =>
      db
        .collection('enrollments')
        .where('kidId', '==', kidId)
        .where('courseId', '==', courseId)
        .limit(1)
        .get(),
    () =>
      db
        .collection('enrollments')
        .where('studentId', '==', kidId)
        .where('courseId', '==', courseId)
        .limit(1)
        .get(),
    () =>
      db
        .collection('enrollments')
        .where('kidIds', 'array-contains', kidId)
        .where('courseId', '==', courseId)
        .limit(1)
        .get(),
  ];

  for (const runQuery of fallbackQueries) {
    const snap = await runQuery();
    if (!snap.empty) return snap.docs[0].id;
  }

  return null;
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

    const transitionedIntoCompleted = beforeStatus !== 'completed' && afterStatus === 'completed';
    const transitionedOutOfCompleted = beforeStatus === 'completed' && afterStatus !== 'completed';

    if (!transitionedIntoCompleted && !transitionedOutOfCompleted) return;

    const db = admin.firestore();
    const sessionRef = change.after.ref;

    if (transitionedIntoCompleted) {
      const enrollmentId = await resolveEnrollmentId(db, afterData);
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
        if (currentStatus !== 'completed' || session.revenueAccrued === true) return;

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
        const ratePerSession = normalizeNumber(
          enrollment.ratePerSession ?? enrollment.feePerClass ?? enrollment.feePerSession,
          0
        );

        const monthKey = monthKeyFromTimestampIST(
          session.startAt || session.date || session.endAt || new Date()
        );

        const rollupRef = db.doc(`adminStats/revenueMonthly/${monthKey}`);

        tx.set(
          sessionRef,
          {
            revenueAccrued: true,
            accruedAmount: ratePerSession,
            accruedMonthKey: monthKey,
            accruedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          rollupRef,
          {
            expected: admin.firestore.FieldValue.increment(ratePerSession),
            completedSessions: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          enrollmentRef,
          {
            'metrics.completedSessionsCount': admin.firestore.FieldValue.increment(1),
            'metrics.expectedRevenueAccrued': admin.firestore.FieldValue.increment(ratePerSession),
            'metrics.lastCompletedAt': admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });

      return;
    }

    if (transitionedOutOfCompleted) {
      await db.runTransaction(async (tx) => {
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists) return;

        const session = sessionSnap.data() || {};
        const currentStatus = normalizeStatus(session.status);
        if (currentStatus === 'completed' || session.revenueAccrued !== true) return;

        const accruedAmount = normalizeNumber(
          session.accruedAmount ?? beforeData?.accruedAmount,
          0
        );
        const accruedMonthKey =
          (session.accruedMonthKey || beforeData?.accruedMonthKey) ??
          monthKeyFromTimestampIST(session.startAt || session.date || session.endAt || new Date());

        const rollupRef = db.doc(`adminStats/revenueMonthly/${accruedMonthKey}`);

        tx.set(
          rollupRef,
          {
            expected: admin.firestore.FieldValue.increment(-accruedAmount),
            completedSessions: admin.firestore.FieldValue.increment(-1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        const enrollmentId = session.enrollmentId || beforeData?.enrollmentId || null;
        if (enrollmentId) {
          const enrollmentRef = db.collection('enrollments').doc(String(enrollmentId));
          tx.set(
            enrollmentRef,
            {
              'metrics.completedSessionsCount': admin.firestore.FieldValue.increment(-1),
              'metrics.expectedRevenueAccrued': admin.firestore.FieldValue.increment(-accruedAmount),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        tx.set(
          sessionRef,
          {
            revenueAccrued: false,
            accruedAmount: admin.firestore.FieldValue.delete(),
            accruedMonthKey: admin.firestore.FieldValue.delete(),
            accruedAt: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
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

function toPaidAtTimestamp(value: any): admin.firestore.Timestamp {
  const parsed = toDate(value);
  return admin.firestore.Timestamp.fromDate(parsed || new Date());
}

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

    const db = admin.firestore();
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
    const enrollmentSnap = await enrollmentRef.get();
    if (!enrollmentSnap.exists) {
      throw new HttpsError('not-found', 'Enrollment not found');
    }

    const enrollment = enrollmentSnap.data() || {};
    const paymentRef = db.collection('payments').doc();
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
      method,
      note: note || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth?.uid || null,
    };

    const rollupRef = db.doc(`adminStats/revenueMonthly/${monthKey}`);

    const batch = db.batch();
    batch.set(paymentRef, paymentDoc, { merge: true });
    batch.set(
      rollupRef,
      {
        earned: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    return { ok: true, paymentId: paymentRef.id, monthKey };
  }
);
