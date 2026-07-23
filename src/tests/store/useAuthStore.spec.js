import { beforeEach, describe, expect, it } from 'vitest';
import useAuthStore from '../../store/useAuthStore';
beforeEach(() => {
    // Clear persisted storage and reset store state between tests
    try {
        localStorage.removeItem('auth-store');
    }
    catch (e) {
        // ignore if not available
    }
    // Reset in-memory store
    useAuthStore.setState({
        user: null,
        authStatus: 'initializing',
        isLoading: true,
    });
});
describe('useAuthStore', () => {
    it('starts in an unresolved loading state', () => {
        expect(useAuthStore.getState().authStatus).toBe('initializing');
        expect(useAuthStore.getState().isLoading).toBe(true);
    });
    it('sets and returns user via setUser', () => {
        const user = {
            uid: 'u1',
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'parent',
        };
        useAuthStore.getState().setUser(user);
        const stored = useAuthStore.getState().user;
        expect(stored).toEqual(user);
    });
    it('clears user via clearUser', () => {
        const user = {
            uid: 'u2',
            email: 'foo@example.com',
            displayName: 'Foo',
            role: 'teacher',
        };
        useAuthStore.getState().setUser(user);
        expect(useAuthStore.getState().user).not.toBeNull();
        useAuthStore.getState().clearUser();
        expect(useAuthStore.getState().user).toBeNull();
    });
    it('resolves auth without returning to initializing', () => {
        useAuthStore.getState().resolveAuth('authenticated', {
            uid: 'stable-user',
            email: 'stable@example.com',
            displayName: 'Stable',
            role: 'parent',
        }, 'test-only');
        useAuthStore.getState().resolveAuth('initializing', null, 'messages-error');
        expect(useAuthStore.getState().authStatus).toBe('authenticated');
        expect(useAuthStore.getState().user?.uid).toBe('stable-user');
        expect(useAuthStore.getState().isLoading).toBe(false);
    });
    it('persists user to localStorage', () => {
        const user = {
            uid: 'u3',
            email: 'persist@example.com',
            displayName: 'Persist',
            role: 'admin',
        };
        useAuthStore.getState().setUser(user);
        const raw = localStorage.getItem('auth-store');
        expect(raw).toBeTruthy();
        if (raw) {
            expect(raw).toContain('persist@example.com');
        }
    });
});
