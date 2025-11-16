import React from 'react';
import { describe, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
vi.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { email: 'parent@test.com', role: 'parent', uid: 'parent1', displayName: 'P1' },
    isLoading: false,
  }),
}));
import ParentDashboard from '../../src/pages/parent/ParentDashboard';

vi.mock('../../src/pages/parent/components/layout/ParentHeader', () => ({
  ParentHeader: ({ onOpenKidsView }: any) => (
    <div>
      Parent Header
      <button onClick={onOpenKidsView}>Open Kids</button>
    </div>
  ),
}));

vi.mock('../../src/pages/parent/components/children/ChildrenCards', () => ({
  ChildrenCards: ({ childrenData }: any) => <div>Children: {childrenData?.length || 0}</div>,
}));

vi.mock('../../src/pages/parent/components/sessions/UpcomingSessionsList', () => ({
  UpcomingSessionsList: () => <div>Upcoming Sessions</div>,
}));

vi.mock('../../src/pages/parent/components/payments/InvoiceList', () => ({
  InvoiceList: () => <div>Invoice List</div>,
}));

// Mock parent hooks which use React Query: useParentChildren, useUpcomingSessions, useInvoices, usePaymentHistory, useChildProgress
vi.mock('../../src/pages/parent/hooks/useParentChildren', () => ({
  useParentChildren: () => ({ data: [], isLoading: false })
}));

// Mock filtered hook used by ParentDashboard directly
vi.mock('../../src/hooks/useParentFilteredData', () => ({
  useParentFilteredChildren: () => ({ children: [], loading: false, error: null })
}));

vi.mock('../../src/pages/kid/KidDashboard', () => ({
  __esModule: true,
  default: () => <div>Kid Dashboard</div>,
}));

vi.mock('../../src/pages/parent/hooks/useUpcomingSessions', () => ({
  useUpcomingSessions: () => ({ data: [], isLoading: false })
}));

vi.mock('../../src/pages/parent/hooks/useInvoices', () => ({
  useInvoices: () => ({ data: [], isLoading: false }),
  usePaymentHistory: () => ({ data: [] }),
}));

vi.mock('../../src/pages/parent/hooks/useChildProgress', () => ({
  useChildProgress: () => ({ data: [], isLoading: false })
}));

describe('ParentDashboard component', () => {
  it('renders parent dashboard when role is parent', async () => {
    render(
      <MemoryRouter initialEntries={["/parent"]}>
        <Routes>
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/kids" element={<ParentDashboard />} />
        </Routes>
      </MemoryRouter>
    );
  expect(screen.getByText('Parent Header')).toBeInTheDocument();
  // Confirm the navigation tabs are present for children, sessions, payments, and kids
  expect(screen.getByRole('tab', { name: /Children/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Sessions/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Payments/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Kids Page/i })).toBeInTheDocument();
  fireEvent.click(screen.getByText('Open Kids'));
  expect(await screen.findByText('Kid Dashboard')).toBeInTheDocument();
  });
});
