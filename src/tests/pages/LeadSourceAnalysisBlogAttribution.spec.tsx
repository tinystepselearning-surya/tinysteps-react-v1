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

describe('Brick 5 blog lead attribution', () => {
  beforeEach(() => {
    getDocsLoggedMock.mockReset();
  });

  it('shows unique blog contribution, first-touch/influence credit and downstream outcomes', async () => {
    const docs = [
      leadDoc('blog-both', {
        receivedAt: new Date('2026-09-01T04:00:00.000Z'),
        landingPage: '/blog/article-a',
        sourceDetail: 'blog|article-a|phonics-practice|inline',
        acquisitionChannel: 'google_organic',
        acquisitionSource: 'google.co.in',
        status: 'admitted_confirmed',
        demoSessionId: 'demo-a',
      }),
      leadDoc('blog-influenced', {
        receivedAt: new Date('2026-09-01T05:00:00.000Z'),
        landingPage: '/phonics',
        sourceDetail: 'blog|article-b|phonics-diagnostic|footer',
        acquisitionChannel: 'referral',
        acquisitionSource: 'chatgpt.com',
        status: 'demo_completed',
        demoSessionId: 'demo-b',
      }),
      leadDoc('not-blog', {
        receivedAt: new Date('2026-09-01T06:00:00.000Z'),
        landingPage: '/grammar',
        acquisitionChannel: 'direct',
        acquisitionSource: 'direct',
        status: 'new',
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

    await waitFor(() => expect(screen.getByText('Blog contribution · lead attribution')).toBeTruthy());

    const attributed = screen.getByText('Blog-attributed leads').parentElement;
    const firstTouch = screen.getByText('First-touch blog').parentElement;
    const influenced = screen.getByText('Blog-influenced').parentElement;
    expect(attributed?.textContent).toContain('2');
    expect(firstTouch?.textContent).toContain('1');
    expect(influenced?.textContent).toContain('2');

    expect(screen.getByText('Article A')).toBeTruthy();
    expect(screen.getByText('Article B')).toBeTruthy();
    expect(screen.getByText(/cannot say whether blog traffic improved or declined/i)).toBeTruthy();

    const articleARow = screen.getByText('Article A').closest('tr');
    expect(articleARow).toBeTruthy();
    fireEvent.click(within(articleARow as HTMLTableRowElement).getByRole('button', { name: 'Inspect' }));

    expect(await screen.findByText('Blog credit detail · Article A')).toBeTruthy();
    expect(screen.getByText('First touch + influenced')).toBeTruthy();
    expect(screen.getByText('Phonics Practice')).toBeTruthy();
    expect(screen.getByText('Inline')).toBeTruthy();
  });
});
