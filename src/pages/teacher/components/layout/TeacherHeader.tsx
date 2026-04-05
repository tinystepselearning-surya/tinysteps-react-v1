import React, { memo } from 'react';
import type { FC } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import {
  CircleUser,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import TinyStepsBrand from '../../../../components/common/TinyStepsBrand';

interface TeacherHeaderProps {
  name?: string;
  onProfileClick?: () => void;
  onOpenMenu?: () => void;
}

const TeacherHeaderComponent: FC<TeacherHeaderProps> = ({
  name,
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
    <header className="rounded-[24px] border border-slate-200 bg-white/92 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <TinyStepsBrand subtitle="Teacher Workspace" />
          <h1 className="truncate bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
            Hi, {name || 'Teacher'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
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

          <Button
            variant="ghost"
            size="icon"
            onClick={onProfileClick}
            title="View profile"
            aria-label="View profile"
            className="h-10 w-10 rounded-full bg-slate-100/80 text-slate-900 ring-1 ring-slate-200 hover:bg-slate-200"
          >
            <CircleUser className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="h-10 w-10 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export const TeacherHeader = memo(TeacherHeaderComponent);
