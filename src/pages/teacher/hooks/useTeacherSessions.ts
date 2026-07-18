import { useEffect, useMemo, useState } from 'react';
import { collection, documentId, orderBy, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../lib/firebaseConfig';
import { getDocsLogged, onSnapshotLogged } from '../../../lib/firestoreReadLogging';
import {
  isScheduleExceptionSession,
  isSessionCanonicalForEnrollment,
  shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment,
} from '../../../lib/sessionScheduleIntegrity';
import { TeacherSession } from '../../../types/Teacher';
import {
  cleanStudentDisplayName,
  resolveTeacherSessionCourseLabel,
} from '../utils/resolveTeacherSessionStudentName';
import {
  buildCanonicalTeacherSessionQuery,
  fetchTeacherSessionAliasFallbacks,
  makeTeacherFallbackCacheKey,
  mergeAndDedupeSessionDocs,
} from './teacherSessionOwnership';

interface UseTeacherSessionsResult {
  sessions: TeacherSession[];
  isLoading: boolean;
  error: Error | null;
}

const devLogTeacherQuery = (
  hookName: string,
  phase: 'listen' | 'snapshot' | 'error',
  details: Record<string, unknown>,
) => {
  if (!import.meta.env.DEV) return;
  const logger =
    phase === 'error' ? console.error :
    phase === 'listen' ? console.info :
    console.debug;
  logger(`[${hookName}] ${phase}`, details);
};

const createTeacherSessionError = (message: string, code?: string | null): Error => {
  const error = new Error(message) as Error & { code?: string | null };
  if (code) error.code = code;
  return error;
};

const toDateMaybe = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
};

const toCleanText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const isLikelyHumanLabel = (value: string): boolean => {
  const text = value.trim();
  if (!text) return false;
  if (/[{}[\]]/.test(text)) return false;
  if (/^[a-z0-9_-]{12,}$/i.test(text)) return false;
  return /[a-z]/i.test(text);
};

const getNameFromObject = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';
  const row = value as Record<string, unknown>;
  const first = cleanStudentDisplayName(row.firstName);
  const last = cleanStudentDisplayName(row.lastName);
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return (
    cleanStudentDisplayName(row.name) ||
    cleanStudentDisplayName(row.fullName) ||
    cleanStudentDisplayName(row.displayName) ||
    cleanStudentDisplayName(row.studentName) ||
    cleanStudentDisplayName(row.childName) ||
    combined
  );
};

const extractNames = (...values: unknown[]): string[] => {
  const names: string[] = [];
  values.forEach((value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        const primitive = cleanStudentDisplayName(item);
        if (primitive) {
          names.push(primitive);
          return;
        }
        const nested = getNameFromObject(item);
        if (nested) names.push(nested);
      });
      return;
    }

    const primitive = cleanStudentDisplayName(value);
    if (primitive) {
      names.push(primitive);
      return;
    }

    if (typeof value === 'object') {
      const nested = getNameFromObject(value);
      if (nested) names.push(nested);

      const objectValues = Object.values(value as Record<string, unknown>)
        .map((item) => cleanStudentDisplayName(item))
        .filter((item) => isLikelyHumanLabel(item));
      names.push(...objectValues);
    }
  });

  return Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
};

