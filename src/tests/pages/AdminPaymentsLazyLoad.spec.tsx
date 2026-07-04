import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collectionMock,
  collectionGroupMock,
  docMock,
  documentIdMock,
  getDocMock,
  getDocsMock,
  limitMock,
  onSnapshotMock,
  orderByMock,
  queryMock,
  startAfterMock,
  startAtMock,
  endAtMock,
  whereMock,
  httpsCallableMock,
  toastSpy,
} = vi.hoisted(() => ({
  collectionMock: vi.fn((...args: any[]) => ({ kind: 'collection', args })),
  collectionGroupMock: vi.fn((...args: any[]) => ({ kind: 'collectionGroup', args })),
  docMock: vi.fn((...args: any[]) => ({ kind: 'doc', args })),
  documentIdMock: vi.fn(() => '__name__'),
  getDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  limitMock: vi.fn((value: number) => ({ kind: 'limit', value })),
  onSnapshotMock: vi.fn((_ref, next) => {
    next({
      exists: () => false,
      data: () => null,
      docs: [],
    });
    return () => {};
  }),
  orderByMock: vi.fn((field: string, direction?: string) => ({
    kind: 'orderBy',
    field,
    direction: direction || 'asc',
  })),
  queryMock: vi.fn((...args: any[]) => ({ kind: 'query', args })),
  startAfterMock: vi.fn((value: string) => ({ kind: 'startAfter', value })),
  startAtMock: vi.fn((value: string) => ({ kind: 'startAt', value })),
  endAtMock: vi.fn((value: string) => ({ kind: 'endAt', value })),
  whereMock: vi.fn((field: string, op: string, value: any) => ({
    kind: 'where',
    field,
    op,
    value,
  })),
  httpsCallableMock: vi.fn(() => vi.fn(async () => ({ data: {} }))),
  toastSpy: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  collectionGroup: collectionGroupMock,
  doc: docMock,
  documentId: documentIdMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  limit: limitMock,
  onSnapshot: onSnapshotMock,
  orderBy: orderByMock,
  query: queryMock,
  startAfter: startAfterMock,
  startAt: startAtMock,
  endAt: endAtMock,
  where: whereMock,
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: httpsCallableMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
  functions: {},
}));

vi.mock('@components/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastSpy,
  }),
}));

vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children, disabled }: any) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}));

vi.mock('@components/ui/textarea', () => ({
  Textarea: ({ children, ...props }: any) => <textarea {...props}>{children}</textarea>,
}));

import ParentPayments from '../../pages/admin/ParentPayments';
import TeacherPayments from '../../pages/admin/TeacherPayments';

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
  exists: () => true,
});

const buildSequentialDocs = (prefix: 'parent' | 'teacher', start: number, count: number, monthKey = '2026-06') =>
  Array.from({ length: count }, (_, index) => {
    const value = start + index;
    return makeDoc(`${prefix}-doc-${value}`, {
      [`${prefix}Id`]: `${prefix}-${value}`,
      monthKey,
    });
  });

const formatUserLabel = (id: string) => {
  const [prefix, suffix] = String(id || '').split('-');
  if (!prefix || !suffix) return id;
  const smallNumberLabels: Record<string, string> = {
    '1': 'One',
    '2': 'Two',
  };
  return `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)} ${smallNumberLabels[suffix] || suffix}`;
};

const getQueryParts = (input: any) => (input?.kind === 'query' ? input.args.slice(1) : []);
const hasWhere = (input: any, field: string, op?: string, matcher?: (value: any) => boolean) =>
  getQueryParts(input).some(
    (part: any) =>
      part?.kind === 'where' &&
      part.field === field &&
      (op ? part.op === op : true) &&
      (matcher ? matcher(part.value) : true)
  );
const hasLimit = (input: any, value: number) =>
  getQueryParts(input).some((part: any) => part?.kind === 'limit' && part.value === value);
const hasOrderBy = (input: any, field: string) =>
  getQueryParts(input).some((part: any) => part?.kind === 'orderBy' && part.field === field);
const hasStartAt = (input: any, matcher: (value: string) => boolean) =>
  getQueryParts(input).some(
    (part: any) => part?.kind === 'startAt' && matcher(String(part.value || ''))
  );
