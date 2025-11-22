import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Users, TrendingUp, DollarSign, MessageSquare, BarChart3, Clock, User, Bell } from 'lucide-react';
const sidebarItems = [
    { id: 'today', label: 'Today\'s Sessions', icon: _jsx(Calendar, { className: "w-4 h-4" }) },
    { id: 'upcoming', label: 'Upcoming Sessions', icon: _jsx(Clock, { className: "w-4 h-4" }) },
    { id: 'students', label: 'Students', icon: _jsx(Users, { className: "w-4 h-4" }) },
    { id: 'progress', label: 'Progress', icon: _jsx(TrendingUp, { className: "w-4 h-4" }) },
    { id: 'earnings', label: 'Earnings', icon: _jsx(DollarSign, { className: "w-4 h-4" }) },
    { id: 'analytics', label: 'Analytics', icon: _jsx(BarChart3, { className: "w-4 h-4" }) },
    { id: 'messages', label: 'Messages', icon: _jsx(MessageSquare, { className: "w-4 h-4" }), badge: '3' },
    { id: 'schedule', label: 'Schedule', icon: _jsx(Calendar, { className: "w-4 h-4" }) },
    { id: 'profile', label: 'Profile', icon: _jsx(User, { className: "w-4 h-4" }) },
    { id: 'notifications', label: 'Notifications', icon: _jsx(Bell, { className: "w-4 h-4" }), badge: '5' },
];
const TeacherSidebar = ({ activeTab, onTabChange }) => {
    return (_jsxs("div", { className: "w-64 bg-white border-r border-gray-200 flex flex-col", children: [_jsxs("div", { className: "p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Teacher Dashboard" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Manage your sessions and students" })] }), _jsx("nav", { className: "flex-1 p-4 space-y-2", children: sidebarItems.map((item) => (_jsxs(Button, { variant: activeTab === item.id ? 'default' : 'ghost', className: "w-full justify-start", onClick: () => onTabChange === null || onTabChange === void 0 ? void 0 : onTabChange(item.id), children: [item.icon, _jsx("span", { className: "ml-3", children: item.label }), item.badge && (_jsx(Badge, { variant: "secondary", className: "ml-auto", children: item.badge }))] }, item.id))) }), _jsx("div", { className: "p-4 border-t border-gray-200", children: _jsxs("div", { className: "text-xs text-gray-500", children: [_jsx("p", { children: "Next session: 2:00 PM" }), _jsx("p", { children: "Students: 12 active" })] }) })] }));
};
export default TeacherSidebar;
