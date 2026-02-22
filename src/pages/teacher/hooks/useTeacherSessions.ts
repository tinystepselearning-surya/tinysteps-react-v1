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

const toTeacherSession = (doc: any): TeacherSession => ({
  id: doc.id,
  teacherId: doc.teacherId,
  courseId: doc.courseId,
  courseName: doc.courseName,
  date: doc.date,
  startTime: doc.startTime,
  endTime: doc.endTime,
  kidIds: doc.kidIds || [],
  status: doc.status || 'scheduled',
  joinUrl: doc.joinUrl,
  notes: doc.notes,
  attendance: doc.attendance,
  updatedAt: doc.updatedAt,
  updatedBy: doc.updatedBy,
});

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
