import type { FC } from 'react';
import { cn } from '@components/lib/utils';
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Users,
  Wallet,
  UserCircle,
} from 'lucide-react';

interface SidebarProps {
  active?: string;
  onSelect?: (value: string) => void;
  todayCount?: number;
  teacherId?: string;
  className?: string;
}

const items = [
  { id: 'today', label: "Today's Sessions", icon: CalendarCheck },
  { id: 'demo-assignments', label: 'Demo Classes', icon: ClipboardList },
  { id: 'lessons', label: 'Lesson Library', icon: BookOpen },
  { id: 'upcoming', label: 'Upcoming Sessions', icon: CalendarClock },
  { id: 'students', label: 'My Students', icon: Users },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'profile', label: 'Profile', icon: UserCircle },
];

export const TeacherSidebar: FC<SidebarProps> = ({ active, onSelect, todayCount, className }) => {
  return (
    <aside className={cn('w-full lg:w-72', className)}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Teacher Portal</div>
          <div className="mt-2 text-sm font-semibold text-slate-900">
            Plan sessions, update progress, and track earnings.
          </div>
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Sessions today: <span className="font-semibold text-slate-900">{todayCount ?? 0}</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect?.(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
                data-testid={item.id === 'lessons' ? 'teacher-tab-lessons' : undefined}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {item.id === 'today' && typeof todayCount === 'number' && todayCount > 0 && (
                  <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                    {todayCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-500">
          <div className="mb-1 font-semibold text-slate-700">Teaching pulse</div>
          Stay on top of sessions, student progress, and follow-ups.
        </div>
      </div>
    </aside>
  );
};
