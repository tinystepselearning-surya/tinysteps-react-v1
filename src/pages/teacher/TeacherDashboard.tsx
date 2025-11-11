import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { TeacherHeader } from './components/layout/TeacherHeader';
import { TeacherSidebar } from './components/layout/TeacherSidebar';
import { TodaySessionsList } from './components/today-sessions/TodaySessionsList';
import { StudentsList } from './components/students/StudentsList';
import { StudentProgressChart } from './components/progress/StudentProgressChart';
import { EarningsSummary } from './components/earnings/EarningsSummary';
import { TeacherStats } from './components/analytics/TeacherStats';
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
              <TodaySessionsList teacherId={teacherId} />
            </TabsContent>
            <TabsContent value="students">
              <StudentsList teacherId={teacherId} />
            </TabsContent>
            <TabsContent value="progress">
              <StudentProgressChart teacherId={teacherId} />
            </TabsContent>
            <TabsContent value="earnings">
              <EarningsSummary teacherId={teacherId} />
            </TabsContent>
            <TabsContent value="analytics">
              <TeacherStats teacherId={teacherId} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
