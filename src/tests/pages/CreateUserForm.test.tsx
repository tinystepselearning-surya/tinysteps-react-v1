import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CreateUserForm } from '../../pages/admin/UserManagement/CreateUserForm';

vi.mock('firebase/firestore', async () => {
  const original: any = await vi.importActual('firebase/firestore');
  return {
    ...original,
    getDocs: vi.fn().mockResolvedValue({ docs: [{ id: 'kid1', data: () => ({ fullName: 'Test Kid' }) }] }),
    collection: vi.fn(),
  };
});

vi.mock('firebase/functions', async () => {
  const original: any = await vi.importActual('firebase/functions');
  return {
    ...original,
    httpsCallable: vi.fn().mockReturnValue(async () => ({ data: { uid: 'uid1', email: 'a@b.com' } })),
  };
});

describe('CreateUserForm UI', () => {
  test('renders without runtime errors and shows Assign kids label with KidMultiSelect', async () => {
    const onUserCreated = vi.fn();
    render(<CreateUserForm onUserCreated={onUserCreated} />);

    // check static labels
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Assign kids (optional)')).toBeInTheDocument();

  // ensure the input placeholder from our KidMultiSelect is present
  // placeholder appears after async fetch; use findBy to wait for it
  await screen.findByPlaceholderText('Assign kids...');
  });
});
