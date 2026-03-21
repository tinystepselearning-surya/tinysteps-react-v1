import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '../../pages/LoginPage';
import { MemoryRouter } from 'react-router-dom';

describe('Parent Login Page', () => {
  it('does not show Google button for parent role', () => {
    render(
      <MemoryRouter initialEntries={["/parent/login?role=parent"]}>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.queryByText(/Sign in with Google/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
});
