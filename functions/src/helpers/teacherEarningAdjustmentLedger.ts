export const TEACHER_EARNING_ADJUSTMENT_LEDGER_VERSION = 1;
export const TEACHER_EARNING_ADJUSTMENT_SOURCE = 'admin-attendance-correction';

export type TeacherEarningAdjustmentDisposition = 'credit_teacher' | 'retain_school';
export type TeacherEarningAdjustmentType =
  | 'debit_teacher_retention'
  | 'credit_teacher_restoration';

export type TeacherEarningAdjustmentRecord = {
  ledgerVersion: number;
  recordType: 'teacher_earning_adjustment';
  adjustmentId: string;
  adjustmentType: TeacherEarningAdjustmentType;
  sessionId: string;
  teacherEarningId: string;
  enrollmentId: string | null;
  kidId: string | null;
  parentId: string | null;
  teacherId: string;
  courseId: string | null;
  earningMonthKey: string;
  adjustmentMonthKey: string;
  currency: string;
  amount: number;
  baseEntitlementAmount: number;
  priorAdjustmentsTotal: number;
  resultingNetEntitlement: number;
  targetTeacherEntitlement: number;
  normalTeacherRateSnapshot: number;
  paidAmountAtAdjustment: number;
  earningStatusAtAdjustment: string;
  teacherPayDisposition: TeacherEarningAdjustmentDisposition;
  reasonCode: string;
  reason: string;
  attendanceCorrectionId: string;
  teacherPayDecisionId: string;
  decidedByUid: string;
  decidedByName: string | null;
  decidedByEmail: string | null;
  decidedAt: unknown;
  status: 'posted';
  source: string;
  ledgerImmutable: true;
};

