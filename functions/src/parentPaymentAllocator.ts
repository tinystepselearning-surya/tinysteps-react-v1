const IST_OFFSET_MINUTES = 330;

const EXCLUDED_BILLING_CHARGE_STATUSES = new Set([
  'void',
  'cancelled',
  'canceled',
  'reversed',
  'refunded',
]);

export interface BillingChargeDocLike {
  id: string;
  data: Record<string, unknown>;
}

export interface ParentPaymentChargeCandidate {
  chargeId: string;
  monthKey: string | null;
  sortMonthKey: string | null;
  eventDateMs: number | null;
  eventDateKey: string | null;
  createdAtMs: number | null;
  chargeAmount: number;
  previousPaidAmount: number;
  outstandingAmount: number;
  enrollmentId: string | null;
  kidId: string | null;
  courseId: string | null;
  studentName: string | null;
  classSessionId: string | null;
}

export interface ParentPaymentAllocationPreview {
  sequence: number;
  chargeId: string;
  monthKey: string | null;
  eventDateKey: string | null;
  chargeAmount: number;
  previousPaidAmount: number;
  outstandingBefore: number;
  allocatedAmount: number;
  remainingDueAfter: number;
  enrollmentId: string | null;
  kidId: string | null;
  courseId: string | null;
  studentName: string | null;
  classSessionId: string | null;
}

export interface ParentPaymentAllocationPlan {
  chargesScanned: number;
  chargesIncluded: number;
  outstandingBefore: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  walletTopupAmount: number;
  allocations: ParentPaymentAllocationPreview[];
  warnings: string[];
}

function normalizeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    const parsed = (value as { toDate: () => unknown }).toDate();
    if (parsed instanceof Date && !isNaN(parsed.getTime())) return parsed;
    return null;
  }
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parsed = new Date(`${raw}T00:00:00+05:30`);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function monthKeyFromDateIST(date: Date): string {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function dayKeyFromDateIST(date: Date): string {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeOptionalText(value: unknown, maxLength = 150): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  return raw.slice(0, maxLength);
}

function normalizeMonthKey(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!/^\d{4}-\d{2}$/.test(raw)) return null;
  return raw;
}

function normalizeChargeStatus(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!raw) return '';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'settled') return 'paid';
  return raw;
}

function isSettledChargeStatus(status: string): boolean {
  return status === 'paid' || status === 'settled';
}

function isExcludedBillingChargeStatus(status: string): boolean {
  return EXCLUDED_BILLING_CHARGE_STATUSES.has(status);
}

function resolveChargeEventDateMs(data: Record<string, unknown>): number | null {
  const candidates: unknown[] = [
    data.chargeDate,
    data.date,
    data.sessionDate,
    data.startAt,
    data.endAt,
  ];
  for (const value of candidates) {
    const parsed = toDate(value);
    if (parsed) return parsed.getTime();
  }
  return null;
}

function resolveChargeCreatedAtMs(data: Record<string, unknown>): number | null {
  const candidates: unknown[] = [data.createdAt, data.updatedAt];
  for (const value of candidates) {
    const parsed = toDate(value);
    if (parsed) return parsed.getTime();
  }
  return null;
}

function resolveChargePaidAmount(data: Record<string, unknown>, amount: number): number {
  const paidRaw = Number(data.paidAmount);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }

  const outstandingRaw = Number(data.outstandingAmount);
  if (Number.isFinite(outstandingRaw) && outstandingRaw >= 0) {
    const outstanding = Math.min(Math.max(outstandingRaw, 0), Math.max(amount, 0));
    return roundCurrency(Math.max(amount - outstanding, 0));
  }

  const status = normalizeChargeStatus(data.status);
  if (isSettledChargeStatus(status)) {
    return Math.max(amount, 0);
  }
  return 0;
}

function resolveClassSessionId(chargeId: string, data: Record<string, unknown>): string | null {
  const direct =
    normalizeOptionalText(data.classSessionId, 150) ||
    normalizeOptionalText(data.sessionId, 150);
  if (direct) return direct;
  const source = normalizeOptionalText(data.source, 150);
  if (source === 'session_present_completed') return chargeId;
  return null;
}

function resolveStudentName(data: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    data.kidName,
    data.studentName,
    data.childName,
    data.kidDisplayName,
    data.studentDisplayName,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeOptionalText(candidate, 150);
    if (normalized) return normalized;
  }
  return null;
}

