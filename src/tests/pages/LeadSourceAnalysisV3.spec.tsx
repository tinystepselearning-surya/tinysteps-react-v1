import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  Timestamp: { fromDate: (value: Date) => value },
}));
vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));
vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));
vi.mock('../../pages/admin/DemoSessionsManagement', () => ({ default: () => <div>Growth funnel</div> }));

import LeadSourceAnalysis from '../../pages/admin/LeadSourceAnalysis';

const leadDoc = (id: string, data: Record<string, unknown>) => ({ id, data: () => data });

describe('LeadSourceAnalysisV3', () => {
  beforeEach(() => {
    getDocsLoggedMock.mockReset();
  });

  it('shows AI attribution, Demo Completed quality and inspectable Other campaign detail', async () => {
    const docs = [
      leadDoc('chatgpt-lead', {
        receivedAt: new Date('2026-09-01T04:00:00.000Z'),
        status: 'admitted_confirmed',
        demoSessionId: 'demo-chatgpt',
        demoCompletedAt: new Date('2026-09-01T08:00:00.000Z'),
        acquisitionChannel: 'referral',
        acquisitionSource: 'chatgpt.com',
        landingPage: '/blog/phonics-guide',
        attribution: { referrerDomain: 'chatgpt.com' },
      }),
      leadDoc('google-lead', {
        receivedAt: new Date('2026-09-01T05:00:00.000Z'),
        status: 'demo_completed',
        demoSessionId: 'demo-google',
        acquisitionChannel: 'google_organic',
        acquisitionSource: 'google.co.in',
        landingPage: '/phonics',
      }),
      leadDoc('campaign-lead', {
        receivedAt: new Date('2026-09-01T06:00:00.000Z'),
        status: 'demo_pending_schedule',
        demoSessionId: 'demo-campaign',
        acquisitionChannel: 'other',
        acquisitionSource: 'newsletter_partner',
        landingPage: '/grammar',
        attribution: {
          utm_source: 'newsletter_partner',
          utm_medium: 'email',
          utm_campaign: 'sep_launch',
          referrerDomain: 'partner.example',
        },
      }),
      leadDoc('direct-lead', {
        receivedAt: new Date('2026-09-01T07:00:00.000Z'),
        status: 'new',
        acquisitionChannel: 'direct',
        acquisitionSource: 'direct',
        landingPage: '/',
      }),
    ];
    getDocsLoggedMock.mockResolvedValue({ docs });

    render(
      <LeadSourceAnalysis
        startDateKey="2026-09-01"
        endDateKey="2026-09-02"
        showFunnel={false}
      />,
    );

    await waitFor(() => expect(screen.getByText('ChatGPT')).toBeTruthy());
    expect(screen.getAllByText('Demo Completed').length).toBeGreaterThan(0);
    expect(screen.getByText(/AI \/ Answer Engines 1 \(25\.0%\)/)).toBeTruthy();
    expect(screen.getByText('Google Organic')).toBeTruthy();
    expect(screen.getByText('Other campaign')).toBeTruthy();
    expect(screen.getByText(/cohort still maturing/i)).toBeTruthy();

    const campaignRow = screen.getByText('Other campaign').closest('tr');
    expect(campaignRow).toBeTruthy();
    fireEvent.click(within(campaignRow as HTMLTableRowElement).getByRole('button', { name: 'Inspect' }));

    expect(await screen.findByText('sep_launch')).toBeTruthy();
    expect(screen.getAllByText('newsletter_partner').length).toBeGreaterThan(0);
    expect(screen.getByText('partner.example')).toBeTruthy();
  });
});
