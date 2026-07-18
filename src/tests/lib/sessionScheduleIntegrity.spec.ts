import { describe, expect, it } from 'vitest';
import {
  doesSessionMatchEnrollmentSchedule,
  doesEnrollmentOccupyCourseSlot,
  getManualSessionState,
  isEnrollmentOperationallyActive,
  isLegacyManualSession,
  isOperationalManualSession,
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
  it('keeps paused enrollment hidden while reserving the same-course slot', () => {
    expect(isEnrollmentOperationallyActive({ ...baseEnrollment, status: 'paused' })).toBe(false);
    expect(doesEnrollmentOccupyCourseSlot({ ...baseEnrollment, status: 'paused' })).toBe(true);
  });

  it.each(['completed', 'cancelled', 'canceled', 'archived', 'inactive', 'discontinued', 'expired'])(
    'does not let terminal status %s block intentional re-enrollment',
    (status) => expect(doesEnrollmentOccupyCourseSlot({ ...baseEnrollment, status })).toBe(false),
  );

  it.each(['active', 'trial', 'pending_teacher', 'pending_payment', 'pending_lp', 'enrolled', 'current', 'ongoing'])(
    'treats %s as occupying the same-course slot',
    (status) => expect(doesEnrollmentOccupyCourseSlot({ ...baseEnrollment, status })).toBe(true),
  );

  const manualSession = {
    enrollmentId: 'enr_1',
    courseId: 'phonics',
    kidId: 'kid_1',
    teacherId: 'teacher_current',
    status: 'scheduled',
    source: 'admin_manual_adhoc',
    isAdHoc: true,
    createdAt: '2026-07-11T14:21:29.583Z',
    createdBy: 'admin_1',
  };

  it('shows only explicitly approved current manual sessions', () => {
    expect(getManualSessionState({ ...manualSession, manualSessionState: 'approved' })).toBe('approved');
    expect(isOperationalManualSession({ ...manualSession, manualSessionState: 'approved' })).toBe(true);
    expect(isOperationalManualSession({ ...manualSession, manualSessionState: 'cancelled' })).toBe(false);
    expect(isOperationalManualSession({ ...manualSession, manualSessionState: 'withdrawn' })).toBe(false);
  });

  it('rejects an unapproved new manual session even when its identity is complete', () => {
    expect(isOperationalManualSession({
      ...manualSession,
      source: 'new_manual_source',
      manualSessionState: undefined,
    })).toBe(false);
  });

  it('treats completed manual sessions as historical', () => {
    const completed = { ...manualSession, status: 'completed', manualSessionState: 'completed' };
    expect(getManualSessionState(completed)).toBe('completed');
    expect(isOperationalManualSession(completed)).toBe(false);
    expect(isOperationalManualSession({ ...manualSession, status: 'completed' })).toBe(false);
  });

  it('allows complete legacy manual identity only through the transitional compatibility rule', () => {
    expect(isLegacyManualSession(manualSession)).toBe(true);
    expect(isOperationalManualSession(manualSession)).toBe(true);
    expect(isLegacyManualSession({ ...manualSession, enrollmentId: '' })).toBe(false);
    expect(isOperationalManualSession({ ...manualSession, enrollmentId: '' })).toBe(false);
  });
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

  it('rejects legacy admin_manual_adhoc sessions with incomplete lifecycle metadata when enrollment hydration is missing', () => {
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
    expect(shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment(session, 'teacher_current')).toBe(false);
  });

  it('allows an approved teacher-owned manual session with complete identity when enrollment hydration is missing', () => {
    const session = {
      enrollmentId: 'enr_1',
      courseId: 'phonics',
      date: '2026-06-03',
      startTime: '21:00',
      endTime: '21:35',
      kidId: 'kid_1',
      teacherId: 'teacher_current',
      status: 'scheduled',
      source: 'admin_manual_adhoc',
      manualSessionState: 'approved',
    };
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
