import { type Functions, httpsCallable } from 'firebase/functions';

export type AttendanceCorrectionTeacherPayDisposition = '' | 'credit_teacher' | 'retain_school';

export type AttendanceCorrectionTeacherPayReasonCode =
  | ''
  | 'attendance_submitted_after_deadline'
  | 'attendance_not_updated'
  | 'admin_correction_due_to_teacher_omission'
  | 'other';

export type AttendanceCorrectionTeacherPayInput = {
  sessionId: string;
  kidId: string;
  previousStatus?: string;
  newStatus: string;
  reason: string;
  teacherPayDisposition: AttendanceCorrectionTeacherPayDisposition;
  teacherPayReasonCode: AttendanceCorrectionTeacherPayReasonCode;
};

export const TEACHER_PAY_RETENTION_REASON_OPTIONS: Array<{
  value: Exclude<AttendanceCorrectionTeacherPayReasonCode, ''>;
  label: string;
}> = [
  { value: 'attendance_submitted_after_deadline', label: 'Attendance submitted after deadline' },
  { value: 'attendance_not_updated', label: 'Teacher failed to update attendance' },
  { value: 'admin_correction_due_to_teacher_omission', label: 'Administrative correction due to teacher omission' },
  { value: 'other', label: 'Other' },
];

export function isFinanciallyEarnedAttendanceCorrectionStatus(value: unknown): boolean {
  const status = String(value || '').trim().toLowerCase();
  return status === 'present' || status === 'late';
}

export function isFinanciallyNeutralAttendedStatusTransition(input: {
  previousStatus?: unknown;
  newStatus?: unknown;
}): boolean {
  const previousStatus = String(input.previousStatus || '').trim().toLowerCase();
  const newStatus = String(input.newStatus || '').trim().toLowerCase();
  return (
    previousStatus !== newStatus &&
    isFinanciallyEarnedAttendanceCorrectionStatus(previousStatus) &&
    isFinanciallyEarnedAttendanceCorrectionStatus(newStatus)
  );
}

export function requiresAttendanceCorrectionTeacherPayDecision(input: {
  previousStatus?: unknown;
  newStatus?: unknown;
}): boolean {
  if (!isFinanciallyEarnedAttendanceCorrectionStatus(input.newStatus)) return false;
  return !isFinanciallyNeutralAttendedStatusTransition(input);
}

export function validateAttendanceCorrectionTeacherPay(input: {
  previousStatus?: string;
  newStatus: string;
  teacherPayDisposition: AttendanceCorrectionTeacherPayDisposition;
  teacherPayReasonCode: AttendanceCorrectionTeacherPayReasonCode;
}): string | null {
  if (!requiresAttendanceCorrectionTeacherPayDecision(input)) return null;
  const statusLabel = String(input.newStatus || '').trim().toLowerCase() === 'late' ? 'Late' : 'Present';
  if (!input.teacherPayDisposition) {
    return `Choose how teacher payment should be handled for this ${statusLabel} correction.`;
  }
  if (input.teacherPayDisposition === 'retain_school' && !input.teacherPayReasonCode) {
    return 'Choose a reason for retaining the teacher payment.';
  }
  return null;
}

export async function saveAdminAttendanceCorrectionWithTeacherPayDecision(
  functions: Functions,
  input: AttendanceCorrectionTeacherPayInput,
): Promise<{ ok: boolean; correctionId?: string }> {
  const correctionFn = httpsCallable<
    { sessionId: string; kidId: string; newStatus: string; reason: string },
    { ok: boolean; correctionId?: string }
  >(functions, 'adminAttendanceCorrection');

  const normalizedStatus = String(input.newStatus || '').trim().toLowerCase();
  const requiresDecision = requiresAttendanceCorrectionTeacherPayDecision({
    previousStatus: input.previousStatus,
    newStatus: normalizedStatus,
  });
  if (!requiresDecision) {
    const result = await correctionFn({
      sessionId: input.sessionId,
      kidId: input.kidId,
      newStatus: input.newStatus,
      reason: input.reason,
    });
    return result.data;
  }

  const validationError = validateAttendanceCorrectionTeacherPay(input);
  if (validationError) throw new Error(validationError);

  const prepareFn = httpsCallable<
    {
      sessionId: string;
      kidId: string;
      intendedAttendanceStatus: 'present' | 'late';
      teacherPayDisposition: Exclude<AttendanceCorrectionTeacherPayDisposition, ''>;
      reasonCode: string;
      reason: string;
    },
    { ok: boolean; decisionId: string; teacherPayDisposition: string; validUntilMs: number }
  >(functions, 'prepareAdminAttendanceCorrectionTeacherPayDecision');

  const cancelFn = httpsCallable<
    { sessionId: string; decisionId: string },
    { ok: boolean }
  >(functions, 'cancelAdminAttendanceCorrectionTeacherPayDecision');

  const intendedAttendanceStatus = normalizedStatus === 'late' ? 'late' : 'present';
  const prepared = await prepareFn({
    sessionId: input.sessionId,
    kidId: input.kidId,
    intendedAttendanceStatus,
    teacherPayDisposition: input.teacherPayDisposition as Exclude<AttendanceCorrectionTeacherPayDisposition, ''>,
    reasonCode: input.teacherPayDisposition === 'credit_teacher'
      ? 'normal_correction'
      : input.teacherPayReasonCode,
    reason: input.reason,
  });

  const decisionId = String(prepared.data?.decisionId || '').trim();
  if (!decisionId) throw new Error('Teacher payment decision could not be prepared.');

  try {
    const result = await correctionFn({
      sessionId: input.sessionId,
      kidId: input.kidId,
      newStatus: input.newStatus,
      reason: input.reason,
    });
    return result.data;
  } catch (error) {
    try {
      await cancelFn({ sessionId: input.sessionId, decisionId });
    } catch (cancelError) {
      console.error('Failed to cancel pending attendance correction teacher-pay decision', {
        sessionId: input.sessionId,
        decisionId,
        cancelError,
      });
    }
    throw error;
  }
}
