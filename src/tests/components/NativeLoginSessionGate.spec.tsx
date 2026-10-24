import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import useAuthStore from '../../store/useAuthStore';
import NativeLoginSessionGate from '../../components/common/NativeLoginSessionGate';

const initial = () => useAuthStore.setState({
  user: null,
  authStatus: 'initializing',
  isLoading: true,
  authRecoveryError: null,
});

const app = () => render(
  <MemoryRouter initialEntries={['/login']}>
    <Routes>
      <Route path="/login" element={(
        <NativeLoginSessionGate><div>Sign in with password</div></NativeLoginSessionGate>
      )} />
      <Route path="/surya" element={<div>Admin workspace</div>} />
      <Route path="/parent" element={<div>Parent workspace</div>} />
      <Route path="/teacher" element={<div>Teacher workspace</div>} />
    </Routes>
  </MemoryRouter>,
);

describe('iPhone cold-start authentication entry gate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    initial();
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      value: { isNativePlatform: () => true },
    });
  });

  it('never displays a login form while Firebase is restoring native credentials', () => {
    app();
    expect(screen.getByText(/Restoring your Tiny Steps session/i)).toBeInTheDocument();
    expect(screen.queryByText('Sign in with password')).not.toBeInTheDocument();
  });

  it('routes a Firebase-verified admin to the admin workspace without re-login', async () => {
    useAuthStore.setState({
      authStatus: 'authenticated',
      isLoading: false,
      user: { uid: 'admin-uid', email: 'admin@example.com', displayName: 'Admin', role: 'admin' },
    });
    app();
    expect(await screen.findByText('Admin workspace')).toBeInTheDocument();
    expect(screen.queryByText('Sign in with password')).not.toBeInTheDocument();
  });

  it('routes a Firebase-verified parent to the parent workspace', async () => {
    useAuthStore.setState({
      authStatus: 'authenticated',
      isLoading: false,
      user: { uid: 'parent-uid', email: 'parent@example.com', displayName: 'Parent', role: 'parent' },
    });
    app();
    expect(await screen.findByText('Parent workspace')).toBeInTheDocument();
  });

  it('shows the login form only after Firebase confirms an unauthenticated session', () => {
    useAuthStore.setState({ authStatus: 'unauthenticated', user: null, isLoading: false });
    app();
    expect(screen.getByText('Sign in with password')).toBeInTheDocument();
  });

  it('does not trust a cached profile without a Firebase-authenticated state', () => {
    useAuthStore.setState({
      authStatus: 'initializing',
      user: { uid: 'stale', email: 'stale@example.com', displayName: 'Stale', role: 'admin' },
    });
    app();
    expect(screen.getByText(/Restoring your Tiny Steps session/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin workspace')).not.toBeInTheDocument();
  });

  it('keeps ordinary website login behavior unchanged', () => {
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      value: { isNativePlatform: () => false },
    });
    app();
    expect(screen.getByText('Sign in with password')).toBeInTheDocument();
  });

  it('guards all native role-specific login entry routes', () => {
    const routes = readFileSync(join(process.cwd(), 'src/app/routes.tsx'), 'utf8');
    for (const path of [
      'login', 'founder/login', 'teacher/login', 'parent/login',
      'learning-partner/login', 'learningpartner/login', 'school/login',
    ]) {
      expect(routes).toContain(`{ path: '${path}', element: nativeLoginPageElement }`);
    }
    expect(routes).toContain("{ path: 'surya/login', element: nativeAdminLoginElement }");
  });
});
