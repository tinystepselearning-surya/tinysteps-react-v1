import type { FC } from 'react';
import { cn } from '@components/lib/utils';
import { Button } from '@components/ui/button';

interface SidebarProps {
  active: string;
  onSelect: (value: string) => void;
  todayCount?: number;
  teacherId?: string;
}

const items = [
  { id: 'today', label: "Today's Sessions" },
  { id: 'upcoming', label: 'Upcoming Sessions' },
  { id: 'students', label: 'My Students' },
  { id: 'progress', label: 'Progress' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'messages', label: 'Messages' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
];

export const TeacherSidebar: FC<SidebarProps> = ({ active, onSelect, todayCount, teacherId }) => {
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
        <Button
          asChild
          variant="ghost"
          className="w-full justify-between border border-indigo-100 bg-indigo-50 text-indigo-700"
        >
          <a href={teacherId ? `/teacher/${teacherId}/worksheet-generator` : '/teacher/worksheet-generator'}>
            Worksheet Generator ✨
          </a>
        </Button>
      </div>
    </aside>
  );
};
