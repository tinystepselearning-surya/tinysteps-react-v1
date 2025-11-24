import React from 'react';
interface UserFiltersProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    roleFilter: string;
    setRoleFilter: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    onFiltersChange: () => void;
}
export declare const UserFilters: React.FC<UserFiltersProps>;
export {};
