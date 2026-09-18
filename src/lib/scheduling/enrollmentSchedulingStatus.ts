/**
 * Browser scheduling-only enrollment lifecycle contract.
 *
 * Keep this aligned with
 * functions/src/scheduling/enrollmentSchedulingStatus.ts. It is deliberately
 * isolated from src/lib/statuses.ts so scheduling aliases do not alter
 * unrelated admin/analytics status behavior.
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

export const normalizeEnrollmentStatus = (
  value: unknown,
): SchedulingEnrollmentStatus => {
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
};

export const resolveEnrollmentSchedulingLifecycleState = (
  enrollmentLike: Record<string, unknown> | null | undefined,
): EnrollmentSchedulingLifecycleState => {
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
};

export const isEnrollmentOperationallyActive = (
  enrollmentLike: Record<string, unknown> | null | undefined,
): boolean =>
  resolveEnrollmentSchedulingLifecycleState(enrollmentLike) === 'active';

export const doesEnrollmentOccupyCourseSlot = (
  enrollmentLike: Record<string, unknown> | null | undefined,
): boolean => {
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
};
