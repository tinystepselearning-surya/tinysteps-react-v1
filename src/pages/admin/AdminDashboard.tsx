// src/pages/admin/AdminDashboard.tsx
import React, { Suspense, startTransition, useState, useEffect } from 'react';
import { Tabs, TabsContent } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import {
  BellDot,
  BookCopy,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  ContactRound,
  CreditCard,
  FileText,
  GraduationCap,
  Handshake,
  LineChart,
  MessageSquareQuote,
  Settings,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, functions } from '../../lib/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@components/hooks/use-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import callFunction from '../../lib/callFunctions';

// 🔁 CHANGE START
import UserManagement from './UserManagement/UserManagement';
// 🔁 CHANGE END

import RefreshPublicKbTool from './RefreshPublicKbTool';

import StudentManagementTab from './StudentManagement/StudentManagementTab';
import RelationshipManagement from './RelationshipManagement/RelationshipManagement';
import CourseManagement from './CourseManagement/CourseManagement';
import EnrollmentsList from './EnrollmentManagement/EnrollmentsList';
import LessonLibrary from './LessonLibrary/LessonLibraryAdminPage';
import ClassRecordingsManagement from './ClassRecordings/ClassRecordingsManagement';
import ClassSamplesManagement from './ClassSamplesManagement';
import TestimonialsManagement from './TestimonialsManagement';
import LeadsInquiriesWorkspace, { type LeadsWorkspaceView } from './LeadsInquiriesWorkspace';
import TodaysNotifications from './TodaysNotifications';
import AnalyticsDashboard from './AnalyticsDashboard';
import TeacherPayments from './TeacherPayments';
import ParentPayments from './ParentPayments';
import ParentWorksheetLibraryManagement from './ParentWorksheetLibraryManagement';
import TeacherScheduleManagement from './TeacherScheduleManagement';
import FinanceReconciliationRunsCard from './FinanceReconciliationRunsCard';
import EnrollmentCanonicalMigrationCard from './EnrollmentCanonicalMigrationCard';
import { isSuperUserEmail } from '../../constants/accessControl';
import AdminOverviewCard from '../../components/admin/AdminOverviewCard';
import MobileTabBar, { type MobileTabBarItem } from '../../components/common/MobileTabBar';
import HolidayCalendar2026 from '../../components/common/HolidayCalendar2026';
import { useAdminStats } from '../../hooks/useAdminStats';

const ROLE_SHORTCUTS = [
  { id: 'admin', label: 'Admin', path: '/surya' },
  { id: 'teacher', label: 'Teacher', path: '/teacher' },
  { id: 'parent', label: 'Parent', path: '/parent' },
  { id: 'learningPartner', label: 'Learning Partner', path: '/learning-partner/dashboard' },
  { id: 'kid', label: 'Kid', path: '/parent/kids' },
];

const ADMIN_MOBILE_TABS: MobileTabBarItem[] = [
  { id: 'users', label: 'Users', icon: UserCog },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'leads', label: 'Leads', icon: ContactRound },
  { id: 'enrollments', label: 'Enroll', icon: ClipboardList },
  { id: 'relationships', label: 'Relations', icon: Handshake },
  { id: 'courses', label: 'Courses', icon: BookCopy },
  { id: 'today-notifications', label: 'Sessions', icon: BellDot },
  { id: 'lessons', label: 'Lessons', icon: BookOpen },
  { id: 'class-recordings', label: 'Recordings', icon: Users },
  { id: 'class-samples', label: 'Samples', icon: Users },
  { id: 'testimonials', label: 'Reviews', icon: MessageSquareQuote },
  { id: 'parent-worksheets', label: 'Worksheets', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'teacher-schedule', label: 'Schedules', icon: CalendarClock },
  { id: 'holidays', label: 'Holidays', icon: CalendarDays },
  { id: 'teacher-payments', label: 'Teacher Pay', icon: Wallet },
  { id: 'parent-payments', label: 'Parent Pay', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AccessMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
    <Card className="p-8 text-center space-y-2">
      <h2 className="text-2xl font-bold text-red-600">Access Restricted</h2>
      <p>{children}</p>
    </Card>
  </div>
);

