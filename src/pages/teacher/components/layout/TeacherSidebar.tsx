import { memo, type FC } from 'react';
import { cn } from '@components/lib/utils';
import TinyStepsBrand from '../../../../components/common/TinyStepsBrand';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  LogOut,
  MessageSquare,
  Users,
  Wallet,
  UserCircle,
} from 'lucide-react';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  active?: string;
  onSelect?: (value: string) => void;
  todayCount?: number;
  messageUnreadCount?: number;
  teacherId?: string;
  teacherName?: string;
  className?: string;
}

const items = [
  { id: 'today', label: "Today's Sessions", icon: CalendarCheck },
  { id: 'demo-assignments', label: 'Demo Classes', icon: ClipboardList },
  { id: 'lessons', label: 'Lesson Library', icon: BookOpen },
  { id: 'upcoming', label: 'Upcoming Sessions', icon: CalendarClock },
  { id: 'students', label: 'My Students', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'holidays', label: 'Holiday Calendar', icon: CalendarRange },
  { id: 'profile', label: 'Profile', icon: UserCircle },
];

const TeacherSidebarComponent: FC<SidebarProps> = ({
  active,
  onSelect,
  todayCount,
  messageUnreadCount,
  teacherName,
  className,
}) => {
  const { clearUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <aside className={cn('w-full shrink-0 lg:w-72', className)}>
      <div className="space-y-4">
        <div className="min-h-[92px] rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <TinyStepsBrand
              subtitle={null}
              className="min-w-0 flex-1 rounded-lg px-0 py-0 hover:bg-transparent"
              logoClassName="h-8 w-8"
              titleClassName="max-w-[130px] truncate whitespace-nowrap text-base"
            />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelect?.('profile')}
                title="View profile"
                aria-label="View profile"
                className="h-8 w-8 rounded-full bg-slate-100/80 text-slate-900 ring-1 ring-slate-200 hover:bg-slate-200"
              >
                <UserCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
                className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-1 truncate bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-base font-semibold text-transparent">
            Hi, {teacherName || 'Teacher'}
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
                {item.id === 'messages' &&
                  typeof messageUnreadCount === 'number' &&
                  messageUnreadCount > 0 && (
                    <span
                      className={cn(
                        'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
                        isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white',
                      )}
                    >
                      {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>

      </div>
    </aside>
  );
};

export const TeacherSidebar = memo(TeacherSidebarComponent);
