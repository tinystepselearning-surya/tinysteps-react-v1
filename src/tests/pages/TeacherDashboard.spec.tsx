import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const {
  todayViewSpy,
  studentsViewSpy,
} = vi.hoisted(() => ({
  todayViewSpy: vi.fn(),
  studentsViewSpy: vi.fn(),
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: {
      uid: 'teacher-1',
      role: 'teacher',
      displayName: 'Teacher One',
      email: 'teacher@example.com',
    },
    isLoading: false,
  }),
}));

vi.mock('../../hooks/useMessageThreads', () => ({
  default: () => ({
    threads: [],
  }),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  app: {
    options: {
      projectId: 'demo-project',
    },
  },
}));

vi.mock('../../components/common/MobileTabBar', () => ({
  default: () => null,
}));

vi.mock('../../components/common/HolidayCalendar2026', () => ({
  default: () => <div>Holiday calendar</div>,
}));

vi.mock('../../pages/messages/MessagesPanel', () => ({
  default: () => <div>Messages panel</div>,
}));

vi.mock('../../pages/teacher/components/layout/TeacherSidebar', () => ({
  TeacherSidebar: () => <div>Teacher sidebar</div>,
}));

vi.mock('@components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../pages/teacher/components/today-sessions/TodaySessionsList', () => ({
  TodaySessionsList: () => {
    todayViewSpy();
    return <div>Today sessions view</div>;
  },
}));

vi.mock('../../pages/teacher/components/upcoming-sessions/UpcomingSessionsView', () => ({
  UpcomingSessionsView: () => <div>Upcoming sessions view</div>,
}));

vi.mock('../../pages/teacher/components/demo/DemoAssignmentsView', () => ({
  DemoAssignmentsView: () => <div>Demo assignments view</div>,
}));

vi.mock('../../pages/teacher/components/students/TeacherMyStudentsV2', () => ({
  TeacherMyStudentsV2: () => {
    studentsViewSpy();
    return <div>Students view</div>;
  },
}));

vi.mock('../../pages/teacher/components/earnings/EarningsSummary', () => ({
  EarningsSummary: () => <div>Earnings view</div>,
}));

vi.mock('../../pages/teacher/components/schedule/ScheduleView', () => ({
  ScheduleView: () => <div>Schedule view</div>,
}));

vi.mock('../../pages/teacher/components/profile/TeacherProfile', () => ({
  TeacherProfile: () => <div>Profile view</div>,
}));

vi.mock('../../pages/teacher/LessonLibraryPage', () => ({
  default: () => <div>Lesson library</div>,
}));

vi.mock('../../pages/teacher/components/FullScreenCanvaViewer', () => ({
  FullScreenCanvaViewer: () => <div>Viewer</div>,
}));

import TeacherDashboard from '../../pages/teacher/TeacherDashboard';

describe('TeacherDashboard', () => {
  it('does not mount Today sessions when the initial URL tab is students', async () => {
    render(
      <MemoryRouter initialEntries={['/teacher?tab=students']}>
        <TeacherDashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Students view')).toBeTruthy());

    expect(studentsViewSpy).toHaveBeenCalledTimes(1);
    expect(todayViewSpy).not.toHaveBeenCalled();
    expect(screen.queryByText('Today sessions view')).toBeNull();
  });
});
