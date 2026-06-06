import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetDocs,
  mockOnSnapshot,
  mockQuery,
  mockWhere,
  mockOrderBy,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockQuery: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  mockWhere: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
  mockOrderBy: vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args })),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ kind: 'collection', name })),
  documentId: vi.fn(() => '__name__'),
  getDocs: mockGetDocs,
  onSnapshot: mockOnSnapshot,
  orderBy: mockOrderBy,
  query: mockQuery,
  where: mockWhere,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
}));

vi.mock('../../lib/sessionScheduleIntegrity', () => ({
  isScheduleExceptionSession: vi.fn(() => false),
  isSessionCanonicalForEnrollment: vi.fn(() => true),
  shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment: vi.fn(() => false),
}));

import { useTeacherSessions } from '../../pages/teacher/hooks/useTeacherSessions';

function TestComponent({
  teacherId,
  startDate,
  endDate,
}: {
  teacherId: string;
  startDate: string;
  endDate: string;
}) {
  const { sessions, isLoading, error } = useTeacherSessions(teacherId, startDate, endDate);
  if (isLoading) return <div>loading</div>;
  if (error) return <div>error:{error.message}</div>;
  return (
    <div>
      <div>count:{sessions.length}</div>
      {sessions.map((session) => (
        <div key={session.id} data-testid="session">
          {session.id}:{session.date}:{session.teacherId}
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

describe('useTeacherSessions', () => {
  beforeEach(() => {
    mockGetDocs.mockReset();
    mockOnSnapshot.mockReset();
    mockQuery.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();

    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      if (collectionName === 'enrollments') {
        return {
          docs: [
            makeDoc('enr-direct', { teacherId: 'teacher-1', kidId: 'kid-1' }),
            makeDoc('enr-assigned', { assignedTeacherId: 'teacher-1', kidId: 'kid-2' }),
          ],
        };
      }
      if (collectionName === 'kids') {
        return {
          docs: [
            makeDoc('kid-1', { fullName: 'Shreenika' }),
            makeDoc('kid-2', { fullName: 'Student Two' }),
          ],
        };
      }
      return { docs: [] };
    });

    mockOnSnapshot.mockImplementation((queryRef, onNext) => {
      const whereClauses = extractWhereClauses(queryRef as any);
      const teacherClause = whereClauses.find((args) =>
        ['teacherId', 'teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(String(args[0] || '')),
      );
      const field = String(teacherClause?.[0] || '');
      const docsByField: Record<string, ReturnType<typeof makeDoc>[]> = {
        teacherId: [makeDoc('session-direct', { teacherId: 'teacher-1', enrollmentId: 'enr-direct', date: '2026-06-08', startTime: '20:00', kidId: 'kid-1', status: 'scheduled' })],
        assignedTeacherId: [makeDoc('session-assigned', { assignedTeacherId: 'teacher-1', enrollmentId: 'enr-assigned', date: '2026-06-08', startTime: '21:00', kidId: 'kid-2', status: 'scheduled' })],
      };
      onNext({ docs: docsByField[field] || [] });
      return vi.fn();
    });
  });

  it('keeps Today/Schedule teacher session queries date-scoped for alias reads and returns June 8 sessions', async () => {
    render(<TestComponent teacherId="teacher-1" startDate="2026-06-08" endDate="2026-06-08" />);

    await waitFor(() => expect(screen.getByText('count:2')).toBeTruthy());

    expect(screen.getAllByTestId('session').map((node) => node.textContent)).toEqual([
      'session-direct:2026-06-08:teacher-1',
      'session-assigned:2026-06-08:teacher-1',
    ]);

    const aliasQueries = mockOnSnapshot.mock.calls
      .map((call) => call[0])
      .filter((queryRef: any) => {
        const whereClauses = extractWhereClauses(queryRef);
        return whereClauses.some((clause) =>
          ['assignedTeacherId', 'teacherIds', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(String(clause[0] || '')),
        );
      });

    expect(aliasQueries.length).toBeGreaterThanOrEqual(5);
    aliasQueries.forEach((queryRef: any) => {
      const whereClauses = extractWhereClauses(queryRef);
      expect(whereClauses).toEqual(
        expect.arrayContaining([
          expect.arrayContaining(['date', '>=', '2026-06-08']),
          expect.arrayContaining(['date', '<=', '2026-06-08']),
        ]),
      );
    });
  });
});
