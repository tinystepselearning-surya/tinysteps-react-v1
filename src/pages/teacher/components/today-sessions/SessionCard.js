import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { format, differenceInMinutes, isAfter, isBefore } from 'date-fns';
const statusMap = {
    scheduled: { label: 'Scheduled', variant: 'secondary' },
    in_progress: { label: 'In Progress', variant: 'default' },
    completed: { label: 'Completed', variant: 'outline' },
};
export const SessionCard = ({ session, onMarkAttendance, onComplete }) => {
    var _a, _b;
    const now = new Date();
    const sessionStart = new Date(`${session.date}T${session.startTime}`);
    const sessionEnd = new Date(`${session.date}T${session.endTime}`);
    const timeUntilStart = differenceInMinutes(sessionStart, now);
    const isInProgress = isAfter(now, sessionStart) && isBefore(now, sessionEnd);
    const isCompleted = isAfter(now, sessionEnd);
    const attendanceSummary = useMemo(() => {
        var _a;
        const attendance = session.attendance || {};
        const present = Object.values(attendance).filter(s => s === 'present').length;
        const absent = Object.values(attendance).filter(s => s === 'absent').length;
        const late = Object.values(attendance).filter(s => s === 'late').length;
        return { present, absent, late, total: ((_a = session.kidIds) === null || _a === void 0 ? void 0 : _a.length) || 0 };
    }, [session.attendance, session.kidIds]);
    const joinDisabled = !session.joinUrl;
    return (_jsxs(Card, { className: "p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Badge, { variant: ((_a = statusMap[session.status]) === null || _a === void 0 ? void 0 : _a.variant) || 'secondary', children: ((_b = statusMap[session.status]) === null || _b === void 0 ? void 0 : _b.label) || 'Scheduled' }), timeUntilStart > 0 && timeUntilStart <= 60 && (_jsxs(Badge, { variant: "outline", children: ["Starts in ", timeUntilStart, " min"] }))] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [format(sessionStart, 'PPPP'), " \u00B7 ", session.startTime, " - ", session.endTime, " (30 min)"] }), _jsx("h3", { className: "text-lg font-semibold", children: session.courseName || 'Course' }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Students: ", attendanceSummary.present + attendanceSummary.absent + attendanceSummary.late, " of ", attendanceSummary.total, " present"] }), _jsxs("div", { className: "flex gap-2 mt-1", children: [_jsxs("span", { className: "text-green-600", children: ["\u2705 ", attendanceSummary.present] }), _jsxs("span", { className: "text-red-600", children: ["\u274C ", attendanceSummary.absent] }), _jsxs("span", { className: "text-yellow-600", children: ["\u23F0 ", attendanceSummary.late] })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => {
                            if (session.joinUrl) {
                                window.open(session.joinUrl, '_blank', 'noopener,noreferrer');
                            }
                        }, disabled: joinDisabled, children: "Join on Zoom" }), _jsx(Button, { onClick: () => onMarkAttendance(session), variant: "secondary", children: "Mark Attendance" }), isInProgress && (_jsx(Button, { variant: "default", children: "Start Session" })), (isCompleted || session.status === 'in_progress') && (_jsx(Button, { variant: "ghost", onClick: () => onComplete(session.id), children: "Complete Session" })), _jsx(Button, { variant: "outline", children: "Add Notes" })] })] }));
};
