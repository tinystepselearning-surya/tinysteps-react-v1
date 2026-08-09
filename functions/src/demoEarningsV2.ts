import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const DEMO_COMPLETION_PAYOUT_AMOUNT = 100;
const DEMO_ENROLLMENT_BONUS_AMOUNT = 100;
const PAYABLE_COMPLETION_OUTCOMES = new Set(['completed', 'not_interested', 'follow_up_needed']);

const text = (value: unknown, max = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const normalized = (value: unknown): string => text(value, 120).toLowerCase();

const numberValue = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybe.toDate === 'function') {
      const date = maybe.toDate();
      return Number.isFinite(date.getTime()) ? date : null;
    }
    if (typeof maybe.seconds === 'number') return new Date(maybe.seconds * 1000);
  }
  return null;
};

const monthKeyIst = (value: unknown): string => {
  const base = toDate(value) || new Date();
  const ist = new Date(base.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}`;
};

const paidAmountFor = (earning: Record<string, unknown>, amount: number): number => {
  const explicit = Math.max(numberValue(earning.paidAmount), 0);
  if (explicit > 0) return Math.min(explicit, amount);
  const status = normalized(earning.status);
  return status === 'paid' || status === 'settled' ? amount : 0;
};

interface EarningInput {
  earningId: string;
  demoId: string;
  teacherId: string;
  teacherName: string;
  amount: number;
  source: 'demo_completed' | 'demo_enrolled_bonus';
  monthKey: string;
  demo: Record<string, unknown>;
}

async function ensureEarning(input: EarningInput): Promise<boolean> {
  const db = admin.firestore();
  const ref = db.collection('teacherEarnings').doc(input.earningId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? ((snap.data() || {}) as Record<string, unknown>) : null;
    if (existing) {
      const amount = Math.max(numberValue(existing.amount), 0);
      const paid = paidAmountFor(existing, amount);
      if (normalized(existing.status) !== 'void' || paid > 0) return false;
    }

    const payload: Record<string, unknown> = {
      demoId: input.demoId,
      teacherId: input.teacherId,
      teacherName: input.teacherName,
      amount: input.amount,
      currency: 'INR',
      status: 'unpaid',
      monthKey: input.monthKey,
      source: input.source,
      courseId: text(input.demo.courseInterested, 120) || null,
      enrollmentId: null,
      kidId: null,
      parentName: text(input.demo.parentName, 120) || null,
      childName: text(input.demo.childName, 120) || null,
      earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paidAmount: admin.firestore.FieldValue.delete(),
      paidAt: admin.firestore.FieldValue.delete(),
      payoutIds: admin.firestore.FieldValue.delete(),
      voidedAt: admin.firestore.FieldValue.delete(),
      voidReason: admin.firestore.FieldValue.delete(),
      correctedBy: admin.firestore.FieldValue.delete(),
      correctedAt: admin.firestore.FieldValue.delete(),
    };
    if (!snap.exists) payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    tx.set(ref, payload, { merge: true });
    return true;
  });
}

export const onDemoSessionEarningsWrite = onDocumentWritten(
  { document: 'demoSessions/{demoId}', region: REGION },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;

    const demoId = text(event.params.demoId, 120);
    if (!demoId) return;
    const before = change.before.exists ? (change.before.data() || {}) : {};
    const after = (change.after.data() || {}) as Record<string, unknown>;

    const beforeStatus = normalized(before.status);
    const afterStatus = normalized(after.status);
    const beforeConversion = normalized(before.conversionStatus);
    const afterConversion = normalized(after.conversionStatus);
    const outcome = normalized(after.outcome);

    const completionTransition = beforeStatus !== 'completed' && afterStatus === 'completed';
    const shouldCreditCompletion = completionTransition && PAYABLE_COMPLETION_OUTCOMES.has(outcome);
    const shouldCreditEnrollment = beforeConversion !== 'enrolled' && afterConversion === 'enrolled';

    if (completionTransition && !shouldCreditCompletion) {
      logger.info('Demo completion payout skipped because demo was not delivered', {
        demoId,
        outcome: outcome || 'unknown',
      });
    }
    if (!shouldCreditCompletion && !shouldCreditEnrollment) return;

    const teacherId = text(after.completedByTeacherId || after.assignedTeacherId, 120);
    const teacherName = text(after.completedByTeacherName || after.assignedTeacherName, 120) || 'Teacher';
    if (!teacherId) {
      logger.warn('Skipping demo earning because completion teacher is missing', {
        demoId,
        shouldCreditCompletion,
        shouldCreditEnrollment,
      });
      return;
    }

    if (shouldCreditCompletion) {
      const earningId = `demo_${demoId}_completion`;
      const created = await ensureEarning({
        earningId,
        demoId,
        teacherId,
        teacherName,
        amount: DEMO_COMPLETION_PAYOUT_AMOUNT,
        source: 'demo_completed',
        monthKey: monthKeyIst(after.completedAt || after.lastUpdatedAt),
        demo: after,
      });
      if (created) {
        logger.info('Credited delivered demo completion earning', {
          demoId,
          earningId,
          teacherId,
          amount: DEMO_COMPLETION_PAYOUT_AMOUNT,
        });
      }
    }

    if (shouldCreditEnrollment) {
      const earningId = `demo_${demoId}_enrollment_bonus`;
      const created = await ensureEarning({
        earningId,
        demoId,
        teacherId,
        teacherName,
        amount: DEMO_ENROLLMENT_BONUS_AMOUNT,
        source: 'demo_enrolled_bonus',
        monthKey: monthKeyIst(after.enrolledAt || after.lastUpdatedAt || after.completedAt),
        demo: after,
      });
      if (created) {
        logger.info('Credited successful enrollment bonus', {
          demoId,
          earningId,
          teacherId,
          amount: DEMO_ENROLLMENT_BONUS_AMOUNT,
        });
      }
    }
  },
);
