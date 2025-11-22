import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
const groupSessions = (sessions) => {
    const groups = {};
    sessions.forEach((session) => {
        var _a;
        groups[_a = session.date] || (groups[_a] = []);
        groups[session.date].push(session);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
};
export const UpcomingSessionsList = ({ sessions }) => {
    const grouped = useMemo(() => groupSessions(sessions), [sessions]);
    if (!sessions.length) {
        return (_jsx(Card, { className: "p-6 text-sm text-muted-foreground", children: "No upcoming sessions found." }));
    }
    return (_jsxs(Card, { className: "p-6 space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Upcoming Sessions" }), grouped.map(([date, daySessions]) => (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-semibold text-muted-foreground", children: date }), daySessions.map((session) => (_jsxs("div", { className: "border rounded-lg p-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: [session.kidName, " \u00B7 ", session.courseName] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [session.startTime, " \u00B7 ", session.teacherName || 'Teacher assigned'] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: session.status === 'scheduled' ? 'secondary' : 'default', className: "capitalize", children: session.status.replace('_', ' ') }), _jsx("button", { className: "text-sm text-primary underline", children: "Set reminder" })] })] }, session.id)))] }, date)))] }));
};
