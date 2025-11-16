import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebaseConfig';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { UserList } from './UserManagement/UserList';
import StudentManagementTab from './StudentManagement/StudentManagementTab';
import RelationshipManagement from './RelationshipManagement/RelationshipManagement';
import CourseManagement from './CourseManagement/CourseManagement';
import EnrollmentsList from './EnrollmentManagement/EnrollmentsList';
import Analytics, { AdminStats } from './Analytics';
import AnalyticsDashboard from './AnalyticsDashboard';
import { useLocation } from 'react-router-dom';
import { isSuperUserEmail } from '../../constants/accessControl';

const fetchAdminStats = async (): Promise<AdminStats> => {
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
};

const ROLE_SHORTCUTS = [
  { id: 'admin', label: 'Admin', path: '/surya', description: 'Full control panel' },
  { id: 'teacher', label: 'Teacher', path: '/teacher', description: 'Classroom & sessions' },
  { id: 'parent', label: 'Parent', path: '/parent', description: 'Progress & subscriptions' },
  { id: 'learningPartner', label: 'Learning Partner', path: '/learning-partner', description: 'Relationship hub' },
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

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('users');
  const isSuperUser = isSuperUserEmail(user?.email);
  const canViewAdmin = isSuperUser || user?.role === 'admin';

  const location = useLocation();

  // Sync selected tab with URL path (e.g. /surya/analytics)
  React.useEffect(() => {
    if (location.pathname.includes('/surya/analytics')) setSelectedTab('analytics');
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
    return <AccessMessage>Please sign in to view the admin dashboard.</AccessMessage>;
  }

  if (!canViewAdmin) {
    return <AccessMessage>You do not have permission to access the admin dashboard.</AccessMessage>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header user={user} />
      <div className="flex flex-1">
        <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
        <main className="flex-1 p-8">
          {isSuperUser && (
            <Card className="p-4 mb-6 border border-dashed border-blue-300 bg-blue-50/40 dark:bg-slate-900/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Superuser Mode</p>
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
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      {/* Status Bar */}
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
