import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { ParentChildSummary } from '../../../types/Parent';

const mapChild = (doc: any): ParentChildSummary => ({
  id: doc.id,
  fullName: doc.fullName || doc.name || 'Child',
  grade: doc.grade,
  courses: doc.courseNames || doc.courses || [],
  status: doc.status || 'active',
  phonicsMastery: doc.summary?.phonicsMastery ?? doc.phonicsMastery,
  grammarMastery: doc.summary?.grammarMastery ?? doc.grammarMastery,
  speakingMastery: doc.summary?.speakingMastery ?? doc.speakingMastery,
  avatarUrl: doc.avatarUrl,
});

const fetchParentChildren = async (parentId: string): Promise<ParentChildSummary[]> => {
  const q = query(collection(db, 'kids'), where('parentIds', 'array-contains', parentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => mapChild({ id: docSnap.id, ...docSnap.data() }));
};

export const useParentChildren = (parentId?: string) => {
  return useQuery<ParentChildSummary[]>({
    queryKey: ['parentChildren', parentId],
    queryFn: () => (parentId ? fetchParentChildren(parentId) : Promise.resolve([])),
    enabled: Boolean(parentId),
    staleTime: 1000 * 60 * 5,
  });
};
