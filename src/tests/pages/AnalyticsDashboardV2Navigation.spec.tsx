import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDocsLoggedMock } = vi.hoisted(() => ({
  getDocsLoggedMock: vi.fn(),
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));
vi.mock('../../lib/firestoreReadLogging', () => ({ getDocsLogged: getDocsLoggedMock }));
vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => ({ kind: 'collection', args }),
  query: (...args: unknown[]) => ({ kind: 'query', args }),
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
  default: ({ analyticsVariant, analyticsStartKey, analyticsEndKey }: {
    analyticsVariant?: string;
    analyticsStartKey?: string;
    analyticsEndKey?: string;
  }) => (
    <div>
      Demo analytics {analyticsVariant || 'full'} · {analyticsStartKey || 'none'} · {analyticsEndKey || 'none'}
    </div>
  ),
}));

vi.mock('../../pages/admin/LeadSourceAnalysis', () => ({
  default: ({ startDateKey, endDateKey, showFunnel }: {
    startDateKey?: string;
    endDateKey?: string;
    showFunnel?: boolean;
  }) => (
    <div>
      Acquisition analytics · {startDateKey || 'none'} · {endDateKey || 'none'} · funnel {String(showFunnel)}
    </div>
  ),
}));

import AnalyticsDashboardV2 from '../../pages/admin/AnalyticsDashboardV2';

const snapshot = (rows: Array<Record<string, unknown>> = []) => ({
  docs: rows.map((row, index) => ({ id: String(row.id || `doc-${index}`), data: () => row })),
});

describe('AnalyticsDashboardV2 information architecture', () => {
  beforeEach(() => {
    getDocsLoggedMock.mockReset();
    getDocsLoggedMock.mockResolvedValue(snapshot());
  });

  it('starts with a compact management overview and keeps detail tables out of the default view', async () => {
    render(<AnalyticsDashboardV2 />);
    await waitFor(() => expect(screen.getByText('Executive scorecard')).toBeTruthy());

    expect(screen.getByText(/Demo analytics summary/)).toBeTruthy();
    expect(screen.getByText('Management attention')).toBeTruthy();
    expect(screen.queryByText('Teacher earnings · selected month')).toBeNull();
    expect(screen.queryByText('Marketing Attribution')).toBeNull();
  });

  it('propagates one selected month to growth and acquisition drill-downs', async () => {
    render(<AnalyticsDashboardV2 />);
    await waitFor(() => expect(screen.getByText('Executive scorecard')).toBeTruthy());

    fireEvent.change(screen.getByLabelText('Analytics reporting month'), { target: { value: '2026-07' } });

    fireEvent.click(screen.getByRole('button', { name: 'Growth & Admissions' }));
    expect(await screen.findByText(/Demo analytics full · 2026-07-01 · 2026-07-31/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Acquisition' }));
    expect(await screen.findByText(/Acquisition analytics · 2026-07-01 · 2026-07-31 · funnel false/)).toBeTruthy();
  });

  it('lazy-loads heavy core detail only when a specialist view needs it', async () => {
    render(<AnalyticsDashboardV2 />);
    await waitFor(() => expect(screen.getByText('Executive scorecard')).toBeTruthy());

    expect(getDocsLoggedMock.mock.calls.some(([label]) => label === 'AnalyticsDashboard:all-users')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Finance' }));

    await waitFor(() => {
      expect(getDocsLoggedMock.mock.calls.some(([label]) => label === 'AnalyticsDashboard:all-users')).toBe(true);
      expect(getDocsLoggedMock.mock.calls.some(([label]) => label === 'AnalyticsDashboard:all-enrollments')).toBe(true);
      expect(getDocsLoggedMock.mock.calls.some(([label]) => label === 'AnalyticsDashboard:all-courses')).toBe(true);
    });
  });

  it('places the detailed teacher table only in the Teachers view', async () => {
    render(<AnalyticsDashboardV2 />);
    await waitFor(() => expect(screen.getByText('Executive scorecard')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Teachers' }));
    expect(await screen.findByText('Teacher earnings · selected month')).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Teacher' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Pending' })).toBeTruthy();
  });
});
