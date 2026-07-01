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
  mockIsSessionCanonicalForEnrollment,
  mockIsScheduleExceptionSession,
  mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockQuery: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  mockWhere: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
  mockOrderBy: vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args })),

  // Important: keep this mock typed with a session argument.
  // Otherwise TypeScript infers it as () => boolean and rejects
  // mockImplementation((sessionLike) => ...).
  mockIsSessionCanonicalForEnrollment: vi.fn(
    (_sessionLike?: Record<string, unknown>) => true,
  ),

  mockIsScheduleExceptionSession: vi.fn(
    (_sessionLike?: Record<string, unknown>) => false,
  ),

  mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment: vi.fn(
    (_sessionLike?: Record<string, unknown>) => false,
  ),
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

import {
  getDefaultUpcomingSelectedDate,
  useUpcomingSessions,
} from '../../pages/teacher/hooks/useUpcomingSessions';

function TestComponent({ teacherId, selectedDate }: { teacherId: string; selectedDate?: string }) {
  const { sessions, isLoading, error } = useUpcomingSessions(teacherId, selectedDate);
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

const getTeacherAliasField = (queryRef: { args: Array<{ kind?: string; args?: unknown[] }> }) => {
  const whereClauses = extractWhereClauses(queryRef);
  const teacherClause = whereClauses.find((args) =>
    ['teacherId', 'teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(String(args[0] || '')),
  );
  return String(teacherClause?.[0] || '');
};

const tomorrowDate = () => format(addDays(new Date(), 1), 'yyyy-MM-dd');
const specificDate = () => format(addDays(new Date(), 4), 'yyyy-MM-dd');

describe('useUpcomingSessions', () => {
  beforeEach(() => {
    mockGetDocs.mockReset();
    mockOnSnapshot.mockReset();
    mockQuery.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();
    mockIsSessionCanonicalForEnrollment.mockReset();
    mockIsSessionCanonicalForEnrollment.mockImplementation(
      (_sessionLike?: Record<string, unknown>) => true,
    );
    mockIsScheduleExceptionSession.mockReset();
    mockIsScheduleExceptionSession.mockImplementation(
      (_sessionLike?: Record<string, unknown>) => false,
    );
    mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment.mockReset();
    mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment.mockImplementation(
      (_sessionLike?: Record<string, unknown>) => false,
    );

    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);
      const whereClauses = extractWhereClauses(queryRef as any);
      const selectedDate = String(whereClauses.find((args) => args[0] === 'date')?.[2] || '');

      if (collectionName === 'enrollments') {
        return {
          docs: [
            makeDoc('enr-direct', { teacherId: 'teacher-1', kidId: 'kid-1', courseId: 'course-1' }),
            makeDoc('enr-array', { teacherIds: ['teacher-1'], kidId: 'kid-2', courseId: 'course-1' }),
            makeDoc('enr-assigned', { assignedTeacherId: 'teacher-1', kidId: 'kid-3', courseId: 'course-1' }),
            makeDoc('enr-primary', { primaryTeacherId: 'teacher-1', kidId: 'kid-4', courseId: 'course-1' }),
            makeDoc('enr-uid', { teacherUid: 'teacher-1', kidId: 'kid-5', courseId: 'course-1' }),
            makeDoc('enr-legacy', { teacher_id: 'teacher-1', kidId: 'kid-6', courseId: 'course-1' }),
          ],
        };
      }

      if (collectionName === 'classSessions') {
        const docsByDate: Record<string, Record<string, ReturnType<typeof makeDoc>[]>> = {
          [tomorrowDate()]: {
            teacherIds: [makeDoc('session-array', { teacherIds: ['teacher-1'], enrollmentId: 'enr-array', date: tomorrowDate(), startTime: '19:45', kidId: 'kid-2', status: 'scheduled' })],
            assignedTeacherId: [makeDoc('session-assigned', { assignedTeacherId: 'teacher-1', enrollmentId: 'enr-assigned', date: tomorrowDate(), startTime: '20:00', kidId: 'kid-3', status: 'scheduled' })],
            primaryTeacherId: [makeDoc('session-primary', { primaryTeacherId: 'teacher-1', enrollmentId: 'enr-primary', date: tomorrowDate(), startTime: '20:15', kidId: 'kid-4', status: 'scheduled' })],
            teacherUid: [makeDoc('session-uid', { teacherUid: 'teacher-1', enrollmentId: 'enr-uid', date: tomorrowDate(), startTime: '20:30', kidId: 'kid-5', status: 'scheduled' })],
            teacher_id: [makeDoc('session-legacy', { teacher_id: 'teacher-1', enrollmentId: 'enr-legacy', date: tomorrowDate(), startTime: '20:45', kidId: 'kid-6', status: 'scheduled' })],
          },
          [specificDate()]: {
            teacherIds: [makeDoc('session-specific-array', { teacherIds: ['teacher-1'], enrollmentId: 'enr-array', date: specificDate(), startTime: '18:15', kidId: 'kid-2', status: 'scheduled' })],
            assignedTeacherId: [makeDoc('session-other-day-assigned', { assignedTeacherId: 'teacher-1', enrollmentId: 'enr-assigned', date: specificDate(), startTime: '21:00', kidId: 'kid-3', status: 'scheduled' })],
          },
        };
        return { docs: docsByDate[selectedDate]?.[aliasField] || [] };
      }

      return { docs: [] };
    });

    mockOnSnapshot.mockImplementation((queryRef, onNext) => {
      const aliasField = getTeacherAliasField(queryRef as any);
      const whereClauses = extractWhereClauses(queryRef as any);
      const selectedDate = String(whereClauses.find((args) => args[0] === 'date')?.[2] || '');
      const docsByDate: Record<string, Record<string, ReturnType<typeof makeDoc>[]>> = {
        [tomorrowDate()]: {
          teacherId: [makeDoc('session-direct', { teacherId: 'teacher-1', enrollmentId: 'enr-direct', date: tomorrowDate(), startTime: '19:30', kidId: 'kid-1', status: 'scheduled' })],
        },
        [specificDate()]: {
          teacherId: [makeDoc('session-specific', { teacherId: 'teacher-1', enrollmentId: 'enr-direct', date: specificDate(), startTime: '18:00', kidId: 'kid-1', status: 'scheduled' })],
        },
      };
      onNext({ docs: docsByDate[selectedDate]?.[aliasField] || [] });
      return vi.fn();
    });
  });

  it('defaults upcoming to tomorrow only and does not run a next-7-days query', async () => {
    render(<TestComponent teacherId="teacher-1" />);

    await waitFor(() => expect(screen.getByText('count:6')).toBeTruthy());
    expect(screen.getByText(`session-direct:${tomorrowDate()}:teacher-1`)).toBeTruthy();
    expect(screen.queryByText(new RegExp(`session-specific:${specificDate()}:teacher-1`))).toBeNull();
    expect(getDefaultUpcomingSelectedDate()).toBe(tomorrowDate());

    const classSessionCalls = [
      ...mockOnSnapshot.mock.calls.map(([queryRef]) => queryRef),
      ...mockGetDocs.mock.calls
        .filter(([queryRef]) => getCollectionName(queryRef as any) === 'classSessions')
        .map(([queryRef]) => queryRef),
    ];
    classSessionCalls.forEach((queryRef) => {
      const whereClauses = extractWhereClauses(queryRef as any);
      expect(whereClauses).toEqual(
        expect.arrayContaining([
          expect.arrayContaining(['date', '==', tomorrowDate()]),
        ]),
      );
      expect(whereClauses.some((args) => args[0] === 'date' && args[1] === 'in')).toBe(false);
    });
  });

  it('loads only the selected date when a specific date is requested', async () => {
    render(<TestComponent teacherId="teacher-1" selectedDate={specificDate()} />);

    await waitFor(() => expect(screen.getByText('count:3')).toBeTruthy());
    expect(screen.getByText(`session-specific:${specificDate()}:teacher-1`)).toBeTruthy();
    expect(screen.queryByText(new RegExp(`:${tomorrowDate()}:teacher-1`))).toBeNull();
  });

  it('keeps legacy alias fallback bounded to the selected date only', async () => {
    render(<TestComponent teacherId="teacher-1" selectedDate={specificDate()} />);

    await waitFor(() => expect(screen.getByText('count:3')).toBeTruthy());

    const classSessionGetDocsCalls = mockGetDocs.mock.calls.filter(
      ([queryRef]) => getCollectionName(queryRef as any) === 'classSessions',
    );
    expect(classSessionGetDocsCalls).toHaveLength(5);
    classSessionGetDocsCalls.forEach(([queryRef]) => {
      expect(extractWhereClauses(queryRef as any)).toEqual(
        expect.arrayContaining([
          expect.arrayContaining(['date', '==', specificDate()]),
        ]),
      );
    });
  });

  it('keeps transferred future sessions visible for the new teacher on the selected date', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);
      const whereClauses = extractWhereClauses(queryRef as any);
      const selectedDate = String(whereClauses.find((args) => args[0] === 'date')?.[2] || '');

      if (collectionName === 'enrollments') {
        return {
          docs: [
            makeDoc('enr-direct', { teacherId: 'teacher-1', kidId: 'kid-1', courseId: 'course-1' }),
            makeDoc('enr-array', { teacherIds: ['teacher-1'], kidId: 'kid-2', courseId: 'course-1' }),
          ],
        };
      }

      if (collectionName === 'classSessions' && aliasField === 'teacherIds' && selectedDate === specificDate()) {
        return {
          docs: [
            makeDoc('session-transferred', {
              teacherIds: ['teacher-1', 'teacher-old'],
              assignedTeacherId: 'teacher-1',
              enrollmentId: 'enr-array',
              date: specificDate(),
              startTime: '18:30',
              kidId: 'kid-2',
              status: 'scheduled',
            }),
          ],
        };
      }

      return { docs: [] };
    });
    mockOnSnapshot.mockReset();
    mockOnSnapshot.mockImplementation((queryRef, onNext) => {
      const aliasField = getTeacherAliasField(queryRef as any);
      if (aliasField === 'teacherId') {
        onNext({
          docs: [
            makeDoc('session-specific', {
              teacherId: 'teacher-1',
              enrollmentId: 'enr-direct',
              date: specificDate(),
              startTime: '18:00',
              kidId: 'kid-1',
              status: 'scheduled',
            }),
          ],
        });
        return vi.fn();
      }
      onNext({ docs: [] });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" selectedDate={specificDate()} />);

    await waitFor(() => expect(screen.getByText('count:2')).toBeTruthy());
    expect(screen.getByText(`session-transferred:${specificDate()}:teacher-1`)).toBeTruthy();
  });

  it('does not show moved future sessions to the previous teacher on the selected date', async () => {
    mockIsSessionCanonicalForEnrollment.mockImplementation(function () {
      const sessionLike = arguments[0] as Record<string, unknown> | undefined;
      return String(sessionLike?.id || '') !== 'session-moved-away';
    });
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);
      const whereClauses = extractWhereClauses(queryRef as any);
      const selectedDate = String(whereClauses.find((args) => args[0] === 'date')?.[2] || '');

      if (collectionName === 'enrollments') {
        return {
          docs: [
            makeDoc('enr-direct', { teacherId: 'teacher-1', kidId: 'kid-1', courseId: 'course-1' }),
            makeDoc('enr-array', { teacherIds: ['teacher-1'], kidId: 'kid-2', courseId: 'course-1' }),
          ],
        };
      }

      if (collectionName === 'classSessions' && aliasField === 'teacherIds' && selectedDate === specificDate()) {
        return {
          docs: [
            makeDoc('session-moved-away', {
              teacherIds: ['teacher-1', 'teacher-2'],
              assignedTeacherId: 'teacher-2',
              enrollmentId: 'enr-array',
              date: specificDate(),
              startTime: '18:45',
              kidId: 'kid-2',
              status: 'scheduled',
            }),
          ],
        };
      }

      return { docs: [] };
    });
    mockOnSnapshot.mockReset();
    mockOnSnapshot.mockImplementation((queryRef, onNext) => {
      const aliasField = getTeacherAliasField(queryRef as any);
      if (aliasField === 'teacherId') {
        onNext({
          docs: [
            makeDoc('session-specific', {
              teacherId: 'teacher-1',
              enrollmentId: 'enr-direct',
              date: specificDate(),
              startTime: '18:00',
              kidId: 'kid-1',
              status: 'scheduled',
            }),
          ],
        });
        return vi.fn();
      }
      onNext({ docs: [] });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" selectedDate={specificDate()} />);

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());
    expect(screen.queryByText(`session-moved-away:${specificDate()}:teacher-1`)).toBeNull();
  });

  it('dedupes duplicate alias matches for the same selected date', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);
      if (collectionName === 'enrollments') {
        return { docs: [makeDoc('enr-shared', { teacherId: 'teacher-1', kidId: 'kid-1', courseId: 'course-1' })] };
      }
      if (collectionName === 'classSessions' && ['assignedTeacherId', 'teacherUid'].includes(aliasField)) {
        return {
          docs: [
            makeDoc('session-shared', {
              assignedTeacherId: 'teacher-1',
              teacherUid: 'teacher-1',
              enrollmentId: 'enr-shared',
              date: specificDate(),
              startTime: '19:00',
              kidId: 'kid-1',
              status: 'scheduled',
            }),
          ],
        };
      }
      return { docs: [] };
    });

    mockOnSnapshot.mockReset();
    mockOnSnapshot.mockImplementation((_queryRef, onNext) => {
      onNext({ docs: [] });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" selectedDate={specificDate()} />);

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());
    expect(screen.getAllByTestId('session')).toHaveLength(1);
  });
});
