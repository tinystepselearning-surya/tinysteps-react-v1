/// <reference types="vitest" />
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../pages/LoginPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../lib/auth', () => ({
  handleLogin: vi.fn(),
}));

import { handleLogin } from '../../lib/auth';

describe('LoginPage', () => {
  beforeEach(() => {
    (handleLogin as unknown as any).mockReset?.();
  });

  it('calls handleLogin with email and password', async () => {
  (handleLogin as unknown as any).mockResolvedValue?.(undefined);

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
});
