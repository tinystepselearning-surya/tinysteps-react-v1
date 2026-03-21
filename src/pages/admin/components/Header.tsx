// React default import removed
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebaseConfig';
import { LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenMenu?: () => void;
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const { clearUser } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate('/surya/login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-11 w-full max-w-[1280px] items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {onOpenMenu ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 lg:hidden"
              onClick={onOpenMenu}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          ) : null}
          <span className="truncate">Tiny Steps Admin Workspace</span>
        </div>

        <Button variant="outline" onClick={handleLogout} className="h-8 gap-2 px-3">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
