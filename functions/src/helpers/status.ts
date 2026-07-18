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

export type ManualSessionState = 'approved' | 'cancelled' | 'withdrawn' | 'completed';

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

export function normalizeEnrollmentStatus(value: unknown): EnrollmentStatus {
  const raw = normalizeLowerStatus(value);
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment') return 'active';
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
