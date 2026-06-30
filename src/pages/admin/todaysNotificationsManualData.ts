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
}

export interface ManualReminderCachePayload {
  fetchedForDate: string;
  fetchedAt: number;
  todaySessions: ManualReminderSessionDoc[];
  tomorrowSessions: ManualReminderSessionDoc[];
}

interface ReminderLoadDeps {
  fetchEnrollmentsByIds: (ids: string[]) => Promise<Record<string, Record<string, any>>>;
  fetchSessionsForDate: (dateKey: string) => Promise<ManualReminderSessionDoc[]>;
  readCache: (dateKey: string) => ManualReminderCachePayload | null;
  writeCache: (dateKey: string, payload: ManualReminderCachePayload) => void;
}

interface ReminderLoadMeta {
  elapsedMs: number;
  enrollmentFallbackReads: number;
  source: 'cache' | 'firestore';
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
  enrollment: Record<string, any> | undefined,
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

const enrichSessionsWithEnrollmentFallback = async (
  sessions: ManualReminderSessionDoc[],
  fetchEnrollmentsByIds: ReminderLoadDeps['fetchEnrollmentsByIds'],
): Promise<{ enrollmentFallbackReads: number; sessions: ManualReminderSessionDoc[] }> => {
  const fallbackEnrollmentIds = uniqueIds(
    sessions
      .filter((session) => !sessionHasRequiredReminderDisplayData(session))
      .map((session) => session.enrollmentId),
  );

  if (!fallbackEnrollmentIds.length) {
    return { enrollmentFallbackReads: 0, sessions };
  }

  const enrollmentMap = await fetchEnrollmentsByIds(fallbackEnrollmentIds);
  return {
    enrollmentFallbackReads: fallbackEnrollmentIds.length,
    sessions: sessions.map((session) =>
      mergeSessionWithEnrollmentFallback(session, enrollmentMap[normalizeLookupId(session.enrollmentId)]),
    ),
  };
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
  const cached = forceRefresh ? null : deps.readCache(todayDateKey);
  if (cached) {
    return {
      ...cached,
      elapsedMs: Date.now() - startedAt,
      enrollmentFallbackReads: 0,
      source: 'cache',
    };
  }

  const [todaySessions, tomorrowSessions] = await Promise.all([
    deps.fetchSessionsForDate(todayDateKey),
    deps.fetchSessionsForDate(tomorrowDateKey),
  ]);
  const enriched = await enrichSessionsWithEnrollmentFallback(
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
  const enriched = await enrichSessionsWithEnrollmentFallback(sessions, deps.fetchEnrollmentsByIds);
  return {
    dateKey,
    elapsedMs: Date.now() - startedAt,
    enrollmentFallbackReads: enriched.enrollmentFallbackReads,
    sessions: enriched.sessions,
    source: 'firestore',
  };
};
