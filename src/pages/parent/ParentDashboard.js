import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy, useEffect, useState } from 'react';
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
const AccessNotice = ({ children }) => (_jsx("div", { className: "flex items-center justify-center h-screen bg-muted/30", children: _jsx(Card, { className: "p-8 text-center space-y-2 max-w-md", children: children }) }));
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
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'kids') {
            navigate('/parent/kids', { replace: location.pathname.includes('/parent/kids') });
        }
        else if (location.pathname.includes('/parent/kids')) {
            navigate('/parent', { replace: true });
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx(Card, { className: "p-6", children: "Checking permissions..." }) }));
    }
    if (!user || user.role !== 'parent') {
        return _jsx(AccessNotice, { children: "You do not have permission to access the parent dashboard." });
    }
    return (_jsxs("div", { className: "flex h-screen bg-gray-50", children: [_jsx(ParentSidebar, { activeTab: activeTab, onTabChange: handleTabChange }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx(ParentHeader, { onOpenKidsView: () => handleTabChange('kids') }), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx(Suspense, { fallback: _jsx("div", { className: "p-6", children: "Loading..." }), children: _jsxs(Tabs, { value: activeTab, onValueChange: handleTabChange, className: "w-full h-full", children: [_jsx("div", { className: "border-b bg-white px-6", children: _jsxs(TabsList, { className: "grid w-full grid-cols-10", children: [_jsx(TabsTrigger, { value: "dashboard", children: "Dashboard" }), _jsx(TabsTrigger, { value: "children", children: "Children" }), _jsx(TabsTrigger, { value: "sessions", children: "Sessions" }), _jsx(TabsTrigger, { value: "payments", children: "Payments" }), _jsx(TabsTrigger, { value: "kids", children: "Kids Page" }), _jsx(TabsTrigger, { value: "reports", children: "Reports" }), _jsx(TabsTrigger, { value: "messages", children: "Messages" }), _jsx(TabsTrigger, { value: "notifications", children: "Notifications" }), _jsx(TabsTrigger, { value: "settings", children: "Settings" }), _jsx(TabsTrigger, { value: "profile", children: "Profile" })] }) }), _jsx(TabsContent, { value: "dashboard", className: "m-0 h-full", children: _jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Dashboard Overview" }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsx("p", { children: "Dashboard overview with quick stats and recent activity will be displayed here." }) }) })] }) }), _jsx(TabsContent, { value: "children", className: "m-0 h-full", children: _jsxs("div", { className: "space-y-6", children: [_jsx("h1", { children: "Parent Dashboard" }), _jsxs("section", { children: [_jsxs("h2", { className: "text-xl font-bold mb-4", children: ["My Children (", children.length, ")"] }), loading ? (_jsx("div", { children: "Loading children..." })) : error ? (_jsxs("div", { className: "text-red-600", children: ["Error: ", error] })) : children.length === 0 ? (_jsx("div", { className: "text-gray-600", children: "No children registered yet." })) : (_jsx("div", { className: "grid gap-4", children: children.map((child) => (_jsx(ChildCard, { child: child }, child.uid))) }))] })] }) }), _jsx(TabsContent, { value: "sessions", className: "m-0 h-full", children: _jsx(UpcomingSessionsView, {}) }), _jsx(TabsContent, { value: "payments", className: "m-0 h-full", children: _jsx(InvoiceManagement, {}) }), _jsx(TabsContent, { value: "kids", className: "m-0 h-full p-0", children: _jsx(KidDashboard, {}) }), _jsx(TabsContent, { value: "reports", className: "m-0 h-full", children: _jsx(ProgressReports, {}) }), _jsx(TabsContent, { value: "messages", className: "m-0 h-full", children: _jsx(TeacherMessaging, {}) }), _jsx(TabsContent, { value: "notifications", className: "m-0 h-full", children: _jsx(NotificationsCenter, {}) }), _jsx(TabsContent, { value: "settings", className: "m-0 h-full", children: _jsx(ParentSettings, {}) }), _jsx(TabsContent, { value: "profile", className: "m-0 h-full", children: _jsx(ParentProfile, {}) })] }) }) })] })] }));
}
function ChildCard({ child }) {
    return (_jsxs("div", { className: "border rounded-lg p-4 hover:shadow-lg transition", children: [_jsx("h3", { className: "font-bold text-lg", children: child.displayName }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Age: ", child.age, " | Grade: ", child.grade] }), _jsxs("p", { className: "text-sm", children: ["Active Courses: ", child.enrollmentCount] }), _jsxs("p", { className: "text-sm", children: ["Average Mastery: ", child.averageMastery, "%"] }), _jsx("button", { className: "mt-2 text-blue-600", children: "View Progress" })] }));
}
