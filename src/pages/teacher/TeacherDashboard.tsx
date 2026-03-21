// src/pages/teacher/TeacherDashboard.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { CalendarCheck, CalendarClock, ClipboardList, Users, Wallet } from 'lucide-react';

import { TeacherHeader } from './components/layout/TeacherHeader';
import { TeacherSidebar } from './components/layout/TeacherSidebar';
import MobileTabBar, { type MobileTabBarItem } from '../../components/common/MobileTabBar';
import HolidayCalendar2026 from '../../components/common/HolidayCalendar2026';

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

const EarningsSummary = React.lazy(() =>
  import('./components/earnings/EarningsSummary').then((module) => ({
    default: module.EarningsSummary,
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
  { id: 'earnings', label: 'Earnings' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'holidays', label: 'Holiday Calendar' },
  { id: 'profile', label: 'Profile' },
];
const VALID_TEACHER_TAB_IDS = new Set(TAB_ITEMS.map((item) => item.id));

const TEACHER_MOBILE_TABS: MobileTabBarItem[] = [
  { id: 'today', label: 'Today', icon: CalendarCheck },
  { id: 'demo-assignments', label: 'Demos', icon: ClipboardList },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
];

export default function TeacherDashboard() {
  const { user, isLoading } = useAuthStore();
  const [tab, setTab] = useState<string>('today');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Detect full-screen viewer params
  const [viewerState, setViewerState] = useState<{
    accessId: string;
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
      const viewMode = params.get('viewMode');
      const accessId = params.get('accessId');
      if (viewMode === 'full' && accessId) {
        setViewerState({
          accessId,
        });
      } else {
        setViewerState(null);
      }
    } catch {
      // ignore malformed search
    }
  }, [location.search, tab]);

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
          accessId={viewerState.accessId}
          teacherId={user.uid}
          teacherName={user.displayName || user.email || 'Teacher'}
          onClose={handleCloseViewer}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="mobile-app-scroll min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 px-3 py-4 sm:px-4 sm:py-6 md:px-8 lg:bg-slate-50/60">
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="left-0 top-0 h-screen w-[85vw] max-w-[340px] translate-x-0 translate-y-0 rounded-none border-r border-slate-200 p-4 sm:rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Teacher menu</DialogTitle>
          </DialogHeader>
          <TeacherSidebar
            active={tab}
            onSelect={(nextTab) => {
              setTabAndUrl(nextTab);
              setMobileMenuOpen(false);
            }}
            todayCount={sessions.length}
            teacherId={teacherId}
          />
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-6 pb-24 lg:flex-row lg:pb-0">
        <TeacherSidebar
          active={tab}
          onSelect={setTabAndUrl}
          todayCount={sessions.length}
          teacherId={teacherId}
          className="hidden lg:block"
        />

        <main className="flex-1 space-y-6">
          <div className="sticky top-2 z-30 bg-slate-50/80 backdrop-blur lg:static lg:bg-transparent">
            <TeacherHeader
              name={user.displayName || user.email || 'Teacher'}
              upcomingCount={sessions.length}
              activeSectionLabel={activeSectionLabel}
              footerContent={
                tab === 'lessons' ? (
                  <div id="teacher-lessons-controls-slot" className="w-full" />
                ) : null
              }
              onProfileClick={() => setProfileOpen(true)}
              onOpenMenu={() => setMobileMenuOpen(true)}
            />
          </div>
          <Tabs value={tab} onValueChange={setTabAndUrl} className="space-y-4">
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

            {/* Earnings */}
            <TabsContent value="earnings">
              <React.Suspense fallback={<div className="text-sm text-gray-600">Loading earnings…</div>}>
                <EarningsSummary teacherId={teacherId} />
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
            <TabsContent value="holidays">
              <HolidayCalendar2026 />
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

      <MobileTabBar
        items={TEACHER_MOBILE_TABS}
        activeId={tab}
        onSelect={setTabAndUrl}
      />

    </div>
  );
}
