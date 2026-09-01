import { describe, expect, it } from 'vitest';
import {
  PARENT_CLASS_ATTENDANCE_INCREMENTAL_ENABLED_ENV,
} from '../src/parentMonthlyClassAttendanceProjectionV4';
import {
  PARENT_CLASS_ATTENDANCE_BRICK_1F_MODE,
  PARENT_CLASS_ATTENDANCE_INCREMENTAL_WRITES_ARMED,
  PARENT_CLASS_ATTENDANCE_SHADOW_DEFAULT_ENABLED,
  PARENT_CLASS_ATTENDANCE_SHADOW_KILL_SWITCH_ENV,
  onClassSessionReadModelWriteShadowOnly,
  resolveParentClassAttendanceShadowActivation,
} from '../src/parentMonthlyClassAttendanceShadowActivation';
import {
  onClassSessionReadModelWrite,
} from '../src/parentMonthlyAttendanceProjection';

describe('parent class-attendance Brick 1F shadow activation', () => {
  it('activates shadow mode by default while keeping incremental writes hard-disabled', () => {
    const activation = resolveParentClassAttendanceShadowActivation({});

    expect(PARENT_CLASS_ATTENDANCE_BRICK_1F_MODE).toBe('shadow_only');
    expect(PARENT_CLASS_ATTENDANCE_INCREMENTAL_WRITES_ARMED).toBe(false);
    expect(PARENT_CLASS_ATTENDANCE_SHADOW_DEFAULT_ENABLED).toBe(true);
    expect(activation).toEqual({
      mode: 'shadow_only',
      incrementalEnabled: false,
      shadowEnabled: true,
      incrementalRequested: false,
      shadowKillSwitchEnabled: false,
    });
  });

  it('ignores an accidental incremental=true environment request during Brick 1F', () => {
    const activation = resolveParentClassAttendanceShadowActivation({
      [PARENT_CLASS_ATTENDANCE_INCREMENTAL_ENABLED_ENV]: 'true',
    });

    expect(activation.incrementalRequested).toBe(true);
    expect(activation.incrementalEnabled).toBe(false);
    expect(activation.shadowEnabled).toBe(true);
    expect(activation.mode).toBe('shadow_only');
  });

  it('supports an explicit emergency kill switch back to V3-only behavior', () => {
    const activation = resolveParentClassAttendanceShadowActivation({
      [PARENT_CLASS_ATTENDANCE_SHADOW_KILL_SWITCH_ENV]: 'true',
      [PARENT_CLASS_ATTENDANCE_INCREMENTAL_ENABLED_ENV]: 'true',
    });

    expect(activation).toEqual({
      mode: 'v3_only',
      incrementalEnabled: false,
      shadowEnabled: false,
      incrementalRequested: true,
      shadowKillSwitchEnabled: true,
    });
  });

  it('requires the kill switch to be explicitly true', () => {
    for (const value of ['', 'false', '0', 'yes', 'TRUE-ish']) {
      const activation = resolveParentClassAttendanceShadowActivation({
        [PARENT_CLASS_ATTENDANCE_SHADOW_KILL_SWITCH_ENV]: value,
      });
      expect(activation.mode).toBe('shadow_only');
      expect(activation.shadowEnabled).toBe(true);
    }
  });

  it('routes the deployed compatibility export through the Brick 1F shadow-only wrapper', () => {
    expect(onClassSessionReadModelWrite).toBe(onClassSessionReadModelWriteShadowOnly);
  });
});
