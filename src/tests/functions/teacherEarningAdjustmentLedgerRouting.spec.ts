import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const functionsIndexSource = readFileSync(join(process.cwd(), 'functions/src/index.ts'), 'utf8');
const adjustmentSyncSource = readFileSync(
  join(process.cwd(), 'functions/src/teacherEarningAdjustmentSync.ts'),
  'utf8',
);
const compactAdjustmentSyncSource = adjustmentSyncSource.replace(/\s+/g, ' ');
const adjustmentHelperSource = readFileSync(
  join(process.cwd(), 'functions/src/helpers/teacherEarningAdjustmentLedger.ts'),
  'utf8',
);
const teacherPayDecisionSource = readFileSync(
  join(process.cwd(), 'functions/src/adminAttendanceCorrectionTeacherPayDecision.ts'),
  'utf8',
);
const rateHelperSource = readFileSync(
  join(process.cwd(), 'functions/src/helpers/sessionFinancialRates.ts'),
  'utf8',
);
const reportSource = readFileSync(
  join(process.cwd(), 'functions/src/getAdminTeacherEarningAdjustments.ts'),
  'utf8',
);

describe('Brick 4 teacher earning adjustment routing', () => {
  it('exports the automatic adjustment synchronizer and admin report callable', () => {
    expect(functionsIndexSource).toContain(
      'export { onTeacherEarningAdjustmentSync } from "./teacherEarningAdjustmentSync";',
    );
    expect(functionsIndexSource).toContain(
      'export { getAdminTeacherEarningAdjustments } from "./getAdminTeacherEarningAdjustments";',
    );
  });

  it('creates deterministic immutable adjustment events without rewriting settled earning cash history', () => {
    expect(adjustmentSyncSource).toContain("collection('teacherEarningAdjustments')");
    expect(adjustmentSyncSource).toContain('buildTeacherEarningAdjustmentId(sessionId, correctionId)');
    expect(adjustmentSyncSource).toContain('tx.create(adjustmentRef');
    expect(adjustmentHelperSource).toContain("recordType: 'teacher_earning_adjustment'");
    expect(adjustmentHelperSource).toContain('ledgerImmutable: true');
    expect(adjustmentSyncSource).not.toContain("collection('billingCharges')");
    expect(compactAdjustmentSyncSource).not.toMatch(/tx\.set\(change\.after\.ref, \{[^}]*\bamount\s*:/);
    expect(compactAdjustmentSyncSource).not.toMatch(/tx\.set\(change\.after\.ref, \{[^}]*\bpaidAmount\s*:/);
    expect(compactAdjustmentSyncSource).not.toMatch(/tx\.set\(change\.after\.ref, \{[^}]*\bstatus\s*:/);
  });

  it('supports retain, restoration, and repeated-decision no-op through target entitlement deltas', () => {
    expect(adjustmentHelperSource).toContain("targetEntitlement = args.disposition === 'retain_school' ? 0 : normalRate");
    expect(adjustmentHelperSource).toContain('const rawDelta = targetEntitlement - currentNetEntitlement');
    expect(adjustmentHelperSource).toContain("amount < 0 ? 'debit_teacher_retention' : 'credit_teacher_restoration'");
    expect(adjustmentSyncSource).toContain("financialOutcome: 'adjustment_already_satisfied'");
  });

  it('allows paid or partially paid attendance corrections into adjustment mode but still blocks ambiguous unsettled ledgers', () => {
    expect(teacherPayDecisionSource).toContain("financialHandlingMode: 'settled_adjustment'");
    expect(teacherPayDecisionSource).toContain("'settled_adjustment' : 'direct_accrual'");
    expect(teacherPayDecisionSource).toContain('isPaidOrPartiallyPaidEarning(earning)');
    expect(teacherPayDecisionSource).toContain(
      'Teacher payment handling cannot be changed after an unsettled financial ledger already exists.',
    );
    expect(teacherPayDecisionSource).toContain("teacherPayDecisionFinancialHandlingMode: financialHandlingMode");
  });

  it('wakes the settled adjustment synchronizer after the authoritative attendance correction is linked', () => {
    expect(teacherPayDecisionSource).toContain(
      "clean(session.teacherPayDecisionFinancialHandlingMode, 80) === 'settled_adjustment'",
    );
    expect(teacherPayDecisionSource).toContain('attendanceCorrectionId: correctionId');
    expect(adjustmentSyncSource).toContain("normalizeStatus(latestDecision.status) !== 'applied'");
    expect(adjustmentSyncSource).toContain(
      'clean(latestDecision.attendanceCorrectionId, 160) !== correctionId',
    );
  });

  it('stops Brick 3 direct withholding once the matching Brick 4 adjustment is posted', () => {
    expect(rateHelperSource).toContain("adjustmentStatus === 'posted'");
    expect(rateHelperSource).toContain('adjustmentDecisionId === decisionId');
    expect(rateHelperSource).toContain('session.teacherPayAdjustmentRequired === false');
  });

  it('provides a bounded admin-only signed adjustment report', () => {
    expect(reportSource).toContain("throw new HttpsError('permission-denied', 'Admin access required.')");
    expect(reportSource).toContain("collection('teacherEarningAdjustments')");
    expect(reportSource).toContain("where('adjustmentMonthKey', '==', adjustmentMonthKey)");
    expect(reportSource).toContain('const MAX_SCAN = 1000');
    expect(reportSource).toContain('debitTeacherTotal');
    expect(reportSource).toContain('creditTeacherRestorationTotal');
    expect(reportSource).toContain('netTeacherEntitlementAdjustment');
  });
});
