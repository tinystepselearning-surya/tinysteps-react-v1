import { describe, expect, it } from 'vitest';

import {
  MAX_CHILD_PROGRESS_BOOTSTRAP_DOCS,
  currentIndiaMonthKey,
  isCurrentIndiaMonthKey,
  isSupportedCourseBootstrapRequestId,
  normalizeBootstrapKind,
} from '../src/parentCanonicalProjectionBootstrap';

describe('parent canonical projection bootstrap guardrails', () => {
  it('accepts only the two supported bounded bootstrap kinds', () => {
    expect(normalizeBootstrapKind('course_progress')).toBe('course_progress');
    expect(normalizeBootstrapKind('class_attendance')).toBe('class_attendance');
    expect(normalizeBootstrapKind('finance')).toBeNull();
    expect(normalizeBootstrapKind(undefined)).toBeNull();
  });

  it('accepts the saved-lesson v2 repair id while preserving v1 rollout compatibility', () => {
    expect(isSupportedCourseBootstrapRequestId('v1-course-early-phonics', 'early-phonics')).toBe(true);
    expect(isSupportedCourseBootstrapRequestId('v2-course-early-phonics', 'early-phonics')).toBe(true);
    expect(isSupportedCourseBootstrapRequestId('v2-course-early-phonics', 'phonics-foundations')).toBe(false);
    expect(isSupportedCourseBootstrapRequestId('v3-course-early-phonics', 'early-phonics')).toBe(false);
  });

  it('keeps the child progress bootstrap scan hard-capped', () => {
    expect(MAX_CHILD_PROGRESS_BOOTSTRAP_DOCS).toBe(250);
  });

  it('uses the IST calendar month for attendance bootstrap eligibility', () => {
    const beforeBoundary = Date.parse('2026-08-31T17:00:00Z');
    const afterBoundary = Date.parse('2026-08-31T20:00:00Z');

    expect(currentIndiaMonthKey(beforeBoundary)).toBe('2026-08');
    expect(isCurrentIndiaMonthKey('2026-08', beforeBoundary)).toBe(true);
    expect(isCurrentIndiaMonthKey('2026-09', beforeBoundary)).toBe(false);

    expect(currentIndiaMonthKey(afterBoundary)).toBe('2026-09');
    expect(isCurrentIndiaMonthKey('2026-09', afterBoundary)).toBe(true);
    expect(isCurrentIndiaMonthKey('2026-08', afterBoundary)).toBe(false);
  });
});
