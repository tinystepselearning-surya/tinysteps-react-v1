import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(() => ({ kind: 'collection' })),
  doc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn((...args: unknown[]) => ({ kind: 'orderBy', args })),
  query: vi.fn((...args: unknown[]) => ({ kind: 'query', args })),
  serverTimestamp: vi.fn(),
  timestampFromDate: vi.fn((value: Date) => ({ value })),
  updateDoc: vi.fn(),
  where: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
  writeBatch: vi.fn(),
}));

const workspaceMocks = vi.hoisted(() => ({
  toast: vi.fn(),
  listenAllDemoSessions: vi.fn(() => vi.fn()),
  listenDemoSessionPrivatePhones: vi.fn(() => vi.fn()),
}));

vi.mock('firebase/firestore', () => ({
  ...firestoreMocks,
  Timestamp: {
    fromDate: firestoreMocks.timestampFromDate,
  },
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('../../../lib/firebaseConfig', () => ({ db: {}, functions: {} }));

vi.mock('@components/hooks/use-toast', () => ({
  useToast: () => ({ toast: workspaceMocks.toast }),
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: { role: 'admin', email: 'admin@tinysteps.com' } }),
}));

vi.mock('../../../services/demoSessionsService', () => ({
  cancelDemoSession: vi.fn(),
  checkDemoPhoneConflicts: vi.fn(),
  createDemoSession: vi.fn(),
  deleteDemoSession: vi.fn(),
  listenAllDemoSessions: workspaceMocks.listenAllDemoSessions,
  listenDemoSessionPrivatePhones: workspaceMocks.listenDemoSessionPrivatePhones,
  reassignDemoSession: vi.fn(),
  releaseDemoSession: vi.fn(),
  reopenDemoSession: vi.fn(),
  updateDemoSessionAdminDetails: vi.fn(),
  updateDemoConversion: vi.fn(),
}));

vi.mock('../../../pages/admin/DemoSessionsManagement', () => ({
  default: () => <div data-testid="demo-sessions-management" />,
}));

import {
  useRealtimeLeads,
  type RealtimeLeadRecord,
} from '../../../pages/admin/leadsRealtime';
import LeadsInquiriesWorkspace from '../../../pages/admin/LeadsInquiriesWorkspace';

type TestLead = RealtimeLeadRecord & {
  source?: string;
  status?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type SnapshotCallback = (snapshot: ReturnType<typeof makeSnapshot>) => void;

const subscriptions: Array<{
  options?: { includeMetadataChanges?: boolean };
  next: SnapshotCallback;
  error: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
}> = [];

const makeDoc = (
  id: string,
  data: Omit<TestLead, 'id'>,
  hasPendingWrites = false,
) => ({
  id,
  data: () => data,
  metadata: { hasPendingWrites },
});

function makeSnapshot(
  docs: Array<ReturnType<typeof makeDoc>>,
  changes: Array<{ type: 'added' | 'modified' | 'removed'; doc: ReturnType<typeof makeDoc> }> = [],
  fromCache = false,
) {
  return {
    docs,
    docChanges: () => changes,
    metadata: { fromCache },
  };
}

function Harness({
  clientDateFilter = '',
  clientStatusFilter = 'all',
  onError = vi.fn(),
  onNewWebsiteLeads,
}: {
  clientDateFilter?: string;
  clientStatusFilter?: string;
  onError?: (error: Error) => void;
  onNewWebsiteLeads: (leads: TestLead[]) => void;
}) {
  const { leads, isLoading, newLeadIds } = useRealtimeLeads<TestLead>({
    onError,
    onNewWebsiteLeads,
  });

  return (
    <div>
      <span data-testid="client-date-filter">{clientDateFilter}</span>
      <span data-testid="client-status-filter">{clientStatusFilter}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="lead-ids">{leads.map((lead) => lead.id).join(',')}</span>
      <span data-testid="new-lead-ids">{Array.from(newLeadIds).join(',')}</span>
    </div>
  );
}

const emit = (subscriptionIndex: number, snapshot: ReturnType<typeof makeSnapshot>) => {
  act(() => subscriptions[subscriptionIndex].next(snapshot));
};

const flushNotificationBuffer = () => {
  act(() => vi.advanceTimersByTime(400));
};

beforeEach(() => {
  vi.useFakeTimers();
  subscriptions.length = 0;
  Object.values(firestoreMocks).forEach((mock) => mock.mockClear());
  Object.values(workspaceMocks).forEach((mock) => mock.mockClear());
  workspaceMocks.listenAllDemoSessions.mockImplementation(() => vi.fn());
  workspaceMocks.listenDemoSessionPrivatePhones.mockImplementation(() => vi.fn());
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

describe('useRealtimeLeads', () => {

  it('registers metadata changes and orders the single query by createdAt descending', () => {
    render(<Harness onNewWebsiteLeads={vi.fn()} />);

    expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(1);
    expect(subscriptions[0].options).toEqual({ includeMetadataChanges: true });
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(firestoreMocks.where).not.toHaveBeenCalled();
  });

  it('populates the initial newest-first snapshot without notifying', () => {
    const onNew = vi.fn();
    render(<Harness onNewWebsiteLeads={onNew} />);
    const newest = makeDoc('newest', { source: 'website' });
    const older = makeDoc('older', { source: 'website' });

    emit(0, makeSnapshot(
      [newest, older],
      [{ type: 'added', doc: newest }, { type: 'added', doc: older }],
    ));
    flushNotificationBuffer();

    expect(screen.getByTestId('lead-ids')).toHaveTextContent('newest,older');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(onNew).not.toHaveBeenCalled();
  });

  it('handles cached startup, authoritative metadata, then notifies once for the next website lead', () => {
    const onNew = vi.fn();
    render(<Harness onNewWebsiteLeads={onNew} />);
    const cachedLead = makeDoc('cached', { source: 'website' });

    emit(0, makeSnapshot([cachedLead], [{ type: 'added', doc: cachedLead }], true));
    emit(0, makeSnapshot([cachedLead], [], false));
    const websiteLead = makeDoc('website-1', { source: 'website', parentName: 'Parent One' });
    emit(0, makeSnapshot(
      [websiteLead, cachedLead],
      [{ type: 'added', doc: websiteLead }],
    ));
    flushNotificationBuffer();

    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onNew).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'website-1', source: 'website' }),
    ]);
  });

  it('does not notify for a manually created or locally pending lead', () => {
    const onNew = vi.fn();
    render(<Harness onNewWebsiteLeads={onNew} />);
    emit(0, makeSnapshot([]));
    const manualLead = makeDoc('manual-1', { source: 'manual' });
    const localWebsiteLead = makeDoc('local-website', { source: 'website' }, true);

    emit(0, makeSnapshot(
      [localWebsiteLead, manualLead],
      [
        { type: 'added', doc: manualLead },
        { type: 'added', doc: localWebsiteLead },
      ],
    ));
    flushNotificationBuffer();

    expect(onNew).not.toHaveBeenCalled();
  });

  it('deduplicates an already-notified document ID', () => {
    const onNew = vi.fn();
    render(<Harness onNewWebsiteLeads={onNew} />);
    emit(0, makeSnapshot([]));
    const websiteLead = makeDoc('website-1', { source: 'website' });

    emit(0, makeSnapshot([websiteLead], [{ type: 'added', doc: websiteLead }]));
    flushNotificationBuffer();
    emit(0, makeSnapshot([websiteLead], [{ type: 'added', doc: websiteLead }]));
    flushNotificationBuffer();

    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it('groups website leads from two close snapshots into one callback', () => {
    const onNew = vi.fn();
    render(<Harness onNewWebsiteLeads={onNew} />);
    emit(0, makeSnapshot([]));
    const first = makeDoc('website-1', { source: 'website' });
    const second = makeDoc('website-2', { source: 'website' });

    emit(0, makeSnapshot([first], [{ type: 'added', doc: first }]));
    act(() => vi.advanceTimersByTime(200));
    emit(0, makeSnapshot([second, first], [{ type: 'added', doc: second }]));

    expect(onNew).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onNew.mock.calls[0][0].map((lead: TestLead) => lead.id)).toEqual([
      'website-1',
      'website-2',
    ]);
  });

  it('removes temporary highlights after ten seconds and globally caps them at 500', () => {
    render(<Harness onNewWebsiteLeads={vi.fn()} />);
    emit(0, makeSnapshot([]));
    const docs = Array.from({ length: 501 }, (_, index) =>
      makeDoc(`website-${index}`, { source: 'website' }));

    emit(0, makeSnapshot(docs, docs.map((doc) => ({ type: 'added' as const, doc }))));

    const activeIds = screen.getByTestId('new-lead-ids').textContent?.split(',') ?? [];
    expect(activeIds).toHaveLength(500);
    expect(activeIds).not.toContain('website-0');
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByTestId('new-lead-ids')).toBeEmptyDOMElement();
  });

  it('does not resubscribe when client-side status or updated-date filters change', () => {
    const { rerender } = render(
      <Harness clientDateFilter="" clientStatusFilter="all" onNewWebsiteLeads={vi.fn()} />,
    );

    rerender(
      <Harness
        clientDateFilter="2026-07-01"
        clientStatusFilter="new"
        onNewWebsiteLeads={vi.fn()}
      />,
    );

    expect(screen.getByTestId('client-date-filter')).toHaveTextContent('2026-07-01');
    expect(screen.getByTestId('client-status-filter')).toHaveTextContent('new');
    expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(1);
    expect(subscriptions[0].unsubscribe).not.toHaveBeenCalled();
  });

  it('clears active highlight and notification timers and unsubscribes on unmount', () => {
    const onNew = vi.fn();
    const { unmount } = render(<Harness onNewWebsiteLeads={onNew} />);
    emit(0, makeSnapshot([]));
    const websiteLead = makeDoc('website-1', { source: 'website' });
    emit(0, makeSnapshot([websiteLead], [{ type: 'added', doc: websiteLead }]));

    expect(vi.getTimerCount()).toBe(2);
    unmount();

    expect(subscriptions[0].unsubscribe).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.runAllTimers());
    expect(onNew).not.toHaveBeenCalled();
  });

  it('reports listener errors, clears rows, and completes loading', () => {
    const onError = vi.fn();
    render(<Harness onError={onError} onNewWebsiteLeads={vi.fn()} />);
    const lead = makeDoc('existing', { source: 'manual' });
    emit(0, makeSnapshot([lead]));

    act(() => subscriptions[0].error(new Error('permission denied')));

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'permission denied' }));
    expect(screen.getByTestId('lead-ids')).toBeEmptyDOMElement();
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});

