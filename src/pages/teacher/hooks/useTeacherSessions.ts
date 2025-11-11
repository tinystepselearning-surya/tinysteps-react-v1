import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
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
  date: string = format(new Date(), 'yyyy-MM-dd')
): UseTeacherSessionsResult => {
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!teacherId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'sessions'),
      where('teacherId', '==', teacherId),
      where('date', '==', date),
      orderBy('startTime', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => toTeacherSession({ id: d.id, ...d.data() }));
        setSessions(data);
        setIsLoading(false);
      },
      (err) => {
        console.error('useTeacherSessions error', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [teacherId, date]);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) =>
        a.startTime.localeCompare(b.startTime, undefined, { numeric: true })
      ),
    [sessions]
  );

  return { sessions: sortedSessions, isLoading, error };
};
