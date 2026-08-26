import {
  isScheduleExceptionSession,
  isSessionCanonicalForEnrollment,
  isSessionStatusOperationallyVisible,
} from '../../lib/sessionScheduleIntegrity';
import {
  loadSessionsManagementDateSnapshot,
  loadSessionsManagementSnapshot,
  refreshSessionsManagementSnapshot,
  type SessionsManagementDatePayload,
  type SessionsManagementSnapshotPayload,
  type SessionsManagementSnapshotRow,
} from '../../lib/sessionsManagementSnapshot';
import {
  type ManualReminderCache,
  readManualReminderCache,
  writeManualReminderCache,
} from './manualReminderCache';

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
  parentNotified?: boolean;
  parentNotifiedAt?: unknown;
  teacherNotified?: boolean;
  teacherNotifiedAt?: unknown;
}

interface ReminderLoadDeps {
  fetchEnrollmentsByIds: (ids: string[]) => Promise<Record<string, Record<string, unknown>>>;
  fetchSessionsForDate: (dateKey: string) => Promise<ManualReminderSessionDoc[]>;
  readCache: (dateKey: string) => ManualReminderCache | null;
  writeCache: (dateKey: string, payload: ManualReminderCache) => boolean | void;
  loadSnapshot?: () => Promise<SessionsManagementSnapshotPayload>;
  refreshSnapshot?: () => Promise<SessionsManagementSnapshotPayload>;
  loadDateSnapshot?: (dateKey: string) => Promise<SessionsManagementDatePayload>;
}

interface ReminderLoadMeta {
  elapsedMs: number;
  enrollmentFallbackReads: number;
  source: 'snapshot' | 'firestore';
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

const normalizeLookupId = (value: unknown): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!raw.includes('/')) return raw;
  const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || raw;
};

const uniqueIds = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => normalizeLookupId(value)).filter(Boolean)));

const rowsToMap = (
  rows: SessionsManagementSnapshotRow[],
): Record<string, Record<string, unknown>> => {
  const output: Record<string, Record<string, unknown>> = {};
  rows.forEach((row) => {
    if (!row.id) return;
    output[row.id] = { id: row.id, ...(row.data || {}) };
  });
  return output;
};

const rowsToSessions = (rows: SessionsManagementSnapshotRow[]): ManualReminderSessionDoc[] =>
  rows.map((row) => ({ id: row.id, ...(row.data || {}) } as ManualReminderSessionDoc));

const generatedAtMillis = (generatedAt: string): number => {
  const millis = Date.parse(String(generatedAt || ''));
  return Number.isFinite(millis) ? millis : Date.now();
};

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

const hydrateSnapshotSessions = (
  sessions: ManualReminderSessionDoc[],
  enrollmentMap: Record<string, Record<string, unknown>>,
): ManualReminderSessionDoc[] =>
  sessions.map((session) =>
    mergeSessionWithEnrollmentFallback(
      session,
      enrollmentMap[normalizeLookupId(session.enrollmentId)],
    ),
  );

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

export const readManualReminderCacheFromStorage = readManualReminderCache;
export const writeManualReminderCacheToStorage = writeManualReminderCache;

const timestampToMillis = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date; toMillis?: () => number };
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
  }
  return null;
};

export const createCompactManualReminderCache = (
  sessions: ManualReminderSessionDoc[],
  fallbackTimestamp: number,
): ManualReminderCache => {
  const cache: ManualReminderCache = {};
  sessions.forEach((session) => {
    if (!session.parentNotified && !session.teacherNotified) return;
    const timestamps = [
      timestampToMillis(session.parentNotifiedAt),
      timestampToMillis(session.teacherNotifiedAt),
    ].filter((value): value is number => value !== null);
    cache[session.id] = { notifiedAt: timestamps.length ? Math.max(...timestamps) : fallbackTimestamp };
  });
  return cache;
};

const writeReminderNotificationCache = (
  deps: ReminderLoadDeps,
  dateKey: string,
  sessions: ManualReminderSessionDoc[],
  fetchedAt: number,
): void => {
  try {
    deps.writeCache(dateKey, createCompactManualReminderCache(sessions, fetchedAt));
  } catch (cacheError) {
    console.warn('[TodaysNotifications] reminder cache write failed; continuing', cacheError);
  }
};

