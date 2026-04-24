import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isSuperUserEmail } from '../../constants/accessControl';
import { useAuthStore } from '../../store/useAuthStore';
import MessagesPanel from './MessagesPanel';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuthStore();

  const backPath = useMemo(() => {
    const role = String(user?.role || '').trim().toLowerCase();
    if (isSuperUserEmail(user?.email) || role === 'admin') return '/surya';
    if (role === 'teacher') return '/teacher';
    if (role === 'learningpartner' || role === 'learning-partner') {
      return '/learning-partner/dashboard';
    }
    return '/parent';
  }, [user?.email, user?.role]);

  return (
    <MessagesPanel
      routeThreadId={threadId || null}
      onThreadChange={(nextThreadId) => {
        if (nextThreadId) {
          navigate(`/messages/${nextThreadId}`);
          return;
        }
        navigate('/messages');
      }}
      onBack={() => navigate(backPath)}
    />
  );
}
