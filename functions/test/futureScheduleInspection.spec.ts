import {describe, expect, it} from 'vitest';
import {
  inspectFutureSchedule,
  inspectFutureScheduleEnrollment,
  isFutureScheduleExceptionSession,
  isFutureScheduleRegularSession,
  loadFutureScheduleEvidence,
  type FutureScheduleSessionEvidence,
} from '../src/scheduling/futureScheduleInspection';

function enrollment(): Record<string, unknown> {
  return {
    status: 'active',
    kidId: 'kid-1',
    kidIds: ['kid-1'],
    studentId: 'kid-1',
    childId: 'kid-1',
    parentId: 'parent-1',
    parentIds: ['parent-1'],
    teacherId: 'teacher-1',
    courseId: 'course-1',
    feePerClass: 400,
    currency: 'INR',
    classesStartDateYmd: '2026-09-01',
    schedule: {
      schemaVersion: 1,
      deliveryMode: 'rolling',
      timezone: 'Asia/Kolkata',
      revision: 7,
      weeklySlots: [
        {weekday: 1, time: '17:30', durationMinutes: 35},
        {weekday: 3, time: '17:30', durationMinutes: 35},
        {weekday: 5, time: '17:30', durationMinutes: 35},
      ],
    },
  };
}

function regularSession(args: {
  id: string;
  date: string;
  startTime?: string;
  durationMinutes?: number;
  status?: string;
  source?: string;
  teacherId?: string;
  enrollmentId?: string;
  kidId?: string;
  parentId?: string;
  courseId?: string;
  scheduleRevision?: number;
}): FutureScheduleSessionEvidence {
  return {
    id: args.id,
    data: {
      enrollmentId: args.enrollmentId ?? 'enrollment-1',
      kidId: args.kidId ?? 'kid-1',
      kidIds: [args.kidId ?? 'kid-1'],
      studentId: args.kidId ?? 'kid-1',
      childId: args.kidId ?? 'kid-1',
      parentId: args.parentId ?? 'parent-1',
      parentIds: [args.parentId ?? 'parent-1'],
      teacherId: args.teacherId ?? 'teacher-1',
      courseId: args.courseId ?? 'course-1',
      date: args.date,
      startTime: args.startTime ?? '17:30',
      durationMinutes: args.durationMinutes ?? 35,
      status: args.status ?? 'scheduled',
      source: args.source ?? 'rolling_schedule',
      scheduleRevision: args.scheduleRevision ?? 7,
    },
  };
}

