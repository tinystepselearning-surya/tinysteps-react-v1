import type { FC } from 'react';
import { Button } from '@components/ui/button';
import { performAppLogout } from '../../../../lib/auth';
import { useNavigate } from 'react-router-dom';
import AppShellHeader from '../../../../components/common/AppShellHeader';

interface LPHeaderProps {
  name: string;
}

export const LPHeader: FC<LPHeaderProps> = ({ name }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await performAppLogout('user-clicked-logout');
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