describe('LeadsInquiriesWorkspace integration', () => {
  it('renders a lead-only assessment as Enquiry, Not Created, with its created date', () => {
    render(<LeadsInquiriesWorkspace />);
    emit(0, makeSnapshot([]));
    const createdAt = { toMillis: () => new Date('2026-07-26T06:30:00.000Z').getTime() };
    const websiteLead = makeDoc('website-1', {
      source: 'website',
      parentName: 'Parent One',
      childName: 'Child One',
      createdAt,
      updatedAt: createdAt,
      status: 'new',
    });

    emit(0, makeSnapshot([websiteLead], [{ type: 'added', doc: websiteLead }]));

    expect(screen.getByText('Parent One')).toBeInTheDocument();
    expect(screen.getByText('Enquiry')).toBeInTheDocument();
    expect(screen.getByText('Not Created')).toBeInTheDocument();
    expect(screen.getAllByText(/26 Jul/).length).toBeGreaterThanOrEqual(2);
  });

  it('detects and describes a new website lead hidden by the applied Updated filter', () => {
    render(<LeadsInquiriesWorkspace />);
    emit(0, makeSnapshot([]));
    fireEvent.change(screen.getByLabelText('Updated From'), {
      target: { value: '2030-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    const listenerCountBeforeLead = firestoreMocks.onSnapshot.mock.calls.length;
    const createdAt = { toMillis: () => new Date('2026-07-26T06:30:00.000Z').getTime() };
    const hiddenLead = makeDoc('hidden-website', {
      source: 'website',
      parentName: 'Hidden Parent',
      childName: 'Hidden Child',
      createdAt,
      updatedAt: createdAt,
    });

    emit(0, makeSnapshot([hiddenLead], [{ type: 'added', doc: hiddenLead }]));
    flushNotificationBuffer();

    expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(listenerCountBeforeLead);
    expect(screen.queryByText('Hidden Parent')).not.toBeInTheDocument();
    expect(workspaceMocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New website assessment received',
      description: expect.stringContaining('It may be hidden by the current filters.'),
    }));
  });
});
