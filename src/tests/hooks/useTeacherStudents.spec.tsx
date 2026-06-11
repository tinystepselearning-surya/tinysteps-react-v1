import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCollection,
  mockGetDocs,
  mockQuery,
  mockWhere,
} = vi.hoisted(() => ({
  mockCollection: vi.fn((_db: unknown, name: string) => ({ kind: 'collection', name })),
  mockGetDocs: vi.fn(),
  mockQuery: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  mockWhere: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: {
      uid: 'teacher-1',
      role: 'teacher',
    },
  }),
}));

import { useTeacherFilteredStudents } from '../../hooks/useTeacherFilteredData';

function TestComponent() {
  const { students, loading, error } = useTeacherFilteredStudents();
  if (loading) return <div>loading</div>;
  if (error) return <div>error:{error}</div>;
  return (
    <div>
      <div>count:{students.length}</div>
      {students.map((student) => (
        <div key={student.uid} data-testid="student">
          {student.uid}:{student.fullName}
        </div>
      ))}
    </div>
  );
}

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
});

const extractWhereClauses = (queryRef: { args: Array<{ kind?: string; args?: unknown[] }> }) =>
  queryRef.args.filter((entry) => entry?.kind === 'where').map((entry) => entry.args || []);

const getCollectionName = (queryRef: { args: Array<{ kind?: string; name?: string }> }) => {
  const base = queryRef.args.find((entry) => entry?.kind === 'collection');
  return base?.name || '';
};

const getTeacherAliasField = (queryRef: { args: Array<{ kind?: string; args?: unknown[] }> }) => {
  const whereClauses = extractWhereClauses(queryRef);
  const teacherClause = whereClauses.find((clause) =>
    ['teacherId', 'teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(
      String(clause[0] || ''),
    ),
  );
  return String(teacherClause?.[0] || '');
};

function renderHookComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <TestComponent />
    </QueryClientProvider>,
  );
}

describe('useTeacherFilteredStudents', () => {
  beforeEach(() => {
    mockCollection.mockClear();
    mockGetDocs.mockReset();
    mockQuery.mockClear();
    mockWhere.mockClear();
  });

  it('reads teacher-owned enrollment snapshots only and never queries kids or students', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);

      if (collectionName !== 'enrollments') return { docs: [] };

      if (aliasField === 'teacherId') {
        return {
          docs: [
            makeDoc('enr-direct', {
              teacherId: 'teacher-1',
              kidId: 'kid-1',
              studentName: 'Shreenika',
              status: 'active',
            }),
          ],
        };
      }

      if (aliasField === 'teacherIds') {
        return {
          docs: [
            makeDoc('enr-array', {
              teacherIds: ['teacher-1'],
              childId: 'child-2',
              childSnapshot: { name: 'Student Two' },
              status: 'active',
            }),
          ],
        };
      }

      return { docs: [] };
    });

    renderHookComponent();

    await waitFor(() => expect(screen.getByText('count:2')).toBeTruthy());

    expect(screen.getAllByTestId('student').map((node) => node.textContent)).toEqual([
      'kid-1:Shreenika',
      'child-2:Student Two',
    ]);

    const collectionNames = mockCollection.mock.calls.map(([, name]) => name);
    expect(collectionNames).toContain('enrollments');
    expect(collectionNames).not.toContain('kids');
    expect(collectionNames).not.toContain('students');
  });

  it('falls back to Student name pending when enrollment snapshots do not include a safe display name', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);

      if (collectionName === 'enrollments' && aliasField === 'teacherId') {
        return {
          docs: [
            makeDoc('enr-missing-name', {
              teacherId: 'teacher-1',
              kidId: 'kid-9',
              status: 'active',
            }),
          ],
        };
      }

      return { docs: [] };
    });

    renderHookComponent();

    await waitFor(() => expect(screen.getByText('kid-9:Student name pending')).toBeTruthy());
  });
});
