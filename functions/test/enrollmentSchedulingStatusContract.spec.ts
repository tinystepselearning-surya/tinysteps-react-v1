import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  doesEnrollmentOccupyCourseSlot,
  isEnrollmentOperationallyActive,
  normalizeEnrollmentStatus,
  resolveEnrollmentSchedulingLifecycleState,
} from '../src/scheduling/enrollmentSchedulingStatus';
import {buildRollingMaterializationPlan} from '../src/scheduling/rollingScheduleMaterializer';
import {isOperationalEnrollmentForRollingRepair} from '../src/scheduling/rollingScheduleRepair';

const ACTIVE_ALIASES = [
  '',
  'active',
  'trial',
  'enrolled',
  'current',
  'ongoing',
  'pending_teacher',
  'pending_payment',
  'pending_lp',
  'pending_lp_assignment',
];

const TERMINAL_ALIASES = [
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'canceled',
  'archived',
  'inactive',
];

const schedulableEnrollment = (status: string): Record<string, unknown> => ({
  status,
  kidId: 'kid-1',
  parentId: 'parent-1',
  teacherId: 'teacher-1',
  courseId: 'course-1',
  feePerClass: 400,
  classesStartDateYmd: '2026-09-01',
  schedule: {
    timezone: 'Asia/Kolkata',
    revision: 1,
    weeklySlots: [{weekday: 1, time: '10:00', durationMinutes: 35}],
  },
});

describe('functions canonical enrollment scheduling status contract', () => {
  it.each(ACTIVE_ALIASES)('treats %j as operational for materializer and repair', (status) => {
    const enrollment = schedulableEnrollment(status);
    expect(isEnrollmentOperationallyActive(enrollment)).toBe(true);
    expect(resolveEnrollmentSchedulingLifecycleState(enrollment)).toBe('active');
    expect(isOperationalEnrollmentForRollingRepair(enrollment)).toBe(true);
    expect(() => buildRollingMaterializationPlan({
      enrollmentId: 'enr-1',
      enrollment,
      anchorYmd: '2026-09-18',
    })).not.toThrow();
  });

  it('normalizes the previously divergent pending LP aliases', () => {
    expect(normalizeEnrollmentStatus('pending_lp')).toBe('active');
    expect(normalizeEnrollmentStatus('pending_lp_assignment')).toBe('active');
  });

  it('keeps paused non-operational but course-reserving', () => {
    const enrollment = schedulableEnrollment('paused');
    expect(resolveEnrollmentSchedulingLifecycleState(enrollment)).toBe('paused');
    expect(isEnrollmentOperationallyActive(enrollment)).toBe(false);
    expect(isOperationalEnrollmentForRollingRepair(enrollment)).toBe(false);
    expect(doesEnrollmentOccupyCourseSlot(enrollment)).toBe(true);
    expect(() => buildRollingMaterializationPlan({
      enrollmentId: 'enr-1',
      enrollment,
      anchorYmd: '2026-09-18',
    })).toThrow(/not operationally active/);
  });

  it.each(TERMINAL_ALIASES)('treats %s as terminal and non-schedulable', (status) => {
    const enrollment = schedulableEnrollment(status);
    expect(resolveEnrollmentSchedulingLifecycleState(enrollment)).toBe('terminal');
    expect(isEnrollmentOperationallyActive(enrollment)).toBe(false);
    expect(isOperationalEnrollmentForRollingRepair(enrollment)).toBe(false);
    expect(doesEnrollmentOccupyCourseSlot(enrollment)).toBe(false);
  });

  it('fails closed for an unknown status', () => {
    const enrollment = schedulableEnrollment('future_unreviewed_status');
    expect(normalizeEnrollmentStatus(enrollment.status)).toBe('unknown');
    expect(resolveEnrollmentSchedulingLifecycleState(enrollment)).toBe('inactive');
    expect(isEnrollmentOperationallyActive(enrollment)).toBe(false);
    expect(isOperationalEnrollmentForRollingRepair(enrollment)).toBe(false);
    expect(doesEnrollmentOccupyCourseSlot(enrollment)).toBe(true);
  });

  it('keeps scheduling aliases isolated from the globally shared status helper', () => {
    const materializer = readFileSync(resolve(process.cwd(), 'functions/src/scheduling/rollingScheduleMaterializer.ts'), 'utf8');
    const repair = readFileSync(resolve(process.cwd(), 'functions/src/scheduling/rollingScheduleRepair.ts'), 'utf8');
    const sharedStatus = readFileSync(resolve(process.cwd(), 'functions/src/helpers/status.ts'), 'utf8');
    expect(materializer).not.toContain('ACTIVE_STATUS_ALIASES');
    expect(repair).not.toContain('ACTIVE_STATUS_ALIASES');
    expect(materializer).toContain('enrollmentSchedulingStatus');
    expect(repair).toContain('enrollmentSchedulingStatus');
    expect(sharedStatus).not.toContain('pending_lp_assignment');
    expect(sharedStatus).not.toContain('resolveEnrollmentSchedulingLifecycleState');
  });
});