export function normalizeParentPaymentChargeCandidates(entries: BillingChargeDocLike[]): {
  candidates: ParentPaymentChargeCandidate[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const pushWarning = (message: string) => {
    if (warnings.length < 150) warnings.push(message);
  };

  const candidates: ParentPaymentChargeCandidate[] = [];
  for (const entry of entries) {
    const data = entry.data || {};
    if (data.archived === true) continue;

    const status = normalizeChargeStatus(data.status);
    if (isExcludedBillingChargeStatus(status)) continue;

    const amountRaw = Number(data.amount);
    if (!Number.isFinite(amountRaw)) {
      pushWarning(`charge ${entry.id}: missing/invalid amount, treated as 0`);
    }
    const chargeAmount = Math.max(normalizeNumber(data.amount, 0), 0);
    if (chargeAmount <= 0) continue;

    if (
      !Number.isFinite(Number(data.paidAmount)) &&
      !Number.isFinite(Number(data.outstandingAmount))
    ) {
      pushWarning(
        `charge ${entry.id}: missing/invalid paidAmount and outstandingAmount, resolved using status fallback`
      );
    }

    const previousPaidAmount = resolveChargePaidAmount(data, chargeAmount);
    const outstandingAmount = roundCurrency(Math.max(chargeAmount - previousPaidAmount, 0));
    if (outstandingAmount <= 0) continue;

    const eventDateMs = resolveChargeEventDateMs(data);
    const eventDate = eventDateMs ? new Date(eventDateMs) : null;
    const monthKey = normalizeMonthKey(data.monthKey);
    const sortMonthKey = monthKey || (eventDate ? monthKeyFromDateIST(eventDate) : null);

    candidates.push({
      chargeId: entry.id,
      monthKey,
      sortMonthKey,
      eventDateMs,
      eventDateKey: eventDate ? dayKeyFromDateIST(eventDate) : null,
      createdAtMs: resolveChargeCreatedAtMs(data),
      chargeAmount,
      previousPaidAmount,
      outstandingAmount,
      enrollmentId: normalizeOptionalText(data.enrollmentId, 150),
      kidId:
        normalizeOptionalText(data.kidId, 150) || normalizeOptionalText(data.studentId, 150),
      courseId: normalizeOptionalText(data.courseId, 150),
      studentName: resolveStudentName(data),
      classSessionId: resolveClassSessionId(entry.id, data),
    });
  }

  candidates.sort((left, right) => {
    const leftMonth = left.sortMonthKey || '9999-99';
    const rightMonth = right.sortMonthKey || '9999-99';
    if (leftMonth !== rightMonth) return leftMonth.localeCompare(rightMonth);

    const leftEvent = left.eventDateMs ?? Number.MAX_SAFE_INTEGER;
    const rightEvent = right.eventDateMs ?? Number.MAX_SAFE_INTEGER;
    if (leftEvent !== rightEvent) return leftEvent - rightEvent;

    const leftCreated = left.createdAtMs ?? Number.MAX_SAFE_INTEGER;
    const rightCreated = right.createdAtMs ?? Number.MAX_SAFE_INTEGER;
    if (leftCreated !== rightCreated) return leftCreated - rightCreated;

    return left.chargeId.localeCompare(right.chargeId);
  });

  return { candidates, warnings };
}

export function buildParentPaymentAllocationPlan(
  entries: BillingChargeDocLike[],
  amountReceived: number
): ParentPaymentAllocationPlan {
  const normalizedAmount = Math.max(roundCurrency(amountReceived), 0);
  const { candidates, warnings } = normalizeParentPaymentChargeCandidates(entries);
  const chargesScanned = entries.length;
  const chargesIncluded = candidates.length;
  const outstandingBefore = roundCurrency(
    candidates.reduce((sum, item) => sum + item.outstandingAmount, 0)
  );

  let remaining = normalizedAmount;
  const allocations: ParentPaymentAllocationPreview[] = [];

  candidates.forEach((candidate) => {
    if (remaining <= 0) return;
    const allocatedAmount = roundCurrency(Math.min(remaining, candidate.outstandingAmount));
    if (allocatedAmount <= 0) return;
    remaining = roundCurrency(remaining - allocatedAmount);
    allocations.push({
      sequence: allocations.length + 1,
      chargeId: candidate.chargeId,
      monthKey: candidate.monthKey,
      eventDateKey: candidate.eventDateKey,
      chargeAmount: candidate.chargeAmount,
      previousPaidAmount: candidate.previousPaidAmount,
      outstandingBefore: candidate.outstandingAmount,
      allocatedAmount,
      remainingDueAfter: roundCurrency(candidate.outstandingAmount - allocatedAmount),
      enrollmentId: candidate.enrollmentId,
      kidId: candidate.kidId,
      courseId: candidate.courseId,
      studentName: candidate.studentName,
      classSessionId: candidate.classSessionId,
    });
  });

  const allocatedAmount = roundCurrency(normalizedAmount - remaining);
  const unallocatedAmount = roundCurrency(Math.max(remaining, 0));

  return {
    chargesScanned,
    chargesIncluded,
    outstandingBefore,
    allocatedAmount,
    unallocatedAmount,
    walletTopupAmount: unallocatedAmount,
    allocations,
    warnings,
  };
}
