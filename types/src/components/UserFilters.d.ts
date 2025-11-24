import React from "react";
export interface UserFiltersProps {
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    roleFilter: string;
    setRoleFilter: React.Dispatch<React.SetStateAction<string>>;
    statusFilter: string;
    setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
    onFiltersChange: () => void;
}
declare const UserFilters: React.FC<UserFiltersProps>;
export default UserFilters;
