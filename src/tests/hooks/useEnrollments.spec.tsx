import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock firebase/firestore getDocs
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  const mockGetDocs = vi.fn();
  return {
    ...actual,
    getDocs: mockGetDocs,
  };
});

import { getDocs as mockGetDocs } from 'firebase/firestore';
import { useEnrollments } from '../../hooks/useData';

function TestComponent({ parentId }: { parentId: string }) {
  const q = useEnrollments(parentId);
  if (q.isLoading) return <div>loading</div>;
  if (q.isError) return <div>error</div>;
  return (
    <div>
      <div>count:{q.data?.length || 0}</div>
      {q.data && q.data.map((e: any) => (
        <div key={e.id} data-testid="enrollment">{e.id} kids:{(e.kids||[]).map((k:any)=>k.id).join(',')}</div>
      ))}
    </div>
  );
}

describe('useEnrollments', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches enrollments and performs batching, caches results', async () => {
    const enrollmentDoc = { id: 'enr1', data: () => ({ kidIds: ['kid1'], courseId: 'course1', teacherId: 't1', parentId: 'p1', status: 'active' }) };
    const kidDoc = { id: 'kid1', data: () => ({ name: 'Kid One' }) };
    const courseDoc = { id: 'course1', data: () => ({ title: 'Course 1' }) };
    const userDoc = { id: 't1', data: () => ({ name: 'Teacher 1' }) };

    (mockGetDocs as any).mockResolvedValueOnce({ docs: [enrollmentDoc] })
      .mockResolvedValueOnce({ docs: [kidDoc] })
      .mockResolvedValueOnce({ docs: [courseDoc] })
      .mockResolvedValueOnce({ docs: [userDoc] });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <TestComponent parentId="p1" />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText(/count:/)).toBeTruthy());
    expect(screen.getByText('count:1')).toBeTruthy();
    expect(screen.getAllByTestId('enrollment').length).toBe(1);

    // Now rerender to ensure cache returns quickly
  (mockGetDocs as any).mockClear();
    rerender(
      <QueryClientProvider client={qc}>
        <TestComponent parentId="p1" />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());
  expect((mockGetDocs as any).mock.calls.length).toBe(0);
  });
});
