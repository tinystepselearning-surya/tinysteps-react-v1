import React, { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import TeacherSidebar from './TeacherSidebar';
import TeacherHeader from './TeacherHeader';

// Lazy load components for better performance
const TodaySessionsView = lazy(() => import('./TodaySessionsView'));
const UpcomingSessionsView = lazy(() => import('./UpcomingSessionsView'));
const StudentProgressView = lazy(() => import('./StudentProgressView'));
const EarningsSummary = lazy(() => import('./EarningsSummary'));
const StudentsView = lazy(() => import('./StudentsView'));
const MessagesView = lazy(() => import('./MessagesView'));
const PerformanceAnalyticsView = lazy(() => import('./PerformanceAnalyticsView'));
const ScheduleView = lazy(() => import('./ScheduleView'));
const TeacherProfile = lazy(() => import('./TeacherProfile'));
const NotificationsPanel = lazy(() => import('./NotificationsPanel'));

const TeacherDashboard: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <TeacherSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TeacherHeader />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<div className="p-6">Loading...</div>}>
            <Tabs defaultValue="today" className="w-full h-full">
              <div className="border-b bg-white px-6">
                <TabsList className="grid w-full grid-cols-10">
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="earnings">Earnings</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="today" className="m-0 h-full">
                <TodaySessionsView />
              </TabsContent>

              <TabsContent value="upcoming" className="m-0 h-full">
                <UpcomingSessionsView />
              </TabsContent>

              <TabsContent value="students" className="m-0 h-full">
                <StudentsView />
              </TabsContent>

              <TabsContent value="progress" className="m-0 h-full">
                <StudentProgressView />
              </TabsContent>

              <TabsContent value="earnings" className="m-0 h-full">
                <EarningsSummary />
              </TabsContent>

              <TabsContent value="analytics" className="m-0 h-full">
                <PerformanceAnalyticsView />
              </TabsContent>

              <TabsContent value="messages" className="m-0 h-full">
                <MessagesView />
              </TabsContent>

              <TabsContent value="schedule" className="m-0 h-full">
                <ScheduleView />
              </TabsContent>

              <TabsContent value="profile" className="m-0 h-full">
                <TeacherProfile />
              </TabsContent>

              <TabsContent value="notifications" className="m-0 h-full">
                <NotificationsPanel />
              </TabsContent>
            </Tabs>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;