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
      <Select value={roleFilter} onValueChange={(v: string) => setRoleFilter(v)}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="teacher">Teacher</SelectItem>
          <SelectItem value="parent">Parent</SelectItem>
          <SelectItem value="learningPartner">Learning Partner</SelectItem>
          <SelectItem value="kid">Kid</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v)}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
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