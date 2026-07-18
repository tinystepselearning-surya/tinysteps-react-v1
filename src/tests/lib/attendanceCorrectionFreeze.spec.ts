import { describe, expect, it } from 'vitest';
import {
  ATTENDANCE_FINALISED_MESSAGE,
  getTeacherAttendanceCorrectionCutoffMillis,
  isTeacherAttendanceCorrectionAllowed,
} from '../../lib/attendanceCorrectionFreeze';

describe('frontend attendance correction freeze', () => {
  it('matches the July 2026 freeze boundary in Asia/Kolkata', () => {
    const session = { date: '2026-07-01' };
    const cutoff = Date.parse('2026-08-06T00:00:00+05:30');

    expect(getTeacherAttendanceCorrectionCutoffMillis(session)).toBe(cutoff);
    expect(isTeacherAttendanceCorrectionAllowed(session, cutoff - 1)).toBe(true);
    expect(isTeacherAttendanceCorrectionAllowed(session, cutoff)).toBe(false);
  });

  it('provides the required finalised-month explanation', () => {
    expect(ATTENDANCE_FINALISED_MESSAGE).toBe(
      'Attendance for this month was finalised on the 5th of the following month. Further corrections are not permitted.',
    );
  });
});
