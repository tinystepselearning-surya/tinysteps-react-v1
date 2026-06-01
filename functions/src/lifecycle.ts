import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';
import { normalizeEnrollmentStatus } from './helpers/status';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MAX_BATCH = 450;

const ACTIVE_LIKE = new Set([
  'trial',
  'active',
  'paused',
  'enrolled',
  'current',
  'ongoing',
  'pending_teacher',
  'pending_payment',
]);

const TERMINAL = new Set(['completed', 'discontinued', 'expired', 'cancelled', 'canceled']);
const NON_REASSIGNABLE_SESSION_STATUSES = new Set([
  'completed',
  'cancelled',
  'canceled',
  'rescheduled',
  'reschedule',
  'paid',
  'settled',
  'consumed',
  'locked',
  'no_show',
  'noshow',
]);
const SCHEDULE_EXCEPTION_SOURCE_TOKENS = [
  'makeup',
  'manual',
  'one_off',
  'one-off',
  'adhoc',
  'ad_hoc',
  'rescheduled',
  'reschedule',
] as const;

function resolveKidIdFromEnrollment(data: any): string | null {
  return (
    toOptionalId(data?.kidId) ||
    toOptionalId(Array.isArray(data?.kidIds) ? data.kidIds[0] : null) ||
    toOptionalId(data?.studentId) ||
    toOptionalId(data?.childId) ||
    null
  );
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  value.forEach((item) => {
    const text = typeof item === 'string' ? item.trim() : '';
    if (!text || seen.has(text)) return;
    seen.add(text);
    normalized.push(text);
  });
  return normalized;
}

function toOptionalId(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const direct =
      toOptionalId(row.id) ||
      toOptionalId(row.uid) ||
      toOptionalId(row.userId) ||
      toOptionalId(row.kidId) ||
      toOptionalId(row.studentId);
    if (direct) return direct;
    if (typeof row.path === 'string') {
      const parts = row.path.split('/').filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1];
    }
    const pathLike = (row as any)._path;
    if (pathLike && Array.isArray(pathLike.segments)) {
      const segs = pathLike.segments.filter((seg: unknown) => typeof seg === 'string');
      if (segs.length > 0) return String(segs[segs.length - 1] || '').trim() || null;
    }
  }
  return null;
}

