import { describe, expect, it } from 'vitest';
import {
  buildRollingScheduleCalendarProjections,
  isRollingScheduleProjection,
  ROLLING_SCHEDULE_PROJECTION_SOURCE,
} from '../../lib/scheduling/rollingScheduleCalendarProjection';

const rollingEnrollment = (overrides: Record<string, unknown> = {}) => ({
  id: 'enr-1',
  status: 'active',
  kidId: 'kid-1',
  teacherId: 'teacher-1',
  teacherName: 'Ms A',
  courseId: 'early-phonics',
  courseName: 'Early Phonics',
  classesStartDateYmd: '2026-09-01',
  schedule: {
    schemaVersion: 1,
    deliveryMode: 'rolling',
    revision: 3,
    timezone: 'Asia/Kolkata',
    weeklySlots: [
      { weekday: 2, time: '18:00', durationMinutes: 35 },
      { weekday: 4, time: '18:00', durationMinutes: 35 },
    ],
  },
  ...overrides,
});

describe('rolling schedule display projection', () => {
  it('never projects inside the physical today-through-today+14 classSession window', () => {
    const rows = buildRollingScheduleCalendarProjections({
      enrollments: [rollingEnrollment()],
      realSessions: [],
      fromYmd: '2026-09-10',
      toYmd: '2026-09-24',
      todayYmd: '2026-09-10',
    });
    expect(rows).toEqual([]);
  });

  it('starts strictly after the 14-day physical horizon and follows Brick 1 recurrence semantics', () => {
    const rows = buildRollingScheduleCalendarProjections({
      enrollments: [rollingEnrollment()],
      realSessions: [],
      fromYmd: '2026-09-01',
      toYmd: '2026-10-02',
      todayYmd: '2026-09-10',
    });

    expect(rows.map((row) => `${row.date} ${row.startTime}`)).toEqual([
      '2026-09-29 18:00',
      '2026-10-01 18:00',
    ]);
    expect(rows.every((row) => row.isScheduleProjection && row.projectionOnly)).toBe(true);
    expect(rows.every((row) => row.source === ROLLING_SCHEDULE_PROJECTION_SOURCE)).toBe(true);
  });

  it('ignores stale ordinary real documents beyond the rolling physical horizon', () => {
    const rows = buildRollingScheduleCalendarProjections({
      enrollments: [rollingEnrollment()],
      realSessions: [{
        id: 'enr-1_20260929_1800',
        enrollmentId: 'enr-1',
        date: '2026-09-29',
        startTime: '18:00',
        status: 'cancelled',
        source: 'enrollmentScheduleReplace',
      }],
      fromYmd: '2026-09-25',
      toYmd: '2026-10-02',
      todayYmd: '2026-09-10',
    });

    expect(rows.map((row) => row.date)).toEqual(['2026-09-29', '2026-10-01']);
  });

  it('keeps explicit real schedule exceptions authoritative beyond the physical horizon', () => {
    const rows = buildRollingScheduleCalendarProjections({
      enrollments: [rollingEnrollment()],
      realSessions: [{
        id: 'manual-special',
        enrollmentId: 'enr-1',
        date: '2026-09-29',
        startTime: '18:00',
        status: 'scheduled',
        source: 'manual_one_off',
        isAdHoc: true,
      }],
      fromYmd: '2026-09-25',
      toYmd: '2026-10-02',
      todayYmd: '2026-09-10',
    });

    expect(rows.map((row) => row.date)).toEqual(['2026-10-01']);
  });

  it('does not let a nonstandard stale ordinary document suppress a long-range projection', () => {
    const rows = buildRollingScheduleCalendarProjections({
      enrollments: [rollingEnrollment()],
      realSessions: [{
        id: 'legacy-doc',
        enrollmentId: 'enr-1',
        date: '2026-09-29',
        startTime: '18:00:00',
        source: 'enrollmentSchedule',
      }],
      fromYmd: '2026-09-25',
      toYmd: '2026-09-30',
      todayYmd: '2026-09-10',
    });
    expect(rows.map((row) => row.date)).toEqual(['2026-09-29']);
  });

  it('does not speculate for paused, discontinued, inactive, or unconverted legacy enrollments', () => {
    const candidates = [
      rollingEnrollment({ status: 'paused' }),
      rollingEnrollment({ id: 'enr-2', status: 'discontinued' }),
      rollingEnrollment({ id: 'enr-3', status: 'inactive' }),
      rollingEnrollment({
        id: 'enr-4',
        schedule: { weekdays: [2], timeHHmm: '18:00', durationMins: 35, weeksAhead: 8 },
      }),
    ];
    expect(buildRollingScheduleCalendarProjections({
      enrollments: candidates,
      realSessions: [],
      fromYmd: '2026-09-25',
      toYmd: '2026-10-10',
      todayYmd: '2026-09-10',
    })).toEqual([]);
  });

  it('preserves multiple slots and classesStartDate lower bounds', () => {
    const enrollment = rollingEnrollment({
      classesStartDateYmd: '2026-10-01',
      schedule: {
        schemaVersion: 1,
        deliveryMode: 'rolling',
        revision: 1,
        timezone: 'Asia/Kolkata',
        weeklySlots: [
          { weekday: 4, time: '17:00', durationMinutes: 35 },
          { weekday: 4, time: '19:00', durationMinutes: 40 },
        ],
      },
    });
    const rows = buildRollingScheduleCalendarProjections({
      enrollments: [enrollment],
      realSessions: [],
      fromYmd: '2026-09-25',
      toYmd: '2026-10-02',
      todayYmd: '2026-09-10',
    });
    expect(rows.map((row) => [row.date, row.startTime, row.durationMinutes])).toEqual([
      ['2026-10-01', '17:00', 35],
      ['2026-10-01', '19:00', 40],
    ]);
  });

  it('creates non-actionable projection rows without a join URL or mutable real-session id', () => {
    const [row] = buildRollingScheduleCalendarProjections({
      enrollments: [rollingEnrollment({ joinUrl: 'https://teams.example/join' })],
      realSessions: [],
      fromYmd: '2026-09-29',
      toYmd: '2026-09-29',
      todayYmd: '2026-09-10',
    });
    expect(row.id).toBe('projection:enr-1_20260929_1800');
    expect(row.deterministicSessionId).toBe('enr-1_20260929_1800');
    expect(row).not.toHaveProperty('joinUrl');
    expect(row).not.toHaveProperty('attendance');
    expect(isRollingScheduleProjection(row)).toBe(true);
    expect(isRollingScheduleProjection({ ...row, isScheduleProjection: false })).toBe(false);
  });
});