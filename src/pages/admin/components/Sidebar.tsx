import { startTransition } from 'react';
import { cn } from '@components/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  BellDot,
  BookCopy,
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardList,
  ContactRound,
  CreditCard,
  FileText,
  GraduationCap,
  Handshake,
  LineChart,
  Settings,
  UserCog,
  Users,
  Wallet,
  CalendarDays,
  MessageSquareQuote,
} from 'lucide-react';

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  onNavigate?: () => void;
}

export default function Sidebar({ selectedTab, onTabChange, className, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const tabs = [
    { id: 'users', label: 'User Management', icon: UserCog },
    { id: 'schools', label: 'School Partnerships', icon: Building2 },
    { id: 'students', label: 'Student Management', icon: GraduationCap },
    { id: 'leads', label: 'Leads & Enquiries', icon: ContactRound },
    { id: 'enrollments', label: 'Enrollment Management', icon: ClipboardList },
    { id: 'attendance-corrections', label: 'Attendance Corrections', icon: ClipboardList },
    { id: 'relationships', label: 'Relationship Management', icon: Handshake },
    { id: 'courses', label: 'Course Management', icon: BookCopy },
    { id: 'today-notifications', label: 'Sessions Management', icon: BellDot },
    { id: 'lessons', label: 'Lesson Library', icon: BookOpen },
    { id: 'class-recordings', label: 'Class Recordings', icon: Users },
    { id: 'class-samples', label: 'Class Samples', icon: Users },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
    { id: 'parent-worksheets', label: 'Parent Worksheets', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'teacher-schedule', label: 'Teacher Schedule', icon: CalendarClock },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'holidays', label: 'Holiday Calendar', icon: CalendarDays },
    { id: 'teacher-payments', label: 'Teacher Payments', icon: Wallet },
    { id: 'parent-payments', label: 'Parent Payments', icon: CreditCard },
  ];

  return (
    <aside className={cn('w-64 border-r border-slate-700 bg-slate-950 text-white px-3 py-4', className)}>
      <h2 className="mb-1 px-2 text-xl font-semibold tracking-tight">Admin Panel</h2>
      <p className="mb-4 px-2 text-xs uppercase tracking-[0.2em] text-slate-400">Operations Console</p>
      <nav className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition',
              selectedTab === tab.id
                ? 'bg-blue-600/90 text-white shadow-sm hover:bg-blue-500'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
            onClick={() => {
              startTransition(() => {
                onTabChange(tab.id);
                navigate(`/surya?tab=${tab.id}`);
                onNavigate?.();
              });
            }}
          >
            <tab.icon
              className={cn(
                'h-4 w-4',
                selectedTab === tab.id ? 'text-white' : 'text-slate-400'
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
