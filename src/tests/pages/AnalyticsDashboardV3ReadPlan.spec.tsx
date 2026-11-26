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
import { businessTrendSummary, parseBusinessYear, parseBusinessCurrent, monthlyActiveEnrollmentRows } from '../../pages/admin/monthlyBusinessAnalytics';

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

  it('loads exactly two aggregate documents for Monthly Trends and no more on subtab changes', async () => {
    render(<AnalyticsDashboard />);
    await waitFor(() => expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1));
    getDocLoggedMock.mockImplementation(async (label: string) => ({
      exists: () => true,
      data: () => ({
        schemaVersion: 1, metricDefinitionVersion: 1, verificationStatus: 'verified',
        updatedAt: '2026-11-26T09:00:00Z',
        ...(label.includes('year:') ? { year: label.split(':').pop(), months: [] } : { activeStudents: 160, activeEnrollments: 180 }),
      }),
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Monthly Trends' }));
    await waitFor(() => expect(getDocLoggedMock).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByText(/Initial snapshot as of/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/daily closed-day refresh is not yet reflected/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Payments' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enrollments' }));
    await waitFor(() => expect(screen.getByText('160')).toBeTruthy());
    expect(getDocLoggedMock).toHaveBeenCalledTimes(2);
    expect(getDocsLoggedMock).not.toHaveBeenCalled();
    expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1);
  });

  it('labels a daily closed-day snapshot rather than an initial daytime snapshot', async () => {
    render(<AnalyticsDashboard />);
    await waitFor(() => expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1));
    getDocLoggedMock.mockImplementation(async (label: string) => ({
      exists: () => true,
      data: () => ({
        schemaVersion: 1, metricDefinitionVersion: 1, verificationStatus: 'verified',
        updatedAt: '2026-11-26T18:29:59.999Z', refreshMode: 'daily_closed_day', throughDate: '2026-11-26',
        ...(label.includes('year:') ? { year: label.split(':').pop(), months: [] } : { activeStudents: 160, activeEnrollments: 180 }),
      }),
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Monthly Trends' }));
    expect(await screen.findByText(/today's activity is excluded/)).toBeTruthy();
    expect(screen.queryByText(/Initial snapshot as of/)).toBeNull();
  });

  it('keeps the detailed table collapsed, enables month inspection, and preserves the two-read budget', async () => {
    render(<AnalyticsDashboard />);
    await waitFor(() => expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1));
    const year = analyticsMonthKeyFromDate(new Date()).slice(0, 4);
    getDocLoggedMock.mockImplementation(async (label: string) => ({
      exists: () => true,
      data: () => ({
        schemaVersion: 1, metricDefinitionVersion: 1, verificationStatus: 'verified',
        updatedAt: year + '-11-20T10:00:00Z', coverageMode: 'available_records',
        ...(label.includes('year:') ? {
          year,
          months: [
            { monthKey: year + '-09', metrics: { leadEnquiries: 40, billedPaise: 200000, newAdmissions: 4, studentExits: 1 } },
            { monthKey: year + '-10', metrics: { leadEnquiries: 60, billedPaise: 300000, newAdmissions: 6, studentExits: 2 } },
            { monthKey: year + '-11', metrics: { leadEnquiries: 20, billedPaise: 100000, newAdmissions: 2, studentExits: 1 } },
          ],
        } : { activeStudents: 100, activeEnrollments: 110 }),
      }),
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Monthly Trends' }));
    const breakdown = await screen.findByRole('button', { name: /Monthly breakdown/ });
    expect(breakdown.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('table', { name: /Exact monthly leads values/ })).toBeNull();
    const month = screen.getByRole('button', { name: 'Inspect September' });
    fireEvent.click(month);
    expect(month.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(breakdown);
    expect(screen.getByRole('table', { name: /Exact monthly leads values/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Payments' }));
    expect(screen.getByRole('button', { name: /Monthly breakdown/ }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Class charges by service month · not cash collected')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Enrollments' }));
    expect(screen.getByText('Current roster · all years')).toBeTruthy();
    expect(getDocLoggedMock).toHaveBeenCalledTimes(2);
    expect(getDocsLoggedMock).not.toHaveBeenCalled();
    expect(getAggregateFromServerMock).toHaveBeenCalledTimes(1);
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

describe('Monthly business trend display calculations', () => {
  const annual = (updatedAt: string, throughDate?: string) => parseBusinessYear({
    schemaVersion: 1, metricDefinitionVersion: 1, verificationStatus: 'verified',
    year: '2026', updatedAt, ...(throughDate ? { throughDate, refreshMode: 'daily_closed_day' } : {}),
    months: [
      { monthKey: '2026-08', metrics: { leadEnquiries: 0 } },
      { monthKey: '2026-09', metrics: { leadEnquiries: 40 } },
      { monthKey: '2026-10', metrics: { leadEnquiries: 60 } },
      { monthKey: '2026-11', metrics: { leadEnquiries: 20 } },
      { monthKey: '2026-12', metrics: { leadEnquiries: 999 } },
    ],
  }, '2026')!;

  it('keeps the partial month out of comparisons and excludes future values', () => {
    const result = businessTrendSummary(annual('2026-11-26T13:11:47Z'), 'leadEnquiries');
    expect(result.latest).toEqual({ monthKey: '2026-11', value: 20, partial: true });
    expect(result.peak?.value).toBe(60);
    expect(result.change).toBe(50);
    expect(result.total).toBe(120);
    expect(result.average).toBe(33);
    expect(result.averageMonths).toBe(3);
    expect(result.rows[0].value).toBeNull();
    expect(result.rows[7].value).toBe(0);
    expect(result.rows[11].value).toBeNull();
  });

  it('recognises an actual closed month boundary, but not an initial daytime snapshot on its last day', () => {
    const closed = businessTrendSummary(annual('2026-11-30T18:29:59.999Z', '2026-11-30'), 'leadEnquiries');
    expect(closed.latest?.partial).toBe(false);
    expect(closed.change).toBeCloseTo(-66.6667);
    const daytime = businessTrendSummary(annual('2026-11-30T10:00:00Z'), 'leadEnquiries');
    expect(daytime.latest?.partial).toBe(true);
  });

  it('does not invent a zero total or percentage for missing periods', () => {
    const result = businessTrendSummary(annual('2026-11-26T10:00:00Z'), 'billedPaise');
    expect(result.total).toBeNull();
    expect(result.average).toBeNull();
    expect(result.peak).toBeNull();
    expect(result.change).toBeNull();
  });
});

it('keeps historical enrollment stock distinct from current snapshot and never invents previous balances',()=>{
 const envelope={schemaVersion:1,metricDefinitionVersion:1,verificationStatus:'verified',updatedAt:'2026-11-26T13:11:47Z'};
 const annual=parseBusinessYear({...envelope,year:'2026',months:[
  {monthKey:'2026-09',metrics:{activeEnrollmentsAtClose:40},activeEnrollmentBasis:'reconstructed'},
  {monthKey:'2026-10',metrics:{activeEnrollmentsAtClose:50},activeEnrollmentBasis:'observed_month_end',activeEnrollmentObservedAt:'2026-10-31T18:29:59.999Z'},
 ]},'2026')!;
 const current=parseBusinessCurrent({...envelope,activeEnrollments:60})!;
 const rows=monthlyActiveEnrollmentRows(annual,current);
 expect(rows[7].value).toBeNull();
 expect(rows[8]).toMatchObject({value:40,basis:'reconstructed'});
 expect(rows[9]).toMatchObject({value:50,basis:'observed_month_end'});
 expect(rows[10]).toMatchObject({value:60,basis:'observed_snapshot'});
 expect(rows[11].value).toBeNull();
 expect(monthlyActiveEnrollmentRows(annual,{...current,updatedAt:'2026-11-27T10:00:00Z'})[10].value).toBeNull();
});
