import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from './helpers/adminGuard';
import { normalizeEnrollmentStatus } from './helpers/status';
import {
  isHistoricalTerminalEnrollmentStatus,
  isTeacherValidForHistoricalSession,
  resolveHistoricalEnrollmentCutoffMs,
  toMillisMaybe,
  type HistoricalTeacherReassignmentEvent,
} from './helpers/historicalAttendanceCorrection';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const SOURCE = 'admin_historical_attendance_correction';
const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    const cleaned = value.trim();
    return cleaned || null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => text(entry)).filter((entry): entry is string => Boolean(entry))));
}

function collectEnrollmentKidIds(enrollment: Record<string, unknown>): string[] {
  return Array.from(new Set([
    text(enrollment.kidId),
    text(enrollment.studentId),
    text(enrollment.childId),
    ...stringList(enrollment.kidIds),
  ].filter((entry): entry is string => Boolean(entry))));
}

function collectCurrentTeacherIds(enrollment: Record<string, unknown>): string[] {
  return Array.from(new Set([
    text(enrollment.teacherId),
    text(enrollment.assignedTeacherId),
    text(enrollment.primaryTeacherId),
    text(enrollment.teacherUid),
    text(enrollment.teacher_id),
    ...stringList(enrollment.teacherIds),
  ].filter((entry): entry is string => Boolean(entry))));
}

function collectPreviousTeacherIds(enrollment: Record<string, unknown>): string[] {
  return Array.from(new Set([
    text(enrollment.previousTeacherId),
    text(enrollment.teacherReassignedFrom),
    text(enrollment.reassignedFromTeacherId),
  ].filter((entry): entry is string => Boolean(entry))));
}

function parseSessionTimes(date: string, startTime: string, durationMins: number) {
  if (!YMD_PATTERN.test(date) || !TIME_PATTERN.test(startTime)) {
    throw new HttpsError('invalid-argument', 'date and startTime must use YYYY-MM-DD and HH:mm');
  }
  const duration = Math.floor(Number(durationMins));
  if (!Number.isFinite(duration) || duration < 10 || duration > 180) {
    throw new HttpsError('invalid-argument', 'durationMins must be between 10 and 180');
  }
  const startAt = new Date(`${date}T${startTime}:00+05:30`);
  if (Number.isNaN(startAt.getTime())) throw new HttpsError('invalid-argument', 'Invalid session date or time');
  const endAt = new Date(startAt.getTime() + duration * 60_000);
  const endIst = new Date(endAt.getTime() + 330 * 60_000);
  const endTime = `${String(endIst.getUTCHours()).padStart(2, '0')}:${String(endIst.getUTCMinutes()).padStart(2, '0')}`;
  return { startAt, endAt, endTime, durationMins: duration };
}

function deterministicSessionId(enrollmentId: string, date: string, startTime: string): string {
  return `${enrollmentId}_${date.replace(/-/g, '')}_${startTime.replace(':', '')}`;
}

async function resolveTeacherIdentity(
  db: FirebaseFirestore.Firestore,
  requestedTeacherId: string,
): Promise<{ teacherId: string; identityIds: string[]; name: string; email: string | null }> {
  let teacherSnap = await db.collection('users').doc(requestedTeacherId).get();
  if (!teacherSnap.exists) {
    const byUid = await db.collection('users').where('uid', '==', requestedTeacherId).limit(1).get();
    if (!byUid.empty) teacherSnap = byUid.docs[0];
  }
  if (!teacherSnap.exists) throw new HttpsError('not-found', 'Selected historical teacher was not found');

  const teacher = (teacherSnap.data() || {}) as Record<string, unknown>;
  const role = String(teacher.role || '').trim().toLowerCase();
  const roles = stringList(teacher.roles).map((entry) => entry.toLowerCase());
  if (role !== 'teacher' && !roles.includes('teacher')) {
    throw new HttpsError('failed-precondition', 'Selected user is not a teacher');
  }

  const uid = text(teacher.uid);
  const identityIds = Array.from(new Set([requestedTeacherId, teacherSnap.id, uid].filter((entry): entry is string => Boolean(entry))));
  const email = text(teacher.email);
  const name = text(teacher.displayName) || text(teacher.fullName) || text(teacher.name) || email || teacherSnap.id;
  return { teacherId: uid || teacherSnap.id, identityIds, name, email };
}

