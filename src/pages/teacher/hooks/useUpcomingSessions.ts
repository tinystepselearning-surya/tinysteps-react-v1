import { useEffect, useState } from 'react';
import { collection, documentId, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { addDays, format } from 'date-fns';
import { db } from '../../../lib/firebaseConfig';
import {
  isScheduleExceptionSession,
  isSessionCanonicalForEnrollment,
  shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment,
} from '../../../lib/sessionScheduleIntegrity';
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

const normalizeTeacherIds = (doc: any): string[] => {
  const raw = Array.isArray(doc.teacherIds) ? doc.teacherIds : [];
  const singles = [doc.teacherId, doc.assignedTeacherId, doc.primaryTeacherId, doc.teacherUid, doc.teacher_id];
  return Array.from(
    new Set(
      [...raw, ...singles]
        .map((id: unknown) => (typeof id === 'string' ? id.trim() : ''))
        .filter(Boolean),
    ),
  );
};

const sessionBelongsToTeacher = (doc: any, teacherId: string): boolean => {
  if (!teacherId) return false;
  return normalizeTeacherIds(doc).includes(teacherId);
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
    const teacherIdsQuery = query(baseCollection, where('teacherIds', 'array-contains', teacherId));
    const assignedTeacherQuery = query(baseCollection, where('assignedTeacherId', '==', teacherId));
    const primaryTeacherQuery = query(baseCollection, where('primaryTeacherId', '==', teacherId));
    const teacherUidQuery = query(baseCollection, where('teacherUid', '==', teacherId));
    const legacyTeacherIdQuery = query(baseCollection, where('teacher_id', '==', teacherId));
    const liveDocsBySource = new Map<string, Map<string, TeacherSession>>();

    const publishMerged = async () => {
      const merged = new Map<string, TeacherSession>();
      liveDocsBySource.forEach((rows) => {
        rows.forEach((session, sessionId) => {
          if (!dates.includes(String(session.date || ''))) return;
          merged.set(sessionId, session);
        });
      });
      const next = Array.from(merged.values()).filter((session) => sessionBelongsToTeacher(session as any, teacherId));
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
      const sorted = canonicalOnly.sort((a, b) => {
        if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
        return String(a.startTime || '').localeCompare(String(b.startTime || ''), undefined, { numeric: true });
      });
      setSessions(sorted);
      setIsLoading(false);
      setError(null);
    };

    const runFallback = async () => {
      try {
        const fallbackSnaps = await Promise.all([
          getDocs(query(baseCollection, where('teacherId', '==', teacherId))),
          getDocs(query(baseCollection, where('teacherIds', 'array-contains', teacherId))),
          getDocs(query(baseCollection, where('assignedTeacherId', '==', teacherId))),
          getDocs(query(baseCollection, where('primaryTeacherId', '==', teacherId))),
          getDocs(query(baseCollection, where('teacherUid', '==', teacherId))),
          getDocs(query(baseCollection, where('teacher_id', '==', teacherId))),
        ]);
        const mergedDocs = new Map<string, any>();
        fallbackSnaps.forEach((snap) => {
          snap.docs.forEach((docSnap) => {
            mergedDocs.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
        });
        const allSessions = Array.from(mergedDocs.values()).map((payload) =>
          toTeacherSession(payload)
        );
        const enrollmentMap = await fetchEnrollmentsByIds(
          Array.from(
            new Set(
              allSessions
                .map((session) => String((session as any)?.enrollmentId || '').trim())
                .filter(Boolean),
            ),
          ),
        );
        const filtered = allSessions.filter(
          (s) => dates.includes(String(s.date || '')) && sessionBelongsToTeacher(s as any, teacherId),
        );
        const canonicalOnly = filtered.filter((session) => {
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

    const listeners: Array<() => void> = [];
    const attachListener = (
      sourceKey: string,
      listenerQuery: ReturnType<typeof query>,
      fallbackToBatch = false,
    ) => {
      const unsubscribe = onSnapshot(
        listenerQuery,
        (snapshot) => {
          liveDocsBySource.set(
            sourceKey,
            new Map(
              snapshot.docs.map((d) => [
                d.id,
                toTeacherSession({ id: d.id, ...(d.data() as Record<string, unknown>) }),
              ]),
            ),
          );
          void publishMerged().catch((err) => {
            console.error('useUpcomingSessions canonical filter error', err);
            setError(err as Error);
            setIsLoading(false);
          });
        },
        (err) => {
          console.error('useUpcomingSessions error', err);
          const message = err instanceof Error ? err.message : String(err);
          if (
            fallbackToBatch &&
            (err?.code === 'failed-precondition' ||
            /requires an index|index is currently building/i.test(message))
          ) {
            listeners.forEach((stop) => stop());
            runFallback();
            return;
          }
          setError(err as Error);
          setIsLoading(false);
        }
      );
      listeners.push(unsubscribe);
    };

    attachListener('primary', q, true);
    attachListener('teacherIds', teacherIdsQuery);
    attachListener('assignedTeacherId', assignedTeacherQuery);
    attachListener('primaryTeacherId', primaryTeacherQuery);
    attachListener('teacherUid', teacherUidQuery);
    attachListener('teacher_id', legacyTeacherIdQuery);

    return () => listeners.forEach((stop) => stop());
  }, [teacherId]);

  return { sessions, isLoading, error };
};
