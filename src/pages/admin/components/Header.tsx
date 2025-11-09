import React from 'react';
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../store/useAuthStore';

interface HeaderProps {
  user: any; // TODO: Define proper user type
}

export default function Header({ user }: HeaderProps) {
  const { clearUser } = useAuthStore();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tiny Steps Admin</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Welcome, {user?.name || user?.email}
          </span>
          <Button variant="outline" onClick={clearUser}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}