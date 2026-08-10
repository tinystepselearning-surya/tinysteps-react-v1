import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDocsLoggedMock } = vi.hoisted(() => ({
  getDocsLoggedMock: vi.fn(),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
}));

vi.mock('../../lib/firestoreReadLogging', () => ({
  getDocsLogged: getDocsLoggedMock,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => ({ kind: 'collection', args }),
  query: (...args: unknown[]) => ({ kind: 'query', args }),
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

const cardText = (label: string): string => {
  const labelNode = screen.getByText(label);
  return labelNode.parentElement?.textContent || '';
};

describe('AnalyticsDashboard selected-month state', () => {
  beforeEach(() => {
    getDocsLoggedMock.mockReset();
  });

  it('clears the previous month before loading a new month and does not restore stale values on failure', async () => {
    let phase: 'initial' | 'next' = 'initial';
    const nextMonthRequest = deferred<ReturnType<typeof snapshot>>();

    getDocsLoggedMock.mockImplementation((label: string) => {
      if (phase === 'next' && label.startsWith('AnalyticsDashboard:month-')) {
        return nextMonthRequest.promise;
      }

      if (label === 'AnalyticsDashboard:month-billing-charges') {
        return Promise.resolve(snapshot([{ id: 'charge-1', amount: 1000, status: 'open' }]));
      }
      if (label === 'AnalyticsDashboard:month-payments') {
        return Promise.resolve(snapshot([]));
      }
      if (label === 'AnalyticsDashboard:month-teacher-earnings') {
        return Promise.resolve(snapshot([]));
      }
      if (label === 'AnalyticsDashboard:month-class-sessions') {
        return Promise.resolve(snapshot([]));
      }
      return Promise.resolve(snapshot([]));
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(cardText('Billed Revenue (Month)')).toContain('₹1,000');
    });

    phase = 'next';
    const monthInput = document.querySelector('input[type="month"]');
    expect(monthInput).toBeTruthy();

    fireEvent.change(monthInput!, { target: { value: '2026-07' } });

    await waitFor(() => {
      expect(screen.getByText(/Loading analytics for 2026-07/)).toBeTruthy();
    });
    expect(cardText('Billed Revenue (Month)')).not.toContain('₹1,000');

    await act(async () => {
      nextMonthRequest.reject(new Error('month query failed'));
      try {
        await nextMonthRequest.promise;
      } catch {
        // expected rejection
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Month analytics: month query failed/)).toBeTruthy();
    });
    expect(cardText('Billed Revenue (Month)')).toContain('₹0');
    expect(cardText('Billed Revenue (Month)')).not.toContain('₹1,000');
  });
});
