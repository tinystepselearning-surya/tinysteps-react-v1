import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'reschedule_requested';

interface TopicUpdateInput {
  topicId?: unknown;
  mastery?: unknown;
  teacherRemark?: unknown;
  topicName?: unknown;
}

interface AttendanceEntryInput {
  status?: unknown;
  notes?: unknown;
  mastery?: unknown;
  topics?: unknown;
  topicUpdates?: unknown;
}

interface SaveTeacherSessionProgressRequest {
  sessionId?: unknown;
  attendance?: unknown;
  sessionNotes?: unknown;
  meta?: {
    courseId?: unknown;
    courseLabel?: unknown;
    attendanceOnly?: unknown;
  };
}

function normalizeRole(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'learningpartner') return 'learning-partner';
  return raw;
}

function normalizeAttendanceStatus(value: unknown): AttendanceStatus | null {
  const raw = String(value || '').trim().toLowerCase();
  if (
    raw === 'present' ||
    raw === 'absent' ||
    raw === 'late' ||
    raw === 'reschedule_requested'
  ) {
    return raw;
  }
  return null;
}

function sanitizeText(value: unknown, maxLen = 500): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function toDateMaybe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      const dt = maybeTimestamp.toDate();
      if (dt instanceof Date && !Number.isNaN(dt.getTime())) return dt;
    }
    if (typeof maybeTimestamp.seconds === 'number') {
      const dt = new Date(maybeTimestamp.seconds * 1000);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

function normalizeTimeForIstParse(value: unknown): string | null {
  const raw = sanitizeText(value, 16);
  if (!raw) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) return null;
  const seconds = match[3] || '00';
  return `${match[1]}:${match[2]}:${seconds}`;
}

function getSessionStartMillis(session: Record<string, unknown>): number | null {
  const fromStartAt = toDateMaybe(session.startAt);
  if (fromStartAt) return fromStartAt.getTime();

  const dateYmd = sanitizeText(session.date, 16);
  const startTime = normalizeTimeForIstParse(session.startTime);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd) || !startTime) return null;
  const parsed = Date.parse(`${dateYmd}T${startTime}+05:30`);
  return Number.isNaN(parsed) ? null : parsed;
}

function getAttendanceAllowedAtMillis(session: Record<string, unknown>): number | null {
  const startMs = getSessionStartMillis(session);
  if (startMs === null) return null;
  return startMs + 30 * 60 * 1000;
}

