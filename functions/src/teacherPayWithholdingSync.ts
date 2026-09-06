import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {
  isRetainSchoolTeacherPayDecisionActive,
  resolveSessionTeacherPayNormalRate,
} from './helpers/sessionFinancialRates';
import {
  buildTeacherPayWithholdingLedgerRecord,
  teacherPayWithholdingLedgerMatches,
  TEACHER_PAY_WITHHOLDING_SOURCE,
} from './helpers/teacherPayWithholdingLedger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const SOURCE = TEACHER_PAY_WITHHOLDING_SOURCE;

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

function hasAdjustmentMarker(
  row: Record<string, unknown>,
  reason: string,
  decisionId: string,
): boolean {
  return (
    row.teacherPayAdjustmentRequired === true &&
    clean(row.teacherPayAdjustmentReason) === reason &&
    clean(row.teacherPayDecisionId) === decisionId
  );
}

function hasLedgerRepairMarker(
  row: Record<string, unknown>,
  reason: string,
  decisionId: string,
): boolean {
  return (
    row.teacherPayLedgerRepairRequired === true &&
    clean(row.teacherPayLedgerRepairReason) === reason &&
    clean(row.teacherPayDecisionId) === decisionId
  );
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
    money(earning.teacherPayRateSnapshot) === normalRate &&
    clean(earning.teacherPayWithholdingId) !== ''
  );
}