const normalizeTimeText = (rawValue: unknown): string => {
  const value = toCleanText(rawValue);
  if (!value) return '';

  const hhmm = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (hhmm) {
    const hours = Number(hhmm[1]);
    const minutes = Number(hhmm[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  const ampm = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/.exec(value);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2]);
    if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
      const suffix = ampm[3].toLowerCase();
      if (suffix === 'pm' && hours < 12) hours += 12;
      if (suffix === 'am' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  const asDate = toDateMaybe(value);
  if (asDate) {
    return format(asDate, 'HH:mm');
  }

  return '';
};

const normalizeDateText = (rawValue: unknown): string => {
  const value = toCleanText(rawValue);
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const asDate = toDateMaybe(value);
  if (asDate) return format(asDate, 'yyyy-MM-dd');
  return '';
};

const normalizeKidIds = (doc: any): string[] => {
  const raw =
    Array.isArray(doc.kidIds) ? doc.kidIds :
    doc.kidId ? [doc.kidId] :
    doc.studentId ? [doc.studentId] :
    doc.childId ? [doc.childId] :
    Array.isArray(doc.childIds) ? doc.childIds :
    [];
  return raw
    .map((id: unknown) => toCleanText(id))
    .filter((id: string) => id.length > 0);
};

const normalizeTeacherIds = (doc: any): string[] => {
  const raw = Array.isArray(doc.teacherIds) ? doc.teacherIds : [];
  const singles = [doc.teacherId, doc.assignedTeacherId, doc.primaryTeacherId, doc.teacherUid, doc.teacher_id];
  return Array.from(
    new Set(
      [...raw, ...singles]
        .map((id: unknown) => toCleanText(id))
        .filter((id: string) => id.length > 0),
    ),
  );
};

const sessionBelongsToTeacher = (doc: any, teacherId: string): boolean => {
  if (!teacherId) return false;
  return normalizeTeacherIds(doc).includes(teacherId);
};

const resolveTeacherId = (doc: any): string => {
  return normalizeTeacherIds(doc)[0] || '';
};

const toTeacherSession = (doc: any): TeacherSession => {
  const startAtDate = toDateMaybe(doc.startAt);
  const endAtDate = toDateMaybe(doc.endAt);

  const date =
    normalizeDateText(doc.date) ||
    normalizeDateText(doc.classDate) ||
    normalizeDateText(doc.sessionDate) ||
    normalizeDateText(doc.teacherConfirmedDate) ||
    (startAtDate ? format(startAtDate, 'yyyy-MM-dd') : '');

  const startTime =
    normalizeTimeText(doc.startTime) ||
    normalizeTimeText(doc.time) ||
    (startAtDate ? format(startAtDate, 'HH:mm') : '');

  const endTime =
    normalizeTimeText(doc.endTime) ||
    (endAtDate ? format(endAtDate, 'HH:mm') : '');

  const kidIds = normalizeKidIds(doc);
  const existingNames = extractNames(
    doc.studentName,
    doc.student,
    doc.kidName,
    doc.childName,
    doc.studentNames,
    doc.kidNames,
    doc.childNames,
    doc.students,
    doc.kids,
    doc.children,
  ).filter((name) => isLikelyHumanLabel(name));

  const mergedNames = Array.from(new Set(existingNames));
  const primaryName = mergedNames[0] || '';
  const courseLabel =
    resolveTeacherSessionCourseLabel(doc) ||
    toCleanText(doc.course?.label) ||
    toCleanText(doc.course?.name) ||
    toCleanText(doc.course?.title) ||
    toCleanText(doc.programLabel) ||
    toCleanText(doc.programName) ||
    toCleanText(doc.program?.label) ||
    toCleanText(doc.program?.name) ||
    toCleanText(doc.subject);

  return {
    ...(doc || {}),
    id: toCleanText(doc.id),
    ...(toCleanText(doc.enrollmentId) ? { enrollmentId: toCleanText(doc.enrollmentId) } : {}),
    teacherId: resolveTeacherId(doc),
    ...(toCleanText(doc.parentId) ? { parentId: toCleanText(doc.parentId) } : {}),
    ...(Array.isArray(doc.parentIds) ? { parentIds: doc.parentIds } : {}),
    courseId: toCleanText(doc.courseId),
    courseName: courseLabel || toCleanText(doc.courseId),
    ...(courseLabel ? { courseLabel } : {}),
    date,
    startTime,
    endTime,
    kidIds,
    ...(mergedNames.length > 0 ? { kidNames: mergedNames, studentNames: mergedNames } : {}),
    ...(primaryName ? { studentName: primaryName, kidName: primaryName, childName: primaryName } : {}),
    status: toCleanText(doc.status) || 'scheduled',
    joinUrl: toCleanText(doc.joinUrl) || toCleanText(doc.meetingLink),
    ...(toCleanText(doc.meetingLink) ? { meetingLink: toCleanText(doc.meetingLink) } : {}),
    notes: doc.notes,
    attendance: doc.attendance,
    ...(typeof doc.feeAmount === 'number' ? { feeAmount: doc.feeAmount } : {}),
    ...(typeof doc.currency === 'string' ? { currency: doc.currency } : {}),
    ...(typeof doc.source === 'string' ? { source: doc.source } : {}),
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
    ...(typeof doc.makeupCreditId === 'string' ? { makeupCreditId: doc.makeupCreditId } : {}),
    ...(typeof doc.makeupForSessionId === 'string' ? { makeupForSessionId: doc.makeupForSessionId } : {}),
    ...(typeof doc.durationMins === 'number' ? { durationMins: doc.durationMins } : {}),
    ...(typeof doc.durationMinutes === 'number' ? { durationMinutes: doc.durationMinutes } : {}),
    ...(doc.startAt ? { startAt: doc.startAt } : {}),
    ...(doc.endAt ? { endAt: doc.endAt } : {}),
  } as TeacherSession;
};

const firstClean = (...values: unknown[]): string => {
  for (const value of values) {
    const cleaned = toCleanText(value);
    if (cleaned) return cleaned;
  }

  return '';
};

const namesFromValue = (value: unknown, preferredIds: string[]): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => cleanStudentDisplayName(item)).filter(Boolean);
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const names: string[] = [];

    preferredIds.forEach((id) => {
      const directValue = record[id];
      if (Array.isArray(directValue)) {
        directValue.forEach((item) => {
          const cleaned = cleanStudentDisplayName(item);
          if (cleaned) names.push(cleaned);
        });
      } else {
        const cleaned = cleanStudentDisplayName(directValue);
        if (cleaned) names.push(cleaned);
      }
    });

    Object.values(record).forEach((item) => {
      if (Array.isArray(item)) {
        item.forEach((nestedItem) => {
          const cleaned = cleanStudentDisplayName(nestedItem);
          if (cleaned) names.push(cleaned);
        });
      } else {
        const cleaned = cleanStudentDisplayName(item);
        if (cleaned) names.push(cleaned);
      }
    });

    return names;
  }

  const single = cleanStudentDisplayName(value);
  return single ? [single] : [];
};

