import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { useParentChildren } from '../../hooks/useParentChildren';
import { useAuthStore } from '../../../../store/useAuthStore';
const ChildrenManagement = () => {
    const { user } = useAuthStore();
    const { data: children = [], isLoading } = useParentChildren(user === null || user === void 0 ? void 0 : user.uid);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterStatus, setFilterStatus] = useState('all');
    const filteredAndSortedChildren = children
        .filter(child => {
        const matchesSearch = child.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || child.status === filterStatus;
        return matchesSearch && matchesFilter;
    })
        .sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.fullName.localeCompare(b.fullName);
            case 'status':
                return (a.status || '').localeCompare(b.status || '');
            case 'lastActive':
                // For now, sort by name as we don't have lastSessionDate
                return a.fullName.localeCompare(b.fullName);
            default:
                return 0;
        }
    });
    const ProgressBar = ({ value, label }) => (_jsxs("div", { className: "mb-2", children: [_jsxs("div", { className: "flex justify-between text-xs mb-1", children: [_jsx("span", { children: label }), _jsxs("span", { children: [value, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-1.5", children: _jsx("div", { className: "bg-blue-600 h-1.5 rounded-full", style: { width: `${value}%` } }) })] }));
    if (isLoading) {
        return _jsx("div", { className: "p-6", children: "Loading children..." });
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Children Management" }), _jsx(Button, { children: "Add New Child" })] }), _jsxs("div", { className: "flex gap-4 mb-6", children: [_jsx(Input, { placeholder: "Search children...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "max-w-sm" }), _jsxs(Select, { value: sortBy, onValueChange: setSortBy, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "Sort by" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "name", children: "Name" }), _jsx(SelectItem, { value: "status", children: "Status" }), _jsx(SelectItem, { value: "lastActive", children: "Last Active" })] })] }), _jsxs(Select, { value: filterStatus, onValueChange: setFilterStatus, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "inactive", children: "Inactive" }), _jsx(SelectItem, { value: "completed", children: "Completed" })] })] })] }), _jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: filteredAndSortedChildren.map((child) => {
                    var _a;
                    return (_jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsx(CardHeader, { className: "pb-4", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600", children: child.fullName.charAt(0) }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg", children: child.fullName }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Grade ", child.grade] }), _jsx(Badge, { variant: child.status === 'active' ? 'default' : 'secondary', children: child.status === 'active' ? '🟢 Active' : child.status })] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Grade" }), _jsxs("p", { className: "font-medium", children: ["Grade ", child.grade || 'N/A'] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Enrolled Courses" }), _jsxs("p", { className: "font-medium", children: [((_a = child.courses) === null || _a === void 0 ? void 0 : _a.length) || 0, " courses"] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium mb-2", children: "Progress" }), _jsx(ProgressBar, { value: child.phonicsMastery || 0, label: "Phonics" }), _jsx(ProgressBar, { value: child.grammarMastery || 0, label: "Grammar" }), _jsx(ProgressBar, { value: child.speakingMastery || 0, label: "Speaking" })] }), _jsx("div", { className: "text-sm text-gray-600", children: _jsxs("p", { children: ["Status: ", child.status || 'Active'] }) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", children: "View Details" }), _jsx(Button, { variant: "outline", size: "sm", children: "View Progress" }), _jsx(Button, { variant: "outline", size: "sm", children: "View Sessions" }), _jsx(Button, { variant: "outline", size: "sm", children: "Edit Info" }), _jsx(Button, { variant: "outline", size: "sm", children: "Add New Course" })] })] })] }, child.id));
                }) })] }));
};
export default ChildrenManagement;
