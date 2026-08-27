import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  navigateMock,
  mockCollection,
  mockGetDocs,
  mockQuery,
  mockTimestampFromMillis,
  mockWhere,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  mockCollection: vi.fn((_db: unknown, name: string) => ({ kind: 'collection', name })),
  mockGetDocs: vi.fn(),
  mockQuery: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  mockTimestampFromMillis: vi.fn((ms: number) => ({
    toMillis: () => ms,
    seconds: Math.floor(ms / 1000),
  })),
  mockWhere: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: { fromMillis: mockTimestampFromMillis },
  collection: mockCollection,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: { uid: 'teacher-1', role: 'teacher' } }),
}));

vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

import { TeacherMyStudentsV2 } from '../../pages/teacher/components/students/TeacherMyStudentsV2';

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
});

const getCollectionName = (queryRef: { args: Array<{ kind?: string; name?: string }> }) => {
  const base = queryRef.args.find((entry) => entry?.kind === 'collection');
  return base?.name || '';
};

describe('TeacherMyStudentsV2 topic progress navigation state', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    mockCollection.mockClear();
    mockGetDocs.mockReset();
    mockQuery.mockClear();
    mockTimestampFromMillis.mockClear();
    mockWhere.mockClear();
  });

  it('reuses the already-loaded student name when opening Topic Progress', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      if (collectionName === 'enrollments') {
        return {
          docs: [
            makeDoc('enr-1', {
              teacherId: 'teacher-1',
              kidId: 'kid-1',
              studentName: 'Asha',
              courseName: 'Early Phonics',
              courseId: 'early-phonics',
              status: 'active',
            }),
          ],
        };
      }
      if (collectionName === 'classSessions') return { docs: [] };
      return { docs: [] };
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TeacherMyStudentsV2 teacherId="teacher-1" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Asha')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Open Topics' }));

    expect(navigateMock).toHaveBeenCalledWith(
      '/teacher/students/kid-1/topic-progress?from=students&tab=topic&courseId=early-phonics&enrollmentId=enr-1',
      { state: { studentName: 'Asha' } },
    );
  });
});
