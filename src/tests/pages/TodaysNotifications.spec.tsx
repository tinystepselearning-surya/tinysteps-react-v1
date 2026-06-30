import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectSessionTeacherRefs, resolvePreferredSessionTeacherRef } from '../../lib/sessionTeacherRefs';
import {
  loadManualReminderDayBuckets,
  loadManualReminderSelectedDate,
  sessionHasRequiredReminderDisplayData,
} from '../../pages/admin/todaysNotificationsManualData';

describe('TodaysNotifications teacher alias resolution', () => {
  it('collects every supported teacher alias from a repaired class session', () => {
    expect(
      collectSessionTeacherRefs({
        teacherIds: ['teacher-aditi'],
        assignedTeacherId: 'teacher-aditi',
        primaryTeacherId: 'teacher-aditi',
        teacherUid: 'teacher-aditi',
      }),
    ).toEqual(['teacher-aditi']);
  });

  it('prefers the enrollment-matching teacher alias so Sessions Management can include repaired rows', () => {
    const session = {
      assignedTeacherId: 'teacher-aditi',
      teacherUid: 'teacher-aditi',
    };

    expect(resolvePreferredSessionTeacherRef(session, ['teacher-aditi'])).toBe('teacher-aditi');
    expect(resolvePreferredSessionTeacherRef(session, ['someone-else', 'teacher-aditi'])).toBe('teacher-aditi');
  });
});

describe('TodaysNotifications manual reminder loading', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads today and tomorrow on first open and caches them', async () => {
    const readCache = vi.fn(() => null);
    const writeCache = vi.fn();
    const fetchSessionsForDate = vi.fn(async (dateKey: string) =>
      dateKey === '2026-06-30'
        ? [{ id: 'today-1', date: dateKey, status: 'scheduled', kidName: 'A', parentName: 'P', teacherName: 'T', courseName: 'C' }]
        : [{ id: 'tomorrow-1', date: dateKey, status: 'scheduled', kidName: 'B', parentName: 'P2', teacherName: 'T2', courseName: 'C2' }],
    );
    const fetchEnrollmentsByIds = vi.fn(async () => ({}));

    const result = await loadManualReminderDayBuckets({
      deps: { fetchEnrollmentsByIds, fetchSessionsForDate, readCache, writeCache },
      todayDateKey: '2026-06-30',
      tomorrowDateKey: '2026-07-01',
    });

    expect(result.source).toBe('firestore');
    expect(result.todaySessions.map((session) => session.id)).toEqual(['today-1']);
    expect(result.tomorrowSessions.map((session) => session.id)).toEqual(['tomorrow-1']);
    expect(fetchSessionsForDate).toHaveBeenCalledTimes(2);
    expect(fetchSessionsForDate).toHaveBeenNthCalledWith(1, '2026-06-30');
    expect(fetchSessionsForDate).toHaveBeenNthCalledWith(2, '2026-07-01');
    expect(writeCache).toHaveBeenCalledTimes(1);
  });

  it('uses same-day cache on reopen and does not refetch', async () => {
    const cached = {
      fetchedAt: 123,
      fetchedForDate: '2026-06-30',
      todaySessions: [{ id: 'today-1', date: '2026-06-30', status: 'scheduled' }],
      tomorrowSessions: [{ id: 'tomorrow-1', date: '2026-07-01', status: 'scheduled' }],
    };
    const fetchSessionsForDate = vi.fn();
    const fetchEnrollmentsByIds = vi.fn();

    const result = await loadManualReminderDayBuckets({
      deps: {
        fetchEnrollmentsByIds: fetchEnrollmentsByIds as any,
        fetchSessionsForDate: fetchSessionsForDate as any,
        readCache: () => cached,
        writeCache: vi.fn(),
      },
      todayDateKey: '2026-06-30',
      tomorrowDateKey: '2026-07-01',
    });

    expect(result.source).toBe('cache');
    expect(fetchSessionsForDate).not.toHaveBeenCalled();
    expect(fetchEnrollmentsByIds).not.toHaveBeenCalled();
  });

  it('refresh forces a new fetch even when same-day cache exists', async () => {
    const fetchSessionsForDate = vi.fn(async (dateKey: string) => [
      { id: `${dateKey}-session`, date: dateKey, status: 'scheduled', kidName: 'Kid', parentName: 'Parent', teacherName: 'Teacher', courseName: 'Course' },
    ]);

    await loadManualReminderDayBuckets({
      deps: {
        fetchEnrollmentsByIds: vi.fn(async () => ({})),
        fetchSessionsForDate,
        readCache: () => ({
          fetchedAt: 1,
          fetchedForDate: '2026-06-30',
          todaySessions: [],
          tomorrowSessions: [],
        }),
        writeCache: vi.fn(),
      },
      forceRefresh: true,
      todayDateKey: '2026-06-30',
      tomorrowDateKey: '2026-07-01',
    });

    expect(fetchSessionsForDate).toHaveBeenCalledTimes(2);
  });

  it('selected date fetch loads only that selected date', async () => {
    const fetchSessionsForDate = vi.fn(async (dateKey: string) => [
      { id: `${dateKey}-session`, date: dateKey, status: 'scheduled', kidName: 'Kid', parentName: 'Parent', teacherName: 'Teacher', courseName: 'Course' },
    ]);

    const result = await loadManualReminderSelectedDate({
      dateKey: '2026-07-04',
      deps: {
        fetchEnrollmentsByIds: vi.fn(async () => ({})),
        fetchSessionsForDate,
      },
    });

    expect(fetchSessionsForDate).toHaveBeenCalledTimes(1);
    expect(fetchSessionsForDate).toHaveBeenCalledWith('2026-07-04');
    expect(result.sessions.map((session) => session.id)).toEqual(['2026-07-04-session']);
  });

  it('does not fetch enrollments when session snapshot already has required display fields', async () => {
    const session = {
      id: 'session-1',
      date: '2026-06-30',
      status: 'scheduled',
      kidName: 'Kid',
      parentName: 'Parent',
      teacherName: 'Teacher',
      courseName: 'Course',
    };

    expect(sessionHasRequiredReminderDisplayData(session)).toBe(true);

    const fetchEnrollmentsByIds = vi.fn(async () => ({}));
    await loadManualReminderSelectedDate({
      dateKey: '2026-06-30',
      deps: {
        fetchEnrollmentsByIds,
        fetchSessionsForDate: vi.fn(async () => [session]),
      },
    });

    expect(fetchEnrollmentsByIds).not.toHaveBeenCalled();
  });

  it('fetches enrollment fallback only for sessions missing display data', async () => {
    const fetchEnrollmentsByIds = vi.fn(async () => ({
      'enrollment-1': {
        id: 'enrollment-1',
        courseName: 'Recovered Course',
        parentId: 'parent-1',
        teacherId: 'teacher-1',
      },
    }));

    const result = await loadManualReminderSelectedDate({
      dateKey: '2026-06-30',
      deps: {
        fetchEnrollmentsByIds,
        fetchSessionsForDate: vi.fn(async () => [
          {
            id: 'session-1',
            enrollmentId: 'enrollment-1',
            date: '2026-06-30',
            status: 'scheduled',
            kidName: 'Kid',
          },
        ]),
      },
    });

    expect(fetchEnrollmentsByIds).toHaveBeenCalledTimes(1);
    expect(fetchEnrollmentsByIds).toHaveBeenCalledWith(['enrollment-1']);
    expect(result.enrollmentFallbackReads).toBe(1);
    expect(result.sessions[0].courseName).toBe('Recovered Course');
  });
});
