import type { FC } from 'react';
import { Button } from '../ui/button';
import { Bell, Search, Settings, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const TeacherHeader: FC = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-gray-900">Welcome back, {user?.displayName || 'Teacher'}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          <Search className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </Button>

        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>

        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {user?.displayName?.charAt(0) || 'T'}
        </div>
      </div>
    </header>
  );
};

export default TeacherHeader;