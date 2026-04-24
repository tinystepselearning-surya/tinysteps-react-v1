import React, { memo } from 'react';
import type { FC } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { cn } from '@components/lib/utils';
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
  actionsOnly?: boolean;
  className?: string;
}

const TeacherHeaderComponent: FC<TeacherHeaderProps> = ({
  name,
  onProfileClick,
  onOpenMenu,
  actionsOnly = false,
  className,
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
    <header
      className={cn(
        'inline-flex max-w-full rounded-2xl border border-slate-200 bg-white/92 px-3 py-2 shadow-sm backdrop-blur sm:px-4',
        className,
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {!actionsOnly ? (
          <div className="flex min-w-0 items-center gap-3">
            <TinyStepsBrand
              subtitle="Teacher Workspace"
              className="rounded-lg px-0 py-0 hover:bg-transparent"
              logoClassName="h-9 w-9"
              titleClassName="text-lg sm:text-xl"
              subtitleClassName="text-[10px] tracking-[0.22em]"
            />
            <h1 className="truncate bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-lg font-semibold tracking-tight text-transparent sm:text-xl">
              Hi, {name || 'Teacher'}
            </h1>
          </div>
        ) : null}

        <div className="flex items-center gap-1 sm:gap-2">
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
