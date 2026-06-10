import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

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

function normalizeLower(value: unknown): string {
  return toCleanText(value).toLowerCase();
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

function isRejectedStudentDisplayName(value: unknown): boolean {
  return !cleanStudentDisplayName(value) && Boolean(toCleanText(value));
}

function isLikelyCourseIdLike(value: unknown, courseId?: string): boolean {
  const text = toCleanText(value);
  if (!text) return false;
  const lower = text.toLowerCase();
  const normalizedCourseId = toCleanText(courseId).toLowerCase();
  if (normalizedCourseId && lower === normalizedCourseId) return true;
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(text);
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

function toAuditRow(
  sessionId: string,
  row: FirestoreRow,
  enrollment?: FirestoreRow | null,
  kid?: FirestoreRow | null,
) {
  const teacherAliasIds = collectTeacherAliasIds(row);
  const displayChildNameUsed =
    cleanStudentDisplayName(row.childName) ||
    cleanStudentDisplayName(row.studentName) ||
    cleanStudentDisplayName(row.kidName) ||
    cleanStudentDisplayName(enrollment?.childName) ||
    cleanStudentDisplayName(enrollment?.studentName) ||
    cleanStudentDisplayName(enrollment?.kidName) ||
    cleanStudentDisplayName(kid?.fullName) ||
    cleanStudentDisplayName(kid?.studentName) ||
    cleanStudentDisplayName(kid?.displayName) ||
    cleanStudentDisplayName(kid?.name) ||
    'Student';
  const courseId =
    toCleanText(row.courseId) ||
    toCleanText((enrollment as any)?.courseId) ||
    toCleanText((enrollment as any)?.course_id);
  const courseCandidates = [
    toCleanText(row.courseName),
    toCleanText((row as any).courseTitle),
    toCleanText((row as any).courseLabel),
    toCleanText(enrollment?.courseName),
    toCleanText((enrollment as any)?.courseTitle),
    toCleanText((enrollment as any)?.courseLabel),
  ].filter(Boolean);
  const courseDisplayUsed =
    courseCandidates.find((candidate) => !isLikelyCourseIdLike(candidate, courseId)) ||
    courseCandidates[0] ||
    courseId ||
    null;

  return {
    sessionId,
    enrollmentId: toCleanText(row.enrollmentId) || null,
    date: toCleanText(row.date) || null,
    startTime: toCleanText(row.startTime) || null,
    teacherId: toCleanText(row.teacherId) || null,
    teacherIds: toTextList(row.teacherIds),
    assignedTeacherId: toCleanText(row.assignedTeacherId) || null,
    primaryTeacherId: toCleanText(row.primaryTeacherId) || null,
    teacherUid: toCleanText(row.teacherUid) || null,
    teacher_id: toCleanText(row.teacher_id) || null,
    teacherName: toCleanText(row.teacherName) || null,
    teacherEmail: toCleanText(row.teacherEmail) || null,
    kidId: toCleanText(row.kidId) || null,
    kidIds: collectKidIds(row),
    studentName: toCleanText(row.studentName) || null,
    kidName: toCleanText(row.kidName) || null,
    childName: toCleanText(row.childName) || null,
    enrollmentStudentName: toCleanText(enrollment?.studentName) || null,
    enrollmentKidName: toCleanText(enrollment?.kidName) || null,
    enrollmentChildName: toCleanText(enrollment?.childName) || null,
    displayChildNameUsed,
    childNameRejectedAsAssignedLabel:
      isRejectedStudentDisplayName(row.childName) ||
      isRejectedStudentDisplayName(row.studentName) ||
      isRejectedStudentDisplayName(row.kidName),
    courseId: courseId || null,
    courseName: toCleanText(row.courseName) || null,
    courseTitle: toCleanText((row as any).courseTitle) || null,
    courseLabel: toCleanText((row as any).courseLabel) || null,
    enrollmentCourseName: toCleanText(enrollment?.courseName) || null,
    enrollmentCourseTitle: toCleanText((enrollment as any)?.courseTitle) || null,
    courseDisplayUsed,
    aliasTeacherIds: teacherAliasIds,
  };
}

function teacherNameOrEmailLooksLikeMatch(
  session: FirestoreRow,
  teacherProfile: { displayName: string; name: string; email: string },
): boolean {
  const teacherName = normalizeLower(session.teacherName);
  const teacherEmail = normalizeLower(session.teacherEmail);

  return Boolean(
    (teacherProfile.email && teacherEmail && teacherProfile.email === teacherEmail) ||
    (teacherProfile.displayName && teacherName && teacherProfile.displayName === teacherName) ||
    (teacherProfile.name && teacherName && teacherProfile.name === teacherName),
  );
}

function hasAssignedPrimaryMismatch(session: FirestoreRow, teacherUid: string): boolean {
  const aliasIds = collectTeacherAliasIds(session);
  if (!aliasIds.length) return false;

  const assignedTeacherId = toCleanText(session.assignedTeacherId);
  const primaryTeacherId = toCleanText(session.primaryTeacherId);
  const teacherId = toCleanText(session.teacherId);

  return Boolean(
    (assignedTeacherId && assignedTeacherId !== teacherUid) ||
    (primaryTeacherId && primaryTeacherId !== teacherUid) ||
    (teacherId && teacherId !== teacherUid && (assignedTeacherId === teacherUid || primaryTeacherId === teacherUid)) ||
    (assignedTeacherId && primaryTeacherId && assignedTeacherId !== primaryTeacherId),
  );
}

function timestampFromYmdStart(ymd: string): admin.firestore.Timestamp {
  const [year, month, day] = ymd.split('-').map(Number);
  return admin.firestore.Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)));
}

