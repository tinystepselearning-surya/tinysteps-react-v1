import React from 'react';
import { render, screen } from '@testing-library/react';
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
  test('renders generic user fields without the retired parent kid-assignment control', () => {
    const onUserCreated = vi.fn();
    render(<CreateUserForm onUserCreated={onUserCreated} />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();

    // Wave 1 R4 retired kid assignment from generic user creation.
    // Learner/guardian relationships are managed through the canonical identity flow instead.
    expect(screen.queryByText('Assign kids (optional)')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Assign kids...')).not.toBeInTheDocument();
  });
});
