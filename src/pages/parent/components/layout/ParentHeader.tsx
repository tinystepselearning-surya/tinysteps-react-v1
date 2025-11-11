import React from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../../store/useAuthStore';

interface ParentHeaderProps {
  name?: string;
  totalChildren?: number;
}

export const ParentHeader: React.FC<ParentHeaderProps> = ({ name, totalChildren }) => {
  const { clearUser } = useAuthStore();
  return (
    <Card className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-rose-50 to-orange-50 dark:from-slate-900 dark:to-slate-800">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-bold">{name || 'Parent'}</h1>
        {typeof totalChildren === 'number' && (
          <p className="text-sm text-muted-foreground mt-1">
            Managing <span className="font-semibold">{totalChildren}</span> child{totalChildren === 1 ? '' : 'ren'}.
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline">Edit Profile</Button>
        <Button variant="secondary">Payment Methods</Button>
        <Button variant="outline" onClick={clearUser}>Logout</Button>
      </div>
    </Card>
  );
};
