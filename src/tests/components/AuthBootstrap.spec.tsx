import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAuthStore from '../../store/useAuthStore';

type FirebaseUserFixture = {
  uid: string;
  email: string | null;
  displayName: string | null;
  getIdTokenResult: ReturnType<typeof vi.fn>;
};

const {
  appStateListenerMock,
  authStateChangedMock,
  ensurePersistenceMock,
  stateReadyMock,
  unsubscribeMock,
} = vi.hoisted(() => ({
  appStateListenerMock: vi.fn(),
  authStateChangedMock: vi.fn(),
  ensurePersistenceMock: vi.fn(),
  stateReadyMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock('@capacitor/app', () => ({
  App: { addListener: appStateListenerMock },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: authStateChangedMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  auth: { authStateReady: stateReadyMock, currentUser: null },
  ensureNativeAuthPersistence: ensurePersistenceMock,
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
    ensurePersistenceMock.mockReset();
    ensurePersistenceMock.mockResolvedValue('indexeddb');
    appStateListenerMock.mockReset();
    appStateListenerMock.mockResolvedValue({ remove: vi.fn() });
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
      authRecoveryError: null,
    });
  });

  it('waits for state readiness, then attaches exactly one listener', async () => {
    const { rerender, unmount } = render(<AuthBootstrap />);
    rerender(<AuthBootstrap />);

    await waitFor(() => expect(stateReadyMock).toHaveBeenCalledOnce());
    expect(ensurePersistenceMock).toHaveBeenCalledOnce();
    await waitFor(() => expect(authStateChangedMock).toHaveBeenCalledOnce());
    unmount();
    expect(unsubscribeMock).toHaveBeenCalledOnce();
  });

  it('does not attach a stale listener from the StrictMode probe mount', async () => {
    const unsubscribe = vi.fn();
    authStateChangedMock.mockImplementation(() => unsubscribe);
    const view = render(
      <StrictMode>
        <AuthBootstrap />
      </StrictMode>,
    );
    await waitFor(() => expect(stateReadyMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(authStateChangedMock).toHaveBeenCalledOnce());
    expect(unsubscribe).not.toHaveBeenCalled();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('coalesces repeated Retry presses into one replacement listener', async () => {
    let errorCallback: ((error: Error) => void) | undefined;
    authStateChangedMock.mockImplementation((
      _auth: unknown,
      callback: (user: FirebaseUserFixture | null) => void,
      onError: (error: Error) => void,
    ) => {
      authCallback = callback;
      errorCallback = onError;
      return unsubscribeMock;
    });
    render(<AuthBootstrap />);
    await waitFor(() => expect(errorCallback).toBeTypeOf('function'));
    act(() => errorCallback?.(new Error('temporary')));
    const retry = screen.getByRole('button', { name: 'Retry session restore' });
    act(() => {
      fireEvent.click(retry);
      fireEvent.click(retry);
    });
    await waitFor(() => expect(authStateChangedMock).toHaveBeenCalledTimes(2));
    expect(unsubscribeMock).toHaveBeenCalledOnce();
  });

  it('configures durable persistence before auth state restoration', async () => {
    const order: string[] = [];
    ensurePersistenceMock.mockImplementation(async () => {
      order.push('persistence');
      return 'indexeddb';
    });
    stateReadyMock.mockImplementation(async () => {
      order.push('state-ready');
    });

    render(<AuthBootstrap />);
    await waitFor(() => expect(authStateChangedMock).toHaveBeenCalledOnce());
    expect(order).toEqual(['persistence', 'state-ready']);
  });

  it('preserves authenticated state when the auth listener reports an error', async () => {
    let errorCallback: ((error: Error) => void) | undefined;
    authStateChangedMock.mockImplementation((
      _auth: unknown,
      callback: (user: FirebaseUserFixture | null) => void,
      onError: (error: Error) => void,
    ) => {
      authCallback = callback;
      errorCallback = onError;
      return unsubscribeMock;
    });
    useAuthStore.setState({
      user: {
        uid: 'restored-parent',
        email: 'parent@example.com',
        displayName: 'Parent',
        role: 'parent',
      },
      authStatus: 'authenticated',
      isLoading: false,
      authRecoveryError: null,
    });

    render(<AuthBootstrap />);
    await waitFor(() => expect(errorCallback).toBeTypeOf('function'));
    act(() => errorCallback?.(new Error('temporary listener failure')));

    expect(useAuthStore.getState().authStatus).toBe('authenticated');
    expect(useAuthStore.getState().user?.uid).toBe('restored-parent');
    expect(useAuthStore.getState().authRecoveryError).toContain('could not be refreshed');
  });

  it('app lifecycle diagnostics never mutate authenticated state', async () => {
    let appStateCallback: ((state: { isActive: boolean }) => void) | undefined;
    appStateListenerMock.mockImplementation(async (
      _event: string,
      callback: (state: { isActive: boolean }) => void,
    ) => {
      appStateCallback = callback;
      return { remove: vi.fn() };
    });
    useAuthStore.setState({
      user: {
        uid: 'native-parent',
        email: 'parent@example.com',
        displayName: 'Parent',
        role: 'parent',
      },
      authStatus: 'authenticated',
      isLoading: false,
      authRecoveryError: null,
    });

    render(<AuthBootstrap />);
    await waitFor(() => expect(appStateCallback).toBeTypeOf('function'));
    act(() => {
      appStateCallback?.({ isActive: false });
      appStateCallback?.({ isActive: true });
    });

    expect(useAuthStore.getState().authStatus).toBe('authenticated');
    expect(useAuthStore.getState().user?.uid).toBe('native-parent');
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
