import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
// Emergency containment for the 2026-08-23 Firestore event storm. Preserve
// lead intake while preventing reciprocal demo/lead synchronization writes.
const LEAD_DEMO_AUTOMATION_INCIDENT_GUARD = true;
const PAYABLE_DEMO_OUTCOMES = new Set(['completed', 'not_interested', 'follow_up_needed']);
const TEACHER_CANCEL_REASONS = new Set([
  'parent_unavailable',
  'teacher_unavailable',
  'technical_issue',
  'reschedule_requested',
  'other',
]);

type LeadStatus =
  | 'new'
  | 'attempted_contact'
  | 'contacted'
  | 'qualified'
  | 'demo_pending_schedule'
  | 'demo_booked'
  | 'demo_completed'
  | 'admission_follow_up'
  | 'admitted_confirmed'
  | 'not_interested'
  | 'wrong_fit'
  | 'no_response'
  | 'lost';

const cleanText = (value: unknown, maxLength = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const normalizePhone = (value: unknown): string => cleanText(value, 80).replace(/[^\d]/g, '');

const normalizeRole = (value: unknown): string => cleanText(value, 80).toLowerCase();

const mapDemoSourceToLeadSource = (value: unknown): string => {
  const source = cleanText(value, 80).toLowerCase();
  if (['website', 'whatsapp', 'instagram', 'referral'].includes(source)) return source;
  return 'manual';
};

const mapCourseToLeadTrack = (value: unknown): string => {
  const course = cleanText(value, 120).toLowerCase();
  if (course.includes('grammar') || course.includes('writing')) return 'grammar';
  if (course.includes('speaking') || course.includes('communication')) return 'public_speaking';
  return 'phonics';
};

const leadStatusForDemo = (demo: Record<string, unknown>): LeadStatus => {
  const conversion = cleanText(demo.conversionStatus, 80).toLowerCase();
  if (conversion === 'enrolled') return 'admitted_confirmed';
  if (conversion === 'interested' || conversion === 'follow_up_later') return 'admission_follow_up';
  if (conversion === 'not_interested') return 'not_interested';
  if (conversion === 'wrong_fit') return 'wrong_fit';
  if (conversion === 'no_response') return 'no_response';

  const status = cleanText(demo.status, 80).toLowerCase();
  if (status === 'completed') return 'demo_completed';
  if (status === 'assigned') return 'demo_booked';
  // A cancelled demo is a cancelled attempt, not a lost lead. Keep the lead actionable.
  if (status === 'cancelled') return 'demo_pending_schedule';
  if (status === 'open') return 'demo_pending_schedule';
  return 'new';
};

const historyEntry = (action: string, actorId: string, actorName: string, note: string) => ({
  action,
  actorId,
  actorName,
  atMs: Date.now(),
  note,
});

const timestampMillis = (value: unknown): number => {
  if (!value || typeof value !== 'object') return 0;
  const timestamp = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
  if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
  if (typeof timestamp.seconds === 'number') {
    return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1_000_000);
  }
  return 0;
};

export const onLeadCreatedCanonicalize = onDocumentWritten(
  { document: 'leads/{leadId}', region: REGION },
  async (event) => {
    if (LEAD_DEMO_AUTOMATION_INCIDENT_GUARD) return;
    const change = event.data;
    if (!change || !change.after.exists) return;
    const snap = change.after;
    const data = snap.data() || {};
    const before = change.before.exists ? (change.before.data() || {}) : {};
    const updates: Record<string, unknown> = {};

    // receivedAt is the immutable cohort anchor. Once established, neither admin
    // edits nor lifecycle synchronization may move the lead into another cohort.
    if (before.receivedAt && timestampMillis(data.receivedAt) !== timestampMillis(before.receivedAt)) {
      updates.receivedAt = before.receivedAt;
    } else if (!data.receivedAt) {
      updates.receivedAt = data.requestedAt || data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    }
    if (!cleanText(data.status, 80)) updates.status = 'new';
    if (!data.lifecycleVersion) updates.lifecycleVersion = 2;

    const phone = normalizePhone(data.primaryPhone || data.phoneNormalized || data.whatsappNumber);
    if (phone && data.phoneNormalized !== phone) updates.phoneNormalized = phone;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await snap.ref.set(updates, { merge: true });
    }
  },
);

