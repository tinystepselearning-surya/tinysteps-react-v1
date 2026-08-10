import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collectionMock,
  collectionGroupMock,
  countMock,
  docMock,
  documentIdMock,
  getAggregateFromServerMock,
  getDocMock,
  getDocsMock,
  limitMock,
  onSnapshotMock,
  orderByMock,
  queryMock,
  startAfterMock,
  startAtMock,
  sumMock,
  endAtMock,
  whereMock,
  httpsCallableMock,
  pdfSaveSpy,
  toastSpy,
} = vi.hoisted(() => ({
  collectionMock: vi.fn((...args: any[]) => ({ kind: 'collection', args })),
  collectionGroupMock: vi.fn((...args: any[]) => ({ kind: 'collectionGroup', args })),
  countMock: vi.fn(() => ({ kind: 'count' })),
  docMock: vi.fn((...args: any[]) => ({ kind: 'doc', args })),
  documentIdMock: vi.fn(() => '__name__'),
  getDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  getAggregateFromServerMock: vi.fn(
    async (..._args: any[]): Promise<{ data: () => Record<string, number> }> => ({
      data: () => ({ total: 0 }),
    })
  ),
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
  startAfterMock: vi.fn((value: unknown) => ({ kind: 'startAfter', value })),
  startAtMock: vi.fn((value: string) => ({ kind: 'startAt', value })),
  endAtMock: vi.fn((value: string) => ({ kind: 'endAt', value })),
  sumMock: vi.fn((field: string) => ({ kind: 'sum', field })),
  whereMock: vi.fn((field: string, op: string, value: any) => ({
    kind: 'where',
    field,
    op,
    value,
  })),
  httpsCallableMock: vi.fn(() => vi.fn(async () => ({ data: {} }))),
  pdfSaveSpy: vi.fn(),
  toastSpy: vi.fn(),
}));

