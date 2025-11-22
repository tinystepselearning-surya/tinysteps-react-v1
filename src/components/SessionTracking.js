import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
const SessionTracking = () => {
    const [selectedChild, setSelectedChild] = React.useState('');
    // No sample child data is shipped. The UI shows actual children via data hooks in real use.
    const children = [];
    const sessions = [];
    const filteredSessions = selectedChild ? sessions.filter(s => s.childId === selectedChild) : sessions;
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Session Tracking & Attendance" }), _jsx(Card, { className: "mb-4", children: _jsx(CardContent, { className: "pt-6", children: _jsxs(Select, { value: selectedChild || 'all', onValueChange: (value) => setSelectedChild(value === 'all' ? '' : value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select Child" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Children" }), children.map(child => (_jsx(SelectItem, { value: child.id, children: child.name }, child.id)))] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { children: filteredSessions.length === 0 ? (_jsx("div", { className: "p-4 text-sm text-gray-500", children: "No sessions found. Connect your account to view sessions." })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Date & Time" }), _jsx(TableHead, { children: "Course" }), _jsx(TableHead, { children: "Teacher" }), _jsx(TableHead, { children: "Attendance" }), _jsx(TableHead, { children: "Mastery (%)" }), _jsx(TableHead, { children: "Feedback" }), _jsx(TableHead, { children: "Notes" })] }) }), _jsx(TableBody, { children: filteredSessions.map((session) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: [session.date, " ", session.time] }), _jsx(TableCell, { children: session.course }), _jsx(TableCell, { children: session.teacher }), _jsx(TableCell, { children: _jsx(Badge, { variant: session.attendance === 'Present' ? 'default' : session.attendance === 'Absent' ? 'destructive' : 'secondary', children: session.attendance }) }), _jsxs(TableCell, { children: [session.mastery, "%"] }), _jsx(TableCell, { children: session.feedback }), _jsx(TableCell, { children: session.notes })] }, session.id))) })] })) }) })] }));
};
export default SessionTracking;
