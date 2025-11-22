import type { FC } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';

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
  }
  return (
    <Card className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-rose-50 to-orange-50 dark:from-slate-900 dark:to-slate-800">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-bold">{name || 'Parent'}</h1>
        {typeof totalChildren === 'number' && (
          <p className="text-sm text-muted-foreground mt-1">
            Managing <span className="font-semibold">{totalChildren}</span> child{totalChildren === 1 ? '' : 'ren'}.
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="default" onClick={onOpenKidsView}>Kids Page</Button>
        <Button variant="outline">Edit Profile</Button>
        <Button variant="secondary">Payment Methods</Button>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
    </Card>
  );
};
