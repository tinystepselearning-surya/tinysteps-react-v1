import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authFixture,
  ensurePersistenceMock,
  signInMock,
  signOutMock,
} = vi.hoisted(() => ({
  authFixture: { currentUser: { present: true } },
  ensurePersistenceMock: vi.fn(),
  signInMock: vi.fn(),
  signOutMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithEmailAndPassword: signInMock,
  signInWithPopup: vi.fn(),
  signOut: signOutMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  auth: authFixture,
  ensureNativeAuthPersistence: ensurePersistenceMock,
}));

vi.mock('../../lib/callFunctions', () => ({ callFunction: vi.fn() }));

vi.mock('../../lib/nativeAuthDiagnostics', () => ({
  schedulePostLoginAuthDiagnostics: vi.fn(),
}));

import { handleLogin } from '../../lib/auth';

const createCredential = (role: 'admin' | 'parent') => ({
  user: {
    uid: `${role}-1`,
    email: `${role}@example.com`,
    displayName: role,
    getIdTokenResult: vi.fn(async () => ({
      claims: role === 'admin' ? { admin: true, role } : { role },
    })),
  },
});

describe('native login persistence ordering', () => {
  const order: string[] = [];

  beforeEach(() => {
    order.length = 0;
    ensurePersistenceMock.mockReset();
    signInMock.mockReset();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      writable: true,
      value: { isNativePlatform: () => true },
    });
    ensurePersistenceMock.mockImplementation(async () => {
      order.push('persistence');
    });
    signInMock.mockImplementation(async () => {
      order.push('sign-in');
      return createCredential('parent');
    });
  });

  it('awaits persistence before non-admin email/password sign-in', async () => {
    let finishPersistence: (() => void) | undefined;
    ensurePersistenceMock.mockImplementation(() => {
      order.push('persistence');
      return new Promise<void>((resolve) => {
        finishPersistence = resolve;
      });
    });

    const loginPromise = handleLogin('parent@example.com', 'password', 'parent');
    await vi.waitFor(() => expect(ensurePersistenceMock).toHaveBeenCalledOnce());
    expect(signInMock).not.toHaveBeenCalled();
    finishPersistence?.();
    await loginPromise;

    expect(order).toEqual(['persistence', 'sign-in']);
    expect(ensurePersistenceMock).toHaveBeenCalledOnce();
  });

  it('awaits persistence before admin email/password sign-in', async () => {
    signInMock.mockImplementation(async () => {
      order.push('sign-in');
      return createCredential('admin');
    });

    await handleLogin('admin@example.com', 'password', 'admin');

    expect(order).toEqual(['persistence', 'sign-in']);
    expect(ensurePersistenceMock).toHaveBeenCalledOnce();
  });

  it('leaves web email/password login behavior unchanged', async () => {
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      writable: true,
      value: { isNativePlatform: () => false },
    });

    await handleLogin('parent@example.com', 'password', 'parent');

    expect(ensurePersistenceMock).not.toHaveBeenCalled();
    expect(signInMock).toHaveBeenCalledOnce();
  });
});