function timestampFromYmdEndExclusive(ymd: string): admin.firestore.Timestamp {
  const [year, month, day] = ymd.split('-').map(Number);
  return admin.firestore.Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0)));
}

export const auditTeacherTodaySessions = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const teacherUid = toCleanText(request.data?.teacherUid);
  const date = toCleanText(request.data?.date);

  if (!teacherUid || !date) {
    throw new HttpsError('invalid-argument', 'teacherUid and date are required');
  }

  if (!YMD_RE.test(date)) {
    throw new HttpsError('invalid-argument', 'date must be YYYY-MM-DD');
  }

  const db = admin.firestore();
  const teacherSnap = await db.collection('users').doc(teacherUid).get();
  const teacherData = (teacherSnap.data() || {}) as FirestoreRow;
  const teacherProfile = {
    displayName: normalizeLower(teacherData.displayName),
    name: normalizeLower(teacherData.name),
    email: normalizeLower(teacherData.email),
  };

  const [byDateSnap, byStartAtSnap] = await Promise.all([
    db.collection('classSessions').where('date', '==', date).get(),
    db
      .collection('classSessions')
      .where('startAt', '>=', timestampFromYmdStart(date))
      .where('startAt', '<', timestampFromYmdEndExclusive(date))
      .get(),
  ]);

  const mergedSessions = new Map<string, FirestoreRow>();
  [...byDateSnap.docs, ...byStartAtSnap.docs].forEach((docSnap) => {
    mergedSessions.set(docSnap.id, docSnap.data() as FirestoreRow);
  });

  const enrollmentIds = Array.from(
    new Set(Array.from(mergedSessions.values()).map((session) => toCleanText(session.enrollmentId)).filter(Boolean)),
  );
  const kidIds = Array.from(
    new Set(Array.from(mergedSessions.values()).flatMap((session) => collectKidIds(session)).filter(Boolean)),
  );
  const enrollmentById = new Map<string, FirestoreRow>();
  const kidById = new Map<string, FirestoreRow>();

  await Promise.all([
    ...enrollmentIds.map(async (enrollmentId) => {
      const snap = await db.collection('enrollments').doc(enrollmentId).get();
      if (snap.exists) enrollmentById.set(enrollmentId, { id: snap.id, ...(snap.data() || {}) });
    }),
    ...kidIds.map(async (kidId) => {
      const snap = await db.collection('kids').doc(kidId).get();
      if (snap.exists) kidById.set(kidId, { id: snap.id, ...(snap.data() || {}) });
    }),
  ]);

  const exactAliasMatches: ReturnType<typeof toAuditRow>[] = [];
  const nameOrEmailUidMismatches: ReturnType<typeof toAuditRow>[] = [];
  const missingTeacherId: ReturnType<typeof toAuditRow>[] = [];
  const missingTeacherIds: ReturnType<typeof toAuditRow>[] = [];
  const mismatchedAssignedPrimary: ReturnType<typeof toAuditRow>[] = [];

  mergedSessions.forEach((session, sessionId) => {
    const enrollment = enrollmentById.get(toCleanText(session.enrollmentId)) || null;
    const kid = kidById.get(collectKidIds(session)[0] || '') || null;
    const auditRow = toAuditRow(sessionId, session, enrollment, kid);
    const aliasMatch = auditRow.aliasTeacherIds.includes(teacherUid);
    const nameOrEmailMatch = teacherNameOrEmailLooksLikeMatch(session, teacherProfile);

    if (aliasMatch) {
      exactAliasMatches.push(auditRow);
      if (!auditRow.teacherId) missingTeacherId.push(auditRow);
      if (auditRow.teacherIds.length === 0) missingTeacherIds.push(auditRow);
      if (hasAssignedPrimaryMismatch(session, teacherUid)) mismatchedAssignedPrimary.push(auditRow);
      return;
    }

    if (nameOrEmailMatch) {
      nameOrEmailUidMismatches.push(auditRow);
      if (!auditRow.teacherId) missingTeacherId.push(auditRow);
      if (auditRow.teacherIds.length === 0) missingTeacherIds.push(auditRow);
      if (hasAssignedPrimaryMismatch(session, teacherUid)) mismatchedAssignedPrimary.push(auditRow);
    }
  });

  const result = {
    teacherUid,
    date,
    teacherProfile: {
      displayName: teacherProfile.displayName || null,
      name: teacherProfile.name || null,
      email: teacherProfile.email || null,
    },
    scannedSessionCount: mergedSessions.size,
    matchingSessionCount: exactAliasMatches.length,
    possibleUidMismatchCount: nameOrEmailUidMismatches.length,
    exactAliasMatches,
    nameOrEmailUidMismatches,
    missingTeacherId,
    missingTeacherIds,
    mismatchedAssignedPrimary,
  };

  logger.info('auditTeacherTodaySessions', result);
  return result;
});
