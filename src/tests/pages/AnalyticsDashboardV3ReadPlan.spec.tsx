import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDocLoggedMock, getDocsLoggedMock, getAggregateFromServerMock } = vi.hoisted(() => ({
  getDocLoggedMock: vi.fn(),
  getDocsLoggedMock: vi.fn(),
  getAggregateFromServerMock: vi.fn(),
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));
vi.mock('../../lib/firestoreReadLogging', () => ({
  getDocLogged: getDocLoggedMock,
  getDocsLogged: getDocsLoggedMock,
}));
vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => ({ kind: 'collection', args }),
  collectionGroup: (...args: unknown[]) => ({ kind: 'collectionGroup', args }),
  doc: (...args: unknown[]) => ({ kind: 'doc', args }),
  getAggregateFromServer: getAggregateFromServerMock,
  query: (...args: unknown[]) => ({ kind: 'query', args }),
  sum: (field: string) => ({ kind: 'sum', field }),
  where: (...args: unknown[]) => ({ kind: 'where', args }),
}));
vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));
vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));
vi.mock('@components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));
vi.mock('../../pages/admin/DemoSessionsManagement', () => ({
  default: ({ analyticsVariant }: { analyticsVariant?: string }) => <div>Demo analytics {analyticsVariant || 'full'}</div>,
}));
vi.mock('../../pages/admin/LeadSourceAnalysis', () => ({
  default: () => <div>Acquisition analytics</div>,
}));

import AnalyticsDashboard from '../../pages/admin/AnalyticsDashboard';
import { analyticsMonthKeyFromDate } from '../../pages/admin/analyticsV2Metrics';

const snapshot = (rows: Array<Record<string, unknown>> = []) => ({
  docs: rows.map((row, index) => ({ id: String(row.id || `doc-${index}`), data: () => row })),
});

const labels = () => getDocsLoggedMock.mock.calls.map(([label]) => String(label));
const countLabel = (label: string) => labels().filter((value) => value === label).length;

describe('AnalyticsDashboard V3 Firestore read plan', () => {
  beforeEach(() => {
    const monthKey = analyticsMonthKeyFromDate(new Date());

    getDocLoggedMock.mockReset();
    getDocLoggedMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        monthKey,
        ready: true,
        analyticsProjectionVersion: 1,
      }),
    });

    getDocsLoggedMock.mockReset();
    getDocsLoggedMock.mockImplementation(async (label: string) => {
      if (label === 'AnalyticsDashboardV3:month-teacher-finance-rollups') {
        return snapshot([
          {
            id: monthKey,
            monthKey,
            totalEarnings: 1000,
            pendingEarnings: 200,
            totalSessions: 5,
            demoEarnings: 100,
            demoCompletedCount: 1,
            demoEnrollmentBonusCount: 0,
            analyticsProjectionVersion: 1,
            unclassifiedEarnings: 0,
          },
        ]);
      }
      return snapshot();
    });

    getAggregateFromServerMock.mockReset();
    getAggregateFromServerMock.mockResolvedValue({
      data: () => ({
        selectedMonthBilled: 1000,
        selectedMonthSettled: 800,
        selectedMonthOutstanding: 200,
      }),
    });
  });

  it('keeps Overview off every raw monthly collection', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Executive scorecard')).toBeTruthy();
    expect(getDocsLoggedMock).not.toHaveBeenCalled();
  });

  it('does not make shell-level finance/session reads for Growth or Acquisition', async () => {
    render(<AnalyticsDashboard />);
    await waitFor(() => expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Growth & Admissions' }));
    expect(await screen.findByText('Demo analytics full')).toBeTruthy();
    expect(getDocsLoggedMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Acquisition' }));
    expect(await screen.findByText('Acquisition analytics')).toBeTruthy();
    expect(getDocsLoggedMock).not.toHaveBeenCalled();
  });

  it('loads certified Finance detail only after Finance is opened without raw teacher earnings', async () => {
    render(<AnalyticsDashboard />);
    await waitFor(() => expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Finance' }));

    await waitFor(() => {
      expect(labels()).toEqual(expect.arrayContaining([
        'AnalyticsDashboardV3:month-billing-charges',
        'AnalyticsDashboardV3:month-teacher-finance-rollups',
        'AnalyticsDashboardV3:month-class-sessions',
        'AnalyticsDashboardV3:all-enrollments',
        'AnalyticsDashboardV3:all-courses',
      ]));
    });
    expect(getDocLoggedMock).toHaveBeenCalledTimes(1);
    expect(labels()).not.toContain('AnalyticsDashboardV3:month-teacher-earnings');
    expect(labels()).not.toContain('AnalyticsDashboardV3:month-teacher-earnings-fallback');
    expect(labels()).not.toContain('AnalyticsDashboardV3:all-users');
  });

  it('loads raw month earnings only when moving from Finance to Teachers detail', async () => {
    render(<AnalyticsDashboard />);
    await waitFor(() => expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Finance' }));
    await waitFor(() => expect(countLabel('AnalyticsDashboardV3:month-teacher-finance-rollups')).toBe(1));
    expect(countLabel('AnalyticsDashboardV3:month-teacher-earnings')).toBe(0);
    expect(countLabel('AnalyticsDashboardV3:month-class-sessions')).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Teachers' }));
    await waitFor(() => expect(countLabel('AnalyticsDashboardV3:all-users')).toBe(1));

    expect(countLabel('AnalyticsDashboardV3:month-teacher-earnings')).toBe(1);
    expect(countLabel('AnalyticsDashboardV3:month-teacher-finance-rollups')).toBe(1);
    expect(countLabel('AnalyticsDashboardV3:month-class-sessions')).toBe(1);
  });

  it('loads Delivery without teacher earnings or user profiles', async () => {
    render(<AnalyticsDashboard />);
    await waitFor(() => expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Delivery' }));
    await waitFor(() => expect(countLabel('AnalyticsDashboardV3:month-class-sessions')).toBe(1));

    expect(labels()).toEqual(expect.arrayContaining([
      'AnalyticsDashboardV3:month-billing-charges',
      'AnalyticsDashboardV3:month-class-sessions',
      'AnalyticsDashboardV3:all-enrollments',
      'AnalyticsDashboardV3:all-courses',
    ]));
    expect(labels()).not.toContain('AnalyticsDashboardV3:month-teacher-earnings');
    expect(labels()).not.toContain('AnalyticsDashboardV3:month-teacher-earnings-fallback');
    expect(labels()).not.toContain('AnalyticsDashboardV3:month-teacher-finance-rollups');
    expect(labels()).not.toContain('AnalyticsDashboardV3:all-users');
  });

  it('manual Refresh invalidates only the datasets required by the current view', async () => {
    render(<AnalyticsDashboard />);
    await waitFor(() => expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Teachers' }));
    await waitFor(() => expect(countLabel('AnalyticsDashboardV3:all-users')).toBe(1));
    expect(countLabel('AnalyticsDashboardV3:month-teacher-earnings')).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(countLabel('AnalyticsDashboardV3:all-users')).toBe(2));

    expect(countLabel('AnalyticsDashboardV3:month-teacher-earnings')).toBe(2);
    expect(labels()).not.toContain('AnalyticsDashboardV3:month-class-sessions');
    expect(labels()).not.toContain('AnalyticsDashboardV3:month-billing-charges');
  });
});
