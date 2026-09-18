import {describe, expect, it} from 'vitest';
import {
  doesEnrollmentOccupyCourseSlot,
  isEnrollmentOperationallyActive,
  normalizeEnrollmentStatus,
  resolveEnrollmentSchedulingLifecycleState,
} from '../../lib/scheduling/enrollmentSchedulingStatus';
import {
  doesEnrollmentOccupyCourseSlot as integrityDoesEnrollmentOccupyCourseSlot,
  isEnrollmentOperationallyActive as integrityIsEnrollmentOperationallyActive,
  normalizeEnrollmentStatusForOperations,
} from '../../lib/sessionScheduleIntegrity';
import {resolveRollingScheduleLifecycleState} from '../../lib/scheduling/enrollmentRollingScheduleContract';

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

describe('canonical enrollment scheduling status contract', () => {
  it.each(ACTIVE_ALIASES)('treats %j as scheduling-active', (status) => {
    const enrollment = {status};
    expect(resolveEnrollmentSchedulingLifecycleState(enrollment)).toBe('active');
    expect(isEnrollmentOperationallyActive(enrollment)).toBe(true);
    expect(resolveRollingScheduleLifecycleState(enrollment)).toBe('active');
    expect(integrityIsEnrollmentOperationallyActive(enrollment)).toBe(true);
  });

  it('normalizes all supported active aliases through one public contract', () => {
    expect(normalizeEnrollmentStatus('pending_teacher')).toBe('trial');
    expect(normalizeEnrollmentStatus('pending_payment')).toBe('active');
    expect(normalizeEnrollmentStatus('pending_lp')).toBe('active');
    expect(normalizeEnrollmentStatus('pending_lp_assignment')).toBe('active');
    expect(normalizeEnrollmentStatusForOperations('pending_lp_assignment')).toBe('active');
  });

  it('keeps paused non-operational while reserving the child/course slot', () => {
    const enrollment = {status: 'paused'};
    expect(resolveEnrollmentSchedulingLifecycleState(enrollment)).toBe('paused');
    expect(isEnrollmentOperationallyActive(enrollment)).toBe(false);
    expect(resolveRollingScheduleLifecycleState(enrollment)).toBe('paused');
    expect(doesEnrollmentOccupyCourseSlot(enrollment)).toBe(true);
    expect(integrityDoesEnrollmentOccupyCourseSlot(enrollment)).toBe(true);
  });

  it.each(TERMINAL_ALIASES)('treats %s as terminal and releases course identity', (status) => {
    const enrollment = {status};
    expect(resolveEnrollmentSchedulingLifecycleState(enrollment)).toBe('terminal');
    expect(isEnrollmentOperationallyActive(enrollment)).toBe(false);
    expect(resolveRollingScheduleLifecycleState(enrollment)).toBe('terminal');
    expect(doesEnrollmentOccupyCourseSlot(enrollment)).toBe(false);
  });

  it('fails closed for unknown scheduling status but still reserves the course identity', () => {
    const enrollment = {status: 'future_unreviewed_status'};
    expect(resolveEnrollmentSchedulingLifecycleState(enrollment)).toBe('inactive');
    expect(isEnrollmentOperationallyActive(enrollment)).toBe(false);
    expect(resolveRollingScheduleLifecycleState(enrollment)).toBe('inactive');
    expect(doesEnrollmentOccupyCourseSlot(enrollment)).toBe(true);
  });

  it('honors every archival marker before status normalization', () => {
    for (const enrollment of [
      {status: 'active', archived: true},
      {status: 'active', isArchived: true},
      {status: 'active', archivedAt: '2026-09-18'},
    ]) {
      expect(resolveEnrollmentSchedulingLifecycleState(enrollment)).toBe('terminal');
      expect(isEnrollmentOperationallyActive(enrollment)).toBe(false);
      expect(resolveRollingScheduleLifecycleState(enrollment)).toBe('terminal');
      expect(doesEnrollmentOccupyCourseSlot(enrollment)).toBe(false);
    }
  });
});
