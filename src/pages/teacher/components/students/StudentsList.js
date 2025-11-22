import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { useTeacherStudents } from '../../hooks/useTeacherStudents';
const filterByStatus = (students, status) => {
    if (status === 'all')
        return students;
    return students.filter((student) => student.progressStatus === status);
};
export const StudentsList = ({ teacherId }) => {
    const { data: students = [], isLoading } = useTeacherStudents(teacherId);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const filtered = useMemo(() => {
        const byStatus = filterByStatus(students, status);
        if (!search)
            return byStatus;
        return byStatus.filter((student) => student.fullName.toLowerCase().includes(search.toLowerCase()));
    }, [students, search, status]);
    return (_jsxs(Card, { className: "p-6 space-y-4", children: [_jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsx(Input, { placeholder: "Search students", value: search, onChange: (e) => setSearch(e.target.value) }), _jsxs(Select, { value: status, onValueChange: setStatus, children: [_jsx(SelectTrigger, { className: "md:w-40", children: _jsx(SelectValue, { placeholder: "Progress" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All" }), _jsx(SelectItem, { value: "on_track", children: "On Track" }), _jsx(SelectItem, { value: "needs_attention", children: "Needs Attention" })] })] })] }), isLoading ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "Loading students..." })) : filtered.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No students found." })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2", children: filtered.map((student) => (_jsxs(Card, { className: "p-4 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: student.fullName }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Grade ", student.grade || 'N/A'] })] }), _jsx(Badge, { variant: student.progressStatus === 'needs_attention' ? 'destructive' : 'secondary', children: student.progressStatus === 'needs_attention' ? 'Needs Attention' : 'On Track' })] }), _jsxs("div", { className: "text-sm text-muted-foreground space-y-1", children: [_jsxs("p", { children: ["Courses: ", (student.courseNames || []).join(', ') || '—'] }), _jsxs("p", { children: ["Last session: ", student.lastSessionDate || '—'] })] })] }, student.id))) }))] }));
};
