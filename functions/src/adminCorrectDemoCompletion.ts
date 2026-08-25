import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from './helpers/adminGuard';
import {
  buildDemoCorrectionCycleKey,
  isDemoCorrectionEarningSource,
  resolveDemoCorrectionPaidAmount,
} from './helpers/demoCompletionCorrection';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MAX_HISTORY_ENTRIES = 40;
const IST_OFFSET_MINUTES = 330;

type HistoryEntry = {
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  atMs: number;
  note?: string | null;
};

const text = (value: unknown, maxLength = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const numberValue = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalize = (value: unknown): string => text(value, 120).toLowerCase();

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toDate?: () => Date; seconds?: number };
    if (typeof candidate.toDate === 'function') {
      const date = candidate.toDate();
      return Number.isFinite(date.getTime()) ? date : null;
    }
    if (typeof candidate.seconds === 'number') return new Date(candidate.seconds * 1000);
  }
  return null;
};

const toMillis = (value: unknown): number => toDate(value)?.getTime() || 0;

const monthKeyIst = (value: unknown): string => {
  const base = toDate(value) || new Date();
  const ist = new Date(base.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}`;
};

const dayKeyIst = (value: Date): string => {
  const ist = new Date(value.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`;
};

const normalizedHistory = (value: unknown): HistoryEntry[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      action: text(item.action, 120),
      actorId: text(item.actorId, 120) || null,
      actorName: text(item.actorName, 120) || null,
      atMs: numberValue(item.atMs),
      note: text(item.note, 1000) || null,
    }))
    .filter((item) => Boolean(item.action) && item.atMs > 0)
    .slice(-MAX_HISTORY_ENTRIES);
};

interface CorrectionRequest {
  demoId: string;
  reason: string;
}

interface CorrectionResponse {
  ok: true;
  demoId: string;
  status: 'open';
  reversedEarningsCount: number;
  paidAdjustmentCount: number;
  paidAdjustmentAmount: number;
}