const resolveEnrollmentStudentName = (
  enrollment: Record<string, unknown> | undefined,
  preferredIds: string[],
): string => {
  if (!enrollment) return '';

  const directName = [
    enrollment.studentName,
    enrollment.kidName,
    enrollment.childName,
    enrollment.studentFullName,
    enrollment.kidFullName,
    enrollment.childFullName,
    enrollment.studentDisplayName,
    enrollment.kidDisplayName,
    enrollment.childDisplayName,
    (enrollment.student as Record<string, unknown> | undefined)?.name,
    (enrollment.student as Record<string, unknown> | undefined)?.fullName,
    (enrollment.student as Record<string, unknown> | undefined)?.displayName,
    (enrollment.child as Record<string, unknown> | undefined)?.name,
    (enrollment.child as Record<string, unknown> | undefined)?.fullName,
    (enrollment.child as Record<string, unknown> | undefined)?.displayName,
    (enrollment.kid as Record<string, unknown> | undefined)?.name,
    (enrollment.kid as Record<string, unknown> | undefined)?.fullName,
    (enrollment.kid as Record<string, unknown> | undefined)?.displayName,
    (enrollment.studentDetails as Record<string, unknown> | undefined)?.name,
    (enrollment.studentDetails as Record<string, unknown> | undefined)?.fullName,
    (enrollment.studentDetails as Record<string, unknown> | undefined)?.displayName,
    (enrollment.childDetails as Record<string, unknown> | undefined)?.name,
    (enrollment.childDetails as Record<string, unknown> | undefined)?.fullName,
    (enrollment.childDetails as Record<string, unknown> | undefined)?.displayName,
    (enrollment.kidDetails as Record<string, unknown> | undefined)?.name,
    (enrollment.kidDetails as Record<string, unknown> | undefined)?.fullName,
    (enrollment.kidDetails as Record<string, unknown> | undefined)?.displayName,
    enrollment.name,
    enrollment.fullName,
    enrollment.displayName,
  ]
    .map((value) => cleanStudentDisplayName(value))
    .find(Boolean) || '';

  if (directName) return directName;

  const mappedNames = [
    ...namesFromValue(enrollment.studentNames, preferredIds),
    ...namesFromValue(enrollment.kidNames, preferredIds),
    ...namesFromValue(enrollment.childNames, preferredIds),
  ];

  return mappedNames[0] || '';
};

