import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDocsLoggedMock, getAggregateFromServerMock } = vi.hoisted(() => ({
  getDocsLoggedMock: vi.fn(),
  getAggregateFromServerMock: vi.fn(),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
}));

vi.mock('../../lib/firestoreReadLogging', () => ({
  getDocsLogged: getDocsLoggedMock,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => ({ kind: 'collection', args }),
  collectionGroup: (...args: unknown[]) => ({ kind: 'collectionGroup', args }),
  getAggregateFromServer: getAggregateFromServerMock,
  query: (...args: unknown[]) => ({ kind: 'query', args }),
  sum: (field: string) => ({ kind: 'sum', field }),
  where: (...args: unknown[]) => ({ kind: 'where', args }),
}));

vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock('@components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('../../pages/admin/LeadSourceAnalysis', () => ({
  default: () => <div>Lead source analytics stub</div>,
}));

vi.mock('../../pages/admin/DemoSessionsManagement', () => ({
  default: () => <div>Lead funnel analytics stub</div>,
}));

import AnalyticsDashboard from '../../pages/admin/AnalyticsDashboard';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const snapshot = (rows: Array<Record<string, unknown>>) => ({
  docs: rows.map((row, index) => ({
    id: String(row.id || `doc-${index}`),
    data: () => row,
  })),
});

const aggregateSnapshot = (billed = 0, settled = 0, outstanding = billed - settled) => ({
  data: () => ({
    selectedMonthBilled: billed,
    selectedMonthSettled: settled,
    selectedMonthOutstanding: outstanding,
  }),
});

const cardText = (label: string): string => {
  const labelNode = screen.getByText(label);
  return labelNode.parentElement?.textContent || '';
};

describe('AnalyticsDashboard selected-month state', () => {
  beforeEach(() => {
    getDocsLoggedMock.mockReset();
    getDocsLoggedMock.mockResolvedValue(snapshot([]));
    getAggregateFromServerMock.mockReset();
  });

  it('clears the previous month before loading a new month and does not restore stale values on failure', async () => {
    let phase: 'initial' | 'next' = 'initial';
    const nextAggregateRequest = deferred<ReturnType<typeof aggregateSnapshot>>();

    getAggregateFromServerMock.mockImplementation(() =>
      phase === 'next' ? nextAggregateRequest.promise : Promise.resolve(aggregateSnapshot(1000)),
    );

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(cardText('Billed Revenue (Month)')).toContain('₹1,000');
    });

    phase = 'next';
    const callsBeforeNextMonth = getAggregateFromServerMock.mock.calls.length;
    const monthInput = screen.getByLabelText('Analytics reporting month');
    fireEvent.change(monthInput, { target: { value: '2026-07' } });

    await waitFor(() => {
      expect(getAggregateFromServerMock.mock.calls.length).toBe(callsBeforeNextMonth + 1);
    });
    expect(cardText('Billed Revenue (Month)')).not.toContain('₹1,000');

    await act(async () => {
      nextAggregateRequest.reject(new Error('month query failed'));
      try {
        await nextAggregateRequest.promise;
      } catch {
        // expected rejection
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Analytics detail: month query failed/)).toBeTruthy();
    });
    expect(cardText('Billed Revenue (Month)')).not.toContain('₹1,000');
  });

  it('keeps the newest month when an older month resolves last', async () => {
    let phase: 'initial' | 'older' | 'newest' = 'initial';
    const olderGate = deferred<void>();
    const newestGate = deferred<void>();

    getAggregateFromServerMock.mockImplementation(() => {
      const response = (amount: number) => aggregateSnapshot(amount);
      if (phase === 'older') return olderGate.promise.then(() => response(9000));
      if (phase === 'newest') return newestGate.promise.then(() => response(2000));
      return Promise.resolve(response(1000));
    });

    render(<AnalyticsDashboard />);
    await waitFor(() => expect(cardText('Billed Revenue (Month)')).toContain('₹1,000'));

    const monthInput = screen.getByLabelText('Analytics reporting month');
    const callsBeforeOlder = getAggregateFromServerMock.mock.calls.length;
    phase = 'older';
    fireEvent.change(monthInput, { target: { value: '2026-07' } });
    await waitFor(() => expect(getAggregateFromServerMock.mock.calls.length).toBe(callsBeforeOlder + 1));

    phase = 'newest';
    fireEvent.change(monthInput, { target: { value: '2026-06' } });
    await act(async () => {
      newestGate.resolve();
      await newestGate.promise;
    });
    await waitFor(() => expect(cardText('Billed Revenue (Month)')).toContain('₹2,000'));

    await act(async () => {
      olderGate.resolve();
      await olderGate.promise;
    });
    expect(cardText('Billed Revenue (Month)')).toContain('₹2,000');
    expect(cardText('Billed Revenue (Month)')).not.toContain('₹9,000');
  });

  it('shows a genuine zero after a successful empty selected-month query', async () => {
    getAggregateFromServerMock.mockResolvedValue(aggregateSnapshot());
    render(<AnalyticsDashboard />);

    await waitFor(() => expect(cardText('Billed Revenue (Month)')).toContain('₹0'));
    expect(screen.queryByText(/Analytics detail:/)).toBeNull();
  });
});
