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
  orderByMock,
  queryMock,
  startAfterMock,
  startAtMock,
  endAtMock,
  sumMock,
  whereMock,
  httpsCallableMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn((...args: any[]) => ({ kind: 'collection', args })),
  collectionGroupMock: vi.fn((...args: any[]) => ({ kind: 'collectionGroup', args })),
  countMock: vi.fn(() => ({ kind: 'count' })),
  docMock: vi.fn((...args: any[]) => ({ kind: 'doc', args })),
  documentIdMock: vi.fn(() => '__name__'),
  getAggregateFromServerMock: vi.fn(),
  getDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  limitMock: vi.fn((value: number) => ({ kind: 'limit', value })),
  orderByMock: vi.fn((field: string, direction?: string) => ({ kind: 'orderBy', field, direction: direction || 'asc' })),
  queryMock: vi.fn((...args: any[]) => ({ kind: 'query', args })),
  startAfterMock: vi.fn((value: unknown) => ({ kind: 'startAfter', value })),
  startAtMock: vi.fn((value: string) => ({ kind: 'startAt', value })),
  endAtMock: vi.fn((value: string) => ({ kind: 'endAt', value })),
  sumMock: vi.fn((field: string) => ({ kind: 'sum', field })),
  whereMock: vi.fn((field: string, op: string, value: any) => ({ kind: 'where', field, op, value })),
  httpsCallableMock: vi.fn(() => vi.fn(async () => ({ data: {} }))),
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  collectionGroup: collectionGroupMock,
  count: countMock,
  doc: docMock,
  documentId: documentIdMock,
  getAggregateFromServer: getAggregateFromServerMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  limit: limitMock,
  orderBy: orderByMock,
  query: queryMock,
  startAfter: startAfterMock,
  startAt: startAtMock,
  endAt: endAtMock,
  sum: sumMock,
  where: whereMock,
}));

