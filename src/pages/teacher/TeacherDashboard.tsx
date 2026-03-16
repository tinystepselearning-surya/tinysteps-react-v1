// src/pages/teacher/TeacherDashboard.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';

import { TeacherHeader } from './components/layout/TeacherHeader';
import { TeacherSidebar } from './components/layout/TeacherSidebar';

import { useAuthStore } from '../../store/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';

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

const DemoAssignmentsView = React.lazy(() =>
  import('./components/demo/DemoAssignmentsView').then((module) => ({
    default: module.DemoAssignmentsView,
  })),
);

const TeacherMyStudentsV2 = React.lazy(() =>
  import('./components/students/TeacherMyStudentsV2').then((module) => ({
    default: module.TeacherMyStudentsV2,
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
  import('./components/analytics/TeacherStats').then((m) => ({ default: m.TeacherStats })),
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

// Lazy-load Lesson Library page for the lessons tab
const LessonLibraryPage = React.lazy(() => import('./LessonLibraryPage'));

// Import FullScreenCanvaViewer
const FullScreenCanvaViewer = React.lazy(() =>
  import('./components/FullScreenCanvaViewer').then((m) => ({ default: m.FullScreenCanvaViewer }))
);

const AccessNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-muted/30">
    <Card className="p-8 text-center space-y-2 max-w-md">{children}</Card>
  </div>
);

const TAB_ITEMS = [
  { id: 'today', label: "Today's Sessions" },
  { id: 'demo-assignments', label: 'Demo Classes' },
  { id: 'lessons', label: 'Lesson Library' },
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
const VALID_TEACHER_TAB_IDS = new Set(TAB_ITEMS.map((item) => item.id));

export default function TeacherDashboard() {
  const { user, isLoading } = useAuthStore();
  const [tab, setTab] = useState<string>('today');
  const location = useLocation();
  const navigate = useNavigate();

  // Detect full-screen viewer params
  const [viewerState, setViewerState] = useState<{
    lessonId: string;
    lessonTitle: string;
    canvaEmbedUrl: string;
    sessionId: string;
  } | null>(null);

  // Allow selecting a tab via `?tab=lessons` (or other tab ids)
  // Also detect viewer query params
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const qTab = params.get('tab');
      if (qTab && VALID_TEACHER_TAB_IDS.has(qTab) && qTab !== tab) {
        console.log('[TeacherDashboard] URL tab param:', qTab);
        setTab(qTab);
      }

      // Check for full-screen viewer params
      const viewLesson = params.get('viewLesson');
      const viewMode = params.get('viewMode');
      const sessionId = params.get('session');
      const lessonTitle = params.get('lessonTitle');
      const canvaUrl = params.get('canvaUrl');

      if (viewMode === 'full' && viewLesson && sessionId && lessonTitle && canvaUrl) {
        setViewerState({
          lessonId: viewLesson,
          lessonTitle: decodeURIComponent(lessonTitle),
          canvaEmbedUrl: decodeURIComponent(canvaUrl),
          sessionId,
        });
      } else {
        setViewerState(null);
      }
    } catch {
      // ignore malformed search
    }
  }, [location.search]);

  // Sync tab changes to URL
  const setTabAndUrl = React.useCallback((nextTab: string) => {
    if (!VALID_TEACHER_TAB_IDS.has(nextTab)) {
      return;
    }
    console.log('[TeacherDashboard] setTabAndUrl:', nextTab);
    setTab(nextTab);
    navigate(`/teacher?tab=${nextTab}`, { replace: true });
  }, [navigate]);

  // Close viewer handler: return to /teacher?tab=lessons
  const handleCloseViewer = React.useCallback(() => {
    console.log('[TeacherDashboard] Closing viewer, returning to lesson library');
    navigate('/teacher?tab=lessons', { replace: true });
  }, [navigate]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const teacherId = user?.uid;
  const activeSectionLabel =
    TAB_ITEMS.find((item) => item.id === tab)?.label ?? 'Overview';
  // Defer subscribing to sessions until the "today" tab is active
  // so heavy listeners don't block other tabs like Lesson Library.
  // Provide a placeholder empty array for header counts when not active.
  const sessions = [];

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

  // Render full-screen viewer if active
  if (viewerState) {
    return (
      <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading viewer...</div>}>
        <FullScreenCanvaViewer
          lessonId={viewerState.lessonId}
          lessonTitle={viewerState.lessonTitle}
          canvaEmbedUrl={viewerState.canvaEmbedUrl}
          sessionId={viewerState.sessionId}
          teacherId={user.uid}
          teacherName={user.displayName || user.email || 'Teacher'}
          onClose={handleCloseViewer}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-6 md:px-8">
      <div className="flex gap-6">
        <TeacherSidebar
          active={tab}
          onSelect={setTabAndUrl}
          todayCount={sessions.length}
          teacherId={teacherId}
        />

        <main className="flex-1 space-y-6">
          <TeacherHeader
            name={user.displayName || user.email || 'Teacher'}
            upcomingCount={sessions.length}
            activeSectionLabel={activeSectionLabel}
            onToggleNotifications={() => setShowNotifications(true)}
            onProfileClick={() => setProfileOpen(true)}
          />
          <Tabs value={tab} onValueChange={setTabAndUrl} className="space-y-4">
            {/* Mobile tabs for when sidebar is hidden */}
            <TabsList className="lg:hidden">
              {TAB_ITEMS.map((item) => (
                <TabsTrigger key={item.id} value={item.id} data-testid={`teacher-tab-${item.id}`}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Today */}
            <TabsContent value="today">
              {tab === 'today' && (
                <React.Suspense fallback={<div className="text-sm text-gray-600">Loading sessions…</div>}>
                  <TodaySessionsView teacherId={teacherId} />
                </React.Suspense>
              )}
            </TabsContent>

            {/* Upcoming */}
            <TabsContent value="upcoming">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading upcoming sessions…</div>}>
                <UpcomingSessionsView teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Demo Classes */}
            <TabsContent value="demo-assignments">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading demo assignments…</div>}>
                <DemoAssignmentsView teacherId={teacherId} />
              </React.Suspense>
            </TabsContent>

            {/* Students */}
            <TabsContent value="students">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading students…</div>}>
                <TeacherMyStudentsV2 teacherId={teacherId} />
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
              {tab === 'analytics' && (
                <React.Suspense fallback={<div className="text-sm text-gray-600">Loading analytics…</div>}>
                  <TeacherStats teacherId={teacherId} />
                </React.Suspense>
              )}
            </TabsContent>

            {/* Messages */}
            <TabsContent value="messages">
              {tab === 'messages' && (
                <React.Suspense fallback={<div className="text-sm text-gray-600">Loading messages…</div>}>
                  <MessagesView teacherId={teacherId} />
                </React.Suspense>
              )}
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
            {/* Lesson Library (tab) */}
            <TabsContent value="lessons">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading lessons…</div>}>
                <LessonLibraryPage />
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

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          <React.Suspense fallback={<div className="text-sm text-gray-600">Loading profile…</div>}>
            <TeacherProfile teacherId={teacherId} />
          </React.Suspense>
        </DialogContent>
      </Dialog>

    </div>
  );
}
