import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from '../../pages/admin/components/Header';
import { useAuthStore } from '../../store/useAuthStore';

const performAppLogoutMock = vi.fn(async () => undefined);

vi.mock('../../lib/auth', () => ({
  performAppLogout: performAppLogoutMock,
}));

const renderHeader = (entry = '/surya?tab=users', onOpenMenu = vi.fn()) => {
  const router = createMemoryRouter(
    [
      {
        path: '/surya',
        element: <Header onOpenMenu={onOpenMenu} />,
      },
      {
        path: '/surya/login',
        element: <div>Admin login</div>,
      },
    ],
    { initialEntries: [entry] },
  );

  render(<RouterProvider router={router} />);
  return { router, onOpenMenu };
};

describe('admin Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        uid: 'admin-1',
        email: 'admin@tinysteps.com',
        displayName: 'Tiny Steps Admin',
        role: 'admin',
      },
    });
  });

  it('shows the active admin section and exposes the mobile navigation control', () => {
    const onOpenMenu = vi.fn();
    renderHeader('/surya?tab=parent-payments', onOpenMenu);

    expect(screen.getByRole('heading', { name: 'Parent Payments' })).toBeTruthy();
    expect(screen.getByText('Admin Console')).toBeTruthy();
    expect(screen.getByText('Tiny Steps Admin')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Open admin navigation' }));
    expect(onOpenMenu).toHaveBeenCalledTimes(1);
  });

  it('logs out through the shared auth flow and returns to the admin login page', async () => {
    renderHeader('/surya?tab=users');

    fireEvent.click(screen.getByRole('button', { name: 'Log out of admin' }));

    await waitFor(() => expect(performAppLogoutMock).toHaveBeenCalledWith('user-clicked-logout'));
    await waitFor(() => expect(screen.getByText('Admin login')).toBeTruthy());
  });
});