function canCallerOverrideAttendanceTime(role: string): boolean {
  return role === 'admin';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function normalizeTopicUpdates(value: unknown): Array<{
  topicId: string;
  mastery?: string;
  teacherRemark?: string;
  topicName?: string;
}> {
  if (!Array.isArray(value)) return [];
  const updates: Array<{
    topicId: string;
    mastery?: string;
    teacherRemark?: string;
    topicName?: string;
  }> = [];
  for (const rawUpdate of value as TopicUpdateInput[]) {
    const topicId = sanitizeText(rawUpdate?.topicId, 200);
    if (!topicId) continue;
    const mastery = sanitizeText(rawUpdate?.mastery, 80);
    const teacherRemark = sanitizeText(rawUpdate?.teacherRemark, 400);
    const topicName = sanitizeText(rawUpdate?.topicName, 200);
    updates.push({
      topicId,
      ...(mastery ? { mastery } : {}),
      ...(teacherRemark ? { teacherRemark } : {}),
      ...(topicName ? { topicName } : {}),
    });
  }
  return updates;
}

function toAttendanceEntry(entry: unknown): { status: AttendanceStatus | null; notes: string; mastery: string; topics: string[]; topicUpdates: Array<{ topicId: string; mastery?: string; teacherRemark?: string; topicName?: string }> } {
  if (typeof entry === 'string') {
    return {
      status: normalizeAttendanceStatus(entry),
      notes: '',
      mastery: '',
      topics: [],
      topicUpdates: [],
    };
  }
  if (!entry || typeof entry !== 'object') {
    return {
      status: null,
      notes: '',
      mastery: '',
      topics: [],
      topicUpdates: [],
    };
  }
  const obj = entry as AttendanceEntryInput;
  return {
    status: normalizeAttendanceStatus(obj.status),
    notes: sanitizeText(obj.notes, 400),
    mastery: sanitizeText(obj.mastery, 80),
    topics: normalizeStringArray(obj.topics),
    topicUpdates: normalizeTopicUpdates(obj.topicUpdates),
  };
}

function resolveDurationMins(session: Record<string, unknown>): number {
  const raw = Number(session.durationMins) || Number(session.durationMinutes) || 35;
  if (!Number.isFinite(raw) || raw <= 0) return 35;
  return Math.max(10, Math.min(180, Math.round(raw)));
}

function normalizeCourseId(value: unknown): string {
  const raw = sanitizeText(value, 120).toLowerCase();
  if (!raw) return '';
  const aliases: Record<string, string> = {
    'phonics-foundation': 'phonics-foundations',
    'phonics-foundations': 'phonics-foundations',
    foundational: 'phonics-foundations',
    'phonics-early': 'early-phonics',
    early: 'early-phonics',
    'phonics-advanced': 'advanced-phonics',
    advanced: 'advanced-phonics',
    'grammar-essentials': 'basic-grammar',
    'grammar-mastery': 'advanced-grammar',
    'intermediate-grammar': 'basic-grammar',
    'public-speaking-foundations': 'basic-public-speaking',
    'public-speaking-excellence': 'advanced-public-speaking',
    'intermediate-public-speaking': 'basic-public-speaking',
  };
  return aliases[raw] || sanitizeText(value, 120);
}

function hasPresentOrLateAttendance(attendance: Record<string, unknown>): boolean {
  return Object.values(attendance).some((entry) => {
    const normalized = toAttendanceEntry(entry).status;
    return normalized === 'present' || normalized === 'late';
  });
}

function hasRescheduleAttendance(attendance: Record<string, unknown>): boolean {
  return Object.values(attendance).some(
    (entry) => toAttendanceEntry(entry).status === 'reschedule_requested'
  );
}

async function resolveCallerRole(auth: { uid?: string; token?: Record<string, unknown> }): Promise<string> {
  const tokenRole = normalizeRole(auth?.token?.role);
  if (tokenRole) return tokenRole;
  const uid = String(auth?.uid || '').trim();
  if (!uid) return '';
  const userSnap = await admin.firestore().collection('users').doc(uid).get();
  return normalizeRole(userSnap.data()?.role);
}

function assertCanSaveSession(
  uid: string,
  role: string,
  session: Record<string, unknown>
): void {
  if (role === 'admin') return;
  const sessionTeacherId = String(session.teacherId || '').trim();
  if (role === 'teacher' && sessionTeacherId && sessionTeacherId === uid) return;
  throw new HttpsError('permission-denied', 'Not allowed to update this session.');
}

export const saveTeacherSessionProgress = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 90,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }
    const uid = request.auth.uid;
    const role = await resolveCallerRole(request.auth);
    if (!role) {
      throw new HttpsError('permission-denied', 'Unable to resolve caller role.');
    }

    const payload = (request.data || {}) as SaveTeacherSessionProgressRequest;
    const sessionId = sanitizeText(payload.sessionId, 160);
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }
    if (!payload.attendance || typeof payload.attendance !== 'object' || Array.isArray(payload.attendance)) {
      throw new HttpsError('invalid-argument', 'attendance map is required.');
    }

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }
    const session = (sessionSnap.data() || {}) as Record<string, unknown>;
    assertCanSaveSession(uid, role, session);

    const attendanceAllowedAtMs = getAttendanceAllowedAtMillis(session);
    if (
      role === 'teacher' &&
      !canCallerOverrideAttendanceTime(role)
    ) {
      if (attendanceAllowedAtMs === null) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance time could not be verified. Please contact admin.',
        );
      }
      if (Date.now() < attendanceAllowedAtMs) {
        throw new HttpsError(
          'failed-precondition',
          'Attendance can be marked only after 30 minutes of the class start time.',
        );
      }
    }

    const attendanceOnly = payload.meta?.attendanceOnly === true;
    const incomingAttendance = payload.attendance as Record<string, unknown>;
    const nextAttendance: Record<string, Record<string, unknown>> = {};
    const sessionKidIds = Array.isArray(session.kidIds)
      ? (session.kidIds as unknown[]).map((kidId) => String(kidId || '').trim()).filter(Boolean)
      : [];
    const allowedAttendanceKidIds = new Set<string>(sessionKidIds);
    const enforceKidMembership = allowedAttendanceKidIds.size > 0;

    if (attendanceOnly) {
      const existingAttendanceRaw = session.attendance;
      const existingAttendance =
        existingAttendanceRaw && typeof existingAttendanceRaw === 'object' && !Array.isArray(existingAttendanceRaw)
          ? (existingAttendanceRaw as Record<string, unknown>)
          : {};

      for (const [kidId, rawEntry] of Object.entries(existingAttendance)) {
        const normalizedKidId = String(kidId || '').trim();
        if (
          enforceKidMembership &&
          (!normalizedKidId || !allowedAttendanceKidIds.has(normalizedKidId))
        ) {
          continue;
        }
        const entry = toAttendanceEntry(rawEntry);
        if (!entry.status) continue;
        nextAttendance[normalizedKidId] = {
          status: entry.status,
          ...(entry.notes ? { notes: entry.notes } : {}),
          ...(entry.mastery ? { mastery: entry.mastery } : {}),
          ...(entry.topics.length ? { topics: entry.topics } : {}),
          ...(entry.topicUpdates.length ? { topicUpdates: entry.topicUpdates } : {}),
        };
      }

      for (const [kidId, rawEntry] of Object.entries(incomingAttendance)) {
        const normalizedKidId = String(kidId || '').trim();
        if (!normalizedKidId) {
          throw new HttpsError('invalid-argument', 'Invalid attendance kidId');
        }
        if (enforceKidMembership && !allowedAttendanceKidIds.has(normalizedKidId)) {
          throw new HttpsError(
            'invalid-argument',
            `Attendance kid ${normalizedKidId} is not assigned to this session.`,
          );
        }
        const entry = toAttendanceEntry(rawEntry);
        if (!entry.status) {
          throw new HttpsError('invalid-argument', `Invalid attendance status for kid ${normalizedKidId}`);
        }
        const previous =
          nextAttendance[normalizedKidId] && typeof nextAttendance[normalizedKidId] === 'object'
            ? nextAttendance[normalizedKidId]
            : {};
        nextAttendance[normalizedKidId] = {
          ...previous,
          status: entry.status,
          notes: entry.notes || String(previous.notes || ''),
        };
      }
    } else {
      for (const [kidId, rawEntry] of Object.entries(incomingAttendance)) {
        const normalizedKidId = String(kidId || '').trim();
        if (!normalizedKidId) {
          throw new HttpsError('invalid-argument', 'Invalid attendance kidId');
        }
        if (enforceKidMembership && !allowedAttendanceKidIds.has(normalizedKidId)) {
          throw new HttpsError(
            'invalid-argument',
            `Attendance kid ${normalizedKidId} is not assigned to this session.`,
          );
        }
        const entry = toAttendanceEntry(rawEntry);
        if (!entry.status) {
          throw new HttpsError('invalid-argument', `Invalid attendance status for kid ${kidId}`);
        }
        nextAttendance[normalizedKidId] = {
          status: entry.status,
          ...(entry.notes ? { notes: entry.notes } : {}),
          ...(entry.mastery ? { mastery: entry.mastery } : {}),
          ...(entry.topics.length ? { topics: entry.topics } : {}),
          ...(entry.topicUpdates.length ? { topicUpdates: entry.topicUpdates } : {}),
        };
      }
    }

    const sessionNotes = sanitizeText(payload.sessionNotes, 2000);
    const presentOrLate = hasPresentOrLateAttendance(nextAttendance);
    const hasReschedule = hasRescheduleAttendance(nextAttendance);
    const shouldRequestReschedule = hasReschedule && !presentOrLate;

    const batch = db.batch();
    const sessionUpdate: Record<string, unknown> = {
      attendance: nextAttendance,
      notes: sessionNotes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: uid,
    };
    if (shouldRequestReschedule) {
      sessionUpdate.status = 'reschedule_requested';
    }
    batch.set(sessionRef, sessionUpdate, { merge: true });

    const rescheduleCreditIds: string[] = [];
    if (hasReschedule) {
      for (const [kidId, rawEntry] of Object.entries(nextAttendance)) {
        const entry = toAttendanceEntry(rawEntry);
        if (entry.status !== 'reschedule_requested') continue;
        const creditId = `${sessionId}_${kidId}`;
        const creditRef = db.collection('rescheduleCredits').doc(creditId);
        const existingSnap = await creditRef.get();
        const statusRaw = String(existingSnap.data()?.status || '').trim().toLowerCase();
        const existingStatus =
          statusRaw === 'open' || statusRaw === 'scheduled' || statusRaw === 'consumed' || statusRaw === 'cancelled'
            ? statusRaw
            : '';

        const sharedPayload: Record<string, unknown> = {
          creditId,
          sourceSessionId: sessionId,
          sourceEnrollmentId: session.enrollmentId || null,
          sourceSessionDate: session.date || null,
          sourceStartAt: session.startAt || null,
          sourceEndAt: session.endAt || null,
          sourceStartTime: session.startTime || null,
          sourceEndTime: session.endTime || null,
          teacherId: session.teacherId || null,
          kidId,
          parentId: session.parentId || null,
          parentIds: Array.isArray(session.parentIds) ? session.parentIds : [],
          courseId: session.courseId || null,
          currency: session.currency || 'INR',
          feeAmount:
            Number.isFinite(Number(session.feeAmount)) ? Number(session.feeAmount) :
            Number.isFinite(Number(session.feePerClass)) ? Number(session.feePerClass) :
            0,
          durationMins: resolveDurationMins(session),
          sourceStatus: 'reschedule_requested',
          reason: entry.notes || sessionNotes || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: uid,
        };

        if (!existingSnap.exists) {
          batch.set(
            creditRef,
            {
              ...sharedPayload,
              status: 'open',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: uid,
              openedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          batch.set(
            creditRef,
            {
              ...sharedPayload,
              ...(existingStatus === 'cancelled'
                ? { status: 'open', reopenedAt: admin.firestore.FieldValue.serverTimestamp() }
                : {}),
            },
            { merge: true }
          );
        }
        rescheduleCreditIds.push(creditId);
      }
    }

    const makeupCreditId = sanitizeText(session.makeupCreditId, 160);
    if (makeupCreditId && presentOrLate) {
      const creditRef = db.collection('rescheduleCredits').doc(makeupCreditId);
      batch.set(
        creditRef,
        {
          status: 'consumed',
          consumedSessionId: sessionId,
          consumedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: uid,
        },
        { merge: true }
      );
    }

    let curriculumWriteCount = 0;
    let progressWriteCount = 0;
    if (!attendanceOnly) {
      const resolvedCourseId = normalizeCourseId(payload.meta?.courseId || session.courseId);
      const resolvedCourseLabel = sanitizeText(payload.meta?.courseLabel || session.courseLabel || session.courseName, 160);

      for (const [kidId, rawEntry] of Object.entries(nextAttendance)) {
        const entry = toAttendanceEntry(rawEntry);
        if (entry.status !== 'present' && entry.status !== 'late') continue;

        const updatesByTopic = new Map<string, { mastery?: string; teacherRemark?: string; topicName?: string }>();
        for (const update of entry.topicUpdates) {
          if (!update.topicId) continue;
          updatesByTopic.set(update.topicId, update);
        }
        const topicIds = updatesByTopic.size > 0
          ? Array.from(updatesByTopic.keys())
          : entry.topics;

        for (const topicId of topicIds) {
          const update = updatesByTopic.get(topicId);
          const masteryRaw = sanitizeText(update?.mastery || entry.mastery, 80);
          const masteryNormalized = masteryRaw.toLowerCase();
          const topicName = sanitizeText(update?.topicName || topicId, 200) || topicId;
          const teacherRemark = sanitizeText(update?.teacherRemark || entry.notes, 400);

          const isCompleted = masteryNormalized === 'proficient' || masteryNormalized === 'mastered';
          const curriculumRef = db.collection('students').doc(kidId).collection('curriculum').doc(topicId);
          const curriculumPayload: Record<string, unknown> = {
            status: isCompleted ? 'completed' : 'in_progress',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: uid,
            source: 'attendance',
            lastSessionId: sessionId,
            topicName,
          };
          if (resolvedCourseId) curriculumPayload.courseId = resolvedCourseId;
          if (resolvedCourseLabel) {
            curriculumPayload.courseLabel = resolvedCourseLabel;
            curriculumPayload.courseName = resolvedCourseLabel;
          }
          batch.set(curriculumRef, curriculumPayload, { merge: true });
          curriculumWriteCount += 1;

          const progressRef = db.collection('students').doc(kidId).collection('progress').doc(topicId);
          const progressPayload: Record<string, unknown> = {
            lastEvidence: 'session',
            lastSessionId: sessionId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: uid,
            source: 'attendance',
            topicName,
            topicId,
          };
          if (masteryRaw) progressPayload.mastery = masteryRaw;
          if (teacherRemark) progressPayload.teacherRemark = teacherRemark;
          if (resolvedCourseId) progressPayload.courseId = resolvedCourseId;
          if (resolvedCourseLabel) {
            progressPayload.courseLabel = resolvedCourseLabel;
            progressPayload.courseName = resolvedCourseLabel;
          }
          batch.set(progressRef, progressPayload, { merge: true });
          progressWriteCount += 1;
        }
      }
    }

    await batch.commit();

    logger.info('saveTeacherSessionProgress: session updated', {
      sessionId,
      actorUid: uid,
      role,
      attendanceOnly,
      presentOrLate,
      hasReschedule,
      attendanceKidsCount: Object.keys(nextAttendance).length,
      curriculumWriteCount,
      progressWriteCount,
      rescheduleCreditsOpened: rescheduleCreditIds.length,
      consumedMakeupCreditId: makeupCreditId || null,
    });

    return {
      ok: true,
      sessionId,
      hasPresentOrLate: presentOrLate,
      hasReschedule,
      attendanceOnly,
      appliedStatus: shouldRequestReschedule ? 'reschedule_requested' : null,
      attendanceKidsCount: Object.keys(nextAttendance).length,
      curriculumWriteCount,
      progressWriteCount,
      rescheduleCreditsOpened: rescheduleCreditIds.length,
      rescheduleCreditIds,
      consumedMakeupCreditId: makeupCreditId || null,
    };
  }
);
