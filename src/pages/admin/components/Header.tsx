import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../store/useAuthStore';

interface HeaderProps {
  onOpenMenu?: () => void;
}

const ADMIN_SECTION_LABELS: Record<string, string> = {
  users: 'User Management',
  schools: 'School Partnerships',
  students: 'Students & Enrollments',
  leads: 'Leads & Enquiries',
  // Keep the old query-param title aligned for existing bookmarks while
  // navigation now enters the unified Students & Enrollments workspace.
  enrollments: 'Students & Enrollments',
  'attendance-corrections': 'Attendance Corrections',
  relationships: 'Relationship Management',
  courses: 'Course Management',
  'today-notifications': 'Sessions Management',
  lessons: 'Lesson Library',
  'class-recordings': 'Class Recordings',
  'class-samples': 'Class Samples',
  testimonials: 'Testimonials',
  'parent-worksheets': 'Worksheets & Resources',
  analytics: 'Analytics',
  'teacher-schedule': 'Teacher Schedule',
  settings: 'Settings',
  holidays: 'Holiday Calendar',
  'teacher-payments': 'Teacher Payments',
  'parent-payments': 'Parent Payments',
};

const resolveSectionTitle = (pathname: string, search: string) => {
  if (pathname.includes('/surya/analytics')) return 'Analytics';
  const tab = new URLSearchParams(search).get('tab') || 'users';
  return ADMIN_SECTION_LABELS[tab] || 'Admin Dashboard';
};

export default function Header({ onOpenMenu }: HeaderProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const sectionTitle = useMemo(
    () => resolveSectionTitle(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const displayName = String(user?.displayName || 'Administrator').trim();
  const email = String(user?.email || '').trim();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const { performAppLogout } = await import('../../../lib/auth');
      await performAppLogout('user-clicked-logout');
      navigate('/surya/login', { replace: true });
    } catch (error) {
      console.error('[AdminHeader] Logout failed', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex h-full w-full items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>

          <Link
            to="/surya?tab=users"
            className="flex shrink-0 items-center"
            aria-label="Go to admin dashboard"
          >
            <img src="/logo-header.webp" alt="Tiny Steps" className="h-8 w-auto" />
          </Link>

          <div className="hidden h-7 w-px bg-slate-200 sm:block" aria-hidden="true" />

          <div className="min-w-0 leading-tight">
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">
              Admin Console
            </p>
            <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
              {sectionTitle}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden min-w-0 text-right md:block">
            <p className="max-w-[180px] truncate text-xs font-semibold text-slate-800">{displayName}</p>
            {email ? (
              <p className="max-w-[210px] truncate text-[11px] text-slate-500">{email}</p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 border-slate-200 px-2.5 text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:px-3"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Log out of admin"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{isLoggingOut ? 'Logging out…' : 'Log out'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
