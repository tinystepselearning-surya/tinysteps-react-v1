import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetDocs = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ kind: 'collection' })),
  query: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  where: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
  orderBy: vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args })),
  getDocs: mockGetDocs,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
  logCustomEvent: vi.fn(),
}));

import { useSessionsForTeacher } from '../../hooks/useData';

function TestComponent({ teacherId }: { teacherId: string }) {
  const result = useSessionsForTeacher(teacherId);
  if (result.isLoading) return <div>loading</div>;
  if (result.isError) return <div>error</div>;
  return (
    <div>
      <div>count:{result.data?.length || 0}</div>
      {result.data?.map((session: any) => (
        <div key={session.id} data-testid="session">
          {session.id}:{session.date}:{session.startTime}:{session.status}
        </div>
      ))}
    </div>
  );
}

describe('useSessionsForTeacher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges canonical and alias teacher queries, filters non-matching or non-upcoming statuses, and de-dupes sessions', async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'session-direct',
            data: () => ({
              teacherId: 'teacher-1',
              status: 'scheduled',
              date: '2026-06-10',
              startTime: '09:00',
            }),
          },
          {
            id: 'session-completed',
            data: () => ({
              teacherId: 'teacher-1',
              status: 'completed',
              date: '2026-06-10',
              startTime: '10:00',
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'session-array',
            data: () => ({
              teacherIds: ['teacher-1'],
              status: 'in_progress',
              date: '2026-06-09',
              startTime: '08:00',
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'session-assigned',
            data: () => ({
              assignedTeacherId: 'teacher-1',
              status: 'scheduled',
              date: '2026-06-11',
              startTime: '11:00',
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'session-direct',
            data: () => ({
              primaryTeacherId: 'teacher-1',
              teacherIds: ['teacher-1'],
              status: 'scheduled',
              date: '2026-06-10',
              startTime: '09:00',
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'session-uid',
            data: () => ({
              teacherUid: 'teacher-1',
              status: 'scheduled',
              date: '2026-06-12',
              startTime: '07:30',
            }),
          },
          {
            id: 'session-other',
            data: () => ({
              teacherUid: 'teacher-2',
              status: 'scheduled',
              date: '2026-06-12',
              startTime: '12:00',
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'session-legacy',
            data: () => ({
              teacher_id: 'teacher-1',
              status: 'scheduled',
              date: '2026-06-08',
              startTime: '06:45',
            }),
          },
        ],
      });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent teacherId="teacher-1" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('count:5')).toBeTruthy());

    const sessions = screen.getAllByTestId('session').map((node) => node.textContent);
    expect(sessions).toEqual([
      'session-legacy:2026-06-08:06:45:scheduled',
      'session-array:2026-06-09:08:00:in_progress',
      'session-direct:2026-06-10:09:00:scheduled',
      'session-assigned:2026-06-11:11:00:scheduled',
      'session-uid:2026-06-12:07:30:scheduled',
    ]);
  });
});
