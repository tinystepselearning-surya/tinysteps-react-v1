import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuthUser } from '../store/useAuthStore';
import {
  getPendingPushOpenRoute,
  queuePendingPushOpenRoute,
} from '../lib/pushNavigationState';

const {
  authState,
  navigateMock,
  routerMock,
  startupDiagnosticsMock,
  useAuthMock,
} = vi.hoisted(() => {
  const state = {
    user: null as AuthUser | null,
    authStatus: 'authenticated' as const,
    isLoading: false,
  };
  const router = {
    state: { location: { pathname: '/', search: '', hash: '' } },
    navigate: vi.fn(async (path: string, _options?: unknown) => {
      router.state.location.pathname = path;
    }),
  };
  return {
    authState: state,
    navigateMock: router.navigate,
    routerMock: router,
    startupDiagnosticsMock: vi.fn(() => Promise.resolve()),
    useAuthMock: vi.fn(() => state),
  };
});

vi.mock('../hooks/useAuth', () => ({
  default: useAuthMock,
}));

vi.mock('../hooks/useRevealAnimations', () => ({
  default: vi.fn(),
}));

vi.mock('../components/common/AuthBootstrap', () => ({
  default: () => null,
}));

vi.mock('../lib/nativeAuthDiagnostics', () => ({
  isNativeCapacitorRuntime: () => true,
  runNativeAuthStartupDiagnostics: startupDiagnosticsMock,
}));

vi.mock('../app/routes', () => ({
  default: routerMock,
}));

vi.mock('../lib/pushNotifications', () => ({
  registerNativePushNotifications: vi.fn(() => Promise.resolve()),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    RouterProvider: () => <div>Application route</div>,
  };
});

import App from '../app';

describe('native persisted authentication push bootstrap', () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
    useAuthMock.mockClear();
    startupDiagnosticsMock.mockClear();
    routerMock.state.location.pathname = '/';
    authState.user = {
      uid: 'persisted-parent',
      email: 'parent@example.com',
      displayName: 'Parent',
      role: 'parent',
    };
    authState.isLoading = false;
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      writable: true,
      value: { isNativePlatform: () => true },
    });
  });

  it('opens the exact message thread on native cold start without showing Login or looping', async () => {
    queuePendingPushOpenRoute('/messages', 'cold-start-thread');

    render(<App />);

    expect(screen.getByText('Application route')).toBeInTheDocument();
    expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        '/messages/cold-start-thread',
        { replace: true },
      );
    });
    expect(navigateMock).toHaveBeenCalledOnce();
    expect(useAuthMock).toHaveBeenCalledOnce();
    expect(startupDiagnosticsMock).toHaveBeenCalledOnce();
    expect(getPendingPushOpenRoute()).toBeNull();
  });

  it('retains the pending route when root navigation fails', async () => {
    queuePendingPushOpenRoute('/messages', 'retry-thread');
    navigateMock.mockRejectedValueOnce(new Error('navigation failed'));

    render(<App />);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        '/messages/retry-thread',
        { replace: true },
      );
    });
    expect(getPendingPushOpenRoute()?.threadId).toBe('retry-thread');
  });

  it('does not queue pending push routes in the root navigation owner', () => {
    const appSource = readFileSync(join(process.cwd(), 'src/app.tsx'), 'utf8');
    expect(appSource).not.toContain('queuePendingPushOpenRoute');
  });
});
