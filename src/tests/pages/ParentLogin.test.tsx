import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import * as auth from '../../lib/auth';
import LoginPage from '../../pages/LoginPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../lib/auth', async () => {
  const actual = await vi.importActual('../../lib/auth');
  return {
    ...actual,
    handleLoginWithGoogle: vi.fn().mockResolvedValue(null),
  };
});

describe('Parent Login Page', () => {
  it('shows Google button for parent role and calls handler on click', async () => {
  const handleLoginWithGoogle = auth.handleLoginWithGoogle as unknown as jest.Mock;
    // render with a memory router so useLocation/useSearchParams hooks work
    render(
      <MemoryRouter initialEntries={["/parent/login?role=parent"]}>
        <LoginPage />
      </MemoryRouter>
    );
    // navigate to `/parent/login` path logic not applied in this render; we just ensure component contains the button when role=parent URL is used.
    // Instead, mount the page and assert presence of the Sign in with Google button by simulating expectedRole via URL if necessary.
    // For this simple test, we assume `expectedRole` equals 'parent' in this path.
    // The existing LoginPage uses location: for robust test we'd mock the router; for now, just ensure the element text exists when page is rendered.
    const googleBtn = screen.getByText(/Sign in with Google/i);
    expect(googleBtn).toBeInTheDocument();
  fireEvent.click(googleBtn);
  // confirm the mocked login handler was called (wait for async state update)
  await waitFor(() => expect(auth.handleLoginWithGoogle).toHaveBeenCalledWith('parent'));
  });
});
