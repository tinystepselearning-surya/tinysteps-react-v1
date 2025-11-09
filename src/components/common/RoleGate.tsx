import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

interface RoleGateProps {
  allowedRoles: string[];
}

export default function RoleGate({ allowedRoles }: RoleGateProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      navigate('/unauthorized');
      return;
    }
  }, [user, allowedRoles, navigate]);

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <Outlet />;
}