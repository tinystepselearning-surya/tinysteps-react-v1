export const FINANCIAL_TERMS_SNAPSHOT_VERSION = 1;

export const BILLING_RATE_SNAPSHOT_FIELD = 'billingRateSnapshot';
export const TEACHER_PAY_RATE_SNAPSHOT_FIELD = 'teacherPayRateSnapshot';
export const FINANCIAL_TERMS_VERSION_FIELD = 'financialTermsSnapshotVersion';
export const FINANCIAL_TERMS_CURRENCY_FIELD = 'financialTermsCurrency';

export type TeacherPayDisposition = 'credit_teacher' | 'retain_school';

const ADMIN_ATTENDANCE_CORRECTION_SOURCE = 'admin-attendance-correction';

function finitePositive(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function finiteNonNegative(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function firstPositive(values: unknown[]): number {
  for (const value of values) {
    const parsed = finitePositive(value);
    if (parsed != null) return parsed;
  }
  return 0;
}

export function normalizeTeacherPayDisposition(value: unknown): TeacherPayDisposition | null {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'credit_teacher') return 'credit_teacher';
  if (raw === 'retain_school') return 'retain_school';
  return null;
}

export function isRetainSchoolTeacherPayDecisionActive(
  session: Record<string, unknown> | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!session) return false;
  if (normalizeTeacherPayDisposition(session.teacherPayDisposition) !== 'retain_school') return false;
  if (String(session.teacherPayDecisionSource || '').trim() !== ADMIN_ATTENDANCE_CORRECTION_SOURCE) return false;

  const status = String(session.teacherPayDecisionStatus || '').trim().toLowerCase();
  if (status === 'applied') return true;
  if (status !== 'pending') return false;

  const validUntilMs = Number(session.teacherPayDecisionValidUntilMs);
  return Number.isFinite(validUntilMs) && validUntilMs >= nowMs;
}

export function resolveSessionBillingRate(
  session: Record<string, unknown> | null | undefined,
  enrollment: Record<string, unknown> | null | undefined,
): number {
  return firstPositive([
    session?.[BILLING_RATE_SNAPSHOT_FIELD],
    session?.feeAmount,
    session?.feePerClass,
    session?.feePerSession,
    session?.ratePerSession,
    session?.parentRate,
    session?.classFee,
    enrollment?.ratePerSession,
    enrollment?.feePerSession,
    enrollment?.feePerClass,
    enrollment?.parentRate,
    enrollment?.parentClassRate,
    enrollment?.classFee,
    enrollment?.feeAmount,
  ]);
}

export function resolveSessionTeacherPayNormalRate(
  session: Record<string, unknown> | null | undefined,
  enrollment: Record<string, unknown> | null | undefined,
): number {
  // A zero is authoritative only when it is an explicit versioned session snapshot.
  // Legacy session fields sometimes contain 0 as an unresolved placeholder, so those
  // must not suppress a later-known positive enrollment rate.
  const explicitSnapshot = finiteNonNegative(session?.[TEACHER_PAY_RATE_SNAPSHOT_FIELD]);
  if (explicitSnapshot != null) return explicitSnapshot;

  const sessionRate = firstPositive([
    session?.teacherPayPerSession,
    session?.teacherRatePerSession,
    session?.teacherPay,
    session?.teacherRate,
    session?.teacherFee,
    session?.teacherClassRate,
  ]);
  if (sessionRate > 0) return sessionRate;

  return firstPositive([
    enrollment?.teacherPayPerSession,
    enrollment?.teacherRatePerSession,
    enrollment?.teacherPay,
    enrollment?.teacherRate,
    enrollment?.teacherFee,
    enrollment?.teacherClassRate,
    enrollment?.rateTeacher,
    enrollment?.payoutRate,
  ]);
}

export function resolveSessionTeacherPayRate(
  session: Record<string, unknown> | null | undefined,
  enrollment: Record<string, unknown> | null | undefined,
): number {
  const normalRate = resolveSessionTeacherPayNormalRate(session, enrollment);
  return isRetainSchoolTeacherPayDecisionActive(session) ? 0 : normalRate;
}

export function resolveSessionFinancialCurrency(
  session: Record<string, unknown> | null | undefined,
  enrollment: Record<string, unknown> | null | undefined,
): string {
  const snapshot = String(session?.[FINANCIAL_TERMS_CURRENCY_FIELD] || '').trim();
  if (snapshot) return snapshot;
  const sessionCurrency = String(session?.currency || '').trim();
  if (sessionCurrency) return sessionCurrency;
  const enrollmentCurrency = String(enrollment?.currency || '').trim();
  return enrollmentCurrency || 'INR';
}

export function hasCompleteSessionFinancialTermsSnapshot(
  session: Record<string, unknown> | null | undefined,
): boolean {
  if (!session) return false;
  const version = Number(session[FINANCIAL_TERMS_VERSION_FIELD]);
  const billingRate = finitePositive(session[BILLING_RATE_SNAPSHOT_FIELD]);
  const teacherRate = finiteNonNegative(session[TEACHER_PAY_RATE_SNAPSHOT_FIELD]);
  const currency = String(session[FINANCIAL_TERMS_CURRENCY_FIELD] || '').trim();
  return version >= FINANCIAL_TERMS_SNAPSHOT_VERSION && billingRate != null && teacherRate != null && !!currency;
}

export type SessionFinancialTermsSnapshot = {
  financialTermsSnapshotVersion: number;
  billingRateSnapshot: number;
  teacherPayRateSnapshot: number;
  financialTermsCurrency: string;
};

export function buildSessionFinancialTermsSnapshot(
  session: Record<string, unknown>,
  enrollment: Record<string, unknown>,
): SessionFinancialTermsSnapshot | null {
  const billingRateSnapshot = resolveSessionBillingRate(session, enrollment);
  if (!(billingRateSnapshot > 0)) return null;

  // Snapshot the normal contractual teacher rate, not the correction-time payout decision.
  // Brick 2 may reduce the credited amount to zero while keeping this immutable rate evidence.
  const teacherPayRateSnapshot = resolveSessionTeacherPayNormalRate(session, enrollment);
  const financialTermsCurrency = resolveSessionFinancialCurrency(session, enrollment);

  return {
    financialTermsSnapshotVersion: FINANCIAL_TERMS_SNAPSHOT_VERSION,
    billingRateSnapshot,
    teacherPayRateSnapshot,
    financialTermsCurrency,
  };
}
