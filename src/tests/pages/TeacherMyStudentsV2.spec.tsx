import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCollection,
  mockGetDocs,
  mockQuery,
  mockTimestampFromMillis,
  mockWhere,
} = vi.hoisted(() => ({
  mockCollection: vi.fn((_db: unknown, name: string) => ({ kind: 'collection', name })),
  mockGetDocs: vi.fn(),
  mockQuery: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  mockTimestampFromMillis: vi.fn((ms: number) => ({
    toMillis: () => ms,
    seconds: Math.floor(ms / 1000),
  })),
  mockWhere: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromMillis: mockTimestampFromMillis,
  },
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

const permissionDeniedError = () =>
  Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' });

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

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TeacherMyStudentsV2 teacherId="teacher-1" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TeacherMyStudentsV2', () => {
  beforeEach(() => {
    mockCollection.mockClear();
    mockGetDocs.mockReset();
    mockQuery.mockClear();
    mockTimestampFromMillis.mockClear();
    mockWhere.mockClear();
  });

  it('renders active assigned enrollments from snapshot data, dedupes alias results, and avoids kids/students reads', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);

      if (collectionName === 'enrollments') {
        const docsByAlias: Record<string, ReturnType<typeof makeDoc>[]> = {
          teacherId: [
            makeDoc('enr-direct', {
              teacherId: 'teacher-1',
              kidId: 'kid-1',
              studentName: 'Asha',
              courseName: 'Phonics',
              courseId: 'phonics',
              parentName: 'Maya',
              status: 'active',
            }),
          ],
          teacherIds: [
            makeDoc('enr-direct', {
              teacherIds: ['teacher-1'],
              kidId: 'kid-1',
              studentName: 'Asha',
              courseName: 'Phonics',
              courseId: 'phonics',
              parentName: 'Maya',
              status: 'active',
            }),
          ],
        };
        return { docs: docsByAlias[aliasField] || [] };
      }

      if (collectionName === 'classSessions') {
        const docsByAlias: Record<string, ReturnType<typeof makeDoc>[]> = {
          teacherId: [
            makeDoc('session-past', {
              teacherId: 'teacher-1',
              enrollmentId: 'enr-direct',
              kidId: 'kid-1',
              studentName: 'Asha',
              courseName: 'Phonics',
              courseId: 'phonics',
              status: 'completed',
              startAt: { toMillis: () => Date.now() - 2 * 24 * 60 * 60 * 1000 },
            }),
            makeDoc('session-next', {
              teacherId: 'teacher-1',
              enrollmentId: 'enr-direct',
              kidId: 'kid-1',
              studentName: 'Asha',
              courseName: 'Phonics',
              courseId: 'phonics',
              status: 'scheduled',
              startAt: { toMillis: () => Date.now() + 2 * 24 * 60 * 60 * 1000 },
            }),
          ],
        };
        return { docs: docsByAlias[aliasField] || [] };
      }

      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Asha')).toBeTruthy());

    expect(screen.getByText('Parent: Maya')).toBeTruthy();
    expect(screen.getByText('Phonics')).toBeTruthy();
    expect(
      screen.getAllByText((_, node) => node?.textContent?.includes('2 total') ?? false).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Active 1')).toBeTruthy();
    expect(screen.queryByText('No active students.')).toBeNull();

    const collectionNames = mockCollection.mock.calls.map(([, name]) => name);
    expect(collectionNames).not.toContain('kids');
    expect(collectionNames).not.toContain('students');
    const enrollmentTeacherIdsQueries = mockQuery.mock.calls.filter((call) => {
      const queryRef = call[0] as any;
      return queryRef?.kind === 'collection' && queryRef?.name === 'enrollments';
    });
    expect(
      enrollmentTeacherIdsQueries.some((call) =>
        call.some((entry: any) => entry?.kind === 'where' && entry?.args?.[0] === 'teacherIds'),
      ),
    ).toBe(false);
  });

  it('supports reassigned teacher alias fields for active enrollments', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);

      if (collectionName === 'enrollments') {
        const docsByAlias: Record<string, ReturnType<typeof makeDoc>[]> = {
          assignedTeacherId: [
            makeDoc('enr-assigned', {
              assignedTeacherId: 'teacher-1',
              childId: 'child-1',
              childName: 'Reassigned Student',
              courseName: 'Reading',
              courseId: 'reading',
              status: 'active',
            }),
          ],
          primaryTeacherId: [
            makeDoc('enr-primary', {
              primaryTeacherId: 'teacher-1',
              childId: 'child-2',
              childName: 'Primary Student',
              courseName: 'Writing',
              courseId: 'writing',
              status: 'active',
            }),
          ],
        };
        return { docs: docsByAlias[aliasField] || [] };
      }

      if (collectionName === 'classSessions') {
        const docsByAlias: Record<string, ReturnType<typeof makeDoc>[]> = {
          assignedTeacherId: [
            makeDoc('session-assigned', {
              assignedTeacherId: 'teacher-1',
              enrollmentId: 'enr-assigned',
              childId: 'child-1',
              childName: 'Reassigned Student',
              courseName: 'Reading',
              courseId: 'reading',
              status: 'scheduled',
              startAt: { toMillis: () => Date.now() + 24 * 60 * 60 * 1000 },
            }),
          ],
          primaryTeacherId: [
            makeDoc('session-primary', {
              primaryTeacherId: 'teacher-1',
              enrollmentId: 'enr-primary',
              childId: 'child-2',
              childName: 'Primary Student',
              courseName: 'Writing',
              courseId: 'writing',
              status: 'scheduled',
              startAt: { toMillis: () => Date.now() + 2 * 24 * 60 * 60 * 1000 },
            }),
          ],
        };
        return { docs: docsByAlias[aliasField] || [] };
      }

      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Reassigned Student')).toBeTruthy());

    expect(screen.getByText('Primary Student')).toBeTruthy();
    expect(screen.getByText('Active 2')).toBeTruthy();
  });

  it('keeps teacherIds as passive metadata on already-authorized enrollment docs', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);

      if (collectionName === 'enrollments') {
        if (aliasField === 'teacherId') {
          return {
            docs: [
              makeDoc('enr-array', {
                teacherId: 'teacher-1',
                teacherIds: ['teacher-1'],
                kidIds: ['kid-7'],
                kidName: 'Array Assigned Student',
                courseName: 'Conversation',
                courseId: 'conversation',
                status: 'active',
              }),
            ],
          };
        }
        return { docs: [] };
      }

      if (collectionName === 'classSessions') {
        if (aliasField === 'teacherId') {
          return {
            docs: [
              makeDoc('session-array', {
                teacherId: 'teacher-1',
                teacherIds: ['teacher-1'],
                enrollmentId: 'enr-array',
                kidIds: ['kid-7'],
                kidName: 'Array Assigned Student',
                courseName: 'Conversation',
                courseId: 'conversation',
                status: 'scheduled',
                startAt: { toMillis: () => Date.now() + 24 * 60 * 60 * 1000 },
              }),
            ],
          };
        }
        return { docs: [] };
      }

      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Array Assigned Student')).toBeTruthy());

    expect(screen.getByText('Conversation')).toBeTruthy();
    expect(screen.getByText('Active 1')).toBeTruthy();
  });

  it('shows a permission-specific error state instead of an empty state', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);

      if (collectionName === 'enrollments' || collectionName === 'classSessions') {
        throw permissionDeniedError();
      }

      return { docs: [] };
    });

    renderComponent();

    await waitFor(() =>
      expect(screen.getByText('Unable to load students due to permissions')).toBeTruthy(),
    );

    expect(screen.queryByText('No active students.')).toBeNull();
  });

  it('falls back to Student name pending when authorized snapshots do not include a name', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);

      if (collectionName === 'enrollments' && aliasField === 'teacherId') {
        return {
          docs: [
            makeDoc('enr-missing-name', {
              teacherId: 'teacher-1',
              kidId: 'kid-12',
              courseName: 'Math',
              courseId: 'math',
              status: 'active',
            }),
          ],
        };
      }

      if (collectionName === 'classSessions') {
        return { docs: [] };
      }

      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Student name pending')).toBeTruthy());
    expect(screen.queryByText('Unnamed student')).toBeNull();
  });

  it('keeps successful results visible when one alias query is permission-denied', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);

      if (aliasField === 'assignedTeacherId') {
        throw permissionDeniedError();
      }

      if (collectionName === 'enrollments' && aliasField === 'teacherId') {
        return {
          docs: [
            makeDoc('enr-visible', {
              teacherId: 'teacher-1',
              kidId: 'kid-15',
              studentName: 'Visible Student',
              courseName: 'Grammar',
              courseId: 'grammar',
              status: 'active',
            }),
          ],
        };
      }

      if (collectionName === 'classSessions' && aliasField === 'teacherId') {
        return {
          docs: [
            makeDoc('session-visible', {
              teacherId: 'teacher-1',
              enrollmentId: 'enr-visible',
              kidId: 'kid-15',
              studentName: 'Visible Student',
              courseName: 'Grammar',
              courseId: 'grammar',
              status: 'scheduled',
              startAt: { toMillis: () => Date.now() + 24 * 60 * 60 * 1000 },
            }),
          ],
        };
      }

      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Visible Student')).toBeTruthy());

    expect(screen.getByText('Active 1')).toBeTruthy();
    expect(screen.queryByText('Unable to load students due to permissions')).toBeNull();
  });

  it('keeps archived and inactive enrollments out of Active and shows them under Past', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      const aliasField = getTeacherAliasField(queryRef as any);

      if (collectionName === 'enrollments' && aliasField === 'teacherId') {
        return {
          docs: [
            makeDoc('enr-active', {
              teacherId: 'teacher-1',
              kidId: 'kid-20',
              studentName: 'Current Student',
              courseName: 'Phonics',
              courseId: 'phonics',
              status: 'active',
            }),
            makeDoc('enr-archived', {
              teacherId: 'teacher-1',
              kidId: 'kid-21',
              studentName: 'Archived Student',
              courseName: 'Writing',
              courseId: 'writing',
              status: 'archived',
            }),
            makeDoc('enr-inactive', {
              teacherId: 'teacher-1',
              kidId: 'kid-22',
              studentName: 'Inactive Student',
              courseName: 'Math',
              courseId: 'math',
              status: 'inactive',
            }),
          ],
        };
      }

      if (collectionName === 'classSessions') {
        return { docs: [] };
      }

      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Current Student')).toBeTruthy());

    expect(screen.queryByText('Archived Student')).toBeNull();
    expect(screen.queryByText('Inactive Student')).toBeNull();
    expect(screen.getByText('Active 1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Past Students' }));

    await waitFor(() => expect(screen.getByText('Archived Student')).toBeTruthy());
    expect(screen.getByText('Inactive Student')).toBeTruthy();
    expect(screen.queryByText('Current Student')).toBeNull();
    expect(screen.getByText('Past 2')).toBeTruthy();
  });

  it('shows no active students only when enrollment queries succeed with zero rows', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    renderComponent();

    await waitFor(() => expect(screen.getByText('No active students.')).toBeTruthy());

    expect(screen.queryByText('Unable to load students due to permissions')).toBeNull();
  });
});
