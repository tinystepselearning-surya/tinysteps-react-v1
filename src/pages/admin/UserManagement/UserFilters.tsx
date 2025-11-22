import React, { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onFiltersChange: () => void; // Added this property
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onFiltersChange,
}) => {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="flex gap-4 items-center">
      <Input
        placeholder="Search by name or email"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <select
        className="w-[180px] rounded border px-2 py-1 text-sm"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        <option value="all">All Roles</option>
        <option value="admin">Admin</option>
        <option value="teacher">Teacher</option>
        <option value="parent">Parent</option>
        <option value="learningPartner">Learning Partner</option>
        <option value="kid">Kid</option>
      </select>
      <select
        className="w-[180px] rounded border px-2 py-1 text-sm"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="archived">Archived</option>
      </select>
      <Button variant="outline" onClick={() => {
        setSearchTerm('');
        setRoleFilter('all');
        setStatusFilter('all');
        onFiltersChange();
      }}>
        Clear Filters
      </Button>
    </div>
  );
};