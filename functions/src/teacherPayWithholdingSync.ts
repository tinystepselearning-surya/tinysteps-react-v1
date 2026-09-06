import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {
  isRetainSchoolTeacherPayDecisionActive,
  resolveSessionTeacherPayNormalRate,
} from './helpers/sessionFinancialRates';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const SOURCE = 'admin-attendance-correction';

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function money(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeStatus(value: unknown): string {
  return clean(value).toLowerCase();
}

function desiredWithholdingStateMatches(
  earning: Record<string, unknown>,
  normalRate: number,
  decisionId: string,
): boolean {
  return (
    money(earning.amount) === 0 &&
    normalizeStatus(earning.status) === 'withheld' &&
    earning.payable === false &&
    clean(earning.teacherPayDisposition) === 'retain_school' &&
    clean(earning.teacherPayDecisionId) === decisionId &&
    money(earning.expectedAmount) === normalRate &&
    money(earning.creditedAmount) === 0 &&
    money(earning.withheldAmount) === normalRate &&
    money(earning.schoolRetainedAmount) === normalRate &&
    money(earning.teacherPayRateSnapshot) === normalRate
  );
}

export const onTeacherPayWithholdingSync = onDocumentWritten(
  {
    document: 'teacherEarnings/{earningId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;

    const earning = (change.after.data() || {}) as Record<string, unknown>;
    const earningId = clean(event.params.earningId);
    const sessionId = clean(earning.sessionId) || earningId;
    if (!sessionId) return;
    if (clean(earning.source) !== 'session_present_completed') return;
    if (normalizeStatus(earning.status) === 'void') return;

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) return;
    const session = (sessionSnap.data() || {}) as Record<string, unknown>;
    if (!isRetainSchoolTeacherPayDecisionActive(session)) return;

    const decisionId = clean(session.teacherPayDecisionId);
    if (!decisionId || clean(session.teacherPayDecisionSource) !== SOURCE) return;

    const normalRate = resolveSessionTeacherPayNormalRate(session, null);
    if (!(normalRate > 0)) {
      logger.error('onTeacherPayWithholdingSync: normal teacher rate unresolved', {
        earningId,
        sessionId,
        decisionId,
      });
      await change.after.ref.set({
        teacherPayAdjustmentRequired: true,
        teacherPayAdjustmentReason: 'normal_teacher_rate_unresolved',
        teacherPayDecisionId: decisionId,
        teacherPayDisposition: 'retain_school',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      return;
    }

    const paidAmount = money(earning.paidAmount);
    const earningStatus = normalizeStatus(earning.status);
    if (paidAmount > 0 || earningStatus === 'paid' || earningStatus === 'settled') {
      await change.after.ref.set({
        teacherPayAdjustmentRequired: true,
        teacherPayAdjustmentReason: 'earning_already_paid',
        requestedTeacherPayDisposition: 'retain_school',
        teacherPayDecisionId: decisionId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      await sessionRef.set({
        teacherPayAdjustmentRequired: true,
        teacherPayAdjustmentReason: 'earning_already_paid',
        teacherPayAdjustmentDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      logger.error('onTeacherPayWithholdingSync: earning already paid; adjustment required', {
        earningId,
        sessionId,
        decisionId,
        paidAmount,
      });
      return;
    }

    if (desiredWithholdingStateMatches(earning, normalRate, decisionId)) return;

    await db.runTransaction(async (tx) => {
      const [latestEarningSnap, latestSessionSnap] = await Promise.all([
        tx.get(change.after.ref),
        tx.get(sessionRef),
      ]);
      if (!latestEarningSnap.exists || !latestSessionSnap.exists) return;

      const latestEarning = (latestEarningSnap.data() || {}) as Record<string, unknown>;
      const latestSession = (latestSessionSnap.data() || {}) as Record<string, unknown>;
      if (!isRetainSchoolTeacherPayDecisionActive(latestSession)) return;
      if (clean(latestSession.teacherPayDecisionId) !== decisionId) return;

      const latestPaidAmount = money(latestEarning.paidAmount);
      const latestStatus = normalizeStatus(latestEarning.status);
      if (latestPaidAmount > 0 || latestStatus === 'paid' || latestStatus === 'settled') {
        tx.set(change.after.ref, {
          teacherPayAdjustmentRequired: true,
          teacherPayAdjustmentReason: 'earning_already_paid',
          requestedTeacherPayDisposition: 'retain_school',
          teacherPayDecisionId: decisionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        tx.set(sessionRef, {
          teacherPayAdjustmentRequired: true,
          teacherPayAdjustmentReason: 'earning_already_paid',
          teacherPayAdjustmentDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return;
      }

      tx.set(change.after.ref, {
        amount: 0,
        status: 'withheld',
        payable: false,
        teacherPayDisposition: 'retain_school',
        teacherPayDecisionId: decisionId,
        teacherPayDecisionSource: SOURCE,
        teacherPayDecisionReasonCode: latestSession.teacherPayDecisionReasonCode || null,
        teacherPayDecisionReason: latestSession.teacherPayDecisionReason || null,
        teacherPayDecisionByUid: latestSession.teacherPayDecisionByUid || null,
        teacherPayDecisionByName: latestSession.teacherPayDecisionByName || null,
        teacherPayDecisionAt: latestSession.teacherPayDecisionAt || null,
        attendanceCorrectionId: latestSession.teacherPayDecisionCorrectionId || null,
        expectedAmount: normalRate,
        creditedAmount: 0,
        withheldAmount: normalRate,
        schoolRetainedAmount: normalRate,
        teacherPayRateSnapshot: normalRate,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      const decisionRef = sessionRef.collection('teacherPayDecisions').doc(decisionId);
      tx.set(decisionRef, {
        financialOutcome: 'withheld',
        expectedTeacherAmount: normalRate,
        creditedTeacherAmount: 0,
        schoolRetainedAmount: normalRate,
        teacherEarningId: earningId,
        financialOutcomeRecordedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    logger.info('onTeacherPayWithholdingSync: teacher pay retained by school', {
      earningId,
      sessionId,
      decisionId,
      normalRate,
    });
  },
);
