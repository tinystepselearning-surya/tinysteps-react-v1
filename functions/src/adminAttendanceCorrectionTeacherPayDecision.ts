import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { normalizeTeacherPayDisposition, type TeacherPayDisposition } from './helpers/sessionFinancialRates';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const DECISION_VALID_FOR_MS = 15 * 60 * 1000;
const SOURCE = 'admin-attendance-correction';
const CALLABLE_CORS_ORIGINS: Array<string | RegExp> = [
  'http://localhost:5173',
  'https://tinystepslearning.com',
  'https://www.tinystepslearning.com',
  'https://tinysteps-react-v1.web.app',
  'https://tinysteps-react-v1.firebaseapp.com',
];

const RETAIN_REASON_CODES = new Set([
  'attendance_submitted_after_deadline',
  'attendance_not_updated',
  'admin_correction_due_to_teacher_omission',
  'other',
]);

function clean(value: unknown, maxLen = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

function normalizeRole(value: unknown): string {
  const raw = clean(value, 80).toLowerCase();
  return raw === 'learningpartner' ? 'learning-partner' : raw;
}

async function assertAdmin(auth: { uid?: string; token?: Record<string, unknown> } | undefined): Promise<string> {
  const uid = clean(auth?.uid, 160);
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

  const tokenRole = normalizeRole(auth?.token?.role);
  if (tokenRole === 'admin') return uid;

  const userSnap = await admin.firestore().collection('users').doc(uid).get();
  if (normalizeRole(userSnap.data()?.role) !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  return uid;
}

function resolveAttendanceStatus(entry: unknown): string {
  if (typeof entry === 'string') return entry.trim().toLowerCase();
  if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
    return clean((entry as Record<string, unknown>).status, 80).toLowerCase();
  }
  return '';
}

function resolveSessionKidIds(session: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    const id = clean(value, 160);
    if (id) ids.add(id);
  };
  add(session.kidId);
  add(session.studentId);
  if (Array.isArray(session.kidIds)) session.kidIds.forEach(add);
  return Array.from(ids);
}

async function resolveAdminIdentity(uid: string, tokenEmail: string): Promise<{
  name: string;
  email: string | null;
}> {
  const userSnap = await admin.firestore().collection('users').doc(uid).get();
  const user = (userSnap.data() || {}) as Record<string, unknown>;
  const email = clean(user.email, 320) || tokenEmail || null;
  const name =
    clean(user.fullName, 320) ||
    clean(user.name, 320) ||
    clean(user.displayName, 320) ||
    email ||
    uid;
  return { name, email };
}

function validateDispositionReason(disposition: TeacherPayDisposition, reasonCode: string): void {
  if (disposition === 'credit_teacher') return;
  if (!RETAIN_REASON_CODES.has(reasonCode)) {
    throw new HttpsError('invalid-argument', 'A valid teacher payment retention reason is required.');
  }
}

export const prepareAdminAttendanceCorrectionTeacherPayDecision = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
    cors: CALLABLE_CORS_ORIGINS,
  },
  async (request) => {
    const uid = await assertAdmin(request.auth);
    const payload = (request.data || {}) as Record<string, unknown>;
    const sessionId = clean(payload.sessionId, 160);
    const kidId = clean(payload.kidId, 160);
    const disposition = normalizeTeacherPayDisposition(payload.teacherPayDisposition);
    const reasonCode = clean(payload.reasonCode, 120).toLowerCase();
    const reason = clean(payload.reason, 2000);

    if (!sessionId) throw new HttpsError('invalid-argument', 'sessionId is required.');
    if (!kidId) throw new HttpsError('invalid-argument', 'kidId is required.');
    if (!disposition) throw new HttpsError('invalid-argument', 'teacherPayDisposition is required.');
    if (!reason) throw new HttpsError('invalid-argument', 'reason is required.');
    validateDispositionReason(disposition, reasonCode);

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const decisionRef = sessionRef.collection('teacherPayDecisions').doc();
    const earningRef = db.collection('teacherEarnings').doc(sessionId);
    const chargeRef = db.collection('billingCharges').doc(sessionId);
    const tokenEmail = clean(request.auth?.token?.email, 320);
    const identity = await resolveAdminIdentity(uid, tokenEmail);
    const nowMs = Date.now();
    const validUntilMs = nowMs + DECISION_VALID_FOR_MS;

    await db.runTransaction(async (tx) => {
      const [sessionSnap, earningSnap, chargeSnap] = await Promise.all([
        tx.get(sessionRef),
        tx.get(earningRef),
        tx.get(chargeRef),
      ]);
      if (!sessionSnap.exists) throw new HttpsError('not-found', 'Session not found.');

      const session = (sessionSnap.data() || {}) as Record<string, unknown>;
      const kidIds = resolveSessionKidIds(session);
      if (kidIds.length > 0 && !kidIds.includes(kidId)) {
        throw new HttpsError('invalid-argument', 'Selected student is not assigned to this session.');
      }

      if (session.revenueAccrued === true || earningSnap.exists || chargeSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Teacher payment handling cannot be changed after a financial ledger already exists. Use the financial adjustment workflow.',
        );
      }

      const attendance =
        session.attendance && typeof session.attendance === 'object' && !Array.isArray(session.attendance)
          ? (session.attendance as Record<string, unknown>)
          : {};
      const previousStatus = resolveAttendanceStatus(attendance[kidId]) || 'not_marked';

      tx.set(decisionRef, {
        decisionId: decisionRef.id,
        sessionId,
        kidId,
        intendedAttendanceStatus: 'present',
        previousAttendanceStatus: previousStatus,
        teacherPayDisposition: disposition,
        reasonCode: disposition === 'credit_teacher' ? 'normal_correction' : reasonCode,
        reason,
        status: 'pending',
        source: SOURCE,
        decidedByUid: uid,
        decidedByName: identity.name,
        decidedByEmail: identity.email,
        decidedAt: admin.firestore.FieldValue.serverTimestamp(),
        validUntilMs,
      });

      tx.set(
        sessionRef,
        {
          teacherPayDisposition: disposition,
          teacherPayDecisionId: decisionRef.id,
          teacherPayDecisionKidId: kidId,
          teacherPayDecisionSource: SOURCE,
          teacherPayDecisionStatus: 'pending',
          teacherPayDecisionReasonCode: disposition === 'credit_teacher' ? 'normal_correction' : reasonCode,
          teacherPayDecisionReason: reason,
          teacherPayDecisionByUid: uid,
          teacherPayDecisionByName: identity.name,
          teacherPayDecisionByEmail: identity.email,
          teacherPayDecisionAt: admin.firestore.FieldValue.serverTimestamp(),
          teacherPayDecisionValidUntilMs: validUntilMs,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: uid,
        },
        { merge: true },
      );
    });

    logger.info('prepareAdminAttendanceCorrectionTeacherPayDecision: prepared', {
      sessionId,
      kidId,
      disposition,
      decisionId: decisionRef.id,
      decidedByUid: uid,
    });

    return {
      ok: true,
      decisionId: decisionRef.id,
      teacherPayDisposition: disposition,
      validUntilMs,
    };
  },
);

