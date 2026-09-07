export const TEACHER_PAYOUT_SCHEMA_VERSION = 2;
export const TEACHER_PAYOUT_PERIOD_SEMANTICS = 'earning_month_separate_from_payment_date';

const IST_OFFSET_MINUTES = 330;

export type TeacherPayoutPeriod = {
  earningMonthKey: string;
  monthKey: string;
  paymentMonthKey: string;
  paymentDate: string;
};

function clean(value: unknown, maxLen = 160): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

export function normalizeTeacherEarningMonthKey(value: unknown): string | null {
  const raw = clean(value, 20);
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : null;
}

export function monthKeyFromDateIST(value: Date): string {
  const ist = new Date(value.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function dayKeyFromDateIST(value: Date): string {
  const ist = new Date(value.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`;
}

export function parseTeacherPayoutPaidAt(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parsed = new Date(`${raw}T12:00:00+05:30`);
      if (Number.isNaN(parsed.getTime()) || dayKeyFromDateIST(parsed) !== raw) return null;
      return parsed;
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: unknown };
    if (typeof candidate.toDate === 'function') {
      const parsed = candidate.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }
    const seconds = Number(candidate.seconds);
    if (Number.isFinite(seconds)) {
      const parsed = new Date(seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  return null;
}

export function buildTeacherPayoutPeriod(args: {
  earningMonthKey: unknown;
  paidAt: unknown;
}): TeacherPayoutPeriod | null {
  const earningMonthKey = normalizeTeacherEarningMonthKey(args.earningMonthKey);
  const paidAt = parseTeacherPayoutPaidAt(args.paidAt);
  if (!earningMonthKey || !paidAt) return null;

  return {
    earningMonthKey,
    // Legacy compatibility: all pre-Brick-5 teacher payment screens and rollups use monthKey
    // as the earning/service month. Keep that meaning stable; do not repurpose it to cash month.
    monthKey: earningMonthKey,
    paymentMonthKey: monthKeyFromDateIST(paidAt),
    paymentDate: dayKeyFromDateIST(paidAt),
  };
}

export function resolvePayoutEarningMonthKey(row: Record<string, unknown>): string | null {
  return normalizeTeacherEarningMonthKey(row.earningMonthKey) || normalizeTeacherEarningMonthKey(row.monthKey);
}

export function resolveTeacherEarningCashAllocatedAmount(
  earning: Record<string, unknown>,
  entitlementAmount: number,
): number {
  const entitlement = Number.isFinite(entitlementAmount) && entitlementAmount > 0 ? entitlementAmount : 0;
  const explicit = Number(earning.paidAmount);
  if (Number.isFinite(explicit) && explicit > 0) {
    return Math.min(Math.max(explicit, 0), entitlement);
  }
  const status = clean(earning.status, 80).toLowerCase();
  if (status === 'paid' || status === 'settled') return entitlement;
  return 0;
}
