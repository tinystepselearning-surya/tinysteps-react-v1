// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, functions } from '../../lib/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@components/hooks/use-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// 🔁 CHANGE START
import UserManagement from './UserManagement/UserManagement';
// 🔁 CHANGE END

import RefreshPublicKbTool from './RefreshPublicKbTool';

import StudentManagementTab from './StudentManagement/StudentManagementTab';
import RelationshipManagement from './RelationshipManagement/RelationshipManagement';
import CourseManagement from './CourseManagement/CourseManagement';
import EnrollmentsList from './EnrollmentManagement/EnrollmentsList';
import LessonLibrary from './LessonLibrary/LessonLibraryAdminPage';
import type { AdminStats } from './Analytics';
import AnalyticsDashboard from './AnalyticsDashboard';
import TeacherPayments from './TeacherPayments';
import ParentPayments from './ParentPayments';
import { isSuperUserEmail } from '../../constants/accessControl';
import AdminOverviewCard from '../../components/admin/AdminOverviewCard';

// ---------- Admin stats fetcher ----------
const fetchAdminStats = async (): Promise<AdminStats> => {
  try {
    const [usersSnap, studentsSnap, coursesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'kids')),
      getDocs(collection(db, 'courses')),
    ]);

    return {
      totalUsers: usersSnap.size,
      totalStudents: studentsSnap.size,
      totalCourses: coursesSnap.size,
      activeSessionsToday: 0,
    };
  } catch (err: any) {
    console.warn('Failed to fetch admin stats:', err);
    return {
      totalUsers: 0,
      totalStudents: 0,
      totalCourses: 0,
      activeSessionsToday: 0,
    };
  }
};

const ROLE_SHORTCUTS = [
  { id: 'admin', label: 'Admin', path: '/surya' },
  { id: 'teacher', label: 'Teacher', path: '/teacher' },
  { id: 'parent', label: 'Parent', path: '/parent' },
  { id: 'learningPartner', label: 'Learning Partner', path: '/learning-partner' },
  { id: 'kid', label: 'Kid', path: '/parent/kids' },
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

// ---------- Main Admin Dashboard ----------
export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTab, setSelectedTab] = useState('users');

  // ✅ FIX: local reload key for EnrollmentsList (required prop)
  const [enrollmentsReloadKey] = useState(0);

  const isSuperUser = isSuperUserEmail(user?.email);
  const canViewAdmin = isSuperUser || user?.role === 'admin';

  useEffect(() => {
    console.log('✅ AdminDashboard mounted');
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/surya/analytics')) {
      setSelectedTab('analytics');
    }
  }, [location.pathname]);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    enabled: canViewAdmin,
  });

  if (authLoading) return <AccessMessage>Checking your permissions...</AccessMessage>;
  if (!user) return <AccessMessage>Login required.</AccessMessage>;
  if (!canViewAdmin) return <AccessMessage>No permission.</AccessMessage>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Header user={user} />
      <div className="flex flex-1 min-w-0">
        <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />

        <main className="flex-1 min-w-0 p-6 md:p-8 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1280px] min-w-0">
          <div className="mb-4 rounded bg-yellow-100 border p-3 text-sm font-semibold">
            🔧 ADMIN DASHBOARD – v2 CLEAN
          </div>

          {isSuperUser && (
            <Card className="p-4 mb-6">
              <div className="flex gap-2 flex-wrap">
                {ROLE_SHORTCUTS.map((r) => (
                  <Button key={r.id} onClick={() => navigate(r.path)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-6 flex flex-wrap h-auto gap-2">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="students">Student Management</TabsTrigger>
              <TabsTrigger value="enrollments">Enrollment Management</TabsTrigger>
              <TabsTrigger value="relationships">Relationship Management</TabsTrigger>
              <TabsTrigger value="courses">Course Management</TabsTrigger>
              <TabsTrigger value="lessons">Lesson Library</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="teacher-payments">Teacher Payments</TabsTrigger>
              <TabsTrigger value="parent-payments">Parent Payments</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="students">
              <StudentManagementTab />
            </TabsContent>

            {/* ✅ FIXED: pass required prop */}
            <TabsContent value="enrollments">
              <EnrollmentsList reloadKey={enrollmentsReloadKey} />
            </TabsContent>

            <TabsContent value="relationships">
              <RelationshipManagement />
            </TabsContent>

            <TabsContent value="courses">
              <CourseManagement />
            </TabsContent>

            <TabsContent value="lessons">
              <LessonLibrary />
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-6">
                <AdminOverviewCard />
                <AnalyticsDashboard />
              </div>
            </TabsContent>

            <TabsContent value="teacher-payments">
              <TeacherPayments />
            </TabsContent>

            <TabsContent value="parent-payments">
              <ParentPayments />
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4">
                <InsightsKillSwitch />
                <RefreshPublicKbTool />
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </main>
      </div>

      <footer className="border-t p-4 text-sm">
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
    </div>
  );
}