export const cancelAdminAttendanceCorrectionTeacherPayDecision = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
    cors: CALLABLE_CORS_ORIGINS,
  },
  async (request) => {
    const uid = await assertAdmin(request.auth);
    const payload = (request.data || {}) as Record<string, unknown>;
    const sessionId = clean(payload.sessionId, 160);
    const decisionId = clean(payload.decisionId, 160);
    if (!sessionId || !decisionId) {
      throw new HttpsError('invalid-argument', 'sessionId and decisionId are required.');
    }

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const decisionRef = sessionRef.collection('teacherPayDecisions').doc(decisionId);

    await db.runTransaction(async (tx) => {
      const [sessionSnap, decisionSnap] = await Promise.all([tx.get(sessionRef), tx.get(decisionRef)]);
      if (!sessionSnap.exists || !decisionSnap.exists) return;
      const session = (sessionSnap.data() || {}) as Record<string, unknown>;
      const decision = (decisionSnap.data() || {}) as Record<string, unknown>;
      if (clean(session.teacherPayDecisionId, 160) !== decisionId) return;
      if (clean(decision.status, 80).toLowerCase() !== 'pending') return;

      tx.set(decisionRef, {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelledByUid: uid,
      }, { merge: true });
      tx.set(sessionRef, {
        teacherPayDecisionStatus: 'cancelled',
        teacherPayDecisionValidUntilMs: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid,
      }, { merge: true });
    });

    return { ok: true, sessionId, decisionId };
  },
);

export const onAdminAttendanceCorrectionTeacherPayDecisionLink = onDocumentCreated(
  {
    document: 'classSessions/{sessionId}/attendanceCorrections/{correctionId}',
    region: REGION,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const correction = (snap.data() || {}) as Record<string, unknown>;
    if (clean(correction.source, 120) !== SOURCE) return;
    if (clean(correction.newStatus, 80).toLowerCase() !== 'present') return;

    const sessionId = clean(event.params.sessionId, 160);
    const correctionId = clean(event.params.correctionId, 160);
    const kidId = clean(correction.kidId, 160);
    if (!sessionId || !correctionId || !kidId) return;

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const earningRef = db.collection('teacherEarnings').doc(sessionId);

    await db.runTransaction(async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists) return;
      const session = (sessionSnap.data() || {}) as Record<string, unknown>;
      const decisionId = clean(session.teacherPayDecisionId, 160);
      const decisionStatus = clean(session.teacherPayDecisionStatus, 80).toLowerCase();
      const decisionKidId = clean(session.teacherPayDecisionKidId, 160);
      const validUntilMs = Number(session.teacherPayDecisionValidUntilMs);
      const pendingStillValid = decisionStatus === 'pending' && Number.isFinite(validUntilMs) && validUntilMs >= Date.now();
      if (!decisionId || decisionKidId !== kidId || (!pendingStillValid && decisionStatus !== 'applied')) return;

      const decisionRef = sessionRef.collection('teacherPayDecisions').doc(decisionId);
      const [decisionSnap, earningSnap] = await Promise.all([
        tx.get(decisionRef),
        tx.get(earningRef),
      ]);
      if (!decisionSnap.exists) return;

      tx.set(decisionRef, {
        status: 'applied',
        attendanceCorrectionId: correctionId,
        linkedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      tx.set(sessionRef, {
        teacherPayDecisionStatus: 'applied',
        teacherPayDecisionCorrectionId: correctionId,
        teacherPayDecisionValidUntilMs: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      if (
        earningSnap.exists &&
        normalizeTeacherPayDisposition(session.teacherPayDisposition) === 'retain_school'
      ) {
        tx.set(earningRef, {
          teacherPayDecisionStatus: 'applied',
          attendanceCorrectionId: correctionId,
          teacherPayDecisionId: decisionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    });

    logger.info('onAdminAttendanceCorrectionTeacherPayDecisionLink: linked', {
      sessionId,
      correctionId,
      kidId,
    });
  },
);
