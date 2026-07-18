import { describe, expect, it } from 'vitest';
import {
  buildOperationalEnrollmentKeyId,
  buildAdminManualSessionId,
  isLifecycleSessionProtected,
  resolveAdminManualSessionTimes,
} from '../src/lifecycle';
import { doesEnrollmentOccupyCourseSlot } from '../src/helpers/status';

describe('admin manual session lifecycle primitives', () => {
  it('uses enrollment, date and time as deterministic identity', () => {
    expect(buildAdminManualSessionId('enr-1', '2026-07-20', '12:00')).toBe('enr-1_20260720_1200');
  });

  it('builds a stable child/course uniqueness key without name identity', () => {
    expect(buildOperationalEnrollmentKeyId('kid/legacy', 'basic grammar')).toBe('kid%2Flegacy__basic%20grammar');
  });

  it('holds uniqueness for paused enrollment but releases terminal history', () => {
    expect(doesEnrollmentOccupyCourseSlot({ status: 'active' })).toBe(true);
    expect(doesEnrollmentOccupyCourseSlot({ status: 'paused' })).toBe(true);
    expect(doesEnrollmentOccupyCourseSlot({ status: 'completed' })).toBe(false);
    expect(doesEnrollmentOccupyCourseSlot({ status: 'archived' })).toBe(false);
  });

  it('builds timezone-safe IST start/end values', () => {
    const timing = resolveAdminManualSessionTimes('2026-07-20', '12:00', 35);
    expect(timing.startAt.toISOString()).toBe('2026-07-20T06:30:00.000Z');
    expect(timing.endAt.toISOString()).toBe('2026-07-20T07:05:00.000Z');
    expect(timing.endTime).toBe('12:35');
  });

  it('keeps completed, attended, billed and locked manual records protected', () => {
    expect(isLifecycleSessionProtected({ status: 'completed', isAdHoc: true })).toBe(true);
    expect(isLifecycleSessionProtected({ status: 'scheduled', isAdHoc: true, attendance: { kid: { status: 'present' } } })).toBe(true);
    expect(isLifecycleSessionProtected({ status: 'scheduled', isAdHoc: true, billedAt: '2026-07-20' })).toBe(true);
    expect(isLifecycleSessionProtected({ status: 'scheduled', isAdHoc: true, locked: true })).toBe(true);
  });
});
