import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../pages/admin/LeadOperationalCommandCenter', () => ({
  default: () => <div>Operational command center</div>,
}));

vi.mock('../../pages/admin/LeadsInquiriesWorkspaceV2', () => ({
  default: ({ view }: { view?: string }) => <div>Core workflow {view}</div>,
}));

import LeadsInquiriesWorkspaceV3 from '../../pages/admin/LeadsInquiriesWorkspaceV3';

describe('LeadsInquiriesWorkspaceV3 composition', () => {
  it('adds the operational command center above the existing leads workflow', () => {
    render(<LeadsInquiriesWorkspaceV3 view="leads" />);
    expect(screen.getByText('Operational command center')).toBeTruthy();
    expect(screen.getByText('Core workflow leads')).toBeTruthy();
  });

  it('keeps legacy / bulk demo tools unchanged without the lead command center', () => {
    render(<LeadsInquiriesWorkspaceV3 view="demos" />);
    expect(screen.queryByText('Operational command center')).toBeNull();
    expect(screen.getByText('Core workflow demos')).toBeTruthy();
  });
});
