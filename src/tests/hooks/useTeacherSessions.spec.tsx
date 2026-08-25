import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
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
  mockIsSessionCanonicalForEnrollment: vi.fn(() => true),
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

const getTeacherAliasField = (queryRef: { args: Array<{ kind?: string; args?: unknown[] }> }) => {
  const whereClauses = extractWhereClauses(queryRef);
  const teacherClause = whereClauses.find((args) =>
    ['teacherId', 'teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(String(args[0] || '')),
  );
  return String(teacherClause?.[0] || '');
};

const getClassSessionGetDocsCalls = () =>
  mockGetDocs.mock.calls.filter(
    ([queryRef]) => getCollectionName(queryRef as any) === 'classSessions',
  );

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
      const aliasField = getTeacherAliasField(queryRef as any);

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

      if (collectionName === 'classSessions') {
        const docsByAlias: Record<string, ReturnType<typeof makeDoc>[]> = {
          teacherIds: [makeDoc('session-array', { teacherIds: ['teacher-1'], enrollmentId: 'enr-array', date: '2026-06-08', startTime: '20:15', kidId: 'kid-2', status: 'scheduled' })],
          assignedTeacherId: [makeDoc('session-assigned', { assignedTeacherId: 'teacher-1', enrollmentId: 'enr-assigned', date: '2026-06-08', startTime: '20:30', kidId: 'kid-3', status: 'scheduled' })],
          primaryTeacherId: [makeDoc('session-primary', { primaryTeacherId: 'teacher-1', enrollmentId: 'enr-primary', date: '2026-06-08', startTime: '20:45', kidId: 'kid-4', status: 'scheduled' })],
          teacherUid: [makeDoc('session-uid', { teacherUid: 'teacher-1', enrollmentId: 'enr-uid', date: '2026-06-08', startTime: '21:00', kidId: 'kid-5', status: 'scheduled' })],
          teacher_id: [makeDoc('session-legacy', { teacher_id: 'teacher-1', enrollmentId: 'enr-legacy', date: '2026-06-08', startTime: '21:15', kidId: 'kid-6', status: 'scheduled' })],
        };
        return { docs: docsByAlias[aliasField] || [] };
      }

      return { docs: [] };
    });

    mockOnSnapshot.mockImplementation((queryRef, onNext) => {
      const aliasField = getTeacherAliasField(queryRef as any);
      const docsByAlias: Record<string, ReturnType<typeof makeDoc>[]> = {
        teacherId: [makeDoc('session-direct', { teacherId: 'teacher-1', enrollmentId: 'enr-direct', date: '2026-06-08', startTime: '20:00', kidId: 'kid-1', status: 'scheduled' })],
      };
      onNext({ docs: docsByAlias[aliasField] || [] });
      return vi.fn();
    });
  });

  it('keeps one live canonical teacherId listener and performs no legacy classSessions reads', async () => {
    render(<TestComponent teacherId="teacher-1" startDate="2026-06-08" endDate="2026-06-08" />);

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());

    expect(screen.getAllByTestId('session').map((node) => node.textContent)).toEqual([
      'session-direct:2026-06-08:teacher-1',
    ]);

    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    const primaryQueryRef = mockOnSnapshot.mock.calls[0]?.[0];
    expect(extractWhereClauses(primaryQueryRef as any)).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(['teacherId', '==', 'teacher-1']),
        expect.arrayContaining(['date', '>=', '2026-06-08']),
        expect.arrayContaining(['date', '<=', '2026-06-08']),
      ]),
    );
    expect(getClassSessionGetDocsCalls()).toHaveLength(0);
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

    expect(getClassSessionGetDocsCalls()).toHaveLength(0);
  });

  it('updates from the canonical listener without launching alias fallback getDocs', async () => {
    let nextSnapshot: ((snapshot: { docs: ReturnType<typeof makeDoc>[] }) => void) | null = null;
    mockOnSnapshot.mockReset();
    mockOnSnapshot.mockImplementation((_queryRef, onNext) => {
      nextSnapshot = onNext;
      onNext({
        docs: [
          makeDoc('session-direct', {
            teacherId: 'teacher-1',
            enrollmentId: 'enr-direct',
            date: '2026-06-08',
            startTime: '20:00',
            kidId: 'kid-1',
            status: 'scheduled',
          }),
        ],
      });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" startDate="2026-06-08" endDate="2026-06-08" />);

    await waitFor(() => expect(screen.getByText('session-direct:2026-06-08:teacher-1')).toBeTruthy());
    expect(getClassSessionGetDocsCalls()).toHaveLength(0);

    await act(async () => {
      nextSnapshot?.({
        docs: [
          makeDoc('session-updated', {
            teacherId: 'teacher-1',
            enrollmentId: 'enr-direct',
            date: '2026-06-08',
            startTime: '20:05',
            kidId: 'kid-1',
            status: 'scheduled',
          }),
        ],
      });
    });

    await waitFor(() => expect(screen.getByText('session-updated:2026-06-08:teacher-1')).toBeTruthy());
    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    expect(getClassSessionGetDocsCalls()).toHaveLength(0);
  });

  it('enriches canonical transferred sessions from enrollment snapshots without alias reads', async () => {
    mockOnSnapshot.mockReset();
    mockOnSnapshot.mockImplementation((_queryRef, onNext) => {
      onNext({
        docs: [
          makeDoc('session-transferred', {
            teacherId: 'teacher-1',
            assignedTeacherId: 'teacher-stale',
            teacherIds: ['teacher-stale'],
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
      });
      return vi.fn();
    });

    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      if (collectionName === 'enrollments') {
        return {
          docs: [
            makeDoc('enr-assigned', {
              teacherId: 'teacher-1',
              teacherIds: ['teacher-stale'],
              kidId: 'kid-3',
              childName: 'Student Three',
              courseName: 'Foundation Phonics',
            }),
          ],
        };
      }
      return { docs: [] };
    });

    render(<DetailTestComponent teacherId="teacher-1" startDate="2026-06-08" endDate="2026-06-08" />);

    await waitFor(() =>
      expect(screen.getByText('session-transferred:Student Three:Foundation Phonics')).toBeTruthy(),
    );
    expect(getClassSessionGetDocsCalls()).toHaveLength(0);
  });

  it('prefers canonical teacherId when stale alias fields disagree', async () => {
    mockOnSnapshot.mockReset();
    mockOnSnapshot.mockImplementation((_queryRef, onNext) => {
      onNext({
        docs: [
          makeDoc('session-canonical', {
            teacherId: 'teacher-1',
            teacherIds: ['teacher-stale'],
            assignedTeacherId: 'teacher-stale',
            primaryTeacherId: 'teacher-stale',
            teacherUid: 'teacher-stale',
            teacher_id: 'teacher-stale',
            enrollmentId: 'enr-direct',
            date: '2026-06-08',
            startTime: '20:00',
            kidId: 'kid-1',
            status: 'scheduled',
          }),
        ],
      });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" startDate="2026-06-08" endDate="2026-06-08" />);

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());
    expect(screen.getByText('session-canonical:2026-06-08:teacher-1')).toBeTruthy();
    expect(getClassSessionGetDocsCalls()).toHaveLength(0);
  });
});