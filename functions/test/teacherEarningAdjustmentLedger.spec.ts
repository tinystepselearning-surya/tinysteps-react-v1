import { describe, expect, it } from 'vitest';
import {
  buildTeacherEarningAdjustmentId,
  buildTeacherEarningAdjustmentRecord,
  computeTeacherEarningAdjustmentDelta,
  teacherEarningAdjustmentMatches,
  TEACHER_EARNING_ADJUSTMENT_LEDGER_VERSION,
} from '../src/helpers/teacherEarningAdjustmentLedger';

describe('teacher earning adjustment ledger', () => {
  const baseSession = {
    teacherId: 'teacher-1',
    enrollmentId: 'enrollment-1',
    parentId: 'parent-1',
    kidId: 'kid-1',
    courseId: 'phonics',
    financialTermsCurrency: 'INR',
    teacherPayDisposition: 'retain_school',
    teacherPayDecisionReasonCode: 'attendance_not_updated',
    teacherPayDecisionReason: 'Teacher did not submit attendance before the deadline.',
    teacherPayDecisionCorrectionId: 'correction-1',
    teacherPayDecisionByUid: 'admin-1',
    teacherPayDecisionByName: 'Admin User',
    teacherPayDecisionByEmail: 'admin@example.com',
    teacherPayDecisionAt: '2026-09-07T00:10:00.000Z',
  };

  const paidEarning = {
    sessionId: 'session-1',
    teacherId: 'teacher-1',
    enrollmentId: 'enrollment-1',
    parentId: 'parent-1',
    kidId: 'kid-1',
    courseId: 'phonics',
    monthKey: '2026-08',
    currency: 'INR',
    amount: 175,
    paidAmount: 175,
    status: 'paid',
    source: 'session_present_completed',
  };

  it('posts a -175 entitlement adjustment instead of rewriting a paid ₹175 earning', () => {
    const calculation = computeTeacherEarningAdjustmentDelta({
      normalRate: 175,
      existingAdjustmentsTotal: 0,
      disposition: 'retain_school',
    });
    expect(calculation).toEqual({
      baseEntitlement: 175,
      targetEntitlement: 0,
      currentNetEntitlement: 175,
      delta: -175,
    });

    const record = buildTeacherEarningAdjustmentRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      correctionId: 'correction-1',
      normalRate: 175,
      existingAdjustmentsTotal: 0,
      adjustmentMonthKey: '2026-09',
      session: baseSession,
      earning: paidEarning,
    });

    expect(record).toMatchObject({
      ledgerVersion: TEACHER_EARNING_ADJUSTMENT_LEDGER_VERSION,
      adjustmentType: 'debit_teacher_retention',
      amount: -175,
      baseEntitlementAmount: 175,
      resultingNetEntitlement: 0,
      targetTeacherEntitlement: 0,
      normalTeacherRateSnapshot: 175,
      paidAmountAtAdjustment: 175,
      earningStatusAtAdjustment: 'paid',
      earningMonthKey: '2026-08',
      adjustmentMonthKey: '2026-09',
      teacherPayDisposition: 'retain_school',
      attendanceCorrectionId: 'correction-1',
      ledgerImmutable: true,
      status: 'posted',
    });
  });

  it('does not double-deduct when retain-school is already fully represented', () => {
    expect(computeTeacherEarningAdjustmentDelta({
      normalRate: 175,
      existingAdjustmentsTotal: -175,
      disposition: 'retain_school',
    })?.delta).toBe(0);
  });

  it('restores +175 through a new adjustment when a later correction credits the teacher', () => {
    const calculation = computeTeacherEarningAdjustmentDelta({
      normalRate: 175,
      existingAdjustmentsTotal: -175,
      disposition: 'credit_teacher',
    });
    expect(calculation).toEqual({
      baseEntitlement: 175,
      targetEntitlement: 175,
      currentNetEntitlement: 0,
      delta: 175,
    });

    const record = buildTeacherEarningAdjustmentRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-2',
      correctionId: 'correction-2',
      normalRate: 175,
      existingAdjustmentsTotal: -175,
      adjustmentMonthKey: '2026-10',
      session: {
        ...baseSession,
        teacherPayDisposition: 'credit_teacher',
        teacherPayDecisionReasonCode: 'normal_correction',
        teacherPayDecisionReason: 'Restore teacher entitlement after review.',
        teacherPayDecisionCorrectionId: 'correction-2',
      },
      earning: paidEarning,
    });

    expect(record).toMatchObject({
      adjustmentType: 'credit_teacher_restoration',
      amount: 175,
      priorAdjustmentsTotal: -175,
      resultingNetEntitlement: 175,
      teacherPayDisposition: 'credit_teacher',
    });
  });

  it('treats partial payment as immutable cash history and adjusts full entitlement', () => {
    const record = buildTeacherEarningAdjustmentRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      correctionId: 'correction-1',
      normalRate: 175,
      existingAdjustmentsTotal: 0,
      adjustmentMonthKey: '2026-09',
      session: baseSession,
      earning: { ...paidEarning, status: 'unpaid', paidAmount: 50 },
    });

    expect(record?.amount).toBe(-175);
    expect(record?.paidAmountAtAdjustment).toBe(50);
    expect(record?.resultingNetEntitlement).toBe(0);
  });

  it('uses a deterministic correction-linked document id', () => {
    expect(buildTeacherEarningAdjustmentId('session/1', 'correction/1')).toBe(
      'teacher_adjustment_session_1__correction_1',
    );
  });

  it('fails closed when normal rate or required audit identity is unresolved', () => {
    expect(buildTeacherEarningAdjustmentRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      correctionId: 'correction-1',
      normalRate: 0,
      existingAdjustmentsTotal: 0,
      adjustmentMonthKey: '2026-09',
      session: baseSession,
      earning: paidEarning,
    })).toBeNull();

    expect(buildTeacherEarningAdjustmentRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      correctionId: 'correction-1',
      normalRate: 175,
      existingAdjustmentsTotal: 0,
      adjustmentMonthKey: '2026-09',
      session: { teacherId: 'teacher-1', teacherPayDisposition: 'retain_school' },
      earning: paidEarning,
    })).toBeNull();
  });

  it('accepts exact immutable retries and rejects conflicting ledger identity', () => {
    const record = buildTeacherEarningAdjustmentRecord({
      sessionId: 'session-1',
      earningId: 'session-1',
      decisionId: 'decision-1',
      correctionId: 'correction-1',
      normalRate: 175,
      existingAdjustmentsTotal: 0,
      adjustmentMonthKey: '2026-09',
      session: baseSession,
      earning: paidEarning,
    });
    expect(record).not.toBeNull();

    expect(teacherEarningAdjustmentMatches({ ...record }, record!)).toBe(true);
    expect(teacherEarningAdjustmentMatches({ ...record, amount: -150 }, record!)).toBe(false);
    expect(teacherEarningAdjustmentMatches({ ...record, teacherId: 'teacher-2' }, record!)).toBe(false);
    expect(teacherEarningAdjustmentMatches({ ...record, attendanceCorrectionId: 'correction-2' }, record!)).toBe(false);
  });
});
