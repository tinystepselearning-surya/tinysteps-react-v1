import { describe, expect, it } from 'vitest';
import {
  ROLLING_SCHEDULE_TIME_ZONE,
  enumerateRollingScheduleOccurrences,
  getRollingScheduleOccurrenceKey,
  getRollingScheduleSessionId,
  normalizeRollingScheduleSlots,
} from '../../lib/scheduling/rollingScheduleRecurrence';

describe('rolling schedule recurrence engine', () => {
  it('normalizes and sorts canonical weekly slots without reading or writing external state', () => {
    expect(normalizeRollingScheduleSlots({
      timezone: ROLLING_SCHEDULE_TIME_ZONE,
      weeklySlots: [
        { weekday: 6, time: '04:00', durationMinutes: 35 },
        { weekday: 2, time: '05:15', durationMinutes: 40 },
        { weekday: 2, time: '04:00', durationMinutes: 35 },
      ],
    })).toEqual([
      { weekday: 2, time: '04:00', hour: 4, minute: 0, durationMinutes: 35 },
      { weekday: 2, time: '05:15', hour: 5, minute: 15, durationMinutes: 40 },
      { weekday: 6, time: '04:00', hour: 4, minute: 0, durationMinutes: 35 },
    ]);
  });

  it('keeps compatibility with the legacy weekdays + timeHHmm schedule shape', () => {
    expect(normalizeRollingScheduleSlots({
      weekdays: [4, 2, 4, 6],
      timeHHmm: '04:00',
      durationMins: 35,
    })).toEqual([
      { weekday: 2, time: '04:00', hour: 4, minute: 0, durationMinutes: 35 },
      { weekday: 4, time: '04:00', hour: 4, minute: 0, durationMinutes: 35 },
      { weekday: 6, time: '04:00', hour: 4, minute: 0, durationMinutes: 35 },
    ]);
  });

  it('enumerates every recurrence occurrence in an inclusive date range in IST', () => {
    const rows = enumerateRollingScheduleOccurrences({
      enrollmentId: 'enr-123',
      schedule: {
        timezone: ROLLING_SCHEDULE_TIME_ZONE,
        weeklySlots: [
          { weekday: 2, time: '04:00', durationMinutes: 35 },
          { weekday: 4, time: '04:00', durationMinutes: 35 },
          { weekday: 6, time: '04:00', durationMinutes: 35 },
        ],
      },
      fromYmd: '2026-09-10',
      toYmd: '2026-09-24',
      classesStartDateYmd: '2026-09-01',
    });

    expect(rows.map((row) => `${row.date} ${row.startTime}`)).toEqual([
      '2026-09-10 04:00',
      '2026-09-12 04:00',
      '2026-09-15 04:00',
      '2026-09-17 04:00',
      '2026-09-19 04:00',
      '2026-09-22 04:00',
      '2026-09-24 04:00',
    ]);
    expect(rows[0]).toMatchObject({
      date: '2026-09-10',
      weekday: 4,
      startTime: '04:00',
      endTime: '04:35',
      durationMinutes: 35,
      occurrenceKey: '2026-09-10|04:00|35',
      sessionId: 'enr-123_20260910_0400',
    });
    expect(rows[0].startAtUtcMs).toBe(Date.parse('2026-09-09T22:30:00.000Z'));
    expect(rows[0].endAtUtcMs).toBe(Date.parse('2026-09-09T23:05:00.000Z'));
  });

  it('never projects before classesStartDateYmd', () => {
    const rows = enumerateRollingScheduleOccurrences({
      schedule: {
        weeklySlots: [
          { weekday: 2, time: '18:30', durationMinutes: 35 },
          { weekday: 4, time: '18:30', durationMinutes: 35 },
        ],
      },
      fromYmd: '2026-09-01',
      toYmd: '2026-09-20',
      classesStartDateYmd: '2026-09-10',
    });

    expect(rows.map((row) => row.date)).toEqual([
      '2026-09-10',
      '2026-09-15',
      '2026-09-17',
    ]);
  });

  it('returns an empty projection when the class start is after the requested range', () => {
    expect(enumerateRollingScheduleOccurrences({
      schedule: {
        weeklySlots: [{ weekday: 1, time: '17:00', durationMinutes: 35 }],
      },
      fromYmd: '2026-09-01',
      toYmd: '2026-09-10',
      classesStartDateYmd: '2026-09-11',
    })).toEqual([]);
  });

  it('supports multiple distinct times on the same weekday and sorts by actual start time', () => {
    const rows = enumerateRollingScheduleOccurrences({
      schedule: {
        weeklySlots: [
          { weekday: 4, time: '19:00', durationMinutes: 40 },
          { weekday: 4, time: '06:30', durationMinutes: 35 },
        ],
      },
      fromYmd: '2026-09-10',
      toYmd: '2026-09-10',
    });

    expect(rows.map((row) => `${row.startTime}-${row.endTime}`)).toEqual([
      '06:30-07:05',
      '19:00-19:40',
    ]);
  });

  it('handles month, leap-day, and year boundaries with calendar-safe UTC date iteration', () => {
    const leapRows = enumerateRollingScheduleOccurrences({
      schedule: {
        weeklySlots: [{ weekday: 4, time: '12:00', durationMinutes: 35 }],
      },
      fromYmd: '2028-02-27',
      toYmd: '2028-03-03',
    });
    expect(leapRows.map((row) => row.date)).toEqual(['2028-03-02']);

    const yearRows = enumerateRollingScheduleOccurrences({
      schedule: {
        weeklySlots: [{ weekday: 5, time: '12:00', durationMinutes: 35 }],
      },
      fromYmd: '2026-12-30',
      toYmd: '2027-01-03',
    });
    expect(yearRows.map((row) => row.date)).toEqual(['2027-01-01']);
  });

  it('formats end times safely when a class crosses midnight', () => {
    const [row] = enumerateRollingScheduleOccurrences({
      schedule: {
        weeklySlots: [{ weekday: 4, time: '23:50', durationMinutes: 35 }],
      },
      fromYmd: '2026-09-10',
      toYmd: '2026-09-10',
    });

    expect(row.endTime).toBe('00:25');
    expect(row.startAtUtcMs).toBe(Date.parse('2026-09-10T18:20:00.000Z'));
    expect(row.endAtUtcMs).toBe(Date.parse('2026-09-10T18:55:00.000Z'));
  });

  it('builds stable deterministic occurrence and session identities', () => {
    expect(getRollingScheduleOccurrenceKey('2026-09-10', '04:00', 35))
      .toBe('2026-09-10|04:00|35');
    expect(getRollingScheduleSessionId('enrollment-A', '2026-09-10', '04:00'))
      .toBe('enrollment-A_20260910_0400');
  });

  it('does not contain a planned-session or weeks-ahead stopping rule', () => {
    const rows = enumerateRollingScheduleOccurrences({
      schedule: {
        weeklySlots: [{ weekday: 1, time: '17:00', durationMinutes: 35 }],
      },
      fromYmd: '2026-01-01',
      toYmd: '2026-12-31',
    });

    expect(rows).toHaveLength(52);
    expect(rows[0].date).toBe('2026-01-05');
    expect(rows[rows.length - 1]?.date).toBe('2026-12-28');
  });

  it('rejects duplicate deterministic occurrence identities before materialization', () => {
    expect(() => normalizeRollingScheduleSlots({
      weeklySlots: [
        { weekday: 2, time: '04:00', durationMinutes: 35 },
        { weekday: 2, time: '04:00', durationMinutes: 40 },
      ],
    })).toThrow('same weekday and start time');
  });

  it('rejects invalid dates, inverted ranges, invalid times, and unsupported timezones', () => {
    expect(() => enumerateRollingScheduleOccurrences({
      schedule: { weeklySlots: [{ weekday: 2, time: '04:00', durationMinutes: 35 }] },
      fromYmd: '2026-02-30',
      toYmd: '2026-03-02',
    })).toThrow('valid calendar date');

    expect(() => enumerateRollingScheduleOccurrences({
      schedule: { weeklySlots: [{ weekday: 2, time: '04:00', durationMinutes: 35 }] },
      fromYmd: '2026-09-11',
      toYmd: '2026-09-10',
    })).toThrow('toYmd must be on or after fromYmd');

    expect(() => normalizeRollingScheduleSlots({
      weeklySlots: [{ weekday: 2, time: '25:00', durationMinutes: 35 }],
    })).toThrow('HH:MM');

    expect(() => enumerateRollingScheduleOccurrences({
      schedule: {
        timezone: 'America/New_York',
        weeklySlots: [{ weekday: 2, time: '04:00', durationMinutes: 35 }],
      },
      fromYmd: '2026-09-10',
      toYmd: '2026-09-24',
    })).toThrow('Unsupported rolling schedule timezone');
  });
});
