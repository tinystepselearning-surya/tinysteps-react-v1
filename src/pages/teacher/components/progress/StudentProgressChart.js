import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
import { useStudentProgress } from '../../hooks/useStudentProgress';
import { cn } from '@components/lib/utils';
const getBarColor = (value) => {
    if (value >= 67)
        return 'bg-green-500';
    if (value >= 34)
        return 'bg-yellow-400';
    return 'bg-red-400';
};
export const StudentProgressChart = ({ teacherId }) => {
    const { data = [], isLoading } = useStudentProgress(teacherId);
    if (isLoading) {
        return (_jsx(Card, { className: "p-6", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "Loading progress..." }) }));
    }
    if (!data.length) {
        return (_jsx(Card, { className: "p-6", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "No progress data available yet." }) }));
    }
    return (_jsxs(Card, { className: "p-6 space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Student Progress" }), _jsx("div", { className: "space-y-4", children: data.map((student) => {
                    var _a;
                    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "font-medium", children: student.studentName }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Attendance ", (_a = student.attendanceRate) !== null && _a !== void 0 ? _a : 0, "% \u2022 Last session ", student.lastSession || '—'] })] }), ['phonics', 'grammar', 'speaking'].map((topic) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [_jsx("span", { children: topic.charAt(0).toUpperCase() + topic.slice(1) }), _jsxs("span", { children: [student[topic], "%"] })] }), _jsx("div", { className: "h-2 bg-muted rounded-full", children: _jsx("div", { className: cn('h-2 rounded-full', getBarColor(student[topic])), style: { width: `${student[topic]}%` } }) })] }, topic)))] }, student.studentId));
                }) })] }));
};
