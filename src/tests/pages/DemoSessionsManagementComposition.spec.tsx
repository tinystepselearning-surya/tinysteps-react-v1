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

import DemoSessionsManagement from '../../pages/admin/DemoSessionsManagement';

describe('DemoSessionsManagement analytics placement', () => {
  it('does not render management analytics in the operational trend slot by default', () => {
    const { container } = render(
      <DemoSessionsManagement mode="trend_only" leads={[]} demos={[]} />,
    );

    expect(container.textContent).toBe('');
    expect(screen.queryByText('Lead admission analytics')).toBeNull();
  });

  it('renders the lead/admission analytics only when explicitly requested by management analytics', () => {
    render(
      <DemoSessionsManagement
        mode="trend_only"
        showTrendAnalytics
        leads={[]}
        demos={[]}
      />,
    );

    expect(screen.getByText('Lead admission analytics')).toBeTruthy();
  });
});
