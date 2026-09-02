import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadExternalMock, getDocsLoggedMock } = vi.hoisted(() => ({
  loadExternalMock: vi.fn(),
  getDocsLoggedMock: vi.fn(),
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));
vi.mock('../../lib/firestoreReadLogging', () => ({ getDocsLogged: getDocsLoggedMock }));
vi.mock('../../lib/externalTrafficAnalytics', () => ({
  loadExternalTrafficAnalytics: loadExternalMock,
}));
vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => ({ kind: 'collection', args }),
  query: (...args: unknown[]) => ({ kind: 'query', args }),
  where: (...args: unknown[]) => ({ kind: 'where', args }),
  Timestamp: { fromDate: (value: Date) => value },
}));
vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));
vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

import ContentSeoAnalyticsSection from '../../pages/admin/ContentSeoAnalyticsSection';

const leadDoc = (id: string, data: Record<string, unknown>) => ({ id, data: () => data });

const trafficResponse = {
  schemaVersion: 1,
  timeZone: 'Asia/Kolkata',
  configuration: {
    ga4Configured: true,
    gscConfigured: true,
    siteOrigin: 'https://tinystepslearning.com',
  },
  current: {
    startDateKey: '2026-09-01',
    endDateKey: '2026-09-02',
    expectedDays: 2,
    ga4: { coverageDays: 2, partialDays: 0, truncatedDays: 0, sessions: 50, engagedSessions: 35 },
    gsc: { coverageDays: 2, partialDays: 0, truncatedDays: 0, clicks: 10, impressions: 300, weightedPositionSum: 1800, averagePosition: 6 },
    pages: [
      { path: '/blog/article-a', sessions: 50, engagedSessions: 35, clicks: 10, impressions: 300, averagePosition: 6 },
    ],
  },
  previous: {
    startDateKey: '2026-08-30',
    endDateKey: '2026-08-31',
    expectedDays: 2,
    ga4: { coverageDays: 2, partialDays: 0, truncatedDays: 0, sessions: 30, engagedSessions: 18 },
    gsc: { coverageDays: 2, partialDays: 0, truncatedDays: 0, clicks: 6, impressions: 180, weightedPositionSum: 1440, averagePosition: 8 },
    pages: [
      { path: '/blog/article-a', sessions: 30, engagedSessions: 18, clicks: 6, impressions: 180, averagePosition: 8 },
    ],
  },
};

describe('Brick 7 Content & SEO section', () => {
  beforeEach(() => {
    loadExternalMock.mockReset();
    getDocsLoggedMock.mockReset();
    loadExternalMock.mockResolvedValue(trafficResponse);
    getDocsLoggedMock.mockResolvedValue({
      docs: [
        leadDoc('current-blog', {
          receivedAt: new Date('2026-09-01T04:00:00.000Z'),
          landingPage: '/blog/article-a',
          status: 'admitted_confirmed',
          demoSessionId: 'demo-current',
        }),
        leadDoc('previous-blog', {
          receivedAt: new Date('2026-08-30T04:00:00.000Z'),
          landingPage: '/blog/article-a',
          status: 'demo_completed',
          demoSessionId: 'demo-previous',
        }),
      ],
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<?xml version="1.0"?><urlset>
        <url><loc>https://tinystepslearning.com/blog/article-a</loc></url>
        <url><loc>https://tinystepslearning.com/blog/article-zero</loc></url>
      </urlset>`,
    }));
  });

  it('stays read-free until opened, then shows current-vs-prior blog and business signals', async () => {
    render(<ContentSeoAnalyticsSection startDateKey="2026-09-01" endDateKey="2026-09-02" />);

    expect(screen.getByText('Content & SEO Analytics')).toBeTruthy();
    expect(loadExternalMock).not.toHaveBeenCalled();
    expect(getDocsLoggedMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Open Content & SEO' }));

    await waitFor(() => expect(loadExternalMock).toHaveBeenCalledWith('2026-09-01', '2026-09-02'));
    await waitFor(() => expect(getDocsLoggedMock).toHaveBeenCalledTimes(6));
    await waitFor(() => expect(screen.getByText('Article A')).toBeTruthy());

    expect(screen.getByText('Article Zero')).toBeTruthy();
    expect(screen.getAllByText('Traffic rising').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Converting').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /All 2/i })).toBeTruthy();
    expect(screen.getByText(/No session-to-lead or click-to-lead conversion rate is calculated/i)).toBeTruthy();
  });
});
