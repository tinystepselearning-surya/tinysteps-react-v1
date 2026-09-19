import { createHash } from 'crypto';
import {
  AV4_PROOF_SCHEMA_VERSION,
  type Av4SessionProofResult,
} from './sessionProofEngine';

export const AV8_CALIBRATION_SCHEMA_VERSION = 1;

export type Av8HumanDecision = 'present' | 'absent' | 'review';

export interface Av8CalibrationSample {
  caseId: string;
  caseFingerprint: string;
  humanDecision: Av8HumanDecision;
  proof: Av4SessionProofResult;
}

export interface Av8CalibrationPolicy {
  minEligibleSamples: number;
  minHumanPresentSamples: number;
  minHumanAbsentSamples: number;
  maxFalsePositiveRate: number;
  minPresentRecall: number;
}

export type Av8CalibrationExclusionReason =
  | 'human_review_inconclusive'
  | 'unsupported_av4_schema'
  | 'session_reference_not_verified'
  | 'occurrence_not_verified'
  | 'identity_requires_review'
  | 'expected_teacher_not_verified'
  | 'learner_side_not_present'
  | 'attendance_evidence_incomplete'
  | 'overlap_metric_invalid';

export interface Av8CalibrationCandidate {
  thresholdSeconds: number;
  predictedPresentCount: number;
  predictedReviewCount: number;
  truePositiveCount: number;
  falsePositiveCount: number;
  trueNegativeCount: number;
  falseNegativeCount: number;
  precision: number | null;
  presentRecall: number | null;
  falsePositiveRate: number | null;
  meetsPolicy: boolean;
}

export type Av8CalibrationSelection =
  | {
      status: 'insufficient_evidence';
      bestCandidateSeconds: null;
    }
  | {
      status: 'no_candidate_meets_policy';
      bestCandidateSeconds: null;
    }
  | {
      status: 'candidate_available';
      bestCandidateSeconds: number;
    };

export interface Av8CalibrationReport {
  schemaVersion: typeof AV8_CALIBRATION_SCHEMA_VERSION;
  brick: 'AV8';
  datasetFingerprint: string;
  requestedSampleCount: number;
  eligibleSampleCount: number;
  excludedSampleCount: number;
  humanPresentSampleCount: number;
  humanAbsentSampleCount: number;
  excluded: Array<{
    caseId: string;
    reasons: Av8CalibrationExclusionReason[];
  }>;
  policy: Av8CalibrationPolicy;
  candidates: Av8CalibrationCandidate[];
  selection: Av8CalibrationSelection;
  thresholdAdoptionAllowed: false;
  operationalMutationAllowed: false;
}

function cleanCaseId(value: unknown): string {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.length > 240) {
    throw new TypeError('AV8 caseId must be a non-empty string of at most 240 characters.');
  }
  return normalized;
}

function validateCaseFingerprint(value: unknown): string {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new TypeError('AV8 caseFingerprint must be a 64-character SHA-256 hex string.');
  }
  return normalized;
}

function validateDecision(value: unknown): Av8HumanDecision {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'present' || normalized === 'absent' || normalized === 'review') {
    return normalized;
  }
  throw new TypeError('AV8 humanDecision must be present, absent, or review.');
}

function validateCandidateThresholds(values: readonly number[]): number[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError('AV8 requires at least one candidate overlap threshold.');
  }
  const normalized = values.map((value) => {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError('AV8 candidate thresholds must be finite non-negative seconds.');
    }
    return Math.round(value * 1000) / 1000;
  });
  return [...new Set(normalized)].sort((a, b) => a - b);
}

function validatePolicy(policy: Av8CalibrationPolicy): Av8CalibrationPolicy {
  const integerFields = [
    ['minEligibleSamples', policy.minEligibleSamples],
    ['minHumanPresentSamples', policy.minHumanPresentSamples],
    ['minHumanAbsentSamples', policy.minHumanAbsentSamples],
  ] as const;

  for (const [name, value] of integerFields) {
    if (!Number.isInteger(value) || value < 1) {
      throw new RangeError(`AV8 ${name} must be an integer of at least 1.`);
    }
  }

  if (
    !Number.isFinite(policy.maxFalsePositiveRate)
    || policy.maxFalsePositiveRate < 0
    || policy.maxFalsePositiveRate > 1
  ) {
    throw new RangeError('AV8 maxFalsePositiveRate must be between 0 and 1.');
  }

  if (
    !Number.isFinite(policy.minPresentRecall)
    || policy.minPresentRecall < 0
    || policy.minPresentRecall > 1
  ) {
    throw new RangeError('AV8 minPresentRecall must be between 0 and 1.');
  }

  return { ...policy };
}

