import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAuthStore from '../../store/useAuthStore';

type FirebaseUserFixture = {
  uid: string;
  email: string | null;
  displayName: string | null;
  getIdTokenResult: ReturnType<typeof vi.fn>;
};

const { authStateChangedMock, stateReadyMock, unsubscribeMock } = vi.hoisted(() => ({
  authStateChangedMock: vi.fn(),
  stateReadyMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: authStateChangedMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  auth: { authStateReady: stateReadyMock },
}));

vi.mock('../../lib/nativeAuthDiagnostics', () => ({
  isNativeCapacitorRuntime: () => false,
  logFirebaseAuthKeyPresence: vi.fn(),
}));

import AuthBootstrap from '../../components/common/AuthBootstrap';

describe('AuthBootstrap', () => {
  let authCallback: ((user: FirebaseUserFixture | null) => void) | undefined;

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    authStateChangedMock.mockReset();
    stateReadyMock.mockReset();
    stateReadyMock.mockResolvedValue(undefined);
    unsubscribeMock.mockReset();
    authCallback = undefined;
    authStateChangedMock.mockImplementation((
      _auth: unknown,
      callback: (user: FirebaseUserFixture | null) => void,
    ) => {
      authCallback = callback;
      return unsubscribeMock;
    });
    useAuthStore.setState({
      user: null,
      authStatus: 'initializing',
      isLoading: true,
    });
  });

  it('waits for state readiness, then attaches exactly one listener', async () => {
    const { rerender, unmount } = render(<AuthBootstrap />);
    rerender(<AuthBootstrap />);

    expect(stateReadyMock).toHaveBeenCalledOnce();
    await waitFor(() => expect(authStateChangedMock).toHaveBeenCalledOnce());
    unmount();
    expect(unsubscribeMock).toHaveBeenCalledOnce();
  });

  it('does not resolve unauthenticated before authStateReady completes', async () => {
    let markReady: (() => void) | undefined;
    stateReadyMock.mockReturnValue(new Promise<void>((resolve) => {
      markReady = resolve;
    }));
    render(<AuthBootstrap />);

    expect(useAuthStore.getState().authStatus).toBe('initializing');
    expect(authStateChangedMock).not.toHaveBeenCalled();

    await act(async () => {
      markReady?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(authStateChangedMock).toHaveBeenCalledOnce());
    expect(useAuthStore.getState().authStatus).toBe('initializing');

    await act(async () => {
      authCallback?.(null);
      await Promise.resolve();
    });
    expect(useAuthStore.getState().authStatus).toBe('unauthenticated');
  });

  it('uses cached claims and never returns auth state to initializing', async () => {
    render(<AuthBootstrap />);
    await waitFor(() => expect(authCallback).toBeTypeOf('function'));
    const getIdTokenResult = vi.fn(async () => ({
      claims: { role: 'parent' },
    }));

    await act(async () => {
      authCallback?.({
        uid: 'persisted-parent',
        email: 'parent@example.com',
        displayName: 'Parent',
        getIdTokenResult,
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(useAuthStore.getState().authStatus).toBe('authenticated');
    });
    expect(getIdTokenResult).toHaveBeenCalledWith();

    await act(async () => {
      authCallback?.(null);
      await Promise.resolve();
    });
    expect(useAuthStore.getState().authStatus).toBe('unauthenticated');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('does not update Zustand for an unchanged authenticated callback', async () => {
    render(<AuthBootstrap />);
    await waitFor(() => expect(authCallback).toBeTypeOf('function'));
    const fixture: FirebaseUserFixture = {
      uid: 'same-parent',
      email: 'parent@example.com',
      displayName: 'Parent',
      getIdTokenResult: vi.fn(async () => ({ claims: { role: 'parent' } })),
    };

    await act(async () => {
      authCallback?.(fixture);
      await Promise.resolve();
    });
    const resolvedState = useAuthStore.getState();

    await act(async () => {
      authCallback?.(fixture);
      await Promise.resolve();
    });

    expect(useAuthStore.getState()).toBe(resolvedState);
  });
});
