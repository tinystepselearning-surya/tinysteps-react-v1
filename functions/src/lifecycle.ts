import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
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
  'no_show',
  'noshow',
]);

function resolveKidIdFromEnrollment(data: any): string | null {
  return data?.kidId || data?.studentId || (Array.isArray(data?.kidIds) ? data.kidIds[0] : null) || null;
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
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
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
  const teacherId = toOptionalId(enrollment.teacherId) || teacherIds[0] || null;
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

  // Guardrail: never reassign already-finalized/billed sessions.
  const eligibleDocs = snap.docs.filter((docSnap) => {
    const data = docSnap.data() || {};
    if (!isFutureSession(data)) return false;
    const status = String(data.status || '').trim().toLowerCase();
    if (NON_REASSIGNABLE_SESSION_STATUSES.has(status)) return false;
    if (data.revenueAccrued === true) return false;
    return true;
  });

  const updates = {
    teacherId: newTeacherId,
    updatedBy: actorUid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const count = await batchUpdate(eligibleDocs, updates);
  return count;
}

export const setEnrollmentStatus = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const enrollmentId = String(request.data?.enrollmentId || '').trim();
  const rawStatus = String(request.data?.status || '').trim();
  const reason = request.data?.reason ? String(request.data.reason) : null;

  if (!enrollmentId || !rawStatus) {
    throw new HttpsError('invalid-argument', 'enrollmentId and status are required');
  }

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
    updatedBy: request.auth?.uid || null,
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
});

export const reassignEnrollmentTeacher = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const enrollmentId = String(request.data?.enrollmentId || '').trim();
  const newTeacherId = String(request.data?.newTeacherId || '').trim();

  if (!enrollmentId || !newTeacherId) {
    throw new HttpsError('invalid-argument', 'enrollmentId and newTeacherId are required');
  }

  const db = admin.firestore();
  const enrRef = db.collection('enrollments').doc(enrollmentId);
  const enrSnap = await enrRef.get();

  if (!enrSnap.exists) {
    throw new HttpsError('not-found', 'Enrollment not found');
  }

  const enrollment = (enrSnap.data() || {}) as Record<string, unknown>;
  const kidId = resolveKidIdFromEnrollment(enrollment);
  const teacherIds = toStringList(enrollment.teacherIds);
  if (!teacherIds.includes(newTeacherId)) teacherIds.unshift(newTeacherId);

  await enrRef.set(
    {
      ...buildEnrollmentCanonicalPatch(enrollmentId, enrollment),
      teacherId: newTeacherId,
      teacherIds,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth?.uid || null,
    },
    { merge: true }
  );

  if (kidId) {
    await db
      .collection('kids')
      .doc(kidId)
      .set(
        {
          teacherIds: admin.firestore.FieldValue.arrayUnion(newTeacherId),
          teacherId: newTeacherId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: request.auth?.uid || null,
        },
        { merge: true }
      );
  }

  const updatedSessions = await updateSessionsTeacherByEnrollmentId(
    enrollmentId,
    newTeacherId,
    request.auth?.uid || null
  );

  return {
    ok: true,
    updatedEnrollmentId: enrollmentId,
    updatedSessionsCount: updatedSessions,
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
