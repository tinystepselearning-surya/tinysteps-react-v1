/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import Login from '../../pages/Login';

// Mock the Firebase auth
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  auth: {},
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('LoginForm', () => {
  test('Renders form fields', () => {
    render(<Login />);
    
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('Submits form', async () => {
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  test('Shows error on invalid login', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<Login onLogin={onLogin} />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'wrong@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpass' }
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('Shows loading state', async () => {
    const onLogin = vi.fn(() => new Promise(() => {})); // Never resolves
    render(<Login onLogin={onLogin} />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });
});