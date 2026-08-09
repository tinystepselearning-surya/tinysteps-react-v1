// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isNativeCapacitorRuntime } from '../lib/nativeAuthDiagnostics';
import type { AuthRole } from '../constants/roles';

export type { AuthRole } from '../constants/roles';
export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: AuthRole;
}

interface AuthState {
  user: AuthUser | null;
  authStatus: AuthStatus;
  isLoading: boolean;
  authRecoveryError: string | null;
  setUser: (user: AuthUser | null) => void;
  setAuthRecoveryError: (message: string | null) => void;
  clearUser: (reason?: string) => void;
  resolveAuth: (
    status: Exclude<AuthStatus, 'initializing'>,
    user: AuthUser | null,
    reason: string,
  ) => void;
}

const logAuthTransition = (
  from: AuthStatus,
  to: AuthStatus,
  reason: string,
) => {
  if (!isNativeCapacitorRuntime() || from === to) return;
  console.info('[auth-state] transition', { from, to, reason });
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      authStatus: 'initializing',
      isLoading: true,
      authRecoveryError: null,
      setUser: (user: AuthUser | null) => set({ user }),
      setAuthRecoveryError: (authRecoveryError) => set({ authRecoveryError }),
      clearUser: (reason = 'test-only') => set((state) => {
        if (isNativeCapacitorRuntime() && state.user) {
          console.info('[auth-state] user-cleared', { reason });
        }
        return { user: null };
      }),
      resolveAuth: (authStatus, user, reason) => set((state) => {
        if (state.authStatus !== 'initializing' && String(authStatus) === 'initializing') {
          return state;
        }
        logAuthTransition(state.authStatus, authStatus, reason);
        return {
          authStatus,
          isLoading: false,
          user,
          authRecoveryError: null,
        };
      }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

// Optional default export if you want `import useAuthStore from '...'`
export default useAuthStore;
