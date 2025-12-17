import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@components/lib/utils';
import { Button } from '@components/ui/button';
import { BookOpen } from 'lucide-react';

interface SidebarProps {
  active?: string;
  onSelect?: (value: string) => void;
  todayCount?: number;
  teacherId?: string;
}

const items = [
  { id: 'today', label: "Today's Sessions" },
  { id: 'lessons', label: 'Lesson Library', icon: BookOpen },
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
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={active === item.id ? 'default' : 'ghost'}
              className={cn('w-full justify-start gap-2', active === item.id && 'bg-blue-600 text-white')}
              onClick={() => onSelect?.(item.id)}
              data-testid={item.id === 'lessons' ? 'teacher-tab-lessons' : item.id === 'test' ? 'teacher-tab-test' : undefined}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{item.label}</span>
              {item.id === 'today' && typeof todayCount === 'number' && todayCount > 0 && (
                <span className="ml-auto text-xs bg-white/20 rounded-full px-2 py-0.5">
                  {todayCount}
                </span>
              )}
            </Button>
          );
        })}

        {/* Worksheet Generator removed from sidebar */}
      </div>
    </aside>
  );
};
