import type { FC } from 'react';
import { Card } from '@components/ui/card';
import { useTeacherStats } from '../../hooks/useTeacherStats';

interface TeacherStatsProps {
  teacherId?: string;
}

const StatBlock = ({ label, value }: { label: string; value: string | number }) => (
  <Card className="p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-semibold">{value}</p>
  </Card>
);

export const TeacherStats: FC<TeacherStatsProps> = ({ teacherId }) => {
  const { data, isLoading } = useTeacherStats(teacherId);

  if (isLoading || !data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBlock label="Total Sessions" value={data.totalSessions} />
        <StatBlock label="Students" value={data.totalStudents} />
        <StatBlock label="Attendance" value={`${data.averageAttendance}%`} />
        <StatBlock label="Satisfaction" value={data.averageSatisfaction.toFixed(1)} />
        <StatBlock label="Completion" value={`${data.completionRate}%`} />
      </div>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sessions by Course</h3>
        <div className="space-y-2">
          {(data.sessionsByCourse || []).map((row: any) => (
            <div key={row.course} className="flex items-center justify-between">
              <span>{row.course}</span>
              <span>{row.value}</span>
            </div>
          ))}
          {!data.sessionsByCourse?.length && (
            <p className="text-sm text-muted-foreground">No data available.</p>
          )}
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
        <div className="space-y-2">
          {(data.sessionsByMonth || []).map((row: any) => (
            <div key={row.month} className="flex items-center justify-between text-sm">
              <span>{row.month}</span>
              <span>{row.value}</span>
            </div>
          ))}
          {!data.sessionsByMonth?.length && (
            <p className="text-sm text-muted-foreground">No data available.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
