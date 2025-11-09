import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'teacher' | 'parent' | 'kid' | 'learningPartner';
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user: AuthUser) => set({ user }),
      clearUser: () => set({ user: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export default useAuthStore;
