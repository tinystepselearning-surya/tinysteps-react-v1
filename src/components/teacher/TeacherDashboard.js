import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
const TeacherDashboard = () => {
    return (_jsxs("div", { className: "flex h-screen bg-gray-50", children: [_jsx(TeacherSidebar, {}), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx(TeacherHeader, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx(Suspense, { fallback: _jsx("div", { className: "p-6", children: "Loading..." }), children: _jsxs(Tabs, { defaultValue: "today", className: "w-full h-full", children: [_jsx("div", { className: "border-b bg-white px-6", children: _jsxs(TabsList, { className: "grid w-full grid-cols-10", children: [_jsx(TabsTrigger, { value: "today", children: "Today" }), _jsx(TabsTrigger, { value: "upcoming", children: "Upcoming" }), _jsx(TabsTrigger, { value: "students", children: "Students" }), _jsx(TabsTrigger, { value: "progress", children: "Progress" }), _jsx(TabsTrigger, { value: "earnings", children: "Earnings" }), _jsx(TabsTrigger, { value: "analytics", children: "Analytics" }), _jsx(TabsTrigger, { value: "messages", children: "Messages" }), _jsx(TabsTrigger, { value: "schedule", children: "Schedule" }), _jsx(TabsTrigger, { value: "profile", children: "Profile" }), _jsx(TabsTrigger, { value: "notifications", children: "Notifications" })] }) }), _jsx(TabsContent, { value: "today", className: "m-0 h-full", children: _jsx(TodaySessionsView, {}) }), _jsx(TabsContent, { value: "upcoming", className: "m-0 h-full", children: _jsx(UpcomingSessionsView, {}) }), _jsx(TabsContent, { value: "students", className: "m-0 h-full", children: _jsx(StudentsView, {}) }), _jsx(TabsContent, { value: "progress", className: "m-0 h-full", children: _jsx(StudentProgressView, {}) }), _jsx(TabsContent, { value: "earnings", className: "m-0 h-full", children: _jsx(EarningsSummary, {}) }), _jsx(TabsContent, { value: "analytics", className: "m-0 h-full", children: _jsx(PerformanceAnalyticsView, {}) }), _jsx(TabsContent, { value: "messages", className: "m-0 h-full", children: _jsx(MessagesView, {}) }), _jsx(TabsContent, { value: "schedule", className: "m-0 h-full", children: _jsx(ScheduleView, {}) }), _jsx(TabsContent, { value: "profile", className: "m-0 h-full", children: _jsx(TeacherProfile, {}) }), _jsx(TabsContent, { value: "notifications", className: "m-0 h-full", children: _jsx(NotificationsPanel, {}) })] }) }) })] })] }));
};
export default TeacherDashboard;
