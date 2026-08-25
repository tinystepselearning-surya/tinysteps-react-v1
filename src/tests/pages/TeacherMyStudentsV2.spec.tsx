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
  Timestamp: { fromMillis: mockTimestampFromMillis },
  collection: mockCollection,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { uid: 'teacher-1', role: 'teacher' },
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

const getTeacherField = (queryRef: { args: Array<{ kind?: string; args?: unknown[] }> }) => {
  const teacherClause = extractWhereClauses(queryRef).find((clause) =>
    ['teacherId', 'teacherIds', 'assignedTeacherId', 'primaryTeacherId', 'teacherUid', 'teacher_id'].includes(
      String(clause[0] || ''),
    ),
  );
  return String(teacherClause?.[0] || '');
};

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TeacherMyStudentsV2 teacherId="teacher-1" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const canonicalEnrollment = (id: string, overrides: Record<string, unknown> = {}) =>
  makeDoc(id, {
    teacherId: 'teacher-1',
    kidId: 'kid-1',
    studentName: 'Asha',
    courseName: 'Phonics',
    courseId: 'phonics',
    parentName: 'Maya',
    status: 'active',
    ...overrides,
  });

const canonicalSession = (id: string, overrides: Record<string, unknown> = {}) =>
  makeDoc(id, {
    teacherId: 'teacher-1',
    enrollmentId: 'enr-1',
    kidId: 'kid-1',
    studentName: 'Asha',
    courseName: 'Phonics',
    courseId: 'phonics',
    status: 'scheduled',
    startAt: { toMillis: () => Date.now() + 2 * 24 * 60 * 60 * 1000 },
    ...overrides,
  });

describe('TeacherMyStudentsV2 B4 canonical read cutover', () => {
  beforeEach(() => {
    mockCollection.mockClear();
    mockGetDocs.mockReset();
    mockQuery.mockClear();
    mockTimestampFromMillis.mockClear();
    mockWhere.mockClear();
  });

  it('renders active canonical enrollments and session summaries using only teacherId queries', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      if (collectionName === 'enrollments') {
        return { docs: [canonicalEnrollment('enr-1')] };
      }
      if (collectionName === 'classSessions') {
        return {
          docs: [
            canonicalSession('session-past', {
              status: 'completed',
              startAt: { toMillis: () => Date.now() - 2 * 24 * 60 * 60 * 1000 },
            }),
            canonicalSession('session-next'),
          ],
        };
      }
      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Asha')).toBeTruthy());
    expect(screen.getByText('Parent: Maya')).toBeTruthy();
    expect(screen.getByText('Phonics')).toBeTruthy();
    expect(screen.getByText('Active 1')).toBeTruthy();
    expect(
      screen.getAllByText((_, node) => node?.textContent?.includes('2 total') ?? false).length,
    ).toBeGreaterThan(0);

    const teacherFields = mockGetDocs.mock.calls
      .map(([queryRef]) => getTeacherField(queryRef as any))
      .filter(Boolean);
    expect(teacherFields).toEqual(['teacherId', 'teacherId']);

    const collectionNames = mockCollection.mock.calls.map(([, name]) => name);
    expect(collectionNames).not.toContain('kids');
    expect(collectionNames).not.toContain('students');
  });

  it('treats legacy aliases as passive metadata when canonical teacherId is present', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      if (collectionName === 'enrollments') {
        return {
          docs: [canonicalEnrollment('enr-stale', {
            teacherIds: ['teacher-old'],
            assignedTeacherId: 'teacher-old',
            kidId: 'kid-7',
            kidName: 'Current Student',
            studentName: 'Current Student',
            courseName: 'Conversation',
            courseId: 'conversation',
          })],
        };
      }
      if (collectionName === 'classSessions') {
        return {
          docs: [canonicalSession('session-stale', {
            enrollmentId: 'enr-stale',
            teacherIds: ['teacher-old'],
            assignedTeacherId: 'teacher-old',
            kidId: 'kid-7',
            kidName: 'Current Student',
            studentName: 'Current Student',
            courseName: 'Conversation',
            courseId: 'conversation',
          })],
        };
      }
      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Current Student')).toBeTruthy());
    expect(screen.getByText('Conversation')).toBeTruthy();
    expect(screen.getByText('Active 1')).toBeTruthy();
  });

  it('does not render a row whose canonical teacherId belongs to another teacher even if stale aliases match', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      if (collectionName === 'enrollments') {
        return {
          docs: [canonicalEnrollment('enr-wrong', {
            teacherId: 'teacher-2',
            teacherIds: ['teacher-1'],
            assignedTeacherId: 'teacher-1',
            studentName: 'Should Not Appear',
          })],
        };
      }
      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('No active students.')).toBeTruthy());
    expect(screen.queryByText('Should Not Appear')).toBeNull();
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
      if (collectionName === 'enrollments') {
        return {
          docs: [canonicalEnrollment('enr-missing-name', {
            kidId: 'kid-12',
            studentName: undefined,
            childName: undefined,
            kidName: undefined,
            courseName: 'Math',
            courseId: 'math',
          })],
        };
      }
      return { docs: [] };
    });

    renderComponent();

    await waitFor(() => expect(screen.getByText('Student name pending')).toBeTruthy());
    expect(screen.queryByText('Unnamed student')).toBeNull();
  });

  it('keeps archived and inactive enrollments out of Active and shows them under Past', async () => {
    mockGetDocs.mockImplementation(async (queryRef: unknown) => {
      const collectionName = getCollectionName(queryRef as any);
      if (collectionName === 'enrollments') {
        return {
          docs: [
            canonicalEnrollment('enr-active', { kidId: 'kid-20', studentName: 'Current Student' }),
            canonicalEnrollment('enr-archived', {
              kidId: 'kid-21',
              studentName: 'Archived Student',
              courseName: 'Writing',
              courseId: 'writing',
              status: 'archived',
            }),
            canonicalEnrollment('enr-inactive', {
              kidId: 'kid-22',
              studentName: 'Inactive Student',
              courseName: 'Math',
              courseId: 'math',
              status: 'inactive',
            }),
          ],
        };
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

  it('shows no active students only when canonical queries succeed with zero rows', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    renderComponent();

    await waitFor(() => expect(screen.getByText('No active students.')).toBeTruthy());
    expect(screen.queryByText('Unable to load students due to permissions')).toBeNull();
  });
});
