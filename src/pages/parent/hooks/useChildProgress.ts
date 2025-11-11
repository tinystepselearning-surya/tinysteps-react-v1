import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { ChildProgressSnapshot } from '../../../types/Parent';

const fetchProgress = async (childIds: string[]): Promise<ChildProgressSnapshot[]> => {
  if (!childIds.length) return [];
  const snapshot = await getDocs(query(collection(db, 'progress'), where('studentId', 'in', childIds.slice(0, 10))));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as any;
    return {
      childId: data.studentId || docSnap.id,
      childName: data.studentName || 'Child',
      phonics: data.phonics ?? 0,
      grammar: data.grammar ?? 0,
      speaking: data.speaking ?? 0,
      recommendations: data.recommendations,
      recentActivities: data.recentActivities,
      timeline: data.timeline,
    } satisfies ChildProgressSnapshot;
  });
};

export const useChildProgress = (childIds: string[]) => {
  return useQuery<ChildProgressSnapshot[]>({
    queryKey: ['parentProgress', childIds.sort().join('-')],
    queryFn: () => fetchProgress(childIds),
    enabled: childIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