function exclusionReasons(proof: Av4SessionProofResult): Av8CalibrationExclusionReason[] {
  const reasons: Av8CalibrationExclusionReason[] = [];

  if (proof.schemaVersion !== AV4_PROOF_SCHEMA_VERSION) {
    reasons.push('unsupported_av4_schema');
  }
  if (!proof.correctSessionReference || !proof.identitySessionReferenceMatches) {
    reasons.push('session_reference_not_verified');
  }
  if (!proof.correctOccurrenceResolved || !proof.attendanceReportMatchesScheduledWindow) {
    reasons.push('occurrence_not_verified');
  }
  if (proof.issues.includes('identity_requires_review')) {
    reasons.push('identity_requires_review');
  }
  if (!proof.expectedTeacherPresent) {
    reasons.push('expected_teacher_not_verified');
  }
  if (!proof.learnerSidePresent) {
    reasons.push('learner_side_not_present');
  }
  if (!proof.attendanceEvidenceComplete) {
    reasons.push('attendance_evidence_incomplete');
  }
  if (
    !Number.isFinite(proof.maxTeacherLearnerOverlapSeconds)
    || proof.maxTeacherLearnerOverlapSeconds < 0
  ) {
    reasons.push('overlap_metric_invalid');
  }

  return [...new Set(reasons)];
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1_000_000) / 1_000_000;
}

function datasetFingerprint(
  samples: ReadonlyArray<{
    caseId: string;
    caseFingerprint: string;
    humanDecision: Av8HumanDecision;
    overlapSeconds: number;
  }>,
): string {
  const stable = [...samples]
    .sort((a, b) => a.caseId.localeCompare(b.caseId))
    .map((sample) => ({
      caseId: sample.caseId,
      caseFingerprint: sample.caseFingerprint,
      humanDecision: sample.humanDecision,
      overlapSeconds: Math.round(sample.overlapSeconds * 1000) / 1000,
    }));

  return createHash('sha256')
    .update(JSON.stringify(stable))
    .digest('hex');
}

function candidateMetrics(
  thresholdSeconds: number,
  samples: ReadonlyArray<{
    humanDecision: Av8HumanDecision;
    overlapSeconds: number;
  }>,
  policy: Av8CalibrationPolicy,
): Av8CalibrationCandidate {
  let truePositiveCount = 0;
  let falsePositiveCount = 0;
  let trueNegativeCount = 0;
  let falseNegativeCount = 0;

  for (const sample of samples) {
    const predictsPresent = sample.overlapSeconds > thresholdSeconds;
    const humanPresent = sample.humanDecision === 'present';

    if (predictsPresent && humanPresent) truePositiveCount += 1;
    else if (predictsPresent && !humanPresent) falsePositiveCount += 1;
    else if (!predictsPresent && humanPresent) falseNegativeCount += 1;
    else trueNegativeCount += 1;
  }

  const predictedPresentCount = truePositiveCount + falsePositiveCount;
  const predictedReviewCount = trueNegativeCount + falseNegativeCount;
  const precision = rate(truePositiveCount, predictedPresentCount);
  const presentRecall = rate(
    truePositiveCount,
    truePositiveCount + falseNegativeCount,
  );
  const falsePositiveRate = rate(
    falsePositiveCount,
    falsePositiveCount + trueNegativeCount,
  );

  return {
    thresholdSeconds,
    predictedPresentCount,
    predictedReviewCount,
    truePositiveCount,
    falsePositiveCount,
    trueNegativeCount,
    falseNegativeCount,
    precision,
    presentRecall,
    falsePositiveRate,
    meetsPolicy:
      presentRecall !== null
      && falsePositiveRate !== null
      && presentRecall >= policy.minPresentRecall
      && falsePositiveRate <= policy.maxFalsePositiveRate,
  };
}

