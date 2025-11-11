import React from 'react';
import { cn } from '@components/lib/utils';
import { Button } from '@components/ui/button';

interface SidebarProps {
  active: string;
  onSelect: (value: string) => void;
  todayCount?: number;
}

const items = [
  { id: 'today', label: "Today's Sessions" },
  { id: 'students', label: 'My Students' },
  { id: 'progress', label: 'Progress' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'analytics', label: 'Analytics' },
];

export const TeacherSidebar: React.FC<SidebarProps> = ({ active, onSelect, todayCount }) => {
  return (
    <aside className="hidden lg:block w-64 pr-6">
      <div className="space-y-2">
        {items.map((item) => (
          <Button
            key={item.id}
            variant={active === item.id ? 'default' : 'ghost'}
            className={cn('w-full justify-between', active === item.id && 'bg-blue-600 text-white')}
            onClick={() => onSelect(item.id)}
          >
            <span>{item.label}</span>
            {item.id === 'today' && typeof todayCount === 'number' && todayCount > 0 && (
              <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">
                {todayCount}
              </span>
            )}
          </Button>
        ))}
      </div>
    </aside>
  );
};
