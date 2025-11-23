// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Central role union – re-use everywhere
export type AuthRole = 'admin' | 'teacher' | 'parent' | 'kid' | 'learningPartner';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: AuthRole;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user: AuthUser | null) => set({ user }),
      clearUser: () => set({ user: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

// Optional default export if you want `import useAuthStore from '...'`
export default useAuthStore;
