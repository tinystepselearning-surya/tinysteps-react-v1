import type { FC } from 'react';
import { Button } from '@components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

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
      navigate('/learning-partner/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Partner Hub</h1>
        <p className="text-muted-foreground">Welcome back, {name}</p>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
};;