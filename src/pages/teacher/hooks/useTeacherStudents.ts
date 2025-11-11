import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { TeacherStudent } from '../../../types/Teacher';

const fetchTeacherStudents = async (teacherId: string): Promise<TeacherStudent[]> => {
  const q = query(collection(db, 'kids'), where('teacherIds', 'array-contains', teacherId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      fullName: data.fullName || data.name || 'Unnamed',
      grade: data.grade || data.level,
      courseNames: data.courseNames || data.courses || [],
      progressStatus: data.progressStatus || 'on_track',
      lastSessionDate: data.lastSessionDate,
      avatarUrl: data.avatarUrl,
    } as TeacherStudent;
  });
};

export const useTeacherStudents = (teacherId?: string) => {
  return useQuery<TeacherStudent[]>({
    queryKey: ['teacherStudents', teacherId],
    queryFn: () => (teacherId ? fetchTeacherStudents(teacherId) : Promise.resolve([])),
    enabled: Boolean(teacherId),
    staleTime: 1000 * 60 * 5,
  });
};
