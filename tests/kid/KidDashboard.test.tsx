import React from 'react';
import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
vi.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { email: 'kid@test.com', role: 'kid', uid: 'kid1', displayName: 'Kid' },
    isLoading: false,
  }),
}));
import KidDashboard from '../../src/pages/kid/KidDashboard';

vi.mock('../../src/pages/kid/components/session/TodaySession', () => ({
  TodaySession: () => <div>Today Session</div>,
}));

vi.mock('../../src/pages/kid/components/progress/ProgressBars', () => ({
  ProgressBars: () => <div>Progress Bars</div>,
}));

vi.mock('../../src/pages/kid/components/achievements/Achievements', () => ({
  Achievements: () => <div>Achievements</div>,
}));

vi.mock('../../src/pages/kid/components/worksheets/WorksheetsList', () => ({
  WorksheetsList: () => <div>Worksheets</div>,
}));

vi.mock('../../src/pages/kid/components/games/GamesList', () => ({
  GamesList: () => <div>Games</div>,
}));

describe('KidDashboard component', () => {
  it('renders kid dashboard components', () => {
    render(
      <MemoryRouter initialEntries={["/kid"]}>
        <Routes>
          <Route path="/kid" element={<KidDashboard />} />
        </Routes>
      </MemoryRouter>
    );

  expect(screen.getByText('Today Session')).toBeInTheDocument();
  expect(screen.getByText('Progress Bars')).toBeInTheDocument();
  expect(screen.getByText('Achievements')).toBeInTheDocument();
  expect(screen.getByText('Games')).toBeInTheDocument();
  });
});
