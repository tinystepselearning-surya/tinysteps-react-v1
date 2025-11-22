import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import useAuthStore from '../../../../store/useAuthStore';
import { useUpcomingSessions } from '../../hooks/useUpcomingSessions';
const UpcomingSessionsView = () => {
    const { user } = useAuthStore();
    const { data: sessions = [], isLoading } = useUpcomingSessions([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('all');
    const [filterCourse, setFilterCourse] = useState('all');
    // No demo data shipped in builds; rely on real data from hooks.
    const sessionsToUse = sessions;
    const groupedSessions = sessionsToUse.reduce((acc, session) => {
        const date = new Date(session.date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        let group = 'Later';
        if (date.toDateString() === today.toDateString()) {
            group = 'Today';
        }
        else if (date.toDateString() === tomorrow.toDateString()) {
            group = 'Tomorrow';
        }
        else if (date <= nextWeek) {
            group = 'This Week';
        }
        if (!acc[group])
            acc[group] = [];
        acc[group].push(session);
        return acc;
    }, {});
    const filteredSessions = Object.entries(groupedSessions).reduce((acc, [group, groupSessions]) => {
        const filtered = groupSessions.filter(session => {
            const matchesSearch = session.kidName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                session.courseName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDate = filterDate === 'all' || group.toLowerCase().replace(' ', '') === filterDate;
            const matchesCourse = filterCourse === 'all' || session.courseName === filterCourse;
            return matchesSearch && matchesDate && matchesCourse;
        });
        if (filtered.length > 0) {
            acc[group] = filtered;
        }
        return acc;
    }, {});
    if (isLoading) {
        return _jsx("div", { className: "p-6", children: "Loading sessions..." });
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsx("h1", { className: "text-2xl font-bold", children: "Upcoming Sessions" }) }), _jsxs("div", { className: "flex gap-4 mb-6", children: [_jsx(Input, { placeholder: "Search by child or course...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "max-w-sm" }), _jsxs(Select, { value: filterDate, onValueChange: setFilterDate, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "Filter by date" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Dates" }), _jsx(SelectItem, { value: "today", children: "Today" }), _jsx(SelectItem, { value: "tomorrow", children: "Tomorrow" }), _jsx(SelectItem, { value: "thisweek", children: "This Week" }), _jsx(SelectItem, { value: "later", children: "Later" })] })] }), _jsxs(Select, { value: filterCourse, onValueChange: setFilterCourse, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "Filter by course" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Courses" }), _jsx(SelectItem, { value: "Phonics Level 2", children: "Phonics Level 2" }), _jsx(SelectItem, { value: "Grammar Basics", children: "Grammar Basics" }), _jsx(SelectItem, { value: "Speaking Practice", children: "Speaking Practice" })] })] })] }), _jsxs("div", { className: "space-y-6", children: [Object.keys(filteredSessions).length === 0 && (_jsx("div", { className: "p-6 text-sm text-gray-500", children: "No upcoming sessions yet." })), Object.entries(filteredSessions).map(([group, groupSessions]) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [group, _jsxs(Badge, { variant: "secondary", children: [groupSessions.length, " sessions"] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: groupSessions.map((session) => (_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-600", children: session.kidName.charAt(0) }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: [session.startTime, " - ", new Date(new Date(`2000-01-01T${session.startTime}`).getTime() + 30 * 60000).toTimeString().slice(0, 5)] }), _jsx("p", { className: "text-sm text-gray-600", children: session.kidName }), _jsx("p", { className: "text-sm text-gray-600", children: session.courseName }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Teacher: ", session.teacherName] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [group === 'Today' && session.joinUrl && (_jsx(Button, { variant: "default", size: "sm", children: "Join Zoom" })), _jsx(Button, { variant: "outline", size: "sm", children: "Set Reminder" }), _jsx(Button, { variant: "outline", size: "sm", children: "Reschedule" }), _jsx(Button, { variant: "outline", size: "sm", children: "Contact Teacher" })] })] }, session.id))) }) })] }, group)))] })] }));
};
export default UpcomingSessionsView;
