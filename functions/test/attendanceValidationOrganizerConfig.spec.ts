import { describe, expect, it } from 'vitest';
import {
  ATTENDANCE_VALIDATION_CONFIG_COLLECTION,
  ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC,
  AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT,
} from '../src/attendanceValidation/organizerConfig';

describe('AVS Teams organizer config contract', () => {
  it('keeps organizer configuration backend-only and bounded', () => {
    expect(ATTENDANCE_VALIDATION_CONFIG_COLLECTION)
      .toBe('attendanceValidationConfig');
    expect(ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC).toBe('teams');
    expect(AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT).toBe(25);
  });
});
