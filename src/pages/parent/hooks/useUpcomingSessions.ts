import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { ParentSession } from '../../../types/Parent';

const todayIso = () => new Date().toISOString().slice(0, 10);

const fetchSessions = async (childIds: string[]): Promise<ParentSession[]> => {
  if (!childIds.length) return [];
  const sessions: ParentSession[] = [];
  await Promise.all(
    childIds.map(async (childId) => {
      const q = query(collection(db, 'sessions'), where('kidIds', 'array-contains', childId));
      const snapshot = await getDocs(q);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data.date >= todayIso()) {
          sessions.push({
            id: docSnap.id,
            kidId: childId,
            kidName: data.kidNames?.[childId] || data.kidName || 'Child',
            courseName: data.courseName || data.courseId,
            date: data.date,
            startTime: data.startTime,
            status: data.status || 'scheduled',
            teacherName: data.teacherName,
          });
        }
      });
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
