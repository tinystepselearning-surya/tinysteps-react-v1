// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../lib/firebaseConfig';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { UserList } from './UserManagement/UserList';
import StudentManagementTab from './StudentManagement/StudentManagementTab';
import RelationshipManagement from './RelationshipManagement/RelationshipManagement';
import CourseManagement from './CourseManagement/CourseManagement';
import EnrollmentsList from './EnrollmentManagement/EnrollmentsList';
import type { AdminStats } from './Analytics';
import AnalyticsDashboard from './AnalyticsDashboard';
import { isSuperUserEmail } from '../../constants/accessControl';
import AdminOverviewCard from '../../components/admin/AdminOverviewCard';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
    if (err && String(err.message).includes('Missing or insufficient permissions')) {
      console.warn(
        'Permission error while fetching admin stats — make sure you are signed into Firebase Auth and have admin role/claims.',
      );
    }

    return {
      totalUsers: 0,
      totalStudents: 0,
      totalCourses: 0,
      activeSessionsToday: 0,
    };
  }
};

const ROLE_SHORTCUTS = [
  { id: 'admin', label: 'Admin', path: '/surya', description: 'Full control panel' },
  { id: 'teacher', label: 'Teacher', path: '/teacher', description: 'Classroom & sessions' },
  { id: 'parent', label: 'Parent', path: '/parent', description: 'Progress & subscriptions' },
  {
    id: 'learningPartner',
    label: 'Learning Partner',
    path: '/learning-partner',
    description: 'Relationship hub',
  },
  { id: 'kid', label: 'Kid', path: '/parent/kids', description: 'Student view via Parent' },
];

const AccessMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
    <Card className="p-8 text-center space-y-2">
      <h2 className="text-2xl font-bold text-red-600">Access Restricted</h2>
      <p>{children}</p>
    </Card>
  </div>
);

// ---------- Groq Live Test Card ----------
const GroqIdeaTester: React.FC = () => {
  const [topic, setTopic] = useState('animals');
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setIdea('');

    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const groqFn = httpsCallable<{ topic: string }, { idea: string }>(
        functions,
        'groqKidIdea',
      );

      const trimmedTopic = topic.trim() || 'animals';
      const result = await groqFn({ topic: trimmedTopic });
      setIdea(result.data.idea);
    } catch (err: any) {
      console.error('groqKidIdea error:', err);
      setError('Unable to generate idea right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4" id="groq-live-test-card">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
          Groq Live Test
        </p>
        <h3 className="text-lg font-semibold">
          Tiny Steps AI – Speaking/Activity Idea
        </h3>
        <p className="text-sm text-muted-foreground">
          Type a topic and let Groq generate a short, kid-friendly speaking or activity idea
          (ages 5–10). This uses the <code className="text-xs">groqKidIdea</code> callable.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex-1 text-sm">
          Topic
          <input
            className="mt-1 w-full rounded border px-2 py-1 text-sm bg-white dark:bg-slate-900"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. rain, pets, birthday, friendship"
          />
        </label>
        <Button
          className="mt-2 sm:mt-6"
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Asking Groq…' : 'Generate Idea'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {idea && (
        <div className="mt-2 rounded border bg-slate-50 dark:bg-slate-900/60 p-3 text-sm whitespace-pre-line">
          {idea}
        </div>
      )}
    </Card>
  );
};

// ---------- Main Admin Dashboard ----------
export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTab, setSelectedTab] = useState('users');

  const isSuperUser = isSuperUserEmail(user?.email);
  const canViewAdmin = isSuperUser || user?.role === 'admin';

  // Debug: confirm this component is being used
  useEffect(() => {
    console.log('✅ AdminDashboard (Groq version) mounted');
  }, []);

  // Sync selected tab with URL path (e.g. /surya/analytics)
  useEffect(() => {
    if (location.pathname.includes('/surya/analytics')) {
      setSelectedTab('analytics');
    }
  }, [location.pathname]);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<AdminStats, Error>({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    enabled: canViewAdmin,
    staleTime: 1000 * 60,
  });

  if (authLoading) {
    return <AccessMessage>Checking your permissions...</AccessMessage>;
  }

  if (!user) {
    return <AccessMessage>Login required to access this page.</AccessMessage>;
  }

  if (!canViewAdmin) {
    return (
      <AccessMessage>
        You do not have permission to access the admin dashboard.
      </AccessMessage>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header user={user} />
      <div className="flex flex-1">
        <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
        <main className="flex-1 p-8">
          {/* BIG BANNER so you can visually confirm this version */}
          <div className="mb-4 rounded bg-yellow-100 border border-yellow-300 p-3 text-sm font-semibold text-yellow-900">
            🔧 ADMIN DASHBOARD – GROQ VERSION (Analytics tab has Groq Live Test)
          </div>

          {isSuperUser && (
            <Card className="p-4 mb-6 border border-dashed border-blue-300 bg-blue-50/40 dark:bg-slate-900/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                    Superuser Mode
                  </p>
                  <p className="text-lg font-bold">Quick role access</p>
                  <p className="text-sm text-muted-foreground">
                    Jump into any dashboard view without switching accounts.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLE_SHORTCUTS.map((shortcut) => (
                    <Button
                      key={shortcut.id}
                      variant={shortcut.id === 'admin' ? 'default' : 'secondary'}
                      onClick={() => navigate(shortcut.path)}
                    >
                      {shortcut.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="students">Student Management</TabsTrigger>
              <TabsTrigger value="enrollments">Enrollment Management</TabsTrigger>
              <TabsTrigger value="relationships">Relationship Management</TabsTrigger>
              <TabsTrigger value="courses">Course Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">User Management</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage users, roles, and credentials.
                  </p>
                </div>
                <UserList />
              </div>
            </TabsContent>

            <TabsContent value="students">
              <StudentManagementTab />
            </TabsContent>

            <TabsContent value="enrollments">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Enrollment Management</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage enrollments, assignments and lifecycle.
                  </p>
                </div>
                <EnrollmentsList />
              </div>
            </TabsContent>

            <TabsContent value="relationships">
              <RelationshipManagement />
            </TabsContent>

            <TabsContent value="courses">
              <CourseManagement />
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Analytics & Admin Overview</h2>
                  <p className="text-sm text-muted-foreground">
                    High-level insights about your Tiny Steps accounts and activity.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <AdminOverviewCard />
                  <AnalyticsDashboard />
                </div>

                {/* Groq real-time test card */}
                <GroqIdeaTester />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          {statsLoading ? (
            <div>Loading stats...</div>
          ) : statsError ? (
            <div className="text-red-500">Error loading stats</div>
          ) : (
            <>
              <div>Total Users: {stats?.totalUsers || 0}</div>
              <div>Total Students: {stats?.totalStudents || 0}</div>
              <div>Total Courses: {stats?.totalCourses || 0}</div>
              <div>Active Sessions Today: {stats?.activeSessionsToday || 0}</div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
