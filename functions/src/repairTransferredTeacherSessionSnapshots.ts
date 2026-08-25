import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from './helpers/adminGuard';
import { buildCanonicalTeacherWriteFields } from './helpers/teacherIdentity';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BATCH = 400;

type FirestoreRow = Record<string, unknown>;

function toCleanText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => toCleanText(entry)).filter(Boolean)));
}

function cleanStudentDisplayName(value: unknown): string {
  const text = toCleanText(value);
  if (!text) return '';
  if (/^\d+\s+assigned$/i.test(text)) return '';
  if (/^assigned$/i.test(text)) return '';
  if (/^\d+\s+students?$/i.test(text)) return '';
  if (/^(student|child|kid)$/i.test(text)) return '';
  return text;
}

function resolveStudentSnapshot(
  enrollment: FirestoreRow | null,
  kid: FirestoreRow | null,
): { studentName: string; kidName: string; childName: string } {
  const canonicalName =
    cleanStudentDisplayName(enrollment?.studentName) ||
    cleanStudentDisplayName(enrollment?.kidName) ||
    cleanStudentDisplayName(enrollment?.childName) ||
    cleanStudentDisplayName(kid?.studentName) ||
    cleanStudentDisplayName(kid?.fullName) ||
    cleanStudentDisplayName(kid?.displayName) ||
    cleanStudentDisplayName(kid?.name) ||
    '';

  return {
    studentName: cleanStudentDisplayName(enrollment?.studentName) || canonicalName,
    kidName: cleanStudentDisplayName(enrollment?.kidName) || canonicalName,
    childName: cleanStudentDisplayName(enrollment?.childName) || canonicalName,
  };
}

function isLikelyCourseIdLike(value: string, courseId: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  const normalizedCourseId = courseId.toLowerCase();
  if (normalizedCourseId && lower === normalizedCourseId) return true;
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(value);
}

function resolveCourseSnapshot(
  session: FirestoreRow,
  enrollment: FirestoreRow | null,
  course: FirestoreRow | null,
): { courseId: string; courseName: string; courseTitle: string } {
  const courseId =
    toCleanText(enrollment?.courseId) ||
    toCleanText((enrollment as any)?.course_id) ||
    toCleanText(session.courseId) ||
    toCleanText((session as any).course_id) ||
    '';

  const candidates = [
    toCleanText(session.courseName),
    toCleanText((session as any).courseTitle),
    toCleanText((session as any).courseLabel),
    toCleanText(enrollment?.courseName),
    toCleanText((enrollment as any)?.courseTitle),
    toCleanText((enrollment as any)?.courseLabel),
    toCleanText(course?.title),
    toCleanText(course?.name),
  ].filter(Boolean);

  const label = candidates.find((candidate) => !isLikelyCourseIdLike(candidate, courseId)) || candidates[0] || courseId;

  return {
    courseId,
    courseName: label,
    courseTitle: label,
  };
}

function buildTransferredJoinLinkPatch(joinUrl: string | null): Record<string, unknown> {
  const normalizedJoinUrl = toCleanText(joinUrl) || null;
  return {
    joinUrl: normalizedJoinUrl,
    meetingLink: null,
    classLink: null,
  };
}

function collectTeacherAliasIds(row: FirestoreRow): string[] {
  return Array.from(
    new Set([
      toCleanText(row.teacherId),
      ...toTextList(row.teacherIds),
      toCleanText(row.assignedTeacherId),
      toCleanText(row.primaryTeacherId),
      toCleanText(row.teacherUid),
      toCleanText(row.teacher_id),
    ].filter(Boolean)),
  );
}

function collectKidIds(row: FirestoreRow): string[] {
  return Array.from(
    new Set([
      toCleanText(row.kidId),
      toCleanText(row.studentId),
      toCleanText(row.childId),
      ...toTextList(row.kidIds),
      ...toTextList(row.studentIds),
      ...toTextList(row.childIds),
      ...toTextList(row.childrenIds),
    ].filter(Boolean)),
  );
}

