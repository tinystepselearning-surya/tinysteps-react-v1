import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminDashboard from '../../src/pages/admin/AdminDashboard';

vi.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { email: 'suryaz@tinysteps.com', role: 'teacher' },
    isLoading: false,
  }),
}));

vi.mock('../../src/lib/firebaseConfig', () => ({
  db: {},
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      totalUsers: 10,
      totalStudents: 5,
      totalCourses: 3,
      activeSessionsToday: 1,
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../src/pages/admin/components/Header', () => ({
  default: () => <div>Header</div>,
}));

vi.mock('../../src/pages/admin/components/Sidebar', () => ({
  default: () => <div>Sidebar</div>,
}));

vi.mock('../../src/pages/admin/UserManagement/UserList', () => ({
  UserList: () => <div>User List</div>,
}));

vi.mock('../../src/pages/admin/StudentManagement/StudentManagementTab', () => ({
  default: () => <div>Student Management</div>,
}));

vi.mock('../../src/pages/admin/RelationshipManagement/RelationshipManagement', () => ({
  default: () => <div>Relationship Management</div>,
}));

vi.mock('../../src/pages/admin/CourseManagement/CourseManagement', () => ({
  default: () => <div>Course Management</div>,
}));

vi.mock('../../src/pages/admin/Analytics', () => ({
  __esModule: true,
  default: ({ stats }: { stats: any }) => (
    <div>
      Analytics {stats?.totalUsers}
    </div>
  ),
  AdminStats: {},
}));

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={['/Surya']}>
      <Routes>
        <Route path="/Surya" element={<AdminDashboard />} />
        <Route path="/teacher" element={<div>Teacher Dashboard</div>} />
        <Route path="/parent" element={<div>Parent Dashboard</div>} />
        <Route path="/learningpartner" element={<div>LP Dashboard</div>} />
        <Route path="/kid" element={<div>Kid Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminDashboard superuser quick access', () => {
  const cases = [
    { button: 'Teacher', expectation: 'Teacher Dashboard' },
    { button: 'Parent', expectation: 'Parent Dashboard' },
    { button: 'Learning Partner', expectation: 'LP Dashboard' },
    { button: 'Kid', expectation: 'Kid Dashboard' },
  ];

  cases.forEach(({ button, expectation }) => {
    it(`navigates to ${button} dashboard`, () => {
      renderDashboard();
      fireEvent.click(screen.getByRole('button', { name: button }));
      expect(screen.getByText(expectation)).toBeInTheDocument();
    });
  });

  it('shows admin content by default', () => {
    renderDashboard();
    expect(screen.getByText(/Superuser Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/User List/)).toBeInTheDocument();
  });
});
