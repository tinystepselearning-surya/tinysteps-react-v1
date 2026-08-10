// src/components/admin/AdminOverviewCard.tsx
import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@components/ui/card';
import { useAdminStats } from '../../hooks/useAdminStats';

const AdminOverviewCard: React.FC = () => {
  const { data: stats, isLoading: loading, error } = useAdminStats();
  const errorMessage = error instanceof Error ? error.message : null;

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
        ) : errorMessage ? (
          <p className="text-sm text-red-500">Admin overview unavailable: {errorMessage}</p>
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
                Sessions Today
              </p>
              <p className="text-xl font-semibold">
                {stats.sessionsToday}
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
