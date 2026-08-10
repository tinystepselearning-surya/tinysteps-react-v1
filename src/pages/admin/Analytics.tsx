// React default import removed
import { Card } from '@components/ui/card';

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalCourses: number;
  sessionsToday: number;
}

interface AnalyticsProps {
  stats?: AdminStats;
  isLoading: boolean;
  error?: string;
}

const metricConfig: Array<{
  key: keyof AdminStats;
  label: string;
  accent: string;
  helper?: string;
}> = [
  { key: 'totalUsers', label: 'Total Users', accent: 'text-blue-600' },
  { key: 'totalStudents', label: 'Students', accent: 'text-green-600' },
  { key: 'totalCourses', label: 'Courses', accent: 'text-purple-600' },
  { key: 'sessionsToday', label: 'Sessions Today', accent: 'text-orange-600', helper: 'Scheduled and completed sessions on today’s IST calendar date' },
];

export default function Analytics({ stats, isLoading, error }: AnalyticsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricConfig.map(({ key, label, accent, helper }) => (
          <Card key={key} className="p-6">
            <h3 className="font-semibold mb-2">{label}</h3>
            {isLoading ? (
              <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : (
              <div className={`text-3xl font-bold ${accent}`}>
                {stats ? stats[key] : '—'}
              </div>
            )}
            {helper && <p className="text-xs text-muted-foreground mt-2">{helper}</p>}
          </Card>
        ))}
      </div>

      <Card className="p-6">
        {error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            {isLoading ? (
              <div className="h-4 w-1/2 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : (
              <>
                <p>Charts and detailed analytics will be displayed here.</p>
                <p className="text-sm mt-2">User growth, session attendance, course popularity</p>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