export const onDemoLeadLifecycleWrite = onDocumentWritten(
  { document: 'demoSessions/{demoId}', region: REGION },
  async (event) => {
    if (LEAD_DEMO_AUTOMATION_INCIDENT_GUARD) return;
    const change = event.data;
    if (!change || !change.after.exists) return;

    const demoId = cleanText(event.params.demoId, 120);
    if (!demoId) return;

    const before = change.before.exists ? (change.before.data() || {}) : {};
    const after = change.after.data() || {};
    // Archived demos are intentionally removed from the active lead workflow. Do not
    // recreate a deleted lead when an admin archives its linked demo for audit history.
    if (after.archived === true) return;
    const db = admin.firestore();
    const demoRef = db.collection('demoSessions').doc(demoId);
    const privateRef = db.collection('demoSessionsPrivate').doc(demoId);

    await db.runTransaction(async (tx) => {
      let leadId = cleanText(after.leadId, 120);

      if (!leadId) {
        const priorDemoId = cleanText(after.rescheduledFromDemoId, 120);
        if (priorDemoId) {
          const priorSnap = await tx.get(db.collection('demoSessions').doc(priorDemoId));
          if (priorSnap.exists) leadId = cleanText(priorSnap.data()?.leadId, 120);
        }
      }

      if (!leadId) leadId = `demo_${demoId}`;

      const leadRef = db.collection('leads').doc(leadId);
      const [leadSnap, privateSnap] = await Promise.all([tx.get(leadRef), tx.get(privateRef)]);
      const lead = leadSnap.exists ? (leadSnap.data() || {}) : {};
      const privateData = privateSnap.exists ? (privateSnap.data() || {}) : {};
      const phone = normalizePhone(privateData.parentPhone);
      const nextLeadStatus = leadStatusForDemo(after);
      const systemActor = 'system:demo-lifecycle';
      const currentDemoId = cleanText(lead.demoSessionId, 120);
      const rescheduledToDemoId = cleanText(after.rescheduledToDemoId, 120);
      const isSupersededAttempt = Boolean(
        currentDemoId && currentDemoId !== demoId && currentDemoId !== rescheduledToDemoId,
      );
      const isEnrollment = cleanText(after.conversionStatus, 80).toLowerCase() === 'enrolled';

      const leadPayload: Record<string, unknown> = {
        parentName: cleanText(after.parentName, 120) || cleanText(lead.parentName, 120) || 'Parent',
        childName: cleanText(after.childName, 120) || cleanText(lead.childName, 120) || 'Child',
        childAge: typeof after.childAge === 'number' ? after.childAge : lead.childAge ?? null,
        childGrade: cleanText(after.childGrade, 80) || lead.childGrade || null,
        interestTrack: mapCourseToLeadTrack(after.courseInterested),
        programInterest: cleanText(after.courseInterested, 120) || lead.programInterest || null,
        source: lead.source || mapDemoSourceToLeadSource(after.source),
        demoIds: admin.firestore.FieldValue.arrayUnion(demoId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: systemActor,
        lifecycleVersion: 2,
      };
      if (!isSupersededAttempt || isEnrollment || rescheduledToDemoId) {
        leadPayload.status = rescheduledToDemoId
          ? 'demo_pending_schedule'
          : nextLeadStatus;
        leadPayload.demoSessionId = rescheduledToDemoId || demoId;
        leadPayload.demoStatus = rescheduledToDemoId ? 'open' : cleanText(after.status, 80) || null;
        leadPayload.conversionStatus = cleanText(after.conversionStatus, 80) || null;
        if (rescheduledToDemoId) {
          leadPayload.demoIds = admin.firestore.FieldValue.arrayUnion(demoId, rescheduledToDemoId);
        }
      }

      if (phone) {
        leadPayload.primaryPhone = lead.primaryPhone || cleanText(privateData.parentPhone, 80) || phone;
        leadPayload.phoneNormalized = phone;
      }
      if (!leadSnap.exists) {
        leadPayload.sourceDetail = 'manual_demo_request';
        leadPayload.receivedAt = after.createdAt || admin.firestore.FieldValue.serverTimestamp();
        leadPayload.createdAt = after.createdAt || admin.firestore.FieldValue.serverTimestamp();
        leadPayload.createdBy = cleanText(after.createdBy, 120) || systemActor;
      } else if (!lead.receivedAt) {
        leadPayload.receivedAt = lead.requestedAt || lead.createdAt || after.createdAt || admin.firestore.FieldValue.serverTimestamp();
      }

      if (!lead.demoCreatedAt) leadPayload.demoCreatedAt = after.createdAt || admin.firestore.FieldValue.serverTimestamp();
      if (after.assignedAt && !lead.demoAssignedAt) leadPayload.demoAssignedAt = after.assignedAt;
      if (after.completedAt && !lead.demoCompletedAt) leadPayload.demoCompletedAt = after.completedAt;

      const statusChangedToCancelled = cleanText(before.status, 80) !== 'cancelled' && cleanText(after.status, 80) === 'cancelled';
      if (statusChangedToCancelled || after.cancelledAt) {
        leadPayload.demoCancelledAt = after.cancelledAt || admin.firestore.FieldValue.serverTimestamp();
        leadPayload.demoCancellationReason = cleanText(after.cancellationReason, 120) || null;
      }

      if (isEnrollment) {
        leadPayload.enrolledAt = after.enrolledAt || lead.enrolledAt || admin.firestore.FieldValue.serverTimestamp();
      }

      const completionOutcome = cleanText(after.outcome, 80).toLowerCase();
      if (
        PAYABLE_DEMO_OUTCOMES.has(completionOutcome) &&
        (!isSupersededAttempt || !lead.demoCompletedByTeacherId) &&
        (after.completedByTeacherId || after.assignedTeacherId)
      ) {
        leadPayload.demoCompletedByTeacherId = after.completedByTeacherId || after.assignedTeacherId;
        leadPayload.demoCompletedByTeacherName = after.completedByTeacherName || after.assignedTeacherName || null;
      }

      tx.set(leadRef, leadPayload, { merge: true });

      const demoPatch: Record<string, unknown> = {};
      if (cleanText(after.leadId, 120) !== leadId) demoPatch.leadId = leadId;
      if (cleanText(after.status, 80) === 'completed' && !after.completedByTeacherId && after.assignedTeacherId) {
        demoPatch.completedByTeacherId = after.assignedTeacherId;
        demoPatch.completedByTeacherName = after.assignedTeacherName || null;
      }
      if (cleanText(after.status, 80) === 'cancelled' && !after.cancelledAt) {
        demoPatch.cancelledAt = admin.firestore.FieldValue.serverTimestamp();
      }
      if (cleanText(after.conversionStatus, 80).toLowerCase() === 'enrolled' && !after.enrolledAt) {
        demoPatch.enrolledAt = admin.firestore.FieldValue.serverTimestamp();
      }
      if (Object.keys(demoPatch).length > 0) tx.set(demoRef, demoPatch, { merge: true });
    });
  },
);

interface TeacherCancelAssignedDemoRequest {
  demoId: string;
  reason: string;
  note?: string;
}

export const teacherCancelAssignedDemo = onCall<TeacherCancelAssignedDemoRequest>(
  { region: REGION },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');

    const demoId = cleanText(request.data?.demoId, 120);
    const reason = cleanText(request.data?.reason, 120).toLowerCase();
    const note = cleanText(request.data?.note, 1000);
    if (!demoId) throw new HttpsError('invalid-argument', 'demoId is required');
    if (!TEACHER_CANCEL_REASONS.has(reason)) {
      throw new HttpsError('invalid-argument', 'Select a valid cancellation reason');
    }

    const db = admin.firestore();
    const [userSnap, demoSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('demoSessions').doc(demoId).get(),
    ]);
    if (!userSnap.exists) throw new HttpsError('permission-denied', 'User profile not found');
    if (!demoSnap.exists) throw new HttpsError('not-found', 'Demo session not found');

    const user = userSnap.data() || {};
    const role = normalizeRole(user.role);
    if (role !== 'teacher' && role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only the assigned teacher or admin can cancel this demo');
    }
    const actorName = cleanText(user.name || user.displayName || user.email, 120) || 'Teacher';
    const demoRef = demoSnap.ref;

    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(demoRef);
      if (!fresh.exists) throw new HttpsError('not-found', 'Demo session not found');
      const demo = fresh.data() || {};
      if (cleanText(demo.status, 80) !== 'assigned') {
        throw new HttpsError('failed-precondition', 'Only assigned demos can be cancelled by a teacher');
      }
      if (role === 'teacher' && cleanText(demo.assignedTeacherId, 120) !== uid) {
        throw new HttpsError('permission-denied', 'Only the assigned teacher can cancel this demo');
      }

      tx.update(demoRef, {
        status: 'cancelled',
        cancellationReason: reason,
        cancellationNote: note || null,
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelledBy: uid,
        history: admin.firestore.FieldValue.arrayUnion(
          historyEntry('cancelled', uid, actorName, `Teacher cancellation: ${reason}${note ? ` | ${note}` : ''}`),
        ),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedBy: uid,
      });
    });

    return { ok: true, demoId, status: 'cancelled' as const };
  },
);

