import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { CreateUserForm } from './UserManagement/CreateUserForm';
import { UserList } from './UserManagement/UserList';
import StudentManagementTab from './StudentManagement/StudentManagementTab';
import RelationshipManagement from './RelationshipManagement/RelationshipManagement';
import CourseManagement from './CourseManagement/CourseManagement';
import Analytics from './Analytics';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState('users');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const queryClient = useQueryClient();

  // Check admin role
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p>You do not have permission to access the admin dashboard.</p>
        </Card>
      </div>
    );
  }

  // Fetch stats for status bar
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
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
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header user={user} />
      <div className="flex flex-1">
        <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
        <main className="flex-1 p-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="students">Student Management</TabsTrigger>
              <TabsTrigger value="relationships">Relationship Management</TabsTrigger>
              <TabsTrigger value="courses">Course Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">User Management</h2>
                  <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
                    <DialogTrigger asChild>
                      <Button>Create New User</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                      </DialogHeader>
                      <CreateUserForm
                        onUserCreated={() => {
                          setShowCreateUserModal(false);
                          queryClient.invalidateQueries({ queryKey: ['users'] });
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <UserList />
              </div>
            </TabsContent>
            <TabsContent value="students">
              <StudentManagementTab />
            </TabsContent>
            <TabsContent value="relationships">
              <RelationshipManagement />
            </TabsContent>
            <TabsContent value="courses">
              <CourseManagement />
            </TabsContent>
            <TabsContent value="analytics">
              <Analytics />
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
  // Remove duplicate closing divs and return statement
}