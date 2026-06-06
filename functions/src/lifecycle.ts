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

type TeacherIdentity = {
  teacherId: string;
  teacherIds: string[];
  teacherName: string | null;
  teacherEmail: string | null;
};

type StudentIdentity = {
  kidId: string | null;
  kidIds: string[];
  studentId: string | null;
  studentName: string | null;
  kidName: string | null;
  childName: string | null;
};

type EnrollmentIdentity = {
  enrollmentId: string;
  courseId: string | null;
  courseName: string | null;
  parentId: string | null;
  parentIds: string[];
};

type KidSyncSummary = {
  kidUpdated: boolean;
  teacherIds: string[];
  primaryTeacherId: string | null;
};

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function removeUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    const cleanedItems = value
      .map((item) => removeUndefinedDeep(item))
      .filter((item) => item !== undefined);
    return cleanedItems;
  }

  if (isPlainObject(value)) {
    const cleaned: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, item]) => {
      const nextValue = removeUndefinedDeep(item);
      if (nextValue !== undefined) {
        cleaned[key] = nextValue;
      }
    });
    return cleaned;
  }

  return value;
}

function normalizeStatusValue(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function isActiveLikeEnrollmentStatus(value: unknown): boolean {
  return ACTIVE_LIKE.has(normalizeEnrollmentStatus(value));
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function collectTeacherIds(record: Record<string, unknown> | undefined): string[] {
  if (!record) return [];
  return Array.from(
    new Set(
      [
        ...toStringList(record.teacherIds),
        toOptionalId(record.teacherId),
        toOptionalId((record as any).assignedTeacherId),
        toOptionalId((record as any).primaryTeacherId),
        toOptionalId((record as any).teacherUid),
        toOptionalId((record as any).teacher_id),
      ].filter((item): item is string => Boolean(item)),
    ),
  );
}

function collectKidIds(record: Record<string, unknown> | undefined): string[] {
  if (!record) return [];
  return Array.from(
    new Set(
      [
        ...toStringList(record.kidIds),
        toOptionalId(record.kidId),
        toOptionalId((record as any).studentId),
        toOptionalId((record as any).childId),
      ].filter((item): item is string => Boolean(item)),
    ),
  );
}

function resolveStudentNameParts(record: Record<string, unknown> | undefined): {
  studentName: string | null;
  kidName: string | null;
  childName: string | null;
} {
  if (!record) {
    return { studentName: null, kidName: null, childName: null };
  }
  const canonicalName =
    nonEmptyString((record as any).studentName) ||
    nonEmptyString((record as any).kidName) ||
    nonEmptyString((record as any).childName) ||
    nonEmptyString((record as any).fullName) ||
    nonEmptyString((record as any).displayName) ||
    nonEmptyString((record as any).name) ||
    null;
  return {
    studentName: nonEmptyString((record as any).studentName) || canonicalName,
    kidName: nonEmptyString((record as any).kidName) || canonicalName,
    childName: nonEmptyString((record as any).childName) || canonicalName,
  };
}

function resolveCourseName(record: Record<string, unknown> | undefined): string | null {
  if (!record) return null;
  return (
    nonEmptyString((record as any).courseName) ||
    nonEmptyString((record as any).courseTitle) ||
    nonEmptyString((record as any).courseLabel) ||
    nonEmptyString((record as any).programName) ||
    nonEmptyString((record as any).subject) ||
    null
  );
}

function buildTeacherIdentity(input: {
  teacherId: string;
  teacherName?: string | null;
  teacherEmail?: string | null;
}): TeacherIdentity {
  return {
    teacherId: input.teacherId,
    teacherIds: [input.teacherId],
    teacherName: input.teacherName || input.teacherId,
    teacherEmail: input.teacherEmail || null,
  };
}

function buildStudentIdentity(input: {
  enrollment: Record<string, unknown>;
  kid: Record<string, unknown> | undefined;
}): StudentIdentity {
  const enrollmentKidIds = collectKidIds(input.enrollment);
  const kidRecord = input.kid;
  const kidId =
    resolveKidIdFromEnrollment(input.enrollment) ||
    toOptionalId(kidRecord?.id) ||
    null;
  const mergedKidIds = Array.from(
    new Set([
      ...enrollmentKidIds,
      ...collectKidIds(kidRecord),
      ...(kidId ? [kidId] : []),
    ]),
  );
  const enrollmentName = resolveStudentNameParts(input.enrollment);
  const kidNameParts = resolveStudentNameParts(kidRecord);
  return {
    kidId,
    kidIds: mergedKidIds,
    studentId: toOptionalId((input.enrollment as any).studentId) || kidId,
    studentName: enrollmentName.studentName || kidNameParts.studentName,
    kidName: enrollmentName.kidName || kidNameParts.kidName,
    childName: enrollmentName.childName || kidNameParts.childName,
  };
}

function buildEnrollmentIdentity(input: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
}): EnrollmentIdentity {
  const parentIds = toStringList(input.enrollment.parentIds);
  const parentId = toOptionalId(input.enrollment.parentId) || parentIds[0] || null;
  const mergedParentIds = Array.from(new Set([...(parentId ? [parentId] : []), ...parentIds]));
  return {
    enrollmentId: input.enrollmentId,
    courseId:
      toOptionalId(input.enrollment.courseId) ||
      toOptionalId((input.enrollment as any).course_id) ||
      toOptionalId((input.enrollment as any).course) ||
      null,
    courseName: resolveCourseName(input.enrollment),
    parentId,
    parentIds: mergedParentIds,
  };
}

function resolveSessionTeacherIds(record: Record<string, unknown>): string[] {
  return collectTeacherIds(record);
}

function resolveSessionKidIds(record: Record<string, unknown>): string[] {
  return collectKidIds(record);
}

function resolveSessionIsFuture(raw: Record<string, unknown>, nowMs: number): boolean {
  const startAt = raw?.startAt;
  if (typeof (startAt as any)?.toMillis === 'function') {
    return (startAt as any).toMillis() >= nowMs;
  }
  if (startAt) {
    const parsedStartAt = new Date(startAt as any);
    if (!Number.isNaN(parsedStartAt.getTime())) {
      return parsedStartAt.getTime() >= nowMs;
    }
  }

  const dateYmd = String(raw?.date || '').trim();
  const startTime = String(raw?.startTime || '').trim();
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
}

async function getQueryDocs(
  queryRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const snap = await queryRef.get();
  return snap.docs;
}

function mergeDocMaps(
  target: Map<string, FirebaseFirestore.QueryDocumentSnapshot>,
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
) {
  docs.forEach((docSnap) => {
    if (!target.has(docSnap.id)) {
      target.set(docSnap.id, docSnap);
    }
  });
}

function buildSessionRepairPatch(args: {
  existing: Record<string, unknown>;
  teacher: TeacherIdentity;
  student: StudentIdentity;
  enrollment: EnrollmentIdentity;
  actorIdentity: string | null;
  previousTeacherId: string | null;
  includeEnrollmentId: boolean;
}): Record<string, unknown> {
  const { existing, teacher, student, enrollment, actorIdentity, previousTeacherId, includeEnrollmentId } = args;
  const currentStudentName = nonEmptyString((existing as any).studentName);
  const currentKidName = nonEmptyString((existing as any).kidName);
  const currentChildName = nonEmptyString((existing as any).childName);
  const currentCourseName =
    nonEmptyString((existing as any).courseName) ||
    nonEmptyString((existing as any).courseTitle) ||
    nonEmptyString((existing as any).courseLabel);
  const kidIds = resolveSessionKidIds(existing);
  const mergedKidIds = Array.from(
    new Set([
      ...kidIds,
      ...student.kidIds,
      ...(student.kidId ? [student.kidId] : []),
    ]),
  );
  const parentIds = Array.from(
    new Set([
      ...toStringList((existing as any).parentIds),
      ...enrollment.parentIds,
      ...((enrollment.parentId && !toStringList((existing as any).parentIds).includes(enrollment.parentId))
        ? [enrollment.parentId]
        : []),
    ]),
  );

  return removeUndefinedDeep({
    teacherId: teacher.teacherId,
    teacherIds: teacher.teacherIds,
    teacherName: teacher.teacherName,
    teacherEmail: teacher.teacherEmail,
    assignedTeacherId: teacher.teacherId,
    primaryTeacherId: teacher.teacherId,
    teacherUid: teacher.teacherId,
    teacher_id: teacher.teacherId,
    ...(includeEnrollmentId ? { enrollmentId: enrollment.enrollmentId } : {}),
    ...(student.kidId && !toOptionalId((existing as any).kidId) ? { kidId: student.kidId } : {}),
    ...(student.studentId && !toOptionalId((existing as any).studentId) ? { studentId: student.studentId } : {}),
    ...(mergedKidIds.length > 0 ? { kidIds: mergedKidIds } : {}),
    ...(currentStudentName ? {} : student.studentName ? { studentName: student.studentName } : {}),
    ...(currentKidName ? {} : student.kidName ? { kidName: student.kidName } : {}),
    ...(currentChildName ? {} : student.childName ? { childName: student.childName } : {}),
    ...(toOptionalId((existing as any).courseId) ? {} : enrollment.courseId ? { courseId: enrollment.courseId } : {}),
    ...(currentCourseName ? {} : enrollment.courseName ? { courseName: enrollment.courseName } : {}),
    ...(toOptionalId((existing as any).parentId) ? {} : enrollment.parentId ? { parentId: enrollment.parentId } : {}),
    ...(parentIds.length > 0 ? { parentIds } : {}),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: actorIdentity,
    reassignedFromTeacherId: previousTeacherId || null,
    teacherReassignedFrom: previousTeacherId || null,
    reassignedAt: admin.firestore.FieldValue.serverTimestamp(),
    teacherReassignedAt: admin.firestore.FieldValue.serverTimestamp(),
  }) as Record<string, unknown>;
}

async function syncKidTeacherOwnership(args: {
  db: FirebaseFirestore.Firestore;
  kidId: string;
  newTeacherId: string;
  enrollmentId: string;
  actorIdentity: string | null;
}): Promise<KidSyncSummary> {
  const { db, kidId, newTeacherId, enrollmentId, actorIdentity } = args;
  const kidRef = db.collection('kids').doc(kidId);
  const kidSnap = await kidRef.get();
  if (!kidSnap.exists) {
    return { kidUpdated: false, teacherIds: [newTeacherId], primaryTeacherId: newTeacherId };
  }

  const enrollmentQueries = [
    db.collection('enrollments').where('kidId', '==', kidId),
    db.collection('enrollments').where('studentId', '==', kidId),
    db.collection('enrollments').where('kidIds', 'array-contains', kidId),
  ];
  const activeTeacherIds = new Set<string>();
  const seenEnrollmentIds = new Set<string>();
  for (const enrollmentQuery of enrollmentQueries) {
    const snap = await enrollmentQuery.get();
    snap.docs.forEach((docSnap) => {
      if (seenEnrollmentIds.has(docSnap.id)) return;
      seenEnrollmentIds.add(docSnap.id);
      const data = (docSnap.data() || {}) as Record<string, unknown>;
      if (!isActiveLikeEnrollmentStatus(data.status) && docSnap.id !== enrollmentId) return;
      collectTeacherIds(data).forEach((teacherId) => activeTeacherIds.add(teacherId));
    });
  }
  activeTeacherIds.add(newTeacherId);

  const kidData = (kidSnap.data() || {}) as Record<string, unknown>;
  const currentPrimaryTeacherId = toOptionalId((kidData as any).teacherId);
  const nextTeacherIds = Array.from(activeTeacherIds);
  let nextPrimaryTeacherId: string | null = currentPrimaryTeacherId;
  if (nextTeacherIds.length === 1) {
    nextPrimaryTeacherId = nextTeacherIds[0];
  } else if (!nextPrimaryTeacherId || !activeTeacherIds.has(nextPrimaryTeacherId)) {
    nextPrimaryTeacherId = newTeacherId;
  }

  const patch = removeUndefinedDeep({
    teacherIds: nextTeacherIds,
    ...(nextPrimaryTeacherId ? { teacherId: nextPrimaryTeacherId } : {}),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: actorIdentity,
  }) as Record<string, unknown>;
  await kidRef.set(patch, { merge: true });

  return {
    kidUpdated: true,
    teacherIds: nextTeacherIds,
    primaryTeacherId: nextPrimaryTeacherId,
  };
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

async function repairFutureSessionsForEnrollment(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  teacher: TeacherIdentity;
  previousTeacherId: string | null;
  actorIdentity: string | null;
  kidRecord?: Record<string, unknown>;
  dryRun?: boolean;
}) {
  const {
    enrollmentId,
    enrollment,
    teacher,
    previousTeacherId,
    actorIdentity,
    kidRecord,
    dryRun = false,
  } = args;
  const db = admin.firestore();
  const nowMs = Date.now();
  const studentIdentity = buildStudentIdentity({ enrollment, kid: kidRecord });
  const enrollmentIdentity = buildEnrollmentIdentity({ enrollmentId, enrollment });
  const primaryDocs = await getQueryDocs(
    db.collection('classSessions').where('enrollmentId', '==', enrollmentId),
  );
  const allDocs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  mergeDocMaps(allDocs, primaryDocs);

  if (studentIdentity.kidId) {
    const legacyQueries = [
      db.collection('classSessions').where('kidId', '==', studentIdentity.kidId),
      db.collection('classSessions').where('studentId', '==', studentIdentity.kidId),
      db.collection('classSessions').where('kidIds', 'array-contains', studentIdentity.kidId),
    ];
    const legacyDocs = await Promise.all(legacyQueries.map((queryRef) => getQueryDocs(queryRef)));
    legacyDocs.forEach((docs) => mergeDocMaps(allDocs, docs));
  }

  const skipReasonCounts: Record<string, number> = {
    pastSession: 0,
    completedOrStatusLocked: 0,
    attendanceMarked: 0,
    financeLinked: 0,
    financeLinkUnverified: 0,
    makeupOrManual: 0,
    rescheduledOrException: 0,
    missingDateTime: 0,
    teacherMismatch: 0,
    courseMismatch: 0,
    kidMismatch: 0,
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

  const docsToUpdate: Array<{
    ref: FirebaseFirestore.DocumentReference;
    patch: Record<string, unknown>;
    matchedBy: 'enrollmentId' | 'legacyIdentity';
    backfilledIdentity: boolean;
  }> = [];
  const previousTeacherIds = previousTeacherId ? [previousTeacherId] : [];
  let sessionsMatchedByEnrollmentId = 0;
  let sessionsMatchedByLegacyIdentity = 0;

  for (const docSnap of allDocs.values()) {
    const data = (docSnap.data() || {}) as Record<string, unknown>;
    const matchedByEnrollmentId = toOptionalId((data as any).enrollmentId) === enrollmentId;
    const sessionKidIds = resolveSessionKidIds(data);
    const sessionTeacherIds = resolveSessionTeacherIds(data);
    const sessionCourseId = toOptionalId((data as any).courseId);
    const kidMatches =
      studentIdentity.kidIds.length === 0 ||
      sessionKidIds.some((kidId) => studentIdentity.kidIds.includes(kidId));
    if (!kidMatches) {
      incrementSkip('kidMismatch');
      continue;
    }
    if (
      enrollmentIdentity.courseId &&
      sessionCourseId &&
      sessionCourseId !== enrollmentIdentity.courseId
    ) {
      incrementSkip('courseMismatch');
      continue;
    }
    const legacyTeacherMatch =
      previousTeacherIds.length > 0 &&
      sessionTeacherIds.some((teacherId) => previousTeacherIds.includes(teacherId));
    if (!matchedByEnrollmentId && !legacyTeacherMatch) {
      incrementSkip('teacherMismatch');
      continue;
    }

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
    if (!resolveSessionIsFuture(data, nowMs)) {
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

    const patch = buildSessionRepairPatch({
      existing: data,
      teacher,
      student: studentIdentity,
      enrollment: enrollmentIdentity,
      actorIdentity,
      previousTeacherId,
      includeEnrollmentId: !matchedByEnrollmentId,
    });
    const backfilledIdentity =
      (!nonEmptyString((data as any).studentName) && Boolean((patch as any).studentName)) ||
      (!nonEmptyString((data as any).kidName) && Boolean((patch as any).kidName)) ||
      (!nonEmptyString((data as any).childName) && Boolean((patch as any).childName)) ||
      (!nonEmptyString((data as any).courseName) && Boolean((patch as any).courseName)) ||
      (!Array.isArray((data as any).teacherIds) && Array.isArray((patch as any).teacherIds)) ||
      (!toOptionalId((data as any).enrollmentId) && Boolean((patch as any).enrollmentId));
    docsToUpdate.push({
      ref: docSnap.ref,
      patch,
      matchedBy: matchedByEnrollmentId ? 'enrollmentId' : 'legacyIdentity',
      backfilledIdentity,
    });
    if (matchedByEnrollmentId) {
      sessionsMatchedByEnrollmentId += 1;
    } else {
      sessionsMatchedByLegacyIdentity += 1;
    }
  }

  if (!dryRun) {
    for (let index = 0; index < docsToUpdate.length; index += MAX_BATCH) {
      const batch = db.batch();
      docsToUpdate.slice(index, index + MAX_BATCH).forEach((entry) => {
        batch.set(entry.ref, entry.patch, { merge: true });
      });
      await batch.commit();
    }
  }

  const sessionsScanned = allDocs.size;
  const sessionsSkipped = sessionsScanned - docsToUpdate.length;
  return {
    sessionsScanned,
    sessionsMatchedByEnrollmentId,
    sessionsMatchedByLegacyIdentity,
    sessionsUpdated: docsToUpdate.length,
    sessionsSkipped,
    identitySnapshotsBackfilled: docsToUpdate.filter((entry) => entry.backfilledIdentity).length,
    skipReasonCounts,
  };
}

export const setEnrollmentStatus = onCall({ region: REGION }, async (request) => {
  const enrollmentId = String(request.data?.enrollmentId || '').trim();
  const rawStatus = String(request.data?.status || '').trim();
  const reason = request.data?.reason ? String(request.data.reason) : null;
  const actor = request.auth?.uid || null;
  const callerRoleRaw = request.auth?.token?.role;
  const callerRolesRaw = request.auth?.token?.roles;
  const callerRole =
    typeof callerRoleRaw === 'string'
      ? callerRoleRaw
      : Array.isArray(callerRolesRaw)
        ? callerRolesRaw.filter((role) => typeof role === 'string').join(',')
        : 'unknown';

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

    const cleanPatch = removeUndefinedDeep(updates) as Record<string, unknown>;
    console.log('[setEnrollmentStatus] writing patch keys', Object.keys(cleanPatch));
    await enrRef.set(cleanPatch, { merge: true });

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

    console.error('[setEnrollmentStatus] unexpected failure', {
      enrollmentId,
      requestedStatus: rawStatus || 'unknown',
      callerUid: actor,
      callerRole,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
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
  const teacherIdentity = buildTeacherIdentity({
    teacherId: newTeacherId,
    teacherName: newTeacherName,
    teacherEmail: newTeacherEmail,
  });
  const studentIdentity = buildStudentIdentity({
    enrollment,
    kid: canonicalKidSnap.exists ? ({ id: canonicalKidSnap.id, ...(canonicalKidSnap.data() || {}) } as Record<string, unknown>) : undefined,
  });
  const enrollmentIdentity = buildEnrollmentIdentity({ enrollmentId, enrollment });

  const enrollmentPatch: Record<string, unknown> = {
    teacherId: newTeacherId,
    teacherIds,
    teacherName: newTeacherName,
    teacherEmail: newTeacherEmail || null,
    teacherDisplayName: newTeacherDisplayName || newTeacherName,
    assignedTeacherId: newTeacherId,
    primaryTeacherId: newTeacherId,
    teacherUid: newTeacherId,
    teacher_id: newTeacherId,
    ...(studentIdentity.kidId ? { kidId: studentIdentity.kidId } : {}),
    ...(studentIdentity.studentId ? { studentId: studentIdentity.studentId } : {}),
    ...(studentIdentity.kidIds.length > 0 ? { kidIds: studentIdentity.kidIds } : {}),
    ...(studentIdentity.studentName ? { studentName: studentIdentity.studentName } : {}),
    ...(studentIdentity.kidName ? { kidName: studentIdentity.kidName } : {}),
    ...(studentIdentity.childName ? { childName: studentIdentity.childName } : {}),
    ...(enrollmentIdentity.courseId ? { courseId: enrollmentIdentity.courseId } : {}),
    ...(enrollmentIdentity.courseName ? { courseName: enrollmentIdentity.courseName } : {}),
    ...(enrollmentIdentity.parentId ? { parentId: enrollmentIdentity.parentId } : {}),
    ...(enrollmentIdentity.parentIds.length > 0 ? { parentIds: enrollmentIdentity.parentIds } : {}),
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

  const cleanEnrollmentPatch = removeUndefinedDeep(enrollmentPatch) as Record<string, unknown>;
  await enrRef.set(cleanEnrollmentPatch, { merge: true });

  const sessionUpdateSummary = await repairFutureSessionsForEnrollment({
    enrollmentId,
    enrollment: {
      ...enrollment,
      ...cleanEnrollmentPatch,
    },
    teacher: teacherIdentity,
    previousTeacherId,
    actorIdentity,
    kidRecord: canonicalKidSnap.exists ? ({ id: canonicalKidSnap.id, ...(canonicalKidSnap.data() || {}) } as Record<string, unknown>) : undefined,
  });
  const kidSyncSummary = isActiveLikeEnrollmentStatus(enrollment.status)
    ? await syncKidTeacherOwnership({
        db,
        kidId: canonicalKidId,
        newTeacherId,
        enrollmentId,
        actorIdentity,
      })
    : { kidUpdated: false, teacherIds: [], primaryTeacherId: null };

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
      sessionsMatchedByEnrollmentId: sessionUpdateSummary.sessionsMatchedByEnrollmentId,
      sessionsMatchedByLegacyIdentity: sessionUpdateSummary.sessionsMatchedByLegacyIdentity,
      sessionsUpdated: sessionUpdateSummary.sessionsUpdated,
      sessionsSkipped: sessionUpdateSummary.sessionsSkipped,
      identitySnapshotsBackfilled: sessionUpdateSummary.identitySnapshotsBackfilled,
      skipReasonCounts: sessionUpdateSummary.skipReasonCounts,
      kidUpdated: kidSyncSummary.kidUpdated,
      kidTeacherIds: kidSyncSummary.teacherIds,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ok: true,
    updatedEnrollmentId: enrollmentId,
    updatedSessionsCount: sessionUpdateSummary.sessionsUpdated,
    sessionsScanned: sessionUpdateSummary.sessionsScanned,
    sessionsMatchedByEnrollmentId: sessionUpdateSummary.sessionsMatchedByEnrollmentId,
    sessionsMatchedByLegacyIdentity: sessionUpdateSummary.sessionsMatchedByLegacyIdentity,
    sessionsSkipped: sessionUpdateSummary.sessionsSkipped,
    identitySnapshotsBackfilled: sessionUpdateSummary.identitySnapshotsBackfilled,
    kidsUpdated: kidSyncSummary.kidUpdated ? 1 : 0,
    skipReasonCounts: sessionUpdateSummary.skipReasonCounts,
    message: 'Enrollment teacher updated',
  };
});

export const repairEnrollmentTeacherSessionConsistency = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const dryRun = request.data?.dryRun === undefined ? true : Boolean(request.data?.dryRun);
  const enrollmentIdFilter = toOptionalId(request.data?.enrollmentId);
  const db = admin.firestore();
  const actorIdentity =
    (typeof request.auth?.token?.email === 'string' && request.auth?.token?.email.trim())
      ? request.auth.token.email.trim()
      : (request.auth?.uid || null);

  const enrollmentDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  if (enrollmentIdFilter) {
    const enrollmentSnap = await db.collection('enrollments').doc(enrollmentIdFilter).get();
    if (enrollmentSnap.exists) {
      enrollmentDocs.push(enrollmentSnap as FirebaseFirestore.QueryDocumentSnapshot);
    }
  } else {
    const enrollmentsSnap = await db.collection('enrollments').get();
    enrollmentDocs.push(...enrollmentsSnap.docs);
  }

  let totalEnrollmentsScanned = 0;
  let sessionsScanned = 0;
  let sessionsMatchedByEnrollmentId = 0;
  let sessionsMatchedByLegacyIdentity = 0;
  let sessionsUpdated = 0;
  let sessionsSkipped = 0;
  let kidsUpdated = 0;
  let identitySnapshotsBackfilled = 0;
  const skipReasonCounts: Record<string, number> = {};

  for (const docSnap of enrollmentDocs) {
    const enrollment = (docSnap.data() || {}) as Record<string, unknown>;
    if (!isActiveLikeEnrollmentStatus(enrollment.status)) continue;
    const teacherId = toOptionalId(enrollment.teacherId);
    const kidId = resolveKidIdFromEnrollment(enrollment);
    if (!teacherId || !kidId) continue;

    totalEnrollmentsScanned += 1;
    const kidSnap = await db.collection('kids').doc(kidId).get();
    const summary = await repairFutureSessionsForEnrollment({
      enrollmentId: docSnap.id,
      enrollment,
      teacher: buildTeacherIdentity({
        teacherId,
        teacherName:
          toOptionalId((enrollment as any).teacherName) ||
          toOptionalId((enrollment as any).teacherDisplayName) ||
          teacherId,
        teacherEmail: toOptionalId((enrollment as any).teacherEmail),
      }),
      previousTeacherId:
        toOptionalId((enrollment as any).previousTeacherId) ||
        teacherId,
      actorIdentity,
      kidRecord: kidSnap.exists ? ({ id: kidSnap.id, ...(kidSnap.data() || {}) } as Record<string, unknown>) : undefined,
      dryRun,
    });
    sessionsScanned += summary.sessionsScanned;
    sessionsMatchedByEnrollmentId += summary.sessionsMatchedByEnrollmentId;
    sessionsMatchedByLegacyIdentity += summary.sessionsMatchedByLegacyIdentity;
    sessionsUpdated += summary.sessionsUpdated;
    sessionsSkipped += summary.sessionsSkipped;
    identitySnapshotsBackfilled += summary.identitySnapshotsBackfilled;
    Object.entries(summary.skipReasonCounts).forEach(([key, value]) => {
      skipReasonCounts[key] = (skipReasonCounts[key] || 0) + value;
    });

    if (!dryRun) {
      const kidSummary = await syncKidTeacherOwnership({
        db,
        kidId,
        newTeacherId: teacherId,
        enrollmentId: docSnap.id,
        actorIdentity,
      });
      if (kidSummary.kidUpdated) kidsUpdated += 1;
    }
  }

  logger.info('repairEnrollmentTeacherSessionConsistency completed', {
    dryRun,
    totalEnrollmentsScanned,
    sessionsScanned,
    sessionsMatchedByEnrollmentId,
    sessionsMatchedByLegacyIdentity,
    sessionsUpdated,
    sessionsSkipped,
    kidsUpdated,
    identitySnapshotsBackfilled,
  });

  return {
    ok: true,
    dryRun,
    totalEnrollmentsScanned,
    sessionsScanned,
    sessionsMatchedByEnrollmentId,
    sessionsMatchedByLegacyIdentity,
    sessionsUpdated,
    sessionsSkipped,
    skipReasonCounts,
    kidsUpdated,
    identitySnapshotsBackfilled,
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