async function loadReassignmentEvents(
  enrollmentRef: FirebaseFirestore.DocumentReference,
): Promise<HistoricalTeacherReassignmentEvent[]> {
  const snap = await enrollmentRef.collection('teacherReassignments').get();
  return snap.docs
    .map((docSnap) => {
      const row = (docSnap.data() || {}) as Record<string, unknown>;
      return {
        changedAtMs: toMillisMaybe(row.changedAt) || 0,
        oldTeacherId: text(row.oldTeacherId),
        newTeacherId: text(row.newTeacherId),
      };
    })
    .filter((event) => event.changedAtMs > 0)
    .sort((a, b) => a.changedAtMs - b.changedAtMs);
}

function numberOrZero(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export const createAdminHistoricalAttendanceSession = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const enrollmentId = String(request.data?.enrollmentId || '').trim();
  const requestedTeacherId = String(request.data?.teacherId || '').trim();
  const date = String(request.data?.date || '').trim();
  const startTime = String(request.data?.startTime || '').trim();
  const reason = String(request.data?.reason || '').trim();
  const durationInput = Number(request.data?.durationMins);

  if (!enrollmentId || !requestedTeacherId || !reason) {
    throw new HttpsError('invalid-argument', 'enrollmentId, teacherId, and a non-empty reason are required');
  }

  const timing = parseSessionTimes(date, startTime, durationInput);
  const sessionStartMs = timing.startAt.getTime();
  if (sessionStartMs >= Date.now()) {
    throw new HttpsError('failed-precondition', 'Historical attendance sessions must be in the past');
  }

  const db = admin.firestore();
  const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
  const enrollmentSnap = await enrollmentRef.get();
  if (!enrollmentSnap.exists) throw new HttpsError('not-found', 'Enrollment not found');

  const enrollment = (enrollmentSnap.data() || {}) as Record<string, unknown>;
  const enrollmentStatus = normalizeEnrollmentStatus(enrollment.status);
  const terminalEnrollment = isHistoricalTerminalEnrollmentStatus(enrollmentStatus);
  const currentTeacherIds = collectCurrentTeacherIds(enrollment);
  const previousTeacherIds = collectPreviousTeacherIds(enrollment);
  const teacherIdentity = await resolveTeacherIdentity(db, requestedTeacherId);
  const requestedTeacherIds = teacherIdentity.identityIds;
  const currentTeacherMatch = currentTeacherIds.some((id) => requestedTeacherIds.includes(id));

  const reassignmentEvents = await loadReassignmentEvents(enrollmentRef);
  const fallbackReassignedAtMs =
    toMillisMaybe(enrollment.teacherReassignedAt) ||
    toMillisMaybe(enrollment.reassignedAt) ||
    null;
  const teacherValidForDate = isTeacherValidForHistoricalSession({
    sessionStartMs,
    requestedTeacherIds,
    currentTeacherIds,
    previousTeacherIds,
    fallbackReassignedAtMs,
    reassignmentEvents,
  });
  if (!teacherValidForDate) {
    throw new HttpsError(
      'failed-precondition',
      'The selected teacher was not assigned to this enrollment at the selected historical date',
    );
  }

  const historicalTeacher = !currentTeacherMatch;
  const pausedEnrollment = enrollmentStatus === 'paused';
  if (!terminalEnrollment && !pausedEnrollment && !historicalTeacher) {
    throw new HttpsError(
      'failed-precondition',
      'Use the standard missing-session workflow for the current teacher and operational enrollment',
    );
  }

  if (terminalEnrollment) {
    const cutoffMs = resolveHistoricalEnrollmentCutoffMs(enrollment);
    if (!cutoffMs) {
      throw new HttpsError(
        'failed-precondition',
        'This completed enrollment is missing its completion/end timestamp. Repair lifecycle metadata before creating historical attendance.',
      );
    }
    if (sessionStartMs > cutoffMs) {
      throw new HttpsError(
        'failed-precondition',
        'The selected date is after this enrollment ended. Choose a date from the previous course period.',
      );
    }
  }

  const kidIds = collectEnrollmentKidIds(enrollment);
  const kidId = kidIds[0] || null;
  const courseId = text(enrollment.courseId);
  if (!kidId || !courseId) {
    throw new HttpsError('failed-precondition', 'Enrollment is missing canonical child or course identity');
  }

  const existingSessions = await db.collection('classSessions').where('enrollmentId', '==', enrollmentId).get();
  const existingAtTime = existingSessions.docs.find((docSnap) => {
    const row = (docSnap.data() || {}) as Record<string, unknown>;
    return String(row.date || '').trim() === date && String(row.startTime || '').trim().slice(0, 5) === startTime;
  });
  if (existingAtTime) {
    return {
      ok: true,
      sessionId: existingAtTime.id,
      alreadyExisted: true,
      historical: true,
      enrollmentStatus,
      teacherId: text(existingAtTime.data()?.teacherId) || teacherIdentity.teacherId,
    };
  }

  const sessionId = deterministicSessionId(enrollmentId, date, startTime);
  const sessionRef = db.collection('classSessions').doc(sessionId);
  const actor = request.auth?.uid || 'admin';
  const auditRef = db.collection('auditLogs').doc();
  const parentIds = stringList(enrollment.parentIds);
  const parentId = text(enrollment.parentId) || parentIds[0] || null;
  if (parentId && !parentIds.includes(parentId)) parentIds.unshift(parentId);

  const feePerClass = numberOrZero(
    enrollment.ratePerSession ?? enrollment.feePerClass ?? enrollment.feePerSession,
  );
  const teacherPayPerSession = numberOrZero(
    enrollment.teacherPayPerSession ?? enrollment.teacherRatePerSession ?? enrollment.teacherPay,
  );
  const currency = text(enrollment.currency) || 'INR';
  const courseName = text(enrollment.courseName) || text(enrollment.courseLabel) || courseId;
  const studentName = text(enrollment.studentName) || text(enrollment.kidName) || text(enrollment.childName) || kidId;

  const result = await db.runTransaction(async (tx) => {
    const existing = await tx.get(sessionRef);
    if (existing.exists) {
      const row = (existing.data() || {}) as Record<string, unknown>;
      if (
        String(row.enrollmentId || '').trim() === enrollmentId &&
        String(row.date || '').trim() === date &&
        String(row.startTime || '').trim().slice(0, 5) === startTime
      ) {
        return { alreadyExisted: true };
      }
      throw new HttpsError('already-exists', 'A different session already uses this historical session identity');
    }

    tx.create(sessionRef, {
      enrollmentId,
      kidId,
      kidIds,
      studentId: text(enrollment.studentId) || kidId,
      studentName,
      kidName: text(enrollment.kidName) || studentName,
      parentId,
      parentIds,
      teacherId: teacherIdentity.teacherId,
      teacherIds: teacherIdentity.identityIds,
      assignedTeacherId: teacherIdentity.teacherId,
      primaryTeacherId: teacherIdentity.teacherId,
      teacherUid: teacherIdentity.teacherId,
      teacher_id: teacherIdentity.teacherId,
      teacherName: teacherIdentity.name,
      teacherEmail: teacherIdentity.email,
      courseId,
      courseName,
      date,
      startTime,
      endTime: timing.endTime,
      durationMinutes: timing.durationMins,
      durationMins: timing.durationMins,
      startAt: Timestamp.fromDate(timing.startAt),
      endAt: Timestamp.fromDate(timing.endAt),
      status: 'completed',
      completedAt: Timestamp.fromDate(timing.endAt),
      attendance: null,
      isAdHoc: true,
      adHocType: 'admin_one_off_historical_correction',
      source: SOURCE,
      manualSessionState: 'completed',
      manualSessionReason: reason,
      historicalCorrection: true,
      historicalEnrollmentStatus: enrollmentStatus,
      historicalTeacherId: teacherIdentity.teacherId,
      historicalTeacherRequestedId: requestedTeacherId,
      feePerClass,
      feeAmount: feePerClass,
      ratePerSession: feePerClass,
      teacherPayPerSession,
      currency,
      approvedBy: actor,
      approvedAt: FieldValue.serverTimestamp(),
      createdBy: actor,
      createdAt: FieldValue.serverTimestamp(),
      updatedBy: actor,
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.create(auditRef, {
      type: 'admin_historical_attendance_session_created',
      action: 'create',
      sessionId,
      enrollmentId,
      enrollmentStatus,
      kidId,
      courseId,
      teacherId: teacherIdentity.teacherId,
      requestedTeacherId,
      date,
      startTime,
      reason,
      historicalCorrection: true,
      createdBy: actor,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { alreadyExisted: false };
  });

  return {
    ok: true,
    sessionId,
    ...result,
    historical: true,
    enrollmentStatus,
    teacherId: teacherIdentity.teacherId,
  };
});
