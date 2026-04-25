import type { FC } from 'react';
import { Button } from '@components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import AppShellHeader from '../../../../components/common/AppShellHeader';

interface LPHeaderProps {
  name: string;
}

export const LPHeader: FC<LPHeaderProps> = ({ name }) => {
  const { clearUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AppShellHeader
      roleLabel="Learning Partner"
      title="Learning Partner Hub"
      subtitle={<>Welcome back, <span className="font-semibold text-slate-900">{name}</span></>}
      actions={
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      }
    />
  );
};
