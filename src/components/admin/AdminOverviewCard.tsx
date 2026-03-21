// src/components/admin/AdminOverviewCard.tsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@components/ui/card';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

interface OverviewStats {
  totalUsers: number;
  totalStudents: number;
  totalCourses: number;
  activeSessionsToday: number;
}

const AdminOverviewCard: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersSnap, studentsSnap, coursesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'kids')),
          getDocs(collection(db, 'courses')),
        ]);

        setStats({
          totalUsers: usersSnap.size,
          totalStudents: studentsSnap.size,
          totalCourses: coursesSnap.size,
          activeSessionsToday: 0,
        });
      } catch (err: any) {
        console.warn('AdminOverviewCard: failed to fetch stats', err);
        setError('Unable to load overview stats.');
        setStats({
          totalUsers: 0,
          totalStudents: 0,
          totalCourses: 0,
          activeSessionsToday: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="px-4 pb-1 pt-4">
        <CardTitle className="text-lg">
          Admin Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading overview…
          </p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Total Users
              </p>
              <p className="text-xl font-semibold">{stats.totalUsers}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Total Students
              </p>
              <p className="text-xl font-semibold">
                {stats.totalStudents}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Total Courses
              </p>
              <p className="text-xl font-semibold">
                {stats.totalCourses}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Active Sessions Today
              </p>
              <p className="text-xl font-semibold">
                {stats.activeSessionsToday}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminOverviewCard;
