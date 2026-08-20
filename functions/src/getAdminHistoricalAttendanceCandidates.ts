import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from './helpers/adminGuard';
import { normalizeEnrollmentStatus } from './helpers/status';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const TERMINAL = new Set(['completed', 'discontinued', 'expired', 'cancelled', 'archived', 'inactive']);

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => text(entry)).filter(Boolean)));
}

function collectKidIds(data: Record<string, unknown>): string[] {
  return Array.from(new Set([
    text(data.kidId),
    text(data.studentId),
    text(data.childId),
    ...stringList(data.kidIds),
  ].filter(Boolean)));
}

function normalizeTime(value: unknown): string {
  const raw = text(value);
  if (!raw) return '';
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) return '';
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

function clampDuration(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 35;
  return Math.max(10, Math.min(180, Math.floor(parsed)));
}

function courseLabel(data: Record<string, unknown>): string {
  return text(data.courseName) || text(data.courseLabel) || text(data.courseTitle) || text(data.courseId) || 'Course';
}

function defaults(data: Record<string, unknown>): { startTime: string; durationMins: number } {
  const schedule = data.schedule && typeof data.schedule === 'object' && !Array.isArray(data.schedule)
    ? (data.schedule as Record<string, unknown>)
    : {};
  const weeklySlots = Array.isArray(schedule.weeklySlots) ? schedule.weeklySlots : [];
  const firstSlot = weeklySlots.find((entry) => entry && typeof entry === 'object') as Record<string, unknown> | undefined;
  return {
    startTime:
      normalizeTime(firstSlot?.time) ||
      normalizeTime(schedule.timeHHmm) ||
      normalizeTime(data.startTime) ||
      '18:00',
    durationMins: clampDuration(
      firstSlot?.durationMinutes ??
      firstSlot?.durationMins ??
      schedule.durationMins ??
      data.durationMinutes ??
      data.durationMins ??
      35,
    ),
  };
}

async function resolveTeacherIdentityIds(db: FirebaseFirestore.Firestore, requestedTeacherId: string): Promise<string[]> {
  let teacherSnap = await db.collection('users').doc(requestedTeacherId).get();
  if (!teacherSnap.exists) {
    const byUid = await db.collection('users').where('uid', '==', requestedTeacherId).limit(1).get();
    if (!byUid.empty) teacherSnap = byUid.docs[0];
  }
  if (!teacherSnap.exists) throw new HttpsError('not-found', 'Selected teacher was not found');
  const data = (teacherSnap.data() || {}) as Record<string, unknown>;
  const role = text(data.role).toLowerCase();
  const roles = stringList(data.roles).map((entry) => entry.toLowerCase());
  if (role !== 'teacher' && !roles.includes('teacher')) {
    throw new HttpsError('failed-precondition', 'Selected user is not a teacher');
  }
  return Array.from(new Set([requestedTeacherId, teacherSnap.id, text(data.uid)].filter(Boolean)));
}

export const getAdminHistoricalAttendanceCandidates = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);
  const requestedTeacherId = String(request.data?.teacherId || '').trim();
  if (!requestedTeacherId) throw new HttpsError('invalid-argument', 'teacherId is required');

  const db = admin.firestore();
  const teacherIdentityIds = await resolveTeacherIdentityIds(db, requestedTeacherId);
  const enrollmentMap = new Map<string, Record<string, unknown>>();
  const previousTeacherEnrollmentIds = new Set<string>();

  for (const identity of teacherIdentityIds) {
    const [byTeacher, byTeachers, byPreviousTeacher, byTeacherReassignedFrom, byReassignedFromTeacher] = await Promise.all([
      db.collection('enrollments').where('teacherId', '==', identity).get(),
      db.collection('enrollments').where('teacherIds', 'array-contains', identity).get(),
      db.collection('enrollments').where('previousTeacherId', '==', identity).get(),
      db.collection('enrollments').where('teacherReassignedFrom', '==', identity).get(),
      db.collection('enrollments').where('reassignedFromTeacherId', '==', identity).get(),
    ]);
    [...byTeacher.docs, ...byTeachers.docs].forEach((docSnap) => {
      enrollmentMap.set(docSnap.id, (docSnap.data() || {}) as Record<string, unknown>);
    });
    [...byPreviousTeacher.docs, ...byTeacherReassignedFrom.docs, ...byReassignedFromTeacher.docs].forEach((docSnap) => {
      previousTeacherEnrollmentIds.add(docSnap.id);
      enrollmentMap.set(docSnap.id, (docSnap.data() || {}) as Record<string, unknown>);
    });

    const reassignmentHistory = await db.collectionGroup('teacherReassignments')
      .where('oldTeacherId', '==', identity)
      .get();
    for (const historyDoc of reassignmentHistory.docs) {
      const enrollmentRef = historyDoc.ref.parent.parent;
      if (!enrollmentRef || enrollmentRef.parent.id !== 'enrollments') continue;
      previousTeacherEnrollmentIds.add(enrollmentRef.id);
      if (enrollmentMap.has(enrollmentRef.id)) continue;
      const enrollmentSnap = await enrollmentRef.get();
      if (enrollmentSnap.exists) {
        enrollmentMap.set(enrollmentSnap.id, (enrollmentSnap.data() || {}) as Record<string, unknown>);
      }
    }
  }

  const candidateRows = Array.from(enrollmentMap.entries())
    .map(([id, data]) => {
      const status = normalizeEnrollmentStatus(data.status);
      const terminal = TERMINAL.has(status);
      const previousTeacher = previousTeacherEnrollmentIds.has(id);
      const paused = status === 'paused';
      if (!terminal && !previousTeacher && !paused) return null;
      const kidIds = collectKidIds(data);
      const kidId = kidIds[0] || '';
      if (!kidId) return null;
      const scheduleDefaults = defaults(data);
      return {
        id,
        kidId,
        kidIds,
        courseLabel: courseLabel(data),
        status,
        relation: previousTeacher ? 'previous_teacher' : terminal ? 'previous_course' : 'paused',
        defaultStartTime: scheduleDefaults.startTime,
        defaultDurationMins: scheduleDefaults.durationMins,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => `${a.courseLabel}-${a.status}`.localeCompare(`${b.courseLabel}-${b.status}`));

  const uniqueKidIds = Array.from(new Set(candidateRows.flatMap((row) => row.kidIds)));
  const kidNames: Record<string, string> = {};
  await Promise.all(uniqueKidIds.map(async (kidId) => {
    const kidSnap = await db.collection('kids').doc(kidId).get();
    if (!kidSnap.exists) {
      kidNames[kidId] = kidId;
      return;
    }
    const kid = (kidSnap.data() || {}) as Record<string, unknown>;
    kidNames[kidId] = text(kid.fullName) || text(kid.studentName) || text(kid.name) || kidId;
  }));

  return {
    ok: true,
    teacherId: requestedTeacherId,
    candidates: candidateRows,
    kidNames,
  };
});
