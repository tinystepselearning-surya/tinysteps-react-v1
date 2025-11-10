import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { isSuperUserEmail } from '../../constants/accessControl';

interface RoleGateProps {
  allowedRoles: string[];
}

export default function RoleGate({ allowedRoles }: RoleGateProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const superUser = isSuperUserEmail(user?.email);
  const canAccess = !!user && (superUser || allowedRoles.includes(user.role));

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!superUser && !allowedRoles.includes(user.role)) {
      navigate('/unauthorized');
      return;
    }
  }, [user, allowedRoles, navigate, superUser]);

  if (!canAccess) {
    return null;
  }

  return <Outlet />;
}
