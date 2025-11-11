import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { StudentProgress } from '../../../types/Teacher';

const defaultProgress = (studentId: string, studentName: string): StudentProgress => ({
  studentId,
  studentName,
  phonics: 0,
  grammar: 0,
  speaking: 0,
  attendanceRate: 0,
});

const fetchStudentProgress = async (teacherId: string): Promise<StudentProgress[]> => {
  const q = query(collection(db, 'progress'), where('teacherId', '==', teacherId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      studentId: data.studentId || doc.id,
      studentName: data.studentName || 'Student',
      phonics: data.phonics ?? 0,
      grammar: data.grammar ?? 0,
      speaking: data.speaking ?? 0,
      lastSession: data.lastSessionDate,
      attendanceRate: data.attendanceRate ?? 0,
    } satisfies StudentProgress;
  });
};

export const useStudentProgress = (teacherId?: string) => {
  return useQuery<StudentProgress[]>({
    queryKey: ['teacherProgress', teacherId],
    queryFn: () => (teacherId ? fetchStudentProgress(teacherId) : Promise.resolve([])),
    enabled: Boolean(teacherId),
    staleTime: 1000 * 60 * 5,
  });
};
