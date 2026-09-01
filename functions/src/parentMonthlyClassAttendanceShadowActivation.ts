import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {
  PARENT_CLASS_ATTENDANCE_INCREMENTAL_ENABLED_ENV,
  processParentClassAttendanceV4Write,
} from './parentMonthlyClassAttendanceProjectionV4';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

export const PARENT_CLASS_ATTENDANCE_BRICK_1F_MODE = 'shadow_only' as const;
export const PARENT_CLASS_ATTENDANCE_INCREMENTAL_WRITES_ARMED = false as const;
export const PARENT_CLASS_ATTENDANCE_SHADOW_DEFAULT_ENABLED = true as const;
export const PARENT_CLASS_ATTENDANCE_SHADOW_KILL_SWITCH_ENV =
  'PARENT_CLASS_ATTENDANCE_SHADOW_KILL_SWITCH';

export type ParentClassAttendanceShadowActivation = {
  mode: 'shadow_only' | 'v3_only';
  incrementalEnabled: false;
  shadowEnabled: boolean;
  incrementalRequested: boolean;
  shadowKillSwitchEnabled: boolean;
};

const isStrictTrue = (value: unknown): boolean =>
  typeof value === 'string'
    ? value.trim().toLowerCase() === 'true'
    : value === true;

export const resolveParentClassAttendanceShadowActivation = (
  env: Record<string, string | undefined> = process.env,
): ParentClassAttendanceShadowActivation => {
  const incrementalRequested = isStrictTrue(
    env[PARENT_CLASS_ATTENDANCE_INCREMENTAL_ENABLED_ENV],
  );
  const shadowKillSwitchEnabled = isStrictTrue(
    env[PARENT_CLASS_ATTENDANCE_SHADOW_KILL_SWITCH_ENV],
  );

  return {
    mode: shadowKillSwitchEnabled ? 'v3_only' : PARENT_CLASS_ATTENDANCE_BRICK_1F_MODE,
    // Brick 1F is intentionally unable to perform incremental writes. A later brick
    // must explicitly remove this compile-time barrier after production shadow parity.
    incrementalEnabled: PARENT_CLASS_ATTENDANCE_INCREMENTAL_WRITES_ARMED,
    shadowEnabled:
      PARENT_CLASS_ATTENDANCE_SHADOW_DEFAULT_ENABLED && !shadowKillSwitchEnabled,
    incrementalRequested,
    shadowKillSwitchEnabled,
  };
};

export const onClassSessionReadModelWriteShadowOnly = onDocumentWritten(
  {
    document: 'classSessions/{sessionId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const activation = resolveParentClassAttendanceShadowActivation();
    if (activation.incrementalRequested) {
      logger.warn('Ignoring parent class-attendance incremental cutover request during Brick 1F', {
        sessionId: event.params.sessionId,
        activationMode: activation.mode,
        incrementalWritesArmed: PARENT_CLASS_ATTENDANCE_INCREMENTAL_WRITES_ARMED,
      });
    }

    const beforeData = change.before.exists
      ? (change.before.data() as Record<string, unknown>)
      : null;
    const afterData = change.after.exists
      ? (change.after.data() as Record<string, unknown>)
      : null;
    const eventUpdateTime = change.after.exists ? change.after.updateTime : null;

    try {
      const result = await processParentClassAttendanceV4Write({
        db: admin.firestore(),
        eventId: event.id,
        sessionId: event.params.sessionId,
        eventUpdateTime,
        before: beforeData,
        after: afterData,
        incrementalEnabled: activation.incrementalEnabled,
        shadowEnabled: activation.shadowEnabled,
      });
      logger.info('Parent class-attendance Brick 1F shadow write processed', {
        sessionId: event.params.sessionId,
        activationMode: activation.mode,
        shadowEnabled: activation.shadowEnabled,
        incrementalWritesArmed: PARENT_CLASS_ATTENDANCE_INCREMENTAL_WRITES_ARMED,
        ...result,
      });
    } catch (error) {
      logger.error('Parent class-attendance Brick 1F shadow write failed', {
        sessionId: event.params.sessionId,
        activationMode: activation.mode,
        shadowEnabled: activation.shadowEnabled,
        error: error instanceof Error ? error.message : String(error || ''),
      });
      throw error;
    }
  },
);
