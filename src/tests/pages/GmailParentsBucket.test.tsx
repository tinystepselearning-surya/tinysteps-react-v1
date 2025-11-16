import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import GmailParentsBucket from '../../pages/admin/UserManagement/GmailParentsBucket';

vi.mock('firebase/firestore', async () => {
  const original: any = await vi.importActual('firebase/firestore');
  return {
    ...original,
  getDocs: vi.fn().mockResolvedValue({ docs: [{ id: 'p1', data: () => ({ email: 'a@gmail.com', name: 'Parent One', role: 'parent', provider: 'google.com' }) }] }),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
  };
});

describe('GmailParentsBucket', () => {
  it('renders and shows parents list', async () => {
    render(<GmailParentsBucket open={true} />);
    expect(await screen.findByText('Gmail Signups (Parents)')).toBeInTheDocument();
    expect(await screen.findByText('Parent One')).toBeInTheDocument();
  });
});
