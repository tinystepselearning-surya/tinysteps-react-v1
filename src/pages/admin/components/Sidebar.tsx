import { startTransition } from 'react';
import { cn } from '@components/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  BellDot,
  BookCopy,
  BookOpen,
  BookOpenCheck,
  Building2,
  ClipboardList,
  ContactRound,
  CreditCard,
  FileText,
  GraduationCap,
  Handshake,
  LineChart,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  CalendarDays,
  MessageSquareQuote,
} from 'lucide-react';

export type AdminSidebarTab = {
  id: string;
  label: string;
  icon: typeof UserCog;
};

export const ADMIN_SIDEBAR_TABS: AdminSidebarTab[] = [
    { id: 'users', label: 'User Management', icon: UserCog },
    { id: 'schools', label: 'School Partnerships', icon: Building2 },
    { id: 'students', label: 'Students & Enrollments', icon: GraduationCap },
    { id: 'leads', label: 'Leads & Enquiries', icon: ContactRound },
    { id: 'attendance-corrections', label: 'Attendance Corrections', icon: ClipboardList },
    { id: 'attendance-validation', label: 'Attendance Validation', icon: ShieldCheck },
    { id: 'relationships', label: 'Relationship Management', icon: Handshake },
    { id: 'courses', label: 'Course Management', icon: BookCopy },
    { id: 'today-notifications', label: 'Sessions Management', icon: BellDot },
    { id: 'lessons', label: 'Lesson Library', icon: BookOpen },
    { id: 'class-recordings', label: 'Class Recordings', icon: Users },
    { id: 'class-samples', label: 'Class Samples', icon: Users },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
    { id: 'parent-worksheets', label: 'Worksheets & Resources', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'holidays', label: 'Holiday Calendar', icon: CalendarDays },
    { id: 'teacher-payments', label: 'Teacher Payments', icon: Wallet },
  { id: 'parent-payments', label: 'Parent Payments', icon: CreditCard },
];

const FOUNDER_SIDEBAR_TABS: AdminSidebarTab[] = [
  { id: 'editorial-reviews', label: 'Editorial Reviews', icon: BookOpenCheck },
  ...ADMIN_SIDEBAR_TABS.filter((tab) =>
    !['users', 'attendance-corrections', 'today-notifications', 'settings', 'relationships'].includes(tab.id),
  ),
];

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  onNavigate?: () => void;
  portal?: 'admin' | 'founder';
}

export default function Sidebar({
  selectedTab,
  onTabChange,
  className,
  onNavigate,
  portal = 'admin',
}: SidebarProps) {
  const navigate = useNavigate();
  const tabs = portal === 'founder' ? FOUNDER_SIDEBAR_TABS : ADMIN_SIDEBAR_TABS;
  const basePath = portal === 'founder' ? '/founder' : '/surya';

  return (
    <aside className={cn('w-64 border-r border-slate-700 bg-slate-950 text-white px-3 py-4', className)}>
      <h2 className="mb-1 px-2 text-xl font-semibold tracking-tight">
        {portal === 'founder' ? 'Founder' : 'Admin Panel'}
      </h2>
      <p className="mb-4 px-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        {portal === 'founder' ? 'Management View' : 'Operations Console'}
      </p>
      <nav className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition',
              selectedTab === tab.id || (tab.id === 'students' && selectedTab === 'enrollments')
                ? 'bg-blue-600/90 text-white shadow-sm hover:bg-blue-500'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
            onClick={() => {
              startTransition(() => {
                onTabChange(tab.id);
                navigate(`${basePath}?tab=${tab.id}`);
                onNavigate?.();
              });
            }}
          >
            <tab.icon
              className={cn(
                'h-4 w-4',
                selectedTab === tab.id || (tab.id === 'students' && selectedTab === 'enrollments')
                  ? 'text-white'
                  : 'text-slate-400'
              )}
              aria-hidden="true"
            />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
