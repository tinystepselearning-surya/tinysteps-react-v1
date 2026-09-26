export const AVS_BUSINESS_PRESENT_OVERLAP_SECONDS = 25 * 60;

export type AvsBusinessOutcome =
  | 'verified'
  | 'false_present'
  | 'false_absent'
  | 'not_evaluable';

export interface AvsBusinessOutcomeInput {
  evidenceEvaluable: boolean;
  teamsOverlapSeconds: number;
  sameDaySessionCount: number;
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
 * When Tiny Steps already records one or more Present marks for the same
 * student + teacher + IST service date, that Present count is the authoritative
 * upper bound on how many classes Teams may support for that day. Raw scheduled
 * session rows must not manufacture an extra class beyond Tiny Steps' own
 * recorded Present count.
 *
 * When Tiny Steps records zero Presents, the eligible same-day session count is
 * still used as the upper bound so AVS can detect a genuinely missing Tiny Steps
 * Present (False Absent) from verified Teams evidence.
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
  const sameDaySessionCount = requireNonNegativeFinite(
    input.sameDaySessionCount,
    'sameDaySessionCount',
  );
  const tinyStepsPresentCount = requireNonNegativeFinite(
    input.tinyStepsPresentCount,
    'tinyStepsPresentCount',
  );

  if (!Number.isInteger(sameDaySessionCount)) {
    throw new RangeError('sameDaySessionCount must be an integer.');
  }
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

  const durationSupportedPresentCount = supportedPresentCountFromOverlap(
    input.teamsOverlapSeconds,
    input.thresholdSeconds,
  );
  const presentCapacity = tinyStepsPresentCount > 0
    ? tinyStepsPresentCount
    : sameDaySessionCount;
  const teamsSupportedPresentCount = Math.min(
    durationSupportedPresentCount,
    presentCapacity,
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
