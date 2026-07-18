import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import useAuthStore from '../../store/useAuthStore';
import {
  getPendingPushOpenRoute,
  queuePendingPushOpenRoute,
} from '../../lib/pushNavigationState';

const { authStateChangedMock } = vi.hoisted(() => ({
  authStateChangedMock: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: authStateChangedMock,
}));

import useAuth from '../../hooks/useAuth';

describe('useAuth pure selector', () => {
  beforeEach(() => {
    authStateChangedMock.mockReset();
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      authStatus: 'initializing',
      isLoading: true,
    });
  });

  it('attaches zero Firebase listeners across multiple consumers', () => {
    const { result } = renderHook(() => ({
      first: useAuth(),
      second: useAuth(),
      third: useAuth(),
    }));

    expect(authStateChangedMock).not.toHaveBeenCalled();
    expect(result.current.first.authStatus).toBe('initializing');
    expect(result.current.second.isLoading).toBe(true);
  });

  it('contains no effects, Firebase imports, auth mutations, or push clearing', () => {
    const source = readFileSync(join(process.cwd(), 'src/hooks/useAuth.ts'), 'utf8');
    expect(source).not.toContain('useEffect');
    expect(source).not.toContain('firebase/');
    expect(source).not.toContain('onAuthStateChanged');
    expect(source).not.toContain('setLoading');
    expect(source).not.toContain('getIdTokenResult');
    expect(source).not.toContain('clearPendingPushOpenRoute');
  });

  it('does not clear pending push state when auth state changes', () => {
    queuePendingPushOpenRoute('/messages', 'selector-thread');
    const { rerender } = renderHook(() => useAuth());

    useAuthStore.getState().resolveAuth('unauthenticated', null, 'test-only');
    rerender();

    expect(getPendingPushOpenRoute()?.threadId).toBe('selector-thread');
    expect(authStateChangedMock).not.toHaveBeenCalled();
  });
});
