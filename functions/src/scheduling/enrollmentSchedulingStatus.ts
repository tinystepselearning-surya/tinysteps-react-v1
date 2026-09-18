/**
 * Scheduling-only enrollment lifecycle contract.
 *
 * This module deliberately does not extend functions/src/helpers/status.ts.
 * The shared helper is consumed by finance, demo, attendance, and payment
 * functions; scheduling aliases must not widen those unrelated deployment
 * surfaces or silently change their business semantics.
 */
export type SchedulingEnrollmentStatus =
  | 'active'
  | 'trial'
  | 'paused'
  | 'completed'
  | 'discontinued'
  | 'expired'
  | 'cancelled'
  | 'archived'
  | 'inactive'
  | 'unknown';

export type EnrollmentSchedulingLifecycleState =
  | 'active'
  | 'paused'
  | 'terminal'
  | 'inactive';

const OPERATIONAL_ENROLLMENT_STATUSES =
  new Set<SchedulingEnrollmentStatus>(['active', 'trial']);

const TERMINAL_ENROLLMENT_STATUSES =
  new Set<SchedulingEnrollmentStatus>([
    'completed',
    'discontinued',
    'expired',
    'cancelled',
    'archived',
    'inactive',
  ]);

const normalizeLowerStatus = (value: unknown): string =>
  String(value || '').trim().toLowerCase();

/**
 * Canonical normalization only for scheduling/materialization decisions.
 */
export function normalizeEnrollmentStatus(
  value: unknown,
): SchedulingEnrollmentStatus {
  const raw = normalizeLowerStatus(value);
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (
    raw === 'pending_payment' ||
    raw === 'pending_lp' ||
    raw === 'pending_lp_assignment'
  ) {
    return 'active';
  }
  if (
    raw === 'enrolled' ||
    raw === 'current' ||
    raw === 'ongoing'
  ) {
    return 'active';
  }
  if (raw === 'canceled') return 'cancelled';
  if (
    raw === 'active' ||
    raw === 'trial' ||
    raw === 'paused' ||
    raw === 'completed' ||
    raw === 'discontinued' ||
    raw === 'expired' ||
    raw === 'cancelled' ||
    raw === 'archived' ||
    raw === 'inactive'
  ) {
    return raw;
  }
  return 'unknown';
}

export function resolveEnrollmentSchedulingLifecycleState(
  enrollmentLike: Record<string, unknown> | null | undefined,
): EnrollmentSchedulingLifecycleState {
  if (!enrollmentLike) return 'inactive';
  if (
    enrollmentLike.archivedAt ||
    enrollmentLike.archived === true ||
    enrollmentLike.isArchived === true
  ) {
    return 'terminal';
  }

  const normalized = normalizeEnrollmentStatus(enrollmentLike.status);
  if (normalized === 'paused') return 'paused';
  if (TERMINAL_ENROLLMENT_STATUSES.has(normalized)) return 'terminal';
  if (OPERATIONAL_ENROLLMENT_STATUSES.has(normalized)) return 'active';
  return 'inactive';
}

export function isEnrollmentOperationallyActive(
  enrollmentLike: Record<string, unknown> | null | undefined,
): boolean {
  return resolveEnrollmentSchedulingLifecycleState(enrollmentLike) === 'active';
}

/**
 * Paused and unknown non-terminal states keep the child/course reservation.
 * Only explicit terminal/archive states release it.
 */
export function doesEnrollmentOccupyCourseSlot(
  enrollmentLike: Record<string, unknown> | null | undefined,
): boolean {
  if (!enrollmentLike) return false;
  if (
    enrollmentLike.archivedAt ||
    enrollmentLike.archived === true ||
    enrollmentLike.isArchived === true
  ) {
    return false;
  }
  return !TERMINAL_ENROLLMENT_STATUSES.has(
    normalizeEnrollmentStatus(enrollmentLike.status),
  );
}
