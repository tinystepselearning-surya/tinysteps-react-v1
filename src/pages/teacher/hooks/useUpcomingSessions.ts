import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  documentId,
  orderBy,
  query,
  where,
  type Query,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { getDocLogged, getDocsLogged } from '../../../lib/firestoreReadLogging';
import { teacherCalendarSessionReadCache } from './teacherCalendarSessionReadCache';
import { getSessionStartDate } from '../../../lib/sessionTime';
import {
  isScheduleExceptionSession,
  isSessionCanonicalForEnrollment,
  shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment,
} from '../../../lib/sessionScheduleIntegrity';
import { TeacherSession } from '../../../types/Teacher';
import {
  cleanStudentDisplayName,
  getTeacherSessionEntityIds,
  resolveTeacherSessionCourseLabel,
} from '../utils/resolveTeacherSessionStudentName';
import {
  buildCanonicalTeacherSessionQuery,
  mergeAndDedupeSessionDocs,
} from './teacherSessionOwnership';
import {
  operationalTeacherRecordBelongsTo,
  resolveOperationalTeacherId,
} from '../../../lib/teacherIdentity';

interface UseUpcomingSessionsResult {
  sessions: TeacherSession[];
  isLoading: boolean;
  error: Error | null;
  enrollmentsById: Map<string, Record<string, unknown>>;
  entityDocById: Map<string, Record<string, unknown>>;
  deniedLookups: Array<{ collection: string; code?: string | null; error: string }>;
  refresh: () => void;
}

export const getDefaultUpcomingSelectedDate = (): string =>
  new Date(Date.now() + 330 * 60_000 + 86_400_000).toISOString().slice(0, 10);

const cleanString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const shouldDebugTeacherSessionNames = (): boolean => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return window.localStorage.getItem('debugTeacherSessionNames') === '1' || params.get('debugNames') === '1';
};

const firstClean = (...values: unknown[]): string => {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }

  return '';
};

const normalizeKidIds = (doc: any): string[] => {
  return getTeacherSessionEntityIds(doc as Record<string, unknown>);
};

const normalizeTeacherIds = (doc: any): string[] => {
  const resolvedTeacherId = resolveOperationalTeacherId(doc as Record<string, unknown>);
  return resolvedTeacherId ? [resolvedTeacherId] : [];
};

const resolveTeacherId = (doc: any): string =>
  resolveOperationalTeacherId(doc as Record<string, unknown>);

const sessionBelongsToTeacher = (doc: any, teacherId: string): boolean =>
  operationalTeacherRecordBelongsTo(doc as Record<string, unknown>, teacherId);

const chunkIds = (ids: string[], size = 10): string[][] => {
  const chunks: string[][] = [];

  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }

  return chunks;
};

const devLogTeacherQuery = (
  hookName: string,
  phase: 'listen' | 'snapshot' | 'error',
  details: Record<string, unknown>,
) => {
  if (!import.meta.env.DEV) return;

  const logger = phase === 'error' ? console.error : console.debug;
  logger(`[${hookName}] ${phase}`, details);
};

const createUpcomingSessionsError = (message: string, code?: string | null): Error => {
  const error = new Error(message) as Error & { code?: string | null };
  if (code) error.code = code;
  return error;
};

const fetchEnrollmentsByIds = async (ids: string[]): Promise<Map<string, Record<string, unknown>>> => {
  const map = new Map<string, Record<string, unknown>>();

  for (const chunk of chunkIds(ids, 10)) {
    if (!chunk.length) continue;

    try {
      const enrollmentQuery = query(collection(db, 'enrollments'), where(documentId(), 'in', chunk));
      const snap = await getDocsLogged(
        'useUpcomingSessions:enrollments-by-id',
        enrollmentQuery,
        { source: 'src/pages/teacher/hooks/useUpcomingSessions.ts' },
      );

      snap.docs.forEach((docSnap) => {
        map.set(docSnap.id, {
          id: docSnap.id,
          ...(docSnap.data() as Record<string, unknown>),
        });
      });
      continue;
    } catch (batchError) {
      devLogTeacherQuery('useUpcomingSessions', 'error', {
        queryName: 'enrollmentLookupsBatch',
        collection: 'enrollments',
        aliasField: 'documentId',
        enrollmentIds: chunk,
        error: batchError instanceof Error ? batchError.message : String(batchError),
        code: (batchError as any)?.code || null,
      });
    }

    // A single stale session can reference an enrollment the current teacher no
    // longer owns. Firestore correctly denies a mixed documentId "in" query in
    // that case. Retry each enrollment independently so one inaccessible stale
    // row cannot hide every valid recurring session for the teacher.
    await Promise.all(
      chunk.map(async (enrollmentId) => {
        try {
          const snap = await getDocLogged(
            'useUpcomingSessions:enrollment-by-id-fallback',
            doc(db, 'enrollments', enrollmentId),
            { source: 'src/pages/teacher/hooks/useUpcomingSessions.ts' },
          );
          if (!snap.exists()) return;

          map.set(snap.id, {
            id: snap.id,
            ...(snap.data() as Record<string, unknown>),
          });
        } catch (error) {
          devLogTeacherQuery('useUpcomingSessions', 'error', {
            queryName: 'enrollmentLookupByIdFallback',
            collection: 'enrollments',
            enrollmentId,
            error: error instanceof Error ? error.message : String(error),
            code: (error as any)?.code || null,
          });
        }
      }),
    );
  }

  return map;
};

