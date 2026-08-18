export const INDIA_TIME_ZONE = 'Asia/Kolkata';

export type DateLike =
  | Date
  | string
  | number
  | { toDate?: () => Date; seconds?: number; _seconds?: number }
  | null
  | undefined;

export type ServiceDateSource =
  | 'session.date'
  | 'session.startAt'
  | 'charge.serviceDate'
  | 'charge.sessionDate'
  | 'charge.legacySessionOrigin'
  | null;

export type CanonicalServiceDate = {
  serviceDate: string | null;
  serviceMonthKey: string | null;
  source: ServiceDateSource;
  usedLegacyChargeDate: boolean;
};

export type InvoiceChargeIntegrity =
  | 'VALID'
  | 'MONTH_MISMATCH'
  | 'SESSION_MISSING'
  | 'SERVICE_DATE_UNRESOLVED'
  | 'DUPLICATE_SESSION_CHARGE';

export type InvoiceChargeRow<TCharge extends Record<string, unknown>> = {
  charge: TCharge;
  serviceDate: string | null;
  serviceMonthKey: string | null;
  dateSource: ServiceDateSource;
  usedLegacyChargeDate: boolean;
  integrity: InvoiceChargeIntegrity;
};

const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const INACTIVE_CHARGE_STATUSES = new Set([
  'void',
  'cancelled',
  'canceled',
  'reversed',
  'refunded',
]);

function isValidYmd(value: unknown): value is string {
  if (typeof value !== 'string' || !YMD_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function toDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const parsed = value.toDate();
      return parsed instanceof Date && Number.isFinite(parsed.getTime()) ? parsed : null;
    }
    const seconds = Number(value.seconds ?? value._seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (isValidYmd(trimmed)) return new Date(`${trimmed}T00:00:00+05:30`);
    const parsed = new Date(trimmed);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  return null;
}

export function serviceDateFromTimestampIST(value: DateLike): string | null {
  const date = toDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
}

export function resolveServiceMonthKey(serviceDate: unknown): string | null {
  return isValidYmd(serviceDate) ? serviceDate.slice(0, 7) : null;
}

export function resolveCanonicalServiceDate(
  session: Record<string, unknown> | null | undefined,
  charge: Record<string, unknown> | null | undefined,
): CanonicalServiceDate {
  let serviceDate: string | null = null;
  let source: ServiceDateSource = null;

  if (isValidYmd(session?.date)) {
    serviceDate = session.date;
    source = 'session.date';
  } else {
    serviceDate = serviceDateFromTimestampIST(session?.startAt as DateLike);
    if (serviceDate) source = 'session.startAt';
  }

  if (!serviceDate && isValidYmd(charge?.serviceDate)) {
    serviceDate = charge.serviceDate;
    source = 'charge.serviceDate';
  }
  if (!serviceDate && isValidYmd(charge?.sessionDate)) {
    serviceDate = charge.sessionDate;
    source = 'charge.sessionDate';
  }

  // Explicitly supported legacy session-origin fields. createdAt/updatedAt/earnedAt
  // are intentionally absent: ledger timestamps are never service timestamps.
  if (!serviceDate) {
    const legacyValues = [charge?.chargeDate, charge?.date, charge?.startAt];
    for (const value of legacyValues) {
      const candidate = isValidYmd(value) ? value : serviceDateFromTimestampIST(value as DateLike);
      if (candidate) {
        serviceDate = candidate;
        source = 'charge.legacySessionOrigin';
        break;
      }
    }
  }

  return {
    serviceDate,
    serviceMonthKey: resolveServiceMonthKey(serviceDate),
    source,
    usedLegacyChargeDate: source === 'charge.legacySessionOrigin',
  };
}

export function isActiveBillingCharge(charge: Record<string, unknown>): boolean {
  return !INACTIVE_CHARGE_STATUSES.has(String(charge.status || '').trim().toLowerCase());
}

export function classifyInvoiceCharges<TCharge extends Record<string, unknown> & { id: string }>(args: {
  charges: TCharge[];
  sessionsById: Record<string, Record<string, unknown> | null | undefined>;
  selectedMonth: string;
}): InvoiceChargeRow<TCharge>[] {
  const { charges, sessionsById, selectedMonth } = args;
  if (!MONTH_PATTERN.test(selectedMonth)) return [];

  const activeBySession = new Map<string, number>();
  charges.forEach((charge) => {
    if (!isActiveBillingCharge(charge)) return;
    const sessionId = String(charge.sessionId || '').trim();
    if (sessionId) activeBySession.set(sessionId, (activeBySession.get(sessionId) || 0) + 1);
  });

  return charges.map((charge) => {
    const sessionId = String(charge.sessionId || '').trim();
    const hasSessionLookup = !!sessionId && Object.prototype.hasOwnProperty.call(sessionsById, sessionId);
    const session = hasSessionLookup ? sessionsById[sessionId] : null;
    // Invoice rows are stricter than diagnostics: only the linked class session
    // may establish the service date. Charge-side legacy dates remain useful for
    // anomaly reporting, but never make an invoice row valid.
    const resolved = resolveCanonicalServiceDate(session, null);
    let integrity: InvoiceChargeIntegrity;

    if (!sessionId || !session) integrity = 'SESSION_MISSING';
    else if (!resolved.serviceDate || !resolved.serviceMonthKey) integrity = 'SERVICE_DATE_UNRESOLVED';
    else if (String(charge.monthKey || '').trim() !== resolved.serviceMonthKey) integrity = 'MONTH_MISMATCH';
    else if ((activeBySession.get(sessionId) || 0) > 1) integrity = 'DUPLICATE_SESSION_CHARGE';
    else integrity = 'VALID';

    return {
      charge,
      serviceDate: resolved.serviceDate,
      serviceMonthKey: resolved.serviceMonthKey,
      dateSource: resolved.source,
      usedLegacyChargeDate: resolved.usedLegacyChargeDate,
      integrity,
    };
  });
}
