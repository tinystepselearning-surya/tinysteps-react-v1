import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { addDays, format } from 'date-fns';
import { db } from '../../../lib/firebaseConfig';
import { TeacherSession } from '../../../types/Teacher';

interface UseUpcomingSessionsResult {
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

export const useUpcomingSessions = (teacherId?: string): UseUpcomingSessionsResult => {
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!teacherId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setIsLoading(false);
      return;
    }

    const today = new Date();
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      dates.push(format(addDays(today, i), 'yyyy-MM-dd'));
    }

    const q = query(
      collection(db, 'classSessions'),
      where('teacherId', '==', teacherId),
      where('date', 'in', dates),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs
          .map((d) => toTeacherSession({ id: d.id, ...d.data() }))
          .sort((a, b) => {
          if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
          return String(a.startTime || '').localeCompare(String(b.startTime || ''), undefined, { numeric: true });
        });
        setSessions(next);
        setIsLoading(false);
      },
      (err) => {
        console.error('useUpcomingSessions error', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [teacherId]);

  return { sessions, isLoading, error };
};
