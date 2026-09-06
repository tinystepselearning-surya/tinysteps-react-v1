import { describe, expect, it } from 'vitest';
import {
  buildTeacherPayWithholdingLedgerRecord,
  teacherPayWithholdingLedgerMatches,
  TEACHER_PAY_WITHHOLDING_LEDGER_VERSION,
} from '../src/helpers/teacherPayWithholdingLedger';

describe('teacher pay withholding ledger', () => {
  const session = {
    teacherId: 'teacher-1',
    enrollmentId: 'enrollment-1',
    parentId: 'parent-1',
    kidId: 'kid-1',
    courseId: 'phonics',
    date: '2026-09-05',
    financialTermsCurrency: 'INR',
    teacherPayDecisionReasonCode: 'attendance_not_updated',
    teacherPayDecisionReason: 'Teacher did not submit attendance before the deadline.',
    teacherPayDecisionCorrectionId: 'correction-1',
    teacherPayDecisionByUid: 'admin-1',
    teacherPayDecisionByName: 'Admin User',
    teacherPayDecisionByEmail: 'admin@example.com',
    teacherPayDecisionAt: '2026-09-06T10:00:00.000Z',
  };

  const earning = {
    sessionId: 'session-1',
    teacherId: 'teacher-1',
    enrollmentId: 'enrollment-1',
    parentId: 'parent-1',
    kidId: 'kid-1',
    courseId: 'phonics',
    monthKey: '2026-09',
    currency: 'INR',
    source: 'session_present_completed',
  };

  it('builds one canonical school-retained record while preserving the normal teacher rate', () => {
    const record = buildTeacherPayWithholdingLedgerRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      normalRate: 175,
      session,
      earning,
    });

    expect(record).toEqual({
      ledgerVersion: TEACHER_PAY_WITHHOLDING_LEDGER_VERSION,
      recordType: 'teacher_pay_withholding',
      sessionId: 'session-1',
      teacherEarningId: 'session-1',
      enrollmentId: 'enrollment-1',
      kidId: 'kid-1',
      parentId: 'parent-1',
      teacherId: 'teacher-1',
      courseId: 'phonics',
      serviceDate: '2026-09-05',
      serviceMonthKey: '2026-09',
      monthKey: '2026-09',
      currency: 'INR',
      teacherRateSnapshot: 175,
      expectedTeacherAmount: 175,
      creditedTeacherAmount: 0,
      schoolRetainedAmount: 175,
      teacherPayDisposition: 'retain_school',
      reasonCode: 'attendance_not_updated',
      reason: 'Teacher did not submit attendance before the deadline.',
      attendanceCorrectionId: 'correction-1',
      teacherPayDecisionId: 'decision-1',
      decidedByUid: 'admin-1',
      decidedByName: 'Admin User',
      decidedByEmail: 'admin@example.com',
      decidedAt: '2026-09-06T10:00:00.000Z',
      status: 'active',
      source: 'admin-attendance-correction',
      ledgerImmutable: true,
    });
  });

  it('uses the earning month as the canonical service month fallback after audit identity is complete', () => {
    const record = buildTeacherPayWithholdingLedgerRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      normalRate: 175,
      session: {
        teacherId: 'teacher-1',
        teacherPayDecisionReasonCode: 'attendance_not_updated',
        teacherPayDecisionReason: 'Correction reason',
        teacherPayDecisionCorrectionId: 'correction-1',
        teacherPayDecisionByUid: 'admin-1',
        teacherPayDecisionAt: '2026-09-06T10:00:00.000Z',
      },
      earning: { teacherId: 'teacher-1', monthKey: '2026-09' },
    });

    expect(record?.serviceMonthKey).toBe('2026-09');
    expect(record?.monthKey).toBe('2026-09');
  });

  it('fails closed when required accounting or audit identity is unresolved', () => {
    expect(buildTeacherPayWithholdingLedgerRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      normalRate: 175,
      session: {},
      earning: { monthKey: '2026-09' },
    })).toBeNull();

    expect(buildTeacherPayWithholdingLedgerRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      normalRate: 175,
      session: {
        teacherId: 'teacher-1',
        teacherPayDecisionReasonCode: 'attendance_not_updated',
        teacherPayDecisionReason: 'Correction reason',
        teacherPayDecisionCorrectionId: 'correction-1',
        teacherPayDecisionByUid: 'admin-1',
      },
      earning: { teacherId: 'teacher-1', monthKey: '2026-09' },
    })).toBeNull();

    expect(buildTeacherPayWithholdingLedgerRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      normalRate: 0,
      session,
      earning,
    })).toBeNull();
  });

  it('accepts exact retries but rejects conflicting financial or audit identity', () => {
    const record = buildTeacherPayWithholdingLedgerRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      normalRate: 175,
      session,
      earning,
    });
    expect(record).not.toBeNull();

    expect(teacherPayWithholdingLedgerMatches({ ...record }, record!)).toBe(true);
    expect(teacherPayWithholdingLedgerMatches({ ...record, teacherPayDecisionId: 'decision-2' }, record!)).toBe(false);
    expect(teacherPayWithholdingLedgerMatches({ ...record, attendanceCorrectionId: 'correction-2' }, record!)).toBe(false);
    expect(teacherPayWithholdingLedgerMatches({ ...record, schoolRetainedAmount: 150 }, record!)).toBe(false);
    expect(teacherPayWithholdingLedgerMatches({ ...record, parentId: 'parent-2' }, record!)).toBe(false);
    expect(teacherPayWithholdingLedgerMatches({ ...record, reason: 'Different reason' }, record!)).toBe(false);
    expect(teacherPayWithholdingLedgerMatches({ ...record, currency: 'USD' }, record!)).toBe(false);
  });
});
