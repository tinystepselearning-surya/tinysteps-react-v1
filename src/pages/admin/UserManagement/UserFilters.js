import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
export const UserFilters = ({ searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter, onFiltersChange, }) => {
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    return (_jsxs("div", { className: "flex gap-4 items-center", children: [_jsx(Input, { placeholder: "Search by name or email", value: searchTerm, onChange: handleSearchChange }), _jsxs(Select, { value: roleFilter, onValueChange: setRoleFilter, children: [_jsx(SelectTrigger, { className: "w-[180px]", children: _jsx(SelectValue, { placeholder: "Filter by role" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Roles" }), _jsx(SelectItem, { value: "admin", children: "Admin" }), _jsx(SelectItem, { value: "teacher", children: "Teacher" }), _jsx(SelectItem, { value: "parent", children: "Parent" })] })] }), _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-[180px]", children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Statuses" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "inactive", children: "Inactive" })] })] }), _jsx(Button, { variant: "outline", onClick: () => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                    onFiltersChange();
                }, children: "Clear Filters" })] }));
};
