import { useEffect, useMemo, useState } from 'react';
import { collection, documentId, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../lib/firebaseConfig';
import { TeacherSession } from '../../../types/Teacher';

interface UseTeacherSessionsResult {
  sessions: TeacherSession[];
  isLoading: boolean;
  error: Error | null;
}

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

const resolveTeacherId = (doc: any): string => {
  return (
    toCleanText(doc.teacherId) ||
    toCleanText(doc.assignedTeacherId) ||
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

    const applyRows = async (rows: TeacherSession[]) => {
      const currentBatch = ++batchCounter;
      const filtered = includeAllTeachers
        ? rows
        : rows.filter((session) => toCleanText((session as any)?.teacherId) === teacherKey);

      const enriched = await enrichSessionsWithKidNames(filtered);
      if (cancelled || currentBatch !== batchCounter) return;
      setSessions(sortSessions(enriched).slice(0, 400));
      setError(null);
      setIsLoading(false);
    };

    const runFallback = async () => {
      const isIndexError = (value: unknown) => {
        const message = value instanceof Error ? value.message : String(value);
        const code = (value as any)?.code;
        return code === 'failed-precondition' || /requires an index|index is currently building/i.test(message);
      };

      // Keep fallback queries scoped (teacher/date) to avoid broad classSessions reads.
      const fallbackQueries = includeAllTeachers
        ? [
            query(
              baseCollection,
              where('date', '>=', start),
              where('date', '<=', end),
              orderBy('date', 'asc'),
            ),
          ]
        : teacherKey
          ? [
              query(
                baseCollection,
                where('teacherId', '==', teacherKey),
                where('date', '>=', start),
                where('date', '<=', end),
                orderBy('date', 'asc'),
              ),
              query(baseCollection, where('teacherId', '==', teacherKey)),
              query(
                baseCollection,
                where('date', '>=', start),
                where('date', '<=', end),
                orderBy('date', 'asc'),
              ),
            ]
          : [
              query(
                baseCollection,
                where('date', '>=', start),
                where('date', '<=', end),
                orderBy('date', 'asc'),
              ),
            ];

      let lastError: unknown = null;

      try {
        for (const fallbackQuery of fallbackQueries) {
          try {
            const fallbackSnap = await getDocs(fallbackQuery);
            const scopedSessions = fallbackSnap.docs.map((d) =>
              toTeacherSession({ id: d.id, ...d.data() }),
            );
            const filteredByDate = scopedSessions.filter((session) => {
              const date = toCleanText(session.date);
              return Boolean(date && date >= start && date <= end);
            });
            await applyRows(filteredByDate);
            if (import.meta.env.DEV && !cancelled) {
              console.warn('useTeacherSessions: loaded fallback data because classSessions index is not ready');
            }
            return;
          } catch (fallbackErr) {
            lastError = fallbackErr;
            if (!isIndexError(fallbackErr)) throw fallbackErr;
          }
        }
        if (!cancelled) {
          setError((lastError as Error) || new Error('useTeacherSessions fallback failed'));
          setIsLoading(false);
        }
      } catch (fallbackErr) {
        if (!cancelled) {
          setError(fallbackErr as Error);
          setIsLoading(false);
        }
      }
    };

    const unsub = onSnapshot(
      classSessionsQuery,
      (snapshot) => {
        const classSessions = snapshot.docs.map((d) => toTeacherSession({ id: d.id, ...d.data() }));
        void applyRows(classSessions);
      },
      (err) => {
        console.error('useTeacherSessions error', err);
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          if (
            err?.code === 'failed-precondition' ||
            /requires an index|index is currently building/i.test(message)
          ) {
            unsub();
            void runFallback();
            return;
          }
          setError(err as Error);
          setIsLoading(false);
        }
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [teacherId, startDate, endDate, includeAllTeachers]);

  const sortedSessions = useMemo(() => sortSessions(sessions), [sessions]);

  return { sessions: sortedSessions, isLoading, error };
};
