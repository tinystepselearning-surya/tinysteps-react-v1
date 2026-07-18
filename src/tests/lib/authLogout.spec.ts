import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import useAuthStore from '../../store/useAuthStore';
import {
  getPendingPushOpenRoute,
  queuePendingPushOpenRoute,
} from '../../lib/pushNavigationState';

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: signOutMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  auth: { currentUser: null },
  ensureNativeAuthPersistence: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../lib/callFunctions', () => ({
  callFunction: vi.fn(),
}));

import {
  getRoleRedirectPath,
  getSafeInternalRedirect,
  handleLogout,
} from '../../lib/auth';

describe('handleLogout', () => {
  beforeEach(() => {
    signOutMock.mockClear();
    localStorage.clear();
    useAuthStore.setState({
      user: {
        uid: 'parent-1',
        email: 'parent@example.com',
        displayName: 'Parent',
        role: 'parent',
      },
      authStatus: 'authenticated',
      isLoading: false,
    });
  });

  it('clears Firebase-backed app state and pending push navigation', async () => {
    queuePendingPushOpenRoute('/messages', 'thread-after-logout');

    await handleLogout();

    expect(signOutMock).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().authStatus).toBe('unauthenticated');
    expect(getPendingPushOpenRoute()).toBeNull();
  });

  it('does not call Firebase sign-out for a non-logout auth resolution', () => {
    useAuthStore.getState().resolveAuth(
      'unauthenticated',
      null,
      'firebase-auth-state-null',
    );

    expect(signOutMock).not.toHaveBeenCalled();
  });

  it('keeps production Firebase sign-out behind performAppLogout', () => {
    const sourceRoot = join(process.cwd(), 'src');
    const collectSourceFiles = (directory: string): string[] =>
      readdirSync(directory).flatMap((entry) => {
        const path = join(directory, entry);
        if (statSync(path).isDirectory()) {
          return entry === 'tests' ? [] : collectSourceFiles(path);
        }
        return /\.(ts|tsx)$/.test(entry) ? [path] : [];
      });
    const directSignOutFiles = collectSourceFiles(sourceRoot)
      .filter((path) => /\bsignOut\s*\(/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(process.cwd(), path));

    expect(directSignOutFiles).toEqual(['src/lib/auth.ts']);
    const authSource = readFileSync(join(sourceRoot, 'lib/auth.ts'), 'utf8');
    expect(authSource).toContain('performAppLogout(reason: AppLogoutReason)');
    expect(authSource.match(/await signOut\(auth\)/g)).toHaveLength(1);
  });

  it('maps every role dashboard and rejects unsafe return URLs', () => {
    expect(getRoleRedirectPath('admin')).toBe('/surya');
    expect(getRoleRedirectPath('teacher')).toBe('/teacher');
    expect(getRoleRedirectPath('parent')).toBe('/parent');
    expect(getRoleRedirectPath('kid')).toBe('/parent/kids');
    expect(getRoleRedirectPath('learningPartner')).toBe('/learning-partner/dashboard');
    expect(getSafeInternalRedirect('/messages/thread-1?source=push')).toBe(
      '/messages/thread-1?source=push',
    );
    expect(getSafeInternalRedirect('https://example.com/steal')).toBeNull();
    expect(getSafeInternalRedirect('//example.com/steal')).toBeNull();
  });
});