function desiredDecisionOutcomeMatches(
  decision: Record<string, unknown>,
  normalRate: number,
  earningId: string,
  withholdingId: string,
): boolean {
  return (
    clean(decision.financialOutcome) === 'withheld' &&
    money(decision.expectedTeacherAmount) === normalRate &&
    money(decision.creditedTeacherAmount) === 0 &&
    money(decision.schoolRetainedAmount) === normalRate &&
    clean(decision.teacherEarningId) === earningId &&
    clean(decision.teacherPayWithholdingId) === withholdingId
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

    // Brick 3 records are immutable. Never create one while the correction decision
    // is merely pending, because the attendanceCorrectionId has not been linked yet.
    if (
      normalizeStatus(session.teacherPayDecisionStatus) !== 'applied' ||
      !clean(session.teacherPayDecisionCorrectionId)
    ) {
      return;
    }

    const normalRate = resolveSessionTeacherPayNormalRate(session, null);
    if (!(normalRate > 0)) {
      if (hasAdjustmentMarker(earning, 'normal_teacher_rate_unresolved', decisionId)) return;
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
      const earningMarked = hasAdjustmentMarker(earning, 'earning_already_paid', decisionId);
      const sessionMarked =
        session.teacherPayAdjustmentRequired === true &&
        clean(session.teacherPayAdjustmentReason) === 'earning_already_paid' &&
        clean(session.teacherPayDecisionId) === decisionId;
      if (earningMarked && sessionMarked) return;

      const batch = db.batch();
      if (!earningMarked) {
        batch.set(change.after.ref, {
          teacherPayAdjustmentRequired: true,
          teacherPayAdjustmentReason: 'earning_already_paid',
          requestedTeacherPayDisposition: 'retain_school',
          teacherPayDecisionId: decisionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      if (!sessionMarked) {
        batch.set(sessionRef, {
          teacherPayAdjustmentRequired: true,
          teacherPayAdjustmentReason: 'earning_already_paid',
          teacherPayDecisionId: decisionId,
          teacherPayAdjustmentDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      await batch.commit();
      logger.error('onTeacherPayWithholdingSync: earning already paid; adjustment required', {
        earningId,
        sessionId,
        decisionId,
        paidAmount,
      });
      return;
    }

    const withholdingRef = db.collection('teacherPayWithholdings').doc(sessionId);
    const decisionRef = sessionRef.collection('teacherPayDecisions').doc(decisionId);

    const outcome = await db.runTransaction(async (tx) => {
      const [latestEarningSnap, latestSessionSnap, withholdingSnap, decisionSnap] = await Promise.all([
        tx.get(change.after.ref),
        tx.get(sessionRef),
        tx.get(withholdingRef),
        tx.get(decisionRef),
      ]);
      if (!latestEarningSnap.exists || !latestSessionSnap.exists) return 'no-op';

      const latestEarning = (latestEarningSnap.data() || {}) as Record<string, unknown>;
      const latestSession = (latestSessionSnap.data() || {}) as Record<string, unknown>;
      const latestDecision = (decisionSnap.data() || {}) as Record<string, unknown>;
      if (!isRetainSchoolTeacherPayDecisionActive(latestSession)) return 'no-op';
      if (clean(latestSession.teacherPayDecisionId) !== decisionId) return 'no-op';

      const latestCorrectionId = clean(latestSession.teacherPayDecisionCorrectionId);
      if (
        normalizeStatus(latestSession.teacherPayDecisionStatus) !== 'applied' ||
        !latestCorrectionId
      ) {
        return 'awaiting-decision-link';
      }

      if (
        !decisionSnap.exists ||
        normalizeStatus(latestDecision.status) !== 'applied' ||
        clean(latestDecision.attendanceCorrectionId) !== latestCorrectionId
      ) {
        const reason = 'withholding_decision_audit_mismatch';
        if (!hasLedgerRepairMarker(latestEarning, reason, decisionId)) {
          tx.set(change.after.ref, {
            teacherPayLedgerRepairRequired: true,
            teacherPayLedgerRepairReason: reason,
            teacherPayDecisionId: decisionId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        if (!hasLedgerRepairMarker(latestSession, reason, decisionId)) {
          tx.set(sessionRef, {
            teacherPayLedgerRepairRequired: true,
            teacherPayLedgerRepairReason: reason,
            teacherPayDecisionId: decisionId,
            teacherPayLedgerRepairDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        return 'ledger-repair-required';
      }

      const latestPaidAmount = money(latestEarning.paidAmount);
      const latestStatus = normalizeStatus(latestEarning.status);
      if (latestPaidAmount > 0 || latestStatus === 'paid' || latestStatus === 'settled') {
        if (!hasAdjustmentMarker(latestEarning, 'earning_already_paid', decisionId)) {
          tx.set(change.after.ref, {
            teacherPayAdjustmentRequired: true,
            teacherPayAdjustmentReason: 'earning_already_paid',
            requestedTeacherPayDisposition: 'retain_school',
            teacherPayDecisionId: decisionId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        const latestSessionMarked =
          latestSession.teacherPayAdjustmentRequired === true &&
          clean(latestSession.teacherPayAdjustmentReason) === 'earning_already_paid' &&
          clean(latestSession.teacherPayDecisionId) === decisionId;
        if (!latestSessionMarked) {
          tx.set(sessionRef, {
            teacherPayAdjustmentRequired: true,
            teacherPayAdjustmentReason: 'earning_already_paid',
            teacherPayDecisionId: decisionId,
            teacherPayAdjustmentDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        return 'adjustment-required';
      }

      const ledgerRecord = buildTeacherPayWithholdingLedgerRecord({
        sessionId,
        earningId,
        decisionId,
        normalRate,
        session: latestSession,
        earning: latestEarning,
      });

      if (!ledgerRecord) {
        const reason = 'withholding_ledger_identity_unresolved';
        if (!hasLedgerRepairMarker(latestEarning, reason, decisionId)) {
          tx.set(change.after.ref, {
            teacherPayLedgerRepairRequired: true,
            teacherPayLedgerRepairReason: reason,
            teacherPayDecisionId: decisionId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        if (!hasLedgerRepairMarker(latestSession, reason, decisionId)) {
          tx.set(sessionRef, {
            teacherPayLedgerRepairRequired: true,
            teacherPayLedgerRepairReason: reason,
            teacherPayDecisionId: decisionId,
            teacherPayLedgerRepairDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        return 'ledger-repair-required';
      }

      if (withholdingSnap.exists) {
        const existingLedger = (withholdingSnap.data() || {}) as Record<string, unknown>;
        if (!teacherPayWithholdingLedgerMatches(existingLedger, ledgerRecord)) {
          const reason = 'withholding_ledger_conflict';
          if (!hasLedgerRepairMarker(latestEarning, reason, decisionId)) {
            tx.set(change.after.ref, {
              teacherPayLedgerRepairRequired: true,
              teacherPayLedgerRepairReason: reason,
              teacherPayDecisionId: decisionId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          if (!hasLedgerRepairMarker(latestSession, reason, decisionId)) {
            tx.set(sessionRef, {
              teacherPayLedgerRepairRequired: true,
              teacherPayLedgerRepairReason: reason,
              teacherPayDecisionId: decisionId,
              teacherPayLedgerRepairDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          return 'ledger-conflict';
        }
      }

      const earningMatches = desiredWithholdingStateMatches(latestEarning, normalRate, decisionId);
      const decisionMatches = desiredDecisionOutcomeMatches(latestDecision, normalRate, earningId, sessionId);
      if (withholdingSnap.exists && earningMatches && decisionMatches) return 'no-op';

      if (!withholdingSnap.exists) {
        tx.create(withholdingRef, {
          ...ledgerRecord,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      if (!earningMatches) {
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
          attendanceCorrectionId: latestCorrectionId,
          expectedAmount: normalRate,
          creditedAmount: 0,
          withheldAmount: normalRate,
          schoolRetainedAmount: normalRate,
          teacherPayRateSnapshot: normalRate,
          teacherPayWithholdingId: sessionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      if (!decisionMatches) {
        tx.set(decisionRef, {
          financialOutcome: 'withheld',
          expectedTeacherAmount: normalRate,
          creditedTeacherAmount: 0,
          schoolRetainedAmount: normalRate,
          teacherEarningId: earningId,
          teacherPayWithholdingId: sessionId,
          financialOutcomeRecordedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      return withholdingSnap.exists ? 'synced' : 'created';
    });

    if (outcome === 'created' || outcome === 'synced') {
      logger.info('onTeacherPayWithholdingSync: teacher pay retained by school', {
        earningId,
        sessionId,
        decisionId,
        normalRate,
        withholdingId: sessionId,
        ledgerOutcome: outcome,
      });
    } else if (outcome === 'ledger-conflict' || outcome === 'ledger-repair-required') {
      logger.error('onTeacherPayWithholdingSync: withholding ledger requires repair', {
        earningId,
        sessionId,
        decisionId,
        ledgerOutcome: outcome,
      });
    }
  },
);
