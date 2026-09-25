export const AVS_BUSINESS_PRESENT_OVERLAP_SECONDS = 25 * 60;

export type AvsBusinessOutcome =
  | 'verified'
  | 'false_present'
  | 'false_absent'
  | 'not_evaluable';

export interface AvsBusinessOutcomeInput {
  evidenceEvaluable: boolean;
  teamsOverlapSeconds: number;
  tinyStepsPresentCount: number;
  thresholdSeconds?: number;
}

export interface AvsBusinessOutcomeResult {
  outcome: AvsBusinessOutcome;
  teamsSupportedPresentCount: number | null;
  tinyStepsPresentCount: number;
  differenceCount: number;
}

function requireNonNegativeFinite(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number.`);
  }
  return value;
}

/**
 * Tiny Steps production attendance rule:
 * one Present requires strictly more than 25 minutes of verified simultaneous
 * teacher + learner Teams overlap on the same IST service date.
 *
 * Therefore:
 *   1500s -> 0 supported Presents
 *   1501s -> 1
 *   3000s -> 1
 *   3001s -> 2
 */
export function supportedPresentCountFromOverlap(
  overlapSeconds: number,
  thresholdSeconds = AVS_BUSINESS_PRESENT_OVERLAP_SECONDS,
): number {
  const overlap = requireNonNegativeFinite(overlapSeconds, 'overlapSeconds');
  if (!Number.isFinite(thresholdSeconds) || thresholdSeconds <= 0) {
    throw new RangeError('thresholdSeconds must be a finite positive number.');
  }
  if (overlap <= thresholdSeconds) return 0;
  return Math.max(0, Math.ceil(overlap / thresholdSeconds) - 1);
}

/**
 * The complete AVS business reconciliation.
 *
 * There are only three business outcomes:
 * - Verified: Teams-supported Present count == Tiny Steps Present count
 * - False Present: Tiny Steps has more Present marks than Teams supports
 * - False Absent: Teams supports more Presents than Tiny Steps recorded
 *
 * not_evaluable is a technical source-data state only. It is not a fourth
 * business classification and must never be shown as a business tab.
 */
export function reconcileAvsBusinessOutcome(
  input: AvsBusinessOutcomeInput,
): AvsBusinessOutcomeResult {
  const tinyStepsPresentCount = requireNonNegativeFinite(
    input.tinyStepsPresentCount,
    'tinyStepsPresentCount',
  );

  if (!Number.isInteger(tinyStepsPresentCount)) {
    throw new RangeError('tinyStepsPresentCount must be an integer.');
  }

  if (!input.evidenceEvaluable) {
    return {
      outcome: 'not_evaluable',
      teamsSupportedPresentCount: null,
      tinyStepsPresentCount,
      differenceCount: 0,
    };
  }

  const teamsSupportedPresentCount = supportedPresentCountFromOverlap(
    input.teamsOverlapSeconds,
    input.thresholdSeconds,
  );

  if (tinyStepsPresentCount > teamsSupportedPresentCount) {
    return {
      outcome: 'false_present',
      teamsSupportedPresentCount,
      tinyStepsPresentCount,
      differenceCount: tinyStepsPresentCount - teamsSupportedPresentCount,
    };
  }

  if (teamsSupportedPresentCount > tinyStepsPresentCount) {
    return {
      outcome: 'false_absent',
      teamsSupportedPresentCount,
      tinyStepsPresentCount,
      differenceCount: teamsSupportedPresentCount - tinyStepsPresentCount,
    };
  }

  return {
    outcome: 'verified',
    teamsSupportedPresentCount,
    tinyStepsPresentCount,
    differenceCount: 0,
  };
}
