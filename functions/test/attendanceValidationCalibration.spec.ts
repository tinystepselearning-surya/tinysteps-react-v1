import { describe, expect, it } from 'vitest';
import {
  analyzeMeaningfulOverlapCalibration,
  type Av8CalibrationPolicy,
  type Av8CalibrationSample,
  type Av8HumanDecision,
} from '../src/attendanceValidation/calibrationEngine';
import {
  AV4_PROOF_SCHEMA_VERSION,
  type Av4SessionProofResult,
} from '../src/attendanceValidation/sessionProofEngine';

const policy: Av8CalibrationPolicy = {
  minEligibleSamples: 6,
  minHumanPresentSamples: 3,
  minHumanAbsentSamples: 3,
  maxFalsePositiveRate: 0,
  minPresentRecall: 0.9,
};

function proof(
  overlapSeconds: number,
  overrides: Partial<Av4SessionProofResult> = {},
): Av4SessionProofResult {
  return {
    schemaVersion: AV4_PROOF_SCHEMA_VERSION,
    brick: 'AV4',
    classSessionId: 'session-1',
    enrollmentId: 'enrollment-1',
    kidId: 'kid-1',
    teacherId: 'teacher-1',
    identitySessionReferenceMatches: true,
    correctSessionReference: true,
    attendanceReportMatchesScheduledWindow: true,
    correctOccurrenceResolved: true,
    expectedTeacherPresent: true,
    learnerSidePresent: true,
    attendanceEvidenceComplete: true,
    teacherScheduledSeconds: 1800,
    learnerSideScheduledSeconds: 1800,
    maxTeacherLearnerOverlapSeconds: overlapSeconds,
    maxTeacherLearnerScheduledOverlapPercentage: 85,
    meaningfulOverlapThresholdSeconds: null,
    meaningfulTeacherLearnerOverlap: null,
    pairProofs: [],
    issues: ['overlap_threshold_not_configured'],
    operationalMutationAllowed: false,
    ...overrides,
  };
}

function sample(
  caseId: string,
  humanDecision: Av8HumanDecision,
  overlapSeconds: number,
  overrides: Partial<Av4SessionProofResult> = {},
  caseFingerprint: string = 'a'.repeat(64),
): Av8CalibrationSample {
  return {
    caseId,
    caseFingerprint,
    humanDecision,
    proof: proof(overlapSeconds, {
      classSessionId: caseId,
      ...overrides,
    }),
  };
}

