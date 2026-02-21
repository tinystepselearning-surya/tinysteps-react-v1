// src/pages/teacher/TeacherDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';

import { TeacherHeader } from './components/layout/TeacherHeader';
import { TeacherSidebar } from './components/layout/TeacherSidebar';

import { useAuthStore } from '../../store/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeacherSessions } from './hooks/useTeacherSessions';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

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

type StudentProgressSummary = {
  courseId?: string;
  courseName?: string;
  completedTopics?: number;
  totalTopics?: number;
  lastTopic?: string;
  lastRemark?: string;
};

type CurriculumTopic = {
  id: string;
  courseId?: string;
  lesson?: string;
  label?: string;
};

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
      if (qTab && qTab !== tab) {
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

  const teacherId = user?.uid;
  // Defer subscribing to sessions until the "today" tab is active
  // so heavy listeners don't block other tabs like Lesson Library.
  // Provide a placeholder empty array for header counts when not active.
  const sessions = [];
  const { students, loading, error } = useTeacherFilteredStudents();
  const [progressByKidId, setProgressByKidId] = useState<Record<string, StudentProgressSummary>>({});
  const [progressLoading, setProgressLoading] = useState(false);
  const [topicsByCourseId, setTopicsByCourseId] = useState<Record<string, CurriculumTopic[]>>({});
  const [topicsModalOpen, setTopicsModalOpen] = useState(false);
  const [selectedStudentForTopics, setSelectedStudentForTopics] = useState<{
    kidId: string;
    name: string;
    courseId?: string;
    courseName?: string;
  } | null>(null);
  const [topicStatuses, setTopicStatuses] = useState<Record<string, string>>({});
  const [topicStatusesLoading, setTopicStatusesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSummaries = async () => {
      if (!teacherId || students.length === 0) {
        setProgressByKidId({});
        setProgressLoading(false);
        return;
      }

      setProgressLoading(true);
      try {
        const topicsSnap = await getDoc(doc(db, 'config', 'curriculumTopics'));
        const topicItems = topicsSnap.exists() && Array.isArray((topicsSnap.data() as any)?.topics)
          ? (topicsSnap.data() as any).topics
          : [];
        const totalsByCourseId = new Map<string, number>();
        const byCourse: Record<string, CurriculumTopic[]> = {};
        topicItems.forEach((t: any) => {
          const courseId = String(t?.courseId || '').trim();
          if (!courseId) return;
          totalsByCourseId.set(courseId, (totalsByCourseId.get(courseId) || 0) + 1);
          if (!byCourse[courseId]) byCourse[courseId] = [];
          byCourse[courseId].push({
            id: String(t?.id ?? ''),
            courseId,
            lesson: t?.lesson ? String(t.lesson) : undefined,
            label: String(t?.label ?? t?.topicName ?? t?.name ?? ''),
          });
        });

        const enrollmentsSnap = await getDocs(
          query(collection(db, 'enrollments'), where('teacherId', '==', teacherId))
        );
        const enrollments = enrollmentsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        const enrollmentByKidId = new Map<string, any>();
        enrollments.forEach((enr) => {
          const kidId =
            String(enr.kidId || enr.studentId || (Array.isArray(enr.kidIds) ? enr.kidIds[0] : '') || '');
          if (!kidId) return;
          const current = enrollmentByKidId.get(kidId);
          const nextTime = enr.createdAt?.toMillis?.() ?? 0;
          const currentTime = current?.createdAt?.toMillis?.() ?? 0;
          if (!current || nextTime >= currentTime) {
            enrollmentByKidId.set(kidId, enr);
          }
        });

        const summaries: Record<string, StudentProgressSummary> = {};
        await Promise.all(
          students.map(async (student) => {
            const kidId = String((student as any).uid || (student as any).id || '');
            if (!kidId) return;

            const enrollment = enrollmentByKidId.get(kidId);
            const courseId = enrollment?.courseId ? String(enrollment.courseId) : '';
            const courseName =
              enrollment?.courseName ||
              enrollment?.courseTitle ||
              enrollment?.course?.title ||
              enrollment?.course?.name ||
              '';

            let completedTopics = 0;
            let lastTopic = '—';
            let lastRemark = '—';

            if (courseId) {
              const curSnap = await getDocs(
                query(
                  collection(db, 'students', kidId, 'curriculum'),
                  where('courseId', '==', courseId)
                )
              );
              curSnap.forEach((docSnap) => {
                const data = docSnap.data() as any;
                if (String(data?.status || '') === 'completed') completedTopics += 1;
              });

              const progSnap = await getDocs(
                query(
                  collection(db, 'students', kidId, 'progress'),
                  where('courseId', '==', courseId)
                )
              );
              let latest: any = null;
              progSnap.forEach((docSnap) => {
                const data = docSnap.data() as any;
                const ts = data?.updatedAt?.toMillis?.() ?? 0;
                const best = latest?.updatedAt?.toMillis?.() ?? 0;
                if (ts >= best) latest = data;
              });
              if (latest) {
                lastTopic = latest.topicName || '—';
                lastRemark = latest.teacherRemark || '—';
              }
            }

            summaries[kidId] = {
              courseId: courseId || undefined,
              courseName: courseName || undefined,
              completedTopics,
              totalTopics: courseId ? totalsByCourseId.get(courseId) || 0 : 0,
              lastTopic,
              lastRemark,
            };
          })
        );

        if (!cancelled) {
          setProgressByKidId(summaries);
          setTopicsByCourseId(byCourse);
        }
      } catch (err) {
        console.error('[TeacherDashboard] load progress summaries failed', err);
        if (!cancelled) setProgressByKidId({});
      } finally {
        if (!cancelled) setProgressLoading(false);
      }
    };

    loadSummaries();

    return () => {
      cancelled = true;
    };
  }, [teacherId, students]);

  useEffect(() => {
    let cancelled = false;

    const loadTopicStatuses = async () => {
      if (!topicsModalOpen || !selectedStudentForTopics?.kidId || !selectedStudentForTopics?.courseId) {
        setTopicStatuses({});
        setTopicStatusesLoading(false);
        return;
      }
      setTopicStatusesLoading(true);
      try {
        const snap = await getDocs(
          query(
            collection(db, 'students', selectedStudentForTopics.kidId, 'curriculum'),
            where('courseId', '==', selectedStudentForTopics.courseId)
          )
        );
        const map: Record<string, string> = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          map[docSnap.id] = String(data?.status || '').toLowerCase();
        });
        if (!cancelled) setTopicStatuses(map);
      } catch (err) {
        console.error('[TeacherDashboard] load topic statuses failed', err);
        if (!cancelled) setTopicStatuses({});
      } finally {
        if (!cancelled) setTopicStatusesLoading(false);
      }
    };

    loadTopicStatuses();

    return () => {
      cancelled = true;
    };
  }, [topicsModalOpen, selectedStudentForTopics?.kidId, selectedStudentForTopics?.courseId]);

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
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      {/* Diagnostic banners removed for production cleanliness */}
      <TeacherHeader
        name={user.displayName || user.email || 'Teacher'}
        upcomingCount={sessions.length}
        onToggleNotifications={() => setShowNotifications(true)}
      />

      <div className="flex gap-6">
        <TeacherSidebar
          active={tab}
          onSelect={setTabAndUrl}
          todayCount={sessions.length}
          teacherId={teacherId}
        />

        <main className="flex-1 space-y-6">
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
                            progressSummary={progressByKidId[String((student as any).uid || (student as any).id || '')]}
                            progressLoading={progressLoading}
                            onOpenTopics={(payload) => {
                              setSelectedStudentForTopics(payload);
                              setTopicsModalOpen(true);
                            }}
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

      <Dialog
        open={topicsModalOpen}
        onOpenChange={(open) => {
          setTopicsModalOpen(open);
          if (!open) setSelectedStudentForTopics(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Topics for {selectedStudentForTopics?.name || 'Student'}
            </DialogTitle>
            <DialogDescription>
              {selectedStudentForTopics?.courseName
                ? `Course: ${selectedStudentForTopics.courseName}`
                : 'No course assigned yet.'}
            </DialogDescription>
          </DialogHeader>

          {!selectedStudentForTopics?.courseId ? (
            <div className="text-sm text-gray-600">
              No course is linked to this student. Ask admin to assign a course.
            </div>
          ) : topicStatusesLoading ? (
            <div className="text-sm text-gray-600">Loading topics…</div>
          ) : (
            (() => {
              const allTopics =
                topicsByCourseId[selectedStudentForTopics.courseId || ''] || [];
              const completed = allTopics.filter(
                (t) => (topicStatuses[t.id] || '') === 'completed'
              );
              const inProgress = allTopics.filter(
                (t) => (topicStatuses[t.id] || '') === 'in_progress'
              );
              const pending = allTopics.filter(
                (t) => !topicStatuses[t.id] || topicStatuses[t.id] === 'pending'
              );

              if (allTopics.length === 0) {
                return (
                  <div className="text-sm text-gray-600">
                    No curriculum topics found for this course.
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <div className="text-xs text-gray-500">
                    Completed: {completed.length} · In progress: {inProgress.length} · Pending: {pending.length}
                  </div>
                  <TopicsStatusList
                    title="Completed"
                    topics={completed}
                    statusLabel="Completed"
                    badgeClass="bg-green-100 text-green-800 border border-green-200"
                  />
                  <TopicsStatusList
                    title="In Progress"
                    topics={inProgress}
                    statusLabel="In progress"
                    badgeClass="bg-amber-100 text-amber-800 border border-amber-200"
                  />
                  <TopicsStatusList
                    title="Pending"
                    topics={pending}
                    statusLabel="Pending"
                    badgeClass="bg-gray-100 text-gray-700 border border-gray-200"
                  />
                </div>
              );
            })()
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentRow({
  student,
  progressSummary,
  progressLoading,
  onOpenTopics,
}: {
  student: StudentForRow;
  progressSummary?: StudentProgressSummary;
  progressLoading?: boolean;
  onOpenTopics: (payload: { kidId: string; name: string; courseId?: string; courseName?: string }) => void;
}) {
  const mastery =
    typeof student.mastery === 'number' ? `${student.mastery}%` : '—';
  const completed = progressSummary?.completedTopics ?? 0;
  const total = progressSummary?.totalTopics ?? 0;
  const kidId = String((student as any).uid || (student as any).id || '');
  const name = student.studentName || student.fullName || 'Unnamed student';

  return (
    <button
      type="button"
      className="w-full text-left border rounded-lg p-4 flex justify-between items-start hover:bg-muted/40 transition-colors"
      onClick={() =>
        onOpenTopics({
          kidId,
          name,
          courseId: progressSummary?.courseId,
          courseName: progressSummary?.courseName || student.courseName,
        })
      }
    >
      <div>
        <h3 className="font-bold">
          {name}
        </h3>
        <p className="text-sm text-gray-600">
          Parent: {student.parentName || '—'}
        </p>
        <p className="text-sm">
          Course: {progressSummary?.courseName || student.courseName || '—'}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {progressLoading ? 'Loading progress…' : `Completed topics: ${completed} / ${total || '—'}`}
        </p>
        {!progressLoading && (
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {progressSummary?.lastTopic || '—'}
            {progressSummary?.lastRemark && progressSummary?.lastRemark !== '—'
              ? ` • ${progressSummary.lastRemark}`
              : ''}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">{mastery} Mastery</p>
        <p className="text-sm text-gray-600">
          Status: {student.status || '—'}
        </p>
      </div>
    </button>
  );
}

function TopicsStatusList({
  title,
  topics,
  statusLabel,
  badgeClass,
}: {
  title: string;
  topics: CurriculumTopic[];
  statusLabel: string;
  badgeClass: string;
}) {
  if (topics.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="space-y-2">
        {topics.map((topic) => (
          <div key={topic.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
            <div className="text-sm text-gray-800">
              {topic.lesson ? `${topic.lesson} — ${topic.label || topic.id}` : (topic.label || topic.id)}
            </div>
            <Badge className={badgeClass}>{statusLabel}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
