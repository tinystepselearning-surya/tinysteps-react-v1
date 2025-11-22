// React import removed (unused)
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { isSuperUserEmail } from '../../constants/accessControl';

interface RoleGateProps {
  allowedRoles: string[];
  loginPath?: string;
  unauthorizedPath?: string;
}

export default function RoleGate({ allowedRoles, loginPath = '/login', unauthorizedPath = '/unauthorized' }: RoleGateProps) {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const superUser = isSuperUserEmail(user?.email);
  const canAccess = !!user && (superUser || allowedRoles.includes(user?.role));

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      navigate(loginPath, { replace: true, state: { from: location.pathname } });
      return;
    }

    if (!superUser && !allowedRoles.includes(user.role)) {
      navigate(unauthorizedPath, { replace: true });
      return;
    }
  }, [user, allowedRoles, navigate, superUser, isLoading, loginPath, unauthorizedPath, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-gray-500">
        Verifying your access…
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return <Outlet />;
}