const sessionAlreadyHasName = (session: TeacherSession): boolean => {
  const sessionAny = session as unknown as Record<string, unknown>;
  const kidIds = Array.isArray(session.kidIds) ? session.kidIds : [];

  const names = [
    ...namesFromValue(sessionAny.studentNames, kidIds),
    ...namesFromValue(sessionAny.kidNames, kidIds),
    ...namesFromValue(sessionAny.childNames, kidIds),
    cleanStudentDisplayName(sessionAny.studentName),
    cleanStudentDisplayName(sessionAny.kidName),
    cleanStudentDisplayName(sessionAny.childName),
  ].filter(Boolean);

  return names.length > 0;
};

const withEnrollmentIdentitySnapshots = (
  session: TeacherSession,
  enrollment?: Record<string, unknown>,
): TeacherSession => {
  const kidIds = Array.isArray(session.kidIds) ? session.kidIds : [];
  const firstKidId = kidIds[0];

  const enrollmentName = resolveEnrollmentStudentName(enrollment, kidIds);
  const enrollmentCourseName = resolveTeacherSessionCourseLabel(session, enrollment);

  if (!enrollmentName && !enrollmentCourseName) return session;

  const next: TeacherSession = {
    ...session,
    courseName: enrollmentCourseName || session.courseName || session.courseId,
  };

  if (!enrollmentName || sessionAlreadyHasName(session)) {
    return next;
  }

  return {
    ...next,
    studentName: enrollmentName,
    kidName: enrollmentName,
    childName: enrollmentName,
    studentNames: firstKidId ? { [firstKidId]: enrollmentName } : [enrollmentName],
    kidNames: firstKidId ? { [firstKidId]: enrollmentName } : [enrollmentName],
    childNames: firstKidId ? { [firstKidId]: enrollmentName } : [enrollmentName],
  } as TeacherSession;
};

const sortSessions = (rows: TeacherSession[]): TeacherSession[] => {
  return [...rows].sort((a, b) => {
    if (a.date !== b.date) return String(a.date || '').localeCompare(String(b.date || ''));
    return String(a.startTime || '').localeCompare(String(b.startTime || ''), undefined, {
      numeric: true,
    });
  });
};

const chunkIds = (ids: string[], size = 10): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
};

const fetchEnrollmentsByIds = async (ids: string[]): Promise<Map<string, Record<string, unknown>>> => {
  const map = new Map<string, Record<string, unknown>>();
  for (const chunk of chunkIds(ids, 10)) {
    if (!chunk.length) continue;
    const enrollmentQuery = query(collection(db, 'enrollments'), where(documentId(), 'in', chunk));
    const snap = await getDocsLogged(
      'useTeacherSessions:enrollments-by-id',
      enrollmentQuery,
      { source: 'src/pages/teacher/hooks/useTeacherSessions.ts' },
    );
    snap.docs.forEach((docSnap) => {
      map.set(docSnap.id, { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) });
    });
  }
  return map;
};

