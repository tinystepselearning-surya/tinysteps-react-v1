import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ROLE_REDIRECT_PATHS } from '../../constants/roles';
import { isNativeCapacitorRuntime } from '../../lib/nativeAuthDiagnostics';
import useAuthStore from '../../store/useAuthStore';

/**
 * The native application always starts at /login. Firebase restores an
 * existing durable session asynchronously, so the login form must not be
 * treated as proof of logout while authStatus is "initializing".
 *
 * Never trust the persisted Zustand profile by itself: only a Firebase
 * onAuthStateChanged confirmation can set authStatus="authenticated".
 * RoleGate still enforces role/authorization rules on the destination.
 */
export default function NativeLoginSessionGate({ children }: { children: ReactNode }) {
  const authStatus = useAuthStore((state) => state.authStatus);
  const user = useAuthStore((state) => state.user);

  if (!isNativeCapacitorRuntime()) return <>{children}</>;

  if (authStatus === 'initializing') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[100svh] items-center justify-center bg-slate-50 p-6 text-center text-sm font-medium text-slate-600"
      >
        Restoring your Tiny Steps session…
      </div>
    );
  }

  if (authStatus === 'authenticated' && user) {
    return <Navigate to={ROLE_REDIRECT_PATHS[user.role] || '/'} replace />;
  }

  // Firebase has confirmed that no valid account was restored.
  return <>{children}</>;
}