const toTeacherSession = (doc: any): TeacherSession => ({
  ...(doc || {}),
  id: doc.id,
  teacherId: resolveTeacherId(doc),
  teacherIds: normalizeTeacherIds(doc),
  enrollmentId: doc.enrollmentId,
  parentId: doc.parentId,
  parentIds: doc.parentIds,
  courseId: doc.courseId,
  courseName: resolveTeacherSessionCourseLabel(doc) || cleanString(doc.courseId),
  date: doc.date,
  startTime: doc.startTime,
  endTime: doc.endTime,
  kidIds: normalizeKidIds(doc),
  kidId: cleanString(doc.kidId),
  studentId: cleanString(doc.studentId),
  childId: cleanString(doc.childId),
  studentIds: Array.isArray(doc.studentIds)
    ? doc.studentIds.map((id: unknown) => cleanString(id)).filter(Boolean)
    : undefined,
  childIds: Array.isArray(doc.childIds)
    ? doc.childIds.map((id: unknown) => cleanString(id)).filter(Boolean)
    : undefined,
  childrenIds: Array.isArray(doc.childrenIds)
    ? doc.childrenIds.map((id: unknown) => cleanString(id)).filter(Boolean)
    : undefined,
  status: doc.status || 'scheduled',
  joinUrl: doc.joinUrl,
  notes: doc.notes,
  feeAmount: doc.feeAmount,
  currency: doc.currency,
  source: doc.source,
  attendance: doc.attendance,
  startAt: doc.startAt,
  endAt: doc.endAt,
  scheduledStartAt: doc.scheduledStartAt,
  scheduledEndAt: doc.scheduledEndAt,
  updatedAt: doc.updatedAt,
  updatedBy: doc.updatedBy,
  makeupCreditId: doc.makeupCreditId,
  makeupForSessionId: doc.makeupForSessionId,

  // Keep identity snapshots if they already exist on classSessions.
  studentName: doc.studentName,
  kidName: doc.kidName,
  childName: doc.childName,
  studentNames: doc.studentNames,
  kidNames: doc.kidNames,
  childNames: doc.childNames,
} as TeacherSession);

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

