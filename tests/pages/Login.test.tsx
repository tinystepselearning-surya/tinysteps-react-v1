import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import Login from '../../src/pages/Login';

// Mock react-router navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as any),
    useNavigate: () => mockNavigate,
  };
});

// Partial mock for firebase/auth so we keep the real getAuth used by firebaseConfig
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    onAuthStateChanged: (auth: any, cb: any) => {
      // Simulate an authenticated admin user with role claim
      const user = {
        uid: 'test-admin-uid',
        email: 'admin@test.com',
        getIdTokenResult: async (force?: boolean) => ({ claims: { role: 'admin' } }),
      };
      cb(user);
      return () => {};
    },
    signInWithEmailAndPassword: vi.fn(async () => ({ user: { uid: 'test-admin-uid', email: 'admin@test.com' } })),
    signOut: vi.fn(async () => {}),
    sendPasswordResetEmail: vi.fn(async () => {}),
  };
});

describe('Login Page admin redirect', () => {
  it('navigates admin user to /surya', async () => {
    render(<Login />);
    // onAuthStateChanged will trigger and call our mock; expectation is navigate called with '/surya'
    // Allow microtask queue to settle
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockNavigate).toHaveBeenCalledWith('/surya');
  });
});
