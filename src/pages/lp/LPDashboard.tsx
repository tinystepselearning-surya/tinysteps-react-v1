import React, { Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { useAuthStore } from '../../store/useAuthStore';
import { LPHeader } from './components/layout/LPHeader';
import { LPSidebar } from './components/layout/LPSidebar';
import HolidayCalendar2026 from '../../components/common/HolidayCalendar2026';
import MobileTabBar, { type MobileTabBarItem } from '../../components/common/MobileTabBar';
import { BarChart2, Users, GraduationCap, HeadphonesIcon, TrendingUp } from 'lucide-react';
const LPStats = React.lazy(() => import('./components/overview/LPStats'));
const ParentsList = React.lazy(() => import('./components/parents/ParentsList'));
const TeachersList = React.lazy(() => import('./components/teachers/TeachersList'));
const TicketsList = React.lazy(() => import('./components/tickets/TicketsList'));
const PerformanceMetrics = React.lazy(() => import('./components/performance/PerformanceMetrics'));
const RegionalData = React.lazy(() => import('./components/region/RegionalData'));
import { useLPFilteredTeachers, useLPFilteredParents } from '@/hooks/useLPFilteredData';

const LP_MOBILE_TABS: MobileTabBarItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'parents', label: 'Parents', icon: Users },
  { id: 'teachers', label: 'Teachers', icon: GraduationCap },
  { id: 'tickets', label: 'Tickets', icon: HeadphonesIcon },
  { id: 'performance', label: 'Stats', icon: TrendingUp },
];

const AccessNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-muted/30">
    <Card className="p-8 text-center space-y-2 max-w-md">{children}</Card>
  </div>
);

const TAB_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'parents', label: 'Parents' },
  { id: 'teachers', label: 'Teachers' },
  { id: 'tickets', label: 'Support Tickets' },
  { id: 'performance', label: 'Performance' },
  { id: 'region', label: 'Regional Data' },
  { id: 'holidays', label: 'Holiday Calendar' },
];

export default function LPDashboard() {
  const { user, isLoading } = useAuthStore();
  const [tab, setTab] = useState('overview');
  const lpId = user?.uid;

  const { teachers, loading: teachersLoading, error: teachersError } = useLPFilteredTeachers();
  const { parents, loading: parentsLoading, error: parentsError } = useLPFilteredParents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">Checking permissions...</Card>
      </div>
    );
  }

  if (!user || (user.role !== 'learningPartner' && user.role !== 'admin')) {
    return <AccessNotice>You do not have permission to access the Learning Partner dashboard.</AccessNotice>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 pb-28 md:p-8 lg:pb-8">
      <LPHeader name={user.displayName || user.email} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <LPSidebar active={tab} onSelect={setTab} />
        <main className="flex-1 min-w-0 space-y-6">
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="lg:hidden">
              {TAB_ITEMS.map((item) => (
                <TabsTrigger key={item.id} value={item.id}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading overview…</div>}>
                <LPStats lpId={lpId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="parents">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading parents…</div>}>
                <ParentsList lpId={lpId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="teachers">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading teachers…</div>}>
                <TeachersList lpId={lpId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="tickets">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading tickets…</div>}>
                <TicketsList lpId={lpId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="performance">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading performance…</div>}>
                <PerformanceMetrics lpId={lpId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="region">
              <Suspense fallback={<div className="text-sm text-gray-600">Loading regional data…</div>}>
                <RegionalData lpId={lpId} />
              </Suspense>
            </TabsContent>
            <TabsContent value="holidays">
              <HolidayCalendar2026 />
            </TabsContent>
          </Tabs>

          <div className="space-y-6">
            <h1>Learning Partner Dashboard</h1>

            {/* My Teachers Section */}
            <section>
              <h2 className="text-xl font-bold mb-4">My Assigned Teachers ({teachers.length})</h2>
              {teachersLoading ? (
                <div>Loading teachers...</div>
              ) : teachersError ? (
                <div className="text-red-600">Error: {teachersError}</div>
              ) : teachers.length === 0 ? (
                <div className="text-gray-600">No teachers assigned yet. Contact admin to assign.</div>
              ) : (
                <div className="grid gap-4">
                  {teachers.map((teacher) => (
                    <TeacherCard key={teacher.uid} teacher={teacher} />
                  ))}
                </div>
              )}
            </section>

            {/* My Parents Section */}
            <section>
              <h2 className="text-xl font-bold mb-4">My Assigned Parents ({parents.length})</h2>
              {parentsLoading ? (
                <div>Loading parents...</div>
              ) : parentsError ? (
                <div className="text-red-600">Error: {parentsError}</div>
              ) : parents.length === 0 ? (
                <div className="text-gray-600">No parents assigned yet. Contact admin to assign.</div>
              ) : (
                <div className="grid gap-4">
                  {parents.map((parent) => (
                    <ParentCard key={parent.uid} parent={parent} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <MobileTabBar
        items={LP_MOBILE_TABS}
        activeId={tab}
        onSelect={setTab}
      />
    </div>
  );
}

function TeacherCard({ teacher }: { teacher: any }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="font-bold">{teacher.displayName}</h3>
      <p className="text-sm text-gray-600">{teacher.email}</p>
      <p className="text-sm">Specialization: {teacher.specialization || 'N/A'}</p>
      <p className="text-sm">Experience: {teacher.yearsExperience || 0} years</p>
      <button className="mt-2 text-blue-600">View Details</button>
    </div>
  );
}

function ParentCard({ parent }: { parent: any }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="font-bold">{parent.displayName}</h3>
      <p className="text-sm text-gray-600">{parent.email}</p>
      <p className="text-sm">Phone: {parent.phone || 'N/A'}</p>
      <p className="text-sm">Children: {parent.childCount || 0}</p>
      <button className="mt-2 text-blue-600">View Details</button>
    </div>
  );
}
