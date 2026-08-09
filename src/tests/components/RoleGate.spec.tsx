import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RoleGate from '../../components/common/RoleGate';
import useAuthStore from '../../store/useAuthStore';

const { getDocMock } = vi.hoisted(() => ({ getDocMock: vi.fn() }));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDoc: getDocMock,
}));

const LoginDestination = () => {
  const location = useLocation();
  return <div>Login destination: {(location.state as { from?: string } | null)?.from}</div>;
};

describe('RoleGate authentication bootstrap', () => {
  beforeEach(() => {
    getDocMock.mockReset();
    getDocMock.mockImplementation(() => new Promise(() => undefined));
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      writable: true,
      value: { isNativePlatform: () => true },
    });
    useAuthStore.setState({
      user: null,
      authStatus: 'initializing',
      isLoading: true,
    });
  });

  it('waits for Firebase restoration and redirects only after no user is confirmed', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/messages/thread-1']}>
          <Routes>
            <Route element={<RoleGate allowedRoles={['parent']} />}>
              <Route path="/messages/:threadId" element={<div>Protected messages</div>} />
            </Route>
            <Route path="/login" element={<LoginDestination />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Verifying your access…')).toBeInTheDocument();
    expect(screen.queryByText(/Login destination/)).not.toBeInTheDocument();

    await act(async () => {
      useAuthStore.setState({
        user: null,
        authStatus: 'unauthenticated',
        isLoading: false,
      });
    });

    expect(await screen.findByText('Login destination: /messages/thread-1')).toBeInTheDocument();
  });

  it('keeps Messages mounted during a background role refresh', () => {
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
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/messages/thread-1']}>
          <Routes>
            <Route element={<RoleGate allowedRoles={['parent']} />}>
              <Route path="/messages/:threadId" element={<div>Protected messages</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Protected messages')).toBeInTheDocument();
    expect(screen.queryByText('Verifying your access…')).not.toBeInTheDocument();
  });

  it('does not render a School Admin route while database role verification is pending', async () => {
    useAuthStore.setState({
      user: {
        uid: 'school-admin-1',
        email: 'principal@example.com',
        displayName: 'Principal',
        role: 'schoolAdmin',
      },
      authStatus: 'authenticated',
      isLoading: false,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/school']}>
          <Routes>
            <Route element={<RoleGate allowedRoles={['schoolAdmin']} />}>
              <Route path="/school" element={<div>School portal</div>} />
            </Route>
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Verifying your access…')).toBeInTheDocument();
    expect(screen.queryByText('School portal')).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(getDocMock).toHaveBeenCalledTimes(1);
    });
  });

  it('rejects a School Admin claim when the database role is parent', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'parent' }),
    });
    useAuthStore.setState({
      user: {
        uid: 'school-admin-1',
        email: 'principal@example.com',
        displayName: 'Principal',
        role: 'schoolAdmin',
      },
      authStatus: 'authenticated',
      isLoading: false,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/school']}>
          <Routes>
            <Route element={<RoleGate allowedRoles={['schoolAdmin']} />}>
              <Route path="/school" element={<div>School portal</div>} />
            </Route>
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Unauthorized')).toBeInTheDocument();
    expect(screen.queryByText('School portal')).not.toBeInTheDocument();
  });

  it('allows a School Admin route after database role verification', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'schoolAdmin' }),
    });
    useAuthStore.setState({
      user: {
        uid: 'school-admin-1',
        email: 'principal@example.com',
        displayName: 'Principal',
        role: 'schoolAdmin',
      },
      authStatus: 'authenticated',
      isLoading: false,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/school']}>
          <Routes>
            <Route element={<RoleGate allowedRoles={['schoolAdmin']} />}>
              <Route path="/school" element={<div>School portal</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('School portal')).toBeInTheDocument();
  });

  it('fails closed when the School Admin database role lookup fails', async () => {
    getDocMock.mockRejectedValue(new Error('school role lookup failed'));
    useAuthStore.setState({
      user: {
        uid: 'school-admin-1',
        email: 'principal@example.com',
        displayName: 'Principal',
        role: 'schoolAdmin',
      },
      authStatus: 'authenticated',
      isLoading: false,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/school']}>
          <Routes>
            <Route element={<RoleGate allowedRoles={['schoolAdmin']} />}>
              <Route path="/school" element={<div>School portal</div>} />
            </Route>
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(
        'Unauthorized',
        {},
        { timeout: 4_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('School portal')).not.toBeInTheDocument();
  });

  it('logs only changed decisions and a role query failure cannot clear auth', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    getDocMock.mockRejectedValue(new Error('messages role lookup failed'));
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
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/messages/thread-1']}>
          <Routes>
            <Route element={<RoleGate allowedRoles={['parent']} />}>
              <Route path="/messages/:threadId" element={<div>Protected messages</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    view.rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/messages/thread-1']}>
          <Routes>
            <Route element={<RoleGate allowedRoles={['parent']} />}>
              <Route path="/messages/:threadId" element={<div>Protected messages</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Protected messages')).toBeInTheDocument();
    await vi.waitFor(() => expect(getDocMock).toHaveBeenCalled());
    await vi.waitFor(() => {
      expect(queryClient.getQueryState(['auth-role', 'parent-1'])?.status).toBe('error');
    }, { timeout: 4_000 });
    expect(useAuthStore.getState().authStatus).toBe('authenticated');
    expect(useAuthStore.getState().user).not.toBeNull();
    await vi.waitFor(() => {
      const decisionLogs = infoSpy.mock.calls.filter(
        ([event]) => event === '[role-gate] decision',
      );
      expect(decisionLogs).toHaveLength(2);
    });
    const decisionLogs = infoSpy.mock.calls.filter(
      ([event]) => event === '[role-gate] decision',
    );
    expect(decisionLogs.map(([, detail]) => detail)).toEqual([
      expect.objectContaining({ decision: 'allow', roleQueryStatus: 'loading' }),
      expect.objectContaining({ decision: 'allow', roleQueryStatus: 'error' }),
    ]);
  });

  it(
    'normalizes the legacy Learning Partner Firestore role',
    async () => {
      getDocMock.mockResolvedValue({
        exists: () => true,
        data: () => ({
          role: 'learning-partner',
        }),
      });

      useAuthStore.setState({
        user: {
          uid: 'lp-1',
          email: 'lp@example.com',
          displayName: 'LP',
          role: 'parent',
        },
        authStatus: 'authenticated',
        isLoading: false,
      });

      const queryClient =
        new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
            },
          },
        });

      render(
        <QueryClientProvider
          client={queryClient}
        >
          <MemoryRouter
            initialEntries={[
              '/protected',
            ]}
          >
            <Routes>
              <Route
                element={
                  <RoleGate
                    allowedRoles={[
                      'learningPartner',
                    ]}
                  />
                }
              >
                <Route
                  path="/protected"
                  element={
                    <div>
                      LP protected area
                    </div>
                  }
                />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(
        await screen.findByText(
          'LP protected area',
        ),
      ).toBeInTheDocument();
    },
  );
});
