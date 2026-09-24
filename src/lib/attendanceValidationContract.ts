export const ATTENDANCE_VALIDATION_CONTRACT_VERSION = 2 as const;

export const ATTENDANCE_VALIDATION_PRESENT_OVERLAP_SECONDS = 25 * 60;
export const ATTENDANCE_VALIDATION_PRESENT_OVERLAP_COMPARISON =
  'strictly_greater_than' as const;

/**
 * Tiny Steps remains the operational attendance system of record.
 * The validator is a sidecar observer and exception detector only.
 */
export const ATTENDANCE_SYSTEM_OF_RECORD = 'tiny_steps' as const;
export const VALIDATOR_MAY_DIRECTLY_MUTATE_OPERATIONAL_ATTENDANCE = false as const;
export const STORE_FULL_TEAMS_TRANSCRIPT_BY_DEFAULT = false as const;
export const TRANSCRIPT_ABSENCE_PROVES_STUDENT_ABSENCE = false as const;

export type CanonicalAttendanceOutcome = 'present' | 'absent' | 'rescheduled';

export const ATTENDANCE_VALIDATION_CLASSIFICATIONS = [
  'VERIFIED',
  'MISSING_ATTENDANCE',
  'ATTENDANCE_CONFLICT',
  'POSSIBLE_FALSE_PRESENT',
  'NO_CLASS_OCCURRED',
  'MISSING_TEAMS_EVIDENCE',
  'ORPHAN_TEAMS_CLASS',
  'AMBIGUOUS',
] as const;

export type AttendanceValidationClassification =
  (typeof ATTENDANCE_VALIDATION_CLASSIFICATIONS)[number];

export const ATTENDANCE_VALIDATION_EVIDENCE_LAYERS = [
  'tiny_steps_session',
  'teams_attendance_report',
  'teams_transcript',
] as const;

export type AttendanceValidationEvidenceLayer =
  (typeof ATTENDANCE_VALIDATION_EVIDENCE_LAYERS)[number];

export const ATTENDANCE_VALIDATION_REASON_CODES = [
  'exact_meeting_url',
  'meeting_id_match',
  'teacher_matched',
  'time_overlap',
  'expected_participant',
  'guest_or_parent_participant',
  'teaching_activity',
  'transcript_missing',
  'attendance_report_missing',
  'short_or_incomplete_meeting',
  'teacher_only_meeting',
  'reschedule_chain',
  'legacy_late_normalized_to_present',
] as const;

export type AttendanceValidationReasonCode =
  (typeof ATTENDANCE_VALIDATION_REASON_CODES)[number];

export type AttendanceValidationConfidenceBand =
  | 'verified'
  | 'probable'
  | 'needs_review'
  | 'unmatched';

/**
 * Initial deterministic matching bands. These remain diagnostic inputs only.
 * Contract v2 separately adopts the business-approved teacher/learner overlap
 * rule: strictly more than 25 minutes inside the scheduled class window.
 */
export const ATTENDANCE_VALIDATION_CONFIDENCE_THRESHOLDS = {
  verified: 90,
  probable: 75,
  needsReview: 50,
} as const;

export const ATTENDANCE_VALIDATION_COLLECTIONS = {
  runs: 'attendanceValidationRuns',
  evidence: 'attendanceValidationEvidence',
  cases: 'attendanceValidationCases',
  resolutions: 'attendanceValidationResolutions',
  dirtySessions: 'attendanceValidationDirtySessions',
  baselineRanges: 'attendanceValidationBaselineRanges',
  forceFreshRanges: 'attendanceValidationForceFreshRanges',
  forceFreshRuns: 'attendanceValidationForceFreshRuns',
  config: 'attendanceValidationConfig',
} as const;

/** Existing production collections are read-only from the validator. */
export const ATTENDANCE_VALIDATION_READ_ONLY_COLLECTIONS = [
  'classSessions',
  'enrollments',
  'kids',
  'users',
  'rescheduleCredits',
  'billingCharges',
  'teacherEarnings',
] as const;

export type AttendanceValidationResolutionStatus =
  | 'open'
  | 'needs_review'
  | 'verified'
  | 'resolved'
  | 'ignored';

export type AttendanceValidationRecommendedAction =
  | 'none'
  | 'review'
  | 'correct_to_present'
  | 'correct_to_absent'
  | 'mark_rescheduled'
  | 'create_missing_session';

export interface AttendanceValidationEvidenceReference {
  meetingId?: string | null;
  transcriptId?: string | null;
  attendanceReportId?: string | null;
  joinUrl?: string | null;
  durationMinutes?: number | null;
  participantCount?: number | null;
  transcriptAvailable?: boolean;
  attendanceReportAvailable?: boolean;
  teachingActivityDetected?: boolean | null;
}

export interface AttendanceValidationCaseContract {
  sessionId?: string | null;
  enrollmentId?: string | null;
  teacherId?: string | null;
  kidId?: string | null;
  tinyStepsAttendance: CanonicalAttendanceOutcome | null;
  classification: AttendanceValidationClassification;
  matchConfidenceScore: number;
  matchConfidenceBand: AttendanceValidationConfidenceBand;
  reasonCodes: AttendanceValidationReasonCode[];
  evidence: AttendanceValidationEvidenceReference;
  recommendedAction: AttendanceValidationRecommendedAction;
  resolutionStatus: AttendanceValidationResolutionStatus;
}

function normalizeToken(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/-/g, '_');
}

function resolveStatusValue(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return (value as { status?: unknown }).status;
  }
  return value;
}

/**
 * Canonical validation vocabulary is intentionally only three outcomes.
 * Historical Late remains readable but is interpreted as Present; it is not a
 * fourth validation outcome and no historical document is rewritten here.
 */
export function normalizeCanonicalAttendanceOutcome(
  value: unknown,
): CanonicalAttendanceOutcome | null {
  const status = normalizeToken(resolveStatusValue(value));
  if (status === 'present' || status === 'late') return 'present';
  if (status === 'absent' || status === 'no_show' || status === 'noshow') return 'absent';
  if (
    status === 'rescheduled' ||
    status === 'reschedule' ||
    status === 'reschedule_requested' ||
    status === 'rescheduled_requested'
  ) {
    return 'rescheduled';
  }
  return null;
}

export function attendanceValidationConfidenceBand(
  score: number,
): AttendanceValidationConfidenceBand {
  const normalized = Number.isFinite(score) ? score : 0;
  if (normalized >= ATTENDANCE_VALIDATION_CONFIDENCE_THRESHOLDS.verified) return 'verified';
  if (normalized >= ATTENDANCE_VALIDATION_CONFIDENCE_THRESHOLDS.probable) return 'probable';
  if (normalized >= ATTENDANCE_VALIDATION_CONFIDENCE_THRESHOLDS.needsReview) return 'needs_review';
  return 'unmatched';
}

function rootCollection(path: string): string {
  return String(path || '').trim().replace(/^\/+/, '').split('/')[0] || '';
}

export function isAttendanceValidationOwnedCollection(path: string): boolean {
  const root = rootCollection(path);
  return Object.values(ATTENDANCE_VALIDATION_COLLECTIONS).includes(
    root as (typeof ATTENDANCE_VALIDATION_COLLECTIONS)[keyof typeof ATTENDANCE_VALIDATION_COLLECTIONS],
  );
}

/**
 * Hard AV0 write boundary: validation code may write only validation-owned
 * collections. Operational attendance/finance changes must go through the
 * existing approved admin correction / manual-session pathways in AV7.
 */
export function mayAttendanceValidatorWriteCollection(path: string): boolean {
  return isAttendanceValidationOwnedCollection(path);
}
