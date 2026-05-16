import { useEffect, useState } from 'react';
import { collection, documentId, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { addDays, format } from 'date-fns';
import { db } from '../../../lib/firebaseConfig';
import { isSessionCanonicalForEnrollment } from '../../../lib/sessionScheduleIntegrity';
import { TeacherSession } from '../../../types/Teacher';

interface UseUpcomingSessionsResult {
  sessions: TeacherSession[];
  isLoading: boolean;
  error: Error | null;
}

const normalizeKidIds = (doc: any): string[] => {
  const raw =
    Array.isArray(doc.kidIds) ? doc.kidIds :
    doc.kidId ? [doc.kidId] :
    doc.studentId ? [doc.studentId] :
    [];
  return raw.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0);
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
    const snap = await getDocs(query(collection(db, 'enrollments'), where(documentId(), 'in', chunk)));
    snap.docs.forEach((docSnap) => {
      map.set(docSnap.id, { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) });
    });
  }
  return map;
};

const toTeacherSession = (doc: any): TeacherSession => ({
  id: doc.id,
  teacherId: doc.teacherId,
  parentId: doc.parentId,
  parentIds: doc.parentIds,
  courseId: doc.courseId,
  courseName: doc.courseName,
  date: doc.date,
  startTime: doc.startTime,
  endTime: doc.endTime,
  kidIds: normalizeKidIds(doc),
  status: doc.status || 'scheduled',
  joinUrl: doc.joinUrl,
  notes: doc.notes,
  feeAmount: doc.feeAmount,
  currency: doc.currency,
  source: doc.source,
  attendance: doc.attendance,
  updatedAt: doc.updatedAt,
  updatedBy: doc.updatedBy,
  makeupCreditId: doc.makeupCreditId,
  makeupForSessionId: doc.makeupForSessionId,
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
    const dates: string[] = [];
    for (let i = 1; i <= 7; i++) {
      dates.push(format(addDays(today, i), 'yyyy-MM-dd'));
    }

    const baseCollection = collection(db, 'classSessions');
    const q = query(
      baseCollection,
      where('teacherId', '==', teacherId),
      where('date', 'in', dates),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    const runFallback = async () => {
      try {
        const fallbackSnap = await getDocs(
          query(baseCollection, where('teacherId', '==', teacherId))
        );
        const allSessions = fallbackSnap.docs.map((d) => {
          const payload = { id: d.id, ...d.data() };
          return toTeacherSession(payload);
        });
        const enrollmentMap = await fetchEnrollmentsByIds(
          Array.from(
            new Set(
              allSessions
                .map((session) => String((session as any)?.enrollmentId || '').trim())
                .filter(Boolean),
            ),
          ),
        );
        const filtered = allSessions.filter((s) => dates.includes(String(s.date || '')));
        const canonicalOnly = filtered.filter((session) => {
          const status = String((session as any)?.status || '').trim().toLowerCase();
          if (status === 'paused') return false;
          const enrollmentId = String((session as any)?.enrollmentId || '').trim();
          if (!enrollmentId) return false;
          const enrollment = enrollmentMap.get(enrollmentId);
          return isSessionCanonicalForEnrollment(session as unknown as Record<string, unknown>, enrollment);
        });
        const sorted = canonicalOnly.sort((a, b) => {
          if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
          return String(a.startTime || '').localeCompare(String(b.startTime || ''), undefined, {
            numeric: true,
          });
        });
        setSessions(sorted.slice(0, 200));
        setIsLoading(false);
        setError(null);
        if (import.meta.env.DEV) {
          console.warn(
            'useUpcomingSessions: loaded fallback data because classSessions index is not ready'
          );
        }
      } catch (fallbackErr) {
        setError(fallbackErr as Error);
        setIsLoading(false);
      }
    };

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        void (async () => {
          const next = snapshot.docs.map((d) => toTeacherSession({ id: d.id, ...d.data() }));
          const enrollmentMap = await fetchEnrollmentsByIds(
            Array.from(
              new Set(
                next
                  .map((session) => String((session as any)?.enrollmentId || '').trim())
                  .filter(Boolean),
              ),
            ),
          );
          const canonicalOnly = next.filter((session) => {
            const status = String((session as any)?.status || '').trim().toLowerCase();
            if (status === 'paused') return false;
            const enrollmentId = String((session as any)?.enrollmentId || '').trim();
            if (!enrollmentId) return false;
            const enrollment = enrollmentMap.get(enrollmentId);
            return isSessionCanonicalForEnrollment(session as unknown as Record<string, unknown>, enrollment);
          });
          const sorted = canonicalOnly.sort((a, b) => {
            if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
            return String(a.startTime || '').localeCompare(String(b.startTime || ''), undefined, { numeric: true });
          });
          setSessions(sorted);
          setIsLoading(false);
          setError(null);
        })().catch((err) => {
          console.error('useUpcomingSessions canonical filter error', err);
          setError(err as Error);
          setIsLoading(false);
        });
      },
      (err) => {
        console.error('useUpcomingSessions error', err);
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
    );

    return () => unsub();
  }, [teacherId]);

  return { sessions, isLoading, error };
};
