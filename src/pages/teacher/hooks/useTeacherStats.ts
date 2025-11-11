import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { TeacherStatsSummary } from '../../../types/Teacher';

const fallbackStats: TeacherStatsSummary = {
  totalSessions: 0,
  totalStudents: 0,
  averageAttendance: 0,
  averageSatisfaction: 0,
  completionRate: 0,
  sessionsByCourse: [],
  sessionsByMonth: [],
  studentProgress: [],
};

const fetchTeacherStats = async (teacherId: string): Promise<TeacherStatsSummary> => {
  const ref = doc(db, 'teacherStats', teacherId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return fallbackStats;
  }
  return snapshot.data() as TeacherStatsSummary;
};

export const useTeacherStats = (teacherId?: string) => {
  return useQuery<TeacherStatsSummary>({
    queryKey: ['teacherStats', teacherId],
    queryFn: () => (teacherId ? fetchTeacherStats(teacherId) : Promise.resolve(fallbackStats)),
    enabled: Boolean(teacherId),
    staleTime: 1000 * 60 * 10,
  });
};
