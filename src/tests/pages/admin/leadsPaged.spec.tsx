import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(() => ({ kind: 'collection' })),
  getCountFromServer: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn((value: number) => ({ kind: 'limit', value })),
  onSnapshot: vi.fn(),
  orderBy: vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args })),
  query: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  startAfter: vi.fn((...args: unknown[]) => ({ kind: 'startAfter', args })),
  timestampFromMillis: vi.fn((value: number) => ({ kind: 'timestamp', value })),
  where: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
}));

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  getCountFromServer: firestoreMocks.getCountFromServer,
  getDocs: firestoreMocks.getDocs,
  limit: firestoreMocks.limit,
  onSnapshot: firestoreMocks.onSnapshot,
  orderBy: firestoreMocks.orderBy,
  query: firestoreMocks.query,
  startAfter: firestoreMocks.startAfter,
  Timestamp: { fromMillis: firestoreMocks.timestampFromMillis },
  where: firestoreMocks.where,
}));

vi.mock('../../../lib/firebaseConfig', () => ({ db: {} }));

import {
  LEAD_STATUSES_BY_BUCKET,
  leadStatusBelongsToBucket,
  usePagedLeads,
  type LeadPageSize,
  type PagedLeadRecord,
} from '../../../pages/admin/leadsPaged';
import type { SimpleLeadBucket } from '../../../pages/admin/leadsWorkflowBuckets';

type TestLead = PagedLeadRecord & { status?: string; source?: string };

type TestDoc = ReturnType<typeof makeDoc>;
type TestSnapshot = ReturnType<typeof makeSnapshot>;

const subscriptions: Array<{
  next: (snapshot: TestSnapshot) => void;
  error: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
}> = [];

function timestamp(ms: number) {
  return { toMillis: () => ms };
}

function makeDoc(id: string, status: string, createdAtMs: number, source = 'manual') {
  const data = { status, source, createdAt: timestamp(createdAtMs) };
  return {
    id,
    data: () => data,
    metadata: { hasPendingWrites: false },
  };
}

function makeSnapshot(docs: TestDoc[], fromCache = false) {
  return {
    docs,
    empty: docs.length === 0,
    metadata: { fromCache },
    docChanges: () => [] as Array<{ type: 'added' | 'modified' | 'removed'; doc: TestDoc }>,
  };
}

function Harness({
  bucket = 'open',
  pageSize = 10,
  dateFromMs = 0,
  dateToMs = 0,
}: {
  bucket?: SimpleLeadBucket;
  pageSize?: LeadPageSize;
  dateFromMs?: number;
  dateToMs?: number;
}) {
  const result = usePagedLeads<TestLead>({
    bucket,
    pageSize,
    dateFromMs,
    dateToMs,
    onError: vi.fn(),
    onNewWebsiteLeads: vi.fn(),
  });
  return (
    <div>
      <span data-testid="loading">{String(result.isLoading)}</span>
      <span data-testid="ids">{result.leads.map((lead) => lead.id).join(',')}</span>
      <span data-testid="page">{result.pageNumber}</span>
      <span data-testid="total-pages">{String(result.totalPages)}</span>
      <span data-testid="filtered-total">{String(result.filteredTotal)}</span>
      <span data-testid="has-next">{String(result.hasNext)}</span>
      <button type="button" onClick={result.nextPage}>Next</button>
    </div>
  );
}

const getDataQueryArgs = (callIndex: number) => {
  const queryObject = firestoreMocks.getDocs.mock.calls[callIndex]?.[0] as { args?: unknown[] } | undefined;
  return queryObject?.args || [];
};

const hasConstraintKind = (items: unknown[], kind: string): boolean =>
  items.some((item) => Boolean(item && typeof item === 'object' && (item as { kind?: unknown }).kind === kind));

