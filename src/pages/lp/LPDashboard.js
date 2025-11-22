import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { useAuthStore } from '../../store/useAuthStore';
import { LPHeader } from './components/layout/LPHeader';
import { LPSidebar } from './components/layout/LPSidebar';
const LPStats = React.lazy(() => import('./components/overview/LPStats'));
const ParentsList = React.lazy(() => import('./components/parents/ParentsList'));
const TeachersList = React.lazy(() => import('./components/teachers/TeachersList'));
const TicketsList = React.lazy(() => import('./components/tickets/TicketsList'));
const PerformanceMetrics = React.lazy(() => import('./components/performance/PerformanceMetrics'));
const RegionalData = React.lazy(() => import('./components/region/RegionalData'));
import { useLPFilteredTeachers, useLPFilteredParents } from '@/hooks/useLPFilteredData';
const AccessNotice = ({ children }) => (_jsx("div", { className: "flex items-center justify-center h-screen bg-muted/30", children: _jsx(Card, { className: "p-8 text-center space-y-2 max-w-md", children: children }) }));
const TAB_ITEMS = [
    { id: 'overview', label: 'Overview' },
    { id: 'parents', label: 'Parents' },
    { id: 'teachers', label: 'Teachers' },
    { id: 'tickets', label: 'Support Tickets' },
    { id: 'performance', label: 'Performance' },
    { id: 'region', label: 'Regional Data' },
];
export default function LPDashboard() {
    const { user, isLoading } = useAuthStore();
    const [tab, setTab] = useState('overview');
    const lpId = user === null || user === void 0 ? void 0 : user.uid;
    const { teachers, loading: teachersLoading, error: teachersError } = useLPFilteredTeachers();
    const { parents, loading: parentsLoading, error: parentsError } = useLPFilteredParents();
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx(Card, { className: "p-6", children: "Checking permissions..." }) }));
    }
    if (!user || (user.role !== 'learningPartner' && user.role !== 'admin')) {
        return _jsx(AccessNotice, { children: "You do not have permission to access the Learning Partner dashboard." });
    }
    return (_jsxs("div", { className: "min-h-screen bg-muted/30 p-4 md:p-8", children: [_jsx(LPHeader, { name: user.displayName || user.email }), _jsxs("div", { className: "flex gap-6", children: [_jsx(LPSidebar, { active: tab, onSelect: setTab }), _jsxs("main", { className: "flex-1 space-y-6", children: [_jsxs(Tabs, { value: tab, onValueChange: setTab, className: "space-y-4", children: [_jsx(TabsList, { className: "lg:hidden", children: TAB_ITEMS.map((item) => (_jsx(TabsTrigger, { value: item.id, children: item.label }, item.id))) }), _jsx(TabsContent, { value: "overview", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading overview\u2026" }), children: _jsx(LPStats, { lpId: lpId }) }) }), _jsx(TabsContent, { value: "parents", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading parents\u2026" }), children: _jsx(ParentsList, { lpId: lpId }) }) }), _jsx(TabsContent, { value: "teachers", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading teachers\u2026" }), children: _jsx(TeachersList, { lpId: lpId }) }) }), _jsx(TabsContent, { value: "tickets", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading tickets\u2026" }), children: _jsx(TicketsList, { lpId: lpId }) }) }), _jsx(TabsContent, { value: "performance", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading performance\u2026" }), children: _jsx(PerformanceMetrics, { lpId: lpId }) }) }), _jsx(TabsContent, { value: "region", children: _jsx(Suspense, { fallback: _jsx("div", { className: "text-sm text-gray-600", children: "Loading regional data\u2026" }), children: _jsx(RegionalData, { lpId: lpId }) }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsx("h1", { children: "Learning Partner Dashboard" }), _jsxs("section", { children: [_jsxs("h2", { className: "text-xl font-bold mb-4", children: ["My Assigned Teachers (", teachers.length, ")"] }), teachersLoading ? (_jsx("div", { children: "Loading teachers..." })) : teachersError ? (_jsxs("div", { className: "text-red-600", children: ["Error: ", teachersError] })) : teachers.length === 0 ? (_jsx("div", { className: "text-gray-600", children: "No teachers assigned yet. Contact admin to assign." })) : (_jsx("div", { className: "grid gap-4", children: teachers.map((teacher) => (_jsx(TeacherCard, { teacher: teacher }, teacher.uid))) }))] }), _jsxs("section", { children: [_jsxs("h2", { className: "text-xl font-bold mb-4", children: ["My Assigned Parents (", parents.length, ")"] }), parentsLoading ? (_jsx("div", { children: "Loading parents..." })) : parentsError ? (_jsxs("div", { className: "text-red-600", children: ["Error: ", parentsError] })) : parents.length === 0 ? (_jsx("div", { className: "text-gray-600", children: "No parents assigned yet. Contact admin to assign." })) : (_jsx("div", { className: "grid gap-4", children: parents.map((parent) => (_jsx(ParentCard, { parent: parent }, parent.uid))) }))] })] })] })] })] }));
}
function TeacherCard({ teacher }) {
    return (_jsxs("div", { className: "border rounded-lg p-4 hover:shadow-lg transition", children: [_jsx("h3", { className: "font-bold", children: teacher.displayName }), _jsx("p", { className: "text-sm text-gray-600", children: teacher.email }), _jsxs("p", { className: "text-sm", children: ["Specialization: ", teacher.specialization || 'N/A'] }), _jsxs("p", { className: "text-sm", children: ["Experience: ", teacher.yearsExperience || 0, " years"] }), _jsx("button", { className: "mt-2 text-blue-600", children: "View Details" })] }));
}
function ParentCard({ parent }) {
    return (_jsxs("div", { className: "border rounded-lg p-4 hover:shadow-lg transition", children: [_jsx("h3", { className: "font-bold", children: parent.displayName }), _jsx("p", { className: "text-sm text-gray-600", children: parent.email }), _jsxs("p", { className: "text-sm", children: ["Phone: ", parent.phone || 'N/A'] }), _jsxs("p", { className: "text-sm", children: ["Children: ", parent.childCount || 0] }), _jsx("button", { className: "mt-2 text-blue-600", children: "View Details" })] }));
}