const loadDayBucketsFromFirestore = async (
  deps: ReminderLoadDeps,
  todayDateKey: string,
  tomorrowDateKey: string,
  startedAt: number,
): Promise<ManualReminderDayBucketsResult> => {
  const [todaySessions, tomorrowSessions] = await Promise.all([
    deps.fetchSessionsForDate(todayDateKey),
    deps.fetchSessionsForDate(tomorrowDateKey),
  ]);
  const enriched = await hydrateSessionsWithEnrollments(
    [...todaySessions, ...tomorrowSessions],
    deps.fetchEnrollmentsByIds,
  );
  const byId = new Map(enriched.sessions.map((session) => [session.id, session]));
  const fetchedAt = Date.now();
  const hydratedTodaySessions = todaySessions.map((session) => byId.get(session.id) || session);
  const hydratedTomorrowSessions = tomorrowSessions.map((session) => byId.get(session.id) || session);
  writeReminderNotificationCache(
    deps,
    todayDateKey,
    [...hydratedTodaySessions, ...hydratedTomorrowSessions],
    fetchedAt,
  );

  return {
    fetchedAt,
    fetchedForDate: todayDateKey,
    todaySessions: hydratedTodaySessions,
    tomorrowSessions: hydratedTomorrowSessions,
    elapsedMs: Date.now() - startedAt,
    enrollmentFallbackReads: enriched.enrollmentFallbackReads,
    enrollmentMap: enriched.enrollmentMap,
    source: 'firestore',
  };
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
  if (!forceRefresh) {
    try {
      deps.readCache(todayDateKey);
    } catch (cacheError) {
      console.warn('[TodaysNotifications] reminder cache read failed; continuing', cacheError);
    }
  }

  try {
    const snapshot = forceRefresh
      ? await (deps.refreshSnapshot || refreshSessionsManagementSnapshot)()
      : await (deps.loadSnapshot || loadSessionsManagementSnapshot)();
    const enrollmentMap = rowsToMap(snapshot.enrollments);
    const allSessions = rowsToSessions(snapshot.sessions);
    const todaySessions = hydrateSnapshotSessions(
      allSessions.filter((session) => String(session.date || '').trim() === todayDateKey),
      enrollmentMap,
    );
    const tomorrowSessions = hydrateSnapshotSessions(
      allSessions.filter((session) => String(session.date || '').trim() === tomorrowDateKey),
      enrollmentMap,
    );
    const fetchedAt = generatedAtMillis(snapshot.generatedAt);
    writeReminderNotificationCache(
      deps,
      todayDateKey,
      [...todaySessions, ...tomorrowSessions],
      fetchedAt,
    );

    return {
      fetchedAt,
      fetchedForDate: todayDateKey,
      todaySessions,
      tomorrowSessions,
      elapsedMs: Date.now() - startedAt,
      enrollmentFallbackReads: 0,
      enrollmentMap,
      source: 'snapshot',
    };
  } catch (snapshotError) {
    console.warn('[TodaysNotifications] snapshot load failed; falling back to bounded Firestore reads', snapshotError);
    return loadDayBucketsFromFirestore(deps, todayDateKey, tomorrowDateKey, startedAt);
  }
};

export const loadManualReminderSelectedDate = async ({
  dateKey,
  deps,
}: {
  dateKey: string;
  deps: Omit<ReminderLoadDeps, 'readCache' | 'writeCache'>;
}): Promise<ManualReminderSelectedDateResult> => {
  const startedAt = Date.now();
  try {
    const payload = await (deps.loadDateSnapshot || loadSessionsManagementDateSnapshot)(dateKey);
    const enrollmentMap = rowsToMap(payload.enrollments);
    const sessions = hydrateSnapshotSessions(rowsToSessions(payload.sessions), enrollmentMap);
    return {
      dateKey,
      elapsedMs: Date.now() - startedAt,
      enrollmentFallbackReads: 0,
      enrollmentMap,
      sessions,
      source: 'snapshot',
    };
  } catch (snapshotError) {
    console.warn('[TodaysNotifications] selected-date snapshot load failed; using bounded Firestore fallback', snapshotError);
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
  }
};
