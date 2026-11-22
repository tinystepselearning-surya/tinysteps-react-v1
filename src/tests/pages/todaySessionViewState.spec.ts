import { describe, expect, it } from 'vitest';
import { TeacherSession } from '../../types/Teacher';
import {
  classifyTodaySession,
  partitionTeacherLocalDaySessions,
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

  it('keeps the IST previous date in Pacific Today after IST midnight', () => {
    const now = Date.parse('2026-11-23T00:40:00+05:30');
    const todayPacific = session('pacific-today', '23:50', '00:25', { date: '2026-11-22' });
    const yesterdayPending = session('yesterday-unmarked', '08:00', '08:35', { date: '2026-11-22' });
    const resolvedAbsent = session('recorded-absent', '07:00', '07:35', {
      date: '2026-11-22', attendance: { 'kid-1': { status: 'absent' } },
    });
    const { today, recentPending } = partitionTeacherLocalDaySessions(
      [todayPacific, yesterdayPending, resolvedAbsent], now, 'America/Los_Angeles',
    );
    expect(today.map(row => row.id)).toEqual(['pacific-today']);
    expect(recentPending.map(row => row.id)).toEqual(['yesterday-unmarked']);
  });

  it('keeps a class open across Pacific midnight before attendance becomes pending', () => {
    const now = Date.parse('2026-11-23T00:05:00-08:00');
    const crossing = session('cross-midnight', '13:20', '13:55', { date: '2026-11-23' });
    // 13:20 IST = 23:50 Pacific on November 22.
    const { today, recentPending } = partitionTeacherLocalDaySessions(
      [crossing], now, 'America/Los_Angeles',
    );
    expect(today).toEqual([]);
    expect(recentPending.map(row => row.id)).toEqual(['cross-midnight']);
  });

  it('does not recover completed classes, old classes or other teacher days', () => {
    const now = Date.parse('2026-11-23T13:30:00+05:30');
    const old = session('old', '08:00', '08:35', { date: '2026-11-19' });
    const completed = session('completed', '08:00', '08:35', {
      date: '2026-11-22', status: 'completed',
    });
    const { recentPending } = partitionTeacherLocalDaySessions(
      [old, completed], now, 'America/Los_Angeles',
    );
    expect(recentPending).toEqual([]);
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
