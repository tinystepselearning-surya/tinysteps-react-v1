import { getSessionEndDate, getSessionStartDate } from '../../../../lib/sessionTime';
import { TeacherSession } from '../../../../types/Teacher';

export const TEACHER_ATTENDANCE_OPEN_DELAY_MS = 30 * 60 * 1000;
const SOON_WINDOW_MS = 60 * 60 * 1000;

const RESOLVED_NON_COMPLETED_STATUSES = new Set([
  'reschedule_requested',
  'cancelled',
  'canceled',
  'rescheduled',
  'no_show',
  'absent',
  'present',
  'late',
]);

const hasRecordedAttendance = (session: TeacherSession): boolean =>
  Object.keys(session.attendance || {}).length > 0;

const getFallbackEndDate = (session: TeacherSession, start: Date): Date => {
  const resolved = getSessionEndDate(session);
  if (resolved) return resolved;

  const durationMins =
    Number((session as any).durationMins) ||
    Number((session as any).durationMinutes) ||
    30;

  return new Date(start.getTime() + Math.max(durationMins, 30) * 60 * 1000);
};

export interface TodaySessionViewState {
  completed: boolean;
  pending: boolean;
  soon: boolean;
  resolved: boolean;
  hasAttendance: boolean;
}

export const classifyTodaySession = (
  session: TeacherSession,
  nowMs: number,
  attendanceOpenDelayMs = TEACHER_ATTENDANCE_OPEN_DELAY_MS,
): TodaySessionViewState => {
  const status = String(session.status || '').trim().toLowerCase();
  const start = getSessionStartDate(session);
  const end = start ? getFallbackEndDate(session, start) : null;
  const hasAttendance = hasRecordedAttendance(session);

  const completed = status === 'completed';
  const resolved =
    completed ||
    hasAttendance ||
    RESOLVED_NON_COMPLETED_STATUSES.has(status);

  const pending =
    !resolved &&
    start !== null &&
    nowMs >= start.getTime() + attendanceOpenDelayMs;

  const soon =
    !resolved &&
    start !== null &&
    (
      (start.getTime() <= nowMs && end !== null && end.getTime() >= nowMs) ||
      (start.getTime() > nowMs && start.getTime() - nowMs <= SOON_WINDOW_MS)
    );

  return {
    completed,
    pending,
    soon,
    resolved,
    hasAttendance,
  };
};

export const summarizeTodaySessions = (
  sessions: TeacherSession[],
  nowMs: number,
): {
  total: number;
  soon: number;
  pending: number;
  completed: number;
} => {
  let soon = 0;
  let pending = 0;
  let completed = 0;

  sessions.forEach((session) => {
    const state = classifyTodaySession(session, nowMs);
    if (state.soon) soon += 1;
    if (state.pending) pending += 1;
    if (state.completed) completed += 1;
  });

  return {
    total: sessions.length,
    soon,
    pending,
    completed,
  };
};
