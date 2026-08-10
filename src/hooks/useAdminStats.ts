import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalCourses: number;
  activeSessionsToday: number;
}

const NON_ACTIVE_TODAY_SESSION_STATUSES = new Set([
  'cancelled',
  'canceled',
  'rescheduled',
  'reschedule_requested',
  'void',
]);

const ymdInTimeZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  return year && month && day ? `${year}-${month}-${day}` : date.toISOString().slice(0, 10);
};

export async function fetchAdminStats(): Promise<AdminStats> {
  const todayIst = ymdInTimeZone(new Date(), 'Asia/Kolkata');

  // Keep these reads independent from the filter-heavy analytics dashboard. If any read
  // fails, surface the error instead of returning a believable all-zero dashboard.
  const [usersSnap, studentsSnap, coursesSnap, todaySessionsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'kids')),
    getDocs(collection(db, 'courses')),
    getDocs(query(collection(db, 'classSessions'), where('date', '==', todayIst))),
  ]);

  const activeSessionsToday = todaySessionsSnap.docs.filter((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    if (data.archived === true) return false;
    const status = String(data.status || '').trim().toLowerCase();
    return !NON_ACTIVE_TODAY_SESSION_STATUSES.has(status);
  }).length;

  return {
    totalUsers: usersSnap.size,
    totalStudents: studentsSnap.size,
    totalCourses: coursesSnap.size,
    activeSessionsToday,
  };
}

export function useAdminStats(enabled = true) {
  return useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    enabled,
  });
}
