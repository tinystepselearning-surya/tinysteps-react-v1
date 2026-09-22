import { describe, expect, it } from 'vitest';
import { TeacherSession } from '../../types/Teacher';
import {
  classifyTodaySession,
  summarizeTodaySessions,
} from '../../pages/teacher/components/today-sessions/todaySessionViewState';

const session = (
  id: string,
  startTime: string,
  endTime: string,
  overrides: Partial<TeacherSession> = {},
): TeacherSession => ({
  id,
  teacherId: 'teacher-1',
  teacherIds: ['teacher-1'],
  enrollmentId: 'enr-1',
  courseId: 'course-1',
  courseName: 'Course',
  date: '2026-09-22',
  startTime,
  endTime,
  kidIds: ['kid-1'],
  status: 'scheduled',
  ...overrides,
} as TeacherSession);

describe('todaySessionViewState', () => {
  const nowMs = Date.parse('2026-09-22T23:27:00+05:30');

  it('does not call an ended scheduled session completed just because time passed', () => {
    const state = classifyTodaySession(
      session('scheduled-ended', '16:00', '16:35'),
      nowMs,
    );

    expect(state.completed).toBe(false);
    expect(state.pending).toBe(true);
    expect(state.soon).toBe(false);
  });

  it('counts only actual completed status as completed', () => {
    const state = classifyTodaySession(
      session('completed', '17:00', '17:35', { status: 'completed' }),
      nowMs,
    );

    expect(state.completed).toBe(true);
    expect(state.pending).toBe(false);
    expect(state.soon).toBe(false);
  });

  it('does not keep recorded absent attendance pending or call it completed', () => {
    const state = classifyTodaySession(
      session('absent-recorded', '15:00', '15:35', {
        attendance: {
          'kid-1': { status: 'absent', notes: '' },
        },
      }),
      nowMs,
    );

    expect(state.hasAttendance).toBe(true);
    expect(state.resolved).toBe(true);
    expect(state.completed).toBe(false);
    expect(state.pending).toBe(false);
  });

  it('marks unresolved sessions pending only after the attendance window opens', () => {
    const beforeWindow = Date.parse('2026-09-22T16:20:00+05:30');
    const afterWindow = Date.parse('2026-09-22T16:31:00+05:30');
    const row = session('window', '16:00', '16:35');

    expect(classifyTodaySession(row, beforeWindow).pending).toBe(false);
    expect(classifyTodaySession(row, afterWindow).pending).toBe(true);
  });

  it('keeps live or next-hour unresolved sessions in Live/Soon', () => {
    const row = session('soon', '20:00', '20:35');
    const withinHour = Date.parse('2026-09-22T19:15:00+05:30');

    expect(classifyTodaySession(row, withinHour).soon).toBe(true);
  });

  it('matches the Sejal audit shape without converting elapsed scheduled rows to completed', () => {
    const rows = [
      session('arjun-adhoc', '15:00', '15:35', {
        attendance: {
          'kid-1': { status: 'absent', notes: '' },
        },
      }),
      session('arjun-recurring', '16:00', '16:35'),
      session('siddharth', '17:00', '17:35', { status: 'completed' }),
      session('arnav', '17:45', '18:20'),
      session('anved', '19:15', '19:50'),
    ];

    expect(summarizeTodaySessions(rows, nowMs)).toEqual({
      total: 5,
      soon: 0,
      pending: 3,
      completed: 1,
    });
  });
});
