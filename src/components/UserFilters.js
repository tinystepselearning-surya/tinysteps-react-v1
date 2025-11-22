import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
const UserFilters = ({ searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter, onFiltersChange, }) => {
    const [search, setSearch] = React.useState(searchTerm);
    const [role, setRole] = React.useState(roleFilter);
    const [status, setStatus] = React.useState(statusFilter);
    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setSearchTerm(event.target.value);
        onFiltersChange();
    };
    const handleRoleChange = (value) => {
        setRole(value);
        setRoleFilter(value);
        onFiltersChange();
    };
    const handleStatusChange = (value) => {
        setStatus(value);
        setStatusFilter(value);
        onFiltersChange();
    };
    return (_jsxs("div", { className: "flex gap-4", children: [_jsx(Input, { type: "text", placeholder: "Search users...", value: search, onChange: handleSearchChange, className: "w-1/2" }), _jsxs(Select, { onValueChange: handleRoleChange, children: [_jsx(SelectTrigger, { className: "w-1/4", children: "Role" }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Roles" }), _jsx(SelectItem, { value: "admin", children: "Admin" }), _jsx(SelectItem, { value: "teacher", children: "Teacher" }), _jsx(SelectItem, { value: "parent", children: "Parent" })] })] }), _jsxs(Select, { onValueChange: handleStatusChange, children: [_jsx(SelectTrigger, { className: "w-1/4", children: "Status" }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Statuses" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "inactive", children: "Inactive" })] })] }), _jsx(Button, { variant: "cta", onClick: onFiltersChange, children: "Apply Filters" })] }));
};
export default UserFilters;
