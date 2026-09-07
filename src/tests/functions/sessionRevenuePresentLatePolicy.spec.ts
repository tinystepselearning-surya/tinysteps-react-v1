import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const statusSource = readSource('functions/src/helpers/status.ts');
const revenueSource = readSource('functions/src/sessionRevenue.ts');
const reconciliationSource = readSource('functions/src/financeReconciliationReport.ts');
const correctionWorkflowSource = readSource('src/pages/admin/attendanceCorrectionTeacherPay.ts');
const correctionDecisionSource = readSource('functions/src/adminAttendanceCorrectionTeacherPayDecision.ts');
const mainPanelSource = readSource('src/pages/admin/AttendanceCorrectionsAdvancedPanel.tsx');
const historicalPanelSource = readSource('src/pages/admin/HistoricalAttendanceMissingSessionPanel.tsx');

describe('Finance Brick 6 Present/Late policy routing', () => {
  it('defines Present and Late as the canonical financially-earned attendance statuses', () => {
    expect(statusSource).toContain('isFinanciallyEarnedAttendanceStatus');
    expect(statusSource).toContain("status === 'present' || status === 'late'");
  });

  it('routes session revenue through the canonical policy without renaming legacy ledger source', () => {
    expect(revenueSource).toContain('isFinanciallyEarnedAttendanceStatus');
    expect(revenueSource).toContain('return isFinanciallyEarnedAttendanceStatus(status);');
    expect(revenueSource).not.toContain("return status === 'present';");
    expect(revenueSource).toContain("source: 'session_present_completed'");
  });

  it('keeps reconciliation expectations aligned for both Present and Late', () => {
    expect(reconciliationSource).toMatch(/attendanceStatus\s*===\s*'present'\s*\|\|\s*attendanceStatus\s*===\s*'late'/);
  });

  it('requires explicit teacher-pay handling when a correction newly becomes Present or Late', () => {
    expect(correctionWorkflowSource).toContain('requiresAttendanceCorrectionTeacherPayDecision');
    expect(correctionWorkflowSource).toContain('isFinanciallyEarnedAttendanceCorrectionStatus');
    expect(correctionWorkflowSource).toContain("intendedAttendanceStatus: 'present' | 'late'");
    expect(correctionWorkflowSource).toContain('intendedAttendanceStatus,');
  });

  it('keeps Present-to-Late and Late-to-Present corrections financially neutral', () => {
    expect(correctionWorkflowSource).toContain('isFinanciallyNeutralAttendedStatusTransition');
    expect(correctionWorkflowSource).toContain('previousStatus !== newStatus');
    expect(correctionWorkflowSource).toContain('if (!requiresDecision)');
  });

  it('binds prepared teacher-pay decisions to the exact Present/Late correction status', () => {
    expect(correctionDecisionSource).toContain('isFinanciallyEarnedAttendanceStatus(intendedAttendanceStatus)');
    expect(correctionDecisionSource).toContain('teacherPayDecisionAttendanceStatus: intendedAttendanceStatus');
    expect(correctionDecisionSource).toContain('decisionAttendanceStatus !== correctionStatus');
    expect(correctionDecisionSource).toContain('decision.intendedAttendanceStatus');
  });

  it('exposes payment handling for financially-earned corrections on both admin surfaces', () => {
    expect(mainPanelSource).toContain('requiresAttendanceCorrectionTeacherPayDecision');
    expect(historicalPanelSource).toContain('isFinanciallyEarnedAttendanceCorrectionStatus(status)');
    expect(historicalPanelSource).toContain('visible={isFinanciallyEarnedAttendanceCorrectionStatus(status)}');
  });
});