export const useUpcomingSessions = (
  teacherId?: string,
  selectedDate = getDefaultUpcomingSelectedDate(),
): UseUpcomingSessionsResult => {
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!teacherId);
  const [error, setError] = useState<Error | null>(null);
  const [enrollmentsById, setEnrollmentsById] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [entityDocById, setEntityDocById] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [deniedLookups, setDeniedLookups] = useState<Array<{ collection: string; code?: string | null; error: string }>>([]);
  const [manualRefresh, setManualRefresh] = useState(0);
  const refresh = () => {
    if (teacherId) teacherCalendarSessionReadCache.invalidateTeacher(teacherId);
    setManualRefresh(n => n + 1);
  };

  useEffect(() => {
    if (!teacherId) {
      setSessions([]);
      setIsLoading(false);
      setError(null);
      setEnrollmentsById(new Map());
      setEntityDocById(new Map());
      setDeniedLookups([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDeniedLookups([]);

    let cancelled = false;

    const baseCollection = collection(db, 'classSessions');
    const targetDate = cleanString(selectedDate) || getDefaultUpcomingSelectedDate();
    const todayIst = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
    if (targetDate < todayIst) {
      // Monthly summaries, not historical classSessions, serve history.
      setSessions([]);
      setEnrollmentsById(new Map());
      setEntityDocById(new Map());
      setIsLoading(false);
      return;
    }

    const buildScopedTeacherQuery = (
      field: 'teacherId' | 'teacherIds' | 'assignedTeacherId' | 'primaryTeacherId' | 'teacherUid' | 'teacher_id',
      operator: '==' | 'array-contains',
    ) => query(
      baseCollection,
      where(field, operator, teacherId),
      where('date', '==', targetDate),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc'),
    );

    const primaryQuery = buildCanonicalTeacherSessionQuery((field, operator) =>
      buildScopedTeacherQuery(field, operator),
    );

    const liveDocsBySource = new Map<string, Map<string, TeacherSession>>();
    const sourceStates = new Map<string, { status: 'pending' | 'ready' | 'error'; error: Error | null }>([
      ['primary', { status: 'pending', error: null }],
    ]);

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
      if (firstError) setError(firstError);
      setIsLoading(false);
    };

    const publishMerged = async () => {
      const merged = mergeAndDedupeSessionDocs(
        ...Array.from(liveDocsBySource.values()).map((rows) => rows.values()),
      );

      const next = Array.from(merged.values()).filter((session) =>
        String(session.date || '') === targetDate &&
        sessionBelongsToTeacher(session as any, teacherId),
      );

      const enrollmentIds = Array.from(
        new Set(
          next
            .map((session) => String((session as any)?.enrollmentId || '').trim())
            .filter(Boolean),
        ),
      );

      let enrollmentMap = new Map<string, Record<string, unknown>>();
      if (enrollmentIds.length > 0) {
        try {
          enrollmentMap = await fetchEnrollmentsByIds(enrollmentIds);
        } catch (err) {
          devLogTeacherQuery('useUpcomingSessions', 'error', {
            queryName: 'enrollmentLookups',
            collection: 'enrollments',
            aliasField: 'documentId',
            error: err instanceof Error ? err.message : String(err),
            code: (err as any)?.code || null,
            authUid: teacherId,
          });
        }
      }

      const canonicalOnly = next.filter((session) => {
        const status = String((session as any)?.status || '').trim().toLowerCase();

        if (status === 'paused') return false;
        const enrollmentId = String((session as any)?.enrollmentId || '').trim();

        if (!enrollmentId) return false;

        const enrollment = enrollmentMap.get(enrollmentId);

        if (!enrollment) {
          return (
            sessionBelongsToTeacher(session as any, teacherId) &&
            isScheduleExceptionSession(session as unknown as Record<string, unknown>) &&
            shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment(
              session as unknown as Record<string, unknown>,
              teacherId,
            )
          );
        }

        return isSessionCanonicalForEnrollment(session as unknown as Record<string, unknown>, enrollment);
      });

      const enriched = canonicalOnly.map((session) => {
        const enrollmentId = String((session as any)?.enrollmentId || '').trim();
        const enrollment = enrollmentId ? enrollmentMap.get(enrollmentId) : undefined;

        return withEnrollmentIdentitySnapshots(session, enrollment);
      });

      const entityIds = Array.from(
        new Set(
          enriched.flatMap((session) => getTeacherSessionEntityIds(session as unknown as Record<string, unknown>)),
        ),
      );
      const nextEntityDocById = new Map<string, Record<string, unknown>>();

      enriched.forEach((session) => {
        const sessionEntityIds = new Set(
          getTeacherSessionEntityIds(session as unknown as Record<string, unknown>),
        );
        const sessionRecord = session as unknown as Record<string, unknown>;

        entityIds.forEach((id) => {
          if (!sessionEntityIds.has(id)) return;

          const embeddedNames = [
            cleanStudentDisplayName(sessionRecord.studentName),
            cleanStudentDisplayName(sessionRecord.kidName),
            cleanStudentDisplayName(sessionRecord.childName),
          ].filter(Boolean);

          if (!embeddedNames.length) return;

          nextEntityDocById.set(id, {
            id,
            name: embeddedNames[0],
            fullName: embeddedNames[0],
            displayName: embeddedNames[0],
            studentName: embeddedNames[0],
            childName: embeddedNames[0],
            kidName: embeddedNames[0],
          });
        });
      });

      const sorted = enriched.sort((a, b) => {
        const aStart = getSessionStartDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bStart = getSessionStartDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        if (aStart !== bStart) return aStart - bStart;

        return String(a.id || '').localeCompare(String(b.id || ''));
      });

      if (cancelled) return;

      setSessions(sorted);
      setEnrollmentsById(new Map(enrollmentMap));
      setEntityDocById(nextEntityDocById);
      setDeniedLookups([]);
      setIsLoading(false);
      setError(null);
      setSettledState();
    };

    const unsubscribe = teacherCalendarSessionReadCache.subscribe(
      { teacherId, start: targetDate, end: targetDate },
      async () => {
        const snapshot = await getDocsLogged(
          'useUpcomingSessions:primary',
          primaryQuery,
          { source: 'src/pages/teacher/hooks/useUpcomingSessions.ts' },
        );
        return snapshot.docs.map(d =>
          toTeacherSession({ id: d.id, ...(d.data() as Record<string, unknown>) }));
      },
      rows => {
        sourceStates.set('primary', { status: 'ready', error: null });
        liveDocsBySource.set('primary', new Map(rows.map(row => [row.id, row])));
        void publishMerged().catch(err => {
          if (cancelled) return;
          setError(createUpcomingSessionsError(
            'Unable to resolve teacher class exceptions. Use Refresh to retry.',
            (err as {code?:string})?.code || null,
          ));
          setIsLoading(false);
        });
      },
      err => {
        if (cancelled) return;
        sourceStates.set('primary', {
          status: 'error',
          error: createUpcomingSessionsError(
            'Unable to load teacher class exceptions. Use Refresh to retry.',
            (err as {code?:string})?.code || null,
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
  }, [teacherId, selectedDate, manualRefresh]);

  return { sessions, isLoading, error, enrollmentsById, entityDocById, deniedLookups, refresh };
};
