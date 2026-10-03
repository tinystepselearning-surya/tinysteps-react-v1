export type EnrollmentSchedulingLifecycleState = 'active' | 'paused' | 'terminal' | 'inactive';

const OPERATIONAL_ENROLLMENT_STATUSES = new Set(['active', 'trial']);
const TERMINAL_ENROLLMENT_STATUSES = new Set([
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'archived',
  'inactive',
]);

export const normalizeLowerStatus = (value: unknown): string =>
  String(value || '').trim().toLowerCase();

/**
 * Canonical enrollment-status normalization for operational scheduling.
 *
 * Keep this mapping aligned with functions/src/helpers/status.ts. A parity test
 * intentionally guards the browser and Cloud Functions runtime boundaries.
 */
export const normalizeEnrollmentStatus = (value: unknown): string => {
  const raw = normalizeLowerStatus(value);
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
};

export const resolveEnrollmentSchedulingLifecycleState = (
  enrollmentLike: Record<string, unknown> | null | undefined,
): EnrollmentSchedulingLifecycleState => {
  if (!enrollmentLike) return 'inactive';
  if (enrollmentLike.archivedAt || enrollmentLike.archived === true || enrollmentLike.isArchived === true) {
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
): boolean => resolveEnrollmentSchedulingLifecycleState(enrollmentLike) === 'active';

/**
 * Paused and unknown non-terminal states continue to reserve the child/course
 * pair. Only an explicit terminal/archive state releases that identity.
 */
export const doesEnrollmentOccupyCourseSlot = (
  enrollmentLike: Record<string, unknown> | null | undefined,
): boolean => {
  if (!enrollmentLike) return false;
  if (enrollmentLike.archivedAt || enrollmentLike.archived === true || enrollmentLike.isArchived === true) {
    return false;
  }
  return !TERMINAL_ENROLLMENT_STATUSES.has(normalizeEnrollmentStatus(enrollmentLike.status));
};

export const normalizeDemoStatus = (value: unknown): string => {
  const raw = normalizeLowerStatus(value);
  if (!raw) return 'open';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'inprogress') return 'assigned';
  return raw;
};

export const normalizeFinanceStatus = (value: unknown): string => {
  const raw = normalizeLowerStatus(value);
  if (!raw) return '';
  if (raw === 'settled') return 'paid';
  if (raw === 'canceled') return 'cancelled';
  return raw;
};

export const formatStatusLabel = (value: unknown): string => {
  const normalized = normalizeLowerStatus(value);
  if (!normalized) return '—';
  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};
