import React, { Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { TeacherHeader } from './components/layout/TeacherHeader';
import { TeacherSidebar } from './components/layout/TeacherSidebar';
const TodaySessionsList = React.lazy(() => import('./components/today-sessions/TodaySessionsList'));
const StudentsList = React.lazy(() => import('./components/students/StudentsList'));
const StudentProgressChart = React.lazy(() => import('./components/progress/StudentProgressChart'));
const EarningsSummary = React.lazy(() => import('./components/earnings/EarningsSummary'));
const TeacherStats = React.lazy(() => import('./components/analytics/TeacherStats'));
import { useAuthStore } from '../../store/useAuthStore';
import { useTeacherSessions } from './hooks/useTeacherSessions';

const AccessNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-muted/30">
    <Card className="p-8 text-center space-y-2 max-w-md">{children}</Card>
  </div>
);

const TAB_ITEMS = [
  { id: 'today', label: "Today's Sessions" },
  { id: 'students', label: 'Students' },
  { id: 'progress', label: 'Progress' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'analytics', label: 'Analytics' },
];

export default function TeacherDashboard() {
  const { user, isLoading } = useAuthStore();
  const [tab, setTab] = useState('today');
  const teacherId = user?.uid;
  const { sessions } = useTeacherSessions(teacherId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">Checking permissions...</Card>
      </div>
    );
  }

  if (!user || user.role !== 'teacher') {
    return <AccessNotice>You do not have permission to access the teacher dashboard.</AccessNotice>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <TeacherHeader name={user.displayName || user.email} upcomingCount={sessions.length} />
      <div className="flex gap-6">
        <TeacherSidebar active={tab} onSelect={setTab} todayCount={sessions.length} />
        <main className="flex-1 space-y-6">
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="lg:hidden">
              {TAB_ITEMS.map((item) => (
                <TabsTrigger key={item.id} value={item.id}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="today">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading sessions…</div>}>
                <TodaySessionsList teacherId={teacherId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="students">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading students…</div>}>
                <StudentsList teacherId={teacherId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="progress">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading progress…</div>}>
                <StudentProgressChart teacherId={teacherId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="earnings">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading earnings…</div>}>
                <EarningsSummary teacherId={teacherId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="analytics">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading analytics…</div>}>
                <TeacherStats teacherId={teacherId} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
