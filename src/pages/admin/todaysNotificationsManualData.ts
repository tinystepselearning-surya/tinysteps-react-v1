import {
  isScheduleExceptionSession,
  isSessionCanonicalForEnrollment,
  isSessionStatusOperationallyVisible,
} from '../../lib/sessionScheduleIntegrity';

export interface ManualReminderSessionDoc {
  id: string;
  enrollmentId?: string;
  joinUrl?: string;
  meetingLink?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startAt?: unknown;
  endAt?: unknown;
  status?: string;
  kidId?: string;
  kidIds?: string[];
  kidName?: string;
  studentName?: string;
  childName?: string;
  kidNames?: Record<string, string> | string[];
  parentId?: string;
  parentIds?: string[];
  parentName?: string;
  teacherId?: string;
  teacherIds?: string[];
  teacherName?: string;
  courseId?: string;
  courseName?: string;
  subject?: string;
  durationMinutes?: number;
  durationMins?: number;
  source?: string;
  sessionType?: string;
  createdByFlow?: string;
  isAdHoc?: boolean;
  isMakeup?: boolean;
  adHocType?: string;
  makeupCreditId?: string;
  makeupForSessionId?: string;
  rescheduledFromSessionId?: string;
  replacementSessionId?: string;
}

export interface ManualReminderCachePayload {
  fetchedForDate: string;
  fetchedAt: number;
  todaySessions: ManualReminderSessionDoc[];
  tomorrowSessions: ManualReminderSessionDoc[];
}

interface ReminderLoadDeps {
  fetchEnrollmentsByIds: (ids: string[]) => Promise<Record<string, Record<string, unknown>>>;
  fetchSessionsForDate: (dateKey: string) => Promise<ManualReminderSessionDoc[]>;
  readCache: (dateKey: string) => ManualReminderCachePayload | null;
  writeCache: (dateKey: string, payload: ManualReminderCachePayload) => void;
}

interface ReminderLoadMeta {
  elapsedMs: number;
  enrollmentFallbackReads: number;
  source: 'firestore';
  enrollmentMap: Record<string, Record<string, unknown>>;
}

export interface ManualReminderDayBucketsResult extends ReminderLoadMeta {
  fetchedAt: number;
  fetchedForDate: string;
  todaySessions: ManualReminderSessionDoc[];
  tomorrowSessions: ManualReminderSessionDoc[];
}

export interface ManualReminderSelectedDateResult extends ReminderLoadMeta {
  dateKey: string;
  sessions: ManualReminderSessionDoc[];
}

export const MANUAL_REMINDER_CACHE_KEY_PREFIX = 'ts_manual_class_reminders_cache_';
export const MANUAL_REMINDER_CACHE_TTL_MS = 30_000;

const normalizeLookupId = (value: unknown): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!raw.includes('/')) return raw;
  const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || raw;
};

const uniqueIds = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => normalizeLookupId(value)).filter(Boolean)));

export const buildManualReminderCacheKey = (dateKey: string): string =>
  `${MANUAL_REMINDER_CACHE_KEY_PREFIX}${dateKey}`;

export const sessionHasRequiredReminderDisplayData = (
  session: ManualReminderSessionDoc,
): boolean => {
  const hasDate = Boolean(String(session.date || '').trim() || session.startAt);
  const hasStatus = Boolean(String(session.status || '').trim());
  const hasStudentName = Boolean(
    String(session.kidName || '').trim() ||
      String(session.studentName || '').trim() ||
      String(session.childName || '').trim() ||
      (Array.isArray(session.kidNames) && session.kidNames.some((value) => String(value || '').trim())) ||
      (session.kidNames &&
        typeof session.kidNames === 'object' &&
        Object.values(session.kidNames).some((value) => String(value || '').trim())),
  );
  const hasParentIdentity = Boolean(
    String(session.parentName || '').trim() ||
      normalizeLookupId(session.parentId) ||
      uniqueIds(Array.isArray(session.parentIds) ? session.parentIds : []).length,
  );
  const hasTeacherIdentity = Boolean(
    String(session.teacherName || '').trim() ||
      normalizeLookupId(session.teacherId) ||
      uniqueIds(Array.isArray(session.teacherIds) ? session.teacherIds : []).length,
  );
  const hasCourseIdentity = Boolean(
    String(session.courseName || '').trim() ||
      String(session.subject || '').trim() ||
      normalizeLookupId(session.courseId),
  );

  return hasDate && hasStatus && hasStudentName && hasParentIdentity && hasTeacherIdentity && hasCourseIdentity;
};

