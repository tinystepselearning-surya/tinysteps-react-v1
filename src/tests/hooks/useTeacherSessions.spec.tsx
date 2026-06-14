import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetDocs,
  mockOnSnapshot,
  mockQuery,
  mockWhere,
  mockOrderBy,
  mockIsSessionCanonicalForEnrollment,
  mockIsScheduleExceptionSession,
  mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockQuery: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  mockWhere: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
  mockOrderBy: vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args })),
  mockIsSessionCanonicalForEnrollment: vi.fn((_: Record<string, unknown>) => true),
  mockIsScheduleExceptionSession: vi.fn(() => false),
  mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment: vi.fn(() => false),
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
  isScheduleExceptionSession: mockIsScheduleExceptionSession,
  isSessionCanonicalForEnrollment: mockIsSessionCanonicalForEnrollment,
  shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment: mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment,
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

function DetailTestComponent({
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
      {sessions.map((session) => (
        <div key={session.id} data-testid="session-detail">
          {session.id}:{session.childName || session.studentName || 'Student'}:{session.courseName || session.courseId}
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
    mockIsSessionCanonicalForEnrollment.mockReset();
    mockIsSessionCanonicalForEnrollment.mockImplementation(() => true);
    mockIsScheduleExceptionSession.mockReset();
    mockIsScheduleExceptionSession.mockImplementation(() => false);
    mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment.mockReset();
    mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment.mockImplementation(() => false);

    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      if (collectionName === 'enrollments') {
        return {
          docs: [
            makeDoc('enr-direct', { teacherId: 'teacher-1', kidId: 'kid-1', childName: 'Student One', courseName: 'Foundation Phonics' }),
            makeDoc('enr-array', { teacherIds: ['teacher-1'], kidId: 'kid-2', childName: 'Student Two', courseName: 'Foundation Phonics' }),
            makeDoc('enr-assigned', { assignedTeacherId: 'teacher-1', kidId: 'kid-3', childName: 'Student Three', courseName: 'Foundation Phonics' }),
            makeDoc('enr-primary', { primaryTeacherId: 'teacher-1', kidId: 'kid-4', childName: 'Student Four', courseName: 'Foundation Phonics' }),
            makeDoc('enr-uid', { teacherUid: 'teacher-1', kidId: 'kid-5', childName: 'Student Five', courseName: 'Foundation Phonics' }),
            makeDoc('enr-legacy', { teacher_id: 'teacher-1', kidId: 'kid-6', childName: 'Student Six', courseName: 'Foundation Phonics' }),
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
        teacherIds: [makeDoc('session-array', { teacherIds: ['teacher-1'], enrollmentId: 'enr-array', date: '2026-06-08', startTime: '20:15', kidId: 'kid-2', status: 'scheduled' })],
        assignedTeacherId: [makeDoc('session-assigned', { assignedTeacherId: 'teacher-1', enrollmentId: 'enr-assigned', date: '2026-06-08', startTime: '20:30', kidId: 'kid-3', status: 'scheduled' })],
        primaryTeacherId: [makeDoc('session-primary', { primaryTeacherId: 'teacher-1', enrollmentId: 'enr-primary', date: '2026-06-08', startTime: '20:45', kidId: 'kid-4', status: 'scheduled' })],
        teacherUid: [makeDoc('session-uid', { teacherUid: 'teacher-1', enrollmentId: 'enr-uid', date: '2026-06-08', startTime: '21:00', kidId: 'kid-5', status: 'scheduled' })],
        teacher_id: [makeDoc('session-legacy', { teacher_id: 'teacher-1', enrollmentId: 'enr-legacy', date: '2026-06-08', startTime: '21:15', kidId: 'kid-6', status: 'scheduled' })],
      };
      onNext({ docs: docsByField[field] || [] });
      return vi.fn();
    });
  });

  it('keeps Today/Schedule teacher session queries date-scoped for alias reads and returns June 8 sessions', async () => {
    render(<TestComponent teacherId="teacher-1" startDate="2026-06-08" endDate="2026-06-08" />);

    await waitFor(() => expect(screen.getByText('count:6')).toBeTruthy());

    expect(screen.getAllByTestId('session').map((node) => node.textContent)).toEqual([
      'session-direct:2026-06-08:teacher-1',
      'session-array:2026-06-08:teacher-1',
      'session-assigned:2026-06-08:teacher-1',
      'session-primary:2026-06-08:teacher-1',
      'session-uid:2026-06-08:teacher-1',
      'session-legacy:2026-06-08:teacher-1',
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

    const teacherIdsQueries = aliasQueries.filter((queryRef: any) =>
      extractWhereClauses(queryRef).some((clause) => clause[0] === 'teacherIds' && clause[1] === 'array-contains' && clause[2] === 'teacher-1'),
    );
    expect(teacherIdsQueries).toHaveLength(1);
  });

  it('surfaces classSessions permission errors instead of running broader fallback reads', async () => {
    mockOnSnapshot.mockReset();
    mockGetDocs.mockClear();

    mockOnSnapshot.mockImplementation((_queryRef, _onNext, onError) => {
      onError?.(Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' }));
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" startDate="2026-06-08" endDate="2026-06-08" />);

    await waitFor(() =>
      expect(
        screen.getByText("error:Unable to load today's sessions. One or more teacher session queries were denied."),
      ).toBeTruthy(),
    );

    const classSessionGetDocsCalls = mockGetDocs.mock.calls.filter(
      ([queryRef]) => getCollectionName(queryRef as any) === 'classSessions',
    );
    expect(classSessionGetDocsCalls).toHaveLength(0);
  });

  it('keeps successful alias results visible when one alias listener fails with permission-denied', async () => {
    mockOnSnapshot.mockReset();

    mockOnSnapshot.mockImplementation((queryRef, onNext, onError) => {
      const whereClauses = extractWhereClauses(queryRef as any);
      const teacherIdsClause = whereClauses.find(
        (args) => args[0] === 'teacherIds' && args[1] === 'array-contains',
      );

      if (teacherIdsClause) {
        onError?.(Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' }));
        return vi.fn();
      }

      const teacherClause = whereClauses.find((args) =>
        ['teacherId', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(String(args[0] || '')),
      );
      const field = String(teacherClause?.[0] || '');
      const docsByField: Record<string, ReturnType<typeof makeDoc>[]> = {
        teacherId: [makeDoc('session-direct', { teacherId: 'teacher-1', enrollmentId: 'enr-direct', date: '2026-06-08', startTime: '20:00', kidId: 'kid-1', status: 'scheduled' })],
        assignedTeacherId: [makeDoc('session-assigned', { assignedTeacherId: 'teacher-1', enrollmentId: 'enr-assigned', date: '2026-06-08', startTime: '20:30', kidId: 'kid-3', status: 'scheduled' })],
        primaryTeacherId: [makeDoc('session-primary', { primaryTeacherId: 'teacher-1', enrollmentId: 'enr-primary', date: '2026-06-08', startTime: '20:45', kidId: 'kid-4', status: 'scheduled' })],
        teacherUid: [makeDoc('session-uid', { teacherUid: 'teacher-1', enrollmentId: 'enr-uid', date: '2026-06-08', startTime: '21:00', kidId: 'kid-5', status: 'scheduled' })],
        teacher_id: [makeDoc('session-legacy', { teacher_id: 'teacher-1', enrollmentId: 'enr-legacy', date: '2026-06-08', startTime: '21:15', kidId: 'kid-6', status: 'scheduled' })],
      };
      onNext({ docs: docsByField[field] || [] });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" startDate="2026-06-08" endDate="2026-06-08" />);

    await waitFor(() => expect(screen.getByText('count:5')).toBeTruthy());
    expect(screen.queryByText(/error:/)).toBeNull();
  });

  it('uses transferred enrollment child/course snapshots instead of assigned-count placeholders', async () => {
    mockOnSnapshot.mockReset();

    mockOnSnapshot.mockImplementation((queryRef, onNext) => {
      const whereClauses = extractWhereClauses(queryRef as any);
      const teacherClause = whereClauses.find((args) =>
        ['teacherId', 'teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(String(args[0] || '')),
      );
      const field = String(teacherClause?.[0] || '');
      const docsByField: Record<string, ReturnType<typeof makeDoc>[]> = {
        assignedTeacherId: [
          makeDoc('session-transferred', {
            assignedTeacherId: 'teacher-1',
            teacherIds: ['teacher-1'],
            enrollmentId: 'enr-assigned',
            date: '2026-06-08',
            startTime: '20:30',
            kidId: 'kid-3',
            childName: '1 assigned',
            courseName: 'advanced-phonics',
            courseId: 'advanced-phonics',
            status: 'scheduled',
          }),
        ],
      };
      onNext({ docs: docsByField[field] || [] });
      return vi.fn();
    });

    render(<DetailTestComponent teacherId="teacher-1" startDate="2026-06-08" endDate="2026-06-08" />);

    await waitFor(() =>
      expect(screen.getByText('session-transferred:Student Three:Foundation Phonics')).toBeTruthy(),
    );
  });

  it('keeps the repaired 18:45 session visible and filters the stale 18:30 future session after a schedule-time change', async () => {
    mockIsSessionCanonicalForEnrollment.mockImplementation((sessionLike: Record<string, unknown>) => {
      return String(sessionLike.startTime || '').trim() === '18:45';
    });

    mockOnSnapshot.mockReset();
    mockOnSnapshot.mockImplementation((queryRef, onNext) => {
      const whereClauses = extractWhereClauses(queryRef as any);
      const teacherClause = whereClauses.find((args) =>
        ['teacherId', 'teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(String(args[0] || '')),
      );
      const field = String(teacherClause?.[0] || '');
      const docsByField: Record<string, ReturnType<typeof makeDoc>[]> = {
        teacherId: [
          makeDoc('session-old-time', {
            teacherId: 'teacher-1',
            enrollmentId: 'enr-direct',
            date: '2026-06-16',
            startTime: '18:30',
            endTime: '19:05',
            kidId: 'kid-1',
            status: 'scheduled',
          }),
          makeDoc('session-repaired', {
            teacherId: 'teacher-1',
            teacherIds: ['teacher-1'],
            assignedTeacherId: 'teacher-1',
            primaryTeacherId: 'teacher-1',
            teacherUid: 'teacher-1',
            enrollmentId: 'enr-direct',
            date: '2026-06-16',
            startTime: '18:45',
            endTime: '19:20',
            kidId: 'kid-1',
            status: 'scheduled',
          }),
        ],
      };
      onNext({ docs: docsByField[field] || [] });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" startDate="2026-06-16" endDate="2026-06-16" />);

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());
    expect(screen.getByText('session-repaired:2026-06-16:teacher-1')).toBeTruthy();
    expect(screen.queryByText('session-old-time:2026-06-16:teacher-1')).toBeNull();
  });
});
