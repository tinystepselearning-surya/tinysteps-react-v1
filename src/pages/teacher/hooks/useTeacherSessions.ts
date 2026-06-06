import { useEffect, useMemo, useState } from 'react';
import { collection, documentId, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../lib/firebaseConfig';
import {
  isScheduleExceptionSession,
  isSessionCanonicalForEnrollment,
  shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment,
} from '../../../lib/sessionScheduleIntegrity';
import { TeacherSession } from '../../../types/Teacher';

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
  const logger = phase === 'error' ? console.error : console.debug;
  logger(`[${hookName}] ${phase}`, details);
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
  const first = toCleanText(row.firstName);
  const last = toCleanText(row.lastName);
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return (
    toCleanText(row.name) ||
    toCleanText(row.fullName) ||
    toCleanText(row.displayName) ||
    toCleanText(row.studentName) ||
    toCleanText(row.childName) ||
    combined
  );
};

const extractNames = (...values: unknown[]): string[] => {
  const names: string[] = [];
  values.forEach((value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        const primitive = toCleanText(item);
        if (primitive) {
          names.push(primitive);
          return;
        }
        const nested = getNameFromObject(item);
        if (nested) names.push(nested);
      });
      return;
    }

    const primitive = toCleanText(value);
    if (primitive) {
      names.push(primitive);
      return;
    }

    if (typeof value === 'object') {
      const nested = getNameFromObject(value);
      if (nested) names.push(nested);

      const objectValues = Object.values(value as Record<string, unknown>)
        .map((item) => toCleanText(item))
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
  return (
    toCleanText(doc.teacherId) ||
    toCleanText(doc.assignedTeacherId) ||
    toCleanText(doc.primaryTeacherId) ||
    toCleanText(doc.teacherUid) ||
    toCleanText(doc.teacher_id) ||
    ''
  );
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
    toCleanText(doc.courseLabel) ||
    toCleanText(doc.courseName) ||
    toCleanText(doc.courseTitle) ||
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
    courseName:
      toCleanText(doc.courseName) ||
      toCleanText(doc.courseLabel) ||
      toCleanText(doc.courseTitle) ||
      toCleanText(doc.programName) ||
      toCleanText(doc.subject),
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

const enrichSessionsWithKidNames = async (rows: TeacherSession[]): Promise<TeacherSession[]> => {
  const kidIdSet = new Set<string>();
  rows.forEach((session) => {
    normalizeKidIds(session as any).forEach((kidId) => kidIdSet.add(kidId));
  });

  const kidIds = Array.from(kidIdSet);
  if (kidIds.length === 0) return rows;

  const kidNameById = new Map<string, string>();

  for (let index = 0; index < kidIds.length; index += 10) {
    const chunkIds = kidIds.slice(index, index + 10);
    const snap = await getDocs(
      query(collection(db, 'kids'), where(documentId(), 'in', chunkIds)),
    );
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const name =
        toCleanText(data.fullName) ||
        toCleanText(data.studentName) ||
        toCleanText(data.displayName) ||
        toCleanText(data.name);
      if (name) kidNameById.set(docSnap.id, name);
    });
  }

  return rows.map((session) => {
    const sessionAny = session as any;
    const ids = normalizeKidIds(sessionAny);
    const derived = ids
      .map((kidId) => kidNameById.get(kidId) || '')
      .map((name) => name.trim())
      .filter(Boolean);

    if (derived.length === 0) return session;

    const existing = extractNames(
      sessionAny.studentName,
      sessionAny.kidName,
      sessionAny.childName,
      sessionAny.studentNames,
      sessionAny.kidNames,
      sessionAny.childNames,
      sessionAny.students,
      sessionAny.kids,
      sessionAny.children,
    ).filter((name) => isLikelyHumanLabel(name));

    const merged = Array.from(new Set([...existing, ...derived]));
    if (merged.length === 0) return session;

    const primary = merged[0];
    return {
      ...(sessionAny || {}),
      studentNames: merged,
      kidNames: merged,
      studentName: toCleanText(sessionAny.studentName) || primary,
      kidName: toCleanText(sessionAny.kidName) || primary,
      childName: toCleanText(sessionAny.childName) || primary,
    } as TeacherSession;
  });
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
    const snap = await getDocs(
      query(collection(db, 'enrollments'), where(documentId(), 'in', chunk)),
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
    const classSessionsQuery =
      !includeAllTeachers && teacherKey
        ? query(
            baseCollection,
            where('teacherId', '==', teacherKey),
            where('date', '>=', start),
            where('date', '<=', end),
            orderBy('date', 'asc'),
            orderBy('startTime', 'asc'),
          )
        : query(
            baseCollection,
            where('date', '>=', start),
            where('date', '<=', end),
            orderBy('date', 'asc'),
            orderBy('startTime', 'asc'),
          );

    let cancelled = false;
    let batchCounter = 0;
    const liveDocsBySource = new Map<string, Map<string, TeacherSession>>();

    const applyRows = async (rows: TeacherSession[]) => {
      const currentBatch = ++batchCounter;
      const filtered = includeAllTeachers
        ? rows
        : rows.filter((session) => sessionBelongsToTeacher(session as any, teacherKey));

      const enrollmentMap = await fetchEnrollmentsByIds(
        Array.from(
          new Set(
            filtered
              .map((session) => toCleanText((session as any)?.enrollmentId))
              .filter(Boolean),
          ),
        ),
      );
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

      const enriched = await enrichSessionsWithKidNames(canonicalOnly);
      if (cancelled || currentBatch !== batchCounter) return;
      setSessions(sortSessions(enriched).slice(0, 400));
      setError(null);
      setIsLoading(false);
    };

    const publishMergedRows = () => {
      const merged = new Map<string, TeacherSession>();
      liveDocsBySource.forEach((sourceRows) => {
        sourceRows.forEach((session, sessionId) => {
          const date = toCleanText(session.date);
          if (!date || date < start || date > end) return;
          merged.set(sessionId, session);
        });
      });
      void applyRows(Array.from(merged.values()));
    };

    const listeners: Array<() => void> = [];
    const attachListener = (
      sourceKey: string,
      aliasField: string,
      listenerQuery: ReturnType<typeof query>,
    ) => {
      devLogTeacherQuery('useTeacherSessions', 'listen', {
        queryName: sourceKey,
        collection: 'classSessions',
        aliasField,
        dateRange: { start, end },
      });
      const unsubscribe = onSnapshot(
        listenerQuery,
        (snapshot) => {
          devLogTeacherQuery('useTeacherSessions', 'snapshot', {
            queryName: sourceKey,
            collection: 'classSessions',
            aliasField,
            dateRange: { start, end },
            docsReturned: snapshot.docs.length,
          });
          liveDocsBySource.set(
            sourceKey,
            new Map(
              snapshot.docs.map((d) => [
                d.id,
                toTeacherSession({ id: d.id, ...(d.data() as Record<string, unknown>) }),
              ]),
            ),
          );
          publishMergedRows();
        },
        (err) => {
          devLogTeacherQuery('useTeacherSessions', 'error', {
            queryName: sourceKey,
            collection: 'classSessions',
            aliasField,
            dateRange: { start, end },
            error: err instanceof Error ? err.message : String(err),
            code: (err as any)?.code || null,
          });
          if (cancelled) return;
          console.error('useTeacherSessions error', err);
          setError(err as Error);
          setIsLoading(false);
        },
      );
      listeners.push(unsubscribe);
    };

    attachListener('primary', includeAllTeachers ? 'all-teachers' : 'teacherId', classSessionsQuery);
    if (!includeAllTeachers && teacherKey) {
      attachListener(
        'teacherIds',
        'teacherIds',
        query(
          baseCollection,
          where('teacherIds', 'array-contains', teacherKey),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc'),
        ),
      );
      attachListener(
        'assignedTeacherId',
        'assignedTeacherId',
        query(
          baseCollection,
          where('assignedTeacherId', '==', teacherKey),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc'),
        ),
      );
      attachListener(
        'primaryTeacherId',
        'primaryTeacherId',
        query(
          baseCollection,
          where('primaryTeacherId', '==', teacherKey),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc'),
        ),
      );
      attachListener(
        'teacherUid',
        'teacherUid',
        query(
          baseCollection,
          where('teacherUid', '==', teacherKey),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc'),
        ),
      );
      attachListener(
        'teacher_id',
        'teacher_id',
        query(
          baseCollection,
          where('teacher_id', '==', teacherKey),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc'),
        ),
      );
    }

    return () => {
      cancelled = true;
      listeners.forEach((stop) => stop());
    };
  }, [teacherId, startDate, endDate, includeAllTeachers]);

  const sortedSessions = useMemo(() => sortSessions(sessions), [sessions]);

  return { sessions: sortedSessions, isLoading, error };
};
