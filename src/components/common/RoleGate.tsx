// src/components/common/RoleGate.tsx

import React, { useEffect, useMemo, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { isSuperUserEmail } from '../../constants/accessControl';
import { useQuery } from '@tanstack/react-query';
import { isNativeCapacitorRuntime } from '../../lib/nativeAuthDiagnostics';
import {
  normalizeAuthRole,
  type AuthRole,
} from '../../constants/roles';

export type Role = AuthRole;

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
  const { user, authStatus } = useAuthStore();
  const location = useLocation();

  const superUser = useMemo(
    () => (user?.email ? isSuperUserEmail(user.email) : false),
    [user?.email],
  );

  const shouldResolveRoleFromDb = Boolean(user?.uid) && !superUser;
  const {
    data: latestRole,
    isLoading: roleLoading,
    isError: roleError,
  } = useQuery<Role | null>({
    queryKey: ['auth-role', user?.uid],
    enabled: shouldResolveRoleFromDb && authStatus === 'authenticated',
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
      return normalizeAuthRole(data.role);
    },
  });

  const claimedRole = normalizeAuthRole(user?.role);
  const effectiveRole = latestRole ?? claimedRole;
  const isAllowed = superUser || (!!effectiveRole && allowedRoles.includes(effectiveRole));
  const claimedRoleIsAllowed =
    superUser || (!!claimedRole && allowedRoles.includes(claimedRole));
  const roleQueryStatus: 'idle' | 'loading' | 'success' | 'error' =
    !shouldResolveRoleFromDb || authStatus !== 'authenticated'
      ? 'idle'
      : roleLoading
        ? 'loading'
        : roleError
          ? 'error'
          : 'success';
  const decision: 'verify' | 'allow' | 'login' | 'unauthorized' =
    authStatus === 'initializing'
      ? 'verify'
      : authStatus === 'unauthenticated' || !user
        ? 'login'
        : !claimedRoleIsAllowed && !isAllowed && roleLoading
          ? 'verify'
          : !isAllowed
            ? 'unauthorized'
            : 'allow';
  const lastDecisionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isNativeCapacitorRuntime()) return;
    const diagnostic = {
      authStatus,
      hasUser: Boolean(user),
      effectiveRole,
      roleQueryStatus,
      decision,
    };
    const diagnosticKey = JSON.stringify(diagnostic);
    if (lastDecisionRef.current === diagnosticKey) return;
    lastDecisionRef.current = diagnosticKey;
    console.info('[role-gate] decision', diagnostic);
  }, [authStatus, decision, effectiveRole, roleQueryStatus, user]);

  if (decision === 'verify') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Verifying your access…
        </div>
      </div>
    );
  }

  if (decision === 'login') {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Wrong role → unauthorized
  if (decision === 'unauthorized') {
    return <Navigate to={unauthorizedPath} replace />;
  }

  // OK → render nested routes
  return <Outlet />;
};

export default RoleGate;
