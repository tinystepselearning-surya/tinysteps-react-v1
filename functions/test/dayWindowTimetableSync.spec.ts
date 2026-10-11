import {describe, expect, it} from 'vitest';
import {AUTOMATIC_SESSION_CREATION_RETIRED} from '../src/scheduling/legacy14DayCutover';
import {
  dayWindowSyncWritesEnabled,
  indiaDay,
  planTodayTomorrowForEnrollment,
  syncTodayTomorrowForEnrollment,
} from '../src/scheduling/dayWindowTimetableSync';

const enrollment = {
  status: 'active', kidId: 'kid-a', kidIds: ['kid-a'],
  teacherId: 'teacher-a', courseId: 'phonics', currency: 'INR',
  feePerClass: 400, teacherPayPerSession: 175,
  classesStartDateYmd: '2026-10-12',
  schedule: {
    timezone: 'Asia/Kolkata', revision: 4,
    weeklySlots: [
      {weekday: 1, time: '05:00', durationMinutes: 35},
      {weekday: 2, time: '06:00', durationMinutes: 35},
    ],
  },
};

describe('permanent retirement of automatic Today/Tomorrow session writers', () => {
  it('cannot be reactivated by stale Cloud Run flags', () => {
    expect(AUTOMATIC_SESSION_CREATION_RETIRED).toBe(true);
    expect(dayWindowSyncWritesEnabled({})).toBe(false);
    expect(dayWindowSyncWritesEnabled({TIMETABLE_DAY_SYNC_ENABLED: 'false'})).toBe(false);
    expect(dayWindowSyncWritesEnabled({TIMETABLE_DAY_SYNC_ENABLED: 'true'})).toBe(false);
  });

  it('performs zero reads and zero writes even when callers explicitly opt in', async () => {
    let reads = 0;
    let writes = 0;
    const db = {
      collection: () => {reads++; throw new Error('Retired worker touched Firestore');},
      runTransaction: () => {writes++; throw new Error('Retired worker opened transaction');},
    };
    for (const enabled of [true, false, undefined]) {
      const result = await syncTodayTomorrowForEnrollment({
        db: db as any, enrollmentId: 'enrollment-a',
        actorId: 'admin', now: new Date('2026-10-11T18:31:00.000Z'), enabled,
      });
      expect(result).toMatchObject({
        state: 'disabled', created: 0, updated: 0, removed: 0, preserved: 0,
      });
      expect(result.targetDays).toEqual(['2026-10-12', '2026-10-13']);
    }
    expect(reads).toBe(0);
    expect(writes).toBe(0);
  });

  it('keeps the pure timetable projection available without session persistence', () => {
    const now = new Date('2026-10-11T18:31:00Z');
    expect(indiaDay(now)).toBe('2026-10-12');
    const projected = planTodayTomorrowForEnrollment({
      enrollmentId: 'enrollment-a', enrollment,
      todayYmd: '2026-10-12', nowMs: now.getTime(), activeChild: true,
    });
    expect(projected.map(row => row.date)).toEqual(['2026-10-12', '2026-10-13']);
    expect(projected.every(row => row.startAtUtcMs > now.getTime())).toBe(true);
  });
});
