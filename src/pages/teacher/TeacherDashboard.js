import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { TeacherHeader } from './components/layout/TeacherHeader';
import { TeacherSidebar } from './components/layout/TeacherSidebar';
import { Card } from '@components/ui/card';
const TodaySessionsView = React.lazy(() => import('./components/today-sessions/TodaySessionsList').then(module => ({ default: module.TodaySessionsList })));
const UpcomingSessionsView = React.lazy(() => import('./components/upcoming-sessions/UpcomingSessionsView').then(module => ({ default: module.UpcomingSessionsView })));
const StudentsList = React.lazy(() => import('./components/students/StudentsList').then(module => ({ default: module.StudentsList })));
const StudentProgressChart = React.lazy(() => import('./components/progress/StudentProgressChart').then(module => ({ default: module.StudentProgressChart })));
const EarningsSummary = React.lazy(() => import('./components/earnings/EarningsSummary').then(module => ({ default: module.EarningsSummary })));
const TeacherStats = React.lazy(() => import('./components/analytics/TeacherStats').then(module => ({ default: module.TeacherStats })));
const MessagesView = React.lazy(() => import('./components/messages/MessagesView').then(module => ({ default: module.MessagesView })));
const ScheduleView = React.lazy(() => import('./components/schedule/ScheduleView').then(module => ({ default: module.ScheduleView })));
const TeacherProfile = React.lazy(() => import('./components/profile/TeacherProfile').then(module => ({ default: module.TeacherProfile })));
const NotificationsPanel = React.lazy(() => import('./components/notifications/NotificationsPanel').then(module => ({ default: module.NotificationsPanel })));
import { useAuthStore } from '../../store/useAuthStore';
import { useTeacherSessions } from './hooks/useTeacherSessions';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
const AccessNotice = ({ children }) => (_jsx("div", { className: "flex items-center justify-center h-screen bg-muted/30", children: _jsx(Card, { className: "p-8 text-center space-y-2 max-w-md", children: children }) }));
const TAB_ITEMS = [
    { id: 'today', label: "Today's Sessions" },
    { id: 'upcoming', label: 'Upcoming Sessions' },
    { id: 'students', label: 'Students' },
    { id: 'progress', label: 'Progress' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'messages', label: 'Messages' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
];
export default function TeacherDashboard() {
    const { user, isLoading } = useAuthStore();
    const [tab, setTab] = useState('today');
    const teacherId = user === null || user === void 0 ? void 0 : user.uid;
    const { sessions } = useTeacherSessions(teacherId);
    const { students, loading, error } = useTeacherFilteredStudents();
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx(Card, { className: "p-6", children: "Checking permissions..." }) }));
    }
    if (!user || user.role !== 'teacher') {
        return _jsx(AccessNotice, { children: "You do not have permission to access the teacher dashboard." });
    }
    return (_jsxs("div", { className: "min-h-screen bg-muted/30 p-4 md:p-8", children: [_jsx(TeacherHeader, { name: user.displayName || user.email, upcomingCount: sessions.length }), _jsxs("div", { className: "flex gap-6", children: [_jsx(TeacherSidebar, { active: tab, onSelect: setTab, todayCount: sessions.length, teacherId: teacherId }), _jsx("main", { className: "flex-1 space-y-6", children: _jsxs(Tabs, { value: tab, onValueChange: setTab, className: "space-y-4", children: [_jsx(TabsList, { className: "lg:hidden", children: TAB_ITEMS.map((item) => (_jsx(TabsTrigger, { value: item.id, children: item.label }, item.id))) }), _jsx(TabsContent, { value: "today", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading sessions\u2026" }), children: _jsx(TodaySessionsView, { teacherId: teacherId }) }) }), _jsx(TabsContent, { value: "upcoming", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading upcoming sessions\u2026" }), children: _jsx(UpcomingSessionsView, { teacherId: teacherId }) }) }), _jsx(TabsContent, { value: "students", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading students\u2026" }), children: _jsxs("div", { className: "space-y-6", children: [_jsx("h1", { children: "Teacher Dashboard" }), _jsxs("section", { children: [_jsxs("h2", { className: "text-xl font-bold mb-4", children: ["My Students (", students.length, ")"] }), loading ? (_jsx("div", { children: "Loading students..." })) : error ? (_jsxs("div", { className: "text-red-600", children: ["Error: ", error] })) : students.length === 0 ? (_jsx("div", { className: "text-gray-600", children: "No students assigned yet. Wait for admin assignment." })) : (_jsx("div", { className: "grid gap-4", children: students.map((student) => (_jsx(StudentRow, { student: student }, student.uid))) }))] })] }) }) }), _jsx(TabsContent, { value: "progress", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading progress\u2026" }), children: _jsx(StudentProgressChart, { teacherId: teacherId }) }) }), _jsx(TabsContent, { value: "earnings", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading earnings\u2026" }), children: _jsx(EarningsSummary, { teacherId: teacherId }) }) }), _jsx(TabsContent, { value: "analytics", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading analytics\u2026" }), children: _jsx(TeacherStats, { teacherId: teacherId }) }) }), _jsx(TabsContent, { value: "messages", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading messages\u2026" }), children: _jsx(MessagesView, { teacherId: teacherId }) }) }), _jsx(TabsContent, { value: "schedule", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading schedule\u2026" }), children: _jsx(ScheduleView, { teacherId: teacherId }) }) }), _jsx(TabsContent, { value: "profile", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading profile\u2026" }), children: _jsx(TeacherProfile, { teacherId: teacherId }) }) }), _jsx(TabsContent, { value: "notifications", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading notifications\u2026" }), children: _jsx(NotificationsPanel, { teacherId: teacherId }) }) })] }) })] })] }));
}
function StudentRow({ student }) {
    return (_jsx("div", { className: "border rounded-lg p-4", children: _jsxs("div", { className: "flex justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold", children: student.studentName }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Parent: ", student.parentName] }), _jsxs("p", { className: "text-sm", children: ["Course: ", student.courseName] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-bold text-lg", children: [student.mastery, "% Mastery"] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Status: ", student.status] })] })] }) }));
}
