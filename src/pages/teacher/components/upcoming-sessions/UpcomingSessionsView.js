import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import { useUpcomingSessions } from '../../hooks/useUpcomingSessions';
import { format, parseISO } from 'date-fns';
export const UpcomingSessionsView = ({ teacherId }) => {
    const { sessions, isLoading, error } = useUpcomingSessions(teacherId);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const groupedSessions = useMemo(() => {
        const groups = {};
        sessions.forEach((session) => {
            if (!groups[session.date]) {
                groups[session.date] = [];
            }
            groups[session.date].push(session);
        });
        return groups;
    }, [sessions]);
    const filteredSessions = useMemo(() => {
        return sessions.filter((session) => {
            var _a;
            const matchesSearch = ((_a = session.courseName) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm.toLowerCase())) ||
                session.date.includes(searchTerm);
            const matchesCourse = !courseFilter || session.courseName === courseFilter;
            return matchesSearch && matchesCourse;
        });
    }, [sessions, searchTerm, courseFilter]);
    const courseOptions = useMemo(() => {
        const courses = new Set(sessions.map(s => s.courseName).filter(Boolean));
        return Array.from(courses);
    }, [sessions]);
    if (isLoading) {
        return _jsx(Card, { className: "p-6", children: _jsx("p", { children: "Loading upcoming sessions..." }) });
    }
    if (error) {
        return _jsx(Card, { className: "p-6", children: _jsx("p", { className: "text-red-500", children: error.message }) });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex gap-4", children: [_jsx(Input, { placeholder: "Search by course or date...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "max-w-sm" }), _jsxs(Select, { value: courseFilter || 'all', onValueChange: (value) => setCourseFilter(value === 'all' ? '' : value), children: [_jsx(SelectTrigger, { className: "max-w-sm", children: _jsx(SelectValue, { placeholder: "Filter by course" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Courses" }), courseOptions.map((course) => (_jsx(SelectItem, { value: course, children: course }, course)))] })] })] }), Object.keys(groupedSessions).length === 0 ? (_jsx(Card, { className: "p-6 text-center", children: _jsx("p", { children: "No upcoming sessions in the next 7 days." }) })) : (Object.entries(groupedSessions)
                .filter(([date]) => filteredSessions.some(s => s.date === date))
                .map(([date, daySessions]) => (_jsxs("div", { className: "space-y-4", children: [_jsxs("h3", { className: "text-lg font-semibold", children: [format(parseISO(date), 'EEEE, MMMM d'), " (", daySessions.length, " sessions)"] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: daySessions
                            .filter(session => filteredSessions.includes(session))
                            .map((session) => (_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: session.startTime }), _jsx("p", { className: "text-sm text-muted-foreground", children: session.courseName }), _jsxs("p", { className: "text-sm", children: [session.kidIds.length, " students"] })] }), _jsx(Badge, { variant: "secondary", children: "Scheduled" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", children: "Set Reminder" }), _jsx(Button, { size: "sm", variant: "outline", children: "View Details" })] })] }) }, session.id))) })] }, date))))] }));
};
