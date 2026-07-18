import { describe, expect, it } from 'vitest';
import {
  getTeacherAttendanceCorrectionCutoffMillis,
  isTeacherAttendanceCorrectionAllowed,
  resolveSessionScheduledDateYmdIST,
} from '../src/helpers/attendanceCorrectionFreeze';

describe('teacher monthly attendance correction freeze', () => {
  it('allows July corrections through 5 August IST and locks exactly at 6 August', () => {
    const session = { date: '2026-07-31' };
    const cutoff = Date.parse('2026-08-06T00:00:00+05:30');

    expect(getTeacherAttendanceCorrectionCutoffMillis(session)).toBe(cutoff);
    expect(isTeacherAttendanceCorrectionAllowed(session, cutoff - 1)).toBe(true);
    expect(isTeacherAttendanceCorrectionAllowed(session, cutoff)).toBe(false);
  });

  it('rolls December sessions into the next calendar year', () => {
    expect(getTeacherAttendanceCorrectionCutoffMillis({ date: '2026-12-01' }))
      .toBe(Date.parse('2027-01-06T00:00:00+05:30'));
  });

  it('uses the session date before startAt and falls back to startAt in IST', () => {
    expect(resolveSessionScheduledDateYmdIST({
      date: '2026-07-31',
      startAt: new Date('2026-08-01T00:00:00.000Z'),
    })).toBe('2026-07-31');
    expect(resolveSessionScheduledDateYmdIST({
      startAt: new Date('2026-07-31T20:00:00.000Z'),
    })).toBe('2026-08-01');
  });

  it('fails closed when no scheduled date can be verified', () => {
    expect(getTeacherAttendanceCorrectionCutoffMillis({})).toBeNull();
    expect(isTeacherAttendanceCorrectionAllowed({}, Date.now())).toBe(false);
  });
});
