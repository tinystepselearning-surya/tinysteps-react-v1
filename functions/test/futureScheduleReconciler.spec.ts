import {describe, expect, it} from 'vitest';
import {
  FUTURE_SCHEDULE_WINDOW_DAYS,
  assessFutureScheduleEnrollmentSource,
  buildFutureScheduleWindow,
  buildFutureScheduleWindowPlan,
  resolveFutureScheduleEligibility,
  resolveFutureScheduleTodayYmd,
} from '../src/scheduling/futureScheduleReconciler';

function enrollment(args: {
  status?: string;
  archived?: boolean;
  classesStartDateYmd?: string;
  weeklySlots?: Array<{weekday: number; time: string; durationMinutes: number}>;
} = {}): Record<string, unknown> {
  return {
    status: args.status ?? 'active',
    archived: args.archived ?? false,
    kidId: 'kid-1',
    kidIds: ['kid-1'],
    studentId: 'kid-1',
    childId: 'kid-1',
    teacherId: 'teacher-1',
    parentId: 'parent-1',
    parentIds: ['parent-1'],
    courseId: 'course-1',
    feePerClass: 400,
    currency: 'INR',
    classesStartDateYmd: args.classesStartDateYmd || '2026-09-01',
    schedule: {
      schemaVersion: 1,
      deliveryMode: 'rolling',
      timezone: 'Asia/Kolkata',
      revision: 7,
      weeklySlots: args.weeklySlots || [
        {weekday: 1, time: '17:30', durationMinutes: 35},
        {weekday: 3, time: '17:30', durationMinutes: 35},
        {weekday: 5, time: '17:30', durationMinutes: 35},
      ],
    },
    scheduleMaterialization: {
      schemaVersion: 1,
      horizonDays: 14,
      scheduleRevision: 7,
      materializedThroughYmd: '2026-09-19',
      nextOccurrenceYmd: null,
      nextMaterializationDueYmd: null,
    },
  };
}

