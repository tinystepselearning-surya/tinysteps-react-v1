import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const functionsIndexSource = readFileSync(join(process.cwd(), 'functions/src/index.ts'), 'utf8');
const decisionSource = readFileSync(
  join(process.cwd(), 'functions/src/adminAttendanceCorrectionTeacherPayDecision.ts'),
  'utf8',
);
const withholdingSource = readFileSync(
  join(process.cwd(), 'functions/src/teacherPayWithholdingSync.ts'),
  'utf8',
);
const mainPanelSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/AttendanceCorrectionsAdvancedPanel.tsx'),
  'utf8',
);
const historicalPanelSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/HistoricalAttendanceMissingSessionPanel.tsx'),
  'utf8',
);
const workflowSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/attendanceCorrectionTeacherPay.ts'),
  'utf8',
);

describe('admin attendance correction teacher payment handling', () => {
  it('exports the audited decision and withholding functions', () => {
    expect(functionsIndexSource).toContain('prepareAdminAttendanceCorrectionTeacherPayDecision');
    expect(functionsIndexSource).toContain('cancelAdminAttendanceCorrectionTeacherPayDecision');
    expect(functionsIndexSource).toContain('onAdminAttendanceCorrectionTeacherPayDecisionLink');
    expect(functionsIndexSource).toContain('onTeacherPayWithholdingSync');
  });

  it('prepares a bounded decision before the Present attendance correction and cancels it on failure', () => {
    expect(workflowSource).toContain("prepareAdminAttendanceCorrectionTeacherPayDecision");
    expect(workflowSource).toContain("adminAttendanceCorrection");
    expect(workflowSource).toContain("cancelAdminAttendanceCorrectionTeacherPayDecision");

    const prepareCallIndex = workflowSource.indexOf('const prepared = await prepareFn(');
    const presentCorrectionCallIndex = workflowSource.indexOf(
      'const result = await correctionFn(',
      prepareCallIndex + 1,
    );
    const cancelCallIndex = workflowSource.indexOf('await cancelFn(', presentCorrectionCallIndex + 1);

    expect(prepareCallIndex).toBeGreaterThanOrEqual(0);
    expect(presentCorrectionCallIndex).toBeGreaterThan(prepareCallIndex);
    expect(cancelCallIndex).toBeGreaterThan(presentCorrectionCallIndex);
  });

  it('requires a conscious teacher-pay choice on both Present correction surfaces', () => {
    expect(mainPanelSource).toContain('TeacherPayHandlingControl');
    expect(mainPanelSource).toContain('validateAttendanceCorrectionTeacherPay');
    expect(historicalPanelSource).toContain('TeacherPayHandlingControl');
    expect(historicalPanelSource).toContain('validateAttendanceCorrectionTeacherPay');
    expect(workflowSource).toContain("'credit_teacher'");
    expect(workflowSource).toContain("'retain_school'");
  });

  it('keeps parent billing out of the teacher withholding synchronizer', () => {
    expect(withholdingSource).not.toContain("collection('billingCharges')");
    expect(withholdingSource).toContain("amount: 0");
    expect(withholdingSource).toContain("status: 'withheld'");
    expect(withholdingSource).toContain('expectedAmount: normalRate');
    expect(withholdingSource).toContain('withheldAmount: normalRate');
    expect(withholdingSource).toContain('schoolRetainedAmount: normalRate');
    expect(withholdingSource).toContain('teacherPayRateSnapshot: normalRate');
  });

  it('fails closed when a financial ledger already exists instead of rewriting paid history', () => {
    expect(decisionSource).toContain('session.revenueAccrued === true || earningSnap.exists || chargeSnap.exists');
    expect(decisionSource).toContain('Use the financial adjustment workflow');
    expect(withholdingSource).toContain("teacherPayAdjustmentReason: 'earning_already_paid'");
    expect(withholdingSource).not.toContain("status: 'void'");
  });

  it('links the teacher-pay decision to the authoritative attendance correction audit record', () => {
    expect(decisionSource).toContain("const SOURCE = 'admin-attendance-correction'");
    expect(decisionSource).toContain("document: 'classSessions/{sessionId}/attendanceCorrections/{correctionId}'");
    expect(decisionSource).toContain("teacherPayDecisionStatus: 'applied'");
    expect(decisionSource).toContain('teacherPayDecisionCorrectionId: correctionId');
    expect(decisionSource).toContain('source: SOURCE');
  });
});
