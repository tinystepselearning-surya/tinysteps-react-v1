/**
 * Brick 6: server-side rollout gate for controlled schedule repair writes.
 *
 * Default state is fail-closed. A production write requires BOTH:
 *   1) CONTROLLED_SCHEDULE_REPAIR_LIVE_WRITES_ENABLED=true
 *   2) exactly one enrollment ID in CONTROLLED_SCHEDULE_REPAIR_ALLOWED_ENROLLMENTS
 *
 * Keeping the allowlist at exactly one enrollment makes the first rollout a true
 * single-enrollment pilot rather than an accidentally broad repair surface.
 */
import {HttpsError} from 'firebase-functions/v2/https';

export const CONTROLLED_REPAIR_LIVE_WRITES_ENV =
  'CONTROLLED_SCHEDULE_REPAIR_LIVE_WRITES_ENABLED';
export const CONTROLLED_REPAIR_ALLOWLIST_ENV =
  'CONTROLLED_SCHEDULE_REPAIR_ALLOWED_ENROLLMENTS';
export const CONTROLLED_REPAIR_MAX_ALLOWLIST_SIZE = 1;

export type ControlledRepairWriteGateState = {
  enabled: boolean;
  allowedEnrollmentIds: string[];
  allowlistSize: number;
  configurationValid: boolean;
  reason: string | null;
};

const text = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  return '';
};

const parseAllowlist = (value: unknown): string[] =>
  Array.from(
    new Set(
      text(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).sort();

export function resolveControlledRepairWriteGate(
  env: Record<string, string | undefined> = process.env,
): ControlledRepairWriteGateState {
  const enabled =
    text(env[CONTROLLED_REPAIR_LIVE_WRITES_ENV]).toLowerCase() === 'true';
  const allowedEnrollmentIds = parseAllowlist(
    env[CONTROLLED_REPAIR_ALLOWLIST_ENV],
  );

  let configurationValid = true;
  let reason: string | null = null;

  if (allowedEnrollmentIds.length > CONTROLLED_REPAIR_MAX_ALLOWLIST_SIZE) {
    configurationValid = false;
    reason =
      `Allowlist exceeds the Brick 6 pilot maximum of ${CONTROLLED_REPAIR_MAX_ALLOWLIST_SIZE} enrollment.`;
  } else if (enabled && allowedEnrollmentIds.length !== 1) {
    configurationValid = false;
    reason =
      'Live writes are enabled but exactly one pilot enrollment is not allowlisted.';
  }

  return {
    enabled,
    allowedEnrollmentIds,
    allowlistSize: allowedEnrollmentIds.length,
    configurationValid,
    reason,
  };
}

export function assertControlledRepairLiveWriteAllowed(
  enrollmentId: string,
  env: Record<string, string | undefined> = process.env,
): ControlledRepairWriteGateState {
  const normalizedEnrollmentId = text(enrollmentId);
  if (!normalizedEnrollmentId) {
    throw new HttpsError(
      'invalid-argument',
      'Controlled repair rollout gate requires an enrollmentId.',
    );
  }

  const gate = resolveControlledRepairWriteGate(env);

  if (!gate.configurationValid) {
    throw new HttpsError(
      'failed-precondition',
      `Controlled repair rollout gate is misconfigured: ${gate.reason || 'unknown configuration error'}`,
    );
  }

  if (!gate.enabled) {
    throw new HttpsError(
      'failed-precondition',
      'Controlled schedule repair live writes are disabled by the Brick 6 rollout gate.',
    );
  }

  if (!gate.allowedEnrollmentIds.includes(normalizedEnrollmentId)) {
    throw new HttpsError(
      'permission-denied',
      'Enrollment is not the explicitly allowlisted Brick 6 pilot enrollment.',
    );
  }

  return gate;
}
