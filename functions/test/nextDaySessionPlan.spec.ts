import {describe, expect, it} from 'vitest';
import {buildDailySessionRunPlan, buildNextDaySessionPlan, dailySessionTargetDates, indiaTodayYmd, nextDayYmd} from '../src/scheduling/nextDaySessionPlan';

const enrolled = (overrides: Record<string, unknown> = {}) => ({
  id: 'enrollment-a',
  data: {
    status: 'active', kidId: 'child-a', teacherId: 'teacher-a', courseId: 'phonics',
    classesStartDateYmd: '2026-09-01',
    schedule: {timezone: 'Asia/Kolkata', weeklySlots: [{weekday: 1, time: '05:00', durationMinutes: 35}]},
    ...overrides,
  },
});
const plan = (rows = [enrolled()], todayYmd = '2026-10-11', targetYmd?: string) =>
  buildNextDaySessionPlan({todayYmd, targetYmd, enrollments: rows, activeKidIds: new Set(['child-a'])});

describe('Tiny Steps daily session plan', () => {
  it('resolves tomorrow as an IST calendar day, across month rollover', () => {
    expect(nextDayYmd('2026-10-11')).toBe('2026-10-12');
    expect(nextDayYmd('2026-10-31')).toBe('2026-11-01');
    expect(indiaTodayYmd(new Date('2026-10-11T19:00:00Z'))).toBe('2026-10-12');
    expect(() => nextDayYmd('2026-02-30')).toThrow();
  });
  it('creates one deterministic class with correct UTC and local start/end', () => {
    const first = plan();
    expect(first.issues).toEqual([]);
    expect(first.occurrences).toHaveLength(1);
    expect(first.occurrences[0]).toMatchObject({
      date: '2026-10-12', startTime: '05:00', endTime: '05:35',
      sessionId: 'enrollment-a_20261012_0500', teacherId: 'teacher-a',
    });
    expect(new Date(first.occurrences[0].startAtUtcMs).toISOString()).toBe('2026-10-11T23:30:00.000Z');
    expect(plan().occurrences).toEqual(first.occurrences);
  });
  it('allows only the Oct 12 bootstrap exception to tomorrow-only', () => {
    const first = plan([enrolled()], '2026-10-12', '2026-10-12');
    expect(first.targetYmd).toBe('2026-10-12');
    expect(first.occurrences).toHaveLength(1);
    expect(plan([enrolled()], '2026-10-12').targetYmd).toBe('2026-10-13');
    expect(() => plan([enrolled()], '2026-10-13', '2026-10-13')).toThrow();
    expect(() => plan([enrolled()], '2026-10-12', '2026-10-14')).toThrow();
  });
  it('on Oct 12 creates exactly Oct 12 and 13, sharing input, never Oct 14+', () => {
    const row = enrolled({
      schedule: {timezone: 'Asia/Kolkata', weeklySlots: [
        {weekday: 1, time: '05:00', durationMinutes: 35},
        {weekday: 2, time: '05:00', durationMinutes: 35},
        {weekday: 3, time: '05:00', durationMinutes: 35},
      ]},
    });
    const input = {enrollments: [row], activeKidIds: new Set(['child-a'])};
    const launch = buildDailySessionRunPlan({...input, todayYmd: '2026-10-12'});
    expect(launch.targetDays).toEqual(['2026-10-12', '2026-10-13']);
    expect(launch.plans.map((p) => p.targetYmd)).toEqual(launch.targetDays);
    expect(launch.plans.flatMap((p) => p.occurrences.map((s) => s.date)))
      .toEqual(['2026-10-12', '2026-10-13']);
    expect(launch.plans.flatMap((p) => p.occurrences).every((s) => s.date <= '2026-10-13')).toBe(true);
    const nextRun = buildDailySessionRunPlan({...input, todayYmd: '2026-10-13'});
    expect(nextRun.targetDays).toEqual(['2026-10-14']);
    expect(nextRun.plans.flatMap((p) => p.occurrences.map((s) => s.date))
      .toEqual(['2026-10-14']);
    expect(dailySessionTargetDates('2026-10-14')).toEqual(['2026-10-15']);
    expect(() => dailySessionTargetDates('2026-10-11')).toThrow('starts on 2026-10-12');
  });
  it('skips paused and archived enrollments, and inactive children', () => {
    expect(plan([enrolled({status: 'paused'})]).occurrences).toHaveLength(0);
    expect(plan([enrolled({archived: true})]).occurrences).toHaveLength(0);
    const noKid = buildNextDaySessionPlan({
      todayYmd: '2026-10-11', enrollments: [enrolled()], activeKidIds: new Set(),
    });
    expect(noKid.occurrences).toHaveLength(0);
    expect(noKid.issues[0].reason).toBe('student_not_active');
  });
  it('respects classes start date and legacy recurrence formats', () => {
    expect(plan([enrolled({classesStartDateYmd: '2026-10-13'})]).occurrences).toHaveLength(0);
    const legacy = plan([enrolled({schedule: {weekdays: [1, 3], timeHHmm: '06:00', durationMins: 40}})]);
    expect(legacy.occurrences).toHaveLength(1);
    expect(legacy.occurrences[0]).toMatchObject({date: '2026-10-12', startTime: '06:00', endTime: '06:40'});
  });
  it('prevents identical student/date/time across active enrollments', () => {
    const two = [enrolled(), {...enrolled(), id: 'enrollment-b'}];
    const result = plan(two);
    expect(result.occurrences).toHaveLength(1);
    expect(result.issues).toContainEqual({enrollmentId: 'enrollment-b', reason: 'duplicate_student_time'});
  });
  it('flags invalid recurrence instead of producing sessions', () => {
    const result = plan([enrolled({
      schedule: {weeklySlots: [{weekday: 1, time: '25:00', durationMinutes: 35}]},
    })]);
    expect(result.occurrences).toHaveLength(0);
    expect(result.issues[0].reason).toBe('invalid_recurrence');
  });
});
