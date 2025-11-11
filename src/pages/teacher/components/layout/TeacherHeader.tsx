import React from 'react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { useAuthStore } from '../../../../store/useAuthStore';

interface TeacherHeaderProps {
  name?: string;
  upcomingCount?: number;
}

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({ name, upcomingCount }) => {
  const { clearUser } = useAuthStore();
  const initials = name
    ?.split(' ')
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-bold">{name || 'Teacher'}</h1>
        {typeof upcomingCount === 'number' && (
          <p className="text-sm text-muted-foreground mt-1">
            You have <span className="font-semibold">{upcomingCount}</span> session
            {upcomingCount === 1 ? '' : 's'} today.
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-white/80 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-semibold">
          {initials || 'TT'}
        </div>
        <Button variant="outline" onClick={clearUser}>
          Logout
        </Button>
      </div>
    </Card>
  );
};