function clean(value: unknown, maxLen = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

function positiveMoney(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function nonNegativeMoney(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function signedMoney(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDisposition(value: unknown): TeacherEarningAdjustmentDisposition | null {
  const raw = clean(value, 80).toLowerCase();
  if (raw === 'credit_teacher') return 'credit_teacher';
  if (raw === 'retain_school') return 'retain_school';
  return null;
}

function resolveKidId(session: Record<string, unknown>, earning: Record<string, unknown>): string | null {
  const direct =
    clean(earning.kidId, 160) ||
    clean(earning.studentId, 160) ||
    clean(session.kidId, 160) ||
    clean(session.studentId, 160);
  if (direct) return direct;
  const earningKidIds = Array.isArray(earning.kidIds) ? earning.kidIds : [];
  const sessionKidIds = Array.isArray(session.kidIds) ? session.kidIds : [];
  return clean(earningKidIds[0], 160) || clean(sessionKidIds[0], 160) || null;
}

function resolveEarningMonthKey(session: Record<string, unknown>, earning: Record<string, unknown>): string {
  const candidates = [
    earning.monthKey,
    earning.serviceMonthKey,
    session.accruedMonthKey,
    session.serviceMonthKey,
  ];
  for (const candidate of candidates) {
    const value = clean(candidate, 20);
    if (/^\d{4}-\d{2}$/.test(value)) return value;
  }
  return '';
}

function resolveEffectivePaidAmount(earning: Record<string, unknown>, normalRate: number): number {
  const explicitPaid = nonNegativeMoney(earning.paidAmount);
  if (explicitPaid > 0) return explicitPaid;
  const status = clean(earning.status, 80).toLowerCase();
  if (status === 'paid' || status === 'settled') {
    return positiveMoney(earning.amount) || normalRate;
  }
  return 0;
}

export function buildTeacherEarningAdjustmentId(sessionId: string, attendanceCorrectionId: string): string {
  const safeSessionId = clean(sessionId, 160).replace(/[^A-Za-z0-9_-]/g, '_');
  const safeCorrectionId = clean(attendanceCorrectionId, 160).replace(/[^A-Za-z0-9_-]/g, '_');
  return `teacher_adjustment_${safeSessionId}__${safeCorrectionId}`;
}

export function computeTeacherEarningAdjustmentDelta(args: {
  normalRate: number;
  existingAdjustmentsTotal: number;
  disposition: TeacherEarningAdjustmentDisposition;
}): {
  baseEntitlement: number;
  targetEntitlement: number;
  currentNetEntitlement: number;
  delta: number;
} | null {
  const normalRate = positiveMoney(args.normalRate);
  if (!normalRate) return null;
  const existingAdjustmentsTotal = signedMoney(args.existingAdjustmentsTotal);
  const baseEntitlement = normalRate;
  const targetEntitlement = args.disposition === 'retain_school' ? 0 : normalRate;
  const currentNetEntitlement = baseEntitlement + existingAdjustmentsTotal;
  const rawDelta = targetEntitlement - currentNetEntitlement;
  const delta = Math.abs(rawDelta) < 0.005 ? 0 : Number(rawDelta.toFixed(2));
  return { baseEntitlement, targetEntitlement, currentNetEntitlement, delta };
}

export function buildTeacherEarningAdjustmentRecord(args: {
  sessionId: string;
  earningId: string;
  decisionId: string;
  correctionId: string;
  normalRate: number;
  existingAdjustmentsTotal: number;
  adjustmentMonthKey: string;
  session: Record<string, unknown>;
  earning: Record<string, unknown>;
}): TeacherEarningAdjustmentRecord | null {
  const sessionId = clean(args.sessionId, 160);
  const earningId = clean(args.earningId, 160);
  const decisionId = clean(args.decisionId, 160);
  const correctionId = clean(args.correctionId, 160);
  const adjustmentMonthKey = clean(args.adjustmentMonthKey, 20);
  const disposition = normalizeDisposition(args.session.teacherPayDisposition);
  const normalRate = positiveMoney(args.normalRate);
  const teacherId = clean(args.earning.teacherId, 160) || clean(args.session.teacherId, 160);
  const earningMonthKey = resolveEarningMonthKey(args.session, args.earning);
  const reasonCode = clean(args.session.teacherPayDecisionReasonCode, 120);
  const reason = clean(args.session.teacherPayDecisionReason, 2000);
  const decidedByUid = clean(args.session.teacherPayDecisionByUid, 160);
  const calculation = disposition
    ? computeTeacherEarningAdjustmentDelta({
        normalRate: normalRate || 0,
        existingAdjustmentsTotal: args.existingAdjustmentsTotal,
        disposition,
      })
    : null;

  if (
    !sessionId ||
    !earningId ||
    !decisionId ||
    !correctionId ||
    !/^\d{4}-\d{2}$/.test(adjustmentMonthKey) ||
    !disposition ||
    !normalRate ||
    !teacherId ||
    !earningMonthKey ||
    !reasonCode ||
    !reason ||
    !decidedByUid ||
    !calculation ||
    calculation.delta === 0
  ) {
    return null;
  }

  const currency =
    clean(args.earning.currency, 20) ||
    clean(args.session.financialTermsCurrency, 20) ||
    clean(args.session.currency, 20) ||
    'INR';
  const amount = calculation.delta;
  const earningStatusAtAdjustment = clean(args.earning.status, 80).toLowerCase();
  const paidAmountAtAdjustment = resolveEffectivePaidAmount(args.earning, normalRate);

  return {
    ledgerVersion: TEACHER_EARNING_ADJUSTMENT_LEDGER_VERSION,
    recordType: 'teacher_earning_adjustment',
    adjustmentId: buildTeacherEarningAdjustmentId(sessionId, correctionId),
    adjustmentType: amount < 0 ? 'debit_teacher_retention' : 'credit_teacher_restoration',
    sessionId,
    teacherEarningId: earningId,
    enrollmentId: clean(args.earning.enrollmentId, 160) || clean(args.session.enrollmentId, 160) || null,
    kidId: resolveKidId(args.session, args.earning),
    parentId: clean(args.earning.parentId, 160) || clean(args.session.parentId, 160) || null,
    teacherId,
    courseId: clean(args.earning.courseId, 160) || clean(args.session.courseId, 160) || null,
    earningMonthKey,
    adjustmentMonthKey,
    currency,
    amount,
    baseEntitlementAmount: calculation.baseEntitlement,
    priorAdjustmentsTotal: signedMoney(args.existingAdjustmentsTotal),
    resultingNetEntitlement: calculation.targetEntitlement,
    targetTeacherEntitlement: calculation.targetEntitlement,
    normalTeacherRateSnapshot: normalRate,
    paidAmountAtAdjustment,
    earningStatusAtAdjustment,
    teacherPayDisposition: disposition,
    reasonCode,
    reason,
    attendanceCorrectionId: correctionId,
    teacherPayDecisionId: decisionId,
    decidedByUid,
    decidedByName: clean(args.session.teacherPayDecisionByName, 320) || null,
    decidedByEmail: clean(args.session.teacherPayDecisionByEmail, 320) || null,
    decidedAt: args.session.teacherPayDecisionAt || null,
    status: 'posted',
    source: TEACHER_EARNING_ADJUSTMENT_SOURCE,
    ledgerImmutable: true,
  };
}

export function teacherEarningAdjustmentMatches(
  existing: Record<string, unknown>,
  expected: TeacherEarningAdjustmentRecord,
): boolean {
  return (
    Number(existing.ledgerVersion) === expected.ledgerVersion &&
    clean(existing.recordType, 80) === expected.recordType &&
    clean(existing.adjustmentId, 220) === expected.adjustmentId &&
    clean(existing.adjustmentType, 80) === expected.adjustmentType &&
    clean(existing.sessionId, 160) === expected.sessionId &&
    clean(existing.teacherEarningId, 160) === expected.teacherEarningId &&
    clean(existing.teacherId, 160) === expected.teacherId &&
    clean(existing.enrollmentId, 160) === clean(expected.enrollmentId, 160) &&
    clean(existing.kidId, 160) === clean(expected.kidId, 160) &&
    clean(existing.parentId, 160) === clean(expected.parentId, 160) &&
    clean(existing.courseId, 160) === clean(expected.courseId, 160) &&
    clean(existing.earningMonthKey, 20) === expected.earningMonthKey &&
    clean(existing.adjustmentMonthKey, 20) === expected.adjustmentMonthKey &&
    clean(existing.currency, 20) === expected.currency &&
    signedMoney(existing.amount) === expected.amount &&
    nonNegativeMoney(existing.baseEntitlementAmount) === expected.baseEntitlementAmount &&
    signedMoney(existing.priorAdjustmentsTotal) === expected.priorAdjustmentsTotal &&
    nonNegativeMoney(existing.resultingNetEntitlement) === expected.resultingNetEntitlement &&
    nonNegativeMoney(existing.targetTeacherEntitlement) === expected.targetTeacherEntitlement &&
    nonNegativeMoney(existing.normalTeacherRateSnapshot) === expected.normalTeacherRateSnapshot &&
    nonNegativeMoney(existing.paidAmountAtAdjustment) === expected.paidAmountAtAdjustment &&
    clean(existing.earningStatusAtAdjustment, 80) === expected.earningStatusAtAdjustment &&
    clean(existing.teacherPayDisposition, 80) === expected.teacherPayDisposition &&
    clean(existing.reasonCode, 120) === expected.reasonCode &&
    clean(existing.reason, 2000) === expected.reason &&
    clean(existing.attendanceCorrectionId, 160) === expected.attendanceCorrectionId &&
    clean(existing.teacherPayDecisionId, 160) === expected.teacherPayDecisionId &&
    clean(existing.decidedByUid, 160) === expected.decidedByUid &&
    clean(existing.status, 80) === 'posted' &&
    clean(existing.source, 120) === TEACHER_EARNING_ADJUSTMENT_SOURCE &&
    existing.ledgerImmutable === true
  );
}
