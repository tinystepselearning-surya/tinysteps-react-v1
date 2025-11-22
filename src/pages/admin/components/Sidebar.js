import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// React default import removed
import { Button } from '@components/ui/button';
export default function Sidebar({ selectedTab, onTabChange }) {
    const tabs = [
        { id: 'users', label: 'User Management', icon: '👥' },
        { id: 'students', label: 'Student Management', icon: '🎓' },
        { id: 'enrollments', label: 'Enrollment Management', icon: '📝' },
        { id: 'relationships', label: 'Relationship Management', icon: '🤝' },
        { id: 'courses', label: 'Course Management', icon: '📚' },
        { id: 'analytics', label: 'Analytics', icon: '📊' },
    ];
    return (_jsxs("aside", { className: "w-64 bg-gray-800 text-white p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-8", children: "Admin Panel" }), _jsx("nav", { className: "space-y-2", children: tabs.map((tab) => (_jsxs(Button, { variant: selectedTab === tab.id ? 'default' : 'ghost', className: `w-full justify-start text-left ${selectedTab === tab.id
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'}`, onClick: () => onTabChange(tab.id), children: [_jsx("span", { className: "mr-3", children: tab.icon }), tab.label] }, tab.id))) })] }));
}