describe('Brick 2 future schedule inspection', () => {
  it('returns blocked_source for an operational enrollment with invalid source data instead of throwing or silently skipping it', () => {
    const broken = enrollment();
    delete broken.teacherId;

    const result = inspectFutureScheduleEnrollment({
      enrollmentId: 'enrollment-1',
      enrollment: broken,
      todayYmd: '2026-09-19',
      sessions: [],
    });

    expect(result).toEqual({
      kind: 'blocked_source',
      enrollmentId: 'enrollment-1',
      assessment: {
        ready: false,
        normalizedStatus: 'active',
        issues: ['missing_or_ambiguous_teacher'],
        warnings: [],
      },
    });
  });

  it('keeps non-scheduling metadata gaps visible as warnings without blocking expected recurrence inspection', () => {
    const row = enrollment();
    delete row.parentId;
    delete row.parentIds;
    delete row.courseId;
    delete row.feePerClass;

    const result = inspectFutureScheduleEnrollment({
      enrollmentId: 'enrollment-1',
      enrollment: row,
      todayYmd: '2026-09-19',
      sessions: [],
    });

    expect(result.kind).toBe('inspected');
    if (result.kind !== 'inspected') throw new Error('expected inspected result');
    expect(result.assessment).toEqual({
      ready: true,
      normalizedStatus: 'active',
      issues: [],
      warnings: [
        'missing_parent_identity',
        'missing_course_identity',
        'missing_billing_rate',
      ],
    });
    expect(result.inspection.summary.expectedOccurrences).toBe(6);
  });

  it('loads expected IDs, managed-window rows, and linked exceptions without losing out-of-window replacement evidence', async () => {
    const expected = regularSession({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
    });
    const duplicate = regularSession({
      id: 'legacy-dup',
      date: '2026-09-21',
      source: 'enrollmentSchedule',
    });
    const linkedException: FutureScheduleSessionEvidence = {
      id: 'makeup-outside-window',
      data: {
        enrollmentId: 'enrollment-1',
        kidId: 'kid-1',
        parentId: 'parent-1',
        courseId: 'course-1',
        source: 'teacher_makeup_from_reschedule',
        isMakeup: true,
        makeupForSessionId: 'enrollment-1_20260923_1730',
        date: '2026-10-10',
        startTime: '18:00',
      },
    };

    const plan = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [],
    }).plan;

    const calls: string[] = [];
    const loaded = await loadFutureScheduleEvidence({
      plan,
      store: {
        async getSessionsByIds(ids) {
          calls.push(`ids:${ids.length}`);
          return [expected];
        },
        async listSessionsForEnrollmentWindow(args) {
          calls.push(`window:${args.fromYmd}:${args.throughYmd}`);
          return [expected, duplicate];
        },
        async listExceptionSessionsReferencingIds(ids) {
          calls.push(`links:${ids.length}`);
          return [linkedException];
        },
      },
    });

    expect(calls).toEqual([
      'ids:6',
      'window:2026-09-20:2026-10-03',
      'links:6',
    ]);
    expect(loaded.map((row) => row.id)).toEqual([
      'enrollment-1_20260921_1730',
      'legacy-dup',
      'makeup-outside-window',
    ]);
  });

  it('classifies a fully correct 14-day recurrence as converged', () => {
    const sessions = [
      regularSession({id: 'enrollment-1_20260921_1730', date: '2026-09-21'}),
      regularSession({id: 'enrollment-1_20260923_1730', date: '2026-09-23'}),
      regularSession({id: 'enrollment-1_20260925_1730', date: '2026-09-25'}),
      regularSession({id: 'enrollment-1_20260928_1730', date: '2026-09-28'}),
      regularSession({id: 'enrollment-1_20260930_1730', date: '2026-09-30'}),
      regularSession({id: 'enrollment-1_20261002_1730', date: '2026-10-02'}),
    ];

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions,
    });

    expect(result.summary).toMatchObject({
      expectedOccurrences: 6,
      correct: 6,
      missing: 0,
      duplicateOccurrences: 0,
      protectedExceptions: 0,
      blockedOccurrences: 0,
      unexpectedRegularSessions: 0,
      blockedEvidence: 0,
    });
    expect(result.converged).toBe(true);
  });

  it('finds missing expected regular sessions', () => {
    const sessions = [
      regularSession({id: 'enrollment-1_20260921_1730', date: '2026-09-21'}),
    ];

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions,
    });

    expect(result.summary.missing).toBe(5);
    expect(result.occurrences.filter((row) => row.state === 'missing').map((row) => row.occurrence.date))
      .toEqual([
        '2026-09-23',
        '2026-09-25',
        '2026-09-28',
        '2026-09-30',
        '2026-10-02',
      ]);
    expect(result.converged).toBe(false);
  });

  it('detects duplicate regular sessions for one expected occurrence', () => {
    const sessions = [
      regularSession({id: 'enrollment-1_20260921_1730', date: '2026-09-21'}),
      regularSession({id: 'legacy-dup', date: '2026-09-21', source: 'enrollmentSchedule'}),
    ];

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions,
    });

    expect(result.summary.duplicateOccurrences).toBe(1);
    expect(result.duplicates).toEqual([{
      occurrenceSessionId: 'enrollment-1_20260921_1730',
      canonicalSessionId: 'enrollment-1_20260921_1730',
      duplicateSessionIds: ['legacy-dup'],
    }]);
    expect(result.converged).toBe(false);
  });

  it('fails closed instead of calling protected/finance-linked duplicate candidates safe duplicates', () => {
    const normal = regularSession({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
    });
    const protectedDuplicate = regularSession({
      id: 'legacy-protected-dup',
      date: '2026-09-21',
      source: 'enrollmentSchedule',
    });
    protectedDuplicate.data.attendance = {'kid-1': {status: 'present'}};

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [normal, protectedDuplicate],
    });

    const occurrence = result.occurrences.find((row) => row.occurrence.date === '2026-09-21');
    expect(occurrence?.state).toBe('blocked');
    expect(occurrence?.reasons).toEqual(['future_regular_session_contains_protected_state']);
    expect(result.duplicates).toEqual([]);
  });

  it('fails closed on a malformed session date instead of normalizing it through JavaScript Date parsing', () => {
    const malformed = regularSession({
      id: 'malformed-date',
      date: '2026-02-31',
      source: 'enrollmentSchedule',
    });
    malformed.data.startAt = new Date('2026-09-21T12:00:00.000Z');

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [malformed],
    });

    expect(result.blockedEvidence).toContainEqual({
      sessionId: 'malformed-date',
      occurrenceSessionId: null,
      reasons: ['invalid_session_date_or_time'],
    });
  });

  it('detects an unexpected regular session on a non-enrollment weekday/time', () => {
    const sessions = [
      regularSession({
        id: 'legacy-tuesday',
        date: '2026-09-22',
        startTime: '17:30',
        source: 'enrollmentSchedule',
      }),
    ];

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions,
    });

    expect(result.unexpectedRegularSessions).toEqual([{
      sessionId: 'legacy-tuesday',
      date: '2026-09-22',
      startTime: '17:30',
      reasons: ['unexpected_regular_session'],
    }]);
    expect(result.summary.unexpectedRegularSessions).toBe(1);
  });

  it('blocks an unexpected future regular row when it already carries attendance/finance-protected state', () => {
    const protectedUnexpected = regularSession({
      id: 'protected-unexpected',
      date: '2026-09-22',
      startTime: '17:30',
      source: 'enrollmentSchedule',
    });
    protectedUnexpected.data.attendance = {'kid-1': {status: 'present'}};

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [protectedUnexpected],
    });

    expect(result.unexpectedRegularSessions).toEqual([]);
    expect(result.blockedEvidence).toEqual([{
      sessionId: 'protected-unexpected',
      occurrenceSessionId: null,
      reasons: [
        'unexpected_regular_session_protected',
        'future_regular_session_contains_protected_state',
      ],
    }]);
  });

  it('preserves a valid linked makeup/reschedule exception even when it is outside the managed window', () => {
    const makeup: FutureScheduleSessionEvidence = {
      id: 'makeup-outside-window',
      data: {
        enrollmentId: 'enrollment-1',
        kidId: 'kid-1',
        kidIds: ['kid-1'],
        parentId: 'parent-1',
        parentIds: ['parent-1'],
        teacherId: 'teacher-2',
        courseId: 'course-1',
        date: '2026-10-10',
        startTime: '18:00',
        durationMinutes: 35,
        status: 'scheduled',
        source: 'teacher_makeup_from_reschedule',
        isMakeup: true,
        makeupForSessionId: 'enrollment-1_20260923_1730',
      },
    };

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [makeup],
    });

    const occurrence = result.occurrences.find((row) => row.occurrence.date === '2026-09-23');
    expect(occurrence?.state).toBe('protected_exception');
    expect(occurrence?.relatedSessionIds).toEqual(['makeup-outside-window']);
    expect(result.summary.protectedExceptions).toBe(1);
  });

  it('keeps both the protected original and valid linked replacement in one reschedule chain', () => {
    const original = regularSession({
      id: 'legacy-rescheduled-original',
      date: '2026-09-23',
      status: 'rescheduled',
      source: 'enrollmentSchedule',
    });
    const replacement: FutureScheduleSessionEvidence = {
      id: 'linked-replacement',
      data: {
        enrollmentId: 'enrollment-1',
        kidId: 'kid-1',
        courseId: 'course-1',
        teacherId: 'teacher-2',
        date: '2026-09-24',
        startTime: '18:00',
        status: 'scheduled',
        source: 'teacher_makeup_from_reschedule',
        isMakeup: true,
        makeupForSessionId: 'enrollment-1_20260923_1730',
      },
    };

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [original, replacement],
    });

    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-23')).toMatchObject({
      state: 'protected_exception',
      relatedSessionIds: ['legacy-rescheduled-original', 'linked-replacement'],
      reasons: ['protected_regular_occurrence', 'linked_schedule_exception'],
    });
  });

  it('blocks when an active original session still exists alongside a valid linked replacement', () => {
    const activeOriginal = regularSession({
      id: 'enrollment-1_20260923_1730',
      date: '2026-09-23',
    });
    const makeup: FutureScheduleSessionEvidence = {
      id: 'linked-makeup',
      data: {
        enrollmentId: 'enrollment-1',
        kidId: 'kid-1',
        parentId: 'parent-1',
        courseId: 'course-1',
        teacherId: 'teacher-2',
        date: '2026-10-10',
        startTime: '18:00',
        status: 'scheduled',
        source: 'teacher_makeup_from_reschedule',
        isMakeup: true,
        makeupForSessionId: 'enrollment-1_20260923_1730',
      },
    };

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [activeOriginal, makeup],
    });

    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-23')).toMatchObject({
      state: 'blocked',
      reasons: ['active_and_linked_exception_conflict'],
    });
    expect(result.blockedEvidence).toContainEqual({
      sessionId: null,
      occurrenceSessionId: 'enrollment-1_20260923_1730',
      reasons: ['active_and_linked_exception_conflict'],
    });
  });

  it('fails closed when a linked replacement/makeup exists but is itself cancelled or otherwise non-operational', () => {
    const cancelledMakeup: FutureScheduleSessionEvidence = {
      id: 'cancelled-makeup',
      data: {
        enrollmentId: 'enrollment-1',
        kidId: 'kid-1',
        parentId: 'parent-1',
        courseId: 'course-1',
        teacherId: 'teacher-2',
        date: '2026-10-10',
        startTime: '18:00',
        status: 'cancelled',
        source: 'teacher_makeup_from_reschedule',
        isMakeup: true,
        makeupForSessionId: 'enrollment-1_20260923_1730',
      },
    };

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [cancelledMakeup],
    });

    const occurrence = result.occurrences.find((row) => row.occurrence.date === '2026-09-23');
    expect(occurrence?.state).toBe('blocked');
    expect(occurrence?.reasons).toContain('linked_exception_not_operational');
  });

  it('fails closed when a linked manual exception has been withdrawn even if its session status is blank', () => {
    const withdrawnManual: FutureScheduleSessionEvidence = {
      id: 'withdrawn-manual',
      data: {
        enrollmentId: 'enrollment-1',
        kidId: 'kid-1',
        parentId: 'parent-1',
        courseId: 'course-1',
        teacherId: 'teacher-2',
        date: '2026-10-10',
        startTime: '18:00',
        status: '',
        source: 'manual_one_off',
        manualSessionState: 'withdrawn',
        originalSessionId: 'enrollment-1_20260923_1730',
      },
    };

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [withdrawnManual],
    });

    const occurrence = result.occurrences.find((row) => row.occurrence.date === '2026-09-23');
    expect(occurrence?.state).toBe('blocked');
    expect(occurrence?.reasons).toContain('linked_exception_not_operational');
  });

  it('fails closed when a linked exception belongs to another enrollment/child/course', () => {
    const corruptException: FutureScheduleSessionEvidence = {
      id: 'foreign-makeup',
      data: {
        enrollmentId: 'other-enrollment',
        kidId: 'other-child',
        parentId: 'other-parent',
        courseId: 'other-course',
        teacherId: 'teacher-9',
        date: '2026-10-10',
        startTime: '18:00',
        status: 'scheduled',
        source: 'teacher_makeup_from_reschedule',
        isMakeup: true,
        makeupForSessionId: 'enrollment-1_20260923_1730',
      },
    };

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [corruptException],
    });

    const occurrence = result.occurrences.find((row) => row.occurrence.date === '2026-09-23');
    expect(occurrence?.state).toBe('blocked');
    expect(occurrence?.reasons).toEqual(expect.arrayContaining([
      'invalid_exception_identity',
      'enrollment_identity_mismatch',
      'course_identity_mismatch',
      'child_identity_mismatch',
    ]));
    expect(result.blockedEvidence[0]?.reasons).toEqual(expect.arrayContaining([
      'invalid_exception_identity',
      'enrollment_identity_mismatch',
      'course_identity_mismatch',
      'child_identity_mismatch',
    ]));
  });

  it('blocks when the same expected slot has both an active regular row and an intentional protected row', () => {
    const active = regularSession({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
    });
    const cancelledLegacy = regularSession({
      id: 'legacy-cancelled-row',
      date: '2026-09-21',
      status: 'cancelled',
      source: 'enrollmentSchedule',
    });
    cancelledLegacy.data.cancelledReason = 'parent_requested';

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [active, cancelledLegacy],
    });

    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-21')).toMatchObject({
      state: 'blocked',
      reasons: ['active_and_protected_regular_conflict'],
    });
    expect(result.blockedEvidence).toContainEqual({
      sessionId: null,
      occurrenceSessionId: 'enrollment-1_20260921_1730',
      reasons: ['active_and_protected_regular_conflict'],
    });
  });

  it('preserves a legacy non-deterministic cancelled/reschedule-requested regular row by expected slot', () => {
    const cancelledLegacy = regularSession({
      id: 'legacy-cancelled-row',
      date: '2026-09-21',
      status: 'cancelled',
      source: 'enrollmentSchedule',
    });
    cancelledLegacy.data.cancelledReason = 'parent_requested';

    const rescheduleRequestedLegacy = regularSession({
      id: 'legacy-reschedule-row',
      date: '2026-09-23',
      status: 'reschedule_requested',
      source: 'enrollmentSchedule',
    });

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [cancelledLegacy, rescheduleRequestedLegacy],
    });

    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-21')).toMatchObject({
      state: 'protected_exception',
      canonicalSessionId: 'legacy-cancelled-row',
      reasons: ['protected_regular_occurrence'],
    });
    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-23')).toMatchObject({
      state: 'protected_exception',
      canonicalSessionId: 'legacy-reschedule-row',
      reasons: ['protected_regular_occurrence'],
    });
  });

  it('treats an intentional cancelled expected occurrence as a protected exception', () => {
    const cancelled = regularSession({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      status: 'cancelled',
      source: 'rolling_schedule',
    });
    cancelled.data.cancelledReason = 'parent_requested';

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [cancelled],
    });

    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-21')?.state)
      .toBe('protected_exception');
  });

  it('blocks a terminal lifecycle cancellation instead of marking it restorable', () => {
    const discontinued = regularSession({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      status: 'cancelled',
    });
    discontinued.data.cancelledReason = 'enrollment_discontinued';
    discontinued.data.rollingLifecycleCancellation = {
      source: 'rolling_schedule_lifecycle',
      reason: 'enrollment_discontinued',
    };

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [discontinued],
    });

    const occurrence = result.occurrences.find((row) => row.occurrence.date === '2026-09-21');
    expect(occurrence?.state).toBe('blocked');
    expect(occurrence?.reasons).toEqual([
      'non_restorable_system_cancelled_expected_session',
    ]);
  });

  it('does not treat a system-cancelled expected regular occurrence as a protected exception', () => {
    const cancelled = regularSession({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      status: 'cancelled',
    });
    cancelled.data.cancelledReason = 'rolling_schedule_reconciled';

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [cancelled],
    });

    const occurrence = result.occurrences.find((row) => row.occurrence.date === '2026-09-21');
    expect(occurrence?.state).toBe('blocked');
    expect(occurrence?.reasons).toEqual(['system_cancelled_expected_session_requires_restore']);
  });

  it('does not let a stale teacher alias override a conflicting canonical teacherId', () => {
    const row = regularSession({
      id: 'wrong-canonical-teacher',
      date: '2026-09-21',
      teacherId: 'teacher-2',
    });
    row.data.teacherIds = ['teacher-1'];

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [row],
    });

    expect(result.occurrences.find((item) => item.occurrence.date === '2026-09-21')?.state)
      .toBe('blocked');
    expect(result.blockedEvidence[0]?.reasons).toContain('teacher_identity_mismatch');
  });

  it('uses canonical child/parent ownership before stale legacy aliases', () => {
    const row = regularSession({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
    });
    row.data.studentId = 'stale-student-alias';
    row.data.childId = 'stale-child-alias';
    row.data.parentIds = ['stale-parent-alias'];

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [row],
    });

    expect(result.occurrences.find((item) => item.occurrence.date === '2026-09-21')?.state)
      .toBe('correct');

    const wrongCanonicalParent = regularSession({
      id: 'wrong-parent-canonical',
      date: '2026-09-23',
    });
    wrongCanonicalParent.data.parentId = 'wrong-parent';
    wrongCanonicalParent.data.parentIds = ['parent-1'];

    const drifted = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [wrongCanonicalParent],
    });
    expect(drifted.occurrences.find((item) => item.occurrence.date === '2026-09-23')?.state)
      .toBe('correct');
    expect(drifted.metadataDrift).toContainEqual({
      sessionId: 'wrong-parent-canonical',
      reasons: ['parent_identity_drift'],
    });
    expect(drifted.converged).toBe(false);
  });

  it('fails closed on teacher, child, parent, course, duration, or protected-state conflicts', () => {
    const wrongTeacher = regularSession({
      id: 'wrong-teacher',
      date: '2026-09-21',
      teacherId: 'teacher-2',
    });
    const wrongDuration = regularSession({
      id: 'wrong-duration',
      date: '2026-09-23',
      durationMinutes: 40,
    });
    const protectedState = regularSession({
      id: 'protected-state',
      date: '2026-09-25',
    });
    protectedState.data.attendance = { 'kid-1': {status: 'present'} };

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [wrongTeacher, wrongDuration, protectedState],
    });

    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-21')?.state)
      .toBe('blocked');
    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-23')?.reasons)
      .toEqual(['duration_mismatch']);
    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-25')?.reasons)
      .toEqual(['future_regular_session_contains_protected_state']);
  });

  it('tracks stale schedule revision as metadata drift without treating physical coverage as missing', () => {
    const stale = regularSession({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
      scheduleRevision: 5,
    });

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [stale],
    });

    const row = result.occurrences.find((item) => item.occurrence.date === '2026-09-21');
    expect(row?.state).toBe('correct');
    expect(row?.reasons).toEqual(['stale_schedule_revision']);
    expect(result.metadataDrift).toEqual([{
      sessionId: 'enrollment-1_20260921_1730',
      reasons: ['stale_schedule_revision'],
    }]);
    expect(result.converged).toBe(false);
  });

  it('blocks a row whose future date/time fields conflict with a today timestamp', () => {
    const conflicting = regularSession({
      id: 'conflicting-clock-row',
      date: '2026-09-21',
      source: 'enrollmentSchedule',
    });
    conflicting.data.startAt = new Date('2026-09-19T12:00:00.000Z');

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [conflicting],
    });

    expect(result.blockedEvidence).toContainEqual({
      sessionId: 'conflicting-clock-row',
      occurrenceSessionId: null,
      reasons: ['session_date_time_timestamp_mismatch'],
    });
    expect(result.unexpectedRegularSessions).toEqual([]);
  });

  it('ignores today and historical session evidence completely', () => {
    const today = regularSession({
      id: 'today-row',
      date: '2026-09-19',
      source: 'enrollmentSchedule',
    });
    const past = regularSession({
      id: 'past-row',
      date: '2026-09-18',
      source: 'enrollmentSchedule',
    });

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [today, past],
    });

    expect(result.unexpectedRegularSessions).toEqual([]);
    expect(result.blockedEvidence).toEqual([]);
    expect(result.occurrences.every((row) => row.occurrence.date >= '2026-09-20')).toBe(true);
  });

  it('ignores ordinary regular sessions outside the managed tomorrow-to-14-day window', () => {
    const outside = regularSession({
      id: 'outside',
      date: '2026-10-04',
      source: 'enrollmentSchedule',
    });

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [outside],
    });

    expect(result.unexpectedRegularSessions).toEqual([]);
    expect(result.blockedEvidence).toEqual([]);
  });

  it('ignores a retired non-canonical legacy row beside the active canonical expected occurrence', () => {
    const canonical = regularSession({
      id: 'enrollment-1_20260921_1730',
      date: '2026-09-21',
    });
    const retiredLegacy = regularSession({
      id: 'legacy-retired-duplicate',
      date: '2026-09-21',
      status: 'cancelled',
      source: 'enrollmentSchedule',
    });
    retiredLegacy.data.cancelledReason = 'rolling_schedule_reconciled';

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [canonical, retiredLegacy],
    });

    expect(result.occurrences.find((row) => row.occurrence.date === '2026-09-21')?.state)
      .toBe('correct');
    expect(result.duplicates).toEqual([]);
    expect(result.blockedEvidence).toEqual([]);
  });

  it('ignores already-retired system-cancelled stale regular rows that are no longer expected', () => {
    const stale = regularSession({
      id: 'stale-system-cancelled',
      date: '2026-09-22',
      status: 'cancelled',
      source: 'rolling_schedule',
    });
    stale.data.cancelledReason = 'rolling_schedule_reconciled';

    const result = inspectFutureSchedule({
      enrollmentId: 'enrollment-1',
      enrollment: enrollment(),
      todayYmd: '2026-09-19',
      sessions: [stale],
    });

    expect(result.unexpectedRegularSessions).toEqual([]);
    expect(result.blockedEvidence).toEqual([]);
  });

  it('keeps exception detection separate from ordinary regular schedule sources', () => {
    expect(isFutureScheduleExceptionSession({
      source: 'teacher_makeup_from_reschedule',
      isMakeup: true,
    })).toBe(true);
    expect(isFutureScheduleExceptionSession({
      replacementSessionId: 'replacement-1',
    })).toBe(true);
    expect(isFutureScheduleRegularSession({source: 'rolling_schedule'})).toBe(true);
    expect(isFutureScheduleRegularSession({source: 'enrollmentScheduleRepair'})).toBe(true);
    expect(isFutureScheduleRegularSession({source: 'manual_one_off'})).toBe(false);
  });
});
