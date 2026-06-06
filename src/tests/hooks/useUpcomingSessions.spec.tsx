import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { addDays, format } from 'date-fns';
import fs from 'node:fs';
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
import {
  getSessionInlineStudentNames,
  getSessionStudentLabel,
} from '../../pages/teacher/components/upcoming-sessions/UpcomingSessionsView';

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

  it('documents the alias upcoming-session indexes in firestore.indexes.json', () => {
    const raw = fs.readFileSync(
      '/Users/tinysteps/Documents/Tinysteps-react-v1/firestore.indexes.json',
      'utf8',
    );
    const config = JSON.parse(raw) as { indexes?: Array<{ collectionGroup?: string; fields?: Array<{ fieldPath?: string; arrayConfig?: string; order?: string }> }> };
    const classSessionIndexes = (config.indexes || []).filter((entry) => entry.collectionGroup === 'classSessions');

    const hasIndex = (fieldPath: string, mode: 'order' | 'array') =>
      classSessionIndexes.some((entry) => {
        const fields = entry.fields || [];
        return (
          fields.some((field) => field.fieldPath === fieldPath && (mode === 'array' ? field.arrayConfig === 'CONTAINS' : field.order === 'ASCENDING')) &&
          fields.some((field) => field.fieldPath === 'date' && field.order === 'ASCENDING') &&
          fields.some((field) => field.fieldPath === 'startTime' && field.order === 'ASCENDING')
        );
      });

    expect(hasIndex('teacherIds', 'array')).toBe(true);
    expect(hasIndex('assignedTeacherId', 'order')).toBe(true);
    expect(hasIndex('primaryTeacherId', 'order')).toBe(true);
    expect(hasIndex('teacherUid', 'order')).toBe(true);
    expect(hasIndex('teacher_id', 'order')).toBe(true);
  });

  it('documents teacherIds ownership directly in the classSessions Firestore rule', () => {
    const raw = fs.readFileSync(
      '/Users/tinysteps/Documents/Tinysteps-react-v1/firestore.rules',
      'utf8',
    );

    expect(raw).toContain("function teacherOwnsDocViaAliases(data)");
    expect(raw).toContain("|| request.auth.uid in data.teacherIds");
    expect(raw).toContain("allow get: if isAdmin()");
    expect(raw).toContain("|| teacherOwnsDocViaAliases(resource.data)");
    expect(raw).toContain("allow list: if isAdmin()");
    expect(raw).not.toContain("(isTeacherToken() && teacherOwnsDocViaAliases(resource.data))");
  });

  it('prefers inline session snapshot child names over count labels', () => {
    const session = {
      id: 'session-1',
      teacherId: 'teacher-1',
      courseId: 'course-1',
      date: '2026-06-08',
      startTime: '20:00',
      endTime: '20:30',
      kidIds: ['kid-1'],
      status: 'scheduled' as const,
      studentName: 'Idhiksha',
      kidName: 'Idhiksha',
      studentNames: ['Idhiksha'],
    };

    expect(getSessionInlineStudentNames(session)).toEqual(['Idhiksha']);
    expect(getSessionStudentLabel(session)).toBe('Idhiksha');
  });

  it('falls back safely to a singular count label when no child name is available', () => {
    const session = {
      id: 'session-2',
      teacherId: 'teacher-1',
      courseId: 'course-1',
      date: '2026-06-08',
      startTime: '20:00',
      endTime: '20:30',
      kidIds: ['kid-1'],
      status: 'scheduled' as const,
    };

    expect(getSessionInlineStudentNames(session)).toEqual([]);
    expect(getSessionStudentLabel(session)).toBe('1 student');
  });

  it('resolves a real child name from id-based lookup data before falling back to count labels', () => {
    const session = {
      id: 'session-lookup',
      teacherId: 'teacher-1',
      courseId: 'course-1',
      date: '2026-06-08',
      startTime: '20:00',
      endTime: '20:30',
      kidIds: [],
      childIds: ['child-1'],
      childrenIds: ['child-1'],
      status: 'scheduled' as const,
    };

    expect(
      getSessionStudentLabel(session, {
        entityDocById: new Map([
          ['child-1', { fullName: 'Idhiksha' }],
        ]),
      }),
    ).toBe('Idhiksha');
  });

  it('surfaces classSessions permission errors instead of switching to broader fallback reads', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnSnapshot.mockReset();
    mockGetDocs.mockClear();

    mockOnSnapshot.mockImplementation((_queryRef, _onNext, onError) => {
      onError?.(Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' }));
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" />);

    await waitFor(() =>
      expect(screen.getByText('error:Missing or insufficient permissions.')).toBeTruthy(),
    );

    const classSessionGetDocsCalls = mockGetDocs.mock.calls.filter(
      ([queryRef]) => getCollectionName(queryRef as any) === 'classSessions',
    );
    expect(classSessionGetDocsCalls).toHaveLength(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[useUpcomingSessions] error',
      expect.objectContaining({
        queryName: 'primary',
        collection: 'classSessions',
        aliasField: 'teacherId',
        op: '==',
        code: 'permission-denied',
        error: 'Missing or insufficient permissions.',
        dateRange: expect.objectContaining({
          type: 'in',
        }),
        authUid: 'teacher-1',
      }),
    );
    consoleErrorSpy.mockRestore();
  });

  it('keeps the teacherIds permission-denied path visible and does not create fallback classSessions reads', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnSnapshot.mockReset();
    mockGetDocs.mockClear();

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
      const upcomingDates = Array.from({ length: 7 }, (_, index) =>
        format(addDays(new Date(), index + 1), 'yyyy-MM-dd'),
      );
      const docsByField: Record<string, ReturnType<typeof makeDoc>[]> = {
        teacherId: [makeDoc('session-direct', { teacherId: 'teacher-1', enrollmentId: 'enr-1', date: upcomingDates[1], startTime: '20:00', kidId: 'kid-1', status: 'scheduled' })],
        assignedTeacherId: [makeDoc('session-assigned', { assignedTeacherId: 'teacher-1', enrollmentId: 'enr-3', date: upcomingDates[3], startTime: '20:00', kidId: 'kid-3', status: 'scheduled' })],
        primaryTeacherId: [makeDoc('session-primary', { primaryTeacherId: 'teacher-1', enrollmentId: 'enr-4', date: upcomingDates[4], startTime: '20:00', kidId: 'kid-4', status: 'scheduled' })],
        teacherUid: [makeDoc('session-uid', { teacherUid: 'teacher-1', enrollmentId: 'enr-5', date: upcomingDates[5], startTime: '20:00', kidId: 'kid-5', status: 'scheduled' })],
        teacher_id: [makeDoc('session-legacy', { teacher_id: 'teacher-1', enrollmentId: 'enr-6', date: upcomingDates[6], startTime: '20:00', kidId: 'kid-6', status: 'scheduled' })],
      };
      onNext({ docs: docsByField[field] || [] });
      return vi.fn();
    });

    render(<TestComponent teacherId="teacher-1" />);

    await waitFor(() =>
      expect(screen.getByText('error:Missing or insufficient permissions.')).toBeTruthy(),
    );

    const classSessionGetDocsCalls = mockGetDocs.mock.calls.filter(
      ([queryRef]) => getCollectionName(queryRef as any) === 'classSessions',
    );
    expect(classSessionGetDocsCalls).toHaveLength(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[useUpcomingSessions] error',
      expect.objectContaining({
        queryName: 'teacherIds',
        collection: 'classSessions',
        aliasField: 'teacherIds',
        op: 'array-contains',
        code: 'permission-denied',
        error: 'Missing or insufficient permissions.',
        authUid: 'teacher-1',
        dateRange: expect.objectContaining({
          type: 'in',
        }),
      }),
    );
    consoleErrorSpy.mockRestore();
  });

  it('logs each listener alias with structured metadata before subscribing', async () => {
    const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    render(<TestComponent teacherId="teacher-1" />);

    await waitFor(() => expect(screen.getByText('count:6')).toBeTruthy());

    expect(consoleDebugSpy).toHaveBeenCalledWith(
      '[useUpcomingSessions] listen',
      expect.objectContaining({
        queryName: 'primary',
        collection: 'classSessions',
        aliasField: 'teacherId',
        op: '==',
        authUid: 'teacher-1',
        dateRange: expect.objectContaining({
          type: 'in',
        }),
      }),
    );
    expect(consoleDebugSpy).toHaveBeenCalledWith(
      '[useUpcomingSessions] listen',
      expect.objectContaining({
        queryName: 'teacherIds',
        collection: 'classSessions',
        aliasField: 'teacherIds',
        op: 'array-contains',
        authUid: 'teacher-1',
        dateRange: expect.objectContaining({
          type: 'in',
        }),
      }),
    );
    consoleDebugSpy.mockRestore();
  });
});
