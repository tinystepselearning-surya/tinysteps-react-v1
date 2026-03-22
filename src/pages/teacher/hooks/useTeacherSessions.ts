import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
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

const normalizeKidIds = (doc: any): string[] => {
  const raw =
    Array.isArray(doc.kidIds) ? doc.kidIds :
    doc.kidId ? [doc.kidId] :
    doc.studentId ? [doc.studentId] :
    [];
  return raw.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0);
};

const toTeacherSession = (doc: any): TeacherSession => {
  const startAtDate = toDateMaybe(doc.startAt);
  const endAtDate = toDateMaybe(doc.endAt);

  const date =
    typeof doc.date === 'string' && doc.date
      ? doc.date
      : startAtDate
        ? format(startAtDate, 'yyyy-MM-dd')
        : '';

  const startTime =
    typeof doc.startTime === 'string' && doc.startTime
      ? doc.startTime
      : startAtDate
        ? format(startAtDate, 'HH:mm')
        : '';

  const endTime =
    typeof doc.endTime === 'string' && doc.endTime
      ? doc.endTime
      : endAtDate
        ? format(endAtDate, 'HH:mm')
        : '';

  return {
    id: doc.id,
    ...(doc.enrollmentId ? { enrollmentId: doc.enrollmentId } : {}),
    teacherId: doc.teacherId || '',
    ...(typeof doc.parentId === 'string' ? { parentId: doc.parentId } : {}),
    ...(Array.isArray(doc.parentIds) ? { parentIds: doc.parentIds } : {}),
    courseId: doc.courseId || '',
    courseName: doc.courseName || doc.courseTitle || '',
    date,
    startTime,
    endTime,
    kidIds: normalizeKidIds(doc),
    status: doc.status || 'scheduled',
    joinUrl: doc.joinUrl || doc.meetingLink,
    ...(doc.meetingLink ? { meetingLink: doc.meetingLink } : {}),
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

export const useTeacherSessions = (
  teacherId?: string,
  startDate?: string,
  endDate?: string
): UseTeacherSessionsResult => {
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!teacherId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setIsLoading(false);
      return;
    }

    // Default to today if no range provided
    const today = format(new Date(), 'yyyy-MM-dd');
    const start = startDate || today;
    const end = endDate || today;

    const baseCollection = collection(db, 'classSessions');
    const classSessionsQuery = query(
      baseCollection,
      where('teacherId', '==', teacherId),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    let cancelled = false;
    const fallbackMessage =
      'Loading sessions in fallback mode (index not ready). Admin can deploy indexes for faster results.';

    const runFallback = async () => {
      try {
        const fallbackSnap = await getDocs(
          query(baseCollection, where('teacherId', '==', teacherId))
        );
        const allSessions = fallbackSnap.docs.map((d) =>
          toTeacherSession({ id: d.id, ...d.data() })
        );
        const filtered = allSessions.filter((s) => {
          const date = String(s.date || '');
          return date >= start && date <= end;
        });
        const sorted = filtered.sort((a, b) => {
          if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
          return String(a.startTime || '').localeCompare(String(b.startTime || ''), undefined, {
            numeric: true,
          });
        });
        if (!cancelled) {
          setSessions(sorted.slice(0, 200));
          setError(new Error(fallbackMessage));
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
        if (!cancelled) {
          setSessions(classSessions);
          setIsLoading(false);
          setError(null);
        }
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
            runFallback();
            return;
          }
          setError(err as Error);
          setIsLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [teacherId, startDate, endDate]);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) =>
        a.startTime.localeCompare(b.startTime, undefined, { numeric: true })
      ),
    [sessions]
  );

  return { sessions: sortedSessions, isLoading, error };
};
