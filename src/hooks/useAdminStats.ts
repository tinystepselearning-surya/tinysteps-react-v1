import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalCourses: number;
  activeSessionsToday: number;
}

const EMPTY_ADMIN_STATS: AdminStats = {
  totalUsers: 0,
  totalStudents: 0,
  totalCourses: 0,
  activeSessionsToday: 0,
};

export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const [usersSnap, studentsSnap, coursesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'kids')),
      getDocs(collection(db, 'courses')),
    ]);

    return {
      totalUsers: usersSnap.size,
      totalStudents: studentsSnap.size,
      totalCourses: coursesSnap.size,
      activeSessionsToday: 0,
    };
  } catch (err) {
    console.warn('Failed to fetch admin stats:', err);
    return EMPTY_ADMIN_STATS;
  }
}

export function useAdminStats(enabled = true) {
  return useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    enabled,
  });
}
