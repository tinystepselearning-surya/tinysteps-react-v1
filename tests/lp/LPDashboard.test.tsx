import React from 'react';
import { describe, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LPDashboard from '../../src/pages/lp/LPDashboard';

vi.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { email: 'lp@test.com', role: 'learningPartner', uid: 'lp1', displayName: 'LP' },
    isLoading: false,
  }),
}));

vi.mock('../../src/pages/lp/components/layout/LPHeader', () => ({
  LPHeader: () => <div>LP Header</div>,
}));

vi.mock('../../src/pages/lp/components/layout/LPSidebar', () => ({
  LPSidebar: () => <div>LP Sidebar</div>,
}));

vi.mock('../../src/pages/lp/components/overview/LPStats', () => ({
  default: () => <div>LP Stats</div>,
}));

vi.mock('../../src/pages/lp/components/parents/ParentsList', () => ({
  default: () => <div>Parents List</div>,
}));

describe('LPDashboard component', () => {
  it('renders LP dashboard when role is learningPartner', async () => {
    render(
      <MemoryRouter initialEntries={["/learning-partner"]}>
        <Routes>
          <Route path="/learning-partner" element={<LPDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('LP Header')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('LP Stats')).toBeInTheDocument());
  // Additional tabs are loaded lazily; assert overview (LP Stats) is rendered by default
  });
});
