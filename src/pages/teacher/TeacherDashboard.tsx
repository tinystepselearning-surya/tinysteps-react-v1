// src/pages/teacher/TeacherDashboard.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Card } from '@components/ui/card';

import { TeacherHeader } from './components/layout/TeacherHeader';
import { TeacherSidebar } from './components/layout/TeacherSidebar';

import { useAuthStore } from '../../store/useAuthStore';
import { useTeacherSessions } from './hooks/useTeacherSessions';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';

// Lazy-loaded views
const TodaySessionsView = React.lazy(() =>
  import('./components/today-sessions/TodaySessionsList').then((module) => ({
    default: module.TodaySessionsList,
  })),
);

const UpcomingSessionsView = React.lazy(() =>
  import('./components/upcoming-sessions/UpcomingSessionsView').then(
    (module) => ({
      default: module.UpcomingSessionsView,
    }),
  ),
);

const StudentsList = React.lazy(() =>
  import('./components/students/StudentsList').then((module) => ({
    default: module.StudentsList,
  })),
);

const StudentProgressChart = React.lazy(() =>
  import('./components/progress/StudentProgressChart').then((module) => ({
    default: module.StudentProgressChart,
  })),
);

const EarningsSummary = React.lazy(() =>
  import('./components/earnings/EarningsSummary').then((module) => ({
    default: module.EarningsSummary,
  })),
);

const TeacherStats = React.lazy(() =>
  import('./components/analytics/TeacherStats').then((module) => ({
    default: module.TeacherStats,
  })),
);

const MessagesView = React.lazy(() =>
  import('./components/messages/MessagesView').then((module) => ({
    default: module.MessagesView,
  })),
);

const ScheduleView = React.lazy(() =>
  import('./components/schedule/ScheduleView').then((module) => ({
    default: module.ScheduleView,
  })),
);

const TeacherProfile = React.lazy(() =>
  import('./components/profile/TeacherProfile').then((module) => ({
    default: module.TeacherProfile,
  })),
);

const NotificationsPanel = React.lazy(() =>
  import('./components/notifications/NotificationsPanel').then((module) => ({
    default: module.NotificationsPanel,
  })),
);

const AccessNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-muted/30">
    <Card className="p-8 text-center space-y-2 max-w-md">{children}</Card>
  </div>
);

const TAB_ITEMS = [
  { id: 'today', label: "Today's Sessions" },
  { id: 'upcoming', label: 'Upcoming Sessions' },
  { id: 'students', label: 'Students' },
  { id: 'progress', label: 'Progress' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'messages', label: 'Messages' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
];

type StudentForRow = {
  uid?: string;
  id?: string;
  studentName?: string;
  parentName?: string;
  courseName?: string;
  mastery?: number;
  status?: string;
  [key: string]: any;
};

export default function TeacherDashboard() {
  const { user, isLoading } = useAuthStore();
  const [tab, setTab] = useState<string>('today');
  const [showNotifications, setShowNotifications] = useState(false);

  const teacherId = user?.uid;
  const { sessions } = useTeacherSessions(teacherId);
  const { students, loading, error } = useTeacherFilteredStudents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">Checking permissions...</Card>
      </div>
    );
  }

  if (!user || user.role !== 'teacher') {
    return (
      <AccessNotice>
        You do not have permission to access the teacher dashboard.
      </AccessNotice>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <TeacherHeader
        name={user.displayName || user.email || 'Teacher'}
        upcomingCount={sessions.length}
        onToggleNotifications={() => setShowNotifications(true)}
      />

      <div className="flex gap-6">
        <TeacherSidebar
          active={tab}
          onSelect={setTab}
          todayCount={sessions.length}
          teacherId={teacherId}
        />

        <main className="flex-1 space-y-6">
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            {/* Mobile tabs for when sidebar is hidden */}
            <TabsList className="lg:hidden">
              {TAB_ITEMS.map((item) => (
                <TabsTrigger key={item.id} value={item.id}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Today */}
            <TabsContent value="today">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading sessions…</div>}>
                <TodaySessionsView teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Upcoming */}
            <TabsContent value="upcoming">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading upcoming sessions…</div>}>
                <UpcomingSessionsView teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Students */}
            <TabsContent value="students">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading students…</div>}>
                <div className="space-y-6">
                  <h1 className="text-xl font-bold">Teacher Dashboard</h1>

                  <section>
                    <h2 className="text-lg font-semibold mb-4">
                      My Students ({students.length})
                    </h2>

                    {loading ? (
                      <div>Loading students...</div>
                    ) : error ? (
                      <div className="text-red-600">Error: {error}</div>
                    ) : students.length === 0 ? (
                      <div className="text-gray-600">
                        No students assigned yet. Wait for admin assignment.
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {students.map((student: StudentForRow) => (
                          <StudentRow
                            key={student.uid || student.id}
                            student={student}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </React.Suspense>
            </TabsContent>

            {/* Progress */}
            <TabsContent value="progress">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading progress…</div>}>
                <StudentProgressChart teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Earnings */}
            <TabsContent value="earnings">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading earnings…</div>}>
                <EarningsSummary teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading analytics…</div>}>
                <TeacherStats teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Messages */}
            <TabsContent value="messages">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading messages…</div>}>
                <MessagesView teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Schedule */}
            <TabsContent value="schedule">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading schedule…</div>}>
                <ScheduleView teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Profile */}
            <TabsContent value="profile">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading profile…</div>}>
                <TeacherProfile teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading notifications…</div>}>
                <NotificationsPanel teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Notifications Modal */}
      {showNotifications && (
        <React.Suspense fallback={<div className="text-sm text-gray-600">Loading notifications…</div>}>
          <NotificationsPanel teacherId={teacherId} onClose={() => setShowNotifications(false)} />
        </React.Suspense>
      )}
    </div>
  );
}

function StudentRow({ student }: { student: StudentForRow }) {
  const mastery =
    typeof student.mastery === 'number' ? `${student.mastery}%` : '—';

  return (
    <div className="border rounded-lg p-4 flex justify-between items-start">
      <div>
        <h3 className="font-bold">
          {student.studentName || 'Unnamed student'}
        </h3>
        <p className="text-sm text-gray-600">
          Parent: {student.parentName || '—'}
        </p>
        <p className="text-sm">
          Course: {student.courseName || '—'}
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">{mastery} Mastery</p>
        <p className="text-sm text-gray-600">
          Status: {student.status || '—'}
        </p>
      </div>
    </div>
  );
}