/**
 * AV8 evaluates candidate meaningful-overlap thresholds against explicit,
 * human-reviewed AV4 proof samples.
 *
 * It deliberately cannot adopt a threshold, write Firestore, invoke AV7, or
 * mutate operational attendance. A candidate may be surfaced only when the
 * caller-supplied evidence sufficiency and error-rate policy is satisfied.
 */
export function analyzeMeaningfulOverlapCalibration(
  input: {
    samples: readonly Av8CalibrationSample[];
    candidateThresholdSeconds: readonly number[];
    policy: Av8CalibrationPolicy;
  },
): Av8CalibrationReport {
  const thresholds = validateCandidateThresholds(input.candidateThresholdSeconds);
  const policy = validatePolicy(input.policy);
  const seenCaseIds = new Set<string>();
  const eligible: Array<{
    caseId: string;
    caseFingerprint: string;
    humanDecision: Av8HumanDecision;
    overlapSeconds: number;
  }> = [];
  const excluded: Av8CalibrationReport['excluded'] = [];

  for (const rawSample of input.samples) {
    const caseId = cleanCaseId(rawSample.caseId);
    if (seenCaseIds.has(caseId)) {
      throw new TypeError(`AV8 duplicate calibration caseId: ${caseId}`);
    }
    seenCaseIds.add(caseId);

    const caseFingerprint = validateCaseFingerprint(rawSample.caseFingerprint);
    if (rawSample.proof.classSessionId !== caseId) {
      throw new TypeError('AV8 caseId must match proof.classSessionId.');
    }
    const humanDecision = validateDecision(rawSample.humanDecision);
    const reasons = exclusionReasons(rawSample.proof);
    if (humanDecision === 'review') {
      reasons.unshift('human_review_inconclusive');
    }
    if (reasons.length > 0) {
      excluded.push({ caseId, reasons: [...new Set(reasons)] });
      continue;
    }

    eligible.push({
      caseId,
      caseFingerprint,
      humanDecision,
      overlapSeconds: rawSample.proof.maxTeacherLearnerOverlapSeconds,
    });
  }

  const humanPresentSampleCount = eligible.filter(
    (sample) => sample.humanDecision === 'present',
  ).length;
  const humanAbsentSampleCount = eligible.filter(
    (sample) => sample.humanDecision === 'absent',
  ).length;

  const candidates = thresholds.map((thresholdSeconds) =>
    candidateMetrics(thresholdSeconds, eligible, policy));

  const enoughEvidence =
    eligible.length >= policy.minEligibleSamples
    && humanPresentSampleCount >= policy.minHumanPresentSamples
    && humanAbsentSampleCount >= policy.minHumanAbsentSamples;

  let selection: Av8CalibrationSelection;
  if (!enoughEvidence) {
    selection = {
      status: 'insufficient_evidence',
      bestCandidateSeconds: null,
    };
  } else {
    const passing = candidates
      .filter((candidate) => candidate.meetsPolicy)
      .sort((a, b) =>
        (a.falsePositiveRate ?? 1) - (b.falsePositiveRate ?? 1)
        || (b.presentRecall ?? -1) - (a.presentRecall ?? -1)
        || b.thresholdSeconds - a.thresholdSeconds);

    selection = passing.length > 0
      ? {
          status: 'candidate_available',
          bestCandidateSeconds: passing[0].thresholdSeconds,
        }
      : {
          status: 'no_candidate_meets_policy',
          bestCandidateSeconds: null,
        };
  }

  return {
    schemaVersion: AV8_CALIBRATION_SCHEMA_VERSION,
    brick: 'AV8',
    datasetFingerprint: datasetFingerprint(eligible),
    requestedSampleCount: input.samples.length,
    eligibleSampleCount: eligible.length,
    excludedSampleCount: excluded.length,
    humanPresentSampleCount,
    humanAbsentSampleCount,
    excluded,
    policy,
    candidates,
    selection,
    thresholdAdoptionAllowed: false,
    operationalMutationAllowed: false,
  };
}
