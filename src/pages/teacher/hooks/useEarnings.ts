import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { TeacherEarningsSummary } from '../../../types/Teacher';

const defaultSummary: TeacherEarningsSummary = {
  month: '',
  totalSessions: 0,
  sessionsCompleted: 0,
  sessionsPending: 0,
  ratePerSession: 0,
  totalEarnings: 0,
  pendingEarnings: 0,
  breakdownByCourse: [],
  payments: [],
};

const fetchEarnings = async (teacherId: string): Promise<TeacherEarningsSummary> => {
  const ref = doc(db, 'teacherEarnings', teacherId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return { ...defaultSummary, month: '' };
  }
  return snapshot.data() as TeacherEarningsSummary;
};

export const useEarnings = (teacherId?: string) => {
  return useQuery<TeacherEarningsSummary>({
    queryKey: ['teacherEarnings', teacherId],
    queryFn: () => (teacherId ? fetchEarnings(teacherId) : Promise.resolve(defaultSummary)),
    enabled: Boolean(teacherId),
    staleTime: 1000 * 60 * 10,
  });
};
