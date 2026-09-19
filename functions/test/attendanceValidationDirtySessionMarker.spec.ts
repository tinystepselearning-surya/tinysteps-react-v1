import { describe, expect, it } from 'vitest';
import {
  ATTENDANCE_VALIDATION_DIRTY_START_YMD,
  hasAttendanceValidationAttendanceChange,
  resolveAttendanceValidationServiceDateYmd,
} from '../src/attendanceValidation/dirtySessionMarker';

describe('AVS dirty-session marker policy', () => {
  it('detects canonical attendance changes but ignores notes-only edits', () => {
    expect(hasAttendanceValidationAttendanceChange(
      { kid1: { status: 'present', notes: 'old' } },
      { kid1: { status: 'present', notes: 'new' } },
    )).toBe(false);

    expect(hasAttendanceValidationAttendanceChange(
      { kid1: { status: 'absent' } },
      { kid1: { status: 'present' } },
    )).toBe(true);
  });

  it('normalizes legacy attendance aliases before deciding whether a session is dirty', () => {
    expect(hasAttendanceValidationAttendanceChange(
      { kid1: { status: 'late' } },
      { kid1: { status: 'present' } },
    )).toBe(false);

    expect(hasAttendanceValidationAttendanceChange(
      { kid1: { status: 'no_show' } },
      { kid1: { status: 'absent' } },
    )).toBe(false);
  });

  it('resolves the canonical Tiny Steps service date without Firestore reads', () => {
    expect(resolveAttendanceValidationServiceDateYmd({
      date: '2026-09-18',
    })).toBe('2026-09-18');

    expect(resolveAttendanceValidationServiceDateYmd({
      startAt: { seconds: Date.parse('2026-08-31T18:30:00.000Z') / 1000 },
    })).toBe('2026-09-01');
  });

  it('keeps the dirty queue aligned with the permanent AVS lower bound', () => {
    expect(ATTENDANCE_VALIDATION_DIRTY_START_YMD).toBe('2026-09-01');
  });
});
