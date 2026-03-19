// React default import removed
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebaseConfig';
import { Menu } from 'lucide-react';

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
    <header className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
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
          <p className="text-sm font-medium text-slate-700">Admin</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
        </Button>
      </div>
    </header>
  );
}
