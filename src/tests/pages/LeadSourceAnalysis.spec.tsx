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
  Timestamp: {
    fromDate: (value: Date) => value,
  },
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

vi.mock('../../lib/leadAcquisition', () => ({
  acquisitionChannelLabel: (channel: string) => channel,
  classifyLeadAcquisition: () => ({ channel: 'direct', label: 'Direct' }),
}));

vi.mock('../../pages/admin/DemoSessionsManagement', () => ({
  default: () => <div>Lead admission analytics</div>,
}));

import LeadSourceAnalysis from '../../pages/admin/LeadSourceAnalysis';

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

const leadSnapshot = (id: string, source: string) => ({
  docs: [
    {
      id,
      data: () => ({
        source,
        status: 'new',
        receivedAt: new Date(),
      }),
    },
  ],
});

describe('LeadSourceAnalysis request ordering', () => {
  beforeEach(() => {
    getDocsLoggedMock.mockReset();
  });

  it('keeps the newest range result when an older request resolves later', async () => {
    const thirtyDayRequest = deferred<ReturnType<typeof leadSnapshot>>();
    const sevenDayRequest = deferred<ReturnType<typeof leadSnapshot>>();

    getDocsLoggedMock.mockImplementation((label: string) => {
      if (label === 'LeadSourceAnalysis:30d') return thirtyDayRequest.promise;
      if (label === 'LeadSourceAnalysis:7d') return sevenDayRequest.promise;
      return Promise.resolve({ docs: [] });
    });

    render(<LeadSourceAnalysis />);

    await waitFor(() => {
      expect(getDocsLoggedMock).toHaveBeenCalledWith(
        'LeadSourceAnalysis:30d',
        expect.anything(),
        expect.anything(),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '7d' }));

    await waitFor(() => {
      expect(
        getDocsLoggedMock.mock.calls.some(([label]) => label === 'LeadSourceAnalysis:7d'),
      ).toBe(true);
    });

    await act(async () => {
      sevenDayRequest.resolve(leadSnapshot('lead-7', 'instagram'));
      await sevenDayRequest.promise;
    });

    await waitFor(() => {
      expect(screen.getByText('Instagram (legacy)')).toBeTruthy();
    });

    await act(async () => {
      thirtyDayRequest.resolve(leadSnapshot('lead-30', 'referral'));
      await thirtyDayRequest.promise;
    });

    expect(screen.getByText('Instagram (legacy)')).toBeTruthy();
    expect(screen.queryByText('Referral (legacy)')).toBeNull();
  });

  it('ignores an older rejected range without replacing the newest loading or error state', async () => {
    const thirtyDayRequest = deferred<ReturnType<typeof leadSnapshot>>();
    const sevenDayRequest = deferred<ReturnType<typeof leadSnapshot>>();

    getDocsLoggedMock.mockImplementation((label: string) => {
      if (label === 'LeadSourceAnalysis:30d') return thirtyDayRequest.promise;
      if (label === 'LeadSourceAnalysis:7d') return sevenDayRequest.promise;
      return Promise.resolve({ docs: [] });
    });

    render(<LeadSourceAnalysis />);
    await waitFor(() => expect(getDocsLoggedMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: '7d' }));

    await act(async () => {
      sevenDayRequest.resolve(leadSnapshot('lead-7', 'instagram'));
      await sevenDayRequest.promise;
    });
    await waitFor(() => expect(screen.getByText('Instagram (legacy)')).toBeTruthy());

    await act(async () => {
      thirtyDayRequest.reject(new Error('stale 30d failure'));
      try {
        await thirtyDayRequest.promise;
      } catch {
        // expected stale rejection
      }
    });

    expect(screen.getByText('Instagram (legacy)')).toBeTruthy();
    expect(screen.queryByText(/stale 30d failure/)).toBeNull();
    expect(screen.queryByText('Loading lead attribution…')).toBeNull();
  });

  it('uses receivedAt, then requestedAt, then createdAt in IST and deduplicates the range queries', async () => {
    const doc = (id: string, data: Record<string, unknown>) => ({ id, data: () => data });
    getDocsLoggedMock.mockImplementation((label: string) => {
      if (label.endsWith(':requestedAt')) {
        return Promise.resolve({ docs: [
          doc('requested', { requestedAt: new Date('2026-08-10T03:00:00.000Z'), source: 'referral' }),
        ] });
      }
      if (label.endsWith(':createdAt')) {
        return Promise.resolve({ docs: [
          doc('created', { createdAt: new Date('2026-08-10T04:00:00.000Z'), source: 'manual' }),
          doc('outside-by-priority', {
            receivedAt: new Date('2026-08-09T03:00:00.000Z'),
            createdAt: new Date('2026-08-10T04:00:00.000Z'),
            source: 'instagram',
          }),
        ] });
      }
      return Promise.resolve({ docs: [
        doc('received', { receivedAt: new Date('2026-08-10T02:00:00.000Z'), source: 'whatsapp' }),
        // Duplicate proves the three bounded queries are unioned by lead id.
        doc('requested', { requestedAt: new Date('2026-08-10T03:00:00.000Z'), source: 'referral' }),
      ] });
    });

    render(
      <LeadSourceAnalysis
        startDateKey="2026-08-10"
        endDateKey="2026-08-10"
        showFunnel={false}
      />,
    );

    await waitFor(() => {
      const leadsLabel = screen.getAllByText('Leads').find((node) => node.tagName === 'DIV');
      expect(leadsLabel).toBeTruthy();
      expect(leadsLabel?.parentElement?.textContent).toContain('3');
    });
    expect(screen.queryByText('Instagram (legacy)')).toBeNull();
  });
});
