import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  roleFilter: string;
  setRoleFilter: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  onFiltersChange: () => void; // Added this property
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onFiltersChange,
}) => {
  const [search, setSearch] = React.useState(searchTerm);
  const [role, setRole] = React.useState(roleFilter);
  const [status, setStatus] = React.useState(statusFilter);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setSearchTerm(event.target.value);
    onFiltersChange();
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    setRoleFilter(value);
    onFiltersChange();
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setStatusFilter(value);
    onFiltersChange();
  };

  return (
    <div className="flex gap-4">
      <Input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={handleSearchChange}
        className="w-1/2"
      />
      <Select value={role} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-1/4">Role</SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="teacher">Teacher</SelectItem>
          <SelectItem value="parent">Parent</SelectItem>
          <SelectItem value="learningPartner">Learning Partner</SelectItem>
          <SelectItem value="kid">Kid</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-1/4">Status</SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="cta" onClick={onFiltersChange}>
        Apply Filters
      </Button>
    </div>
  );
};

export default UserFilters;