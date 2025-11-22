import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// React default import removed
import { Card } from '@components/ui/card';
const metricConfig = [
    { key: 'totalUsers', label: 'Total Users', accent: 'text-blue-600' },
    { key: 'totalStudents', label: 'Students', accent: 'text-green-600' },
    { key: 'totalCourses', label: 'Courses', accent: 'text-purple-600' },
    { key: 'activeSessionsToday', label: 'Active Sessions (Today)', accent: 'text-orange-600', helper: 'Live sessions in the last 24h' },
];
export default function Analytics({ stats, isLoading, error }) {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Analytics Dashboard" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: metricConfig.map(({ key, label, accent, helper }) => (_jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "font-semibold mb-2", children: label }), isLoading ? (_jsx("div", { className: "h-8 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" })) : (_jsx("div", { className: `text-3xl font-bold ${accent}`, children: stats ? stats[key] : '—' })), helper && _jsx("p", { className: "text-xs text-muted-foreground mt-2", children: helper })] }, key))) }), _jsx(Card, { className: "p-6", children: error ? (_jsx("div", { className: "text-center text-red-500", children: error })) : (_jsx("div", { className: "text-center text-gray-500 dark:text-gray-400", children: isLoading ? (_jsx("div", { className: "h-4 w-1/2 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse" })) : (_jsxs(_Fragment, { children: [_jsx("p", { children: "Charts and detailed analytics will be displayed here." }), _jsx("p", { className: "text-sm mt-2", children: "User growth, session attendance, course popularity" })] })) })) })] }));
}
