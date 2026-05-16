import { useQuery } from '@tanstack/react-query';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { isSessionCanonicalForEnrollment } from '../../../lib/sessionScheduleIntegrity';
import { ParentSession } from '../../../types/Parent';

const todayIso = () => new Date().toISOString().slice(0, 10);

const dateFromDoc = (data: any) => {
  if (typeof data?.date === 'string') return data.date;
  const startAt = data?.startAt;
  if (startAt?.toDate) return startAt.toDate().toISOString().slice(0, 10);
  return undefined;
};

const timeFromDoc = (data: any) => {
  if (typeof data?.startTime === 'string') return data.startTime;
  const startAt = data?.startAt;
  if (startAt?.toDate) return startAt.toDate().toTimeString().slice(0, 5);
  return undefined;
};

const chunkIds = (ids: string[], size = 10): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
};

const fetchSessions = async (childIds: string[]): Promise<ParentSession[]> => {
  if (!childIds.length) return [];
  const rawRows: Array<{ id: string; childId: string; data: any }> = [];
  const seen = new Set<string>();
  await Promise.all(
    childIds.map(async (childId) => {
      const classQuery = query(
        collection(db, 'classSessions'),
        where('kidIds', 'array-contains', childId)
      );
      const classSnap = await getDocs(classQuery);

      const addDoc = (docSnap: any) => {
        if (seen.has(docSnap.id)) return;
        const data = docSnap.data() as any;
        const date = dateFromDoc(data);
        if (!date || date < todayIso()) return;
        seen.add(docSnap.id);
        rawRows.push({ id: docSnap.id, childId, data });
      };

      classSnap.forEach(addDoc);
    })
  );

  const enrollmentIds = Array.from(
    new Set(
      rawRows
        .map(({ data }) => String(data?.enrollmentId || '').trim())
        .filter(Boolean),
    ),
  );
  const enrollmentMap = new Map<string, Record<string, unknown>>();
  for (const chunk of chunkIds(enrollmentIds, 10)) {
    if (!chunk.length) continue;
    const enrollmentSnap = await getDocs(
      query(collection(db, 'enrollments'), where(documentId(), 'in', chunk)),
    );
    enrollmentSnap.docs.forEach((docSnap) => {
      enrollmentMap.set(docSnap.id, { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) });
    });
  }

  const sessions: ParentSession[] = rawRows
    .filter(({ data }) => {
      const enrollmentId = String(data?.enrollmentId || '').trim();
      if (!enrollmentId) return false;
      const enrollment = enrollmentMap.get(enrollmentId);
      return isSessionCanonicalForEnrollment(data as Record<string, unknown>, enrollment);
    })
    .map(({ id, childId, data }) => ({
      id,
      kidId: childId,
      kidName: data.kidNames?.[childId] || data.kidName || 'Child',
      courseName: data.courseName || data.courseId,
      date: dateFromDoc(data) || '',
      startTime: timeFromDoc(data) || '00:00',
      status: data.status || 'scheduled',
      teacherName: data.teacherName,
    }));

  return sessions.sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
};

export const useUpcomingSessions = (childIds: string[]) => {
  return useQuery<ParentSession[]>({
    queryKey: ['parentSessions', childIds.sort().join('-')],
    queryFn: () => fetchSessions(childIds),
    enabled: childIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
