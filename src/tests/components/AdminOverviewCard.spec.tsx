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
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
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

    expect(screen.getByText('Admin overview unavailable: permission denied')).toBeTruthy();
    expect(screen.queryByText('Total Users')).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('renders successful zero counts as genuine metrics with Sessions Today semantics', () => {
    useAdminStatsMock.mockReturnValue({
      data: { totalUsers: 0, totalStudents: 0, totalCourses: 0, sessionsToday: 0 },
      isLoading: false,
      error: null,
    });

    render(<AdminOverviewCard />);

    expect(screen.getByText('Sessions Today')).toBeTruthy();
    expect(screen.getAllByText('0')).toHaveLength(4);
  });
});