vi.mock('firebase/functions', () => ({ httpsCallable: httpsCallableMock }));
vi.mock('../../lib/firebaseConfig', () => ({ db: {}, functions: {} }));
vi.mock('jspdf', () => ({
  default: class MockJsPdf {
    internal = { pageSize: { getWidth: () => 595 } };
    addPage = vi.fn();
    line = vi.fn();
    save = vi.fn();
    setDrawColor = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    text = vi.fn();
  },
}));
vi.mock('@components/ui/card', () => ({ Card: ({ children, ...props }: any) => <div {...props}>{children}</div> }));
vi.mock('@components/ui/input', () => ({ Input: (props: any) => <input {...props} /> }));
vi.mock('@components/ui/button', () => ({
  Button: ({ children, variant: _variant, size: _size, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select value={value} onChange={(event) => onValueChange?.(event.target.value)}>{children}</select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));
vi.mock('@components/ui/textarea', () => ({ Textarea: (props: any) => <textarea {...props} /> }));

import ParentPaymentsV2 from '../../pages/admin/ParentPaymentsV2';

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
  exists: () => true,
});

const queryParts = (input: any) => (input?.kind === 'query' ? input.args.slice(1) : []);
const hasWhere = (input: any, field: string, op?: string, matcher?: (value: any) => boolean) =>
  queryParts(input).some((part: any) =>
    part?.kind === 'where' && part.field === field && (!op || part.op === op) && (!matcher || matcher(part.value))
  );
const hasOrderBy = (input: any, field: string) =>
  queryParts(input).some((part: any) => part?.kind === 'orderBy' && part.field === field);
const hasLimit = (input: any, value: number) =>
  queryParts(input).some((part: any) => part?.kind === 'limit' && part.value === value);
const collectionName = (input: any) => input?.args?.[0]?.args?.[1] || input?.args?.[1];

describe('ParentPaymentsV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAggregateFromServerMock.mockImplementation(async (_input: unknown, fields: any) => {
      if (fields.selectedMonthBilled) {
        return {
          data: () => ({
            selectedMonthBilled: 5800,
            selectedMonthSettled: 1000,
            selectedMonthOutstanding: 4800,
          }),
        };
      }
      return { data: () => ({ total: 1 }) };
    });

    getDocMock.mockResolvedValue({ exists: () => false, data: () => null, id: '' });

    getDocsMock.mockImplementation(async (input: any) => {
      if (
        input?.kind === 'query' &&
        input.args[0]?.kind === 'collectionGroup' &&
        input.args[0]?.args?.[1] === 'months' &&
        hasLimit(input, 11)
      ) {
        return {
          docs: [
            makeDoc('month-parent-1', {
              parentId: 'parent-1',
              monthKey: '2026-08',
              dueAmount: 4800,
              lastPaymentAtMs: null,
              parentNameSort: 'parent one',
            }),
          ],
        };
      }

      if (collectionName(input) === 'users' && hasWhere(input, '__name__', 'in')) {
        return {
          docs: [makeDoc('parent-1', { displayName: 'Parent One', email: 'parent@example.com', role: 'parent' })],
        };
      }

      if (collectionName(input) === 'billingCharges' && hasWhere(input, 'parentId', 'in')) {
        return {
          docs: [makeDoc('charge-1', { parentId: 'parent-1', amount: 5800, paidAmount: 1000, status: 'partial' })],
        };
      }

      if (collectionName(input) === 'parentWallets') return { docs: [] };
      if (collectionName(input) === 'kids') return { docs: [] };

      if (
        collectionName(input) === 'users' &&
        hasWhere(input, 'displayName', '==', (value) => String(value).toLowerCase() === 'parent one')
      ) {
        return {
          docs: [makeDoc('parent-1', { displayName: 'Parent One', email: 'parent@example.com', role: 'parent' })],
        };
      }

      return { docs: [] };
    });
  });

  it('loads a clean month-scoped dashboard using the stable outstanding order and month-wide KPIs', async () => {
    render(<ParentPaymentsV2 />);

    await waitFor(() => expect(screen.getByText('Parent One')).toBeTruthy());
    expect(screen.getAllByText('₹5,800').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹4,800').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹1,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Page 1').length).toBeGreaterThan(0);
    expect(screen.getByText('Parents with due')).toBeTruthy();

    expect(
      getDocsMock.mock.calls.some(([input]) =>
        hasOrderBy(input, 'dueAmount') &&
        hasOrderBy(input, 'lastPaymentAtMs') &&
        hasOrderBy(input, 'parentNameSort') &&
        hasOrderBy(input, '__name__') &&
        hasLimit(input, 11)
      )
    ).toBe(true);
    expect(getAggregateFromServerMock).toHaveBeenCalledTimes(4);

    expect(screen.queryByText('Parent Wallet')).toBeNull();
    expect(screen.queryByText('Manual advance wallet credit')).toBeNull();
    expect(screen.getByPlaceholderText('Search name, email, phone, or ID')).toBeTruthy();
  });

  it('shows collection status wording instead of the internal current-period status', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        billedAmount: 5800,
        billedClassCount: 1,
        settledAmount: 0,
        dueAmount: 5800,
        status: 'current',
        lastPaymentAtMs: null,
      }),
      id: '2026-08',
    });

    render(<ParentPaymentsV2 />);

    await waitFor(() => expect(screen.getByText('Parent One')).toBeTruthy());
    expect(screen.getByText('Unpaid')).toBeTruthy();
    expect(screen.queryByText('Current')).toBeNull();
    expect(screen.getByText('Payment status')).toBeTruthy();
  });

  it('exposes financial tools as a secondary header action when provided', async () => {
    const openMaintenance = vi.fn();
    render(<ParentPaymentsV2 onOpenMaintenance={openMaintenance} />);

    await waitFor(() => expect(screen.getByText('Parent One')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Financial tools' }));
    expect(openMaintenance).toHaveBeenCalledTimes(1);
  });

  it('uses one direct search picker and narrows the page to the selected parent', async () => {
    render(<ParentPaymentsV2 />);
    await waitFor(() => expect(screen.getByText('Parent One')).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText('Search name, email, phone, or ID'), {
      target: { value: 'Parent One' },
    });

    const resultButton = await screen.findByRole('button', { name: /Parent One.*Select/i }, { timeout: 1500 });
    fireEvent.click(resultButton);

    await waitFor(() => expect(screen.getByText('Viewing')).toBeTruthy());
    expect(screen.getByText('Selected parent')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy();
    expect(screen.queryByText('No matching parent found.')).toBeNull();
  });
});
