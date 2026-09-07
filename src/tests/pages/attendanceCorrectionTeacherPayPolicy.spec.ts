import { describe, expect, it } from 'vitest';
import {
  isFinanciallyEarnedAttendanceCorrectionStatus,
  isFinanciallyNeutralAttendedStatusTransition,
  requiresAttendanceCorrectionTeacherPayDecision,
  validateAttendanceCorrectionTeacherPay,
} from '../../pages/admin/attendanceCorrectionTeacherPay';

describe('attendance correction teacher-pay policy', () => {
  it('recognizes Present and Late as financially earned', () => {
    expect(isFinanciallyEarnedAttendanceCorrectionStatus('present')).toBe(true);
    expect(isFinanciallyEarnedAttendanceCorrectionStatus('LATE')).toBe(true);
    expect(isFinanciallyEarnedAttendanceCorrectionStatus('absent')).toBe(false);
  });

  it('keeps Present to Late and Late to Present financially neutral', () => {
    expect(isFinanciallyNeutralAttendedStatusTransition({ previousStatus: 'present', newStatus: 'late' })).toBe(true);
    expect(isFinanciallyNeutralAttendedStatusTransition({ previousStatus: 'late', newStatus: 'present' })).toBe(true);
    expect(requiresAttendanceCorrectionTeacherPayDecision({ previousStatus: 'present', newStatus: 'late' })).toBe(false);
    expect(requiresAttendanceCorrectionTeacherPayDecision({ previousStatus: 'late', newStatus: 'present' })).toBe(false);
  });

  it('requires an explicit decision when attendance newly becomes Present or Late', () => {
    expect(requiresAttendanceCorrectionTeacherPayDecision({ previousStatus: 'absent', newStatus: 'present' })).toBe(true);
    expect(requiresAttendanceCorrectionTeacherPayDecision({ previousStatus: 'absent', newStatus: 'late' })).toBe(true);
    expect(requiresAttendanceCorrectionTeacherPayDecision({ previousStatus: 'not_marked', newStatus: 'late' })).toBe(true);
  });

  it('does not require teacher-pay handling when a class becomes non-earned', () => {
    expect(requiresAttendanceCorrectionTeacherPayDecision({ previousStatus: 'late', newStatus: 'absent' })).toBe(false);
    expect(requiresAttendanceCorrectionTeacherPayDecision({ previousStatus: 'present', newStatus: 'cancelled' })).toBe(false);
  });

  it('requires a retention reason for both Present and Late retain-school corrections', () => {
    expect(validateAttendanceCorrectionTeacherPay({
      previousStatus: 'absent',
      newStatus: 'present',
      teacherPayDisposition: 'retain_school',
      teacherPayReasonCode: '',
    })).toBe('Choose a reason for retaining the teacher payment.');

    expect(validateAttendanceCorrectionTeacherPay({
      previousStatus: 'absent',
      newStatus: 'late',
      teacherPayDisposition: 'retain_school',
      teacherPayReasonCode: '',
    })).toBe('Choose a reason for retaining the teacher payment.');
  });

  it('does not silently default a new Late correction to normal teacher credit', () => {
    expect(validateAttendanceCorrectionTeacherPay({
      previousStatus: 'absent',
      newStatus: 'late',
      teacherPayDisposition: '',
      teacherPayReasonCode: '',
    })).toBe('Choose how teacher payment should be handled for this Late correction.');
  });
});
