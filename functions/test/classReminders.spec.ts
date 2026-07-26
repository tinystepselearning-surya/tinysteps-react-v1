import * as admin from 'firebase-admin';
import { describe, expect, it } from 'vitest';
import {
  buildClassReminderBody,
  buildClassReminderDeliveryId,
  buildReminderClaimRecord,
  canClaimClassReminderDelivery,
  isEligibleClassReminderSession,
  reminderDeliverySkipReason,
  resolveReminderRecipients,
  type ReminderRecipient,
} from '../src/notifications/classReminders';

describe('15-minute class reminder selection and identity', () => {
  const nowMs = Date.parse('2026-07-26T10:00:00.000Z');
  const startAtMs = nowMs + 15 * 60 * 1000;
  const startAt = admin.firestore.Timestamp.fromMillis(startAtMs);
  const parent: ReminderRecipient = {
    userId: 'parent-1',
    role: 'parent',
    route: '/parent?tab=classes',
  };
  const teacher: ReminderRecipient = {
    userId: 'teacher-1',
    role: 'teacher',
    route: '/teacher?tab=today',
  };
  const baseSession = {
    enrollmentId: 'enrollment-1',
    kidId: 'kid-1',
    courseId: 'course-1',
    parentId: 'parent-1',
    teacherId: 'teacher-1',
    status: 'scheduled',
    startAt,
  };
  const baseEnrollment = {
    kidId: 'kid-1',
    courseId: 'course-1',
    parentId: 'parent-1',
    teacherId: 'teacher-1',
    learningPartnerId: 'lp-1',
    learningPartnerNotificationsEnabled: true,
    status: 'active',
  };

  it('selects only operational sessions in the 14–16 minute window', () => {
    expect(isEligibleClassReminderSession({ status: 'scheduled', startAt }, nowMs)).toBe(true);
    expect(isEligibleClassReminderSession({ status: 'completed', startAt }, nowMs)).toBe(false);
    expect(isEligibleClassReminderSession({ status: 'cancelled', startAt }, nowMs)).toBe(false);
    expect(isEligibleClassReminderSession({ status: 'paused', startAt }, nowMs)).toBe(false);
    expect(isEligibleClassReminderSession({
      status: 'scheduled',
      startAt: admin.firestore.Timestamp.fromMillis(nowMs + 17 * 60 * 1000),
    }, nowMs)).toBe(false);
  });

  it.each([14, 15, 16])('includes the fixed %s-minute boundary', (minutes) => {
    expect(isEligibleClassReminderSession({
      status: 'scheduled',
      startAt: admin.firestore.Timestamp.fromMillis(nowMs + minutes * 60_000),
    }, nowMs)).toBe(true);
  });

  it.each([
    'completed',
    'cancelled',
    'canceled',
    'paused',
    'archived',
    'no_show',
    'reschedule_requested',
    'invalid',
  ])('rejects the %s session state', (status) => {
    expect(isEligibleClassReminderSession({ status, startAt }, nowMs)).toBe(false);
  });

  it('rejects invalid and legacy local-time values', () => {
    expect(isEligibleClassReminderSession({
      status: 'scheduled',
      startAt: '2026-07-26 15:45',
    }, nowMs)).toBe(false);
  });

  it('is stable for duplicate invocations and changes after a reschedule', () => {
    const first = buildClassReminderDeliveryId('session-1', 'parent-1', nowMs);
    expect(buildClassReminderDeliveryId('session-1', 'parent-1', nowMs)).toBe(first);
    expect(buildClassReminderDeliveryId('session-1', 'parent-1', nowMs + 60_000))
      .not.toBe(first);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('allows only new, failed, or expired claims to retry', () => {
    expect(canClaimClassReminderDelivery(null, nowMs)).toBe(true);
    expect(canClaimClassReminderDelivery({ status: 'failed' }, nowMs)).toBe(true);
    expect(canClaimClassReminderDelivery({
      status: 'claimed',
      claimExpiresAt: admin.firestore.Timestamp.fromMillis(nowMs - 1),
    }, nowMs)).toBe(true);
    expect(canClaimClassReminderDelivery({
      status: 'claimed',
      claimExpiresAt: admin.firestore.Timestamp.fromMillis(nowMs + 1),
    }, nowMs)).toBe(false);
    expect(canClaimClassReminderDelivery({ status: 'sent' }, nowMs)).toBe(false);
    expect(canClaimClassReminderDelivery({ status: 'skipped' }, nowMs)).toBe(false);
  });

  it('creates a bounded claim ledger record longer than the function timeout', () => {
    const claim = buildReminderClaimRecord({
      sessionId: 'session-1',
      userId: 'parent-1',
      sessionStartAtMs: startAtMs,
      nowMs,
    });
    expect(claim).toMatchObject({
      type: 'class_reminder_15m',
      sessionId: 'session-1',
      userId: 'parent-1',
      status: 'claimed',
      sentAt: null,
      failedAt: null,
    });
    expect(claim.claimExpiresAt.toMillis() - nowMs).toBe(5 * 60_000);
  });

  it('resolves only current parent, teacher, and opted-in learning-partner recipients', () => {
    expect(resolveReminderRecipients(baseSession, baseEnrollment)).toEqual([
      parent,
      teacher,
      {
        userId: 'lp-1',
        role: 'learningPartner',
        route: '/learning-partner/dashboard',
      },
    ]);
  });

  it('uses only safe authenticated reminder routes', () => {
    expect(resolveReminderRecipients(baseSession, baseEnrollment).map((item) => item.route))
      .toEqual([
        '/parent?tab=classes',
        '/teacher?tab=today',
        '/learning-partner/dashboard',
      ]);
  });

  it('requires canonical enrollment, child, and course integrity', () => {
    expect(reminderDeliverySkipReason({
      session: baseSession,
      enrollment: baseEnrollment,
      enrollmentId: 'another-enrollment',
      recipient: parent,
      sessionStartAtMs: startAtMs,
    })).toBe('session_enrollment_changed');
    expect(reminderDeliverySkipReason({
      session: { ...baseSession, kidId: 'kid-2' },
      enrollment: baseEnrollment,
      enrollmentId: 'enrollment-1',
      recipient: parent,
      sessionStartAtMs: startAtMs,
    })).toBe('student_relationship_changed');
    expect(reminderDeliverySkipReason({
      session: { ...baseSession, courseId: 'course-2' },
      enrollment: baseEnrollment,
      enrollmentId: 'enrollment-1',
      recipient: parent,
      sessionStartAtMs: startAtMs,
    })).toBe('course_relationship_changed');
  });

  it('skips a cancellation immediately before delivery', () => {
    expect(reminderDeliverySkipReason({
      session: { ...baseSession, status: 'cancelled' },
      enrollment: baseEnrollment,
      enrollmentId: 'enrollment-1',
      recipient: parent,
      sessionStartAtMs: startAtMs,
    })).toBe('session_not_eligible');
  });

  it('skips a reschedule immediately before delivery', () => {
    expect(reminderDeliverySkipReason({
      session: {
        ...baseSession,
        startAt: admin.firestore.Timestamp.fromMillis(startAtMs + 60_000),
      },
      enrollment: baseEnrollment,
      enrollmentId: 'enrollment-1',
      recipient: parent,
      sessionStartAtMs: startAtMs,
    })).toBe('session_rescheduled');
  });

  it('skips parent removal immediately before delivery', () => {
    expect(reminderDeliverySkipReason({
      session: baseSession,
      enrollment: { ...baseEnrollment, parentId: 'parent-2' },
      enrollmentId: 'enrollment-1',
      recipient: parent,
      sessionStartAtMs: startAtMs,
    })).toBe('parent_relationship_changed');
  });

  it('skips teacher reassignment immediately before delivery', () => {
    expect(reminderDeliverySkipReason({
      session: baseSession,
      enrollment: { ...baseEnrollment, teacherId: 'teacher-2' },
      enrollmentId: 'enrollment-1',
      recipient: teacher,
      sessionStartAtMs: startAtMs,
    })).toBe('teacher_assignment_changed');
  });

  it('skips a learning partner after notification opt-out', () => {
    expect(reminderDeliverySkipReason({
      session: baseSession,
      enrollment: {
        ...baseEnrollment,
        learningPartnerNotificationsEnabled: false,
      },
      enrollmentId: 'enrollment-1',
      recipient: {
        userId: 'lp-1',
        role: 'learningPartner',
        route: '/learning-partner/dashboard',
      },
      sessionStartAtMs: startAtMs,
    })).toBe('learning_partner_notifications_disabled');
  });

  it('uses verified labels when both are present and neutral wording otherwise', () => {
    expect(buildClassReminderBody({
      role: 'parent',
      startLabel: '3:45 pm',
      childLabel: 'Asha',
      courseLabel: 'Phonics',
    })).toBe("Asha's Phonics class starts at 3:45 pm. Tap to open Classes.");
    expect(buildClassReminderBody({
      role: 'teacher',
      startLabel: '3:45 pm',
      childLabel: null,
      courseLabel: null,
    })).toBe("Your class starts at 3:45 pm. Tap to open today's sessions.");
  });
});
