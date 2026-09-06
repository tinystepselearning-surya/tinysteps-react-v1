export const FINANCIAL_TERMS_SNAPSHOT_VERSION = 1;

export const BILLING_RATE_SNAPSHOT_FIELD = 'billingRateSnapshot';
export const TEACHER_PAY_RATE_SNAPSHOT_FIELD = 'teacherPayRateSnapshot';
export const FINANCIAL_TERMS_VERSION_FIELD = 'financialTermsSnapshotVersion';
export const FINANCIAL_TERMS_CURRENCY_FIELD = 'financialTermsCurrency';

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

function firstNonNegative(values: unknown[]): number | null {
  for (const value of values) {
    const parsed = finiteNonNegative(value);
    if (parsed != null) return parsed;
  }
  return null;
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

export function resolveSessionTeacherPayRate(
  session: Record<string, unknown> | null | undefined,
  enrollment: Record<string, unknown> | null | undefined,
): number {
  const explicitSnapshot = finiteNonNegative(session?.[TEACHER_PAY_RATE_SNAPSHOT_FIELD]);
  if (explicitSnapshot != null) return explicitSnapshot;

  const sessionRate = firstNonNegative([
    session?.teacherPayPerSession,
    session?.teacherRatePerSession,
    session?.teacherPay,
    session?.teacherRate,
    session?.teacherFee,
    session?.teacherClassRate,
  ]);
  if (sessionRate != null) return sessionRate;

  const enrollmentRate = firstNonNegative([
    enrollment?.teacherPayPerSession,
    enrollment?.teacherRatePerSession,
    enrollment?.teacherPay,
    enrollment?.teacherRate,
    enrollment?.teacherFee,
    enrollment?.teacherClassRate,
    enrollment?.rateTeacher,
    enrollment?.payoutRate,
  ]);
  return enrollmentRate ?? 0;
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

  const teacherPayRateSnapshot = resolveSessionTeacherPayRate(session, enrollment);
  const financialTermsCurrency = resolveSessionFinancialCurrency(session, enrollment);

  return {
    financialTermsSnapshotVersion: FINANCIAL_TERMS_SNAPSHOT_VERSION,
    billingRateSnapshot,
    teacherPayRateSnapshot,
    financialTermsCurrency,
  };
}
