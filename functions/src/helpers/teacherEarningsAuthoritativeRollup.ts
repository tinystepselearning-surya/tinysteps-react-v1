import { normalizeFinancialStatus, normalizeLowerStatus } from './status';

const IST_OFFSET_MINUTES = 330;

export type TeacherEarningsLedgerRow = {
  id: string;
  data: Record<string, unknown>;
};

export type TeacherPayoutLedgerRow = {
  id: string;
  data: Record<string, unknown>;
};

export type TeacherMonthlyRollupPayment = {
  id: string;
  amount: number;
  date: string;
  status: string;
};

export type TeacherMonthlyRollupPayload = {
  month: string;
  totalEarnings: number;
  pendingEarnings: number;
  totalSessions: number;
  sessionsCompleted: number;
  demoEarnings: number;
  demoCompletedCount: number;
  demoEnrollmentBonusCount: number;
  payments: TeacherMonthlyRollupPayment[];
  rollupSource: 'teacherEarnings_events_v1';
  rollupVersion: 1;
};

const normalizeNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value) {
    const row = value as { toDate?: () => Date };
    if (typeof row.toDate === 'function') {
      const date = row.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const date = new Date(`${value}T00:00:00+05:30`);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const toMillis = (value: unknown): number | null => {
  const date = toDate(value);
  return date ? date.getTime() : null;
};

const dayKeyFromTimestampIST = (value: unknown): string | null => {
  const baseDate = toDate(value);
  if (!baseDate) return null;
  const istDate = new Date(baseDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resolveTeacherEarningPaidAmount = (
  data: Record<string, unknown>,
  baseAmount: number,
): number => {
  const paidRaw = Number(data.paidAmount);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(baseAmount, 0));
  }
  const status = normalizeFinancialStatus(data.status);
  if (status === 'paid' || status === 'settled') return Math.max(baseAmount, 0);
  return 0;
};

/**
 * Brick 4 keeps the original teacherEarnings.amount and paid cash history immutable.
 * Once a settled adjustment is posted, teacherPayNetEntitlementAmount becomes the
 * authoritative entitlement projection for finance totals while amount remains the
 * original contractual earning evidence.
 */
export const resolveTeacherEarningNetEntitlementAmount = (
  data: Record<string, unknown>,
): number => {
  const baseAmount = Math.max(normalizeNumber(data.amount, 0), 0);
  const adjustmentStatus = normalizeLowerStatus(data.teacherPayAdjustmentStatus);
  const netRaw = Number(data.teacherPayNetEntitlementAmount);
  if (
    adjustmentStatus === 'posted' &&
    data.teacherPayAdjustmentRequired === false &&
    Number.isFinite(netRaw) &&
    netRaw >= 0
  ) {
    return Number(netRaw);
  }
  return baseAmount;
};

const isSessionLinkedTeacherEarning = (data: Record<string, unknown>): boolean => {
  const source = normalizeLowerStatus(data.source);
  if (source === 'session_present_completed') return true;
  return Boolean(String(data.sessionId || '').trim());
};

const isDemoTeacherEarningSource = (value: unknown): boolean => {
  const source = normalizeLowerStatus(value);
  return source === 'demo_completed' || source === 'demo_enrolled_bonus';
};

type TeacherEarningCandidate = {
  id: string;
  data: Record<string, unknown>;
  status: string;
  source: string;
  sessionId: string;
  sortMs: number;
};

const pickPreferredSessionCandidate = (
  current: TeacherEarningCandidate,
  incoming: TeacherEarningCandidate,
): TeacherEarningCandidate => {
  const currentCanonical = current.id === current.sessionId;
  const incomingCanonical = incoming.id === incoming.sessionId;
  if (currentCanonical !== incomingCanonical) return incomingCanonical ? incoming : current;

  if ((current.status === 'void') !== (incoming.status === 'void')) {
    return incoming.status === 'void' ? current : incoming;
  }

  return incoming.sortMs > current.sortMs ? incoming : current;
};

/**
 * Pure parity calculator for the authoritative teacher-month rollup.
 *
 * Archived rows are ignored, session-linked duplicates prefer canonical document ids, non-void
 * rows beat void rows, latest timestamp breaks remaining ties, and payout history keeps the five
 * most recent active payout rows. Brick 4 additionally applies a posted net-entitlement projection
 * without rewriting the original earning amount or paid cash history.
 */
export const computeTeacherMonthlyRollupPayload = (input: {
  monthKey: string;
  earnings: TeacherEarningsLedgerRow[];
  payouts: TeacherPayoutLedgerRow[];
}): TeacherMonthlyRollupPayload => {
  const activeEarnings = input.earnings.filter((row) => row.data.archived !== true);
  const activePayouts = input.payouts.filter((row) => row.data.archived !== true);

  const standaloneCandidates: TeacherEarningCandidate[] = [];
  const sessionCandidates = new Map<string, TeacherEarningCandidate>();

  for (const row of activeEarnings) {
    const earning = row.data;
    const status = normalizeFinancialStatus(earning.status);
    const source = normalizeLowerStatus(earning.source);
    const sessionId = String(earning.sessionId || '').trim();
    const sortMs =
      toMillis(earning.updatedAt) ||
      toMillis(earning.earnedAt) ||
      toMillis(earning.createdAt) ||
      0;
    const candidate: TeacherEarningCandidate = {
      id: row.id,
      data: earning,
      status,
      source,
      sessionId,
      sortMs,
    };

    if (sessionId && isSessionLinkedTeacherEarning(earning)) {
      const existing = sessionCandidates.get(sessionId);
      sessionCandidates.set(
        sessionId,
        existing ? pickPreferredSessionCandidate(existing, candidate) : candidate,
      );
      continue;
    }

    standaloneCandidates.push(candidate);
  }

  const selectedCandidates = [
    ...standaloneCandidates,
    ...Array.from(sessionCandidates.values()),
  ].filter((candidate) => candidate.status !== 'void');

  let totalEarnings = 0;
  let pendingEarnings = 0;
  let totalSessions = 0;
  let sessionsCompleted = 0;
  let demoEarnings = 0;
  let demoCompletedCount = 0;
  let demoEnrollmentBonusCount = 0;

  for (const candidate of selectedCandidates) {
    const baseAmount = Math.max(normalizeNumber(candidate.data.amount, 0), 0);
    const entitlementAmount = resolveTeacherEarningNetEntitlementAmount(candidate.data);
    const paidAmount = resolveTeacherEarningPaidAmount(candidate.data, baseAmount);
    const pendingAmount = Math.max(entitlementAmount - paidAmount, 0);

    totalEarnings += entitlementAmount;
    pendingEarnings += pendingAmount;

    if (isSessionLinkedTeacherEarning(candidate.data)) {
      totalSessions += 1;
      sessionsCompleted += 1;
    }

    if (isDemoTeacherEarningSource(candidate.source)) {
      demoEarnings += entitlementAmount;
      if (candidate.source === 'demo_completed') demoCompletedCount += 1;
      if (candidate.source === 'demo_enrolled_bonus') demoEnrollmentBonusCount += 1;
    }
  }

  const payments = activePayouts
    .map((row) => {
      const payout = row.data;
      const paidAtMs =
        toMillis(payout.paidAt) ||
        toMillis(payout.updatedAt) ||
        toMillis(payout.createdAt) ||
        0;
      return {
        id: row.id,
        amount: Math.max(normalizeNumber(payout.amount, 0), 0),
        date:
          String(payout.date || '').trim() ||
          dayKeyFromTimestampIST(payout.paidAt) ||
          'unknown',
        status: normalizeFinancialStatus(payout.status) || 'completed',
        paidAtMs,
      };
    })
    .sort((a, b) => b.paidAtMs - a.paidAtMs)
    .slice(0, 5)
    .map(({ id, amount, date, status }) => ({ id, amount, date, status }));

  return {
    month: input.monthKey,
    totalEarnings,
    pendingEarnings,
    totalSessions,
    sessionsCompleted,
    demoEarnings,
    demoCompletedCount,
    demoEnrollmentBonusCount,
    payments,
    rollupSource: 'teacherEarnings_events_v1',
    rollupVersion: 1,
  };
};
