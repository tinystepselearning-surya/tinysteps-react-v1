import React from 'react';
import type { FC } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import {
  ChevronDown,
  CircleUser,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import AppShellHeader from '../../../../components/common/AppShellHeader';

interface TeacherHeaderProps {
  name?: string;
  upcomingCount?: number;
  activeSectionLabel?: string;
  footerContent?: React.ReactNode;
  onProfileClick?: () => void;
  onOpenMenu?: () => void;
}

export const TeacherHeader: FC<TeacherHeaderProps> = ({
  name,
  upcomingCount,
  activeSectionLabel,
  footerContent,
  onProfileClick,
  onOpenMenu,
}) => {
  const { clearUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate('/teacher/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <AppShellHeader
      roleLabel="Teacher"
      title={<>Hi, {name || 'Teacher'}</>}
      subtitle={
        typeof upcomingCount === 'number'
          ? (
            <>
              You have <span className="font-semibold text-slate-900">{upcomingCount}</span> session
              {upcomingCount === 1 ? '' : 's'} today.
            </>
          )
          : 'Stay on top of lessons, student progress, and upcoming sessions.'
      }
      actions={
        <>
          {onOpenMenu ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onOpenMenu}
              className="lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 sm:block">
            <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-400">
              Section
            </span>
            {activeSectionLabel || 'Overview'}
          </div>
          <button
            type="button"
            onClick={onProfileClick}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700"
          >
            <CircleUser className="h-4 w-4" />
            <span className="hidden sm:inline">{name || 'Teacher'}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </>
      }
      footer={footerContent}
    />
  );
};