function isFutureFromDate(session: FirestoreRow, fromDate: string): boolean {
  const date = toCleanText(session.date);
  if (date) return date >= fromDate;
  const startAt = session.startAt as admin.firestore.Timestamp | undefined;
  if (startAt?.toDate) {
    return startAt.toDate().toISOString().slice(0, 10) >= fromDate;
  }
  return false;
}

export const repairTransferredTeacherSessionSnapshots = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const enrollmentId = toCleanText(request.data?.enrollmentId);
  const kidId = toCleanText(request.data?.kidId);
  const fromTeacherUid = toCleanText(request.data?.fromTeacherUid);
  const toTeacherUid = toCleanText(request.data?.toTeacherUid);
  const fromDate = toCleanText(request.data?.fromDate);
  const replacementJoinUrl =
    toCleanText(request.data?.joinUrl) ||
    toCleanText(request.data?.meetingLink) ||
    toCleanText(request.data?.classLink) ||
    '';
  const dryRun = request.data?.dryRun === true;

  if (!toTeacherUid || !fromDate) {
    throw new HttpsError('invalid-argument', 'toTeacherUid and fromDate are required');
  }
  if (!enrollmentId && !kidId) {
    throw new HttpsError('invalid-argument', 'Provide enrollmentId or kidId');
  }
  if (!YMD_RE.test(fromDate)) {
    throw new HttpsError('invalid-argument', 'fromDate must be YYYY-MM-DD');
  }

  const db = admin.firestore();
  const teacherSnap = await db.collection('users').doc(toTeacherUid).get();
  if (!teacherSnap.exists) {
    throw new HttpsError('failed-precondition', 'Target teacher profile not found');
  }
  const teacherData = (teacherSnap.data() || {}) as FirestoreRow;

  const baseSnaps = await Promise.all([
    enrollmentId ? db.collection('classSessions').where('enrollmentId', '==', enrollmentId).get() : Promise.resolve(null),
    kidId ? db.collection('classSessions').where('kidIds', 'array-contains', kidId).get() : Promise.resolve(null),
  ]);

  const sessionMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  baseSnaps.forEach((snap) => {
    snap?.docs.forEach((docSnap) => {
      sessionMap.set(docSnap.id, docSnap);
    });
  });

  const candidateSessions = Array.from(sessionMap.values()).filter((docSnap) => {
    const data = (docSnap.data() || {}) as FirestoreRow;
    if (!isFutureFromDate(data, fromDate)) return false;

    const teacherAliases = collectTeacherAliasIds(data);
    if (teacherAliases.includes(toTeacherUid)) return true;
    if (fromTeacherUid && teacherAliases.includes(fromTeacherUid)) return true;
    return teacherAliases.length === 0;
  });

  const enrollmentCache = new Map<string, FirestoreRow | null>();
  const kidCache = new Map<string, FirestoreRow | null>();
  const courseCache = new Map<string, FirestoreRow | null>();

  const getEnrollment = async (session: FirestoreRow): Promise<FirestoreRow | null> => {
    const sessionEnrollmentId = enrollmentId || toCleanText(session.enrollmentId);
    if (!sessionEnrollmentId) return null;
    if (enrollmentCache.has(sessionEnrollmentId)) return enrollmentCache.get(sessionEnrollmentId) || null;
    const snap = await db.collection('enrollments').doc(sessionEnrollmentId).get();
    const data = snap.exists ? ({ id: snap.id, ...(snap.data() || {}) } as FirestoreRow) : null;
    enrollmentCache.set(sessionEnrollmentId, data);
    return data;
  };

  const getKid = async (session: FirestoreRow, enrollment: FirestoreRow | null): Promise<FirestoreRow | null> => {
    const resolvedKidId =
      kidId ||
      toCleanText(enrollment?.kidId) ||
      toCleanText(session.kidId) ||
      collectKidIds(session)[0] ||
      '';
    if (!resolvedKidId) return null;
    if (kidCache.has(resolvedKidId)) return kidCache.get(resolvedKidId) || null;
    const snap = await db.collection('kids').doc(resolvedKidId).get();
    const data = snap.exists ? ({ id: snap.id, ...(snap.data() || {}) } as FirestoreRow) : null;
    kidCache.set(resolvedKidId, data);
    return data;
  };

  const getCourse = async (session: FirestoreRow, enrollment: FirestoreRow | null): Promise<FirestoreRow | null> => {
    const courseId =
      toCleanText(enrollment?.courseId) ||
      toCleanText((enrollment as any)?.course_id) ||
      toCleanText(session.courseId) ||
      '';
    if (!courseId) return null;
    if (courseCache.has(courseId)) return courseCache.get(courseId) || null;
    const snap = await db.collection('courses').doc(courseId).get();
    const data = snap.exists ? ({ id: snap.id, ...(snap.data() || {}) } as FirestoreRow) : null;
    courseCache.set(courseId, data);
    return data;
  };

  let updatedCount = 0;
  const updatedSessionIds: string[] = [];
  let batch = db.batch();
  let batchOps = 0;

  for (const sessionSnap of candidateSessions) {
    const session = (sessionSnap.data() || {}) as FirestoreRow;
    const enrollment = await getEnrollment(session);
    const kid = await getKid(session, enrollment);
    const course = await getCourse(session, enrollment);
    const studentSnapshot = resolveStudentSnapshot(enrollment, kid);
    const courseSnapshot = resolveCourseSnapshot(session, enrollment, course);
    const resolvedKidIds = Array.from(
      new Set([
        ...collectKidIds(session),
        ...collectKidIds(enrollment || {}),
        ...(kidId ? [kidId] : []),
      ].filter(Boolean)),
    );
    const resolvedKidId =
      kidId ||
      toCleanText(enrollment?.kidId) ||
      toCleanText(session.kidId) ||
      resolvedKidIds[0] ||
      null;

    const patch = {
      ...buildCanonicalTeacherWriteFields(toTeacherUid),
      teacherName:
        toCleanText(teacherData.displayName) ||
        toCleanText(teacherData.name) ||
        toCleanText(teacherData.email) ||
        toTeacherUid,
      teacherEmail: toCleanText(teacherData.email) || null,
      ...(resolvedKidId ? { kidId: resolvedKidId, studentId: toCleanText(session.studentId) || resolvedKidId, childId: toCleanText(session.childId) || resolvedKidId } : {}),
      ...(resolvedKidIds.length > 0 ? { kidIds: resolvedKidIds } : {}),
      ...(toCleanText(enrollment?.id) || enrollmentId ? { enrollmentId: toCleanText(enrollment?.id) || enrollmentId } : {}),
      ...(studentSnapshot.studentName ? { studentName: studentSnapshot.studentName } : {}),
      ...(studentSnapshot.kidName ? { kidName: studentSnapshot.kidName } : {}),
      ...(studentSnapshot.childName ? { childName: studentSnapshot.childName } : {}),
      ...(courseSnapshot.courseId ? { courseId: courseSnapshot.courseId } : {}),
      ...(courseSnapshot.courseName ? { courseName: courseSnapshot.courseName, courseTitle: courseSnapshot.courseTitle, courseLabel: courseSnapshot.courseName } : {}),
      ...buildTransferredJoinLinkPatch(replacementJoinUrl || null),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'repairTransferredTeacherSessionSnapshots',
    };

    updatedCount += 1;
    updatedSessionIds.push(sessionSnap.id);

    if (!dryRun) {
      batch.set(sessionSnap.ref, patch, { merge: true });
      batchOps += 1;

      if (batchOps >= MAX_BATCH) {
        await batch.commit();
        batch = db.batch();
        batchOps = 0;
      }
    }
  }

  if (!dryRun && batchOps > 0) {
    await batch.commit();
  }

  const result = {
    enrollmentId: enrollmentId || null,
    kidId: kidId || null,
    fromTeacherUid: fromTeacherUid || null,
    toTeacherUid,
    fromDate,
    dryRun,
    scannedSessions: sessionMap.size,
    matchedFutureSessions: candidateSessions.length,
    updatedCount,
    updatedSessionIds,
  };

  logger.info('repairTransferredTeacherSessionSnapshots', result);
  return result;
});