describe('Brick 1 future schedule reconciler contract', () => {
  it('defines exactly fourteen mutable dates beginning tomorrow', () => {
    expect(FUTURE_SCHEDULE_WINDOW_DAYS).toBe(14);
    expect(buildFutureScheduleWindow('2026-09-19')).toEqual({
      todayYmd: '2026-09-19',
      managedFromYmd: '2026-09-20',
      managedThroughYmd: '2026-10-03',
    });
  });

  it('resolves the business day in Asia/Kolkata rather than UTC', () => {
    expect(resolveFutureScheduleTodayYmd(
      new Date('2026-09-19T18:29:59.000Z'),
    )).toBe('2026-09-19');
    expect(resolveFutureScheduleTodayYmd(
      new Date('2026-09-19T18:30:00.000Z'),
    )).toBe('2026-09-20');
  });

  it('handles month, year, and leap-day boundaries without widening the window', () => {
    expect(buildFutureScheduleWindow('2026-12-31')).toEqual({
      todayYmd: '2026-12-31',
      managedFromYmd: '2027-01-01',
      managedThroughYmd: '2027-01-14',
    });
    expect(buildFutureScheduleWindow('2028-02-28')).toEqual({
      todayYmd: '2028-02-28',
      managedFromYmd: '2028-02-29',
      managedThroughYmd: '2028-03-13',
    });
  });

  it('never returns today or today + 15 from the planned occurrence set', () => {
    const plan = buildFutureScheduleWindowPlan({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment({
        weeklySlots: [
          {weekday: 0, time: '10:00', durationMinutes: 35},
          {weekday: 1, time: '10:00', durationMinutes: 35},
          {weekday: 2, time: '10:00', durationMinutes: 35},
          {weekday: 3, time: '10:00', durationMinutes: 35},
          {weekday: 4, time: '10:00', durationMinutes: 35},
          {weekday: 5, time: '10:00', durationMinutes: 35},
          {weekday: 6, time: '10:00', durationMinutes: 35},
        ],
      }),
      todayYmd: '2026-09-19',
    });

    expect(plan.managedFromYmd).toBe('2026-09-20');
    expect(plan.managedThroughYmd).toBe('2026-10-03');
    expect(plan.occurrences).toHaveLength(14);
    expect(plan.occurrences[0].date).toBe('2026-09-20');
    expect(plan.occurrences.at(-1)?.date).toBe('2026-10-03');
    expect(plan.occurrences.some((row) => row.date === '2026-09-19')).toBe(false);
    expect(plan.occurrences.some((row) => row.date === '2026-10-04')).toBe(false);
  });

  it('generates the configured M/W/F recurrence only inside the managed window', () => {
    const plan = buildFutureScheduleWindowPlan({
      enrollmentId: 'enrollment-mwf',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
    });

    expect(plan.occurrences.map((row) => row.date)).toEqual([
      '2026-09-21',
      '2026-09-23',
      '2026-09-25',
      '2026-09-28',
      '2026-09-30',
      '2026-10-02',
    ]);
    expect(plan.occurrences.map((row) => row.sessionId)).toEqual([
      'enrollment-mwf_20260921_1730',
      'enrollment-mwf_20260923_1730',
      'enrollment-mwf_20260925_1730',
      'enrollment-mwf_20260928_1730',
      'enrollment-mwf_20260930_1730',
      'enrollment-mwf_20261002_1730',
    ]);
  });

  it('supports a Tue/Thu/Sat recurrence without special-case logic', () => {
    const plan = buildFutureScheduleWindowPlan({
      enrollmentId: 'enrollment-tts',
      enrollment: enrollment({
        weeklySlots: [
          {weekday: 2, time: '18:00', durationMinutes: 40},
          {weekday: 4, time: '18:00', durationMinutes: 40},
          {weekday: 6, time: '18:00', durationMinutes: 40},
        ],
      }),
      todayYmd: '2026-09-19',
    });

    expect(plan.occurrences.map((row) => row.date)).toEqual([
      '2026-09-22',
      '2026-09-24',
      '2026-09-26',
      '2026-09-29',
      '2026-10-01',
      '2026-10-03',
    ]);
  });

  it('defaults an active enrollment with no start metadata to the tomorrow-forward recurrence window', () => {
    const row = enrollment();
    delete row.classesStartDateYmd;

    const plan = buildFutureScheduleWindowPlan({
      enrollmentId: 'enrollment-no-start',
      enrollment: row,
      todayYmd: '2026-09-19',
    });

    expect(plan.occurrences.map((occurrence) => occurrence.date)).toEqual([
      '2026-09-21',
      '2026-09-23',
      '2026-09-25',
      '2026-09-28',
      '2026-09-30',
      '2026-10-02',
    ]);
  });

  it('respects a classes-start boundary later than tomorrow', () => {
    const plan = buildFutureScheduleWindowPlan({
      enrollmentId: 'enrollment-later',
      enrollment: enrollment({classesStartDateYmd: '2026-09-25'}),
      todayYmd: '2026-09-19',
    });

    expect(plan.occurrences.map((row) => row.date)).toEqual([
      '2026-09-25',
      '2026-09-28',
      '2026-09-30',
      '2026-10-02',
    ]);
  });

  it('classifies supported operational aliases locally without changing global status helpers', () => {
    [
      '',
      'active',
      'trial',
      'enrolled',
      'current',
      'ongoing',
      'pending_teacher',
      'pending_payment',
      'pending_lp',
    ].forEach((status) => {
      expect(resolveFutureScheduleEligibility(enrollment({status}))).toEqual({
        eligible: true,
        normalizedStatus: status,
      });
    });
  });

  it('reports operational but incomplete enrollments instead of silently skipping them', () => {
    const pendingTeacher = enrollment({status: 'pending_teacher'});
    delete pendingTeacher.teacherId;
    expect(assessFutureScheduleEnrollmentSource(pendingTeacher)).toEqual({
      ready: false,
      normalizedStatus: 'pending_teacher',
      issues: ['missing_or_ambiguous_teacher'],
      warnings: [],
    });

    const staleLegacyChildAlias = enrollment();
    staleLegacyChildAlias.studentId = 'legacy-stale-child';
    expect(assessFutureScheduleEnrollmentSource(staleLegacyChildAlias)).toEqual({
      ready: true,
      normalizedStatus: 'active',
      issues: [],
      warnings: [],
    });

    const ambiguousLegacyChild = enrollment();
    delete ambiguousLegacyChild.kidId;
    ambiguousLegacyChild.kidIds = [];
    ambiguousLegacyChild.studentId = 'legacy-child-a';
    ambiguousLegacyChild.childId = 'legacy-child-b';
    expect(assessFutureScheduleEnrollmentSource(ambiguousLegacyChild)).toEqual({
      ready: false,
      normalizedStatus: 'active',
      issues: ['ambiguous_legacy_child_identity'],
      warnings: [],
    });

    const missingParent = enrollment();
    delete missingParent.parentId;
    delete missingParent.parentIds;
    expect(assessFutureScheduleEnrollmentSource(missingParent)).toEqual({
      ready: true,
      normalizedStatus: 'active',
      issues: [],
      warnings: ['missing_parent_identity'],
    });

    const missingCourse = enrollment();
    delete missingCourse.courseId;
    expect(assessFutureScheduleEnrollmentSource(missingCourse)).toEqual({
      ready: true,
      normalizedStatus: 'active',
      issues: [],
      warnings: ['missing_course_identity'],
    });

    const missingStart = enrollment();
    delete missingStart.classesStartDateYmd;
    expect(assessFutureScheduleEnrollmentSource(missingStart)).toEqual({
      ready: true,
      normalizedStatus: 'active',
      issues: [],
      warnings: ['missing_classes_start_date'],
    });

    const invalidStart = enrollment();
    invalidStart.classesStartDateYmd = '2026-02-31';
    expect(assessFutureScheduleEnrollmentSource(invalidStart)).toEqual({
      ready: false,
      normalizedStatus: 'active',
      issues: ['invalid_classes_start_date'],
      warnings: [],
    });

    const missingBilling = enrollment();
    delete missingBilling.feePerClass;
    expect(assessFutureScheduleEnrollmentSource(missingBilling)).toEqual({
      ready: true,
      normalizedStatus: 'active',
      issues: [],
      warnings: ['missing_billing_rate'],
    });
  });

  it('rejects paused, terminal, unknown, and archived enrollments', () => {
    ['paused', 'completed', 'discontinued', 'expired', 'cancelled', 'inactive', 'pending_lp_assignment', 'mystery']
      .forEach((status) => {
        expect(resolveFutureScheduleEligibility(enrollment({status}))).toEqual({
          eligible: false,
          normalizedStatus: status,
          reason: 'non_operational_status',
        });
      });

    expect(resolveFutureScheduleEligibility(enrollment({
      status: 'active',
      archived: true,
    }))).toEqual({
      eligible: false,
      normalizedStatus: 'active',
      reason: 'archived',
    });
  });

  it('supports legacy recurrence using exact independent slots and ignores finite-plan caps while active', () => {
    const legacySchedule = enrollment();
    legacySchedule.schedule = {
      timezone: 'Asia/Kolkata',
      weeklySlots: [
        {weekday: 1, time: '17:00', durationMinutes: 35},
        {weekday: 1, time: '17:35', durationMinutes: 35},
        {weekday: 2, time: '19:00', durationMinutes: 35},
        {weekday: 4, time: '18:15', durationMinutes: 35},
      ],
      plannedSessions: 1,
      weeksAhead: 1,
      endDateYmd: '2026-09-20',
    };

    expect(assessFutureScheduleEnrollmentSource(legacySchedule)).toEqual({
      ready: true,
      normalizedStatus: 'active',
      issues: [],
      warnings: ['legacy_schedule_format'],
    });

    const plan = buildFutureScheduleWindowPlan({
      enrollmentId: 'legacy-schedule',
      enrollment: legacySchedule,
      todayYmd: '2026-09-19',
    });

    expect(plan.occurrences.map((row) => [row.date, row.startTime, row.durationMinutes])).toEqual([
      ['2026-09-21', '17:00', 35],
      ['2026-09-21', '17:35', 35],
      ['2026-09-22', '19:00', 35],
      ['2026-09-24', '18:15', 35],
      ['2026-09-28', '17:00', 35],
      ['2026-09-28', '17:35', 35],
      ['2026-09-29', '19:00', 35],
      ['2026-10-01', '18:15', 35],
    ]);
  });

  it('accepts the legacy weekdays/time alias shape when it has a valid recurring schedule', () => {
    const legacySchedule = enrollment();
    legacySchedule.schedule = {
      weekdays: [1, 3, 5],
      timeHHmm: '17:30',
      durationMins: 35,
      plannedSessions: 1,
    };

    expect(assessFutureScheduleEnrollmentSource(legacySchedule)).toEqual({
      ready: true,
      normalizedStatus: 'active',
      issues: [],
      warnings: ['legacy_schedule_format'],
    });
    expect(buildFutureScheduleWindowPlan({
      enrollmentId: 'legacy-alias-schedule',
      enrollment: legacySchedule,
      todayYmd: '2026-09-19',
    }).occurrences).toHaveLength(6);
  });

  it('fails closed when required source configuration is invalid', () => {
    const brokenTeacher = enrollment();
    delete brokenTeacher.teacherId;
    expect(() => buildFutureScheduleWindowPlan({
      enrollmentId: 'broken-teacher',
      enrollment: brokenTeacher,
      todayYmd: '2026-09-19',
    })).toThrow(/missing_or_ambiguous_teacher/i);

    const brokenSchedule = enrollment();
    brokenSchedule.schedule = {
      schemaVersion: 1,
      deliveryMode: 'rolling',
      timezone: 'Asia/Kolkata',
      revision: 7,
      weeklySlots: [],
    };
    expect(() => buildFutureScheduleWindowPlan({
      enrollmentId: 'broken-schedule',
      enrollment: brokenSchedule,
      todayYmd: '2026-09-19',
    })).toThrow(/invalid_recurring_schedule/i);
  });

  it('keeps the future-window contract independent of persisted materialization pointers', () => {
    const row = enrollment();
    row.scheduleMaterialization = {
      schemaVersion: 1,
      horizonDays: 14,
      scheduleRevision: 999,
      materializedThroughYmd: '1999-01-01',
      nextOccurrenceYmd: '2099-01-01',
      nextMaterializationDueYmd: '2098-12-18',
    };

    const plan = buildFutureScheduleWindowPlan({
      enrollmentId: 'enrollment-pointer-independent',
      enrollment: row,
      todayYmd: '2026-09-19',
    });

    expect(plan.managedFromYmd).toBe('2026-09-20');
    expect(plan.managedThroughYmd).toBe('2026-10-03');
    expect(plan.occurrences.map((occurrence) => occurrence.date)).toEqual([
      '2026-09-21',
      '2026-09-23',
      '2026-09-25',
      '2026-09-28',
      '2026-09-30',
      '2026-10-02',
    ]);
  });
});
