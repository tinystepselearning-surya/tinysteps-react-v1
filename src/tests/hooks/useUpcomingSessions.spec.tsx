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
  mockIsSessionCanonicalForEnrollment: vi.fn(
    (_sessionLike?: Record<string, unknown>, _enrollmentLike?: Record<string, unknown>) => true,
  ),
  mockIsScheduleExceptionSession: vi.fn(
    (_sessionLike?: Record<string, unknown>) => false,
  ),
  mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment: vi.fn(
    (_sessionLike?: Record<string, unknown>, _teacherId?: string) => false,
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

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

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

const getTeacherField = (queryRef: { args: Array<{ kind?: string; args?: unknown[] }> }) => {
  const teacherClause = extractWhereClauses(queryRef).find((args) =>
    ['teacherId', 'teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(
      String(args[0] || ''),
    ),
  );
  return String(teacherClause?.[0] || '');
};

const tomorrowDate = () => format(addDays(new Date(), 1), 'yyyy-MM-dd');
const specificDate = () => format(addDays(new Date(), 4), 'yyyy-MM-dd');

const canonicalSession = (
  id: string,
  date: string,
  overrides: Record<string, unknown> = {},
) => makeDoc(id, {
  teacherId: 'teacher-1',
  enrollmentId: 'enr-1',
  date,
  startTime: '18:00',
  kidId: 'kid-1',
  status: 'scheduled',
  ...overrides,
});

describe('useUpcomingSessions B4 canonical read cutover', () => {
  beforeEach(() => {
    mockGetDocs.mockReset();
    mockOnSnapshot.mockReset();
    mockQuery.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();

    mockIsSessionCanonicalForEnrollment.mockReset();
    mockIsSessionCanonicalForEnrollment.mockImplementation(
      (_sessionLike?: Record<string, unknown>, _enrollmentLike?: Record<string, unknown>) => true,
    );
    mockIsScheduleExceptionSession.mockReset();
    mockIsScheduleExceptionSession.mockImplementation(() => false);
    mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment.mockReset();
    mockShouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment.mockImplementation(() => false);

    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      if (collectionName === 'enrollments') {
        return {
          docs: [makeDoc('enr-1', {
            teacherId: 'teacher-1',
            kidId: 'kid-1',
            courseId: 'course-1',
            status: 'active',
          })],
        };
      }
      return { docs: [] };
    });

    mockOnSnapshot.mockImplementation((queryRef, onNext) => {
      const whereClauses = extractWhereClauses(queryRef as any);
      const selectedDate = String(whereClauses.find((args) => args[0] === 'date')?.[2] || '');
      onNext({ docs: [canonicalSession(`session-${selectedDate}`, selectedDate)] });
      return vi.fn();
    });
  });

  it('defaults to tomorrow and uses one canonical teacherId listener with no classSessions getDocs fallbacks', async () => {
    render(<TestComponent teacherId="teacher-1" />);

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());
    expect(screen.getByText(`session-${tomorrowDate()}:${tomorrowDate()}:teacher-1`)).toBeTruthy();
    expect(getDefaultUpcomingSelectedDate()).toBe(tomorrowDate());

    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    const [listenerQuery] = mockOnSnapshot.mock.calls[0];
    expect(getTeacherField(listenerQuery as any)).toBe('teacherId');
    expect(extractWhereClauses(listenerQuery as any)).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(['teacherId', '==', 'teacher-1']),
        expect.arrayContaining(['date', '==', tomorrowDate()]),
      ]),
    );

    const classSessionGetDocsCalls = mockGetDocs.mock.calls.filter(
      ([queryRef]) => getCollectionName(queryRef as any) === 'classSessions',
    );
    expect(classSessionGetDocsCalls).toHaveLength(0);
  });

  it('loads only the explicitly selected date', async () => {
    render(<TestComponent teacherId="teacher-1" selectedDate={specificDate()} />);

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());
    expect(screen.getByText(`session-${specificDate()}:${specificDate()}:teacher-1`)).toBeTruthy();

    const [listenerQuery] = mockOnSnapshot.mock.calls[0];
    expect(extractWhereClauses(listenerQuery as any)).toEqual(
      expect.arrayContaining([expect.arrayContaining(['date', '==', specificDate()])]),
    );
  });

  it('keeps a transferred session visible for the new canonical teacher even when legacy aliases are stale', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      if (getCollectionName(queryRef as any) === 'enrollments') {
        return {
          docs: [makeDoc('enr-transfer', {
            teacherId: 'teacher-1',
            teacherIds: ['teacher-old'],
            assignedTeacherId: 'teacher-old',
            kidId: 'kid-2',
            courseId: 'course-1',
            status: 'active',
          })],
        };
      }
      return { docs: [] };
    });
    mockOnSnapshot.mockImplementation((_queryRef, onNext) => {
      onNext({
        docs: [canonicalSession('session-transferred', specificDate(), {
          teacherId: 'teacher-1',
          teacherIds: ['teacher-old'],
          assignedTeacherId: 'teacher-old',
          enrollmentId: 'enr-transfer',
          kidId: 'kid-2',
          startTime: '18:30',
        })],
      });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" selectedDate={specificDate()} />);

    await waitFor(() => expect(screen.getByText('count:1')).toBeTruthy());
    expect(screen.getByText(`session-transferred:${specificDate()}:teacher-1`)).toBeTruthy();
  });

  it('rejects a stale-alias session if a backend unexpectedly returns a different canonical teacher', async () => {
    mockOnSnapshot.mockImplementation((_queryRef, onNext) => {
      onNext({
        docs: [canonicalSession('session-old-alias', specificDate(), {
          teacherId: 'teacher-2',
          teacherIds: ['teacher-1'],
          assignedTeacherId: 'teacher-1',
        })],
      });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" selectedDate={specificDate()} />);

    await waitFor(() => expect(screen.getByText('count:0')).toBeTruthy());
    expect(screen.queryByText(/session-old-alias/)).toBeNull();
  });

  it('fails closed for recurring sessions when enrollment hydration fails', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      if (getCollectionName(queryRef as any) === 'enrollments') {
        throw new Error('enrollment lookup failed');
      }
      return { docs: [] };
    });
    mockOnSnapshot.mockImplementation((_queryRef, onNext) => {
      onNext({
        docs: [canonicalSession('session-unverified', specificDate(), {
          enrollmentId: 'enr-missing',
          courseId: 'phonics',
          source: 'enrollmentSchedule',
        })],
      });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" selectedDate={specificDate()} />);

    await waitFor(() => expect(screen.getByText('count:0')).toBeTruthy());
    expect(screen.queryByText(/session-unverified/)).toBeNull();
  });
});
