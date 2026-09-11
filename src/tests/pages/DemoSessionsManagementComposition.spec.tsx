import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

vi.mock('@components/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock('../../services/demoSessionsService', () => ({
  listenAllDemoSessions: vi.fn(() => vi.fn()),
}));

vi.mock('../../pages/admin/LegacyDemoSessionsManagement', () => ({
  default: () => <div>Legacy demo manager</div>,
}));

vi.mock('../../pages/admin/LeadFunnelTrendAnalysis', () => ({
  default: () => <div>Lead admission analytics</div>,
}));

vi.mock('../../pages/admin/AnalyticsV3CertificationSection', () => ({
  default: () => <div>Analytics V3 certification</div>,
}));

import DemoSessionsManagement from '../../pages/admin/DemoSessionsManagement';

describe('DemoSessionsManagement analytics placement', () => {
  it('does not render management analytics in the operational trend slot by default', () => {
    const { container } = render(
      <DemoSessionsManagement mode="trend_only" leads={[]} demos={[]} />,
    );

    expect(container.textContent).toBe('');
    expect(screen.queryByText('Lead admission analytics')).toBeNull();
  });

  it('waits for both live snapshots instead of presenting plausible zero funnel metrics', () => {
    render(
      <DemoSessionsManagement
        mode="trend_only"
        showTrendAnalytics
      />,
    );

    expect(screen.getByText('Loading Growth & Admissions analytics…')).toBeTruthy();
    expect(screen.queryByText('Lead admission analytics')).toBeNull();
    expect(screen.queryByText('Analytics V3 certification')).toBeNull();
  });

  it('renders the lead/admission analytics and Brick 8 certification when full analytics is explicitly requested', () => {
    render(
      <DemoSessionsManagement
        mode="trend_only"
        showTrendAnalytics
        leads={[]}
        demos={[]}
      />,
    );

    expect(screen.getByText('Lead admission analytics')).toBeTruthy();
    expect(screen.getByText('Analytics V3 certification')).toBeTruthy();
  });

  it('keeps the Brick 8 certification panel out of compact Overview summary mode', () => {
    render(
      <DemoSessionsManagement
        mode="trend_only"
        showTrendAnalytics
        leads={[]}
        demos={[]}
        analyticsVariant="summary"
      />,
    );

    expect(screen.getByText('Lead admission analytics')).toBeTruthy();
    expect(screen.queryByText('Analytics V3 certification')).toBeNull();
  });
});
