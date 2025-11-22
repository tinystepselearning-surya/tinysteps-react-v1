import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useProgress } from '../../hooks/useProgress';
const StudentProgressView = () => {
    var _a;
    const { students, progressData, loading, error } = useProgress();
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || student.progressStatus === filterStatus;
        return matchesSearch && matchesFilter;
    });
    const getStudentProgress = (studentId) => {
        return progressData.find(p => p.studentId === studentId);
    };
    const ProgressBar = ({ value, label }) => (_jsxs("div", { className: "mb-2", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: label }), _jsxs("span", { children: [value, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: `${value}%` } }) })] }));
    if (loading) {
        return _jsx("div", { className: "p-6", children: "Loading student progress..." });
    }
    if (error) {
        return _jsxs("div", { className: "p-6 text-red-600", children: ["Error: ", error] });
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsx("h1", { className: "text-2xl font-bold", children: "Student Progress" }) }), _jsxs(Tabs, { defaultValue: "list", className: "w-full", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "list", children: "All Students" }), _jsx(TabsTrigger, { value: "detail", disabled: !selectedStudent, children: "Student Detail" })] }), _jsxs(TabsContent, { value: "list", className: "space-y-4", children: [_jsxs("div", { className: "flex gap-4 mb-4", children: [_jsx(Input, { placeholder: "Search students...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "max-w-sm" }), _jsxs(Select, { value: filterStatus, onValueChange: setFilterStatus, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Students" }), _jsx(SelectItem, { value: "on_track", children: "On Track" }), _jsx(SelectItem, { value: "needs_attention", children: "Needs Attention" })] })] })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: filteredStudents.map((student) => {
                                    var _a;
                                    const progress = getStudentProgress(student.id);
                                    return (_jsxs(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: student.fullName }), _jsx(Badge, { variant: student.progressStatus === 'on_track' ? 'default' : 'destructive', children: student.progressStatus === 'on_track' ? 'On Track' : 'Needs Attention' })] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Grade: ", student.grade || 'N/A'] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Courses: ", ((_a = student.courseNames) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'None'] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Last Session: ", student.lastSessionDate || 'N/A'] }), progress && (_jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-sm font-medium mb-2", children: "Quick Progress:" }), _jsx(ProgressBar, { value: progress.phonics, label: "Phonics" }), _jsx(ProgressBar, { value: progress.grammar, label: "Grammar" }), _jsx(ProgressBar, { value: progress.speaking, label: "Speaking" })] }))] }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-4 w-full", onClick: () => setSelectedStudent(student), children: "View Details" })] })] }, student.id));
                                }) })] }), _jsx(TabsContent, { value: "detail", className: "space-y-4", children: selectedStudent && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-xl font-semibold", children: [selectedStudent.fullName, "'s Progress"] }), _jsx(Button, { variant: "outline", onClick: () => setSelectedStudent(null), children: "Back to List" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Student Information" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Grade:" }), " ", selectedStudent.grade || 'N/A'] }), _jsxs("p", { children: [_jsx("strong", { children: "Courses:" }), " ", ((_a = selectedStudent.courseNames) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'None'] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), _jsx(Badge, { variant: selectedStudent.progressStatus === 'on_track' ? 'default' : 'destructive', className: "ml-2", children: selectedStudent.progressStatus === 'on_track' ? 'On Track' : 'Needs Attention' })] }), _jsxs("p", { children: [_jsx("strong", { children: "Last Session:" }), " ", selectedStudent.lastSessionDate || 'N/A'] })] })] }), (() => {
                                    const progress = getStudentProgress(selectedStudent.id);
                                    if (!progress) {
                                        return (_jsx(Card, { children: _jsx(CardContent, { className: "p-6 text-center text-gray-500", children: "No progress data available for this student." }) }));
                                    }
                                    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Progress Charts" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-3", children: "Subject Progress" }), _jsx(ProgressBar, { value: progress.phonics, label: "Phonics" }), _jsx(ProgressBar, { value: progress.grammar, label: "Grammar" }), _jsx(ProgressBar, { value: progress.speaking, label: "Speaking" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mt-6", children: [_jsxs("div", { className: "text-center p-4 bg-blue-50 rounded-lg", children: [_jsxs("div", { className: "text-2xl font-bold text-blue-600", children: [progress.attendanceRate, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Attendance Rate" })] }), _jsxs("div", { className: "text-center p-4 bg-green-50 rounded-lg", children: [_jsxs("div", { className: "text-2xl font-bold text-green-600", children: [Math.round((progress.phonics + progress.grammar + progress.speaking) / 3), "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Average Progress" })] })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "font-medium mb-3", children: "Recent Activity" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Last session: ", progress.lastSession || 'N/A'] })] })] })] }));
                                })()] })) })] })] }));
};
export default StudentProgressView;
