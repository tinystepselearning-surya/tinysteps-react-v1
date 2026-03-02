import React from 'react';
import type { FC } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import {
  Bell,
  ChevronDown,
  CircleUser,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface TeacherHeaderProps {
  name?: string;
  upcomingCount?: number;
  activeSectionLabel?: string;
  onToggleNotifications?: () => void;
  onProfileClick?: () => void;
}

export const TeacherHeader: FC<TeacherHeaderProps> = ({
  name,
  upcomingCount,
  activeSectionLabel,
  onToggleNotifications,
  onProfileClick,
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
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Teacher Dashboard
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Hi, {name || 'Teacher'}
          </h1>
          {typeof upcomingCount === 'number' && (
            <p className="text-sm text-slate-600">
              You have <span className="font-semibold">{upcomingCount}</span> session
              {upcomingCount === 1 ? '' : 's'} today.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
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
            {name || 'Teacher'}
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-[10px] font-semibold text-white flex items-center justify-center">
              2
            </span>
          </button>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};
