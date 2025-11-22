import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Home, Users, Calendar, CreditCard, FileText, MessageSquare, Bell, Settings, User, Sparkles } from 'lucide-react';
const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: _jsx(Home, { className: "w-4 h-4" }) },
    { id: 'children', label: 'Children', icon: _jsx(Users, { className: "w-4 h-4" }) },
    { id: 'sessions', label: 'Sessions', icon: _jsx(Calendar, { className: "w-4 h-4" }) },
    { id: 'payments', label: 'Payments', icon: _jsx(CreditCard, { className: "w-4 h-4" }), badge: '2' },
    { id: 'kids', label: 'Kids Page', icon: _jsx(Sparkles, { className: "w-4 h-4" }) },
    { id: 'reports', label: 'Reports', icon: _jsx(FileText, { className: "w-4 h-4" }) },
    { id: 'messages', label: 'Messages', icon: _jsx(MessageSquare, { className: "w-4 h-4" }), badge: '1' },
    { id: 'notifications', label: 'Notifications', icon: _jsx(Bell, { className: "w-4 h-4" }), badge: '3' },
    { id: 'settings', label: 'Settings', icon: _jsx(Settings, { className: "w-4 h-4" }) },
    { id: 'profile', label: 'Profile', icon: _jsx(User, { className: "w-4 h-4" }) },
];
const ParentSidebar = ({ activeTab, onTabChange }) => {
    return (_jsxs("div", { className: "w-64 bg-white border-r border-gray-200 flex flex-col", children: [_jsxs("div", { className: "p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Parent Dashboard" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Track your children's progress" })] }), _jsx("nav", { className: "flex-1 p-4 space-y-2", children: sidebarItems.map((item) => (_jsxs(Button, { variant: activeTab === item.id ? 'default' : 'ghost', className: "w-full justify-start", onClick: () => onTabChange === null || onTabChange === void 0 ? void 0 : onTabChange(item.id), children: [item.icon, _jsx("span", { className: "ml-3", children: item.label }), item.badge && (_jsx(Badge, { variant: "secondary", className: "ml-auto", children: item.badge }))] }, item.id))) }), _jsx("div", { className: "p-4 border-t border-gray-200", children: _jsxs("div", { className: "text-xs text-gray-500", children: [_jsx("p", { children: "Next session: 4:00 PM" }), _jsx("p", { children: "Outstanding: \u20B92,000" })] }) })] }));
};
export default ParentSidebar;
