import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { resolveSessionTeacherPayNormalRate } from './helpers/sessionFinancialRates';
import {
  buildTeacherEarningAdjustmentId,
  buildTeacherEarningAdjustmentRecord,
  computeTeacherEarningAdjustmentDelta,
  teacherEarningAdjustmentMatches,
  TEACHER_EARNING_ADJUSTMENT_SOURCE,
  type TeacherEarningAdjustmentDisposition,
} from './helpers/teacherEarningAdjustmentLedger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MAX_SESSION_ADJUSTMENTS = 50;

function clean(value: unknown, maxLen = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

function normalizeStatus(value: unknown): string {
  return clean(value, 80).toLowerCase();
}

function nonNegativeMoney(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function signedMoney(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDisposition(value: unknown): TeacherEarningAdjustmentDisposition | null {
  const raw = clean(value, 80).toLowerCase();
  if (raw === 'credit_teacher') return 'credit_teacher';
  if (raw === 'retain_school') return 'retain_school';
  return null;
}

function isPaidOrPartiallyPaid(earning: Record<string, unknown>): boolean {
  const status = normalizeStatus(earning.status);
  return status === 'paid' || status === 'settled' || nonNegativeMoney(earning.paidAmount) > 0;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toDate?: () => Date; seconds?: number };
    if (typeof candidate.toDate === 'function') {
      const date = candidate.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }
    if (Number.isFinite(candidate.seconds)) {
      const date = new Date(Number(candidate.seconds) * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKeyIst(value: unknown): string {
  const date = toDate(value);
  if (!date) return '';
  const ist = new Date(date.getTime() + 330 * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}`;
}

function adjustmentStateMatches(
  row: Record<string, unknown>,
  decisionId: string,
  targetEntitlement: number,
  netAdjustments: number,
  latestAdjustmentId: string | null,
): boolean {
  return (
    row.teacherPayAdjustmentRequired === false &&
    normalizeStatus(row.teacherPayAdjustmentStatus) === 'posted' &&
    clean(row.teacherPayAdjustmentDecisionId, 160) === decisionId &&
    nonNegativeMoney(row.teacherPayNetEntitlementAmount) === targetEntitlement &&
    signedMoney(row.teacherPayAdjustmentNetAmount) === netAdjustments &&
    clean(row.teacherPayAdjustmentLatestId, 240) === clean(latestAdjustmentId, 240)
  );
}

function repairStateMatches(
  row: Record<string, unknown>,
  decisionId: string,
  reason: string,
): boolean {
  return (
    row.teacherPayAdjustmentRepairRequired === true &&
    clean(row.teacherPayAdjustmentRepairDecisionId, 160) === decisionId &&
    clean(row.teacherPayAdjustmentRepairReason, 160) === reason
  );
}

export const onTeacherEarningAdjustmentSync = onDocumentWritten(
  {
    document: 'teacherEarnings/{earningId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;

    const earning = (change.after.data() || {}) as Record<string, unknown>;
    const earningId = clean(event.params.earningId, 160);
    const sessionId = clean(earning.sessionId, 160) || earningId;
    if (!sessionId || !earningId) return;
    if (clean(earning.source, 120) !== 'session_present_completed') return;
    if (normalizeStatus(earning.status) === 'void') return;
    if (!isPaidOrPartiallyPaid(earning)) return;

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) return;
    const session = (sessionSnap.data() || {}) as Record<string, unknown>;

    const decisionId = clean(session.teacherPayDecisionId, 160);
    const correctionId = clean(session.teacherPayDecisionCorrectionId, 160);
    const disposition = normalizeDisposition(session.teacherPayDisposition);
    if (!decisionId || !correctionId || !disposition) return;
    if (clean(session.teacherPayDecisionSource, 120) !== TEACHER_EARNING_ADJUSTMENT_SOURCE) return;
    if (normalizeStatus(session.teacherPayDecisionStatus) !== 'applied') return;

    const adjustmentMonthKey = monthKeyIst(session.teacherPayDecisionAt) || monthKeyIst(event.time);
    if (!adjustmentMonthKey) return;

    const decisionRef = sessionRef.collection('teacherPayDecisions').doc(decisionId);
    const adjustmentId = buildTeacherEarningAdjustmentId(sessionId, correctionId);
    const adjustmentRef = db.collection('teacherEarningAdjustments').doc(adjustmentId);
    const adjustmentsQuery = db
      .collection('teacherEarningAdjustments')
      .where('sessionId', '==', sessionId)
      .limit(MAX_SESSION_ADJUSTMENTS);

    const outcome = await db.runTransaction(async (tx) => {
      const [latestEarningSnap, latestSessionSnap, decisionSnap, adjustmentSnap, adjustmentsSnap] = await Promise.all([
        tx.get(change.after.ref),
        tx.get(sessionRef),
        tx.get(decisionRef),
        tx.get(adjustmentRef),
        tx.get(adjustmentsQuery),
      ]);
      if (!latestEarningSnap.exists || !latestSessionSnap.exists || !decisionSnap.exists) return 'no-op';

      const latestEarning = (latestEarningSnap.data() || {}) as Record<string, unknown>;
      const latestSession = (latestSessionSnap.data() || {}) as Record<string, unknown>;
      const latestDecision = (decisionSnap.data() || {}) as Record<string, unknown>;
      const latestDecisionId = clean(latestSession.teacherPayDecisionId, 160);
      const latestCorrectionId = clean(latestSession.teacherPayDecisionCorrectionId, 160);
      const latestDisposition = normalizeDisposition(latestSession.teacherPayDisposition);

      if (
        latestDecisionId !== decisionId ||
        latestCorrectionId !== correctionId ||
        latestDisposition !== disposition ||
        clean(latestSession.teacherPayDecisionSource, 120) !== TEACHER_EARNING_ADJUSTMENT_SOURCE ||
        normalizeStatus(latestSession.teacherPayDecisionStatus) !== 'applied' ||
        normalizeStatus(latestDecision.status) !== 'applied' ||
        clean(latestDecision.attendanceCorrectionId, 160) !== correctionId ||
        !isPaidOrPartiallyPaid(latestEarning)
      ) {
        return 'no-op';
      }

      const normalRate = resolveSessionTeacherPayNormalRate(latestSession, null);
      if (!(normalRate > 0)) {
        const reason = 'adjustment_normal_teacher_rate_unresolved';
        if (!repairStateMatches(latestEarning, decisionId, reason)) {
          tx.set(change.after.ref, {
            teacherPayAdjustmentRepairRequired: true,
            teacherPayAdjustmentRepairDecisionId: decisionId,
            teacherPayAdjustmentRepairReason: reason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        if (!repairStateMatches(latestSession, decisionId, reason)) {
          tx.set(sessionRef, {
            teacherPayAdjustmentRepairRequired: true,
            teacherPayAdjustmentRepairDecisionId: decisionId,
            teacherPayAdjustmentRepairReason: reason,
            teacherPayAdjustmentRepairDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        return 'repair-required';
      }

      if (adjustmentsSnap.size >= MAX_SESSION_ADJUSTMENTS) {
        const reason = 'adjustment_history_limit_reached';
        if (!repairStateMatches(latestEarning, decisionId, reason)) {
          tx.set(change.after.ref, {
            teacherPayAdjustmentRepairRequired: true,
            teacherPayAdjustmentRepairDecisionId: decisionId,
            teacherPayAdjustmentRepairReason: reason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        if (!repairStateMatches(latestSession, decisionId, reason)) {
          tx.set(sessionRef, {
            teacherPayAdjustmentRepairRequired: true,
            teacherPayAdjustmentRepairDecisionId: decisionId,
            teacherPayAdjustmentRepairReason: reason,
            teacherPayAdjustmentRepairDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        return 'repair-required';
      }

      const postedAdjustments = adjustmentsSnap.docs
        .map((docSnap) => ({ id: docSnap.id, data: (docSnap.data() || {}) as Record<string, unknown> }))
        .filter((row) =>
          normalizeStatus(row.data.status) === 'posted' &&
          clean(row.data.source, 120) === TEACHER_EARNING_ADJUSTMENT_SOURCE,
        );
      const adjustmentsTotal = postedAdjustments.reduce((sum, row) => sum + signedMoney(row.data.amount), 0);
      const existingForCorrection = adjustmentSnap.exists
        ? ((adjustmentSnap.data() || {}) as Record<string, unknown>)
        : null;
      const existingCorrectionAmount = existingForCorrection ? signedMoney(existingForCorrection.amount) : 0;
      const priorTotalForExpected = adjustmentsTotal - existingCorrectionAmount;

      if (existingForCorrection) {
        const expectedExisting = buildTeacherEarningAdjustmentRecord({
          sessionId,
          earningId,
          decisionId,
          correctionId,
          normalRate,
          existingAdjustmentsTotal: priorTotalForExpected,
          adjustmentMonthKey,
          session: latestSession,
          earning: latestEarning,
        });
        if (!expectedExisting || !teacherEarningAdjustmentMatches(existingForCorrection, expectedExisting)) {
          const reason = 'adjustment_ledger_conflict';
          if (!repairStateMatches(latestEarning, decisionId, reason)) {
            tx.set(change.after.ref, {
              teacherPayAdjustmentRepairRequired: true,
              teacherPayAdjustmentRepairDecisionId: decisionId,
              teacherPayAdjustmentRepairReason: reason,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          if (!repairStateMatches(latestSession, decisionId, reason)) {
            tx.set(sessionRef, {
              teacherPayAdjustmentRepairRequired: true,
              teacherPayAdjustmentRepairDecisionId: decisionId,
              teacherPayAdjustmentRepairReason: reason,
              teacherPayAdjustmentRepairDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          return 'conflict';
        }

        const target = expectedExisting.targetTeacherEntitlement;
        const netAdjustment = adjustmentsTotal;
        const earningMatches = adjustmentStateMatches(latestEarning, decisionId, target, netAdjustment, adjustmentId);
        const sessionMatches = adjustmentStateMatches(latestSession, decisionId, target, netAdjustment, adjustmentId);
        if (!earningMatches) {
          tx.set(change.after.ref, {
            teacherPayAdjustmentRequired: false,
            teacherPayAdjustmentStatus: 'posted',
            teacherPayAdjustmentDecisionId: decisionId,
            teacherPayAdjustmentLatestId: adjustmentId,
            teacherPayAdjustmentNetAmount: netAdjustment,
            teacherPayNetEntitlementAmount: target,
            teacherPayAdjustmentPostedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        if (!sessionMatches) {
          tx.set(sessionRef, {
            teacherPayAdjustmentRequired: false,
            teacherPayAdjustmentStatus: 'posted',
            teacherPayAdjustmentDecisionId: decisionId,
            teacherPayAdjustmentLatestId: adjustmentId,
            teacherPayAdjustmentNetAmount: netAdjustment,
            teacherPayNetEntitlementAmount: target,
            teacherPayAdjustmentPostedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        tx.set(decisionRef, {
          financialOutcome: expectedExisting.amount < 0 ? 'adjusted_after_payment' : 'restored_after_adjustment',
          teacherEarningId: earningId,
          teacherEarningAdjustmentId: adjustmentId,
          teacherEarningAdjustmentAmount: expectedExisting.amount,
          netTeacherEntitlement: target,
          financialOutcomeRecordedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return 'replayed';
      }

      const calculation = computeTeacherEarningAdjustmentDelta({
        normalRate,
        existingAdjustmentsTotal: adjustmentsTotal,
        disposition,
      });
      if (!calculation) return 'repair-required';

      if (calculation.delta === 0) {
        const latestAdjustmentId = postedAdjustments.length > 0
          ? postedAdjustments[postedAdjustments.length - 1].id
          : null;
        const earningMatches = adjustmentStateMatches(
          latestEarning,
          decisionId,
          calculation.targetEntitlement,
          adjustmentsTotal,
          latestAdjustmentId,
        );
        const sessionMatches = adjustmentStateMatches(
          latestSession,
          decisionId,
          calculation.targetEntitlement,
          adjustmentsTotal,
          latestAdjustmentId,
        );
        if (!earningMatches) {
          tx.set(change.after.ref, {
            teacherPayAdjustmentRequired: false,
            teacherPayAdjustmentStatus: 'posted',
            teacherPayAdjustmentDecisionId: decisionId,
            teacherPayAdjustmentLatestId: latestAdjustmentId,
            teacherPayAdjustmentNetAmount: adjustmentsTotal,
            teacherPayNetEntitlementAmount: calculation.targetEntitlement,
            teacherPayAdjustmentPostedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        if (!sessionMatches) {
          tx.set(sessionRef, {
            teacherPayAdjustmentRequired: false,
            teacherPayAdjustmentStatus: 'posted',
            teacherPayAdjustmentDecisionId: decisionId,
            teacherPayAdjustmentLatestId: latestAdjustmentId,
            teacherPayAdjustmentNetAmount: adjustmentsTotal,
            teacherPayNetEntitlementAmount: calculation.targetEntitlement,
            teacherPayAdjustmentPostedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        tx.set(decisionRef, {
          financialOutcome: 'adjustment_already_satisfied',
          teacherEarningId: earningId,
          teacherEarningAdjustmentId: latestAdjustmentId,
          teacherEarningAdjustmentAmount: 0,
          netTeacherEntitlement: calculation.targetEntitlement,
          financialOutcomeRecordedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return 'already-satisfied';
      }

      const record = buildTeacherEarningAdjustmentRecord({
        sessionId,
        earningId,
        decisionId,
        correctionId,
        normalRate,
        existingAdjustmentsTotal: adjustmentsTotal,
        adjustmentMonthKey,
        session: latestSession,
        earning: latestEarning,
      });
      if (!record) return 'repair-required';

      tx.create(adjustmentRef, {
        ...record,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        postedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const nextAdjustmentsTotal = adjustmentsTotal + record.amount;
      tx.set(change.after.ref, {
        teacherPayAdjustmentRequired: false,
        teacherPayAdjustmentStatus: 'posted',
        teacherPayAdjustmentDecisionId: decisionId,
        teacherPayAdjustmentLatestId: adjustmentId,
        teacherPayAdjustmentNetAmount: nextAdjustmentsTotal,
        teacherPayNetEntitlementAmount: record.resultingNetEntitlement,
        teacherPayAdjustmentPostedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      tx.set(sessionRef, {
        teacherPayAdjustmentRequired: false,
        teacherPayAdjustmentStatus: 'posted',
        teacherPayAdjustmentDecisionId: decisionId,
        teacherPayAdjustmentLatestId: adjustmentId,
        teacherPayAdjustmentNetAmount: nextAdjustmentsTotal,
        teacherPayNetEntitlementAmount: record.resultingNetEntitlement,
        teacherPayAdjustmentPostedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      tx.set(decisionRef, {
        financialOutcome: record.amount < 0 ? 'adjusted_after_payment' : 'restored_after_adjustment',
        teacherEarningId: earningId,
        teacherEarningAdjustmentId: adjustmentId,
        teacherEarningAdjustmentAmount: record.amount,
        netTeacherEntitlement: record.resultingNetEntitlement,
        financialOutcomeRecordedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      return record.amount < 0 ? 'debit-posted' : 'credit-posted';
    });

    if (outcome === 'debit-posted' || outcome === 'credit-posted') {
      logger.info('onTeacherEarningAdjustmentSync: immutable teacher earning adjustment posted', {
        sessionId,
        earningId,
        decisionId,
        correctionId,
        adjustmentId,
        outcome,
      });
    } else if (outcome === 'repair-required' || outcome === 'conflict') {
      logger.error('onTeacherEarningAdjustmentSync: adjustment requires finance repair', {
        sessionId,
        earningId,
        decisionId,
        correctionId,
        outcome,
      });
    }
  },
);
