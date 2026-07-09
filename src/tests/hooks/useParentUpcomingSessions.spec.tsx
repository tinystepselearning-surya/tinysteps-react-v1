import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetDocs,
  mockIsSessionCanonicalForEnrollment,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockIsSessionCanonicalForEnrollment: vi.fn((_session?: Record<string, unknown>) => true),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ kind: 'collection', name })),
  getDocs: mockGetDocs,
  query: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  where: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: 'parent-1' },
  })),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
}));

vi.mock('../../lib/sessionScheduleIntegrity', () => ({
  isSessionCanonicalForEnrollment: mockIsSessionCanonicalForEnrollment,
}));

import { useUpcomingSessions } from '../../pages/parent/hooks/useUpcomingSessions';

function TestComponent() {
  const { data = [] } = useUpcomingSessions(['kid-1']);
  return <div>count:{data.length}</div>;
}

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
  forEach: undefined,
});

const buildSnapshot = (docs: Array<ReturnType<typeof makeDoc>>) => ({
  docs,
  forEach: (callback: (doc: ReturnType<typeof makeDoc>) => void) => {
    docs.forEach(callback);
  },
});

describe('parent useUpcomingSessions', () => {
  beforeEach(() => {
    mockGetDocs.mockReset();
    mockIsSessionCanonicalForEnrollment.mockReset();
    mockIsSessionCanonicalForEnrollment.mockImplementation((_session?: Record<string, unknown>) => true);

    mockGetDocs.mockImplementation(async (queryRef: { args?: Array<{ kind?: string; name?: string }> }) => {
      const collectionRef = queryRef.args?.find((entry) => entry?.kind === 'collection');
      const name = collectionRef?.name || '';
      if (name === 'classSessions') {
        return buildSnapshot([
          makeDoc('enr-1_20260715_1845', {
            enrollmentId: 'enr-1',
            parentId: 'parent-1',
            kidId: 'kid-1',
            kidIds: ['kid-1'],
            studentName: 'Inayah',
            courseName: 'Phonics Foundations',
            date: '2099-07-15',
            startTime: '18:45',
            endTime: '19:20',
            status: 'scheduled',
            restoredFromCancelled: true,
            restoreReason: 'future_regular_session_regeneration_restore',
          }),
        ]);
      }
      if (name === 'enrollments') {
        return buildSnapshot([
          makeDoc('enr-1', {
            id: 'enr-1',
            parentId: 'parent-1',
            status: 'active',
            kidId: 'kid-1',
            kidIds: ['kid-1'],
            teacherId: 'teacher-1',
            courseId: 'course-1',
            schedule: {
              weeklySlots: [{ weekday: 3, time: '18:45', durationMinutes: 35 }],
            },
          }),
        ]);
      }
      return buildSnapshot([]);
    });
  });

  it('counts restored scheduled sessions as upcoming', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());
    expect(mockIsSessionCanonicalForEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({
        restoredFromCancelled: true,
        status: 'scheduled',
      }),
      expect.objectContaining({ id: 'enr-1' }),
    );
  });
});
