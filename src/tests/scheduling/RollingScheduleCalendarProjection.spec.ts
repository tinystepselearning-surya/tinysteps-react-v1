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
  it('projects from today without creating physical class sessions', () => {
    const rows = buildRollingScheduleCalendarProjections({
      enrollments: [rollingEnrollment()],
      realSessions: [],
      fromYmd: '2026-09-10',
      toYmd: '2026-09-24',
      todayYmd: '2026-09-10',
    });
    expect(rows.map((row) => row.date)).toEqual(['2026-09-10','2026-09-15','2026-09-17','2026-09-22','2026-09-24']);
  });

  it('starts at today and follows Brick 1 recurrence and follows Brick 1 recurrence semantics', () => {
    const rows = buildRollingScheduleCalendarProjections({
      enrollments: [rollingEnrollment()],
      realSessions: [],
      fromYmd: '2026-09-01',
      toYmd: '2026-10-02',
      todayYmd: '2026-09-10',
    });

    expect(rows.map((row) => `${row.date} ${row.startTime}`)).toEqual([
      '2026-09-10 18:00',
      '2026-09-15 18:00',
      '2026-09-17 18:00',
      '2026-09-22 18:00',
      '2026-09-24 18:00',
      '2026-09-29 18:00',
      '2026-10-01 18:00',
    ]);
    expect(rows.every((row) => row.isScheduleProjection && row.projectionOnly)).toBe(true);
    expect(rows.every((row) => row.source === ROLLING_SCHEDULE_PROJECTION_SOURCE)).toBe(true);
  });

  it('never re-projects any persisted cancellation or attendance record', () => {
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

    expect(rows.map((row) => row.date)).toEqual(['2026-10-01']);
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

  it('normalizes real session identities to prevent duplicate virtual occurrences', () => {
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
    expect(rows).toEqual([]);
  });

  it('does not speculate for paused, discontinued or inactive enrollments', () => {
    const candidates = [
      rollingEnrollment({ status: 'paused' }),
      rollingEnrollment({ id: 'enr-2', status: 'discontinued' }),
      rollingEnrollment({ id: 'enr-3', status: 'inactive' }),
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

  it('supports legacy weekly slots and keeps Today/Tomorrow visible after reset', () => {
    const legacy = rollingEnrollment({
      schedule: {weekdays:[1,2],timeHHmm:'17:00',durationMins:35},
    });
    const rows=buildRollingScheduleCalendarProjections({
      enrollments:[legacy],realSessions:[],
      fromYmd:'2026-10-12',toYmd:'2026-10-13',todayYmd:'2026-10-12',
    });
    expect(rows.map(r=>r.date)).toEqual(['2026-10-12','2026-10-13']);
    expect(rows.map(r=>r.startTime)).toEqual(['17:00','17:00']);
  });

  it('exposes enrollment Teams link for joining without writing a physical session', () => {
    const [row] = buildRollingScheduleCalendarProjections({
      enrollments: [rollingEnrollment({ joinUrl: 'https://teams.example/join' })],
      realSessions: [],
      fromYmd: '2026-09-29',
      toYmd: '2026-09-29',
      todayYmd: '2026-09-10',
    });
    expect(row.id).toBe('projection:enr-1_20260929_1800');
    expect(row.deterministicSessionId).toBe('enr-1_20260929_1800');
    expect(row.joinUrl).toBe('https://teams.example/join');
    expect(row).not.toHaveProperty('attendance');
    expect(isRollingScheduleProjection(row)).toBe(true);
    expect(isRollingScheduleProjection({ ...row, isScheduleProjection: false })).toBe(false);
  });
});