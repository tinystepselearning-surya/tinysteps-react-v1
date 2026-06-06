import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCollection,
  mockOnSnapshot,
  mockQuery,
  mockWhere,
} = vi.hoisted(() => ({
  mockCollection: vi.fn((_db: unknown, name: string) => ({ kind: 'collection', name })),
  mockOnSnapshot: vi.fn(),
  mockQuery: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  mockWhere: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  onSnapshot: mockOnSnapshot,
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

describe('useTeacherFilteredStudents', () => {
  beforeEach(() => {
    mockCollection.mockClear();
    mockOnSnapshot.mockReset();
    mockQuery.mockClear();
    mockWhere.mockClear();

    mockOnSnapshot.mockImplementation((queryRef, onNext) => {
      const whereClauses = extractWhereClauses(queryRef as any);
      const teacherIdField = String(whereClauses[0]?.[0] || '');

      if (teacherIdField === 'teacherId') {
        onNext({
          docs: [
            makeDoc('kid-direct', { fullName: 'Shreenika', teacherId: 'teacher-1' }),
          ],
        });
      } else if (teacherIdField === 'teacherIds') {
        onNext({
          docs: [
            makeDoc('kid-array', { fullName: 'Student Two', teacherIds: ['teacher-1'] }),
            makeDoc('kid-other', { fullName: 'Student Three', teacherIds: ['teacher-2'] }),
          ],
        });
      }

      return vi.fn();
    });
  });

  it('loads teacher-owned kids through narrow teacherId and teacherIds queries and filters out other teachers', async () => {
    render(<TestComponent />);

    await waitFor(() => expect(screen.getByText('count:2')).toBeTruthy());

    expect(screen.getAllByTestId('student').map((node) => node.textContent)).toEqual([
      'kid-direct:Shreenika',
      'kid-array:Student Two',
    ]);

    const queryFields = mockOnSnapshot.mock.calls.map((call) => {
      const whereClauses = extractWhereClauses(call[0] as any);
      return whereClauses[0]?.slice(0, 3);
    });

    expect(queryFields).toEqual(
      expect.arrayContaining([
        ['teacherId', '==', 'teacher-1'],
        ['teacherIds', 'array-contains', 'teacher-1'],
      ]),
    );
    expect(mockCollection).toHaveBeenCalledWith({}, 'kids');
    expect(screen.queryByText(/kid-other/)).toBeNull();
  });
});