function normalizeStatusValue(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function hasAttendanceMarked(raw: Record<string, unknown>): boolean {
  const attendance = raw.attendance;
  if (!attendance) return false;
  if (attendance === null) return false;
  if (typeof attendance !== 'object') return true;
  if (Array.isArray(attendance)) return attendance.length > 0;
  return Object.keys(attendance as Record<string, unknown>).length > 0;
}

function hasSessionFinanceOrLockMarkers(raw: Record<string, unknown>): boolean {
  if (raw.revenueAccrued === true) return true;
  if (Number(raw.accruedAmount || 0) > 0) return true;
  if (typeof raw.accruedMonthKey === 'string' && raw.accruedMonthKey.trim()) return true;
  if (raw.creditsProcessed === true || raw.creditsProcessing === true) return true;
  if (raw.locked === true || raw.isLocked === true) return true;

  const markerFields = ['lockedAt', 'consumedAt', 'settledAt', 'paidAt', 'billedAt', 'invoicedAt'] as const;
  for (const field of markerFields) {
    if (raw[field]) return true;
  }

  const statusLikeFields = ['billingStatus', 'paymentStatus', 'earningStatus'] as const;
  for (const field of statusLikeFields) {
    const normalized = normalizeStatusValue(raw[field]);
    if (normalized === 'paid' || normalized === 'settled' || normalized === 'consumed' || normalized === 'locked') {
      return true;
    }
  }

  return false;
}

function isScheduleExceptionSession(raw: Record<string, unknown>): boolean {
  if (raw.isAdHoc === true || raw.isMakeup === true) return true;
  if (raw.makeupCreditId || raw.makeupForSessionId) return true;

  const adHocType = String(raw.adHocType || '').trim().toLowerCase();
  if (adHocType && (adHocType.includes('one_off') || adHocType.includes('adhoc') || adHocType.includes('ad_hoc'))) {
    return true;
  }

  const source = String(raw.source || '').trim().toLowerCase();
  if (!source) return false;
  return SCHEDULE_EXCEPTION_SOURCE_TOKENS.some((token) => source.includes(token));
}

function buildEnrollmentCanonicalPatch(enrollmentId: string, enrollment: Record<string, unknown>) {
  const patch: Record<string, unknown> = {
    enrollmentId,
  };

  const kidId = resolveKidIdFromEnrollment(enrollment);
  const kidIds = toStringList(enrollment.kidIds);
  if (kidId && !kidIds.includes(kidId)) kidIds.unshift(kidId);
  if (kidId) patch.kidId = kidId;
  if (kidIds.length > 0) patch.kidIds = kidIds;

  const parentIds = toStringList(enrollment.parentIds);
  const parentId = toOptionalId(enrollment.parentId) || parentIds[0] || null;
  if (parentId && !parentIds.includes(parentId)) parentIds.unshift(parentId);
  if (parentId) patch.parentId = parentId;
  if (parentIds.length > 0) patch.parentIds = parentIds;

  const teacherIds = toStringList(enrollment.teacherIds);
  const teacherId =
    toOptionalId(enrollment.teacherId) ||
    toOptionalId((enrollment as any).assignedTeacherId) ||
    toOptionalId((enrollment as any).assignedTeacher) ||
    teacherIds[0] ||
    null;
  if (teacherId && !teacherIds.includes(teacherId)) teacherIds.unshift(teacherId);
  if (teacherId) patch.teacherId = teacherId;
  if (teacherIds.length > 0) patch.teacherIds = teacherIds;

  return patch;
}

async function batchUpdate(docs: FirebaseFirestore.QueryDocumentSnapshot[], updates: Record<string, any>) {
  const db = admin.firestore();
  let updated = 0;
  for (let i = 0; i < docs.length; i += MAX_BATCH) {
    const batch = db.batch();
    docs.slice(i, i + MAX_BATCH).forEach((docSnap) => {
      batch.set(docSnap.ref, updates, { merge: true });
      updated += 1;
    });
    await batch.commit();
  }
  return updated;
}

async function cancelFutureSessionsByEnrollmentId(enrollmentId: string, reason: string) {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const snap = await db
    .collection('classSessions')
    .where('enrollmentId', '==', enrollmentId)
    .where('startAt', '>=', now)
    .get();

  const updates = {
    status: 'cancelled',
    cancelledReason: reason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const count = await batchUpdate(snap.docs, updates);
  return count;
}

async function cancelFutureSessionsByKidId(kidId: string, reason: string) {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const snap = await db
    .collection('classSessions')
    .where('kidIds', 'array-contains', kidId)
    .where('startAt', '>=', now)
    .get();

  const updates = {
    status: 'cancelled',
    cancelledReason: reason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const count = await batchUpdate(snap.docs, updates);
  return count;
}

async function updateSessionsTeacherByEnrollmentId(
  enrollmentId: string,
  newTeacherId: string,
  newTeacherName: string | null,
  newTeacherEmail: string | null,
  previousTeacherId: string | null,
  actorUid: string | null
) {
  const db = admin.firestore();
  const nowMs = Date.now();
  const snap = await db
    .collection('classSessions')
    .where('enrollmentId', '==', enrollmentId)
    .get();

  const isFutureSession = (data: any): boolean => {
    const startAt = data?.startAt;
    if (typeof startAt?.toMillis === 'function') {
      return startAt.toMillis() >= nowMs;
    }
    if (startAt) {
      const parsedStartAt = new Date(startAt);
      if (!Number.isNaN(parsedStartAt.getTime())) {
        return parsedStartAt.getTime() >= nowMs;
      }
    }

    const dateYmd = String(data?.date || '').trim();
    const startTime = String(data?.startTime || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
      const withTimeIso =
        /^\d{2}:\d{2}$/.test(startTime)
          ? `${dateYmd}T${startTime}:00+05:30`
          : `${dateYmd}T00:00:00+05:30`;
      const parsed = Date.parse(withTimeIso);
      if (!Number.isNaN(parsed)) {
        return parsed >= nowMs;
      }
    }
    return false;
  };

  const skipReasonCounts: Record<string, number> = {
    pastSession: 0,
    completedOrStatusLocked: 0,
    attendanceMarked: 0,
    financeLinked: 0,
    financeLinkUnverified: 0,
    makeupOrManual: 0,
    rescheduledOrException: 0,
    missingDateTime: 0,
  };
  const incrementSkip = (reason: keyof typeof skipReasonCounts) => {
    skipReasonCounts[reason] = (skipReasonCounts[reason] || 0) + 1;
  };

  const checkFinanceLinked = async (
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<'linked' | 'clear' | 'unverified'> => {
    try {
      const [chargeSnap, earningSnap] = await Promise.all([
        db.collection('billingCharges').doc(sessionId).get(),
        db.collection('teacherEarnings').doc(sessionId).get(),
      ]);
      if (chargeSnap.exists || earningSnap.exists) {
        return 'linked';
      }

      const dateYmd = String(data.date || '').trim();
      const startTime = String(data.startTime || '').trim();
      if (!dateYmd || !startTime) {
        return 'unverified';
      }

      const [chargeFallbackSnap, earningFallbackSnap] = await Promise.all([
        db
          .collection('billingCharges')
          .where('enrollmentId', '==', enrollmentId)
          .where('date', '==', dateYmd)
          .where('startTime', '==', startTime)
          .limit(1)
          .get(),
        db
          .collection('teacherEarnings')
          .where('enrollmentId', '==', enrollmentId)
          .where('date', '==', dateYmd)
          .where('startTime', '==', startTime)
          .limit(1)
          .get(),
      ]);

      if (!chargeFallbackSnap.empty || !earningFallbackSnap.empty) {
        return 'linked';
      }
      return 'clear';
    } catch {
      return 'unverified';
    }
  };

  const eligibleDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  for (const docSnap of snap.docs) {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    const hasStartAt = Boolean(data.startAt);
    const hasDateAndTime =
      typeof data.date === 'string' &&
      String(data.date).trim().length > 0 &&
      typeof data.startTime === 'string' &&
      String(data.startTime).trim().length > 0;
    if (!hasStartAt && !hasDateAndTime) {
      incrementSkip('missingDateTime');
      continue;
    }
    if (!isFutureSession(data)) {
      incrementSkip('pastSession');
      continue;
    }
    const status = normalizeStatusValue(data.status);
    if (NON_REASSIGNABLE_SESSION_STATUSES.has(status)) {
      if (status === 'rescheduled' || status === 'reschedule') {
        incrementSkip('rescheduledOrException');
      } else {
        incrementSkip('completedOrStatusLocked');
      }
      continue;
    }
    if (hasSessionFinanceOrLockMarkers(data)) {
      incrementSkip('completedOrStatusLocked');
      continue;
    }
    if (hasAttendanceMarked(data)) {
      incrementSkip('attendanceMarked');
      continue;
    }
    if (isScheduleExceptionSession(data)) {
      const source = String(data.source || '').trim().toLowerCase();
      if (source.includes('reschedule')) {
        incrementSkip('rescheduledOrException');
      } else {
        incrementSkip('makeupOrManual');
      }
      continue;
    }

    const financeLinkStatus = await checkFinanceLinked(docSnap.id, data);
    if (financeLinkStatus === 'linked') {
      incrementSkip('financeLinked');
      continue;
    }
    if (financeLinkStatus === 'unverified') {
      incrementSkip('financeLinkUnverified');
      continue;
    }
    eligibleDocs.push(docSnap);
  }

  const updates: Record<string, unknown> = {
    teacherId: newTeacherId,
    updatedBy: actorUid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    teacherReassignedFrom: previousTeacherId || null,
    teacherReassignedAt: admin.firestore.FieldValue.serverTimestamp(),
    reassignedFromTeacherId: previousTeacherId || null,
  };
  if (newTeacherName) updates.teacherName = newTeacherName;
  updates.teacherEmail = newTeacherEmail || null;
  const count = await batchUpdate(eligibleDocs, updates);
  const sessionsScanned = snap.docs.length;
  const sessionsSkipped = sessionsScanned - count;
  return {
    sessionsScanned,
    sessionsUpdated: count,
    sessionsSkipped,
    skipReasonCounts,
  };
}

export const setEnrollmentStatus = onCall({ region: REGION }, async (request) => {
  const enrollmentId = String(request.data?.enrollmentId || '').trim();
  const rawStatus = String(request.data?.status || '').trim();
  const reason = request.data?.reason ? String(request.data.reason) : null;
  const actor = request.auth?.uid || null;

  if (!enrollmentId || !rawStatus) {
    throw new HttpsError('invalid-argument', 'enrollmentId and status are required');
  }

  try {
    await ensureAdmin(request.auth);

    const db = admin.firestore();
    const enrRef = db.collection('enrollments').doc(enrollmentId);
    const enrSnap = await enrRef.get();

    if (!enrSnap.exists) {
      throw new HttpsError('not-found', 'Enrollment not found');
    }

    const canonicalStatus = normalizeEnrollmentStatus(rawStatus);
    const isTerminal = TERMINAL.has(canonicalStatus);
    const enrollmentData = (enrSnap.data() || {}) as Record<string, unknown>;
    const updates: Record<string, any> = {
      ...buildEnrollmentCanonicalPatch(enrollmentId, enrollmentData),
      status: canonicalStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: actor,
    };

    if (reason) updates.endReason = reason;
    if (isTerminal) updates.endedAt = admin.firestore.FieldValue.serverTimestamp();

    await enrRef.set(updates, { merge: true });

    let cancelledSessions = 0;
    if (canonicalStatus === 'paused') {
      cancelledSessions = await cancelFutureSessionsByEnrollmentId(enrollmentId, 'paused');
    } else if (isTerminal) {
      cancelledSessions = await cancelFutureSessionsByEnrollmentId(enrollmentId, 'enrollment_ended');
    }

    return {
      ok: true,
      updatedEnrollmentId: enrollmentId,
      cancelledSessionsCount: cancelledSessions,
      message: `Enrollment set to ${canonicalStatus}`,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('setEnrollmentStatus failed', {
      enrollmentId,
      requestedStatus: rawStatus || 'unknown',
      reason: reason || null,
      actor,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new HttpsError('internal', 'Failed to update enrollment status. Please retry or contact support.');
  }
});

export const reassignEnrollmentTeacher = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const enrollmentId = String(request.data?.enrollmentId || '').trim();
  const newTeacherId = String(request.data?.newTeacherId || '').trim();

  if (!enrollmentId || !newTeacherId) {
    throw new HttpsError('invalid-argument', 'enrollmentId and newTeacherId are required');
  }
  const actorIdentity =
    (typeof request.auth?.token?.email === 'string' && request.auth?.token?.email.trim())
      ? request.auth.token.email.trim()
      : (request.auth?.uid || null);

  const db = admin.firestore();
  const enrRef = db.collection('enrollments').doc(enrollmentId);
  const enrSnap = await enrRef.get();

  if (!enrSnap.exists) {
    throw new HttpsError('not-found', 'Enrollment not found');
  }

  const enrollment = (enrSnap.data() || {}) as Record<string, unknown>;
  const canonicalKidId = toOptionalId(enrollment.kidId);
  if (!canonicalKidId) {
    throw new HttpsError(
      'failed-precondition',
      'Cannot reassign teacher because this enrollment has a broken student link. Repair the student link first.'
    );
  }

  const canonicalKidSnap = await db.collection('kids').doc(canonicalKidId).get();
  if (!canonicalKidSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'Cannot reassign teacher because the linked child profile no longer exists.'
    );
  }

  const courseId = toOptionalId(enrollment.courseId) || toOptionalId((enrollment as any).course_id) || toOptionalId((enrollment as any).course);
  if (courseId) {
    const duplicatesSnap = await db
      .collection('enrollments')
      .where('kidId', '==', canonicalKidId)
      .where('courseId', '==', courseId)
      .get();
    const hasOtherActiveLike = duplicatesSnap.docs.some((docSnap) => {
      if (docSnap.id === enrollmentId) return false;
      const data = docSnap.data() || {};
      const archived = data.archived === true || Boolean(data.archivedAt);
      if (archived) return false;
      const status = normalizeEnrollmentStatus(String(data.status || ''));
      return !TERMINAL.has(status);
    });
    if (hasOtherActiveLike) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot reassign teacher because another active enrollment exists for the same child and course. Resolve duplicate active enrollments first.'
      );
    }
  }

  const previousTeacherId = toOptionalId(enrollment.teacherId);
  const previousTeacherNameFromEnrollment = toOptionalId((enrollment as any).teacherName);
  const previousTeacherEmailFromEnrollment = toOptionalId((enrollment as any).teacherEmail);
  if (previousTeacherId && previousTeacherId === newTeacherId) {
    throw new HttpsError('failed-precondition', 'Selected teacher is already assigned to this enrollment.');
  }
  const teacherIds = [newTeacherId];

  const teacherSnap = await db.collection('users').doc(newTeacherId).get();
  if (!teacherSnap.exists) {
    throw new HttpsError('failed-precondition', 'Selected teacher profile does not exist.');
  }
  const teacherData = (teacherSnap.data() || {}) as Record<string, unknown>;
  const teacherRole = normalizeStatusValue((teacherData as any).role);
  const teacherRoles = Array.isArray((teacherData as any).roles)
    ? ((teacherData as any).roles as unknown[])
        .map((role) => normalizeStatusValue(role))
        .filter(Boolean)
    : [];
  if (teacherRole !== 'teacher' && !teacherRoles.includes('teacher')) {
    throw new HttpsError('failed-precondition', 'Selected user is not a teacher.');
  }

  const newTeacherDisplayName = toOptionalId((teacherData as any).displayName);
  const newTeacherEmail = toOptionalId((teacherData as any).email);
  const newTeacherName = newTeacherDisplayName
    || toOptionalId((teacherData as any).name)
    || newTeacherEmail
    || newTeacherId;

  let previousTeacherName = previousTeacherNameFromEnrollment;
  let previousTeacherEmail = previousTeacherEmailFromEnrollment;
  if (previousTeacherId && (!previousTeacherName || !previousTeacherEmail)) {
    const previousTeacherSnap = await db.collection('users').doc(previousTeacherId).get();
    if (previousTeacherSnap.exists) {
      const previousTeacherData = (previousTeacherSnap.data() || {}) as Record<string, unknown>;
      if (!previousTeacherName) {
        previousTeacherName =
          toOptionalId((previousTeacherData as any).displayName) ||
          toOptionalId((previousTeacherData as any).name) ||
          null;
      }
      if (!previousTeacherEmail) {
        previousTeacherEmail = toOptionalId((previousTeacherData as any).email);
      }
    }
  }
  const reassignmentReason = toOptionalId(request.data?.reassignmentReason);

  const enrollmentPatch: Record<string, unknown> = {
    teacherId: newTeacherId,
    teacherIds,
    teacherName: newTeacherName,
    teacherEmail: newTeacherEmail || null,
    teacherDisplayName: newTeacherDisplayName || newTeacherName,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: actorIdentity,
    teacherReassignedAt: admin.firestore.FieldValue.serverTimestamp(),
    teacherReassignedBy: actorIdentity,
    reassignedAt: admin.firestore.FieldValue.serverTimestamp(),
    reassignedBy: actorIdentity,
    previousTeacherId: previousTeacherId || null,
    previousTeacherName: previousTeacherName || null,
    previousTeacherEmail: previousTeacherEmail || null,
  };
  if (reassignmentReason) enrollmentPatch.reassignmentReason = reassignmentReason;

  await enrRef.set(enrollmentPatch, { merge: true });

  const sessionUpdateSummary = await updateSessionsTeacherByEnrollmentId(
    enrollmentId,
    newTeacherId,
    newTeacherName,
    newTeacherEmail,
    previousTeacherId,
    actorIdentity
  );

  const auditRef = enrRef.collection('teacherReassignments').doc();
  await auditRef.set(
    {
      enrollmentId,
      kidId: canonicalKidId,
      studentId:
        toOptionalId((enrollment as any).studentId) ||
        toOptionalId((enrollment as any).kidId) ||
        null,
      studentName:
        toOptionalId((enrollment as any).studentName) ||
        toOptionalId((enrollment as any).childName) ||
        toOptionalId((enrollment as any).kidName) ||
        null,
      courseId: courseId || null,
      courseName:
        toOptionalId((enrollment as any).courseName) ||
        toOptionalId((enrollment as any).courseTitle) ||
        null,
      oldTeacherId: previousTeacherId || null,
      oldTeacherName: previousTeacherName || null,
      oldTeacherEmail: previousTeacherEmail || null,
      newTeacherId,
      newTeacherName,
      newTeacherEmail: newTeacherEmail || null,
      changedBy: actorIdentity,
      changedAt: admin.firestore.FieldValue.serverTimestamp(),
      reason: reassignmentReason || null,
      sessionsScanned: sessionUpdateSummary.sessionsScanned,
      sessionsUpdated: sessionUpdateSummary.sessionsUpdated,
      sessionsSkipped: sessionUpdateSummary.sessionsSkipped,
      skipReasonCounts: sessionUpdateSummary.skipReasonCounts,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ok: true,
    updatedEnrollmentId: enrollmentId,
    updatedSessionsCount: sessionUpdateSummary.sessionsUpdated,
    sessionsScanned: sessionUpdateSummary.sessionsScanned,
    sessionsSkipped: sessionUpdateSummary.sessionsSkipped,
    skipReasonCounts: sessionUpdateSummary.skipReasonCounts,
    message: 'Enrollment teacher updated',
  };
});

export const archiveKid = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const kidId = String(request.data?.kidId || '').trim();
  const reason = request.data?.reason ? String(request.data.reason) : null;

  if (!kidId) {
    throw new HttpsError('invalid-argument', 'kidId is required');
  }

  const db = admin.firestore();
  const kidRef = db.collection('kids').doc(kidId);
  const kidSnap = await kidRef.get();

  if (!kidSnap.exists) {
    throw new HttpsError('not-found', 'Kid not found');
  }

  const enrollments: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  const queries = [
    db.collection('enrollments').where('kidId', '==', kidId),
    db.collection('enrollments').where('studentId', '==', kidId),
    db.collection('enrollments').where('kidIds', 'array-contains', kidId),
  ];

  for (const q of queries) {
    const snap = await q.get();
    snap.docs.forEach((docSnap) => enrollments.push(docSnap));
  }

  const seen = new Set<string>();
  for (const docSnap of enrollments) {
    if (seen.has(docSnap.id)) continue;
    seen.add(docSnap.id);
    const status = normalizeEnrollmentStatus((docSnap.data() as any)?.status || '');
    const activeLike = ACTIVE_LIKE.has(status) || status === 'active' || status === 'trial' || status === 'paused';
    if (activeLike) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot archive kid with active enrollments'
      );
    }
  }

  await kidRef.set(
    {
      status: 'archived',
      archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      archivedReason: reason || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth?.uid || null,
    },
    { merge: true }
  );

  const cancelledSessions = await cancelFutureSessionsByKidId(kidId, 'kid_archived');

  return {
    ok: true,
    cancelledSessionsCount: cancelledSessions,
    message: 'Kid archived',
  };
});
