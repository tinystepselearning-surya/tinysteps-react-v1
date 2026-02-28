import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ensureAdmin } from './helpers/adminGuard';

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

function normalizeEnrollmentStatus(value: string): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

function resolveKidIdFromEnrollment(data: any): string | null {
  return data?.kidId || data?.studentId || (Array.isArray(data?.kidIds) ? data.kidIds[0] : null) || null;
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

async function updateSessionsTeacherByEnrollmentId(enrollmentId: string, newTeacherId: string) {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const snap = await db
    .collection('classSessions')
    .where('enrollmentId', '==', enrollmentId)
    .where('startAt', '>=', now)
    .get();

  const updates = {
    teacherId: newTeacherId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const count = await batchUpdate(snap.docs, updates);
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
  const updates: Record<string, any> = {
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

  const enrollment = enrSnap.data() as any;
  const kidId = resolveKidIdFromEnrollment(enrollment);

  await enrRef.set(
    {
      teacherId: newTeacherId,
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

  const updatedSessions = await updateSessionsTeacherByEnrollmentId(enrollmentId, newTeacherId);

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
