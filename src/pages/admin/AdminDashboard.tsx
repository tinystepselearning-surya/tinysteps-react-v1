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

// 🔁 CHANGE START
import UserManagement from './UserManagement/UserManagement';
// 🔁 CHANGE END

import StudentManagementTab from './StudentManagement/StudentManagementTab';
import RelationshipManagement from './RelationshipManagement/RelationshipManagement';
import CourseManagement from './CourseManagement/CourseManagement';
import EnrollmentsList from './EnrollmentManagement/EnrollmentsList';
import type { AdminStats } from './Analytics';
import AnalyticsDashboard from './AnalyticsDashboard';
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

// ---------- Main Admin Dashboard ----------
export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTab, setSelectedTab] = useState('users');

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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header user={user} />
      <div className="flex flex-1">
        <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />

        <main className="flex-1 p-8">
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
            <TabsList className="mb-6">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="students">Student Management</TabsTrigger>
              <TabsTrigger value="enrollments">Enrollment Management</TabsTrigger>
              <TabsTrigger value="relationships">Relationship Management</TabsTrigger>
              <TabsTrigger value="courses">Course Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* ✅ FIXED */}
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="students">
              <StudentManagementTab />
            </TabsContent>

            <TabsContent value="enrollments">
              <EnrollmentsList />
            </TabsContent>

            <TabsContent value="relationships">
              <RelationshipManagement />
            </TabsContent>

            <TabsContent value="courses">
              <CourseManagement />
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid gap-6 lg:grid-cols-2">
                <AdminOverviewCard />
                <AnalyticsDashboard />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <footer className="border-t p-4 text-sm">
        {statsLoading ? 'Loading…' : statsError ? 'Error' : (
          <>
            Users: {stats?.totalUsers} | Students: {stats?.totalStudents} | Courses:{' '}
            {stats?.totalCourses}
          </>
        )}
      </footer>
    </div>
  );
}