beforeEach(() => {
  subscriptions.length = 0;
  Object.values(firestoreMocks).forEach((mock) => mock.mockReset());
  firestoreMocks.collection.mockImplementation(() => ({ kind: 'collection' }));
  firestoreMocks.limit.mockImplementation((value: number) => ({ kind: 'limit', value }));
  firestoreMocks.orderBy.mockImplementation((...args: unknown[]) => ({ kind: 'orderBy', args }));
  firestoreMocks.query.mockImplementation((...args: unknown[]) => ({ kind: 'query', args }));
  firestoreMocks.startAfter.mockImplementation((...args: unknown[]) => ({ kind: 'startAfter', args }));
  firestoreMocks.timestampFromMillis.mockImplementation((value: number) => ({ kind: 'timestamp', value }));
  firestoreMocks.where.mockImplementation((...args: unknown[]) => ({ kind: 'where', args }));
  firestoreMocks.getCountFromServer.mockResolvedValue({ data: () => ({ count: 180 }) });
  firestoreMocks.onSnapshot.mockImplementation(
    (_query: unknown, _options: unknown, next: (snapshot: TestSnapshot) => void, error: (error: Error) => void) => {
      const unsubscribe = vi.fn();
      subscriptions.push({ next, error, unsubscribe });
      return unsubscribe;
    },
  );
});

afterEach(() => cleanup());

describe('lead pagination status mapping', () => {
  it('maps the canonical lead read model to the four workflow buckets', () => {
    expect(leadStatusBelongsToBucket('demo_pending_schedule', 'open')).toBe(true);
    expect(leadStatusBelongsToBucket('demo_booked', 'in_progress')).toBe(true);
    expect(leadStatusBelongsToBucket('demo_completed', 'admin_review')).toBe(true);
    expect(leadStatusBelongsToBucket('no_response', 'closed')).toBe(true);
    expect(LEAD_STATUSES_BY_BUCKET.open).not.toContain('demo_booked');
  });
});

