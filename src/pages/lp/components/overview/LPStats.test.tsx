import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LPStats } from './LPStats';
import { getFirestore, doc, getDoc, DocumentSnapshot, SnapshotMetadata, DocumentReference, Firestore } from 'firebase/firestore';
import { vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

type MockedFunction<T extends (...args: any) => any> = any;

describe('LPStats Component', () => {
  const mockLpId = 'test-lp-id';

  const mockFirestore: Firestore = {
    type: 'firestore',
    app: {} as any,
    toJSON: vi.fn(() => ({})),
  };

  const mockMetadata: SnapshotMetadata = {
    hasPendingWrites: false,
    fromCache: false,
    isEqual: vi.fn(() => true),
  };

  const mockRef: DocumentReference = {
    converter: null,
    type: 'document',
    firestore: mockFirestore,
    id: 'mock-id',
    path: 'mock-path',
    parent: {} as any,
  withConverter: vi.fn() as any,
    toJSON: vi.fn(() => ({})),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    // Prevent the getDoc promise from resolving so the component remains in loading state.
    (getDoc as MockedFunction<typeof getDoc>).mockImplementation(() => new Promise(() => {}));

    // Synchronous render; we don't wait for effects so there are no async state updates
    // that would trigger act() warnings.
    render(<LPStats lpId={mockLpId} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error message when Firestore fetch fails', async () => {
    (getDoc as MockedFunction<typeof getDoc>).mockRejectedValue(new Error('Firestore fetch failed'));

    await act(async () => {
      render(<LPStats lpId={mockLpId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch statistics. Please try again later.')).toBeInTheDocument();
    });
  });

  it('renders error message when no data is found', async () => {
    (getDoc as MockedFunction<typeof getDoc>).mockResolvedValue({
      exists: (): this is DocumentSnapshot => false,
      metadata: mockMetadata,
      id: 'mock-id',
      ref: mockRef,
      data: () => undefined,
      get: () => undefined,
      toJSON: () => ({}),
    });

    await act(async () => {
      render(<LPStats lpId={mockLpId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('No statistics found for the given LP ID.')).toBeInTheDocument();
    });
  });

  it('renders stats correctly when Firestore fetch succeeds', async () => {
    (getDoc as MockedFunction<typeof getDoc>).mockResolvedValue({
      exists: (): this is DocumentSnapshot => true,
      metadata: mockMetadata,
      id: 'mock-id',
      ref: mockRef,
      data: () => ({
        totalFamilies: 10,
        totalTeachers: 5,
        totalStudents: 50,
        pendingPayments: 2,
        openTickets: 3,
        averageSatisfaction: 4.5,
      }),
      get: () => undefined,
      toJSON: () => ({}),
    });

    await act(async () => {
      render(<LPStats lpId={mockLpId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4.5/5')).toBeInTheDocument();
    });
  });
});