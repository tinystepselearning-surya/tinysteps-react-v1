import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@components/lib/utils';
import { Button } from '@components/ui/button';
const items = [
    { id: 'today', label: "Today's Sessions" },
    { id: 'upcoming', label: 'Upcoming Sessions' },
    { id: 'students', label: 'My Students' },
    { id: 'progress', label: 'Progress' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'messages', label: 'Messages' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
];
export const TeacherSidebar = ({ active, onSelect, todayCount, teacherId }) => {
    return (_jsx("aside", { className: "hidden lg:block w-64 pr-6", children: _jsxs("div", { className: "space-y-2", children: [items.map((item) => (_jsxs(Button, { variant: active === item.id ? 'default' : 'ghost', className: cn('w-full justify-between', active === item.id && 'bg-blue-600 text-white'), onClick: () => onSelect(item.id), children: [_jsx("span", { children: item.label }), item.id === 'today' && typeof todayCount === 'number' && todayCount > 0 && (_jsx("span", { className: "text-xs bg-white/20 rounded-full px-2 py-0.5", children: todayCount }))] }, item.id))), _jsx(Button, { asChild: true, variant: "ghost", className: "w-full justify-between border border-indigo-100 bg-indigo-50 text-indigo-700", children: _jsx("a", { href: teacherId ? `/teacher/${teacherId}/worksheet-generator` : '/teacher/worksheet-generator', children: "Worksheet Generator \u2728" }) })] }) }));
};
