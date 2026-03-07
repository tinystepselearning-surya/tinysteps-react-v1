import type { FC } from 'react';
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import AppShellHeader from '../../../../components/common/AppShellHeader';

interface ParentHeaderProps {
  name?: string;
  totalChildren?: number;
  onOpenKidsView?: () => void;
}

export const ParentHeader: FC<ParentHeaderProps> = ({ name, totalChildren, onOpenKidsView }) => {
  const { clearUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate('/parent/login');
    } catch (error) {
      console.error('Logout error: ', error);
    }
  };
  return (
    <AppShellHeader
      roleLabel="Parent"
      title={`Welcome back, ${name || 'Parent'}`}
      subtitle={
        typeof totalChildren === 'number'
          ? (
            <>
              Managing <span className="font-semibold text-slate-900">{totalChildren}</span> child
              {totalChildren === 1 ? '' : 'ren'}.
            </>
          )
          : 'Track classes, progress, and payments in one place.'
      }
      className="bg-gradient-to-r from-rose-50 via-white to-orange-50 dark:from-slate-900 dark:to-slate-800"
      actions={
        <>
          {onOpenKidsView ? <Button variant="default" onClick={onOpenKidsView}>Kids Page</Button> : null}
          <Button variant="outline" onClick={() => navigate('/parent/profile')}>Edit Profile</Button>
          <Button variant="secondary" onClick={() => navigate('/parent/payments')}>Payment Methods</Button>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </>
      }
    />
  );
};
