import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadMock, syncMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
  syncMock: vi.fn(),
}));

vi.mock('../../lib/externalTrafficAnalytics', () => ({
  loadExternalTrafficAnalytics: loadMock,
  syncExternalTrafficAnalytics: syncMock,
}));
vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));
vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

import ExternalTrafficAnalyticsSection from '../../pages/admin/ExternalTrafficAnalyticsSection';

const response = {
  schemaVersion: 1,
  timeZone: 'Asia/Kolkata',
  configuration: {
    ga4Configured: true,
    gscConfigured: true,
    siteOrigin: 'https://tinystepslearning.com',
  },
  sync: {
    providers: {
      ga4: { status: 'ok', lastSuccessfulAt: '2026-09-02T01:15:00.000Z' },
      gsc: { status: 'ok', lastSuccessfulAt: '2026-09-02T01:15:00.000Z' },
    },
  },
  current: {
    startDateKey: '2026-09-01',
    endDateKey: '2026-09-02',
    expectedDays: 2,
    ga4: {
      coverageDays: 2,
      partialDays: 1,
      truncatedDays: 0,
      sessions: 120,
      engagedSessions: 72,
    },
    gsc: {
      coverageDays: 2,
      partialDays: 1,
      truncatedDays: 0,
      clicks: 18,
      impressions: 600,
      weightedPositionSum: 5100,
      averagePosition: 8.5,
    },
    pages: [
      {
        path: '/blog/phonics-guide',
        sessions: 40,
        engagedSessions: 28,
        clicks: 10,
        impressions: 250,
        averagePosition: 7.2,
      },
    ],
  },
  previous: {
    startDateKey: '2026-08-30',
    endDateKey: '2026-08-31',
    expectedDays: 2,
    ga4: {
      coverageDays: 2,
      partialDays: 0,
      truncatedDays: 0,
      sessions: 100,
      engagedSessions: 60,
    },
    gsc: {
      coverageDays: 2,
      partialDays: 0,
      truncatedDays: 0,
      clicks: 15,
      impressions: 500,
      weightedPositionSum: 4500,
      averagePosition: 9,
    },
    pages: [],
  },
};

describe('Brick 6 external traffic analytics', () => {
  beforeEach(() => {
    loadMock.mockReset();
    syncMock.mockReset();
    loadMock.mockResolvedValue(response);
    syncMock.mockResolvedValue({
      ok: true,
      startDateKey: '2026-09-01',
      endDateKey: '2026-09-02',
      providers: {
        ga4: { status: 'ok' },
        gsc: { status: 'ok' },
      },
    });
  });

  it('keeps GA4 and Search Console semantics separate and exposes coverage', async () => {
    render(<ExternalTrafficAnalyticsSection startDateKey="2026-09-01" endDateKey="2026-09-02" />);

    await waitFor(() => expect(screen.getByText('Brick 6 · Traffic & Search')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('120')).toBeTruthy());

    expect(screen.getByText('GA4 Sessions')).toBeTruthy();
    expect(screen.getByText('GSC Clicks')).toBeTruthy();
    expect(screen.getByText('Search CTR')).toBeTruthy();
    expect(screen.getByText(/GA4 sessions and Search Console clicks are separate measurements/i)).toBeTruthy();
    expect(screen.getByText(/2\/2 synced days · 1 partial/i)).toBeTruthy();
    expect(screen.getByText('/blog/phonics-guide')).toBeTruthy();
    expect(screen.getByText('8.5')).toBeTruthy();
  });

  it('runs an explicit admin sync and reloads the cached read model', async () => {
    render(<ExternalTrafficAnalyticsSection startDateKey="2026-09-01" endDateKey="2026-09-02" />);
    await waitFor(() => expect(loadMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Sync selected period' }));

    await waitFor(() => expect(syncMock).toHaveBeenCalledWith('2026-09-01', '2026-09-02'));
    await waitFor(() => expect(loadMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/Sync finished · GA4: ok · GSC: ok/i)).toBeTruthy();
  });

  it('shows setup rather than zeroes when providers are not configured', async () => {
    loadMock.mockResolvedValue({
      ...response,
      configuration: {
        ...response.configuration,
        ga4Configured: false,
        gscConfigured: false,
      },
      current: {
        ...response.current,
        ga4: { ...response.current.ga4, coverageDays: 0, sessions: 0, engagedSessions: 0 },
        gsc: { ...response.current.gsc, coverageDays: 0, clicks: 0, impressions: 0, averagePosition: null },
        pages: [],
      },
    });

    render(<ExternalTrafficAnalyticsSection startDateKey="2026-09-01" endDateKey="2026-09-02" />);

    await waitFor(() => expect(screen.getByText(/External analytics is not configured on the server yet/i)).toBeTruthy());
    const ga4Card = screen.getByText('GA4 Sessions').parentElement;
    expect(ga4Card?.textContent).toContain('—');
    expect(screen.getByRole('button', { name: 'Sync selected period' })).toBeDisabled();
  });
});
