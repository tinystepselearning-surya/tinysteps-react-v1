import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MessagesPage from '../../pages/messages/MessagesPage';
import useAuthStore, { type AuthRole } from '../../store/useAuthStore';

vi.mock('../../pages/messages/MessagesPanel', () => ({
  default: ({
    routeThreadId,
    onThreadChange,
    onBack,
  }: {
    routeThreadId: string | null;
    onThreadChange: (threadId: string | null) => void;
    onBack: () => void;
  }) => (
    <div>
      <span>Panel route: {routeThreadId || 'inbox'}</span>
      <button type="button" onClick={() => onThreadChange('thread-1')}>
        Report thread 1
      </button>
      <button type="button" onClick={() => onThreadChange('thread-2')}>
        Report thread 2
      </button>
      <button type="button" onClick={() => onThreadChange(null)}>
        Report inbox
      </button>
      <button type="button" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

const Destination = () => {
  const location = useLocation();
  return <div>Destination: {location.pathname}</div>;
};

const renderMessagesRoute = (initialEntry = '/messages/thread-1') => {
  const router = createMemoryRouter(
    [
      { path: '/messages', element: <MessagesPage /> },
      { path: '/messages/:threadId', element: <MessagesPage /> },
      { path: '*', element: <Destination /> },
    ],
    { initialEntries: [initialEntry] },
  );
  const navigateSpy = vi.spyOn(router, 'navigate');
  render(<RouterProvider router={router} />);
  return { navigateSpy, router };
};

const setAuthenticatedUser = (
  role: AuthRole,
  email = `${role}@example.com`,
) => {
  useAuthStore.setState({
    user: {
      uid: `${role}-1`,
      email,
      displayName: 'Test User',
      role,
    },
    authStatus: 'authenticated',
    isLoading: false,
  });
};

describe('MessagesPage route synchronization', () => {
  beforeEach(() => {
    setAuthenticatedUser('parent');
  });

  it('ignores a report for the current route without adding history', () => {
    const { navigateSpy, router } = renderMessagesRoute();

    fireEvent.click(screen.getByRole('button', { name: 'Report thread 1' }));

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/messages/thread-1');
    expect(router.state.historyAction).toBe('POP');
  });

  it('navigates to a different thread exactly once without a rerender echo', async () => {
    const { navigateSpy, router } = renderMessagesRoute();

    fireEvent.click(screen.getByRole('button', { name: 'Report thread 2' }));

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/messages/thread-2');
    });
    expect(navigateSpy).toHaveBeenCalledOnce();
    expect(navigateSpy).toHaveBeenCalledWith(
      '/messages/thread-2',
      expect.objectContaining({ fromRouteId: expect.any(String) }),
    );

    await act(async () => undefined);
    expect(navigateSpy).toHaveBeenCalledOnce();
  });

  it('navigates to the conversation list exactly once', async () => {
    const { navigateSpy, router } = renderMessagesRoute();

    fireEvent.click(screen.getByRole('button', { name: 'Report inbox' }));

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/messages');
    });
    expect(navigateSpy).toHaveBeenCalledOnce();
  });

  it.each([
    ['parent', 'parent@example.com', '/parent'],
    ['teacher', 'teacher@example.com', '/teacher'],
    ['learningPartner', 'lp@example.com', '/learning-partner/dashboard'],
    ['admin', 'admin@example.com', '/surya'],
    ['parent', 'suryaz@tinysteps.com', '/surya'],
  ] as const)(
    'keeps the %s role-aware back destination',
    async (role, email, expectedPath) => {
      setAuthenticatedUser(role, email);
      const { router } = renderMessagesRoute();

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(await screen.findByText(`Destination: ${expectedPath}`)).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(expectedPath);
    },
  );
});
