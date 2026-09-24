import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('AVS Brick 7 production soak guardrails', () => {
  const audit = read('scripts/avs-production-soak-audit.mjs');
  const summary = read('scripts/avs-production-soak-summary.mjs');
  const callableContract = read('scripts/avs-callable-contract.mjs');

  it('is a bounded read-only sidecar audit with zero Graph work', () => {
    expect(audit).toContain("const EXPECTED_PROJECT_ID = 'tinysteps-react-v1'");
    expect(audit).toContain("collection('attendanceValidationCases')");
    expect(audit).toContain("collection('attendanceValidationDirtySessions')");
    expect(audit).toContain("collection('attendanceValidationForceFreshRuns')");
    expect(audit).toContain('.limit(cap + 1).get()');
    expect(audit).toContain('graphCalls: 0');
    expect(audit).toContain('operationalWrites: 0');

    for (const forbidden of [
      'MicrosoftGraphClient',
      'collectTeamsEvidence',
      "collection('classSessions')",
      "collection('enrollments')",
      "collection('billingCharges')",
      "collection('payments')",
      "collection('teacherEarnings')",
      '.set(',
      '.update(',
      '.delete(',
      '.create(',
      '.add(',
      '.batch(',
      '.runTransaction(',
    ]) {
      expect(audit).not.toContain(forbidden);
    }
  });

  it('does not add automation, realtime listeners, or another browser callable', () => {
    for (const forbidden of [
      'onSchedule(',
      'setInterval(',
      'setTimeout(',
      'onSnapshot(',
      'httpsCallable(',
    ]) {
      expect(audit).not.toContain(forbidden);
      expect(summary).not.toContain(forbidden);
    }

    expect(callableContract).toContain("'runAttendanceValidationRange'");
    expect(callableContract).toContain(
      "'forceRefreshAttendanceValidationEvidence'",
    );
    expect(callableContract).toContain(
      "'forceRefreshAttendanceValidationRange'",
    );
    expect(
      callableContract.match(/'[^']+'/g)?.filter((value) =>
        value.includes('AttendanceValidation'),
      ),
    ).toHaveLength(3);
  });

  it('emits aggregate-only diagnostics and refuses partial bounded reads', () => {
    expect(audit).toContain('exceeded the bounded read cap');
    expect(audit).toContain('doc.data() || {}');
    expect(audit).not.toContain('doc.id');
    expect(summary).toContain('classificationCounts');
    expect(summary).toContain('dirtyReasonCounts');
    expect(summary).toContain('retryableFailureBacklog');
    expect(summary).toContain('actionRequiredFailureBacklog');
    expect(summary).not.toContain('studentName:');
    expect(summary).not.toContain('teacherName:');
    expect(summary).not.toContain('email:');
  });

  it('keeps the existing AVS safety rules locked', () => {
    expect(summary).toContain("brick: 'AVS_BRICK_7_PRODUCTION_SOAK'");
    expect(summary).toContain('operationalMutationAllowed: false');
    expect(summary).toContain('AVS_SOAK_MAX_RANGE_DAYS = 31');
    expect(summary).toContain(
      "AVS_SOAK_VALIDATION_START_YMD = '2026-09-01'",
    );
  });
});
