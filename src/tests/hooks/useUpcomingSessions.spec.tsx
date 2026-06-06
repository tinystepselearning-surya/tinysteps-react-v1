import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { addDays, format } from 'date-fns';
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

import { useUpcomingSessions } from '../../pages/teacher/hooks/useUpcomingSessions';

function TestComponent({ teacherId }: { teacherId: string }) {
  const { sessions, isLoading, error } = useUpcomingSessions(teacherId);
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

describe('useUpcomingSessions', () => {
  beforeEach(() => {
    mockGetDocs.mockReset();
    mockOnSnapshot.mockReset();
    mockQuery.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();

    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      if (getCollectionName(queryRef as any) === 'enrollments') {
        return {
          docs: [
            makeDoc('enr-1', { teacherId: 'teacher-1', kidId: 'kid-1', courseId: 'course-1' }),
            makeDoc('enr-2', { teacherIds: ['teacher-1'], kidId: 'kid-2', courseId: 'course-1' }),
            makeDoc('enr-3', { assignedTeacherId: 'teacher-1', kidId: 'kid-3', courseId: 'course-1' }),
            makeDoc('enr-4', { primaryTeacherId: 'teacher-1', kidId: 'kid-4', courseId: 'course-1' }),
            makeDoc('enr-5', { teacherUid: 'teacher-1', kidId: 'kid-5', courseId: 'course-1' }),
            makeDoc('enr-6', { teacher_id: 'teacher-1', kidId: 'kid-6', courseId: 'course-1' }),
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
      const upcomingDates = Array.from({ length: 7 }, (_, index) =>
        format(addDays(new Date(), index + 1), 'yyyy-MM-dd'),
      );
      const docsByField: Record<string, ReturnType<typeof makeDoc>[]> = {
        teacherId: [makeDoc('session-direct', { teacherId: 'teacher-1', enrollmentId: 'enr-1', date: upcomingDates[1], startTime: '20:00', kidId: 'kid-1', status: 'scheduled' })],
        teacherIds: [makeDoc('session-array', { teacherIds: ['teacher-1'], enrollmentId: 'enr-2', date: upcomingDates[2], startTime: '20:00', kidId: 'kid-2', status: 'scheduled' })],
        assignedTeacherId: [makeDoc('session-assigned', { assignedTeacherId: 'teacher-1', enrollmentId: 'enr-3', date: upcomingDates[3], startTime: '20:00', kidId: 'kid-3', status: 'scheduled' })],
        primaryTeacherId: [makeDoc('session-primary', { primaryTeacherId: 'teacher-1', enrollmentId: 'enr-4', date: upcomingDates[4], startTime: '20:00', kidId: 'kid-4', status: 'scheduled' })],
        teacherUid: [makeDoc('session-uid', { teacherUid: 'teacher-1', enrollmentId: 'enr-5', date: upcomingDates[5], startTime: '20:00', kidId: 'kid-5', status: 'scheduled' })],
        teacher_id: [makeDoc('session-legacy', { teacher_id: 'teacher-1', enrollmentId: 'enr-6', date: upcomingDates[6], startTime: '20:00', kidId: 'kid-6', status: 'scheduled' })],
      };
      onNext({ docs: docsByField[field] || [] });
      return vi.fn();
    });
  });

  it('loads upcoming sessions through all teacher alias queries and keeps each query date-scoped', async () => {
    render(<TestComponent teacherId="teacher-1" />);

    await waitFor(() => expect(screen.getByText('count:6')).toBeTruthy());

    const upcomingDates = Array.from({ length: 7 }, (_, index) =>
      format(addDays(new Date(), index + 1), 'yyyy-MM-dd'),
    );
    const sessions = screen.getAllByTestId('session').map((node) => node.textContent);
    expect(sessions).toEqual([
      `session-direct:${upcomingDates[1]}:teacher-1`,
      `session-array:${upcomingDates[2]}:teacher-1`,
      `session-assigned:${upcomingDates[3]}:teacher-1`,
      `session-primary:${upcomingDates[4]}:teacher-1`,
      `session-uid:${upcomingDates[5]}:teacher-1`,
      `session-legacy:${upcomingDates[6]}:teacher-1`,
    ]);

    const aliasQueries = mockOnSnapshot.mock.calls
      .map((call) => call[0])
      .filter((queryRef) => {
        const whereClauses = extractWhereClauses(queryRef as any);
        return whereClauses.some((clause) =>
          ['teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(String(clause[0] || '')),
        );
      });

    expect(aliasQueries.length).toBeGreaterThanOrEqual(5);
    aliasQueries.forEach((queryRef) => {
      const whereClauses = extractWhereClauses(queryRef as any);
      expect(whereClauses).toEqual(
        expect.arrayContaining([
          expect.arrayContaining(['date', 'in', expect.any(Array)]),
        ]),
      );
    });
  });
});
