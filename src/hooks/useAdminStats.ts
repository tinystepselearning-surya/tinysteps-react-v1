import { useQuery } from '@tanstack/react-query';
import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalCourses: number;
  sessionsToday: number;
}

const NON_ACTIVE_TODAY_SESSION_STATUSES = new Set([
  'cancelled',
  'canceled',
  'rescheduled',
  'reschedule_requested',
  'reschedule-requested',
  'void',
  'archived',
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

export async function fetchAdminStats(includeSessionsToday = true): Promise<AdminStats> {
  const todayIst = ymdInTimeZone(new Date(), 'Asia/Kolkata');

  // Keep these reads independent from the filter-heavy analytics dashboard. If any read
  // fails, surface the error instead of returning a believable all-zero dashboard.
  // The admin footer only needs counts. Do not read every session for Today on
  // unrelated admin tabs (including frequently opened Leads & Enquiries).
  // Analytics' Live operations card requests session totals explicitly.
  const [usersCount, studentsCount, coursesCount, todaySessionsSnap] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(collection(db, 'kids')),
    getCountFromServer(collection(db, 'courses')),
    includeSessionsToday
      ? getDocs(query(collection(db, 'classSessions'), where('date', '==', todayIst)))
      : Promise.resolve(null),
  ]);

  const sessionsToday = todaySessionsSnap?.docs.filter((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    if (data.archived === true) return false;
    const status = String(data.status || '').trim().toLowerCase();
    return !NON_ACTIVE_TODAY_SESSION_STATUSES.has(status);
  }).length ?? 0;

  return {
    totalUsers: usersCount.data().count,
    totalStudents: studentsCount.data().count,
    totalCourses: coursesCount.data().count,
    sessionsToday,
  };
}

export function useAdminStats(enabled = true, includeSessionsToday = true) {
  return useQuery<AdminStats>({
    // Prevent a counts-only footer response from polluting the Analytics card.
    queryKey: ['adminStats', includeSessionsToday],
    queryFn: () => fetchAdminStats(includeSessionsToday),
    enabled,
  });
}
