import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const functionsIndexSource = readFileSync(join(process.cwd(), 'functions/src/index.ts'), 'utf8');
const withholdingSyncSource = readFileSync(
  join(process.cwd(), 'functions/src/teacherPayWithholdingSync.ts'),
  'utf8',
);
const decisionSource = readFileSync(
  join(process.cwd(), 'functions/src/adminAttendanceCorrectionTeacherPayDecision.ts'),
  'utf8',
);
const reportSource = readFileSync(
  join(process.cwd(), 'functions/src/getAdminTeacherPayWithholdings.ts'),
  'utf8',
);
const helperSource = readFileSync(
  join(process.cwd(), 'functions/src/helpers/teacherPayWithholdingLedger.ts'),
  'utf8',
);

describe('Brick 3 school-retained teacher pay ledger routing', () => {
  it('exports the admin report callable and retains the Brick 2 synchronizer', () => {
    expect(functionsIndexSource).toContain('export { onTeacherPayWithholdingSync } from "./teacherPayWithholdingSync";');
    expect(functionsIndexSource).toContain('export { getAdminTeacherPayWithholdings } from "./getAdminTeacherPayWithholdings";');
  });

  it('creates one deterministic immutable withholding ledger in the same transaction as the earning outcome', () => {
    expect(withholdingSyncSource).toContain("collection('teacherPayWithholdings').doc(sessionId)");
    expect(withholdingSyncSource).toContain('tx.create(withholdingRef');
    expect(withholdingSyncSource).toContain('teacherPayWithholdingLedgerMatches');
    expect(withholdingSyncSource).toContain("teacherPayLedgerRepairReason: reason");
    expect(withholdingSyncSource).not.toContain('tx.delete(withholdingRef');
    expect(withholdingSyncSource).not.toContain('tx.set(withholdingRef');
  });

  it('waits for the authoritative attendance correction link before creating an immutable record', () => {
    expect(withholdingSyncSource).toContain("normalizeStatus(session.teacherPayDecisionStatus) !== 'applied'");
    expect(withholdingSyncSource).toContain('!clean(session.teacherPayDecisionCorrectionId)');
    expect(withholdingSyncSource).toContain("normalizeStatus(latestDecision.status) !== 'applied'");
    expect(withholdingSyncSource).toContain('clean(latestDecision.attendanceCorrectionId) !== latestCorrectionId');
    expect(decisionSource).toContain("normalizeTeacherPayDisposition(session.teacherPayDisposition) === 'retain_school'");
    expect(decisionSource).toContain("teacherPayDecisionStatus: 'applied'");
    expect(decisionSource).toContain('attendanceCorrectionId: correctionId');
    expect(decisionSource).toContain('tx.set(earningRef');
  });

  it('preserves normal economic terms while recording zero teacher credit and school retention', () => {
    expect(helperSource).toContain('teacherRateSnapshot: normalRate');
    expect(helperSource).toContain('expectedTeacherAmount: normalRate');
    expect(helperSource).toContain('creditedTeacherAmount: 0');
    expect(helperSource).toContain('schoolRetainedAmount: normalRate');
    expect(helperSource).toContain("teacherPayDisposition: 'retain_school'");
    expect(helperSource).toContain("status: 'active'");
    expect(helperSource).toContain('ledgerImmutable: true');
    expect(helperSource).toContain('attendanceCorrectionId,');
    expect(helperSource).toContain('decidedByUid,');
  });

  it('keeps parent billing isolated from the withholding ledger', () => {
    expect(withholdingSyncSource).not.toContain("collection('billingCharges')");
    expect(reportSource).not.toContain("collection('billingCharges')");
  });

  it('offers a bounded admin-only monthly report with teacher, reason, and session filters', () => {
    expect(reportSource).toContain("throw new HttpsError('permission-denied', 'Admin access required.')");
    expect(reportSource).toContain("collection('teacherPayWithholdings')");
    expect(reportSource).toContain("where('serviceMonthKey', '==', monthKey)");
    expect(reportSource).toContain('const teacherId = clean(payload.teacherId');
    expect(reportSource).toContain('const reasonCode = clean(payload.reasonCode');
    expect(reportSource).toContain('const sessionId = clean(payload.sessionId');
    expect(reportSource).toContain('const MAX_SCAN = 1000');
    expect(reportSource).toContain('totalSchoolRetainedAmount');
    expect(reportSource).toContain('byReason');
  });

  it('does not create a withholding ledger for already-paid earnings', () => {
    const paidGuardIndex = withholdingSyncSource.indexOf("earningStatus === 'paid'");
    const withholdingRefIndex = withholdingSyncSource.indexOf("collection('teacherPayWithholdings').doc(sessionId)");
    expect(paidGuardIndex).toBeGreaterThanOrEqual(0);
    expect(withholdingRefIndex).toBeGreaterThan(paidGuardIndex);
    expect(withholdingSyncSource).toContain("teacherPayAdjustmentReason: 'earning_already_paid'");
  });
});
