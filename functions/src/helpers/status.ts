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
  | 'unknown';

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
    raw === 'cancelled'
  ) {
    return raw;
  }
  return 'unknown';
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
