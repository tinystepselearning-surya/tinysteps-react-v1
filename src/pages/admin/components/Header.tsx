// React default import removed
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebaseConfig';
import AppShellHeader from '../../../components/common/AppShellHeader';
import { Menu } from 'lucide-react';

interface HeaderProps {
  user: any; // TODO: Define proper user type
  onOpenMenu?: () => void;
}

export default function Header({ user, onOpenMenu }: HeaderProps) {
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
    <AppShellHeader
      roleLabel="Admin"
      title="Tiny Steps Admin"
      subtitle={
        <>
          Welcome, <span className="font-semibold text-slate-900">{user?.name || user?.email}</span>
        </>
      }
      actions={
        <>
          {onOpenMenu ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={onOpenMenu}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          ) : null}
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </>
      }
    />
  );
}
