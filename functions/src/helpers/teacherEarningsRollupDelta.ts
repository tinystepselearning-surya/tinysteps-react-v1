export type TeacherMonthRollupTarget = {
  teacherId: string;
  monthKey: string;
};

export type TeacherEarningsContribution = {
  totalEarnings: number;
  pendingEarnings: number;
  totalSessions: number;
  sessionsCompleted: number;
  demoEarnings: number;
  demoCompletedCount: number;
  demoEnrollmentBonusCount: number;
};

export type TeacherEarningsRollupPlan =
  | { mode: 'noop'; targets: TeacherMonthRollupTarget[] }
  | {
      mode: 'delta';
      target: TeacherMonthRollupTarget;
      delta: TeacherEarningsContribution;
    }
  | { mode: 'recompute'; targets: TeacherMonthRollupTarget[]; reason: string };

const ZERO_CONTRIBUTION: TeacherEarningsContribution = {
  totalEarnings: 0,
  pendingEarnings: 0,
  totalSessions: 0,
  sessionsCompleted: 0,
  demoEarnings: 0,
  demoCompletedCount: 0,
  demoEnrollmentBonusCount: 0,
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const normalizeStatus = (value: unknown): string => normalizeText(value).toLowerCase();

const nonNegativeNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

const resolvePaidAmount = (data: Record<string, unknown>, amount: number): number => {
  const explicit = nonNegativeNumber(data.paidAmount);
  if (explicit > 0) return Math.min(explicit, amount);

  const status = normalizeStatus(data.status);
  if (status === 'paid' || status === 'settled' || status === 'processed') {
    return amount;
  }
  return 0;
};

const isSessionLinked = (data: Record<string, unknown>): boolean => {
  if (normalizeStatus(data.source) === 'session_present_completed') return true;
  return Boolean(normalizeText(data.sessionId));
};

const isDemoCompletion = (data: Record<string, unknown>): boolean =>
  normalizeStatus(data.source) === 'demo_completed';

const isDemoEnrollmentBonus = (data: Record<string, unknown>): boolean =>
  normalizeStatus(data.source) === 'demo_enrolled_bonus';

const normalizedStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeText(entry))
    .filter(Boolean)
    .sort();
};

const timestampToken = (value: unknown): string => {
  if (!value) return '';
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? String(value.getTime()) : '';
  if (typeof value === 'object') {
    const row = value as {
      toMillis?: () => number;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof row.toMillis === 'function') {
      const millis = row.toMillis();
      return Number.isFinite(millis) ? String(millis) : '';
    }
    const seconds = Number(row.seconds ?? row._seconds);
    const nanoseconds = Number(row.nanoseconds ?? row._nanoseconds ?? 0);
    if (Number.isFinite(seconds)) return `${seconds}:${Number.isFinite(nanoseconds) ? nanoseconds : 0}`;
  }
  return normalizeText(value);
};

const paidLikeStatusToken = (value: unknown): string => {
  const status = normalizeStatus(value);
  return status === 'paid' || status === 'partial' || status === 'settled' || status === 'processed'
    ? status
    : '';
};

const payoutStateSignature = (data: Record<string, unknown>): string =>
  JSON.stringify({
    paidAmount: nonNegativeNumber(data.paidAmount),
    paidAt: timestampToken(data.paidAt),
    payoutIds: normalizedStringList(data.payoutIds),
    reversedPaidAmount: nonNegativeNumber(data.reversedPaidAmount),
    reversedPayoutIds: normalizedStringList(data.reversedPayoutIds),
    paidLikeStatus: paidLikeStatusToken(data.status),
  });

const payoutStateChanged = (
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): boolean => Boolean(before && after) && payoutStateSignature(before!) !== payoutStateSignature(after!);

export const teacherMonthRollupTargetFor = (
  data: Record<string, unknown> | null | undefined,
): TeacherMonthRollupTarget | null => {
  if (!data) return null;
  const teacherId = normalizeText(data.teacherId);
  const monthKey = normalizeText(data.monthKey);
  if (!teacherId || !/^\d{4}-\d{2}$/.test(monthKey)) return null;
  return { teacherId, monthKey };
};

export const teacherEarningContributionFor = (
  data: Record<string, unknown> | null | undefined,
): TeacherEarningsContribution => {
  if (!data || data.archived === true || normalizeStatus(data.status) === 'void') {
    return { ...ZERO_CONTRIBUTION };
  }

  const amount = nonNegativeNumber(data.amount);
  const paidAmount = resolvePaidAmount(data, amount);
  const pending = Math.max(amount - paidAmount, 0);
  const sessionLinked = isSessionLinked(data);
  const demoCompletion = isDemoCompletion(data);
  const demoEnrollmentBonus = isDemoEnrollmentBonus(data);
  const demo = demoCompletion || demoEnrollmentBonus;

  return {
    totalEarnings: amount,
    pendingEarnings: pending,
    totalSessions: sessionLinked ? 1 : 0,
    sessionsCompleted: sessionLinked ? 1 : 0,
    demoEarnings: demo ? amount : 0,
    demoCompletedCount: demoCompletion ? 1 : 0,
    demoEnrollmentBonusCount: demoEnrollmentBonus ? 1 : 0,
  };
};

