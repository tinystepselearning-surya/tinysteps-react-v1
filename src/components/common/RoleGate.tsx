// src/components/common/RoleGate.tsx

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { isSuperUserEmail } from '../../constants/accessControl';

export type Role = 'admin' | 'teacher' | 'parent' | 'learningPartner' | 'kid';

interface RoleGateProps {
  allowedRoles: Role[];
  loginPath?: string;
  unauthorizedPath?: string;
}

const RoleGate: React.FC<RoleGateProps> = ({
  allowedRoles,
  loginPath = '/login',
  unauthorizedPath = '/unauthorized',
}) => {
  // Ensure auth listener is initialized when RoleGate mounts — this avoids
  // initializing Firebase on purely public pages.
  useAuth();
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  // 1) While auth is loading, show soft loader
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Verifying your access…
        </div>
      </div>
    );
  }

  // 2) No user at all → go to login
  if (!user) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // 3) Determine role & superuser
  const userRole = user.role as Role | undefined;
  const superUser = user.email ? isSuperUserEmail(user.email) : false;
  const canAccess =
    superUser || (!!userRole && allowedRoles.includes(userRole));

  // 4) Wrong role → unauthorized
  if (!canAccess) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  // 5) OK → render nested routes
  return <Outlet />;
};

export default RoleGate;
