export const TEACHER_PAY_WITHHOLDING_LEDGER_VERSION = 1;
export const TEACHER_PAY_WITHHOLDING_SOURCE = 'admin-attendance-correction';

export type TeacherPayWithholdingLedgerRecord = {
  ledgerVersion: number;
  recordType: 'teacher_pay_withholding';
  sessionId: string;
  teacherEarningId: string;
  enrollmentId: string | null;
  kidId: string | null;
  parentId: string | null;
  teacherId: string;
  courseId: string | null;
  serviceDate: string | null;
  serviceMonthKey: string;
  monthKey: string;
  currency: string;
  teacherRateSnapshot: number;
  expectedTeacherAmount: number;
  creditedTeacherAmount: 0;
  schoolRetainedAmount: number;
  teacherPayDisposition: 'retain_school';
  reasonCode: string;
  reason: string;
  attendanceCorrectionId: string;
  teacherPayDecisionId: string;
  decidedByUid: string;
  decidedByName: string | null;
  decidedByEmail: string | null;
  decidedAt: unknown;
  status: 'active';
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

function resolveKidId(session: Record<string, unknown>, earning: Record<string, unknown>): string | null {
  const direct = clean(earning.kidId, 160) || clean(earning.studentId, 160) || clean(session.kidId, 160) || clean(session.studentId, 160);
  if (direct) return direct;
  const earningKidIds = Array.isArray(earning.kidIds) ? earning.kidIds : [];
  const sessionKidIds = Array.isArray(session.kidIds) ? session.kidIds : [];
  return clean(earningKidIds[0], 160) || clean(sessionKidIds[0], 160) || null;
}

function resolveServiceDate(session: Record<string, unknown>, earning: Record<string, unknown>): string | null {
  const candidates = [
    earning.serviceDate,
    session.serviceDate,
    session.date,
    session.sessionDate,
    session.classDate,
  ];
  for (const candidate of candidates) {
    const value = clean(candidate, 40);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  }
  return null;
}

function resolveServiceMonthKey(session: Record<string, unknown>, earning: Record<string, unknown>): string {
  const candidates = [
    earning.serviceMonthKey,
    earning.monthKey,
    session.serviceMonthKey,
    session.accruedMonthKey,
  ];
  for (const candidate of candidates) {
    const value = clean(candidate, 20);
    if (/^\d{4}-\d{2}$/.test(value)) return value;
  }
  return '';
}

export function buildTeacherPayWithholdingLedgerRecord(args: {
  sessionId: string;
  earningId: string;
  decisionId: string;
  normalRate: number;
  session: Record<string, unknown>;
  earning: Record<string, unknown>;
}): TeacherPayWithholdingLedgerRecord | null {
  const sessionId = clean(args.sessionId, 160);
  const earningId = clean(args.earningId, 160);
  const decisionId = clean(args.decisionId, 160);
  const normalRate = positiveMoney(args.normalRate);
  const teacherId = clean(args.earning.teacherId, 160) || clean(args.session.teacherId, 160);
  const serviceMonthKey = resolveServiceMonthKey(args.session, args.earning);
  const reasonCode = clean(args.session.teacherPayDecisionReasonCode, 120);
  const reason = clean(args.session.teacherPayDecisionReason, 2000);
  const attendanceCorrectionId = clean(args.session.teacherPayDecisionCorrectionId, 160);
  const decidedByUid = clean(args.session.teacherPayDecisionByUid, 160);

  if (
    !sessionId ||
    !earningId ||
    !decisionId ||
    !normalRate ||
    !teacherId ||
    !serviceMonthKey ||
    !reasonCode ||
    !reason ||
    !attendanceCorrectionId ||
    !decidedByUid
  ) {
    return null;
  }

  const currency =
    clean(args.earning.currency, 20) ||
    clean(args.session.financialTermsCurrency, 20) ||
    clean(args.session.currency, 20) ||
    'INR';

  return {
    ledgerVersion: TEACHER_PAY_WITHHOLDING_LEDGER_VERSION,
    recordType: 'teacher_pay_withholding',
    sessionId,
    teacherEarningId: earningId,
    enrollmentId: clean(args.earning.enrollmentId, 160) || clean(args.session.enrollmentId, 160) || null,
    kidId: resolveKidId(args.session, args.earning),
    parentId: clean(args.earning.parentId, 160) || clean(args.session.parentId, 160) || null,
    teacherId,
    courseId: clean(args.earning.courseId, 160) || clean(args.session.courseId, 160) || null,
    serviceDate: resolveServiceDate(args.session, args.earning),
    serviceMonthKey,
    monthKey: serviceMonthKey,
    currency,
    teacherRateSnapshot: normalRate,
    expectedTeacherAmount: normalRate,
    creditedTeacherAmount: 0,
    schoolRetainedAmount: normalRate,
    teacherPayDisposition: 'retain_school',
    reasonCode,
    reason,
    attendanceCorrectionId,
    teacherPayDecisionId: decisionId,
    decidedByUid,
    decidedByName: clean(args.session.teacherPayDecisionByName, 320) || null,
    decidedByEmail: clean(args.session.teacherPayDecisionByEmail, 320) || null,
    decidedAt: args.session.teacherPayDecisionAt || null,
    status: 'active',
    source: TEACHER_PAY_WITHHOLDING_SOURCE,
    ledgerImmutable: true,
  };
}

export function teacherPayWithholdingLedgerMatches(
  existing: Record<string, unknown>,
  expected: TeacherPayWithholdingLedgerRecord,
): boolean {
  return (
    Number(existing.ledgerVersion) === expected.ledgerVersion &&
    clean(existing.recordType, 80) === expected.recordType &&
    clean(existing.sessionId, 160) === expected.sessionId &&
    clean(existing.teacherEarningId, 160) === expected.teacherEarningId &&
    clean(existing.teacherId, 160) === expected.teacherId &&
    clean(existing.serviceMonthKey, 20) === expected.serviceMonthKey &&
    clean(existing.monthKey, 20) === expected.monthKey &&
    clean(existing.teacherPayDecisionId, 160) === expected.teacherPayDecisionId &&
    clean(existing.attendanceCorrectionId, 160) === expected.attendanceCorrectionId &&
    clean(existing.decidedByUid, 160) === expected.decidedByUid &&
    clean(existing.reasonCode, 120) === expected.reasonCode &&
    clean(existing.teacherPayDisposition, 80) === 'retain_school' &&
    clean(existing.status, 80) === 'active' &&
    clean(existing.source, 120) === TEACHER_PAY_WITHHOLDING_SOURCE &&
    existing.ledgerImmutable === true &&
    positiveMoney(existing.teacherRateSnapshot) === expected.teacherRateSnapshot &&
    positiveMoney(existing.expectedTeacherAmount) === expected.expectedTeacherAmount &&
    Number(existing.creditedTeacherAmount) === 0 &&
    positiveMoney(existing.schoolRetainedAmount) === expected.schoolRetainedAmount
  );
}
