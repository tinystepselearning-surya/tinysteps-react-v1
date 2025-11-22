// src/components/common/RoleGate.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { isSuperUserEmail } from '../../constants/accessControl';

type Role = 'admin' | 'teacher' | 'parent' | 'learningPartner' | 'kid';

interface RoleGateProps {
  allowedRoles: Role[];
  loginPath?: string;
  unauthorizedPath?: string;
}

export default function RoleGate({
  allowedRoles,
  loginPath = '/login',
  unauthorizedPath = '/unauthorized',
}: RoleGateProps) {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  // 1) While auth is loading, don’t decide yet
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-gray-500">
        Verifying your access…
      </div>
    );
  }

  // 2) If there is no user at all, go to login
  if (!user) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // 3) Derive role from user (supports both `role` and `roles[0]`)
  const rawRole =
    (user as any).role ||
    (Array.isArray((user as any).roles) ? (user as any).roles[0] : undefined) ||
    (user as any).customClaims?.role;

  const userRole = rawRole as Role | undefined;
  const superUser = isSuperUserEmail(user.email);
  const canAccess = superUser || (!!userRole && allowedRoles.includes(userRole));

  console.log('[RoleGate]', {
    email: user.email,
    userRole,
    allowedRoles,
    superUser,
    canAccess,
  });

  // 4) If wrong role, show unauthorized
  if (!canAccess) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  // 5) Otherwise render the protected child routes
  return <Outlet />;
}