describe('AV8 meaningful-overlap threshold calibration', () => {
  it('selects a candidate only under the caller-supplied safety policy', () => {
    const report = analyzeMeaningfulOverlapCalibration({
      samples: [
        sample('present-1', 'present', 1200),
        sample('present-2', 'present', 900),
        sample('present-3', 'present', 700),
        sample('absent-1', 'absent', 500),
        sample('absent-2', 'absent', 200),
        sample('absent-3', 'absent', 0),
      ],
      candidateThresholdSeconds: [300, 600, 900],
      policy,
    });

    expect(report.selection).toEqual({
      status: 'candidate_available',
      bestCandidateSeconds: 600,
    });

    expect(report.candidates).toEqual([
      expect.objectContaining({
        thresholdSeconds: 300,
        falsePositiveCount: 1,
        falsePositiveRate: 0.333333,
        presentRecall: 1,
        meetsPolicy: false,
      }),
      expect.objectContaining({
        thresholdSeconds: 600,
        falsePositiveCount: 0,
        falsePositiveRate: 0,
        presentRecall: 1,
        meetsPolicy: true,
      }),
      expect.objectContaining({
        thresholdSeconds: 900,
        falsePositiveCount: 0,
        falsePositiveRate: 0,
        presentRecall: 0.666667,
        meetsPolicy: false,
      }),
    ]);
  });


  it('prefers the lower false-positive rate before higher recall among passing candidates', () => {
    const report = analyzeMeaningfulOverlapCalibration({
      samples: [
        sample('present-1', 'present', 1000),
        sample('present-2', 'present', 800),
        sample('present-3', 'present', 500),
        sample('absent-1', 'absent', 600),
        sample('absent-2', 'absent', 300),
        sample('absent-3', 'absent', 100),
      ],
      candidateThresholdSeconds: [400, 700],
      policy: {
        minEligibleSamples: 6,
        minHumanPresentSamples: 3,
        minHumanAbsentSamples: 3,
        maxFalsePositiveRate: 0.5,
        minPresentRecall: 0.5,
      },
    });

    expect(report.candidates).toEqual([
      expect.objectContaining({
        thresholdSeconds: 400,
        falsePositiveRate: 0.333333,
        presentRecall: 1,
        meetsPolicy: true,
      }),
      expect.objectContaining({
        thresholdSeconds: 700,
        falsePositiveRate: 0,
        presentRecall: 0.666667,
        meetsPolicy: true,
      }),
    ]);
    expect(report.selection).toEqual({
      status: 'candidate_available',
      bestCandidateSeconds: 700,
    });
  });

  it('uses a strict greater-than comparator at the 25-minute boundary', () => {
    const report = analyzeMeaningfulOverlapCalibration({
      samples: [
        sample('present-exact', 'present', 1500),
        sample('present-above', 'present', 1501),
        sample('absent-1', 'absent', 0),
      ],
      candidateThresholdSeconds: [1500],
      policy: {
        minEligibleSamples: 3,
        minHumanPresentSamples: 2,
        minHumanAbsentSamples: 1,
        maxFalsePositiveRate: 1,
        minPresentRecall: 0,
      },
    });

    expect(report.candidates[0]).toMatchObject({
      thresholdSeconds: 1500,
      predictedPresentCount: 1,
      truePositiveCount: 1,
      falseNegativeCount: 1,
      presentRecall: 0.5,
    });
  });

  it('does not surface a candidate when reviewed evidence is insufficient', () => {
    const report = analyzeMeaningfulOverlapCalibration({
      samples: [
        sample('present-1', 'present', 1200),
        sample('absent-1', 'absent', 100),
      ],
      candidateThresholdSeconds: [300, 600],
      policy,
    });

    expect(report.selection).toEqual({
      status: 'insufficient_evidence',
      bestCandidateSeconds: null,
    });
    expect(report.eligibleSampleCount).toBe(2);
  });

  it('fails closed when no threshold satisfies the review policy', () => {
    const report = analyzeMeaningfulOverlapCalibration({
      samples: [
        sample('present-1', 'present', 900),
        sample('present-2', 'present', 800),
        sample('present-3', 'present', 700),
        sample('absent-1', 'absent', 850),
        sample('absent-2', 'absent', 750),
        sample('absent-3', 'absent', 650),
      ],
      candidateThresholdSeconds: [600, 700, 800, 900],
      policy,
    });

    expect(report.selection).toEqual({
      status: 'no_candidate_meets_policy',
      bestCandidateSeconds: null,
    });
  });

  it('excludes proofs where overlap is not the only unresolved variable', () => {
    const report = analyzeMeaningfulOverlapCalibration({
      samples: [
        sample('safe-present', 'present', 1000),
        sample('human-review', 'review', 1000),
        sample('identity-review', 'present', 1000, {
          issues: ['identity_requires_review', 'overlap_threshold_not_configured'],
        }),
        sample('teacher-missing', 'absent', 1000, {
          expectedTeacherPresent: false,
          issues: ['expected_teacher_missing', 'overlap_threshold_not_configured'],
        }),
        sample('learner-missing', 'absent', 0, {
          learnerSidePresent: false,
          issues: ['learner_side_missing', 'overlap_threshold_not_configured'],
        }),
      ],
      candidateThresholdSeconds: [600],
      policy: {
        ...policy,
        minEligibleSamples: 1,
        minHumanPresentSamples: 1,
        minHumanAbsentSamples: 1,
      },
    });

    expect(report.eligibleSampleCount).toBe(1);
    expect(report.excluded).toEqual([
      {
        caseId: 'human-review',
        reasons: ['human_review_inconclusive'],
      },
      {
        caseId: 'identity-review',
        reasons: ['identity_requires_review'],
      },
      {
        caseId: 'teacher-missing',
        reasons: ['expected_teacher_not_verified'],
      },
      {
        caseId: 'learner-missing',
        reasons: ['learner_side_not_present'],
      },
    ]);
    expect(report.selection.status).toBe('insufficient_evidence');
  });

  it('keeps the dataset fingerprint deterministic regardless of sample order', () => {
    const samples = [
      sample('case-b', 'absent', 400),
      sample('case-a', 'present', 800),
    ];

    const first = analyzeMeaningfulOverlapCalibration({
      samples,
      candidateThresholdSeconds: [600],
      policy: {
        ...policy,
        minEligibleSamples: 2,
        minHumanPresentSamples: 1,
        minHumanAbsentSamples: 1,
      },
    });
    const second = analyzeMeaningfulOverlapCalibration({
      samples: [...samples].reverse(),
      candidateThresholdSeconds: [600],
      policy: {
        ...policy,
        minEligibleSamples: 2,
        minHumanPresentSamples: 1,
        minHumanAbsentSamples: 1,
      },
    });

    expect(first.datasetFingerprint).toBe(second.datasetFingerprint);
    expect(first.datasetFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('binds the dataset fingerprint to the exact reviewed case revision', () => {
    const commonPolicy = {
      ...policy,
      minEligibleSamples: 1,
      minHumanPresentSamples: 1,
      minHumanAbsentSamples: 1,
    };

    const first = analyzeMeaningfulOverlapCalibration({
      samples: [
        sample('case-present', 'present', 800, {}, 'a'.repeat(64)),
        sample('case-absent', 'absent', 200, {}, 'b'.repeat(64)),
      ],
      candidateThresholdSeconds: [600],
      policy: commonPolicy,
    });
    const second = analyzeMeaningfulOverlapCalibration({
      samples: [
        sample('case-present', 'present', 800, {}, 'c'.repeat(64)),
        sample('case-absent', 'absent', 200, {}, 'b'.repeat(64)),
      ],
      candidateThresholdSeconds: [600],
      policy: commonPolicy,
    });

    expect(first.datasetFingerprint).not.toBe(second.datasetFingerprint);
  });

  it('rejects malformed reviewed case fingerprints', () => {
    expect(() =>
      analyzeMeaningfulOverlapCalibration({
        samples: [
          sample('bad-fingerprint', 'present', 800, {}, 'not-a-sha256'),
        ],
        candidateThresholdSeconds: [600],
        policy,
      }),
    ).toThrow('caseFingerprint must be a 64-character SHA-256 hex string');
  });

  it('rejects duplicate reviewed case ids', () => {
    expect(() =>
      analyzeMeaningfulOverlapCalibration({
        samples: [
          sample('duplicate', 'present', 800),
          sample('duplicate', 'absent', 100),
        ],
        candidateThresholdSeconds: [600],
        policy,
      }),
    ).toThrow('duplicate calibration caseId');
  });

  it('rejects a reviewed case paired with proof from another session', () => {
    expect(() =>
      analyzeMeaningfulOverlapCalibration({
        samples: [
          sample('case-a', 'present', 800, { classSessionId: 'case-b' }),
        ],
        candidateThresholdSeconds: [600],
        policy,
      }),
    ).toThrow('caseId must match proof.classSessionId');
  });

  it('rejects invalid candidate thresholds and unsafe policy bounds', () => {
    expect(() =>
      analyzeMeaningfulOverlapCalibration({
        samples: [sample('case-a', 'present', 800)],
        candidateThresholdSeconds: [-1],
        policy,
      }),
    ).toThrow('candidate thresholds must be finite non-negative seconds');

    expect(() =>
      analyzeMeaningfulOverlapCalibration({
        samples: [sample('case-a', 'present', 800)],
        candidateThresholdSeconds: [600],
        policy: {
          ...policy,
          maxFalsePositiveRate: 1.1,
        },
      }),
    ).toThrow('maxFalsePositiveRate must be between 0 and 1');
  });

  it('never grants threshold adoption or operational mutation permission', () => {
    const report = analyzeMeaningfulOverlapCalibration({
      samples: [
        sample('present-1', 'present', 1200),
        sample('present-2', 'present', 900),
        sample('present-3', 'present', 700),
        sample('absent-1', 'absent', 500),
        sample('absent-2', 'absent', 200),
        sample('absent-3', 'absent', 0),
      ],
      candidateThresholdSeconds: [600],
      policy,
    });

    expect(report.thresholdAdoptionAllowed).toBe(false);
    expect(report.operationalMutationAllowed).toBe(false);
  });
});