vi.mock('jspdf', () => ({
  default: class MockJsPdf {
    internal = {
      pageSize: {
        getWidth: () => 595,
        getHeight: () => 842,
      },
    };
    addImage = vi.fn();
    addPage = vi.fn();
    getTextWidth = (value: string) => value.length * 5;
    line = vi.fn();
    rect = vi.fn();
    save = pdfSaveSpy;
    setDrawColor = vi.fn();
    setFillColor = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    splitTextToSize = (value: string) => [value];
    text = vi.fn();
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  collectionGroup: collectionGroupMock,
  count: countMock,
  doc: docMock,
  documentId: documentIdMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  getAggregateFromServer: getAggregateFromServerMock,
  limit: limitMock,
  onSnapshot: onSnapshotMock,
  orderBy: orderByMock,
  query: queryMock,
  startAfter: startAfterMock,
  startAt: startAtMock,
  endAt: endAtMock,
  where: whereMock,
  sum: sumMock,
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
      dueAmount: prefix === 'parent' ? 1000 : undefined,
      lastPaymentAtMs: null,
      parentNameSort: prefix === 'parent' ? `${prefix} ${value}` : undefined,
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
    (part: any) =>
      part?.kind === 'startAfter' &&
      matcher(
        String(
          typeof part.value?.data === 'function'
            ? part.value.data()?.parentId || part.value.data()?.teacherId || ''
            : part.value || ''
        )
      )
  );
const getCollectionName = (input: any) => input?.args?.[0]?.args?.[1] || input?.args?.[1];

describe('Admin payment pages lazy loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAggregateFromServerMock.mockImplementation(async () => ({
      data: () => ({ total: 0 }),
    }));
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
        hasLimit(input, 11) &&
        !hasStartAfter(input, () => true)
      ) {
        const isMay = hasWhere(input, 'monthKey', '==', (value) => value === '2026-05');
        return {
          docs: buildSequentialDocs('parent', isMay ? 21 : 1, 11, isMay ? '2026-05' : '2026-06'),
        };
      }

      if (
        input?.kind === 'query' &&
        input.args[0]?.kind === 'collectionGroup' &&
        input.args[0]?.args?.[1] === 'months' &&
        hasLimit(input, 11) &&
        hasStartAfter(input, (value) => value === 'parent-10')
      ) {
        return {
          docs: buildSequentialDocs('parent', 11, 10),
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

  it('automatically loads the first 10 parents with the stable outstanding ordering', async () => {
    render(<ParentPayments />);

    await waitFor(() =>
      expect(
        getDocsMock.mock.calls.some(
          ([input]) =>
            input?.kind === 'query' &&
            input.args[0]?.kind === 'collectionGroup' &&
            input.args[0]?.args?.[1] === 'months' &&
            hasLimit(input, 11)
        )
      ).toBe(true)
    );

    expect(
      getDocsMock.mock.calls.some(
        ([input]) =>
          hasOrderBy(input, 'dueAmount') &&
          hasOrderBy(input, 'lastPaymentAtMs') &&
          hasOrderBy(input, 'parentNameSort') &&
          hasOrderBy(input, '__name__')
      )
    ).toBe(true);
    await waitFor(() => expect(screen.getByText('Showing page 1 (10 parents).')).toBeTruthy());
    expect(screen.queryByText('Load First 25')).toBeNull();
    expect(screen.getByText('Page 1')).toBeTruthy();
    expect(screen.getByText('Previous')).toBeDisabled();
  });

  it('loads only the selected parent scope from initial dropdown options', async () => {
    render(<ParentPayments />);

    await waitFor(() =>
      expect(screen.getAllByRole('option', { name: /Parent One/ }).length).toBeGreaterThan(0)
    );

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'parent-1' },
    });

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
    expect(screen.queryByText('Apply / Load Selected')).toBeNull();
  });

  it('keeps month options through invoice download and switches Parent A to Parent B without remounting', async () => {
    render(<ParentPayments />);

    const parentSelect = screen.getAllByRole('combobox')[0];
    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Parent One/ }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('option', { name: /Parent Two/ }).length).toBeGreaterThan(0);
    });

    fireEvent.change(parentSelect, { target: { value: 'parent-1' } });
    await waitFor(() => expect(screen.getByText('Parent One', { selector: 'td' })).toBeTruthy());
    expect(screen.getAllByRole('option', { name: /Parent Two/ }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'View Invoice' }));
    await waitFor(() => expect(screen.getByText('Parent: Parent One')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    await waitFor(() => expect(pdfSaveSpy).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent.change(parentSelect, { target: { value: 'parent-2' } });
    await waitFor(() =>
      expect(
        getDocsMock.mock.calls.some(
          ([input]) =>
            getCollectionName(input) === 'billingCharges' &&
            (hasWhere(
              input,
              'parentId',
              'in',
              (value) => Array.isArray(value) && value.length === 1 && value[0] === 'parent-2',
            ) || hasWhere(input, 'parentId', '==', (value) => value === 'parent-2')),
        ),
      ).toBe(true),
    );
    expect(screen.getByText('Parent Two', { selector: 'td' })).toBeTruthy();
    expect(screen.queryByText('Parent One', { selector: 'td' })).toBeNull();
    expect(screen.getAllByRole('option', { name: /Parent One/ }).length).toBeGreaterThan(0);
  });

  it('does not let a slower Parent A finance response overwrite Parent B', async () => {
    const defaultGetDocs = getDocsMock.getMockImplementation();
    let resolveParentOne!: (value: { docs: ReturnType<typeof makeDoc>[] }) => void;
    const parentOneCharges = new Promise<{ docs: ReturnType<typeof makeDoc>[] }>((resolve) => {
      resolveParentOne = resolve;
    });
    getDocsMock.mockImplementation((input: any) => {
      if (
        getCollectionName(input) === 'billingCharges' &&
        hasWhere(
          input,
          'parentId',
          'in',
          (value) => Array.isArray(value) && value.length === 1 && value[0] === 'parent-1',
        )
      ) {
        return parentOneCharges;
      }
      return defaultGetDocs?.(input);
    });

    render(<ParentPayments />);
    const parentSelect = screen.getAllByRole('combobox')[0];
    await waitFor(() =>
      expect(screen.getAllByRole('option', { name: /Parent One/ }).length).toBeGreaterThan(0),
    );

    fireEvent.change(parentSelect, { target: { value: 'parent-1' } });
    await waitFor(() =>
      expect(
        getDocsMock.mock.calls.some(
          ([input]) =>
            getCollectionName(input) === 'billingCharges' &&
            hasWhere(input, 'parentId', 'in', (value) => value?.[0] === 'parent-1'),
        ),
      ).toBe(true),
    );

    fireEvent.change(parentSelect, { target: { value: 'parent-2' } });
    await waitFor(() => expect(screen.getByText('Parent Two', { selector: 'td' })).toBeTruthy());

    resolveParentOne({
      docs: [
        makeDoc('late-parent-one-charge', {
          parentId: 'parent-1',
          monthKey: '2026-06',
          amount: 9000,
          status: 'pending',
        }),
      ],
    });

    await waitFor(() => expect(screen.getByText('Parent Two', { selector: 'td' })).toBeTruthy());
    expect(screen.queryByText('Parent One', { selector: 'td' })).toBeNull();
    expect(screen.queryByText('₹9,000')).toBeNull();
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

    await waitFor(() =>
      expect(screen.getAllByRole('option', { name: /Parent One/ }).length).toBeGreaterThan(0)
    );

    fireEvent.change(screen.getByPlaceholderText('Search parent by name, email, phone, or ID'), {
      target: { value: 'Par' },
    });

    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Parent Prefix Match/ })).toBeTruthy()
    , { timeout: 1200 });

    expect(screen.getAllByRole('option', { name: /Parent One/ }).length).toBeGreaterThan(0);
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

  it('loads the next 10 parents and restores page 1 without duplicates or skips', async () => {
    render(<ParentPayments />);

    await waitFor(() => expect(screen.getByText('Showing page 1 (10 parents).')).toBeTruthy());
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => expect(screen.getByText('Showing page 2 (10 parents).')).toBeTruthy());
    expect(screen.getAllByText('Parent 11').length).toBeGreaterThan(0);
    expect(screen.queryByText('Parent 10')).toBeNull();
    expect(screen.getByText('Next')).toBeDisabled();

    fireEvent.click(screen.getByText('Previous'));
    await waitFor(() => expect(screen.getByText('Showing page 1 (10 parents).')).toBeTruthy());
    expect(screen.getAllByText('Parent 10').length).toBeGreaterThan(0);
    expect(screen.queryByText('Parent 11')).toBeNull();
    expect(screen.getByText('Previous')).toBeDisabled();
  });

  it('resets cursor history and returns to page 1 when the month changes', async () => {
    render(<ParentPayments />);
    await waitFor(() => expect(screen.getByText('Showing page 1 (10 parents).')).toBeTruthy());
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Page 2')).toBeTruthy());

    const callsBeforeMonthChange = getDocsMock.mock.calls.length;
    const monthInput = document.querySelector('input[type="month"]');
    expect(monthInput).toBeTruthy();
    fireEvent.change(monthInput!, { target: { value: '2026-05' } });

    await waitFor(() => expect(screen.getByText('Page 1')).toBeTruthy());
    const newPageQueries = getDocsMock.mock.calls.slice(callsBeforeMonthChange).map(([input]) => input);
    expect(
      newPageQueries.some(
        (input) =>
          input?.args?.[0]?.kind === 'collectionGroup' &&
          input.args[0]?.args?.[1] === 'months' &&
          hasWhere(input, 'monthKey', '==', (value) => value === '2026-05') &&
          !hasStartAfter(input, () => true)
      )
    ).toBe(true);
    expect(screen.getByText('Previous')).toBeDisabled();
    await waitFor(() =>
      expect(screen.getAllByRole('option', { name: /Parent 21/ }).length).toBeGreaterThan(0),
    );
    expect(screen.queryByRole('option', { name: /Parent One/ })).toBeNull();
  });

  it('uses month-wide aggregate totals instead of deriving cards from the visible page', async () => {
    let aggregateCall = 0;
    getAggregateFromServerMock.mockImplementation(async (_input: unknown, fields: any) => {
      const call = aggregateCall++;
      if (fields.selectedMonthBilled) {
        return {
          data: () => ({
            selectedMonthBilled: 123456,
            selectedMonthSettled: 23456,
            selectedMonthOutstanding: 100000,
          }),
        };
      }
      const totals = [7, 3, 9, 5000, -2000];
      return { data: () => ({ total: totals[call - 1] || 0 }) };
    });

    render(<ParentPayments />);

    await waitFor(() => expect(screen.getByText('₹1,23,456')).toBeTruthy());
    expect(screen.getByText('₹1,00,000')).toBeTruthy();
    expect(getAggregateFromServerMock).toHaveBeenCalledTimes(6);
    expect(screen.getByText('Showing page 1 (10 parents).')).toBeTruthy();
  });

  it('renders loading and month empty states for an empty ordered page', async () => {
    let resolvePage: ((value: { docs: unknown[] }) => void) | undefined;
    getDocsMock.mockImplementationOnce(
      () =>
        new Promise<{ docs: unknown[] }>((resolve) => {
          resolvePage = resolve;
        })
    );
    render(<ParentPayments />);

    await waitFor(() => expect(screen.getByText('Loading parent payments…')).toBeTruthy());
    resolvePage?.({ docs: [] });
    await waitFor(() =>
      expect(screen.getByText('No parent payment records found for the selected month.')).toBeTruthy()
    );
    expect(screen.getByText('Next')).toBeDisabled();
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