export const useTeacherSessions = (
  teacherId?: string,
  startDate?: string,
  endDate?: string,
  includeAllTeachers = false,
): UseTeacherSessionsResult => {
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(teacherId) || includeAllTeachers);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teacherId && !includeAllTeachers) {
      setSessions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const today = format(new Date(), 'yyyy-MM-dd');
    const start = startDate || today;
    const end = endDate || today;

    const baseCollection = collection(db, 'classSessions');
    const teacherKey = toCleanText(teacherId);
    const todayDate = start === end ? start : today;
    const buildScopedTeacherQuery = (
      field: 'teacherId' | 'teacherIds' | 'assignedTeacherId' | 'primaryTeacherId' | 'teacherUid' | 'teacher_id',
      operator: '==' | 'array-contains',
    ) => query(
      baseCollection,
      where(field, operator, teacherKey),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc'),
    );
    const primaryQuery = includeAllTeachers || !teacherKey
      ? query(
          baseCollection,
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc'),
        )
      : buildCanonicalTeacherSessionQuery((field, operator) => buildScopedTeacherQuery(field, operator));

    let cancelled = false;
    let batchCounter = 0;
    const liveDocsBySource = new Map<string, Map<string, TeacherSession>>();
    const sourceStates = new Map<string, { status: 'pending' | 'ready' | 'error'; error: Error | null }>([
      ['primary', { status: 'pending', error: null }],
    ]);
    const fallbackCache = new Map<string, TeacherSession[]>();
    const fallbackCacheKey = makeTeacherFallbackCacheKey(teacherKey, `${start}::${end}`);
    let fallbackPromise: Promise<void> | null = null;

    const setSettledState = () => {
      if (cancelled) return;
      const allSettled = Array.from(sourceStates.values()).every((state) => state.status !== 'pending');
      if (!allSettled) return;

      const hasVisibleSourceDocs = Array.from(liveDocsBySource.values()).some((rows) => rows.size > 0);
      if (hasVisibleSourceDocs) {
        setError(null);
        setIsLoading(false);
        return;
      }

      const firstError = Array.from(sourceStates.values()).find((state) => state.error)?.error || null;
      if (firstError) {
        setError(firstError);
      }
      setIsLoading(false);
    };

    const applyRows = async (rows: TeacherSession[]) => {
      const currentBatch = ++batchCounter;
      const filtered = includeAllTeachers
        ? rows
        : rows.filter((session) => sessionBelongsToTeacher(session as any, teacherKey));

      let enrollmentMap = new Map<string, Record<string, unknown>>();
      const enrollmentIds = Array.from(
        new Set(
          filtered
            .map((session) => toCleanText((session as any)?.enrollmentId))
            .filter(Boolean),
        ),
      );

      if (enrollmentIds.length > 0) {
        try {
          enrollmentMap = await fetchEnrollmentsByIds(enrollmentIds);
        } catch (err) {
          devLogTeacherQuery('useTeacherSessions', 'error', {
            queryName: 'enrollmentLookups',
            collection: 'enrollments',
            aliasField: 'documentId',
            teacherUid: teacherKey || null,
            todayDate,
            dateRange: { start, end },
            error: err instanceof Error ? err.message : String(err),
            code: (err as any)?.code || null,
          });
        }
      }

      const canonicalOnly = filtered.filter((session) => {
        const status = toCleanText((session as any)?.status).toLowerCase();
        if (status === 'paused') return false;
        const enrollmentId = toCleanText((session as any)?.enrollmentId);
        if (!enrollmentId) return false;
        const enrollment = enrollmentMap.get(enrollmentId);
        if (!enrollment) {
          return (
            sessionBelongsToTeacher(session as any, teacherKey) &&
            isScheduleExceptionSession(session as unknown as Record<string, unknown>) &&
            shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment(
              session as unknown as Record<string, unknown>,
              teacherKey,
            )
          );
        }
        return isSessionCanonicalForEnrollment(session as unknown as Record<string, unknown>, enrollment);
      });

      if (cancelled || currentBatch !== batchCounter) return;
      setSessions(
        sortSessions(
          canonicalOnly.map((session) => {
            const enrollmentId = toCleanText((session as any)?.enrollmentId);
            return withEnrollmentIdentitySnapshots(
              session,
              enrollmentId ? enrollmentMap.get(enrollmentId) : undefined,
            );
          }),
        ).slice(0, 400),
      );
      setError(null);
      setIsLoading(false);
      setSettledState();
    };

    const publishMergedRows = () => {
      const merged = mergeAndDedupeSessionDocs(
        ...Array.from(liveDocsBySource.values()).map((sourceRows) => sourceRows.values()),
        (fallbackCache.get(fallbackCacheKey) || []).values(),
      );
      const bounded = Array.from(merged.values()).filter((session) => {
        const date = toCleanText(session.date);
        return Boolean(date) && date >= start && date <= end;
      });
      void applyRows(bounded).catch((err) => {
        devLogTeacherQuery('useTeacherSessions', 'error', {
          queryName: 'publishMergedRows',
          collection: 'classSessions',
          aliasField: 'merged',
          teacherUid: teacherKey || null,
          todayDate,
          dateRange: { start, end },
          error: err instanceof Error ? err.message : String(err),
          code: (err as any)?.code || null,
        });
        if (cancelled) return;
        setError(createTeacherSessionError(
          'Unable to load today\'s sessions. Please contact admin if this keeps happening.',
          (err as any)?.code || null,
        ));
        setIsLoading(false);
      });
    };

    const ensureFallbackRows = () => {
      if (includeAllTeachers || !teacherKey) return;
      if (fallbackCache.has(fallbackCacheKey) || fallbackPromise) return;

      fallbackPromise = fetchTeacherSessionAliasFallbacks({
        buildScopedQuery: (field, operator) => buildScopedTeacherQuery(field, operator),
        mapDoc: (docSnap) => toTeacherSession({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) }),
        rowMatchesTeacher: (row) => sessionBelongsToTeacher(row as any, teacherKey),
        onQuery: ({ field, operator }) => {
          devLogTeacherQuery('useTeacherSessions', 'listen', {
            queryName: `fallback-${field}`,
            collection: 'classSessions',
            aliasField: field,
            operator,
            teacherUid: teacherKey || null,
            todayDate,
            dateRange: { start, end },
            mode: 'getDocs-fallback',
          });
        },
        onQueryError: ({ field, operator, error }) => {
          devLogTeacherQuery('useTeacherSessions', 'error', {
            queryName: `fallback-${field}`,
            collection: 'classSessions',
            aliasField: field,
            operator,
            teacherUid: teacherKey || null,
            todayDate,
            dateRange: { start, end },
            error: error instanceof Error ? error.message : String(error),
            code: (error as any)?.code || null,
          });
        },
        source: 'src/pages/teacher/hooks/useTeacherSessions.ts',
        labelPrefix: 'useTeacherSessions:fallback',
      })
        .then((result) => {
          if (cancelled) return;
          fallbackCache.set(fallbackCacheKey, result.rows);
          if (import.meta.env.DEV) {
            console.info('[useTeacherSessions] fallback-used', {
              teacherUid: teacherKey || null,
              dateRange: { start, end },
              cacheKey: fallbackCacheKey,
              aliases: result.succeededAliases,
              deniedAliases: result.deniedAliases,
              rows: result.rows.length,
            });
          }
          publishMergedRows();
        })
        .catch((err) => {
          if (cancelled) return;
          devLogTeacherQuery('useTeacherSessions', 'error', {
            queryName: 'fallback',
            collection: 'classSessions',
            aliasField: 'fallback',
            teacherUid: teacherKey || null,
            todayDate,
            dateRange: { start, end },
            error: err instanceof Error ? err.message : String(err),
            code: (err as any)?.code || null,
          });
        })
        .finally(() => {
          fallbackPromise = null;
        });
    };

    devLogTeacherQuery('useTeacherSessions', 'listen', {
      queryName: 'primary',
      collection: 'classSessions',
      aliasField: includeAllTeachers ? 'all-teachers' : 'teacherId',
      teacherUid: teacherKey || null,
      todayDate,
      dateRange: { start, end },
    });
    const unsubscribe = onSnapshotLogged(
      'useTeacherSessions:primary',
      primaryQuery,
      { source: 'src/pages/teacher/hooks/useTeacherSessions.ts' },
      (snapshot) => {
        devLogTeacherQuery('useTeacherSessions', 'snapshot', {
          queryName: 'primary',
          collection: 'classSessions',
          aliasField: includeAllTeachers ? 'all-teachers' : 'teacherId',
          teacherUid: teacherKey || null,
          todayDate,
          dateRange: { start, end },
          docsReturned: snapshot.docs.length,
        });
        sourceStates.set('primary', { status: 'ready', error: null });
        liveDocsBySource.set(
          'primary',
          new Map(
            snapshot.docs.map((d) => [
              d.id,
              toTeacherSession({ id: d.id, ...(d.data() as Record<string, unknown>) }),
            ]),
          ),
        );
        publishMergedRows();
        ensureFallbackRows();
      },
      (err) => {
        devLogTeacherQuery('useTeacherSessions', 'error', {
          queryName: 'primary',
          collection: 'classSessions',
          aliasField: includeAllTeachers ? 'all-teachers' : 'teacherId',
          teacherUid: teacherKey || null,
          todayDate,
          dateRange: { start, end },
          error: err instanceof Error ? err.message : String(err),
          code: (err as any)?.code || null,
        });
        if (cancelled) return;
        sourceStates.set('primary', {
          status: 'error',
          error: createTeacherSessionError(
            'Unable to load today\'s sessions. One or more teacher session queries were denied.',
            (err as any)?.code || null,
          ),
        });
        liveDocsBySource.set('primary', new Map());
        setSettledState();
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [teacherId, startDate, endDate, includeAllTeachers]);

  const sortedSessions = useMemo(() => sortSessions(sessions), [sessions]);

  return { sessions: sortedSessions, isLoading, error };
};