export const onDemoPayoutIntegrityWrite = onDocumentWritten(
  { document: 'teacherEarnings/{earningId}', region: REGION },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;
    const earning = change.after.data() || {};
    const source = cleanText(earning.source, 80).toLowerCase();
    if (source !== 'demo_completed' && source !== 'demo_enrolled_bonus') return;
    if (cleanText(earning.status, 80).toLowerCase() !== 'unpaid') return;

    const demoId = cleanText(earning.demoId, 120);
    if (!demoId) return;
    const db = admin.firestore();
    const demoSnap = await db.collection('demoSessions').doc(demoId).get();
    if (!demoSnap.exists) return;
    const demo = demoSnap.data() || {};
    const expectedTeacherId = cleanText(demo.completedByTeacherId || demo.assignedTeacherId, 120);
    const earningTeacherId = cleanText(earning.teacherId, 120);

    let voidReason = '';
    if (expectedTeacherId && earningTeacherId && expectedTeacherId !== earningTeacherId) {
      voidReason = 'Demo earning teacher does not match the teacher who completed the demo';
    }
    if (source === 'demo_completed') {
      const outcome = cleanText(demo.outcome, 80).toLowerCase();
      if (!PAYABLE_DEMO_OUTCOMES.has(outcome)) {
        voidReason = `Demo was not delivered; outcome=${outcome || 'unknown'}`;
      }
    }
    if (
      source === 'demo_enrolled_bonus' &&
      (
        cleanText(demo.conversionStatus, 80).toLowerCase() !== 'enrolled' ||
        cleanText(demo.status, 80).toLowerCase() !== 'completed' ||
        !PAYABLE_DEMO_OUTCOMES.has(cleanText(demo.outcome, 80).toLowerCase()) ||
        !cleanText(demo.completedByTeacherId, 120)
      )
    ) {
      voidReason = 'Enrollment bonus requires an enrolled, completed demo with completion attribution';
    }

    if (!voidReason) return;
    await change.after.ref.set(
      {
        status: 'void',
        voidReason,
        voidedAt: admin.firestore.FieldValue.serverTimestamp(),
        correctedBy: 'system:demo-payout-integrity',
        correctedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    logger.info('Voided non-payable demo earning', { demoId, source, voidReason });
  },
);