describe('usePagedLeads bounded Firestore reads', () => {
  it('loads only the first 10 newest Open rows by default', async () => {
    const docs = Array.from({ length: 10 }, (_, index) =>
      makeDoc(`open-${index}`, 'demo_pending_schedule', 10_000 - index));
    firestoreMocks.getDocs.mockResolvedValue(makeSnapshot(docs));

    render(<Harness />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('ids').textContent?.split(',')).toHaveLength(10);
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(firestoreMocks.limit).toHaveBeenCalledWith(10);

    const dataArgs = getDataQueryArgs(0);
    expect(dataArgs).toContainEqual({ kind: 'orderBy', args: ['createdAt', 'desc'] });
    expect(hasConstraintKind(dataArgs, 'where')).toBe(false);
  });

  it('scans another small bounded batch when non-Open rows are interleaved', async () => {
    const firstBatch = [
      ...Array.from({ length: 8 }, (_, index) =>
        makeDoc(`open-${index}`, 'demo_pending_schedule', 20_000 - index)),
      makeDoc('assigned-1', 'demo_booked', 19_900),
      makeDoc('review-1', 'demo_completed', 19_899),
    ];
    const secondBatch = [
      makeDoc('open-8', 'demo_pending_schedule', 19_898),
      makeDoc('open-9', 'demo_pending_schedule', 19_897),
      makeDoc('assigned-2', 'demo_booked', 19_896),
      makeDoc('closed-1', 'no_response', 19_895),
      makeDoc('review-2', 'demo_completed', 19_894),
    ];
    firestoreMocks.getDocs
      .mockResolvedValueOnce(makeSnapshot(firstBatch))
      .mockResolvedValueOnce(makeSnapshot(secondBatch));

    render(<Harness />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('ids').textContent?.split(',')).toHaveLength(10);
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(2);
    expect(firestoreMocks.limit).toHaveBeenCalledWith(10);
    expect(firestoreMocks.limit).toHaveBeenCalledWith(5);
  });

  it('uses startAfter for the next Open page instead of reloading the full collection', async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) =>
      makeDoc(`page-1-${index}`, 'demo_pending_schedule', 30_000 - index));
    const secondPage = Array.from({ length: 10 }, (_, index) =>
      makeDoc(`page-2-${index}`, 'demo_pending_schedule', 20_000 - index));
    firestoreMocks.getDocs
      .mockResolvedValueOnce(makeSnapshot(firstPage))
      .mockResolvedValueOnce(makeSnapshot(secondPage));

    render(<Harness />);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('has-next')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('2'));
    await waitFor(() => expect(screen.getByTestId('ids')).toHaveTextContent('page-2-0'));

    expect(firestoreMocks.startAfter).toHaveBeenCalledWith(firstPage[9]);
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(2);
  });

  it('applies custom date bounds at Firestore instead of filtering only the loaded page', async () => {
    const docs = Array.from({ length: 4 }, (_, index) =>
      makeDoc(`july-${index}`, 'demo_pending_schedule', 4_000 - index));
    firestoreMocks.getDocs.mockResolvedValue(makeSnapshot(docs));

    render(<Harness dateFromMs={1_000} dateToMs={5_000} />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(firestoreMocks.timestampFromMillis).toHaveBeenCalledWith(1_000);
    expect(firestoreMocks.timestampFromMillis).toHaveBeenCalledWith(5_000);
    expect(firestoreMocks.where).toHaveBeenCalledWith(
      'createdAt',
      '>=',
      { kind: 'timestamp', value: 1_000 },
    );
    expect(firestoreMocks.where).toHaveBeenCalledWith(
      'createdAt',
      '<=',
      { kind: 'timestamp', value: 5_000 },
    );
    expect(screen.getByTestId('filtered-total')).toHaveTextContent('4');
    expect(screen.getByTestId('total-pages')).toHaveTextContent('1');
  });

  it('does not combine Open status and createdAt filters, avoiding a new composite index', async () => {
    firestoreMocks.getDocs.mockResolvedValue(makeSnapshot([]));

    render(<Harness dateFromMs={1_000} dateToMs={5_000} />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    const dataArgs = getDataQueryArgs(0);
    expect(dataArgs).toContainEqual({
      kind: 'where',
      args: ['createdAt', '>=', { kind: 'timestamp', value: 1_000 }],
    });
    expect(dataArgs).toContainEqual({
      kind: 'where',
      args: ['createdAt', '<=', { kind: 'timestamp', value: 5_000 }],
    });
    expect(dataArgs).not.toContainEqual({
      kind: 'where',
      args: ['status', 'in', [...LEAD_STATUSES_BY_BUCKET.open]],
    });
  });

  it('loads the entire bucket only when All is explicitly selected', async () => {
    const docs = Array.from({ length: 12 }, (_, index) =>
      makeDoc(`all-${index}`, 'demo_pending_schedule', 40_000 - index));
    firestoreMocks.getDocs.mockResolvedValue(makeSnapshot(docs));

    render(<Harness pageSize="all" />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('ids').textContent?.split(',')).toHaveLength(12);
    const dataArgs = getDataQueryArgs(0);
    expect(dataArgs).toContainEqual({
      kind: 'where',
      args: ['status', 'in', [...LEAD_STATUSES_BY_BUCKET.open]],
    });
    expect(hasConstraintKind(dataArgs, 'orderBy')).toBe(false);
  });

  it('uses the exact small status queue for With Teacher instead of scanning Open leads', async () => {
    firestoreMocks.getCountFromServer.mockResolvedValue({ data: () => ({ count: 3 }) });
    const docs = [
      makeDoc('teacher-old', 'demo_booked', 1_000),
      makeDoc('teacher-new', 'demo_booked', 3_000),
      makeDoc('teacher-mid', 'demo_booked', 2_000),
    ];
    firestoreMocks.getDocs.mockResolvedValue(makeSnapshot(docs));

    render(<Harness bucket="in_progress" />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('ids')).toHaveTextContent('teacher-new,teacher-mid,teacher-old');
    const dataArgs = getDataQueryArgs(0);
    expect(dataArgs).toContainEqual({
      kind: 'where',
      args: ['status', 'in', [...LEAD_STATUSES_BY_BUCKET.in_progress]],
    });
    expect(hasConstraintKind(dataArgs, 'orderBy')).toBe(false);
  });

  it('keeps only a five-document realtime watch for new website lead notifications', () => {
    firestoreMocks.getDocs.mockResolvedValue(makeSnapshot([]));
    render(<Harness />);

    expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.limit).toHaveBeenCalledWith(5);
  });
});
