import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
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
  where: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
}));

vi.mock('firebase/firestore', () => ({
  ...firestoreMocks,
}));

vi.mock('../../../lib/firebaseConfig', () => ({ db: {} }));

import {
  ACTIVE_LEAD_STATUSES,
  CLOSED_LEAD_PAGE_SIZE,
  CLOSED_LEAD_STATUSES,
  useRealtimeLeads,
  type RealtimeLeadRecord,
} from '../../../pages/admin/leadsRealtime';

type TestLead = RealtimeLeadRecord & {
  source?: string;
  status?: string;
  parentName?: string;
};

type TestDoc = ReturnType<typeof makeDoc>;
type Snapshot = ReturnType<typeof makeSnapshot>;
type SnapshotCallback = (snapshot: Snapshot) => void;

const subscriptions: Array<{
  options?: { includeMetadataChanges?: boolean };
  next: SnapshotCallback;
  error: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
}> = [];

function makeDoc(
  id: string,
  data: Omit<TestLead, 'id'>,
  hasPendingWrites = false,
) {
  return {
    id,
    data: () => data,
    metadata: { hasPendingWrites },
  };
}

function makeSnapshot(
  docs: TestDoc[],
  changes: Array<{ type: 'added' | 'modified' | 'removed'; doc: TestDoc }> = [],
  fromCache = false,
) {
  return {
    docs,
    docChanges: () => changes,
    metadata: { fromCache },
  };
}

function Harness({
  includeClosed = false,
  onError = vi.fn(),
  onNewWebsiteLeads,
}: {
  includeClosed?: boolean;
  onError?: (error: Error) => void;
  onNewWebsiteLeads: (leads: TestLead[]) => void;
}) {
  const {
    leads,
    isLoading,
    newLeadIds,
    closedCount,
    closedHistoryHasMore,
  } = useRealtimeLeads<TestLead>({
    includeClosed,
    onError,
    onNewWebsiteLeads,
  });

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="lead-ids">{leads.map((lead) => lead.id).join(',')}</span>
      <span data-testid="new-lead-ids">{Array.from(newLeadIds).join(',')}</span>
      <span data-testid="closed-count">{closedCount}</span>
      <span data-testid="closed-more">{String(closedHistoryHasMore)}</span>
    </div>
  );
}

const emit = (subscriptionIndex: number, snapshot: Snapshot) => {
  act(() => subscriptions[subscriptionIndex].next(snapshot));
};

const flushNotificationBuffer = () => {
  act(() => vi.advanceTimersByTime(400));
};