export const mergeSessionWithEnrollmentFallback = (
  session: ManualReminderSessionDoc,
  enrollment: Record<string, unknown> | undefined,
): ManualReminderSessionDoc => {
  if (!enrollment) return session;

  const mergedParentIds = uniqueIds([
    ...(Array.isArray(session.parentIds) ? session.parentIds : []),
    ...(Array.isArray(enrollment.parentIds) ? enrollment.parentIds : []),
    enrollment.parentId,
    enrollment.userId,
  ]);
  const mergedTeacherIds = uniqueIds([
    ...(Array.isArray(session.teacherIds) ? session.teacherIds : []),
    ...(Array.isArray(enrollment.teacherIds) ? enrollment.teacherIds : []),
    enrollment.teacherId,
    enrollment.assignedTeacherId,
    enrollment.primaryTeacherId,
    enrollment.teacherUid,
    enrollment.teacher_id,
  ]);
  const mergedKidIds = uniqueIds([
    session.kidId,
    ...(Array.isArray(session.kidIds) ? session.kidIds : []),
    enrollment.kidId,
    enrollment.studentId,
    enrollment.childId,
    ...(Array.isArray(enrollment.kidIds) ? enrollment.kidIds : []),
  ]);

  return {
    ...session,
    parentId: session.parentId || normalizeLookupId(enrollment.parentId) || normalizeLookupId(enrollment.userId) || undefined,
    parentIds: mergedParentIds.length ? mergedParentIds : session.parentIds,
    teacherId:
      session.teacherId ||
      normalizeLookupId(enrollment.teacherId) ||
      normalizeLookupId(enrollment.assignedTeacherId) ||
      normalizeLookupId(enrollment.primaryTeacherId) ||
      normalizeLookupId(enrollment.teacherUid) ||
      normalizeLookupId(enrollment.teacher_id) ||
      undefined,
    teacherIds: mergedTeacherIds.length ? mergedTeacherIds : session.teacherIds,
    kidId:
      session.kidId ||
      normalizeLookupId(enrollment.kidId) ||
      normalizeLookupId(enrollment.studentId) ||
      normalizeLookupId(enrollment.childId) ||
      undefined,
    kidIds: mergedKidIds.length ? mergedKidIds : session.kidIds,
    courseId: session.courseId || normalizeLookupId(enrollment.courseId) || undefined,
    courseName:
      session.courseName ||
      (typeof enrollment.courseName === 'string' ? enrollment.courseName : '') ||
      (typeof enrollment.courseTitle === 'string' ? enrollment.courseTitle : '') ||
      undefined,
    subject:
      session.subject || (typeof enrollment.subject === 'string' ? enrollment.subject : '') || undefined,
    joinUrl:
      session.joinUrl || (typeof enrollment.joinUrl === 'string' ? enrollment.joinUrl : '') || undefined,
    meetingLink:
      session.meetingLink || (typeof enrollment.meetingLink === 'string' ? enrollment.meetingLink : '') || undefined,
  };
};

const hydrateSessionsWithEnrollments = async (
  sessions: ManualReminderSessionDoc[],
  fetchEnrollmentsByIds: ReminderLoadDeps['fetchEnrollmentsByIds'],
): Promise<{
  enrollmentFallbackReads: number;
  enrollmentMap: Record<string, Record<string, unknown>>;
  sessions: ManualReminderSessionDoc[];
}> => {
  const enrollmentIds = uniqueIds(sessions.map((session) => session.enrollmentId));

  if (!enrollmentIds.length) {
    return { enrollmentFallbackReads: 0, enrollmentMap: {}, sessions };
  }

  const enrollmentMap = await fetchEnrollmentsByIds(enrollmentIds);
  return {
    enrollmentFallbackReads: enrollmentIds.length,
    enrollmentMap,
    sessions: sessions.map((session) =>
      mergeSessionWithEnrollmentFallback(session, enrollmentMap[normalizeLookupId(session.enrollmentId)]),
    ),
  };
};

