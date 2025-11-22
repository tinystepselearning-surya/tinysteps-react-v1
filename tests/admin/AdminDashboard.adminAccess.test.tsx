import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminDashboard from '../../src/pages/admin/AdminDashboard';

vi.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: {
      uid: 'admin-uid',              // ✅ add this line
      email: 'admin@test.com',
      role: 'admin',
    },
    isLoading: false,
  }),
}));

vi.mock('../../src/lib/firebaseConfig', () => ({
  db: {},
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      totalUsers: 1,
      totalStudents: 1,
      totalCourses: 1,
      activeSessionsToday: 0,
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

describe('AdminDashboard admin access', () => {
  it('shows admin content for admin role', () => {
    render(
      <MemoryRouter initialEntries={['/surya']}>
        <Routes>
          <Route path="/surya" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('User List')).toBeInTheDocument();
  });
});
