import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useAdminStatsMock } = vi.hoisted(() => ({
  useAdminStatsMock: vi.fn(),
}));

vi.mock('../../hooks/useAdminStats', () => ({
  useAdminStats: useAdminStatsMock,
}));

vi.mock('@components/ui/card', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

import AdminOverviewCard from '../../components/admin/AdminOverviewCard';

describe('AdminOverviewCard', () => {
  beforeEach(() => {
    useAdminStatsMock.mockReset();
  });

  it('renders Firestore failures as unavailable instead of zero metrics', () => {
    useAdminStatsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('permission denied'),
    });

    render(<AdminOverviewCard />);

    expect(screen.getByText('Live operations unavailable: permission denied')).toBeTruthy();
    expect(screen.queryByText('Sessions today')).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('keeps only the useful live pulse and removes inventory-style dashboard KPIs', () => {
    useAdminStatsMock.mockReturnValue({
      data: { totalUsers: 160, totalStudents: 143, totalCourses: 9, sessionsToday: 49 },
      isLoading: false,
      error: null,
    });

    render(<AdminOverviewCard />);

    expect(screen.getByText('Live operations')).toBeTruthy();
    expect(screen.getByText('Sessions today')).toBeTruthy();
    expect(screen.getByText('Students')).toBeTruthy();
    expect(screen.getByText('49')).toBeTruthy();
    expect(screen.getByText('143')).toBeTruthy();
    expect(screen.queryByText('Total Users')).toBeNull();
    expect(screen.queryByText('Total Courses')).toBeNull();
    expect(screen.queryByText('160')).toBeNull();
    expect(screen.queryByText('9')).toBeNull();
  });
});
