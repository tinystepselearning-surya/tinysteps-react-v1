import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { addDays, format } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  useUpcomingSessionsSpy,
  useTeacherFilteredStudentsSpy,
} = vi.hoisted(() => ({
  useUpcomingSessionsSpy: vi.fn(),
  useTeacherFilteredStudentsSpy: vi.fn(),
}));

vi.mock('../../pages/teacher/hooks/useUpcomingSessions', () => ({
  getDefaultUpcomingSelectedDate: () => format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  useUpcomingSessions: useUpcomingSessionsSpy,
}));

vi.mock('../../hooks/useTeacherFilteredData', () => ({
  useTeacherFilteredStudents: useTeacherFilteredStudentsSpy,
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { uid: 'teacher-1' },
  }),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  app: { options: { projectId: 'demo-project' } },
}));

vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('../../pages/teacher/components/lesson-plan/CanvaLessonPlanModal', () => ({
  CanvaLessonPlanModal: () => null,
}));

import { UpcomingSessionsView } from '../../pages/teacher/components/upcoming-sessions/UpcomingSessionsView';

describe('UpcomingSessionsView', () => {
  beforeEach(() => {
    useTeacherFilteredStudentsSpy.mockReturnValue({ students: [] });
    useUpcomingSessionsSpy.mockReset();
    useUpcomingSessionsSpy.mockReturnValue({
      sessions: [],
      isLoading: false,
      error: null,
      enrollmentsById: new Map(),
      entityDocById: new Map(),
      deniedLookups: [],
    });
  });

  it('uses tomorrow by default, keeps the selected draft date local, and loads only after clicking Load', () => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const anotherDate = format(addDays(new Date(), 4), 'yyyy-MM-dd');

    render(<UpcomingSessionsView teacherId="teacher-1" />);

    expect(useUpcomingSessionsSpy).toHaveBeenLastCalledWith('teacher-1', tomorrow);

    const dateInput = screen.getByLabelText('Upcoming session date') as HTMLInputElement;
    expect(dateInput.value).toBe(tomorrow);

    fireEvent.change(dateInput, { target: { value: anotherDate } });

    expect(useUpcomingSessionsSpy).toHaveBeenLastCalledWith('teacher-1', tomorrow);

    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    expect(useUpcomingSessionsSpy).toHaveBeenLastCalledWith('teacher-1', anotherDate);
  });

  it('shows the updated helper and empty-state copy', () => {
    render(<UpcomingSessionsView teacherId="teacher-1" />);

    expect(screen.getByText('Showing one day at a time. Use the date filter to view another day.')).toBeTruthy();
    expect(screen.getByText('No sessions found for this date.')).toBeTruthy();
  });
});
