import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
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

const fetchSessions = async (childIds: string[]): Promise<ParentSession[]> => {
  if (!childIds.length) return [];
  const sessions: ParentSession[] = [];
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
        sessions.push({
          id: docSnap.id,
          kidId: childId,
          kidName: data.kidNames?.[childId] || data.kidName || 'Child',
          courseName: data.courseName || data.courseId,
          date,
          startTime: timeFromDoc(data) || '00:00',
          status: data.status || 'scheduled',
          teacherName: data.teacherName,
        });
      };

      classSnap.forEach(addDoc);
    })
  );
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
