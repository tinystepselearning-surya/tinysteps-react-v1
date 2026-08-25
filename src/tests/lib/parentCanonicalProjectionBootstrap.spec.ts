import { describe, expect, it } from 'vitest';

import {
  attendanceBootstrapRequestId,
  courseBootstrapRequestId,
  currentIndiaMonthKey,
  normalizeBootstrapCourseId,
} from '../../lib/parentCanonicalProjectionBootstrap';

describe('parent canonical projection bootstrap client contract', () => {
  it('canonicalizes legacy course aliases before building the saved-lesson repair request id', () => {
    expect(normalizeBootstrapCourseId('EARLY-PHONICS')).toBe('early-phonics');
    expect(normalizeBootstrapCourseId('phonics-early')).toBe('early-phonics');
    expect(normalizeBootstrapCourseId('foundation')).toBe('phonics-foundations');
    expect(courseBootstrapRequestId('phonics-early')).toBe('v2-course-early-phonics');
  });

  it('rejects unsafe course ids instead of creating arbitrary document paths', () => {
    expect(courseBootstrapRequestId('early phonics')).toBeNull();
    expect(courseBootstrapRequestId('early/phonics')).toBeNull();
    expect(courseBootstrapRequestId('x'.repeat(101))).toBeNull();
  });

  it('builds deterministic attendance request ids only for month keys', () => {
    expect(attendanceBootstrapRequestId('2026-08')).toBe('v1-attendance-2026-08');
    expect(attendanceBootstrapRequestId('2026-8')).toBeNull();
    expect(attendanceBootstrapRequestId('2026-08-25')).toBeNull();
  });

  it('uses the IST calendar month at UTC month boundaries', () => {
    expect(currentIndiaMonthKey(Date.parse('2026-08-31T17:00:00Z'))).toBe('2026-08');
    expect(currentIndiaMonthKey(Date.parse('2026-08-31T20:00:00Z'))).toBe('2026-09');
  });
});
