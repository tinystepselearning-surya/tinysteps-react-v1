import React from 'react';
import { UserList } from './UserList';

export default function UserManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
      </div>

      <UserList />
    </div>
  );
}