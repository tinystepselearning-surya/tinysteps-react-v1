import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const NON_BLOCKING_SESSION_STATUSES = new Set(['cancelled', 'canceled', 'rescheduled']);

type CallerRole = 'admin' | 'teacher' | 'rm' | 'unknown';

function normalizeRole(value: unknown): CallerRole {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'admin') return 'admin';
  if (raw === 'teacher') return 'teacher';
  if (raw === 'rm') return 'rm';
  return 'unknown';
}

async function resolveCallerRole(
  auth: { uid: string; token?: admin.auth.DecodedIdToken } | null,
): Promise<CallerRole> {
  if (!auth?.uid) return 'unknown';

  const tokenRole = normalizeRole(auth.token?.role);
  if (tokenRole !== 'unknown') return tokenRole;
  if (auth.token?.admin === true) return 'admin';

  try {
    const userDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    return normalizeRole(userDoc.data()?.role);
  } catch (err) {
    logger.warn('createMakeupSessionFromCredit: failed to resolve caller role', {
      uid: auth.uid,
      error: err instanceof Error ? err.message : String(err),
    });
    return 'unknown';
  }
}

function normalizeDurationMinutes(value: unknown): number {
  const n = Number(value);
  const safe = Number.isFinite(n) && n > 0 ? n : 35;
  return Math.max(10, Math.min(180, Math.floor(safe)));
}

function toOptionalText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function removeUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefinedDeep(item)).filter((item) => item !== undefined);
  }
  if (value && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const cleaned: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        const nextValue = removeUndefinedDeep(item);
        if (nextValue !== undefined) {
          cleaned[key] = nextValue;
        }
      });
      return cleaned;
    }
  }
  return value;
}

function parseFutureStartAtOrThrow(dateYmd: string, startTime: string): Date {
  if (!YMD_RE.test(dateYmd)) {
    throw new HttpsError('invalid-argument', 'date must be YYYY-MM-DD');
  }
  if (!HHMM_RE.test(startTime)) {
    throw new HttpsError('invalid-argument', 'startTime must be HH:mm');
  }
  const parsed = new Date(`${dateYmd}T${startTime}:00+05:30`);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpsError('invalid-argument', 'Invalid date/time');
  }
  if (parsed.getTime() <= Date.now()) {
    throw new HttpsError('failed-precondition', 'Makeup session must be scheduled in the future');
  }
  return parsed;
}

function resolveEnrollmentKidIds(enrollment: Record<string, unknown>): string[] {
  const ids: string[] = [];
  const maybeList = Array.isArray(enrollment.kidIds) ? enrollment.kidIds : [];
  maybeList.forEach((value) => {
    const id = String(value || '').trim();
    if (id) ids.push(id);
  });
  const directKidId = String(enrollment.kidId || '').trim();
  if (directKidId) ids.push(directKidId);
  const studentId = String(enrollment.studentId || '').trim();
  if (studentId) ids.push(studentId);
  return Array.from(new Set(ids));
}

function sanitizeParentIds(
  creditParentIds: unknown,
  enrollmentParentIds: unknown,
  parentId: string,
): string[] {
  const fromCredit = Array.isArray(creditParentIds) ? creditParentIds.map((v) => String(v || '').trim()) : [];
  const fromEnrollment = Array.isArray(enrollmentParentIds) ?
    enrollmentParentIds.map((v) => String(v || '').trim()) :
    [];
  const fallback = parentId ? [parentId] : [];
  const merged = (fromCredit.length > 0 ? fromCredit : fromEnrollment.length > 0 ? fromEnrollment : fallback)
    .filter(Boolean);
  return Array.from(new Set(merged));
}

function isBlockingSessionStatus(statusValue: unknown): boolean {
  const status = String(statusValue || '').trim().toLowerCase();
  if (!status) return true;
  return !NON_BLOCKING_SESSION_STATUSES.has(status);
}

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const resolved = (value as { toDate: () => Date }).toDate();
    if (resolved instanceof Date && Number.isFinite(resolved.getTime())) return resolved;
  }
  return null;
}