const operationalIdentity = (session: ManualReminderSessionDoc): string => {
  const exceptionIdentity = isScheduleExceptionSession(session as unknown as Record<string, unknown>)
    ? [
        'exception',
        session.source,
        session.sessionType,
        session.createdByFlow,
        session.makeupCreditId,
        session.makeupForSessionId,
        session.rescheduledFromSessionId,
        session.replacementSessionId,
      ].map((value) => String(value || '').trim().toLowerCase()).join('|')
    : 'regular';
  const startAtLike = session.startAt as { toMillis?: () => number; toDate?: () => Date } | undefined;
  const startAtIdentity =
    typeof startAtLike?.toMillis === 'function'
      ? String(startAtLike.toMillis())
      : typeof startAtLike?.toDate === 'function'
        ? String(startAtLike.toDate().getTime())
        : String(session.startAt || '').trim();
  const startIdentity = String(session.startTime || '').trim() || startAtIdentity;
  return [
    normalizeLookupId(session.enrollmentId),
    String(session.date || '').trim(),
    startIdentity,
    String(session.durationMinutes ?? session.durationMins ?? ''),
    exceptionIdentity,
  ].join('::');
};

export const selectOperationalReminderSessions = (
  sessions: ManualReminderSessionDoc[],
  enrollmentMap: Record<string, Record<string, unknown>>,
): ManualReminderSessionDoc[] => {
  const seen = new Set<string>();
  return sessions.filter((session) => {
    if (!isSessionStatusOperationallyVisible(session.status)) return false;
    const enrollmentId = normalizeLookupId(session.enrollmentId);
    if (!enrollmentId) return false;
    const enrollment = enrollmentMap[enrollmentId];
    if (!isSessionCanonicalForEnrollment(session as unknown as Record<string, unknown>, enrollment)) {
      return false;
    }
    const identity = operationalIdentity(session);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
};

export const readManualReminderCacheFromStorage = (
  dateKey: string,
): ManualReminderCachePayload | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(buildManualReminderCacheKey(dateKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ManualReminderCachePayload;
    if (
      parsed &&
      parsed.fetchedForDate === dateKey &&
      Number.isFinite(parsed.fetchedAt) &&
      Date.now() - parsed.fetchedAt <= MANUAL_REMINDER_CACHE_TTL_MS &&
      Array.isArray(parsed.todaySessions) &&
      Array.isArray(parsed.tomorrowSessions)
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
};

export const writeManualReminderCacheToStorage = (
  dateKey: string,
  payload: ManualReminderCachePayload,
): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(buildManualReminderCacheKey(dateKey), JSON.stringify(payload));
};

export const loadManualReminderDayBuckets = async ({
  deps,
  forceRefresh = false,
  todayDateKey,
  tomorrowDateKey,
}: {
  deps: ReminderLoadDeps;
  forceRefresh?: boolean;
  todayDateKey: string;
  tomorrowDateKey: string;
}): Promise<ManualReminderDayBucketsResult> => {
  const startedAt = Date.now();
  // Cache is only a short-lived initial-view hint. It is never authoritative:
  // every load and date change completes a fresh Firestore validation pass.
  if (!forceRefresh) deps.readCache(todayDateKey);

  const [todaySessions, tomorrowSessions] = await Promise.all([
    deps.fetchSessionsForDate(todayDateKey),
    deps.fetchSessionsForDate(tomorrowDateKey),
  ]);
  const enriched = await hydrateSessionsWithEnrollments(
    [...todaySessions, ...tomorrowSessions],
    deps.fetchEnrollmentsByIds,
  );
  const byId = new Map(enriched.sessions.map((session) => [session.id, session]));
  const payload: ManualReminderCachePayload = {
    fetchedAt: Date.now(),
    fetchedForDate: todayDateKey,
    todaySessions: todaySessions.map((session) => byId.get(session.id) || session),
    tomorrowSessions: tomorrowSessions.map((session) => byId.get(session.id) || session),
  };
  deps.writeCache(todayDateKey, payload);

  return {
    ...payload,
    elapsedMs: Date.now() - startedAt,
    enrollmentFallbackReads: enriched.enrollmentFallbackReads,
    enrollmentMap: enriched.enrollmentMap,
    source: 'firestore',
  };
};

export const loadManualReminderSelectedDate = async ({
  dateKey,
  deps,
}: {
  dateKey: string;
  deps: Omit<ReminderLoadDeps, 'readCache' | 'writeCache'>;
}): Promise<ManualReminderSelectedDateResult> => {
  const startedAt = Date.now();
  const sessions = await deps.fetchSessionsForDate(dateKey);
  const enriched = await hydrateSessionsWithEnrollments(sessions, deps.fetchEnrollmentsByIds);
  return {
    dateKey,
    elapsedMs: Date.now() - startedAt,
    enrollmentFallbackReads: enriched.enrollmentFallbackReads,
    enrollmentMap: enriched.enrollmentMap,
    sessions: enriched.sessions,
    source: 'firestore',
  };
};
