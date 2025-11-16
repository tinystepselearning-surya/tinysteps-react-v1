import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import ParentSidebar from './components/layout/ParentSidebar';
import { ParentHeader } from './components/layout/ParentHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { useParentFilteredChildren } from '@/hooks/useParentFilteredData';
import { useLocation, useNavigate } from 'react-router-dom';

// Lazy load components for better performance
const ChildrenManagement = lazy(() => import('./components/children/ChildrenManagement'));
const ChildDetailView = lazy(() => import('./components/children/ChildDetailView'));
const UpcomingSessionsView = lazy(() => import('./components/sessions/UpcomingSessionsView'));
const InvoiceManagement = lazy(() => import('./components/payments/InvoiceManagement').then(module => ({ default: module.InvoiceManagement })));
const PaymentHistory = lazy(() => import('./components/payments/PaymentHistory').then(module => ({ default: module.PaymentHistory })));
const SessionTracking = lazy(() => import('../../components/SessionTracking'));
const ProgressReports = lazy(() => import('../../components/ProgressReports'));
const TeacherMessaging = lazy(() => import('../../components/TeacherMessaging'));
const NotificationsCenter = lazy(() => import('../../components/NotificationsCenter'));
const ParentSettings = lazy(() => import('../../components/ParentSettings'));
const ParentProfile = lazy(() => import('../../components/ParentProfile'));
const KidDashboard = lazy(() => import('../kid/KidDashboard'));

const AccessNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-muted/30">
    <Card className="p-8 text-center space-y-2 max-w-md">{children}</Card>
  </div>
);

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const { children, loading, error } = useParentFilteredChildren();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(location.pathname.includes('/parent/kids') ? 'kids' : 'dashboard');

  useEffect(() => {
    if (location.pathname.includes('/parent/kids')) {
      setActiveTab('kids');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    if (tab === 'kids') {
      navigate('/parent/kids', { replace: location.pathname.includes('/parent/kids') });
    } else if (location.pathname.includes('/parent/kids')) {
      navigate('/parent', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">Checking permissions...</Card>
      </div>
    );
  }

  if (!user || user.role !== 'parent') {
    return <AccessNotice>You do not have permission to access the parent dashboard.</AccessNotice>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ParentSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ParentHeader onOpenKidsView={() => handleTabChange('kids')} />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<div className="p-6">Loading...</div>}>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full">
              <div className="border-b bg-white px-6">
                <TabsList className="grid w-full grid-cols-10">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="children">Children</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="kids">Kids Page</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dashboard" className="m-0 h-full">
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
                  <Card>
                    <CardContent className="p-6">
                      <p>Dashboard overview with quick stats and recent activity will be displayed here.</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="children" className="m-0 h-full">
                <div className="space-y-6">
                  <h1>Parent Dashboard</h1>

                  {/* My Children Section */}
                  <section>
                    <h2 className="text-xl font-bold mb-4">My Children ({children.length})</h2>
                    {loading ? (
                      <div>Loading children...</div>
                    ) : error ? (
                      <div className="text-red-600">Error: {error}</div>
                    ) : children.length === 0 ? (
                      <div className="text-gray-600">No children registered yet.</div>
                    ) : (
                      <div className="grid gap-4">
                        {children.map((child) => (
                          <ChildCard key={child.uid} child={child} />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="sessions" className="m-0 h-full">
                <UpcomingSessionsView />
              </TabsContent>

              <TabsContent value="payments" className="m-0 h-full">
                <InvoiceManagement />
              </TabsContent>

              <TabsContent value="kids" className="m-0 h-full p-0">
                <KidDashboard />
              </TabsContent>

              <TabsContent value="reports" className="m-0 h-full">
                <ProgressReports />
              </TabsContent>

              <TabsContent value="messages" className="m-0 h-full">
                <TeacherMessaging />
              </TabsContent>

              <TabsContent value="notifications" className="m-0 h-full">
                <NotificationsCenter />
              </TabsContent>

              <TabsContent value="settings" className="m-0 h-full">
                <ParentSettings />
              </TabsContent>

              <TabsContent value="profile" className="m-0 h-full">
                <ParentProfile />
              </TabsContent>
            </Tabs>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function ChildCard({ child }: { child: any }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="font-bold text-lg">{child.displayName}</h3>
      <p className="text-sm text-gray-600">Age: {child.age} | Grade: {child.grade}</p>
      <p className="text-sm">Active Courses: {child.enrollmentCount}</p>
      <p className="text-sm">Average Mastery: {child.averageMastery}%</p>
      <button className="mt-2 text-blue-600">View Progress</button>
    </div>
  );
}
