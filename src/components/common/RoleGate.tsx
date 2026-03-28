// src/components/common/RoleGate.tsx

import React, { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import useAuth from '../../hooks/useAuth';
import { isSuperUserEmail } from '../../constants/accessControl';
import { useQuery } from '@tanstack/react-query';

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
  useAuth();
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  const superUser = useMemo(
    () => (user?.email ? isSuperUserEmail(user.email) : false),
    [user?.email],
  );

  const shouldResolveRoleFromDb = Boolean(user?.uid) && !superUser;
  const {
    data: latestRole,
    isLoading: roleLoading,
  } = useQuery<Role | null>({
    queryKey: ['auth-role', user?.uid],
    enabled: shouldResolveRoleFromDb,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    queryFn: async () => {
      if (!user?.uid) return null;
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return null;
      const data = snap.data() as { role?: string };
      const resolved = typeof data.role === 'string' ? data.role : null;
      return resolved as Role | null;
    },
  });

  // While validating from Firestore, don't trust potentially stale token claims.
  if (shouldResolveRoleFromDb && latestRole === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Verifying your access…
        </div>
      </div>
    );
  }

  const effectiveRole = latestRole ?? (user?.role as Role | null) ?? null;
  const isAllowed = superUser || (!!effectiveRole && allowedRoles.includes(effectiveRole));

  const shouldDebugRoleGate =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    (window as any).__TS_DEBUG_ROLE_GATE__ === true;

  if (shouldDebugRoleGate) {
    console.debug('[RoleGate] Check access:', {
      allowedRoles,
      effectiveRole,
      latestRole,
      'user.role': user?.role,
      superUser,
      uid: user?.uid,
    });
  }

  // 1) While auth is loading, show soft loader
  // 2) While role is fetching (only when needed), show soft loader
  if (!isAllowed && (isLoading || roleLoading)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Verifying your access…
        </div>
      </div>
    );
  }

  // 3) No user → go to login
  if (!user) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // 4) Wrong role → unauthorized
  if (!isAllowed) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  // 5) OK → render nested routes
  return <Outlet />;
};

export default RoleGate;
