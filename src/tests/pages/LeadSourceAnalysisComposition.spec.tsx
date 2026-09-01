import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
    fromDate: (date: Date) => date,
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

vi.mock('../../pages/admin/DemoSessionsManagement', () => ({
  default: ({ mode, showTrendAnalytics }: { mode?: string; showTrendAnalytics?: boolean }) => (
    <div>Lead funnel mode: {mode} · analytics: {String(showTrendAnalytics)}</div>
  ),
}));

import LeadSourceAnalysis from '../../pages/admin/LeadSourceAnalysis';

const emptySnapshot = {
  docs: [],
};

describe('LeadSourceAnalysis management dashboard composition', () => {
  beforeEach(() => {
    getDocsLoggedMock.mockReset();
    getDocsLoggedMock.mockResolvedValue(emptySnapshot);
  });

  it('keeps the live lead/admission funnel and Acquisition V3 source quality together', async () => {
    render(<LeadSourceAnalysis />);

    expect(screen.getByText('Growth & Admissions')).toBeTruthy();
    expect(screen.getByText('Lead funnel mode: trend_only · analytics: true')).toBeTruthy();
    expect(screen.getByText('Acquisition V3 · Source Quality')).toBeTruthy();
    expect(screen.getByText('Acquisition source quality')).toBeTruthy();
    expect(screen.getByText('AI / Answer Engines')).toBeTruthy();

    await waitFor(() => {
      expect(getDocsLoggedMock).toHaveBeenCalled();
    });
  });
});
