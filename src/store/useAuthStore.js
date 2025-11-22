import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
    setLoading: (loading) => set({ isLoading: loading }),
}), {
    name: 'auth-store',
    partialize: (state) => ({ user: state.user }),
}));
export default useAuthStore;
