import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useCourses, useCourseEnrollments } from '../../../hooks/useData';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import { ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from 'lucide-react';
export default function CourseList({ onViewCourse, onEditCourse, onDeleteCourse, onCreateCourse }) {
    const [filters, setFilters] = useState({
        area: '',
        level: '',
        status: '',
        search: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const { data: courses = [], isLoading, error } = useCourses({
        area: filters.area || undefined,
        level: filters.level ? parseInt(filters.level) : undefined,
        status: filters.status || undefined,
        search: filters.search || undefined
    });
    const getAreaColor = (area) => {
        switch (area) {
            case 'Phonics': return 'bg-blue-100 text-blue-800';
            case 'Grammar': return 'bg-green-100 text-green-800';
            case 'Speaking': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-yellow-100 text-yellow-800';
            case 'draft': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const formatTargetAge = (ages) => {
        if (!ages || ages.length === 0)
            return 'N/A';
        const min = Math.min(...ages);
        const max = Math.max(...ages);
        return min === max ? `${min}` : `${min}-${max}`;
    };
    const formatTargetGrade = (grades) => {
        if (!grades || grades.length === 0)
            return 'N/A';
        return grades.join(', ');
    };
    // Pagination
    const totalPages = Math.ceil(courses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCourses = courses.slice(startIndex, startIndex + itemsPerPage);
    if (isLoading) {
        return _jsx("div", { className: "flex justify-center p-8", children: "Loading courses..." });
    }
    if (error) {
        return _jsxs("div", { className: "text-red-600 p-4", children: ["Error loading courses: ", error.message] });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Area" }), _jsxs(Select, { value: filters.area || 'all', onValueChange: (value) => setFilters(Object.assign(Object.assign({}, filters), { area: value === 'all' ? '' : value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "All Areas" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Areas" }), _jsx(SelectItem, { value: "Phonics", children: "Phonics" }), _jsx(SelectItem, { value: "Grammar", children: "Grammar" }), _jsx(SelectItem, { value: "Speaking", children: "Speaking" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Level" }), _jsxs(Select, { value: filters.level || 'all', onValueChange: (value) => setFilters(Object.assign(Object.assign({}, filters), { level: value === 'all' ? '' : value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "All Levels" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Levels" }), Array.from({ length: 8 }, (_, i) => (_jsx(SelectItem, { value: (i + 1).toString(), children: i + 1 }, i + 1)))] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Status" }), _jsxs(Select, { value: filters.status || 'all', onValueChange: (value) => setFilters(Object.assign(Object.assign({}, filters), { status: value === 'all' ? '' : value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "All Status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "inactive", children: "Inactive" }), _jsx(SelectItem, { value: "draft", children: "Draft" })] })] })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Search" }), _jsx(Input, { placeholder: "Search courses...", value: filters.search, onChange: (e) => setFilters(Object.assign(Object.assign({}, filters), { search: e.target.value })) })] })] }) }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "text-sm text-gray-600", children: ["Showing ", startIndex + 1, "-", Math.min(startIndex + itemsPerPage, courses.length), " of ", courses.length, " courses"] }), onCreateCourse && (_jsx(Button, { onClick: onCreateCourse, children: "Create New Course" }))] }), _jsx(Card, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Course Name" }), _jsx(TableHead, { children: "Area" }), _jsx(TableHead, { children: "Level" }), _jsx(TableHead, { children: "Target Age/Grade" }), _jsx(TableHead, { children: "Rate/Session" }), _jsx(TableHead, { children: "Active Students" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: paginatedCourses.map((course) => (_jsx(CourseRow, { course: course, onView: onViewCourse, onEdit: onEditCourse, onDelete: onDeleteCourse }, course.id))) })] }) }), totalPages > 1 && (_jsxs("div", { className: "flex justify-center items-center gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, children: [_jsx(ChevronLeft, { className: "h-4 w-4" }), "Previous"] }), _jsxs("span", { className: "text-sm", children: ["Page ", currentPage, " of ", totalPages] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)), disabled: currentPage === totalPages, children: ["Next", _jsx(ChevronRight, { className: "h-4 w-4" })] })] }))] }));
}
function CourseRow({ course, onView, onEdit, onDelete }) {
    var _a, _b;
    const { data: enrollments = [] } = useCourseEnrollments(course.id || '');
    const activeStudents = enrollments.filter(e => e.status === 'active').length;
    const getAreaColor = (area) => {
        switch (area) {
            case 'Phonics': return 'bg-blue-100 text-blue-800';
            case 'Grammar': return 'bg-green-100 text-green-800';
            case 'Speaking': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-yellow-100 text-yellow-800';
            case 'draft': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: course.name }), _jsx(TableCell, { children: _jsx(Badge, { className: getAreaColor(course.area), children: course.area }) }), _jsx(TableCell, { children: course.level }), _jsx(TableCell, { children: _jsxs("div", { className: "text-sm", children: [_jsxs("div", { children: ["Ages: ", ((_a = course.targetAge) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'N/A'] }), _jsx("div", { className: "text-gray-500", children: ((_b = course.targetGrade) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'N/A' })] }) }), _jsxs(TableCell, { children: ["\u20B9", course.ratePerSession] }), _jsx(TableCell, { children: activeStudents }), _jsx(TableCell, { children: _jsx(Badge, { className: getStatusColor(course.status), children: course.status }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex gap-2", children: [onView && (_jsx(Button, { size: "sm", variant: "outline", onClick: () => onView(course.id), children: _jsx(Eye, { className: "h-4 w-4" }) })), onEdit && (_jsx(Button, { size: "sm", variant: "outline", onClick: () => onEdit(course.id), children: _jsx(Edit, { className: "h-4 w-4" }) })), onDelete && (_jsx(Button, { size: "sm", variant: "destructive", onClick: () => onDelete(course.id), children: _jsx(Trash2, { className: "h-4 w-4" }) }))] }) })] }));
}