beforeEach(() => {
  vi.useFakeTimers();
  subscriptions.length = 0;
  Object.values(firestoreMocks).forEach((mock) => mock.mockClear());
  firestoreMocks.getCountFromServer.mockResolvedValue({
    data: () => ({ count: 12 }),
  });
  firestoreMocks.getDocs.mockResolvedValue(makeSnapshot([]));
  firestoreMocks.onSnapshot.mockImplementation(
    (
      _query: unknown,
      optionsOrNext: { includeMetadataChanges?: boolean } | SnapshotCallback,
      nextOrError: SnapshotCallback | ((error: Error) => void),
      possibleError?: (error: Error) => void,
    ) => {
      const hasOptions = typeof optionsOrNext !== 'function';
      const unsubscribe = vi.fn();
      subscriptions.push({
        options: hasOptions ? optionsOrNext : undefined,
        next: (hasOptions ? nextOrError : optionsOrNext) as SnapshotCallback,
        error: (hasOptions ? possibleError : nextOrError) as (error: Error) => void,
        unsubscribe,
      });
      return unsubscribe;
    },
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useRealtimeLeads bounded Firestore reads', () => {
  it('subscribes only to operational lead statuses by default', () => {
    render(<Harness onNewWebsiteLeads={vi.fn()} />);

    expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(1);
    expect(subscriptions[0].options).toEqual({ includeMetadataChanges: true });
    expect(firestoreMocks.where).toHaveBeenCalledWith(
      'status',
      'in',
      [...ACTIVE_LEAD_STATUSES],
    );
    expect(firestoreMocks.orderBy).not.toHaveBeenCalled();
  });

  it('keeps the initial operational snapshot live without generating historical notifications', () => {
    const onNew = vi.fn();
    render(<Harness onNewWebsiteLeads={onNew} />);
    const first = makeDoc('lead-1', { source: 'website', status: 'new' });
    const second = makeDoc('lead-2', { source: 'manual', status: 'demo_booked' });

    emit(0, makeSnapshot(
      [first, second],
      [{ type: 'added', doc: first }, { type: 'added', doc: second }],
    ));
    flushNotificationBuffer();

    expect(screen.getByTestId('lead-ids')).toHaveTextContent('lead-1,lead-2');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(onNew).not.toHaveBeenCalled();
  });

  it('notifies once for a new website enquiry after the authoritative baseline', () => {
    const onNew = vi.fn();
    render(<Harness onNewWebsiteLeads={onNew} />);

    emit(0, makeSnapshot([]));
    const websiteLead = makeDoc('website-1', {
      source: 'website',
      status: 'new',
      parentName: 'Parent One',
    });
    emit(0, makeSnapshot(
      [websiteLead],
      [{ type: 'added', doc: websiteLead }],
    ));
    flushNotificationBuffer();

    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onNew).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'website-1', source: 'website' }),
    ]);
  });

  it('does not notify for manual or locally pending records', () => {
    const onNew = vi.fn();
    render(<Harness onNewWebsiteLeads={onNew} />);
    emit(0, makeSnapshot([]));

    const manualLead = makeDoc('manual-1', { source: 'manual', status: 'new' });
    const pendingWebsiteLead = makeDoc(
      'pending-1',
      { source: 'website', status: 'new' },
      true,
    );
    emit(0, makeSnapshot(
      [manualLead, pendingWebsiteLead],
      [
        { type: 'added', doc: manualLead },
        { type: 'added', doc: pendingWebsiteLead },
      ],
    ));
    flushNotificationBuffer();

    expect(onNew).not.toHaveBeenCalled();
  });

  it('opens a bounded recent-history listener only when Closed history is requested', async () => {
    const onNew = vi.fn();
    const { rerender } = render(
      <Harness includeClosed={false} onNewWebsiteLeads={onNew} />,
    );
    expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(1);

    rerender(<Harness includeClosed onNewWebsiteLeads={onNew} />);

    expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(2);
    // Terminal status filtering is performed on the bounded history page itself; the
    // authoritative Closed total still uses the status-filtered aggregate query.
    expect(firestoreMocks.where).toHaveBeenCalledWith(
      'status',
      'in',
      [...CLOSED_LEAD_STATUSES],
    );
    expect(firestoreMocks.orderBy).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
    expect(firestoreMocks.limit).toHaveBeenCalledWith(CLOSED_LEAD_PAGE_SIZE + 1);

    const closedDocs = Array.from({ length: CLOSED_LEAD_PAGE_SIZE + 1 }, (_, index) =>
      makeDoc(`closed-${index}`, { source: 'manual', status: 'not_interested' }));
    emit(1, makeSnapshot(closedDocs));

    expect(screen.getByTestId('closed-more')).toHaveTextContent('true');
    expect(screen.getByTestId('lead-ids').textContent?.split(',')).toHaveLength(CLOSED_LEAD_PAGE_SIZE);
  });

  it('loads the Closed total through an aggregate count instead of downloading history', async () => {
    render(<Harness onNewWebsiteLeads={vi.fn()} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(firestoreMocks.getCountFromServer).toHaveBeenCalled();
    expect(screen.getByTestId('closed-count')).toHaveTextContent('12');
  });

  it('does not recreate the active listener when only Closed visibility changes', () => {
    const onNew = vi.fn();
    const { rerender } = render(
      <Harness includeClosed={false} onNewWebsiteLeads={onNew} />,
    );
    const activeUnsubscribe = subscriptions[0].unsubscribe;

    rerender(<Harness includeClosed onNewWebsiteLeads={onNew} />);
    expect(activeUnsubscribe).not.toHaveBeenCalled();

    rerender(<Harness includeClosed={false} onNewWebsiteLeads={onNew} />);
    expect(activeUnsubscribe).not.toHaveBeenCalled();
    expect(subscriptions[1].unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('cleans notification timers and every active listener on unmount', () => {
    const onNew = vi.fn();
    const { unmount } = render(<Harness includeClosed onNewWebsiteLeads={onNew} />);
    emit(0, makeSnapshot([]));
    const websiteLead = makeDoc('website-1', { source: 'website', status: 'new' });
    emit(0, makeSnapshot([websiteLead], [{ type: 'added', doc: websiteLead }]));

    unmount();

    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscriptions[1].unsubscribe).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports operational listener errors and completes loading safely', () => {
    const onError = vi.fn();
    render(<Harness onError={onError} onNewWebsiteLeads={vi.fn()} />);

    act(() => subscriptions[0].error(new Error('permission denied')));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'permission denied' }),
    );
    expect(screen.getByTestId('lead-ids')).toBeEmptyDOMElement();
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});
