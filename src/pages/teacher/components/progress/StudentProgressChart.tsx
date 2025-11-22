import type { FC } from 'react';
import { Card } from '@components/ui/card';
import { useStudentProgress } from '../../hooks/useStudentProgress';
import { cn } from '@components/lib/utils';

interface StudentProgressChartProps {
  teacherId?: string;
}

const getBarColor = (value: number) => {
  if (value >= 67) return 'bg-green-500';
  if (value >= 34) return 'bg-yellow-400';
  return 'bg-red-400';
};

export const StudentProgressChart: FC<StudentProgressChartProps> = ({ teacherId }) => {
  const { data = [], isLoading } = useStudentProgress(teacherId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading progress...</p>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">No progress data available yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Student Progress</h3>
      <div className="space-y-4">
        {data.map((student) => (
          <div key={student.studentId} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{student.studentName}</p>
              <p className="text-xs text-muted-foreground">
                Attendance {student.attendanceRate ?? 0}% • Last session {student.lastSession || '—'}
              </p>
            </div>
            {['phonics', 'grammar', 'speaking'].map((topic) => (
              <div key={topic}>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{topic.charAt(0).toUpperCase() + topic.slice(1)}</span>
                  <span>{student[topic as keyof typeof student]}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div
                    className={cn('h-2 rounded-full', getBarColor(student[topic as keyof typeof student] as number))}
                    style={{ width: `${student[topic as keyof typeof student]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
};
