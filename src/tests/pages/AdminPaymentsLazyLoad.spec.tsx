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

      if (input?.kind === 'query' && input.args[0]?.kind === 'collectionGroup' && input.args[0]?.args?.[1] === 'months') {
        return {
          docs: [
            makeDoc('month-parent-1', { parentId: 'parent-1', monthKey: '2026-06' }),
            makeDoc('month-parent-2', { parentId: 'parent-2', monthKey: '2026-06' }),
          ],
        };
      }

      if (input?.kind === 'query' && input.args[0]?.kind === 'collectionGroup' && input.args[0]?.args?.[1] === 'earnings') {
        return {
          docs: [
            makeDoc('teacher-rollup-1', { teacherId: 'teacher-1', monthKey: '2026-06' }),
            makeDoc('teacher-rollup-2', { teacherId: 'teacher-2', monthKey: '2026-06' }),
          ],
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

      if (collectionName === 'users' && hasWhere(input, '__name__', 'in')) {
        const ids = getQueryParts(input).find((part: any) => part?.kind === 'where' && part.field === '__name__')?.value || [];
        return {
          docs: ids.map((id: string) =>
            makeDoc(id, {
              displayName: id === 'parent-1' ? 'Parent One' : id === 'teacher-1' ? 'Teacher One' : id,
              email: `${id}@example.com`,
              role: id.startsWith('parent') ? 'parent' : 'teacher',
            })
          ),
        };
      }

      return { docs: [] };
    });
  });

  it('does not load parent or teacher payment data on initial page open', () => {
    render(
      <div>
        <ParentPayments />
        <TeacherPayments />
      </div>
    );

    expect(screen.getAllByText(/No data loaded yet\./).length).toBeGreaterThan(0);
    expect(getDocsMock).not.toHaveBeenCalled();
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });

  it('loads parent top 10 with limit(10) only after explicit action', async () => {
    render(<ParentPayments />);

    fireEvent.click(screen.getByText('Load Top 10'));

    await waitFor(() =>
      expect(
        getDocsMock.mock.calls.some(([input]) => hasLimit(input, 10))
      ).toBe(true)
    );

    expect(screen.getByText('Showing top 10 only.')).toBeTruthy();
  });

  it('loads only the selected parent scope', async () => {
    render(<ParentPayments />);

    fireEvent.change(screen.getByPlaceholderText('Search exact parent email, phone, name, or ID'), {
      target: { value: 'parent@example.com' },
    });

    await waitFor(() => expect(getDocsMock).toHaveBeenCalled());

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

  it('loads only the selected teacher scope', async () => {
    render(<TeacherPayments />);

    fireEvent.change(screen.getByPlaceholderText('Search exact teacher email, phone, name, or ID'), {
      target: { value: 'teacher@example.com' },
    });

    await waitFor(() => expect(getDocsMock).toHaveBeenCalled());

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
});
