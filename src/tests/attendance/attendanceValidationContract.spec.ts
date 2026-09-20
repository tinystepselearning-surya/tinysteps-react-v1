import { describe, expect, it } from 'vitest';
import {
  ATTENDANCE_SYSTEM_OF_RECORD,
  ATTENDANCE_VALIDATION_CLASSIFICATIONS,
  ATTENDANCE_VALIDATION_COLLECTIONS,
  ATTENDANCE_VALIDATION_CONFIDENCE_THRESHOLDS,
  ATTENDANCE_VALIDATION_EVIDENCE_LAYERS,
  ATTENDANCE_VALIDATION_READ_ONLY_COLLECTIONS,
  STORE_FULL_TEAMS_TRANSCRIPT_BY_DEFAULT,
  TRANSCRIPT_ABSENCE_PROVES_STUDENT_ABSENCE,
  VALIDATOR_MAY_DIRECTLY_MUTATE_OPERATIONAL_ATTENDANCE,
  attendanceValidationConfidenceBand,
  isAttendanceValidationOwnedCollection,
  mayAttendanceValidatorWriteCollection,
  normalizeCanonicalAttendanceOutcome,
} from '../../lib/attendanceValidationContract';

describe('AV0 attendance validation contract', () => {
  it('keeps Tiny Steps as the attendance system of record', () => {
    expect(ATTENDANCE_SYSTEM_OF_RECORD).toBe('tiny_steps');
    expect(VALIDATOR_MAY_DIRECTLY_MUTATE_OPERATIONAL_ATTENDANCE).toBe(false);
  });

  it('uses only Present, Absent and Rescheduled as canonical attendance outcomes', () => {
    expect(normalizeCanonicalAttendanceOutcome('present')).toBe('present');
    expect(normalizeCanonicalAttendanceOutcome('absent')).toBe('absent');
    expect(normalizeCanonicalAttendanceOutcome('rescheduled')).toBe('rescheduled');
    expect(normalizeCanonicalAttendanceOutcome('reschedule_requested')).toBe('rescheduled');
  });

  it('folds historical Late into Present without introducing a fourth outcome', () => {
    expect(normalizeCanonicalAttendanceOutcome('late')).toBe('present');
    expect(normalizeCanonicalAttendanceOutcome({ status: 'late' })).toBe('present');
  });

  it('normalizes historical no-show semantics to Absent but leaves unrelated lifecycle states unresolved', () => {
    expect(normalizeCanonicalAttendanceOutcome('no_show')).toBe('absent');
    expect(normalizeCanonicalAttendanceOutcome('cancelled')).toBeNull();
    expect(normalizeCanonicalAttendanceOutcome('completed')).toBeNull();
  });

  it('defines the complete validation case classification vocabulary', () => {
    expect(ATTENDANCE_VALIDATION_CLASSIFICATIONS).toEqual([
      'VERIFIED',
      'MISSING_ATTENDANCE',
      'ATTENDANCE_CONFLICT',
      'POSSIBLE_FALSE_PRESENT',
      'NO_CLASS_OCCURRED',
      'MISSING_TEAMS_EVIDENCE',
      'ORPHAN_TEAMS_CLASS',
      'AMBIGUOUS',
    ]);
  });

  it('uses session identity, Teams attendance and Teams transcript as distinct evidence layers', () => {
    expect(ATTENDANCE_VALIDATION_EVIDENCE_LAYERS).toEqual([
      'tiny_steps_session',
      'teams_attendance_report',
      'teams_transcript',
    ]);
    expect(TRANSCRIPT_ABSENCE_PROVES_STUDENT_ABSENCE).toBe(false);
    expect(STORE_FULL_TEAMS_TRANSCRIPT_BY_DEFAULT).toBe(false);
  });

  it('keeps validation writes inside validation-owned collections only', () => {
    for (const collectionName of Object.values(ATTENDANCE_VALIDATION_COLLECTIONS)) {
      expect(isAttendanceValidationOwnedCollection(collectionName)).toBe(true);
      expect(mayAttendanceValidatorWriteCollection(collectionName)).toBe(true);
      expect(mayAttendanceValidatorWriteCollection(`${collectionName}/example`)).toBe(true);
    }

    for (const collectionName of ATTENDANCE_VALIDATION_READ_ONLY_COLLECTIONS) {
      expect(mayAttendanceValidatorWriteCollection(collectionName)).toBe(false);
      expect(mayAttendanceValidatorWriteCollection(`${collectionName}/example`)).toBe(false);
    }
  });

  it('keeps the initial matching bands deterministic and review-oriented', () => {
    expect(ATTENDANCE_VALIDATION_CONFIDENCE_THRESHOLDS).toEqual({
      verified: 90,
      probable: 75,
      needsReview: 50,
    });
    expect(attendanceValidationConfidenceBand(100)).toBe('verified');
    expect(attendanceValidationConfidenceBand(90)).toBe('verified');
    expect(attendanceValidationConfidenceBand(89)).toBe('probable');
    expect(attendanceValidationConfidenceBand(75)).toBe('probable');
    expect(attendanceValidationConfidenceBand(74)).toBe('needs_review');
    expect(attendanceValidationConfidenceBand(50)).toBe('needs_review');
    expect(attendanceValidationConfidenceBand(49)).toBe('unmatched');
  });
});