const hasStartAfter = (input: any, matcher: (value: string) => boolean) =>
  getQueryParts(input).some(
    (part: any) => part?.kind === 'startAfter' && matcher(String(part.value || ''))
  );
const getCollectionName = (input: any) => input?.args?.[0]?.args?.[1] || input?.args?.[1];

describe('Admin payment pages lazy loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => null,
      id: '',
    });
    getDocsMock.mockImplementation(async (input: any) => {
      const collectionName = getCollectionName(input);

      if (
        input?.kind === 'query' &&
        input.args[0]?.kind === 'collectionGroup' &&
        input.args[0]?.args?.[1] === 'months' &&
        hasLimit(input, 10)
      ) {
        return {
          docs: [
            makeDoc('month-parent-1', { parentId: 'parent-1', monthKey: '2026-06' }),
            makeDoc('month-parent-2', { parentId: 'parent-2', monthKey: '2026-06' }),
          ],
        };
      }

      if (
        input?.kind === 'query' &&
        input.args[0]?.kind === 'collectionGroup' &&
        input.args[0]?.args?.[1] === 'months' &&
        hasLimit(input, 25) &&
        !hasStartAfter(input, () => true)
      ) {
        return {
          docs: buildSequentialDocs('parent', 1, 25),
        };
      }

      if (
        input?.kind === 'query' &&
        input.args[0]?.kind === 'collectionGroup' &&
        input.args[0]?.args?.[1] === 'months' &&
        hasLimit(input, 25) &&
        hasStartAfter(input, (value) => value === 'parent-25')
      ) {
        return {
          docs: buildSequentialDocs('parent', 26, 25),
        };
      }

      if (
        input?.kind === 'query' &&
        input.args[0]?.kind === 'collectionGroup' &&
        input.args[0]?.args?.[1] === 'earnings' &&
        hasLimit(input, 10)
      ) {
        return {
          docs: [
            makeDoc('teacher-rollup-1', { teacherId: 'teacher-1', monthKey: '2026-06' }),
            makeDoc('teacher-rollup-2', { teacherId: 'teacher-2', monthKey: '2026-06' }),
          ],
        };
      }

      if (
        input?.kind === 'query' &&
        input.args[0]?.kind === 'collectionGroup' &&
        input.args[0]?.args?.[1] === 'earnings' &&
        hasLimit(input, 25) &&
        !hasStartAfter(input, () => true)
      ) {
        return {
          docs: buildSequentialDocs('teacher', 1, 25),
        };
      }

      if (
        input?.kind === 'query' &&
        input.args[0]?.kind === 'collectionGroup' &&
        input.args[0]?.args?.[1] === 'earnings' &&
        hasLimit(input, 25) &&
        hasStartAfter(input, (value) => value === 'teacher-25')
      ) {
        return {
          docs: buildSequentialDocs('teacher', 26, 25),
        };
      }

      if (collectionName === 'users' && hasWhere(input, 'email', '==', (value) => value === 'parent@example.com')) {
        return {
          docs: [
            makeDoc('parent-1', {
              displayName: 'Parent One',
              email: 'parent@example.com',
              role: 'parent',
            }),
          ],
        };
      }

      if (collectionName === 'users' && hasWhere(input, 'email', '==', (value) => value === 'teacher@example.com')) {
        return {
          docs: [
            makeDoc('teacher-1', {
              displayName: 'Teacher One',
              email: 'teacher@example.com',
              role: 'teacher',
            }),
          ],
        };
      }

      if (
        collectionName === 'users' &&
        hasOrderBy(input, 'displayName') &&
        hasStartAt(input, (value) => value === 'Par' || value === 'par')
      ) {
        return {
          docs: [
            makeDoc('parent-99', {
              displayName: 'Parent Prefix Match',
              email: 'prefix.parent@example.com',
              role: 'parent',
            }),
          ],
        };
      }

      if (
        collectionName === 'users' &&
        hasOrderBy(input, 'email') &&
        hasStartAt(input, (value) => value === 'teach' || value === 'Teach')
      ) {
        return {
          docs: [
            makeDoc('teacher-99', {
              displayName: 'Teacher Prefix Match',
              email: 'teacher.prefix@example.com',
              role: 'teacher',
            }),
          ],
        };
      }

      if (
        collectionName === 'users' &&
        hasOrderBy(input, 'phoneNormalized') &&
        hasStartAt(input, (value) => value === '9199')
      ) {
        return {
          docs: [
            makeDoc('teacher-98', {
              displayName: 'Teacher Phone Match',
              phoneNormalized: '919912345678',
              role: 'teacher',
            }),
          ],
        };
      }

      if (collectionName === 'users' && hasWhere(input, '__name__', 'in')) {
        const ids = getQueryParts(input).find((part: any) => part?.kind === 'where' && part.field === '__name__')?.value || [];
        return {
          docs: ids.map((id: string) =>
            makeDoc(id, {
              displayName: formatUserLabel(id),
              email: `${id}@example.com`,
              role: id.startsWith('parent') ? 'parent' : 'teacher',
            })
          ),
        };
      }

      if (collectionName === 'billingCharges' && hasWhere(input, 'parentId', 'in')) {
        const ids =
          getQueryParts(input).find((part: any) => part?.kind === 'where' && part.field === 'parentId')
            ?.value || [];
        return {
          docs: ids.map((id: string, idx: number) =>
            makeDoc(`charge-${id}`, {
              parentId: id,
              monthKey: '2026-06',
              amount: 1000 + idx,
              status: 'pending',
            })
          ),
        };
      }

      if (collectionName === 'billingCharges' && hasWhere(input, 'parentId', '==')) {
        const id =
          getQueryParts(input).find((part: any) => part?.kind === 'where' && part.field === 'parentId')
            ?.value || '';
        return {
          docs: [
            makeDoc(`charge-${id}`, {
              parentId: id,
              monthKey: '2026-06',
              amount: 1000,
              status: 'pending',
            }),
          ],
        };
      }

      if (collectionName === 'teacherEarnings' && hasWhere(input, 'teacherId', 'in')) {
        const ids =
          getQueryParts(input).find((part: any) => part?.kind === 'where' && part.field === 'teacherId')
            ?.value || [];
        return {
          docs: ids.map((id: string, idx: number) =>
            makeDoc(`earning-${id}`, {
              teacherId: id,
              monthKey: '2026-06',
              amount: 800 + idx,
              status: 'pending',
              sessionId: `session-${id}`,
            })
          ),
        };
      }

      if (collectionName === 'teacherEarnings' && hasWhere(input, 'teacherId', '==')) {
        const id =
          getQueryParts(input).find((part: any) => part?.kind === 'where' && part.field === 'teacherId')
            ?.value || '';
        return {
          docs: [
            makeDoc(`earning-${id}`, {
              teacherId: id,
              monthKey: '2026-06',
              amount: 800,
              status: 'pending',
              sessionId: `session-${id}`,
            }),
          ],
        };
      }

      return { docs: [] };
    });
  });

  it('preloads limited month-scoped dropdown options without loading payment details', async () => {
    render(
      <div>
        <ParentPayments />
        <TeacherPayments />
      </div>
    );

    await waitFor(() =>
      expect(
        getDocsMock.mock.calls.some(
          ([input]) =>
            input?.kind === 'query' &&
            input.args[0]?.kind === 'collectionGroup' &&
            input.args[0]?.args?.[1] === 'months' &&
            hasLimit(input, 10)
        )
      ).toBe(true)
    );

    expect(
      getDocsMock.mock.calls.some(
        ([input]) =>
          input?.kind === 'query' &&
          input.args[0]?.kind === 'collectionGroup' &&
          input.args[0]?.args?.[1] === 'earnings' &&
          hasLimit(input, 10)
      )
    ).toBe(true);
    expect(screen.getAllByText(/No data loaded yet\./).length).toBeGreaterThan(0);
    expect(screen.getByRole('option', { name: /Parent One/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Teacher One/ })).toBeTruthy();
    expect(
      getDocsMock.mock.calls.some(([input]) => getCollectionName(input) === 'billingCharges')
    ).toBe(false);
    expect(
      getDocsMock.mock.calls.some(([input]) => getCollectionName(input) === 'payments')
    ).toBe(false);
    expect(
      getDocsMock.mock.calls.some(([input]) => getCollectionName(input) === 'teacherEarnings')
    ).toBe(false);
    expect(
      getDocsMock.mock.calls.some(([input]) => getCollectionName(input) === 'teacherPayouts')
    ).toBe(false);
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });

  it('loads the first 25 month-scoped parents only after explicit action', async () => {
    render(<ParentPayments />);

    fireEvent.click(screen.getByText('Load First 25'));

    await waitFor(() =>
      expect(
        getDocsMock.mock.calls.some(
          ([input]) =>
            input?.kind === 'query' &&
            input.args[0]?.kind === 'collectionGroup' &&
            input.args[0]?.args?.[1] === 'months' &&
            hasLimit(input, 25)
        )
      ).toBe(true)
    );

    expect(screen.getByText('Showing 25 loaded month records.')).toBeTruthy();
  });

  it('loads only the selected parent scope from initial dropdown options', async () => {
    render(<ParentPayments />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Parent One/ })).toBeTruthy());

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'parent-1' },
    });
    fireEvent.click(screen.getByText('Apply / Load Selected'));

    await waitFor(() =>
      expect(
        getDocsMock.mock.calls.some(
          ([input]) =>
            getCollectionName(input) === 'billingCharges' &&
            (hasWhere(input, 'parentId', 'in', (value) => Array.isArray(value) && value.length === 1 && value[0] === 'parent-1') ||
              hasWhere(input, 'parentId', '==', (value) => value === 'parent-1'))
        )
      ).toBe(true)
    );

    expect(screen.getByText('Showing selected parent only.')).toBeTruthy();
  });

  it('loads only the selected teacher scope from initial dropdown options', async () => {
    render(<TeacherPayments />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Teacher One/ })).toBeTruthy());

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'teacher-1' },
    });
    fireEvent.click(screen.getByText('Apply / Load Selected'));

    await waitFor(() =>
      expect(
        getDocsMock.mock.calls.some(
          ([input]) =>
            getCollectionName(input) === 'teacherEarnings' &&
            (hasWhere(input, 'teacherId', 'in', (value) => Array.isArray(value) && value.length === 1 && value[0] === 'teacher-1') ||
              hasWhere(input, 'teacherId', '==', (value) => value === 'teacher-1'))
        )
      ).toBe(true)
    );

    expect(screen.getByText('Showing selected teacher only.')).toBeTruthy();
  });

  it('merges parent prefix search results into the limited dropdown options', async () => {
    render(<ParentPayments />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Parent One/ })).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText('Search parent by name, email, phone, or ID'), {
      target: { value: 'Par' },
    });

    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Parent Prefix Match/ })).toBeTruthy()
    , { timeout: 1200 });

    expect(screen.getByRole('option', { name: /Parent One/ })).toBeTruthy();
  });

  it('finds teachers by prefix email and normalized phone without broad loads', async () => {
    render(<TeacherPayments />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Teacher One/ })).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText('Search teacher by name, email, phone, or ID'), {
      target: { value: 'teach' },
    });

    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Teacher Prefix Match/ })).toBeTruthy()
    , { timeout: 1200 });

    fireEvent.change(screen.getByPlaceholderText('Search teacher by name, email, phone, or ID'), {
      target: { value: '9199' },
    });

    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Teacher Phone Match/ })).toBeTruthy()
    , { timeout: 1200 });
  });

  it('loads more month-scoped parents and merges the next page into dropdown options and table rows', async () => {
    render(<ParentPayments />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Parent One/ })).toBeTruthy());

    fireEvent.click(screen.getByText('Load First 25'));

    await waitFor(() => expect(screen.getByText('Showing 25 loaded month records.')).toBeTruthy());
    expect(screen.getAllByText('Parent 25').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Load More'));

    await waitFor(() => expect(screen.getByText('Showing 50 loaded month records.')).toBeTruthy());
    expect(screen.getAllByRole('option', { name: /Parent 26/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Parent 50').length).toBeGreaterThan(0);
  });

  it('loads more month-scoped teachers and merges the next page into dropdown options', async () => {
    render(<TeacherPayments />);

    await waitFor(() => expect(screen.getByRole('option', { name: /Teacher One/ })).toBeTruthy());

    fireEvent.click(screen.getByText('Load First 25'));

    await waitFor(() => expect(screen.getByText('Showing 25 loaded month records.')).toBeTruthy());

    fireEvent.click(screen.getByText('Load More'));

    await waitFor(() => expect(screen.getByText('Showing 50 loaded month records.')).toBeTruthy());
    expect(screen.getAllByRole('option', { name: /Teacher 26/ }).length).toBeGreaterThan(0);
  });
});