const subtractContributions = (
  after: TeacherEarningsContribution,
  before: TeacherEarningsContribution,
): TeacherEarningsContribution => ({
  totalEarnings: after.totalEarnings - before.totalEarnings,
  pendingEarnings: after.pendingEarnings - before.pendingEarnings,
  totalSessions: after.totalSessions - before.totalSessions,
  sessionsCompleted: after.sessionsCompleted - before.sessionsCompleted,
  demoEarnings: after.demoEarnings - before.demoEarnings,
  demoCompletedCount: after.demoCompletedCount - before.demoCompletedCount,
  demoEnrollmentBonusCount:
    after.demoEnrollmentBonusCount - before.demoEnrollmentBonusCount,
});

const isZeroContribution = (value: TeacherEarningsContribution): boolean =>
  Object.values(value).every((entry) => Math.abs(entry) < 0.000001);

const sameTarget = (
  a: TeacherMonthRollupTarget | null,
  b: TeacherMonthRollupTarget | null,
): boolean => Boolean(a && b && a.teacherId === b.teacherId && a.monthKey === b.monthKey);

const uniqueTargets = (
  ...values: Array<TeacherMonthRollupTarget | null>
): TeacherMonthRollupTarget[] => {
  const map = new Map<string, TeacherMonthRollupTarget>();
  values.forEach((value) => {
    if (!value) return;
    map.set(`${value.teacherId}__${value.monthKey}`, value);
  });
  return Array.from(map.values());
};

const isStandalone = (data: Record<string, unknown> | null | undefined): boolean =>
  Boolean(data) && !isSessionLinked(data as Record<string, unknown>);

const isCanonicalSessionRecord = (
  earningId: string,
  data: Record<string, unknown> | null | undefined,
): boolean => {
  if (!data || !isSessionLinked(data)) return false;
  const sessionId = normalizeText(data.sessionId);
  return Boolean(sessionId) && earningId === sessionId;
};

/**
 * Plans whether one teacherEarnings document change can update the monthly read model
 * by an exact delta or must fall back to the existing authoritative full recompute.
 *
 * Conservative by design:
 * - standalone demo/adjustment rows can be created, updated, or deleted incrementally;
 * - an existing canonical session earning can be updated incrementally;
 * - payout-state changes on an existing earning always require recompute because the monthly
 *   read model also contains the top-five teacherPayouts payment history;
 * - session earning creates/deletes and non-canonical duplicate rows require recompute,
 *   because a legacy row for the same session may become selected by dedupe rules;
 * - teacher/month moves require both affected months to recompute.
 */
export const planTeacherEarningsRollupChange = (input: {
  earningId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): TeacherEarningsRollupPlan => {
  const earningId = normalizeText(input.earningId);
  const beforeTarget = teacherMonthRollupTargetFor(input.before);
  const afterTarget = teacherMonthRollupTargetFor(input.after);
  const targets = uniqueTargets(beforeTarget, afterTarget);

  if (!beforeTarget && !afterTarget) {
    return { mode: 'noop', targets: [] };
  }

  if (beforeTarget && afterTarget && !sameTarget(beforeTarget, afterTarget)) {
    return { mode: 'recompute', targets, reason: 'teacher_or_month_changed' };
  }

  if (payoutStateChanged(input.before, input.after)) {
    return { mode: 'recompute', targets, reason: 'payout_state_changed' };
  }

  if (!beforeTarget || !afterTarget) {
    const existing = input.before || input.after;
    if (!isStandalone(existing)) {
      return { mode: 'recompute', targets, reason: 'session_create_or_delete' };
    }
  }

  const bothStandalone = isStandalone(input.before) && isStandalone(input.after);
  const standaloneCreateOrDelete =
    (!input.before && isStandalone(input.after)) ||
    (!input.after && isStandalone(input.before));
  const canonicalSessionUpdate =
    Boolean(input.before && input.after) &&
    isCanonicalSessionRecord(earningId, input.before) &&
    isCanonicalSessionRecord(earningId, input.after);

  if (!bothStandalone && !standaloneCreateOrDelete && !canonicalSessionUpdate) {
    return { mode: 'recompute', targets, reason: 'ambiguous_or_legacy_session_row' };
  }

  const target = afterTarget || beforeTarget;
  if (!target) return { mode: 'noop', targets: [] };

  const beforeContribution = teacherEarningContributionFor(input.before);
  const afterContribution = teacherEarningContributionFor(input.after);
  const delta = subtractContributions(afterContribution, beforeContribution);

  if (isZeroContribution(delta)) {
    return { mode: 'noop', targets: [target] };
  }

  return { mode: 'delta', target, delta };
};
