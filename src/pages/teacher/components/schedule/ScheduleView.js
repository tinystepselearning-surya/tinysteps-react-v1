import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
export const ScheduleView = ({ teacherId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month');
    // For simplicity, use today's sessions, but in reality, need all sessions
    const { sessions } = useTeacherSessions(teacherId, format(currentDate, 'yyyy-MM-dd'));
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const sessionsByDate = sessions.reduce((acc, session) => {
        if (!acc[session.date])
            acc[session.date] = [];
        acc[session.date].push(session);
        return acc;
    }, {});
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold", children: format(currentDate, 'MMMM yyyy') }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setView('month'), children: "Month" }), _jsx(Button, { variant: "outline", onClick: () => setView('week'), children: "Week" }), _jsx(Button, { variant: "outline", onClick: () => setView('day'), children: "Day" }), _jsx(Button, { children: "Schedule New Session" })] })] }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "grid grid-cols-7 gap-2", children: [['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (_jsx("div", { className: "p-2 text-center font-semibold", children: day }, day))), days.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const daySessions = sessionsByDate[dateStr] || [];
                            return (_jsxs("div", { className: `p-2 border min-h-[100px] ${isToday(day) ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`, children: [_jsx("div", { className: "text-sm font-medium", children: format(day, 'd') }), _jsxs("div", { className: "space-y-1 mt-1", children: [daySessions.slice(0, 2).map((session, idx) => (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [session.startTime, " - ", session.courseName] }, idx))), daySessions.length > 2 && (_jsxs("div", { className: "text-xs text-muted-foreground", children: ["+", daySessions.length - 2, " more"] }))] })] }, day.toString()));
                        })] }) })] }));
};
