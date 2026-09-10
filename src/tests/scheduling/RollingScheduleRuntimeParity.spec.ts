import {describe, expect, it} from 'vitest';
import {enumerateRollingScheduleOccurrences} from '../../lib/scheduling/rollingScheduleRecurrence';
import {buildRollingMaterializationPlan} from '../../../functions/src/scheduling/rollingScheduleMaterializer';

const backendEnrollment = (schedule: Record<string, unknown>): Record<string, unknown> => ({
  status: 'active',
  kidId: 'kid-1',
  teacherId: 'teacher-1',
  feePerClass: 400,
  teacherPayPerSession: 175,
  currency: 'INR',
  classesStartDateYmd: '2026-09-01',
  schedule,
});

describe('rolling schedule cross-runtime parity', () => {
  it('keeps Brick 1 projection and Brick 3 materialization occurrence identity identical', () => {
    const schedule = {
      timezone: 'Asia/Kolkata',
      revision: 4,
      weeklySlots: [
        {weekday: 4, time: '23:50', durationMinutes: 35},
        {weekday: 2, time: '05:15', durationMinutes: 40},
        {weekday: 6, time: '04:00', durationMinutes: 35},
      ],
    };
    const projected = enumerateRollingScheduleOccurrences({
      enrollmentId: 'enrollment-1',
      schedule,
      fromYmd: '2026-09-10',
      toYmd: '2026-09-24',
      classesStartDateYmd: '2026-09-01',
    });
    const materialized = buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment: backendEnrollment(schedule),
      anchorYmd: '2026-09-10',
    }).occurrences;

    expect(materialized.map((row) => ({
      date: row.date,
      weekday: row.weekday,
      startTime: row.startTime,
      endTime: row.endTime,
      durationMinutes: row.durationMinutes,
      startAtUtcMs: row.startAtUtcMs,
      endAtUtcMs: row.endAtUtcMs,
      occurrenceKey: row.occurrenceKey,
      sessionId: row.sessionId,
    }))).toEqual(projected);
  });

  it('keeps legacy schedule compatibility identical while ignoring finite stop fields', () => {
    const schedule = {
      weekdays: [1, 3, 5],
      timeHHmm: '04:00',
      durationMins: 35,
      weeksAhead: 1,
      plannedSessions: 1,
      endDateYmd: '2026-09-12',
    };
    const projected = enumerateRollingScheduleOccurrences({
      enrollmentId: 'enrollment-legacy',
      schedule,
      fromYmd: '2026-09-10',
      toYmd: '2026-09-24',
      classesStartDateYmd: '2026-09-01',
    });
    const materialized = buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-legacy',
      enrollment: backendEnrollment(schedule),
      anchorYmd: '2026-09-10',
    }).occurrences;

    expect(materialized.map((row) => `${row.date}|${row.startTime}|${row.durationMinutes}|${row.sessionId}`))
      .toEqual(projected.map((row) => `${row.date}|${row.startTime}|${row.durationMinutes}|${row.sessionId}`));
  });
});
