import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectSessionTeacherRefs, resolvePreferredSessionTeacherRef } from '../../lib/sessionTeacherRefs';
import {
  loadManualReminderDayBuckets,
  loadManualReminderSelectedDate,
  selectOperationalReminderSessions,
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

  it('never treats same-day cache as the final result', async () => {
    const cached = {
      fetchedAt: 123,
      fetchedForDate: '2026-06-30',
      todaySessions: [{ id: 'today-1', date: '2026-06-30', status: 'scheduled' }],
      tomorrowSessions: [{ id: 'tomorrow-1', date: '2026-07-01', status: 'scheduled' }],
    };
    const fetchSessionsForDate = vi.fn(async (dateKey: string) => [
      { id: `fresh-${dateKey}`, date: dateKey, status: 'scheduled' },
    ]);
    const fetchEnrollmentsByIds = vi.fn(async () => ({}));

    const result = await loadManualReminderDayBuckets({
      deps: {
        fetchEnrollmentsByIds,
        fetchSessionsForDate,
        readCache: () => cached,
        writeCache: vi.fn(),
      },
      todayDateKey: '2026-06-30',
      tomorrowDateKey: '2026-07-01',
    });

    expect(result.source).toBe('firestore');
    expect(result.todaySessions[0].id).toBe('fresh-2026-06-30');
    expect(fetchSessionsForDate).toHaveBeenCalledTimes(2);
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

  it('fetches the enrollment even when the session snapshot has all display fields', async () => {
    const session = {
      id: 'session-1',
      enrollmentId: 'enrollment-1',
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

    expect(fetchEnrollmentsByIds).toHaveBeenCalledWith(['enrollment-1']);
  });

  it('hydrates each unique enrollment once and exposes the validation lookup', async () => {
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
    expect(result.enrollmentMap['enrollment-1'].id).toBe('enrollment-1');
    expect(result.sessions[0].courseName).toBe('Recovered Course');
  });
});

describe('TodaysNotifications operational session selection', () => {
  const enrollment = {
    id: 'enrollment-1',
    status: 'active',
    kidId: 'kid-1',
    kidIds: ['kid-1'],
    teacherId: 'teacher-1',
    teacherIds: ['teacher-1'],
    courseId: 'course-1',
    schedule: {
      weeklySlots: [
        { weekday: 1, time: '17:00', durationMinutes: 35 },
        { weekday: 1, time: '19:00', durationMinutes: 35 },
        { weekday: 2, time: '18:00', durationMinutes: 35 },
      ],
    },
  };
  const regular = {
    id: 'session-1',
    enrollmentId: 'enrollment-1',
    date: '2026-06-01',
    startTime: '17:00',
    durationMinutes: 35,
    status: 'scheduled',
    kidId: 'kid-1',
    kidIds: ['kid-1'],
    teacherId: 'teacher-1',
    teacherIds: ['teacher-1'],
    courseId: 'course-1',
    source: 'enrollmentSchedule',
  };

  it.each(['paused', 'cancelled', 'canceled', 'archived', 'inactive', 'completed', 'discontinued', 'expired'])(
    'excludes sessions for a %s enrollment',
    (status) => {
      const result = selectOperationalReminderSessions(
        [regular],
        { 'enrollment-1': { ...enrollment, status } },
      );
      expect(result).toEqual([]);
    },
  );

  it('respects archive flags even when status is active', () => {
    expect(selectOperationalReminderSessions(
      [regular],
      { 'enrollment-1': { ...enrollment, isArchived: true } },
    )).toEqual([]);
  });

  it.each(['cancelled', 'canceled', 'paused'])(
    'excludes a %s session while leaving the input document unchanged',
    (status) => {
      const session = { ...regular, status, cancelledReason: 'schedule_repair_old_time' };
      expect(selectOperationalReminderSessions([session], { 'enrollment-1': enrollment })).toEqual([]);
      expect(session.status).toBe(status);
    },
  );

  it('shows only the new canonical schedule after Monday 5 PM moves to Tuesday 6 PM', () => {
    const currentEnrollment = {
      ...enrollment,
      schedule: { weeklySlots: [{ weekday: 2, time: '18:00', durationMinutes: 35 }] },
    };
    const oldMonday = { ...regular, id: 'old-monday' };
    const newTuesday = { ...regular, id: 'new-tuesday', date: '2026-06-02', startTime: '18:00' };
    expect(selectOperationalReminderSessions(
      [oldMonday, newTuesday],
      { 'enrollment-1': currentEnrollment },
    ).map((session) => session.id)).toEqual(['new-tuesday']);
  });

  it('preserves legitimate makeup and approved rescheduled sessions', () => {
    const makeup = {
      ...regular,
      id: 'makeup',
      date: '2026-06-03',
      startTime: '20:00',
      isMakeup: true,
      makeupCreditId: 'credit-1',
    };
    const rescheduled = {
      ...regular,
      id: 'rescheduled',
      date: '2026-06-04',
      startTime: '20:00',
      source: 'approved_request_reschedule',
      rescheduledFromSessionId: 'original-1',
    };
    expect(selectOperationalReminderSessions(
      [makeup, rescheduled],
      { 'enrollment-1': enrollment },
    ).map((session) => session.id)).toEqual(['makeup', 'rescheduled']);
  });

  it('excludes orphan recurring sessions', () => {
    expect(selectOperationalReminderSessions([regular], {})).toEqual([]);
  });

  it('deduplicates generated copies without merging distinct valid slots', () => {
    const duplicate = { ...regular, id: 'different-firestore-id' };
    const separate = { ...regular, id: 'separate', startTime: '19:00' };
    expect(selectOperationalReminderSessions(
      [regular, duplicate, separate],
      { 'enrollment-1': enrollment },
    ).map((session) => session.id)).toEqual(['session-1', 'separate']);
  });
});