export const createMakeupSessionFromCredit = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    const callerUid = request.auth?.uid;
    if (!callerUid) throw new HttpsError('unauthenticated', 'Authentication required');

    const callerRole = await resolveCallerRole(request.auth ?? null);
    const callerIsAdmin = callerRole === 'admin' || callerRole === 'rm';
    const callerIsTeacher = callerRole === 'teacher';
    if (!callerIsAdmin && !callerIsTeacher) {
      throw new HttpsError('permission-denied', 'Only teacher/admin can create makeup sessions');
    }

    const creditId = String(request.data?.creditId || '').trim();
    const kidId = String(request.data?.kidId || '').trim();
    const date = String(request.data?.date || '').trim();
    const startTime = String(request.data?.startTime || '').trim();
    const durationMins = normalizeDurationMinutes(request.data?.durationMins);
    const noteRaw = typeof request.data?.note === 'string' ? request.data.note : '';
    const note = noteRaw.trim().slice(0, 300);

    if (!creditId) throw new HttpsError('invalid-argument', 'creditId is required');
    if (!kidId) throw new HttpsError('invalid-argument', 'kidId is required');

    const startAt = parseFutureStartAtOrThrow(date, startTime);
    const endAt = new Date(startAt.getTime() + durationMins * 60 * 1000);
    const [startHour, startMinute] = startTime.split(':').map((part) => Number(part));
    const totalMinutes = startHour * 60 + startMinute + durationMins;
    const normalizedTotalMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const endHour = Math.floor(normalizedTotalMinutes / 60);
    const endMinute = normalizedTotalMinutes % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

    const db = admin.firestore();
    const creditRef = db.collection('rescheduleCredits').doc(creditId);

    const result = await db.runTransaction(async (tx) => {
      const creditSnap = await tx.get(creditRef);
      if (!creditSnap.exists) {
        throw new HttpsError('not-found', 'Reschedule credit not found');
      }

      const credit = (creditSnap.data() || {}) as Record<string, unknown>;
      const creditStatus = String(credit.status || '').trim().toLowerCase();
      const creditKidId = String(credit.kidId || '').trim();
      const creditTeacherId = String(credit.teacherId || '').trim();
      const sourceSessionId = String(credit.sourceSessionId || '').trim();
      const existingReplacementSessionId = String(credit.replacementSessionId || '').trim();

      if (!creditKidId) {
        throw new HttpsError('failed-precondition', 'Credit is missing kid linkage');
      }
      if (creditKidId !== kidId) {
        throw new HttpsError('failed-precondition', 'Credit does not belong to the selected student');
      }
      if (!callerIsAdmin && creditTeacherId !== callerUid) {
        throw new HttpsError('permission-denied', 'Teacher is not allowed to use this credit');
      }

      if (existingReplacementSessionId && (creditStatus === 'scheduled' || creditStatus === 'consumed')) {
        const replacementRef = db.collection('classSessions').doc(existingReplacementSessionId);
        const replacementSnap = await tx.get(replacementRef);
        if (replacementSnap.exists) {
          return {
            sessionId: existingReplacementSessionId,
            alreadyExisted: true,
          };
        }
      }
      if (creditStatus !== 'open') {
        throw new HttpsError('failed-precondition', `Credit is not open (status: ${creditStatus || 'unknown'})`);
      }

      if (sourceSessionId) {
        const sourceSessionRef = db.collection('classSessions').doc(sourceSessionId);
        const sourceSessionSnap = await tx.get(sourceSessionRef);
        if (!sourceSessionSnap.exists) {
          throw new HttpsError('failed-precondition', 'Source rescheduled session not found');
        }
      }

      const existingByCreditQuery = db
        .collection('classSessions')
        .where('makeupCreditId', '==', creditId)
        .limit(1);
      const existingByCreditSnap = await tx.get(existingByCreditQuery);
      if (!existingByCreditSnap.empty) {
        const existingSession = existingByCreditSnap.docs[0];
        tx.set(
          creditRef,
          {
            status: 'scheduled',
            replacementSessionId: existingSession.id,
            replacementDate: date,
            replacementStartAt: admin.firestore.Timestamp.fromDate(startAt),
            scheduledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: callerUid,
          },
          { merge: true },
        );
        return {
          sessionId: existingSession.id,
          alreadyExisted: true,
        };
      }

      const sourceEnrollmentId = String(credit.sourceEnrollmentId || credit.enrollmentId || '').trim();
      const fallbackEnrollmentId =
        !sourceEnrollmentId && sourceSessionId.includes('_') ?
          sourceSessionId.split('_')[0].trim() :
          '';
      const enrollmentId = sourceEnrollmentId || fallbackEnrollmentId;
      if (!enrollmentId) {
        throw new HttpsError('failed-precondition', 'Unable to resolve enrollment for this credit');
      }

      const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
      const enrollmentSnap = await tx.get(enrollmentRef);
      if (!enrollmentSnap.exists) {
        throw new HttpsError('failed-precondition', 'Enrollment for this credit was not found');
      }
      const enrollment = (enrollmentSnap.data() || {}) as Record<string, unknown>;
      const enrollmentKidIds = resolveEnrollmentKidIds(enrollment);
      if (!enrollmentKidIds.includes(creditKidId)) {
        throw new HttpsError('failed-precondition', 'Enrollment/kid linkage mismatch for selected credit');
      }

      const teacherId = creditTeacherId || String(enrollment.teacherId || '').trim();
      if (!teacherId) {
        throw new HttpsError('failed-precondition', 'Teacher linkage is missing for selected credit');
      }
      if (!callerIsAdmin && teacherId !== callerUid) {
        throw new HttpsError('permission-denied', 'Teacher mismatch for selected credit');
      }

      const parentId =
        String(credit.parentId || '').trim() ||
        String(enrollment.parentId || '').trim() ||
        (Array.isArray(enrollment.parentIds) && enrollment.parentIds.length > 0 ?
          String(enrollment.parentIds[0] || '').trim() :
          '');
      const courseId = String(credit.courseId || enrollment.courseId || '').trim();
      if (!parentId || !courseId) {
        throw new HttpsError('failed-precondition', 'Missing parent/course linkage for selected credit');
      }
      const kidRef = db.collection('kids').doc(creditKidId);
      const [kidSnap, courseSnap, teacherSnap] = await Promise.all([
        tx.get(kidRef),
        tx.get(db.collection('courses').doc(courseId)),
        tx.get(db.collection('users').doc(teacherId)),
      ]);

      const parentIds = sanitizeParentIds(credit.parentIds, enrollment.parentIds, parentId);
      const feeAmount = Number(
        enrollment.feePerClass ??
          enrollment.feePerSession ??
          enrollment.ratePerSession ??
          credit.feeAmount ??
          0,
      );
      const currency = String(credit.currency || enrollment.currency || 'INR');
      const joinUrlRaw = enrollment.joinUrl;
      const joinUrl = typeof joinUrlRaw === 'string' && joinUrlRaw.trim() ? joinUrlRaw.trim() : null;
      const kidData = kidSnap.exists ? (kidSnap.data() as Record<string, unknown>) : {};
      const courseData = courseSnap?.exists ? (courseSnap.data() as Record<string, unknown>) : {};
      const teacherData = teacherSnap?.exists ? (teacherSnap.data() as Record<string, unknown>) : {};
      const studentName =
        toOptionalText(enrollment.studentName) ||
        toOptionalText(enrollment.kidName) ||
        toOptionalText(enrollment.childName) ||
        toOptionalText(kidData.studentName) ||
        toOptionalText(kidData.fullName) ||
        toOptionalText(kidData.displayName) ||
        toOptionalText(kidData.name) ||
        null;
      const kidName = toOptionalText(enrollment.kidName) || studentName;
      const childName = toOptionalText(enrollment.childName) || studentName;
      const courseName =
        toOptionalText(enrollment.courseName) ||
        toOptionalText((enrollment as any).courseTitle) ||
        toOptionalText((enrollment as any).courseLabel) ||
        toOptionalText(courseData.title) ||
        toOptionalText(courseData.name) ||
        courseId ||
        null;
      const teacherName =
        toOptionalText(enrollment.teacherName) ||
        toOptionalText((enrollment as any).teacherDisplayName) ||
        toOptionalText(teacherData.displayName) ||
        toOptionalText(teacherData.name) ||
        toOptionalText(teacherData.email) ||
        teacherId ||
        null;
      const teacherEmail =
        toOptionalText(enrollment.teacherEmail) ||
        toOptionalText(teacherData.email) ||
        null;

      const ymdCompact = date.replace(/-/g, '');
      const hhmmCompact = startTime.replace(':', '');
      const creditSuffix = creditId.slice(-8) || 'credit';
      const sessionId = `${enrollmentId}_${ymdCompact}_${hhmmCompact}_${creditSuffix}`;
      const sessionRef = db.collection('classSessions').doc(sessionId);
      const sessionSnap = await tx.get(sessionRef);
      if (sessionSnap.exists) {
        const existingCreditId = String(sessionSnap.data()?.makeupCreditId || '').trim();
        if (existingCreditId === creditId) {
          tx.set(
            creditRef,
            {
              status: 'scheduled',
              replacementSessionId: sessionId,
              replacementDate: date,
              replacementStartAt: admin.firestore.Timestamp.fromDate(startAt),
              scheduledAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedBy: callerUid,
            },
            { merge: true },
          );
          return {
            sessionId,
            alreadyExisted: true,
          };
        }
        throw new HttpsError('already-exists', 'A conflicting makeup session already exists');
      }

      const teacherDaySessionsQuery = db
        .collection('classSessions')
        .where('teacherId', '==', teacherId)
        .where('date', '==', date);
      const teacherDaySessionsSnap = await tx.get(teacherDaySessionsQuery);
      const requestedStartMs = startAt.getTime();
      const requestedEndMs = endAt.getTime();

      for (const existingDoc of teacherDaySessionsSnap.docs) {
        if (existingDoc.id === sessionId) continue;

        const existingData = existingDoc.data() as Record<string, unknown>;
        const existingCreditId = String(existingData.makeupCreditId || '').trim();
        if (existingCreditId && existingCreditId === creditId) continue;
        if (!isBlockingSessionStatus(existingData.status)) continue;

        const existingStart = toDateOrNull(existingData.startAt);
        const existingEnd = toDateOrNull(existingData.endAt);
        if (!existingStart || !existingEnd) continue;

        const existingStartMs = existingStart.getTime();
        const existingEndMs = existingEnd.getTime();
        const overlaps = requestedStartMs < existingEndMs && requestedEndMs > existingStartMs;
        if (overlaps) {
          throw new HttpsError(
            'failed-precondition',
            'Selected time slot is already occupied for this teacher',
          );
        }
      }

      tx.create(sessionRef, removeUndefinedDeep({
        enrollmentId,
        kidId: creditKidId,
        kidIds: [creditKidId],
        studentId: String(enrollment.studentId || creditKidId).trim(),
        ...(studentName ? {studentName} : {}),
        ...(kidName ? {kidName} : {}),
        ...(childName ? {childName} : {}),
        parentId,
        parentIds,
        teacherId,
        teacherIds: [teacherId],
        ...(teacherName ? {teacherName} : {}),
        ...(teacherEmail ? {teacherEmail} : {}),
        assignedTeacherId: teacherId,
        primaryTeacherId: teacherId,
        teacherUid: teacherId,
        teacher_id: teacherId,
        courseId,
        ...(courseName ? {courseName} : {}),
        startAt: admin.firestore.Timestamp.fromDate(startAt),
        endAt: admin.firestore.Timestamp.fromDate(endAt),
        date,
        startTime,
        endTime,
        durationMins,
        durationMinutes: durationMins,
        status: 'scheduled',
        attendance: null,
        feeAmount: Number.isFinite(feeAmount) ? feeAmount : 0,
        currency,
        joinUrl,
        notes: note || null,
        source: 'teacher_makeup_from_reschedule',
        isMakeup: true,
        makeupCreditId: creditId,
        makeupForSessionId: sourceSessionId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: callerUid,
        updatedBy: callerUid,
      }) as Record<string, unknown>);

      tx.set(
        creditRef,
        {
          status: 'scheduled',
          replacementSessionId: sessionId,
          replacementDate: date,
          replacementStartAt: admin.firestore.Timestamp.fromDate(startAt),
          scheduledAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: callerUid,
        },
        { merge: true },
      );

      return {
        sessionId,
        alreadyExisted: false,
      };
    });

    return {
      ok: true,
      ...result,
    };
  },
);
