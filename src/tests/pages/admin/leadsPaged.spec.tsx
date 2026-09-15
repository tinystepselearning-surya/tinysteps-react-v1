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
  leadReceivedAtMillis,
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

function makeDoc(
  id: string,
  status: string,
  createdAtMs: number,
  source = 'manual',
  receivedAtMs?: number,
  requestedAtMs?: number,
) {
  const data = {
    status,
    source,
    createdAt: timestamp(createdAtMs),
    ...(receivedAtMs === undefined ? {} : { receivedAt: timestamp(receivedAtMs) }),
    ...(requestedAtMs === undefined ? {} : { requestedAt: timestamp(requestedAtMs) }),
  };
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
      <span data-testid="created-at">{String((result.leads[0]?.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() || 0)}</span>
      <span data-testid="page">{result.pageNumber}</span>
      <span data-testid="total-pages">{String(result.totalPages)}</span>
      <span data-testid="filtered-total">{String(result.filteredTotal)}</span>
      <span data-testid="has-next">{String(result.hasNext)}</span>
      <span data-testid="open-count">{result.bucketCounts.open}</span>
      <span data-testid="teacher-count">{result.bucketCounts.in_progress}</span>
      <span data-testid="review-count">{result.bucketCounts.admin_review}</span>
      <span data-testid="closed-count">{result.bucketCounts.closed}</span>
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

describe('canonical enquiry received date', () => {
  it('uses receivedAt, then requestedAt, then createdAt', () => {
    expect(leadReceivedAtMillis({
      receivedAt: timestamp(1_000),
      requestedAt: timestamp(2_000),
      createdAt: timestamp(3_000),
    })).toBe(1_000);
    expect(leadReceivedAtMillis({ requestedAt: timestamp(2_000), createdAt: timestamp(3_000) })).toBe(2_000);
    expect(leadReceivedAtMillis({ createdAt: timestamp(3_000) })).toBe(3_000);
  });

  it('uses three bounded receipt-date lanes and shares them across card counts and rows', async () => {
    const canonicalOpen = makeDoc('canonical-open', 'demo_pending_schedule', 9_000, 'manual', 2_000);
    const canonicalTeacher = makeDoc('canonical-teacher', 'demo_booked', 9_100, 'manual', 2_500);
    const legacyRequested = makeDoc('legacy-requested', 'demo_completed', 9_500, 'manual', undefined, 3_000);
    const legacyCreated = makeDoc('legacy-created', 'no_response', 4_000);

    firestoreMocks.getDocs
      .mockResolvedValueOnce(makeSnapshot([canonicalOpen, canonicalTeacher]))
      .mockResolvedValueOnce(makeSnapshot([legacyRequested]))
      .mockResolvedValueOnce(makeSnapshot([legacyCreated]));

    render(<Harness dateFromMs={1_000} dateToMs={5_000} />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    await waitFor(() => expect(screen.getByTestId('open-count')).toHaveTextContent('1'));
    expect(screen.getByTestId('teacher-count')).toHaveTextContent('1');
    expect(screen.getByTestId('review-count')).toHaveTextContent('1');
    expect(screen.getByTestId('closed-count')).toHaveTextContent('1');
    expect(screen.getByTestId('filtered-total')).toHaveTextContent('1');
    expect(screen.getByTestId('ids')).toHaveTextContent('canonical-open');
    expect(screen.getByTestId('created-at')).toHaveTextContent('2000');
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(3);
    expect(firestoreMocks.getCountFromServer).not.toHaveBeenCalled();

    expect(getDataQueryArgs(0)).toContainEqual({
      kind: 'where',
      args: ['receivedAt', '>=', { kind: 'timestamp', value: 1_000 }],
    });
    expect(getDataQueryArgs(0)).toContainEqual({
      kind: 'where',
      args: ['receivedAt', '<=', { kind: 'timestamp', value: 5_000 }],
    });
    expect(getDataQueryArgs(0)).toContainEqual({ kind: 'orderBy', args: ['receivedAt', 'desc'] });
    expect(getDataQueryArgs(1)).toContainEqual({ kind: 'orderBy', args: ['requestedAt', 'desc'] });
    expect(getDataQueryArgs(2)).toContainEqual({ kind: 'orderBy', args: ['createdAt', 'desc'] });

    for (let index = 0; index < 3; index += 1) {
      expect(getDataQueryArgs(index)).not.toContainEqual({
        kind: 'where',
        args: ['status', 'in', [...LEAD_STATUSES_BY_BUCKET.open]],
      });
    }
  });

  it('does not let a legacy requestedAt/createdAt lane override an existing canonical receivedAt', async () => {
    const canonicalOutside = makeDoc('canonical-outside', 'demo_pending_schedule', 2_000, 'manual', 9_000, 3_000);
    const canonicalInside = makeDoc('canonical-inside', 'demo_pending_schedule', 9_000, 'manual', 2_000, 3_000);

    firestoreMocks.getDocs
      .mockResolvedValueOnce(makeSnapshot([canonicalInside]))
      .mockResolvedValueOnce(makeSnapshot([canonicalOutside, canonicalInside]))
      .mockResolvedValueOnce(makeSnapshot([canonicalOutside, canonicalInside]));

    render(<Harness dateFromMs={1_000} dateToMs={5_000} />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('ids')).toHaveTextContent('canonical-inside');
    expect(screen.getByTestId('ids')).not.toHaveTextContent('canonical-outside');
    expect(screen.getByTestId('open-count')).toHaveTextContent('1');
  });

  it('uses the first parseable receipt timestamp for both filtering and the visible date', async () => {
    const requestedFallback = makeDoc(
      'requested-fallback',
      'demo_pending_schedule',
      9_000,
      'manual',
      undefined,
      3_000,
    );
    const originalData = requestedFallback.data();
    const malformedReceivedAt = {
      ...requestedFallback,
      data: () => ({ ...originalData, receivedAt: { malformed: true } }),
    } as unknown as TestDoc;

    firestoreMocks.getDocs
      .mockResolvedValueOnce(makeSnapshot([]))
      .mockResolvedValueOnce(makeSnapshot([malformedReceivedAt]))
      .mockResolvedValueOnce(makeSnapshot([]));

    render(<Harness dateFromMs={1_000} dateToMs={5_000} />);

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('ids')).toHaveTextContent('requested-fallback');
    expect(screen.getByTestId('created-at')).toHaveTextContent('3000');
    expect(screen.getByTestId('open-count')).toHaveTextContent('1');
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

  it('paginates a received-date-filtered bucket from the shared bounded result set', async () => {
    const receivedDocs = Array.from({ length: 12 }, (_, index) =>
      makeDoc(`received-${index}`, 'demo_pending_schedule', 100_000 + index, 'manual', 5_000 - index));
    firestoreMocks.getDocs
      .mockResolvedValueOnce(makeSnapshot(receivedDocs))
      .mockResolvedValueOnce(makeSnapshot([]))
      .mockResolvedValueOnce(makeSnapshot([]));

    render(<Harness dateFromMs={1_000} dateToMs={6_000} />);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('ids').textContent?.split(',')).toHaveLength(10);
    expect(screen.getByTestId('filtered-total')).toHaveTextContent('12');
    expect(screen.getByTestId('has-next')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('2'));
    await waitFor(() => expect(screen.getByTestId('ids').textContent?.split(',')).toHaveLength(2));
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(3);
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
