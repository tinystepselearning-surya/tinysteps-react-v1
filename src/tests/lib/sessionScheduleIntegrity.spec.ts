import { describe, expect, it } from 'vitest';
import {
  doesSessionMatchEnrollmentSchedule,
  isEnrollmentOperationallyActive,
  isSessionCanonicalForEnrollment,
  isSessionStatusOperationallyVisible,
  shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment,
} from '../../lib/sessionScheduleIntegrity';

const baseEnrollment = {
  id: 'enr_1',
  status: 'active',
  courseId: 'phonics',
  teacherId: 'teacher_current',
  teacherIds: ['teacher_current'],
  kidId: 'kid_1',
  kidIds: ['kid_1'],
  schedule: {
    weeklySlots: [
      {
        weekday: 1,
        time: '17:00',
        durationMinutes: 35,
      },
    ],
  },
};

describe('sessionScheduleIntegrity', () => {
  it.each(['paused', 'cancelled', 'canceled', 'archived', 'inactive', 'completed', 'discontinued', 'expired'])(
    'treats %s enrollments as non-operational',
    (status) => {
      expect(isEnrollmentOperationallyActive({ ...baseEnrollment, status })).toBe(false);
    },
  );

  it.each(['active', 'enrolled', 'current', 'ongoing', 'pending_payment', 'trial'])(
    'preserves the supported operational alias %s',
    (status) => {
      expect(isEnrollmentOperationallyActive({ ...baseEnrollment, status })).toBe(true);
    },
  );

  it('does not silently expose an unknown enrollment status', () => {
    expect(isEnrollmentOperationallyActive({ ...baseEnrollment, status: 'future_terminal_state' })).toBe(false);
  });

  it('respects every supported archival marker', () => {
    expect(isEnrollmentOperationallyActive({ ...baseEnrollment, archived: true })).toBe(false);
    expect(isEnrollmentOperationallyActive({ ...baseEnrollment, isArchived: true })).toBe(false);
    expect(isEnrollmentOperationallyActive({ ...baseEnrollment, archivedAt: '2026-06-01' })).toBe(false);
  });

  it.each(['paused', 'cancelled', 'canceled'])(
    'hides %s operational session rows',
    (status) => expect(isSessionStatusOperationallyVisible(status)).toBe(false),
  );

  it.each(['scheduled', 'completed', 'attended', 'no_show'])(
    'does not blanket-hide the %s attendance state',
    (status) => expect(isSessionStatusOperationallyVisible(status)).toBe(true),
  );

  it('accepts canonical sessions when the teacher only appears in alias fields', () => {
    const session = {
      enrollmentId: 'enr_1',
      courseId: 'phonics',
      date: '2026-06-01',
      startTime: '17:00',
      endTime: '17:35',
      durationMinutes: 35,
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      teacherId: '',
      teacherIds: ['teacher_old', 'teacher_current'],
      assignedTeacherId: 'teacher_current',
      status: 'scheduled',
    };

    expect(doesSessionMatchEnrollmentSchedule(session, baseEnrollment)).toBe(true);
    expect(isSessionCanonicalForEnrollment(session, baseEnrollment)).toBe(true);
  });

  it('rejects sessions when none of the teacher aliases match the enrollment teacher', () => {
    const session = {
      enrollmentId: 'enr_1',
      courseId: 'phonics',
      date: '2026-06-01',
      startTime: '17:00',
      endTime: '17:35',
      durationMinutes: 35,
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      teacherId: 'teacher_other',
      teacherIds: ['teacher_other'],
      assignedTeacherId: 'teacher_other',
      status: 'scheduled',
    };

    expect(doesSessionMatchEnrollmentSchedule(session, baseEnrollment)).toBe(false);
    expect(isSessionCanonicalForEnrollment(session, baseEnrollment)).toBe(false);
  });

  it('rejects regular sessions whose duration does not match the current schedule', () => {
    expect(doesSessionMatchEnrollmentSchedule({
      enrollmentId: 'enr_1',
      courseId: 'phonics',
      date: '2026-06-01',
      startTime: '17:00',
      endTime: '18:00',
      kidId: 'kid_1',
      teacherId: 'teacher_current',
      status: 'scheduled',
    }, baseEnrollment)).toBe(false);
  });

  it('keeps one-off makeup sessions canonical when identity matches through teacher aliases', () => {
    const session = {
      enrollmentId: 'enr_1',
      courseId: 'phonics',
      date: '2026-06-03',
      startTime: '18:15',
      endTime: '18:50',
      durationMinutes: 35,
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      teacherId: '',
      teacherIds: ['teacher_current'],
      isMakeup: true,
      makeupCreditId: 'credit_1',
      status: 'scheduled',
      source: 'teacher_makeup_from_reschedule',
    };

    expect(doesSessionMatchEnrollmentSchedule(session, baseEnrollment)).toBe(true);
    expect(isSessionCanonicalForEnrollment(session, baseEnrollment)).toBe(true);
  });

  it('rejects normal recurring sessions when enrollment hydration is missing', () => {
    const session = {
      enrollmentId: 'enr_1',
      courseId: 'phonics',
      date: '2026-06-01',
      startTime: '17:00',
      endTime: '17:35',
      durationMinutes: 35,
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      teacherId: 'teacher_current',
      status: 'scheduled',
      source: 'enrollmentScheduleReplace',
    };

    expect(isSessionCanonicalForEnrollment(session, undefined)).toBe(false);
    expect(shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment(session, 'teacher_current')).toBe(false);
  });

  it('allows teacher-owned admin_manual_adhoc sessions when enrollment hydration is missing', () => {
    const session = {
      enrollmentId: 'enr_1',
      courseId: 'phonics',
      date: '2026-06-03',
      startTime: '21:00',
      endTime: '21:35',
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      teacherId: 'teacher_current',
      teacherName: 'Teacher Current',
      status: 'reschedule_requested',
      source: 'admin_manual_adhoc',
    };

    expect(isSessionCanonicalForEnrollment(session, undefined)).toBe(false);
    expect(shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment(session, 'teacher_current')).toBe(true);
  });

  it('rejects schedule-exception sessions that belong to another teacher when enrollment hydration is missing', () => {
    const session = {
      enrollmentId: 'enr_1',
      courseId: 'phonics',
      date: '2026-06-03',
      startTime: '21:00',
      endTime: '21:35',
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      teacherId: 'teacher_other',
      teacherIds: ['teacher_other'],
      status: 'reschedule_requested',
      source: 'admin_manual_adhoc',
    };

    expect(shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment(session, 'teacher_current')).toBe(false);
  });

  it('preserves makeup and reschedule metadata while allowing teacher-owned exception sessions without enrollment', () => {
    const session = {
      enrollmentId: 'enr_1',
      courseId: 'phonics',
      date: '2026-06-03',
      startTime: '18:15',
      endTime: '18:50',
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      teacherId: 'teacher_current',
      teacherIds: ['teacher_current'],
      isMakeup: true,
      makeupCreditId: 'credit_1',
      makeupForSessionId: 'session_old',
      rescheduledFromSessionId: 'session_old',
      replacementSessionId: 'session_new',
      status: 'scheduled',
      source: 'teacher_makeup_from_reschedule',
    };

    expect(shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment(session, 'teacher_current')).toBe(true);
    expect(session.makeupCreditId).toBe('credit_1');
    expect(session.makeupForSessionId).toBe('session_old');
    expect(session.rescheduledFromSessionId).toBe('session_old');
    expect(session.replacementSessionId).toBe('session_new');
  });
});
