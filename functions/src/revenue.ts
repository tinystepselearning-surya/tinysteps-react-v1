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

function dayKeyFromTimestampIST(value: any): string {
  const baseDate = toDate(value) || new Date();
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
  return String(value || '').trim().toLowerCase();
}

function isSettledCharge(status: string): boolean {
  return status === 'paid' || status === 'settled';
}

function normalizeStatus(value: any): string {
  return String(value || '').trim().toLowerCase();
}

function resolveAttendanceStatus(session: any, kidId: string | null): string | null {
  if (!kidId) return null;
  const attendance = session?.attendance || {};
  const entry = attendance?.[kidId];
  if (!entry) return null;
  if (typeof entry === 'string') return entry.trim().toLowerCase();
  if (typeof entry?.status === 'string') return entry.status.trim().toLowerCase();
  return null;
}

function isBillableAttendance(status: string | null): boolean {
  return status === 'present' || status === 'late';
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

function resolveFeeAmount(session: any, enrollment: any): number {
  const raw =
    session?.feeAmount ??
    session?.feePerClass ??
    enrollment?.ratePerSession ??
    enrollment?.feePerClass ??
    enrollment?.feePerSession ??
    0;
  return normalizeNumber(raw, 0);
}

function resolveTeacherPay(enrollment: any): number {
  const raw =
    enrollment?.teacherPayPerSession ??
    enrollment?.teacherRatePerSession ??
    enrollment?.teacherPay ??
    0;
  return normalizeNumber(raw, 0);
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
    const beforeCompleted = beforeStatus === 'completed';
    const afterCompleted = afterStatus === 'completed';
    const kidIdForCheck = resolveKidId(afterData || beforeData);
    const beforeBillable =
      beforeCompleted &&
      isBillableAttendance(resolveAttendanceStatus(beforeData, kidIdForCheck));
    const afterBillable =
      afterCompleted &&
      isBillableAttendance(resolveAttendanceStatus(afterData, kidIdForCheck));

    if (!beforeCompleted && !afterCompleted) return;

    const db = admin.firestore();
    const sessionRef = change.after.ref;

    if (afterBillable) {
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
        if (currentStatus !== 'completed') return;

        const currentKidId = resolveKidId(session);
        const attendanceStatus = resolveAttendanceStatus(session, currentKidId);
        if (!isBillableAttendance(attendanceStatus)) return;

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
        const teacherPayPerSession = resolveTeacherPay(enrollment);
        const currency = session.currency || enrollment.currency || 'INR';
        const resolvedTeacherId = session.teacherId || enrollment.teacherId || null;

        const monthKey = monthKeyFromTimestampIST(
          session.startAt || session.date || session.endAt || new Date()
        );

        const rollupRef = revenueMonthlyRef(db, monthKey);
        const alreadyAccrued = session.revenueAccrued === true;
        const sessionId = change.after.id;

        const teacherRollupRef =
          resolvedTeacherId && teacherPayPerSession > 0
            ? teacherEarningsMonthlyRef(db, String(resolvedTeacherId), monthKey)
            : null;
        const teacherRollupSnap = teacherRollupRef ? await tx.get(teacherRollupRef) : null;
        const existingRate = normalizeNumber(teacherRollupSnap?.data()?.ratePerSession, 0);
        const shouldSetRate = teacherPayPerSession > 0 && existingRate <= 0;

        const chargeRef = db.collection('billingCharges').doc(sessionId);
        const chargeSnap = await tx.get(chargeRef);
        const chargeStatusRaw = chargeSnap.exists ? String(chargeSnap.data()?.status || '') : '';
        const chargeStatus = chargeStatusRaw.toLowerCase();
        const nextChargeStatus =
          !chargeSnap.exists || chargeStatus === 'void' ? 'open' : chargeStatus;

        const chargePayload: Record<string, any> = {
          sessionId,
          enrollmentId,
          kidId: currentKidId,
          parentId: session.parentId || enrollment.parentId || null,
          teacherId: session.teacherId || enrollment.teacherId || null,
          courseId: session.courseId || enrollment.courseId || null,
          amount: ratePerSession,
          currency,
          status: nextChargeStatus || 'open',
          source: 'session_present_completed',
          monthKey,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (!chargeSnap.exists) {
          chargePayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }

        const earningRef = db.collection('teacherEarnings').doc(sessionId);
        const earningSnap = await tx.get(earningRef);
        const earningStatusRaw = earningSnap.exists ? String(earningSnap.data()?.status || '') : '';
        const earningStatus = earningStatusRaw.toLowerCase();
        const nextEarningStatus =
          !earningSnap.exists || earningStatus === 'void' ? 'unpaid' : earningStatus;
        const earningPayload: Record<string, any> = {
          sessionId,
          enrollmentId,
          kidId: currentKidId,
          teacherId: session.teacherId || enrollment.teacherId || null,
          parentId: session.parentId || enrollment.parentId || null,
          courseId: session.courseId || enrollment.courseId || null,
          amount: teacherPayPerSession,
          currency,
          status: nextEarningStatus || 'unpaid',
          earnedAt: admin.firestore.FieldValue.serverTimestamp(),
          monthKey,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (!earningSnap.exists) {
          earningPayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }

        if (!alreadyAccrued) {
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

          if (teacherRollupRef && teacherPayPerSession > 0) {
            const rollupPayload: Record<string, any> = {
              month: monthKey,
              totalSessions: admin.firestore.FieldValue.increment(1),
              sessionsCompleted: admin.firestore.FieldValue.increment(1),
              totalEarnings: admin.firestore.FieldValue.increment(teacherPayPerSession),
              pendingEarnings: admin.firestore.FieldValue.increment(teacherPayPerSession),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (shouldSetRate) rollupPayload.ratePerSession = teacherPayPerSession;
            tx.set(teacherRollupRef, rollupPayload, { merge: true });
          }
        }

        tx.set(chargeRef, chargePayload, { merge: true });
        tx.set(earningRef, earningPayload, { merge: true });
      });

      return;
    }

    if (beforeBillable && !afterBillable) {
      await db.runTransaction(async (tx) => {
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists) return;

        const session = sessionSnap.data() || {};
        const currentStatus = normalizeStatus(session.status);
        const currentKidId = resolveKidId(session);
        const attendanceStatus = resolveAttendanceStatus(session, currentKidId);
        const stillBillable =
          currentStatus === 'completed' && isBillableAttendance(attendanceStatus);
        if (stillBillable) return;

        const accruedAmount = normalizeNumber(
          session.accruedAmount ?? beforeData?.accruedAmount,
          0
        );
        const accruedMonthKey =
          (session.accruedMonthKey || beforeData?.accruedMonthKey) ??
          monthKeyFromTimestampIST(session.startAt || session.date || session.endAt || new Date());

        const rollupRef = revenueMonthlyRef(db, accruedMonthKey);
        const sessionId = change.after.id;

        if (session.revenueAccrued === true) {
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
        }

        const chargeRef = db.collection('billingCharges').doc(sessionId);
        const chargeSnap = await tx.get(chargeRef);
        if (chargeSnap.exists) {
          const statusRaw = String(chargeSnap.data()?.status || '').toLowerCase();
          if (statusRaw && statusRaw !== 'paid' && statusRaw !== 'settled') {
            tx.set(
              chargeRef,
              {
                status: 'void',
                voidedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        }

        const earningRef = db.collection('teacherEarnings').doc(sessionId);
        const earningSnap = await tx.get(earningRef);
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
                voidedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            const reverseAmount = normalizeNumber(earningSnap.data()?.amount, 0);
            const reverseTeacherId =
              session.teacherId || beforeData?.teacherId || earningSnap.data()?.teacherId || null;
            const reverseMonthKey =
              earningSnap.data()?.monthKey || accruedMonthKey || monthKeyFromTimestampIST(new Date());

            if (reverseTeacherId && reverseAmount > 0) {
              const teacherRollupRef = teacherEarningsMonthlyRef(
                db,
                String(reverseTeacherId),
                String(reverseMonthKey)
              );
              tx.set(
                teacherRollupRef,
                {
                  totalSessions: admin.firestore.FieldValue.increment(-1),
                  sessionsCompleted: admin.firestore.FieldValue.increment(-1),
                  totalEarnings: admin.firestore.FieldValue.increment(-reverseAmount),
                  pendingEarnings: admin.firestore.FieldValue.increment(-reverseAmount),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
            }
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
    const paymentRef = db.collection('payments').doc();
    const rollupRef = revenueMonthlyRef(db, monthKey);
    const chargesQuery = db.collection('billingCharges').where('enrollmentId', '==', enrollmentId);
    const dateKey = dayKeyFromTimestampIST(paidAt.toDate());

    const allocation = await db.runTransaction(async (tx) => {
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              paymentIds: admin.firestore.FieldValue.arrayUnion(paymentRef.id),
            };

            if (nextPaid >= amountValue - 0.01) {
              updates.status = 'paid';
              updates.paidAt = paidAt;
            } else {
              updates.status = 'partial';
              updates.paidAt = admin.firestore.FieldValue.delete();
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
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              paymentIds: admin.firestore.FieldValue.arrayUnion(paymentRef.id),
            };

            if (nextPaid <= 0.01) {
              updates.status = 'open';
              updates.paidAt = admin.firestore.FieldValue.delete();
            } else if (nextPaid < amountValue - 0.01) {
              updates.status = 'partial';
              updates.paidAt = admin.firestore.FieldValue.delete();
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
          earned: admin.firestore.FieldValue.increment(amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { appliedChargeIds, appliedAmount, unappliedAmount: remaining };
    });

    return { ok: true, paymentId: paymentRef.id, monthKey, ...allocation };
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
    const dateKey = dayKeyFromTimestampIST(paidAt.toDate());

    const db = admin.firestore();
    const payoutRef = db.collection('teacherPayouts').doc();
    const earningsQuery = db.collection('teacherEarnings').where('teacherId', '==', teacherId);

    const allocation = await db.runTransaction(async (tx) => {
      const earningsSnap = await tx.get(earningsQuery);
      const earnings = earningsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ref: docSnap.ref,
        data: docSnap.data() || {},
      }));

      let remaining = amount;
      const appliedEarningIds: string[] = [];
      const appliedAllocations: Array<{ earningId: string; amount: number }> = [];
      const rollupUpdates: Record<string, number> = {};

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
            const amountValue = normalizeNumber(earning.data.amount, 0);
            if (amountValue <= 0) continue;
            const paidValue = normalizeNumber(earning.data.paidAmount, 0);
            const due = Math.max(amountValue - paidValue, 0);
            if (due <= 0) continue;

            const applyAmount = Math.min(remaining, due);
            const nextPaid = paidValue + applyAmount;
            remaining -= applyAmount;

            const updates: Record<string, any> = {
              paidAmount: nextPaid,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              payoutIds: admin.firestore.FieldValue.arrayUnion(payoutRef.id),
            };

            if (nextPaid >= amountValue - 0.01) {
              updates.status = 'paid';
              updates.paidAt = paidAt;
            } else {
              updates.status = 'partial';
              updates.paidAt = admin.firestore.FieldValue.delete();
            }

            tx.set(earning.ref, updates, { merge: true });
            appliedEarningIds.push(earning.id);
            appliedAllocations.push({ earningId: earning.id, amount: applyAmount });

            const earningMonth =
              String(earning.data.monthKey || monthKeyFromTimestampIST(earning.data.earnedAt || earning.data.createdAt || new Date()));
            rollupUpdates[earningMonth] = (rollupUpdates[earningMonth] || 0) - applyAmount;
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
            const amountValue = normalizeNumber(earning.data.amount, 0);
            if (amountValue <= 0) continue;
            const paidValue = normalizeNumber(earning.data.paidAmount, 0);
            const effectivePaid = paidValue > 0 ? paidValue : amountValue;
            if (effectivePaid <= 0) continue;

            const applyAmount = Math.min(Math.abs(remaining), effectivePaid);
            const nextPaid = effectivePaid - applyAmount;
            remaining += applyAmount;

            const updates: Record<string, any> = {
              paidAmount: nextPaid,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              payoutIds: admin.firestore.FieldValue.arrayUnion(payoutRef.id),
            };

            if (nextPaid <= 0.01) {
              updates.status = 'unpaid';
              updates.paidAt = admin.firestore.FieldValue.delete();
            } else if (nextPaid < amountValue - 0.01) {
              updates.status = 'partial';
              updates.paidAt = admin.firestore.FieldValue.delete();
            } else {
              updates.status = 'paid';
              updates.paidAt = paidAt;
            }

            tx.set(earning.ref, updates, { merge: true });
            appliedEarningIds.push(earning.id);
            appliedAllocations.push({ earningId: earning.id, amount: -applyAmount });

            const earningMonth =
              String(earning.data.monthKey || monthKeyFromTimestampIST(earning.data.earnedAt || earning.data.createdAt || new Date()));
            rollupUpdates[earningMonth] = (rollupUpdates[earningMonth] || 0) + applyAmount;
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: request.auth?.uid || null,
          appliedEarningIds,
          appliedAllocations,
          appliedAmount,
          unappliedAmount: remaining,
        },
        { merge: true }
      );

      for (const [earningMonth, delta] of Object.entries(rollupUpdates)) {
        const rollupRef = teacherEarningsMonthlyRef(db, teacherId, earningMonth);
        tx.set(
          rollupRef,
          {
            month: earningMonth,
            pendingEarnings: admin.firestore.FieldValue.increment(delta),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      const payoutRollupRef = teacherEarningsMonthlyRef(db, teacherId, monthKey);
      const payoutRollupSnap = await tx.get(payoutRollupRef);
      const existingPayments = Array.isArray(payoutRollupSnap.data()?.payments)
        ? payoutRollupSnap.data()?.payments
        : [];
      const paymentEntry = {
        id: payoutRef.id,
        amount,
        date: dateKey,
        status: amount < 0 ? 'refunded' : 'completed',
      };
      const nextPayments = [paymentEntry, ...existingPayments].slice(0, 5);
      tx.set(
        payoutRollupRef,
        {
          month: monthKey,
          payments: nextPayments,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { appliedEarningIds, appliedAmount, unappliedAmount: remaining };
    });

    return { ok: true, payoutId: payoutRef.id, monthKey, ...allocation };
  }
);
