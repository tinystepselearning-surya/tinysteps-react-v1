/// <reference types="vitest" />
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../pages/LoginPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import useAuthStore, { type AuthRole, type AuthUser } from '../../store/useAuthStore';
import {
  getPendingPushOpenRoute,
  queuePendingPushOpenRoute,
} from '../../lib/pushNavigationState';

vi.mock('../../lib/auth', () => ({
  handleLogin: vi.fn(),
  getRoleRedirectPath: (role: AuthRole) => ({
    admin: '/surya',
    teacher: '/teacher',
    parent: '/parent',
    kid: '/parent/kids',
    learningPartner: '/learning-partner/dashboard',
    schoolAdmin: '/school',
  })[role],
  getSafeInternalRedirect: (value: unknown) =>
    typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
      ? value
      : null,
}));

import { handleLogin } from '../../lib/auth';

describe('LoginPage', () => {
  beforeEach(() => {
    (handleLogin as unknown as any).mockReset?.();
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      authStatus: 'unauthenticated',
      isLoading: false,
    });
  });

  it('calls handleLogin with email and password', async () => {
  (handleLogin as unknown as any).mockResolvedValue?.({
    uid: 'teacher-1',
    email: 'teacher@example.com',
    displayName: 'Teacher',
    role: 'teacher',
  } satisfies AuthUser);

    render(
      <MemoryRouter initialEntries={["/teacher/login"]}>
        <LoginPage />
      </MemoryRouter>
    );

    const email = screen.getByLabelText('Email, username, or phone number') as HTMLInputElement;
    const password = screen.getByLabelText('Password') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(email, { target: { value: 'test@example.com' } });
    fireEvent.change(password, { target: { value: 'secret' } });

    fireEvent.click(button);

    await waitFor(() => {
      // LoginPage calls handleLogin(email, password, role) based on the route
      expect(handleLogin).toHaveBeenCalledWith('test@example.com', 'secret', 'teacher');
    });
  });

  it('uses the authenticated role dashboard for a normal login', async () => {
    (handleLogin as unknown as any).mockResolvedValue?.({
      uid: 'parent-1',
      email: 'parent@example.com',
      displayName: 'Parent',
      role: 'parent',
    } satisfies AuthUser);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/parent" element={<div>Parent dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email, username, or phone number'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Parent dashboard')).toBeInTheDocument();
  });

  it('leaves the exact pending message thread for the root controller after login', async () => {
    queuePendingPushOpenRoute('/messages', 'thread/with spaces');
    (handleLogin as unknown as any).mockResolvedValue?.({
      uid: 'parent-1',
      email: 'parent@example.com',
      displayName: 'Parent',
      role: 'parent',
    } satisfies AuthUser);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/parent" element={<div>Parent dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email, username, or phone number'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalledOnce();
    });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText('Parent dashboard')).not.toBeInTheDocument();
    expect(getPendingPushOpenRoute()?.threadId).toBe('thread/with spaces');
  });

  it('honours a safe RoleGate return path when there is no pending push', async () => {
    (handleLogin as unknown as any).mockResolvedValue?.({
      uid: 'teacher-1',
      email: 'teacher@example.com',
      displayName: 'Teacher',
      role: 'teacher',
    } satisfies AuthUser);

    render(
      <MemoryRouter
        initialEntries={[{
          pathname: '/login',
          state: { from: '/messages/role-gate-thread' },
        }]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/messages/:threadId" element={<div>RoleGate destination</div>} />
          <Route path="/teacher" element={<div>Teacher dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email, username, or phone number'), {
      target: { value: 'teacher@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('RoleGate destination')).toBeInTheDocument();
    expect(screen.queryByText('Teacher dashboard')).not.toBeInTheDocument();
  });

  it('shows error when handleLogin rejects', async () => {
  (handleLogin as unknown as any).mockRejectedValue?.(new Error('Bad credentials'));

    render(
      <MemoryRouter initialEntries={["/teacher/login"]}>
        <LoginPage />
      </MemoryRouter>
    );

    const email = screen.getByLabelText('Email, username, or phone number') as HTMLInputElement;
    const password = screen.getByLabelText('Password') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(email, { target: { value: 'wrong@example.com' } });
    fireEvent.change(password, { target: { value: 'wrong' } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/bad credentials/i)).toBeInTheDocument();
    });
  });

  it(
    'recognizes the school login route as School Admin',
    async () => {
      (handleLogin as any)
        .mockResolvedValue({
          uid: 'school-admin-1',
          email:
            'principal@example.com',
          displayName:
            'School Principal',
          role: 'schoolAdmin',
        });

      render(
        <MemoryRouter
          initialEntries={[
            '/school/login',
          ]}
        >
          <Routes>
            <Route
              path="/school/login"
              element={<LoginPage />}
            />

            <Route
              path="/school"
              element={
                <div>
                  School dashboard
                </div>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      fireEvent.change(
        screen.getByLabelText(
          'Email, username, or phone number',
        ),
        {
          target: {
            value:
              'principal@example.com',
          },
        },
      );

      fireEvent.change(
        screen.getByLabelText(
          'Password',
        ),
        {
          target: {
            value: 'secret123',
          },
        },
      );

      fireEvent.click(
        screen.getByRole(
          'button',
          {
            name: /sign in/i,
          },
        ),
      );

      await waitFor(() => {
        expect(
          handleLogin,
        ).toHaveBeenCalledWith(
          'principal@example.com',
          'secret123',
          'schoolAdmin',
        );
      });

      expect(
        await screen.findByText(
          'School dashboard',
        ),
      ).toBeInTheDocument();
    },
  );
});
