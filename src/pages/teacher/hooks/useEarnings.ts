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
  demoEarnings: 0,
  demoCompletedCount: 0,
  demoEnrollmentBonusCount: 0,
  breakdownByCourse: [],
  payments: [],
};

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const getMonthId = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || String(date.getFullYear());
  const month = parts.find((part) => part.type === 'month')?.value || String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const normalizeEarnings = (data: any, monthId: string): TeacherEarningsSummary => {
  const sessionsCompleted = toNumber(data.sessionsCompleted, toNumber(data.totalSessions, 0));
  const totalSessions = toNumber(data.totalSessions, sessionsCompleted);

  return {
    month: data.month ?? monthId,
    totalSessions,
    sessionsCompleted,
    sessionsPending: toNumber(data.sessionsPending, 0),
    ratePerSession: toNumber(data.ratePerSession, 0),
    totalEarnings: toNumber(data.totalEarnings, 0),
    pendingEarnings: toNumber(data.pendingEarnings, 0),
    demoEarnings: toNumber(data.demoEarnings, 0),
    demoCompletedCount: toNumber(data.demoCompletedCount, 0),
    demoEnrollmentBonusCount: toNumber(data.demoEnrollmentBonusCount, 0),
    breakdownByCourse: Array.isArray(data.breakdownByCourse) ? data.breakdownByCourse : [],
    payments: Array.isArray(data.payments) ? data.payments : [],
  };
};

const fetchEarnings = async (
  teacherId: string,
  monthId: string,
): Promise<TeacherEarningsSummary> => {
  const monthlyRef = doc(db, 'teachers', teacherId, 'earnings', monthId);
  const snapshot = await getDoc(monthlyRef);

  if (!snapshot.exists()) {
    return { ...defaultSummary, month: monthId };
  }

  return normalizeEarnings(snapshot.data(), snapshot.id);
};

export const useEarnings = (teacherId?: string, monthId?: string) => {
  const resolvedMonth = monthId || getMonthId(new Date());
  return useQuery<TeacherEarningsSummary>({
    queryKey: ['teacherEarningsRollup', teacherId, resolvedMonth],
    queryFn: () =>
      teacherId
        ? fetchEarnings(teacherId, resolvedMonth)
        : Promise.resolve({ ...defaultSummary, month: resolvedMonth }),
    enabled: Boolean(teacherId),
    staleTime: 1000 * 60 * 10,
  });
};
