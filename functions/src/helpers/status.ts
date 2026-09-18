export type EnrollmentStatus =
  | 'active'
  | 'trial'
  | 'paused'
  | 'pending_teacher'
  | 'pending_payment'
  | 'completed'
  | 'discontinued'
  | 'expired'
  | 'cancelled'
  | 'archived'
  | 'inactive'
  | 'unknown';

export type EnrollmentSchedulingLifecycleState = 'active' | 'paused' | 'terminal' | 'inactive';
export type ManualSessionState = 'approved' | 'cancelled' | 'withdrawn' | 'completed';

const OPERATIONAL_ENROLLMENT_STATUSES = new Set<EnrollmentStatus>(['active', 'trial']);
const TERMINAL_ENROLLMENT_STATUSES = new Set<EnrollmentStatus>([
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'archived',
  'inactive',
]);

export function normalizeLowerStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

/**
 * Canonical Brick 6 financial attendance policy.
 * Present and Late both mean the class was delivered and therefore earn
 * parent billing + normal teacher entitlement. Attendance quality remains
 * distinct; this helper must not rewrite the stored attendance label.
 */
export function isFinanciallyEarnedAttendanceStatus(value: unknown): boolean {
  const status = normalizeLowerStatus(value);
  return status === 'present' || status === 'late';
}

/**
 * Canonical enrollment-status normalization for operational scheduling.
 *
 * Keep this mapping aligned with src/lib/statuses.ts. A parity test
 * intentionally guards the browser and Cloud Functions runtime boundaries.
 */
export function normalizeEnrollmentStatus(value: unknown): EnrollmentStatus {
  const raw = normalizeLowerStatus(value);
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  if (
    raw === 'active' ||
    raw === 'trial' ||
    raw === 'paused' ||
    raw === 'pending_teacher' ||
    raw === 'pending_payment' ||
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
  if (enrollmentLike.archivedAt || enrollmentLike.archived === true || enrollmentLike.isArchived === true) {
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

export function doesEnrollmentOccupyCourseSlot(enrollmentLike: Record<string, unknown> | undefined): boolean {
  if (!enrollmentLike) return false;
  if (enrollmentLike.archivedAt || enrollmentLike.archived === true || enrollmentLike.isArchived === true) {
    return false;
  }
  return !TERMINAL_ENROLLMENT_STATUSES.has(normalizeEnrollmentStatus(enrollmentLike.status));
}

export function normalizeManualSessionState(value: unknown): ManualSessionState | null {
  const raw = normalizeLowerStatus(value);
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'approved' || raw === 'cancelled' || raw === 'withdrawn' || raw === 'completed') {
    return raw;
  }
  return null;
}

export function normalizeSessionStatus(value: unknown): string {
  const raw = normalizeLowerStatus(value);
  if (!raw) return 'scheduled';
  if (raw === 'inprogress') return 'in_progress';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

export function normalizeFinancialStatus(value: unknown): string {
  const raw = normalizeLowerStatus(value);
  if (!raw) return '';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'settled') return 'paid';
  return raw;
}

export function normalizeDemoStatus(value: unknown): string {
  const raw = normalizeLowerStatus(value);
  if (!raw) return 'open';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'inprogress') return 'assigned';
  return raw;
}
