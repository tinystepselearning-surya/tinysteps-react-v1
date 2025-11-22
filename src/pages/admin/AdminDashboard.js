var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import AnalyticsDashboard from './AnalyticsDashboard';
import { useLocation } from 'react-router-dom';
import { isSuperUserEmail } from '../../constants/accessControl';
const fetchAdminStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const [usersSnap, studentsSnap, coursesSnap] = yield Promise.all([
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
});
const ROLE_SHORTCUTS = [
    { id: 'admin', label: 'Admin', path: '/surya', description: 'Full control panel' },
    { id: 'teacher', label: 'Teacher', path: '/teacher', description: 'Classroom & sessions' },
    { id: 'parent', label: 'Parent', path: '/parent', description: 'Progress & subscriptions' },
    { id: 'learningPartner', label: 'Learning Partner', path: '/learning-partner', description: 'Relationship hub' },
    { id: 'kid', label: 'Kid', path: '/parent/kids', description: 'Student view via Parent' },
];
const AccessMessage = ({ children }) => (_jsx("div", { className: "flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950", children: _jsxs(Card, { className: "p-8 text-center space-y-2", children: [_jsx("h2", { className: "text-2xl font-bold text-red-600", children: "Access Restricted" }), _jsx("p", { children: children })] }) }));
export default function AdminDashboard() {
    const { user, isLoading: authLoading } = useAuthStore();
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState('users');
    const isSuperUser = isSuperUserEmail(user === null || user === void 0 ? void 0 : user.email);
    const canViewAdmin = isSuperUser || (user === null || user === void 0 ? void 0 : user.role) === 'admin';
    const location = useLocation();
    // Sync selected tab with URL path (e.g. /surya/analytics)
    React.useEffect(() => {
        if (location.pathname.includes('/surya/analytics'))
            setSelectedTab('analytics');
    }, [location.pathname]);
    const { data: stats, isLoading: statsLoading, error: statsError, } = useQuery({
        queryKey: ['adminStats'],
        queryFn: fetchAdminStats,
        enabled: canViewAdmin,
        staleTime: 1000 * 60,
    });
    console.log('User role:', user === null || user === void 0 ? void 0 : user.role);
    console.log('User uid:', user === null || user === void 0 ? void 0 : user.uid);
    if (authLoading) {
        return _jsx(AccessMessage, { children: "Checking your permissions..." });
    }
    if (!user) {
        return _jsx(AccessMessage, { children: "Login required to access this page." });
    }
    if (!canViewAdmin) {
        return _jsx(AccessMessage, { children: "You do not have permission to access the admin dashboard." });
    }
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "flex flex-1", children: [_jsx(Sidebar, { selectedTab: selectedTab, onTabChange: setSelectedTab }), _jsxs("main", { className: "flex-1 p-8", children: [isSuperUser && (_jsx(Card, { className: "p-4 mb-6 border border-dashed border-blue-300 bg-blue-50/40 dark:bg-slate-900/40", children: _jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-blue-600 font-semibold", children: "Superuser Mode" }), _jsx("p", { className: "text-lg font-bold", children: "Quick role access" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Jump into any dashboard view without switching accounts." })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: ROLE_SHORTCUTS.map((shortcut) => (_jsx(Button, { variant: shortcut.id === 'admin' ? 'default' : 'secondary', onClick: () => navigate(shortcut.path), children: shortcut.label }, shortcut.id))) })] }) })), _jsxs(Tabs, { value: selectedTab, onValueChange: setSelectedTab, className: "w-full", children: [_jsxs(TabsList, { className: "mb-6", children: [_jsx(TabsTrigger, { value: "users", children: "User Management" }), _jsx(TabsTrigger, { value: "students", children: "Student Management" }), _jsx(TabsTrigger, { value: "enrollments", children: "Enrollment Management" }), _jsx(TabsTrigger, { value: "relationships", children: "Relationship Management" }), _jsx(TabsTrigger, { value: "courses", children: "Course Management" }), _jsx(TabsTrigger, { value: "analytics", children: "Analytics" })] }), _jsx(TabsContent, { value: "users", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold", children: "User Management" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Manage users, roles, and credentials." })] }), _jsx(UserList, {})] }) }), _jsx(TabsContent, { value: "students", children: _jsx(StudentManagementTab, {}) }), _jsx(TabsContent, { value: "enrollments", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Enrollment Management" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Manage enrollments, assignments and lifecycle." })] }), _jsx(EnrollmentsList, {})] }) }), _jsx(TabsContent, { value: "relationships", children: _jsx(RelationshipManagement, {}) }), _jsx(TabsContent, { value: "courses", children: _jsx(CourseManagement, {}) }), _jsx(TabsContent, { value: "analytics", children: _jsx(AnalyticsDashboard, {}) })] })] })] }), _jsx("footer", { className: "bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4", children: _jsx("div", { className: "flex justify-between items-center text-sm text-gray-600 dark:text-gray-400", children: statsLoading ? (_jsx("div", { children: "Loading stats..." })) : statsError ? (_jsx("div", { className: "text-red-500", children: "Error loading stats" })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: ["Total Users: ", (stats === null || stats === void 0 ? void 0 : stats.totalUsers) || 0] }), _jsxs("div", { children: ["Total Students: ", (stats === null || stats === void 0 ? void 0 : stats.totalStudents) || 0] }), _jsxs("div", { children: ["Total Courses: ", (stats === null || stats === void 0 ? void 0 : stats.totalCourses) || 0] }), _jsxs("div", { children: ["Active Sessions Today: ", (stats === null || stats === void 0 ? void 0 : stats.activeSessionsToday) || 0] })] })) }) })] }));
}