export const adminCorrectDemoCompletion = onCall<CorrectionRequest>(
  { region: REGION },
  async (request): Promise<CorrectionResponse> => {
    await ensureAdmin(request.auth);

    const demoId = text(request.data?.demoId, 120);
    const reason = text(request.data?.reason, 1000);
    if (!demoId) throw new HttpsError('invalid-argument', 'demoId is required');
    if (!reason) throw new HttpsError('invalid-argument', 'Correction reason is required');

    const actorId = request.auth?.uid || 'admin';
    const actorName =
      text(request.auth?.token?.name, 120) ||
      text(request.auth?.token?.email, 120) ||
      'Admin';
    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);
    const earningsQuery = db.collection('teacherEarnings').where('demoId', '==', demoId);

    const result = await db.runTransaction(async (tx) => {
      const demoSnap = await tx.get(demoRef);
      if (!demoSnap.exists) throw new HttpsError('not-found', 'Demo session not found');
      const demo = (demoSnap.data() || {}) as Record<string, unknown>;
      const status = normalize(demo.status);

      if (
        status === 'open' &&
        normalize(demo.lastCorrectionType) === 'accidental_demo_completion'
      ) {
        return {
          reversedEarningsCount: numberValue(demo.lastCorrectionReversedEarningsCount),
          paidAdjustmentCount: numberValue(demo.lastCorrectionPaidAdjustmentCount),
          paidAdjustmentAmount: numberValue(demo.lastCorrectionPaidAdjustmentAmount),
        };
      }

      if (status !== 'completed') {
        throw new HttpsError('failed-precondition', 'Only a completed demo can use this correction.');
      }
      if (normalize(demo.conversionStatus) === 'enrolled') {
        throw new HttpsError(
          'failed-precondition',
          'This demo is marked enrolled. Correct the enrollment before reopening the demo.',
        );
      }
      if (text(demo.rescheduledToDemoId, 120)) {
        throw new HttpsError(
          'failed-precondition',
          'This completion created a follow-up rescheduled demo. Resolve that linked attempt before reopening this demo.',
        );
      }

      const completedAtMs = toMillis(demo.completedAt) || toMillis(demo.lastUpdatedAt);
      const cycleKey = buildDemoCorrectionCycleKey(demoId, completedAtMs);
      const earningsSnap = await tx.get(earningsQuery);
      const candidates = earningsSnap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ref: docSnap.ref,
          data: (docSnap.data() || {}) as Record<string, unknown>,
        }))
        .filter((item) => isDemoCorrectionEarningSource(item.data.source))
        .filter((item) => normalize(item.data.status) !== 'void');

      const prepared = candidates.map((item) => {
        const amount = Math.max(numberValue(item.data.amount), 0);
        const paidAmount = resolveDemoCorrectionPaidAmount(item.data, amount);
        const teacherId = text(item.data.teacherId, 120);
        const monthKey = text(item.data.monthKey, 20) || monthKeyIst(item.data.earnedAt || demo.completedAt);
        const correctionPayoutRef = paidAmount > 0
          ? db.collection('teacherPayouts').doc(
              `demo_reversal_${cycleKey}_${item.id}`.replace(/[^A-Za-z0-9_-]/g, '_'),
            )
          : null;
        return { ...item, amount, paidAmount, teacherId, monthKey, correctionPayoutRef };
      });

      const correctionPayoutSnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>();
      for (const item of prepared) {
        if (!item.correctionPayoutRef) continue;
        const snap = await tx.get(item.correctionPayoutRef);
        correctionPayoutSnaps.set(item.id, snap);
      }

      let reversedEarningsCount = 0;
      let paidAdjustmentCount = 0;
      let paidAdjustmentAmount = 0;
      const now = new Date();

      for (const item of prepared) {
        const payoutIds = Array.isArray(item.data.payoutIds)
          ? item.data.payoutIds.map((value) => text(value, 160)).filter(Boolean)
          : [];

        if (item.paidAmount > 0) {
          if (!item.teacherId || !item.correctionPayoutRef) {
            throw new HttpsError(
              'failed-precondition',
              `Paid demo earning ${item.id} is missing teacher allocation details. Nothing was changed.`,
            );
          }
          const existingCorrection = correctionPayoutSnaps.get(item.id);
          if (!existingCorrection?.exists) {
            tx.set(item.correctionPayoutRef, {
              teacherId: item.teacherId,
              teacherName: text(item.data.teacherName, 160) || null,
              amount: -item.paidAmount,
              currency: 'INR',
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              monthKey: item.monthKey,
              date: dayKeyIst(now),
              method: 'admin_adjustment',
              status: 'refunded',
              note: `Demo completion correction: ${reason}`,
              correctionType: 'demo_completion_reversal',
              correctionCycleKey: cycleKey,
              demoId,
              reversesEarningId: item.id,
              reversesPayoutIds: payoutIds,
              appliedEarningIds: [item.id],
              appliedAllocations: [{ earningId: item.id, amount: -item.paidAmount }],
              appliedAmount: -item.paidAmount,
              unappliedAmount: 0,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: actorId,
            });
          }
          paidAdjustmentCount += 1;
          paidAdjustmentAmount += item.paidAmount;
        }

        tx.set(
          item.ref,
          {
            status: 'void',
            paidAmount: 0,
            paidAt: admin.firestore.FieldValue.delete(),
            voidedAt: admin.firestore.FieldValue.serverTimestamp(),
            voidReason: `Demo completion corrected: ${reason}`,
            correctedBy: actorId,
            correctedAt: admin.firestore.FieldValue.serverTimestamp(),
            correctionType: 'demo_completion_reversal',
            correctionCycleKey: cycleKey,
            reversedPaidAmount: item.paidAmount,
            reversedPayoutIds: payoutIds,
            payoutIds: item.correctionPayoutRef
              ? admin.firestore.FieldValue.arrayUnion(item.correctionPayoutRef.id)
              : item.data.payoutIds || [],
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        reversedEarningsCount += 1;
      }

      const history = normalizedHistory(demo.history);
      history.push({
        action: 'reopened',
        actorId,
        actorName,
        atMs: Date.now(),
        note: `Accidental completion corrected: ${reason}. Reversed ${reversedEarningsCount} demo earning(s); paid adjustments ${paidAdjustmentCount}.`,
      });

      // The demo document is the single operational source of truth. We deliberately do
      // not write the linked lead here. onDemoLeadLifecycleWrite performs the one required
      // lead synchronization only when lifecycle fields actually changed.
      tx.update(demoRef, {
        status: 'open',
        assignedTeacherId: null,
        assignedTeacherName: null,
        assignedAt: null,
        teacherConfirmedDate: null,
        teacherConfirmedTime: null,
        teacherPreDemoNote: null,
        outcome: null,
        teacherRemarks: null,
        teacherRecommendation: null,
        childLevelObserved: null,
        readingLevel: null,
        phonicsAwareness: null,
        grammarEvaluation: null,
        speakingConfidence: null,
        attentionSpan: null,
        parentExpectation: null,
        recommendedNextStep: null,
        completedByTeacherId: null,
        completedByTeacherName: null,
        conversionStatus: null,
        recommendedCourse: null,
        recommendedClassType: null,
        recommendedFrequency: null,
        feeDiscussed: null,
        followUpDate: null,
        followUpCallStatus: null,
        followUpCallCompletedAt: null,
        admissionNotConfirmedReason: null,
        completedAt: null,
        reopenedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastCorrectionType: 'accidental_demo_completion',
        lastCorrectionReason: reason,
        lastCorrectionCycleKey: cycleKey,
        lastCorrectionBy: actorId,
        lastCorrectionAt: admin.firestore.FieldValue.serverTimestamp(),
        lastCorrectionReversedEarningsCount: reversedEarningsCount,
        lastCorrectionPaidAdjustmentCount: paidAdjustmentCount,
        lastCorrectionPaidAdjustmentAmount: paidAdjustmentAmount,
        history: history.slice(-MAX_HISTORY_ENTRIES),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: actorId,
      });

      return { reversedEarningsCount, paidAdjustmentCount, paidAdjustmentAmount };
    });

    logger.info('Admin corrected accidental demo completion', {
      demoId,
      actorId,
      reversedEarningsCount: result.reversedEarningsCount,
      paidAdjustmentCount: result.paidAdjustmentCount,
      paidAdjustmentAmount: result.paidAdjustmentAmount,
    });

    return {
      ok: true,
      demoId,
      status: 'open',
      ...result,
    };
  },
);
