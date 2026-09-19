import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('attendance validation contract v2 overlap policy', () => {
  const contract = readRepoFile('src/lib/attendanceValidationContract.ts');
  const proofEngine = readRepoFile(
    'functions/src/attendanceValidation/sessionProofEngine.ts',
  );
  const shadowRunner = readRepoFile(
    'functions/src/attendanceValidation/shadowRunner.ts',
  );
  const calibrationEngine = readRepoFile(
    'functions/src/attendanceValidation/calibrationEngine.ts',
  );
  const classificationEngine = readRepoFile(
    'functions/src/attendanceValidation/classificationEngine.ts',
  );

  it('versions the approved 25-minute production threshold explicitly', () => {
    expect(contract).toContain(
      'export const ATTENDANCE_VALIDATION_CONTRACT_VERSION = 2 as const',
    );
    expect(contract).toContain(
      'ATTENDANCE_VALIDATION_PRESENT_OVERLAP_SECONDS = 25 * 60',
    );
    expect(contract).toContain(
      "ATTENDANCE_VALIDATION_PRESENT_OVERLAP_COMPARISON =\n  'strictly_greater_than' as const",
    );
    expect(proofEngine).toContain(
      'export const AV4_PRODUCTION_MEANINGFUL_OVERLAP_SECONDS = 25 * 60',
    );
    expect(proofEngine).toContain(
      "export const AV4_PRODUCTION_OVERLAP_COMPARISON = 'strictly_greater_than' as const",
    );
  });

  it('uses the production threshold by default while preserving explicit diagnostic overrides', () => {
    expect(proofEngine).toContain(
      'meaningfulOverlapSeconds: AV4_PRODUCTION_MEANINGFUL_OVERLAP_SECONDS',
    );
    expect(shadowRunner).toContain(
      'if (value === undefined) return AV4_PRODUCTION_MEANINGFUL_OVERLAP_SECONDS',
    );
    expect(shadowRunner).toContain('if (value === null) return null');
  });

  it('uses strict greater-than semantics in both runtime proof and calibration math', () => {
    expect(proofEngine).toContain(
      'meaningfulTeacherLearnerOverlap = maxTeacherLearnerOverlapSeconds > threshold',
    );
    expect(calibrationEngine).toContain(
      'const predictsPresent = sample.overlapSeconds > thresholdSeconds',
    );
    expect(proofEngine).not.toContain(
      'maxTeacherLearnerOverlapSeconds >= threshold',
    );
    expect(calibrationEngine).not.toContain(
      'sample.overlapSeconds >= thresholdSeconds',
    );
  });

  it('keeps below-threshold learner participation as REVIEW rather than ABSENT', () => {
    expect(classificationEngine).toContain(
      "return result(proof, 'review', ['meaningful_overlap_not_met'])",
    );
    expect(classificationEngine).toContain(
      "return result(proof, 'absent', ['verified_no_learner_side_participant'])",
    );
  });
});
