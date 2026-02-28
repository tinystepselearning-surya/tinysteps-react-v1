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

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const getMonthId = (date: Date, useUtc = false) => {
  const year = useUtc ? date.getUTCFullYear() : date.getFullYear();
  const month = String((useUtc ? date.getUTCMonth() : date.getMonth()) + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const normalizeEarnings = (data: any, monthId: string): TeacherEarningsSummary => {
  const sessionsCompleted = toNumber(data.sessionsCompleted, toNumber(data.totalSessions, 0));
  const totalSessions = toNumber(data.totalSessions, sessionsCompleted || toNumber(data.creditsEarned, 0));
  const sessionsPending = toNumber(data.sessionsPending, 0);
  const ratePerSession = toNumber(data.ratePerSession, toNumber(data.ratePerCredit, 0));
  const creditsEarned = toNumber(data.creditsEarned, 0);
  const totalEarnings = toNumber(
    data.totalEarnings,
    ratePerSession > 0 ? ratePerSession * creditsEarned : 0
  );
  const pendingEarnings = toNumber(data.pendingEarnings, 0);

  return {
    month: data.month ?? monthId,
    totalSessions,
    sessionsCompleted,
    sessionsPending,
    ratePerSession,
    totalEarnings,
    pendingEarnings,
    breakdownByCourse: Array.isArray(data.breakdownByCourse) ? data.breakdownByCourse : [],
    payments: Array.isArray(data.payments) ? data.payments : [],
  };
};

const fetchEarnings = async (
  teacherId: string,
  monthId?: string
): Promise<TeacherEarningsSummary> => {
  const now = new Date();
  const monthLocal = monthId || getMonthId(now);
  const monthUtc = getMonthId(now, true);

  const primaryRef = doc(db, 'teachers', teacherId, 'earnings', monthLocal);
  let snapshot = await getDoc(primaryRef);

  if (!snapshot.exists() && !monthId && monthUtc !== monthLocal) {
    const utcRef = doc(db, 'teachers', teacherId, 'earnings', monthUtc);
    snapshot = await getDoc(utcRef);
  }

  if (snapshot.exists()) {
    return normalizeEarnings(snapshot.data(), snapshot.id);
  }

  // Backward-compat fallback
  const legacyRef = doc(db, 'teacherEarnings', teacherId);
  const legacySnap = await getDoc(legacyRef);
  if (!legacySnap.exists()) {
    return { ...defaultSummary, month: monthLocal };
  }
  return normalizeEarnings(legacySnap.data(), monthLocal);
};

export const useEarnings = (teacherId?: string, monthId?: string) => {
  const resolvedMonth = monthId || getMonthId(new Date());
  return useQuery<TeacherEarningsSummary>({
    queryKey: ['teacherEarnings', teacherId, resolvedMonth],
    queryFn: () =>
      teacherId ? fetchEarnings(teacherId, resolvedMonth) : Promise.resolve(defaultSummary),
    enabled: Boolean(teacherId),
    staleTime: 1000 * 60 * 10,
  });
};