// ---------- Insights Kill Switch Component ----------
function InsightsKillSwitch() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load current state from Firestore
  const loadConfig = async () => {
    try {
      const configRef = doc(db, 'config', 'insights');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const data = configSnap.data();
        setEnabled(data?.enabled ?? true);
        
        // Format last updated time
        if (data?.lastRunAt) {
          const timestamp = data.lastRunAt.toDate?.() || new Date(data.lastRunAt.seconds * 1000);
          const formatted = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }).format(timestamp);
          setLastUpdated(`${formatted} IST (${data?.lastRunLabel || 'unknown'})`);
        }
      } else {
        // Doc doesn't exist, treat as enabled (server will auto-create)
        setEnabled(true);
      }
    } catch (err: any) {
      console.error('[InsightsKillSwitch] Failed to load config:', err);
      setError('Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleToggle = async () => {
    const nextEnabled = !enabled;
    setSaving(true);
    setError(null);

    try {
      const setInsightsEnabled = httpsCallable<{ enabled: boolean }, { ok: boolean; enabled: boolean }>(
        functions,
        'setInsightsEnabled'
      );

      const result = await setInsightsEnabled({ enabled: nextEnabled });

      if (result.data.ok) {
        setEnabled(nextEnabled);
        toast({
          title: nextEnabled ? 'Insights Enabled' : 'Insights Disabled',
          description: nextEnabled
            ? 'Game session summaries will now update.'
            : 'Game session summaries will NOT update.',
          variant: 'default',
        });
      }
    } catch (err: any) {
      console.error('[InsightsKillSwitch] Failed to toggle:', err);
      setError(err.message || 'Failed to update');
      toast({
        title: 'Error',
        description: err.message || 'Failed to update kill switch',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setError(null);

    try {
      const runInsightsRollupNow = httpsCallable<
        Record<string, never>,
        { ok: boolean; message?: string; kidsUpdated?: number; sessionsProcessed?: number }
      >(functions, 'runInsightsRollupNow');

      const result = await runInsightsRollupNow({});

      if (result.data.ok) {
        toast({
          title: 'Insights Updated',
          description: `Updated ${result.data.kidsUpdated || 0} kids, processed ${result.data.sessionsProcessed || 0} sessions.`,
          variant: 'default',
        });
        
        // Reload config to show new last updated time
        await loadConfig();
      } else {
        toast({
          title: 'Update Not Run',
          description: result.data.message || 'Insights are disabled',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('[InsightsKillSwitch] Failed to run rollup:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to run insights update',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Insights Kill Switch</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Control whether game session summaries are updated in real-time.
          </p>
        </div>

        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <p className="font-medium">{enabled ? '✅ Enabled' : '❌ Disabled'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {enabled
                ? 'Game sessions will update kids/{kidId}.summary'
                : 'Game sessions will NOT update summaries (trigger skipped)'}
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            <Button
              onClick={handleRunNow}
              disabled={running || saving}
              variant="outline"
              size="sm"
            >
              {running ? 'Running...' : 'Run Update Now'}
            </Button>
            
            <Button
              onClick={handleToggle}
              disabled={saving || running}
              variant={enabled ? 'destructive' : 'default'}
            >
              {saving ? 'Saving...' : enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• When disabled, the Cloud Function trigger <code>onGameSessionCreate</code> will skip.</p>
          <p>• Config stored at: <code>config/insights.enabled</code></p>
          <p>• Changes take effect immediately for all new game sessions.</p>
          <p>• "Run Update Now" triggers batch rollup manually regardless of schedule.</p>
        </div>
      </div>
    </Card>
  );
}

function MessagingBackendTestCard() {
  const [kidId, setKidId] = useState('');
  const [threadId, setThreadId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const normalizeError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null) {
      const maybeMessage = (err as { message?: unknown }).message;
      if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
        return maybeMessage;
      }
    }
    return 'Request failed. Please check logs and try again.';
  };

  const handleCreateOrSync = async () => {
    const trimmedKidId = kidId.trim();
    if (!trimmedKidId) {
      setError('kidId is required.');
      setResult(null);
      return;
    }

    setIsSyncing(true);
    setError(null);
    setResult(null);

    try {
      const response = await callFunction<{ threadId: string }, { kidId: string }>(
        'createOrSyncMessageThread',
        { kidId: trimmedKidId }
      );
      setThreadId(response.threadId || '');
      setResult(`Thread ready: ${response.threadId}`);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const resolvedThreadId = threadId.trim();
    const resolvedText = (textOverride ?? messageText).trim();

    if (!resolvedThreadId) {
      setError('threadId is required. Create/Sync thread first.');
      setResult(null);
      return;
    }

    if (!resolvedText) {
      setError('Message text is required.');
      setResult(null);
      return;
    }

    setIsSending(true);
    setError(null);
    setResult(null);

    try {
      const response = await callFunction<{ messageId: string }, { threadId: string; text: string }>(
        'sendMessage',
        {
          threadId: resolvedThreadId,
          text: resolvedText,
        }
      );
      setResult(`Message sent: ${response.messageId}`);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleSyncAllActiveStudentThreads = async () => {
    setIsBulkSyncing(true);
    setError(null);
    setResult(null);

    try {
      const response = await callFunction<
        { scanned: number; synced: number; skipped: number; errors?: string[] },
        Record<string, never>
      >('syncMessageThreadsForActiveStudents', {});
      const scanned = Number(response?.scanned || 0);
      const synced = Number(response?.synced || 0);
      const skipped = Number(response?.skipped || 0);
      const hasErrors = Array.isArray(response?.errors) && response.errors.length > 0;
      setResult(
        `Synced ${synced} threads, skipped ${skipped}. Scanned ${scanned} active students.${hasErrors ? ' Check function logs for details.' : ''}`
      );
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsBulkSyncing(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Messaging Backend Test (Admin)</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Internal callable test only. Uses Cloud Functions, no direct Firestore writes.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Kid ID</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={kidId}
            onChange={(event) => setKidId(event.target.value)}
            placeholder="Enter kidId"
          />
          <Button
            type="button"
            onClick={handleCreateOrSync}
            disabled={isSyncing}
            className="sm:w-auto"
          >
            {isSyncing ? 'Syncing...' : 'Create/Sync Thread'}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-800">Bulk sync</p>
        <p className="mt-1 text-xs text-slate-600">
          Create or refresh conversation threads for all active students.
        </p>
        <Button
          type="button"
          className="mt-2"
          variant="outline"
          onClick={handleSyncAllActiveStudentThreads}
          disabled={isBulkSyncing}
        >
          {isBulkSyncing ? 'Syncing all...' : 'Sync All Active Student Threads'}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Thread ID</label>
        <Input
          value={threadId}
          onChange={(event) => setThreadId(event.target.value)}
          placeholder="student_<kidId>"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Test Message</label>
        <Textarea
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder="Type test message"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={isSending}
        >
          {isSending ? 'Sending...' : 'Send Test Message'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSendMessage('Please call me at +91 98765 43210')}
          disabled={isSending}
        >
          Send Phone Number Test Message
        </Button>
      </div>

      {result && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {result}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </Card>
  );
}

// ---------- Main Admin Dashboard ----------
export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTab, setSelectedTab] = useState('users');
  const [leadsWorkspaceView, setLeadsWorkspaceView] = useState<LeadsWorkspaceView>('leads');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ FIX: local reload key for EnrollmentsList (required prop)
  const [enrollmentsReloadKey] = useState(0);

  const isSuperUser = isSuperUserEmail(user?.email);
  const canViewAdmin = isSuperUser || user?.role === 'admin';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    const validTabs = new Set([
      'users',
      'students',
      'leads',
      'enrollments',
      'relationships',
      'courses',
      'today-notifications',
      'lessons',
      'class-recordings',
      'class-samples',
      'testimonials',
      'parent-worksheets',
      'analytics',
      'teacher-schedule',
      'holidays',
      'teacher-payments',
      'parent-payments',
      'settings',
    ]);

    if (tabFromUrl === 'leads') {
      setLeadsWorkspaceView(params.get('leadView') === 'demos' ? 'demos' : 'leads');
    } else {
      setLeadsWorkspaceView('leads');
    }

    if (tabFromUrl && validTabs.has(tabFromUrl)) {
      setSelectedTab(tabFromUrl);
      return;
    }

    if (location.pathname.includes('/surya/analytics')) {
      setSelectedTab('analytics');
    }
  }, [location.pathname, location.search, navigate]);

  const handleLeadsWorkspaceViewChange = (nextView: LeadsWorkspaceView) => {
    startTransition(() => {
      setLeadsWorkspaceView(nextView);
      const params = new URLSearchParams(location.search);
      params.set('tab', 'leads');
      if (nextView === 'demos') params.set('leadView', 'demos');
      else params.delete('leadView');
      navigate(`/surya?${params.toString()}`, { replace: true });
    });
  };

  const handleTabChange = (nextTab: string) => {
    startTransition(() => {
      setSelectedTab(nextTab);
    });
  };

  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats(canViewAdmin);

  if (authLoading) return <AccessMessage>Checking your permissions...</AccessMessage>;
  if (!user) return <AccessMessage>Login required.</AccessMessage>;
  if (!canViewAdmin) return <AccessMessage>No permission.</AccessMessage>;

  return (
    <div className="mobile-app-scroll h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-gray-900">
      <Header onOpenMenu={() => setMobileMenuOpen(true)} />

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="left-0 top-0 h-screen w-[85vw] max-w-[320px] translate-x-0 translate-y-0 rounded-none border-r border-slate-200 p-0 sm:rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Admin menu</DialogTitle>
            <DialogDescription>Navigate between admin sections</DialogDescription>
          </DialogHeader>
          <Sidebar
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            onNavigate={() => setMobileMenuOpen(false)}
            className="w-full h-full overflow-y-auto"
          />
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 min-w-0 min-h-0 pb-24 lg:pb-0">
        <Sidebar
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          className="hidden h-[calc(100vh-57px)] overflow-y-auto lg:sticky lg:top-[57px] lg:block"
        />

        <main className="flex min-h-0 flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="mx-auto w-full max-w-[1280px] min-w-0">
          <Card className="mb-4 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Internal messenger conversations
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => navigate('/messages')}
              >
                <MessageSquareQuote className="h-4 w-4" />
                Messages
              </Button>
            </div>
          </Card>

          {isSuperUser && (
            <Card className="mb-4 p-3">
              <div className="flex gap-2 flex-wrap">
                {ROLE_SHORTCUTS.map((r) => (
                  <Button key={r.id} size="sm" onClick={() => navigate(r.path)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <Tabs value={selectedTab} onValueChange={handleTabChange}>
            <TabsContent value="users" className="mt-0">
              <UserManagement />
            </TabsContent>

            <TabsContent value="students" className="mt-0">
              <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading students...</div>}>
                <StudentManagementTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="leads" className="mt-0">
              <LeadsInquiriesWorkspace
                view={leadsWorkspaceView}
                onViewChange={handleLeadsWorkspaceViewChange}
              />
            </TabsContent>

            {/* ✅ FIXED: pass required prop */}
            <TabsContent value="enrollments" className="mt-0">
              <EnrollmentsList reloadKey={enrollmentsReloadKey} />
            </TabsContent>

            <TabsContent value="relationships" className="mt-0">
              <RelationshipManagement />
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <CourseManagement />
            </TabsContent>

            <TabsContent value="today-notifications" className="mt-0">
              <TodaysNotifications />
            </TabsContent>

            <TabsContent value="lessons" className="mt-0">
              <LessonLibrary />
            </TabsContent>

            <TabsContent value="class-recordings" className="mt-0">
              <ClassRecordingsManagement />
            </TabsContent>

            <TabsContent value="class-samples" className="mt-0">
              <ClassSamplesManagement />
            </TabsContent>

            <TabsContent value="testimonials" className="mt-0">
              <TestimonialsManagement />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="space-y-4">
                <AdminOverviewCard />
                <AnalyticsDashboard />
              </div>
            </TabsContent>

            <TabsContent value="teacher-schedule" className="mt-0">
              <TeacherScheduleManagement />
            </TabsContent>

            <TabsContent value="holidays" className="mt-0">
              <HolidayCalendar2026 />
            </TabsContent>

            <TabsContent value="teacher-payments" className="mt-0">
              <TeacherPayments />
            </TabsContent>

            <TabsContent value="parent-payments" className="mt-0">
              <ParentPayments />
            </TabsContent>

            <TabsContent value="parent-worksheets" className="mt-0">
              <ParentWorksheetLibraryManagement />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="space-y-4">
                <MessagingBackendTestCard />
                <InsightsKillSwitch />
                <FinanceReconciliationRunsCard />
                <EnrollmentCanonicalMigrationCard />
                <RefreshPublicKbTool />
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </main>
      </div>

      <footer className="hidden border-t p-4 text-sm sm:block">
        {statsLoading ? (
          'Loading…'
        ) : statsError ? (
          'Error'
        ) : (
          <>
            Users: {stats?.totalUsers} | Students: {stats?.totalStudents} | Courses:{' '}
            {stats?.totalCourses}
          </>
        )}
      </footer>

      <MobileTabBar
        items={ADMIN_MOBILE_TABS}
        activeId={selectedTab}
        onSelect={(nextTab) => {
          startTransition(() => {
            setSelectedTab(nextTab);
            navigate(`/surya?tab=${nextTab}`, { replace: true });
          });
        }}
      />
    </div>
  );
}
