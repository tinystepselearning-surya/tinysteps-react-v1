import React from 'react';
import { describe, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../../src/store/useAuthStore';
import TeacherDashboard from '../../src/pages/teacher/TeacherDashboard';

vi.mock('../../src/pages/teacher/components/layout/TeacherHeader', () => ({
  TeacherHeader: () => <div>Teacher Header</div>,
}));

vi.mock('../../src/pages/teacher/components/layout/TeacherSidebar', () => ({
  TeacherSidebar: () => <div>Teacher Sidebar</div>,
}));

vi.mock('../../src/pages/teacher/components/today-sessions/TodaySessionsList', () => ({
  TodaySessionsList: () => <div>Today Sessions List</div>,
}));

vi.mock('../../src/pages/teacher/components/students/StudentsList', () => ({
  StudentsList: () => <div>Students List</div>,
}));

vi.mock('../../src/pages/teacher/hooks/useTeacherSessions', () => ({
  useTeacherSessions: () => ({ sessions: [] }),
}));

vi.mock('../../src/pages/teacher/components/progress/StudentProgressChart', () => ({
  StudentProgressChart: () => <div>Progress Chart</div>,
}));

describe('TeacherDashboard component', () => {
  it('renders teacher dashboard when role is teacher', async () => {
  // Set auth store to teacher
  useAuthStore.getState().setUser({ email: 'teacher@test.com', role: 'teacher', uid: 'teacher1', displayName: 'T1' } as any);
  useAuthStore.getState().setLoading(false);
  render(
      <MemoryRouter initialEntries={["/teacher"]}>
        <Routes>
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Teacher Header')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Today Sessions List')).toBeInTheDocument());
  // Students tab lazy-loaded content tested in separate tests; we assert Today's sessions are shown by default
  });

  it('blocks access if user is not a teacher', async () => {
    // set store for non-teacher
    useAuthStore.getState().setUser({ email: 'parent@test.com', role: 'parent', uid: 'parent1', displayName: 'P1' } as any);
    useAuthStore.getState().setLoading(false);

    render(
      <MemoryRouter initialEntries={["/teacher"]}>
        <Routes>
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/You do not have permission to access the teacher dashboard./i)).toBeInTheDocument());
  });
});
