import { describe, expect, it } from 'vitest';
import { buildRollingScheduleAnalyticsProjection } from '../../lib/scheduling/rollingScheduleAnalyticsProjection';

const rollingEnrollment = (overrides: Record<string, unknown> = {}) => ({
  id: 'enr-1',
  status: 'active',
  kidId: 'kid-1',
  courseId: 'course-1',
  feePerClass: 400,
  classesStartDateYmd: '2026-09-01',
  schedule: {
    schemaVersion: 1,
    deliveryMode: 'rolling',
    revision: 2,
    timezone: 'Asia/Kolkata',
    weeklySlots: [
      { weekday: 4, time: '18:00', durationMinutes: 35 },
    ],
  },
  ...overrides,
});

const build = (overrides: Partial<Parameters<typeof buildRollingScheduleAnalyticsProjection>[0]> = {}) => (
  buildRollingScheduleAnalyticsProjection({
    monthKey: '2026-10',
    todayYmd: '2026-09-10',
    enrollments: [rollingEnrollment()],
    realSessions: [],
    courses: [{ id: 'course-1', feePerClass: 400 }],
    ...overrides,
  })
);

describe('rolling schedule monthly analytics projection', () => {
  it('projects a future month from canonical enrollment recurrence without far-future classSessions', () => {
    const result = build();

    expect(result).toMatchObject({
      plannedSessions: 5,
      remainingScheduledSessions: 5,
      scheduleDrivenEnrollments: 1,
      projectedRevenue: 2000,
      missingFeeSessions: 0,
      realPlannedSessions: 0,
      recurrenceProjectedSessions: 5,
    });
    expect(result.avgProjectedRevenuePerSession).toBe(400);
  });

  it('uses actual history through today and recurrence only for the future portion of the current month', () => {
    const result = build({
      monthKey: '2026-09',
      realSessions: [
        {
          id: 'enr-1_20260903_1800',
          enrollmentId: 'enr-1',
          date: '2026-09-03',
          startTime: '18:00',
          status: 'completed',
          source: 'rolling_schedule',
          billingRateSnapshot: 450,
        },
        {
          id: 'enr-1_20260917_1800',
          enrollmentId: 'enr-1',
          date: '2026-09-17',
          startTime: '18:00',
          status: 'cancelled',
          source: 'rolling_schedule',
          billingRateSnapshot: 400,
        },
        {
          id: 'legacy-stale-row',
          enrollmentId: 'enr-1',
          date: '2026-09-29',
          startTime: '18:00',
          status: 'scheduled',
          source: 'enrollmentSchedule',
          feeAmount: 400,
        },
      ],
    });

    expect(result.plannedSessions).toBe(2);
    expect(result.realPlannedSessions).toBe(1);
    expect(result.recurrenceProjectedSessions).toBe(1);
    expect(result.remainingScheduledSessions).toBe(1);
    expect(result.projectedRevenue).toBe(850);
  });

  it('lets a persisted regular session override the matching future recurrence, including cancellation', () => {
    const result = build({
      realSessions: [
        {
          id: 'legacy-nonstandard-id',
          enrollmentId: 'enr-1',
          date: '2026-10-01',
          startTime: '18:00:00',
          status: 'cancelled',
          source: 'enrollmentScheduleReplace',
        },
        {
          id: 'enr-1_20261008_1800',
          enrollmentId: 'enr-1',
          date: '2026-10-08',
          startTime: '18:00',
          status: 'scheduled',
          source: 'rolling_schedule',
          billingRateSnapshot: 500,
        },
      ],
    });

    expect(result.plannedSessions).toBe(4);
    expect(result.realPlannedSessions).toBe(1);
    expect(result.recurrenceProjectedSessions).toBe(3);
    expect(result.remainingScheduledSessions).toBe(4);
    expect(result.projectedRevenue).toBe(1700);
  });

  it('does not speculate future recurrence for paused or terminal rolling enrollments', () => {
    expect(build({ enrollments: [rollingEnrollment({ status: 'paused' })] }).plannedSessions).toBe(0);
    expect(build({ enrollments: [rollingEnrollment({ status: 'discontinued' })] }).plannedSessions).toBe(0);
  });

  it('keeps historical months actual-session based even when the enrollment is now terminal', () => {
    const result = build({
      monthKey: '2026-08',
      enrollments: [rollingEnrollment({ status: 'discontinued', classesStartDateYmd: '2026-08-01' })],
      realSessions: [
        {
          id: 'enr-1_20260806_1800',
          enrollmentId: 'enr-1',
          date: '2026-08-06',
          startTime: '18:00',
          status: 'completed',
          source: 'rolling_schedule',
          billingRateSnapshot: 400,
        },
        {
          id: 'enr-1_20260813_1800',
          enrollmentId: 'enr-1',
          date: '2026-08-13',
          startTime: '18:00',
          status: 'no_show',
          source: 'rolling_schedule',
          billingRateSnapshot: 400,
        },
        {
          id: 'makeup-1',
          enrollmentId: 'enr-1',
          date: '2026-08-20',
          startTime: '18:00',
          status: 'completed',
          source: 'makeup',
          isMakeup: true,
          billingRateSnapshot: 400,
        },
      ],
    });

    expect(result).toMatchObject({
      plannedSessions: 1,
      realPlannedSessions: 1,
      recurrenceProjectedSessions: 0,
      projectedRevenue: 400,
    });
  });

  it('keeps unconverted legacy schedules actual-session-only during the compatibility period', () => {
    const legacyEnrollment = {
      id: 'legacy-1',
      status: 'active',
      courseId: 'course-1',
      feePerClass: 400,
      schedule: {
        weekdays: [4],
        timeHHmm: '18:00',
        durationMins: 35,
        weeksAhead: 12,
        plannedSessions: 40,
      },
    };
    const result = build({
      enrollments: [legacyEnrollment],
      realSessions: [
        {
          id: 'legacy-1_20261001_1800',
          enrollmentId: 'legacy-1',
          date: '2026-10-01',
          startTime: '18:00',
          status: 'scheduled',
          source: 'enrollmentScheduleRepair',
          feeAmount: 400,
        },
      ],
    });

    expect(result).toMatchObject({
      plannedSessions: 1,
      remainingScheduledSessions: 1,
      realPlannedSessions: 1,
      recurrenceProjectedSessions: 0,
    });
  });

  it('does not let makeup/reschedule/manual exceptions replace a regular recurrence occurrence', () => {
    const result = build({
      realSessions: [
        {
          id: 'makeup-same-time',
          enrollmentId: 'enr-1',
          date: '2026-10-01',
          startTime: '18:00',
          status: 'scheduled',
          source: 'makeup',
          isMakeup: true,
        },
        {
          id: 'manual-same-time',
          enrollmentId: 'enr-1',
          date: '2026-10-08',
          startTime: '18:00',
          status: 'scheduled',
          source: 'manual_one_off',
          isAdHoc: true,
        },
      ],
    });

    expect(result.plannedSessions).toBe(5);
    expect(result.recurrenceProjectedSessions).toBe(5);
    expect(result.realPlannedSessions).toBe(0);
  });

  it('reports missing fee configuration without inventing revenue', () => {
    const enrollment = rollingEnrollment({ feePerClass: undefined, courseId: 'no-fee-course' });
    const result = build({ enrollments: [enrollment], courses: [] });

    expect(result.plannedSessions).toBe(5);
    expect(result.projectedRevenue).toBe(0);
    expect(result.missingFeeSessions).toBe(5);
    expect(result.avgProjectedRevenuePerSession).toBe(0);
  });
});
