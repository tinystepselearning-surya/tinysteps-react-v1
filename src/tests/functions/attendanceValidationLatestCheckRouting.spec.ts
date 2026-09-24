import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS changed-only latest-check callable routing', () => {
  const source = read(
    'functions/src/attendanceValidation/latestCheckCallable.ts',
  );
  const functionsIndex = read('functions/src/index.ts');

  it('exposes the dirty-mode engine for the unified orchestrator without changing the callable contract', () => {
    expect(source).toContain(
      'export async function runAttendanceValidationLatestCheckBatch',
    );
    expect(source).toContain(
      'return runAttendanceValidationLatestCheckBatch(',
    );
  });

  it('is admin-only, date-bounded, and capped at 100 dirty sessions', () => {
    expect(source).toContain('await ensureAdmin(request.auth)');
    expect(source).toContain(
      "where('serviceDateYmd', '>=', range.fromDate)",
    );
    expect(source).toContain(
      "where('serviceDateYmd', '<=', range.toDate)",
    );
    expect(source).toContain(
      '.limit(AVS_LATEST_CHECK_MAX_DIRTY_SESSIONS)',
    );
  });

  it('discovers changed work only from the AVS dirty queue', () => {
    expect(source).toContain(
      '.collection(ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION)',
    );
    expect(source).not.toContain(".collection('classSessions').where");
    expect(source).not.toContain(".collection('classSessions').orderBy");
  });

  it('supports a bounded cached teacher-identity rollout mode without a new Cloud Function export', () => {
    expect(source).toContain("mode === 'identity_rollout'");
    expect(source).toContain('AVS_IDENTITY_ROLLOUT_CASE_LIMIT');
    expect(source).toContain("collection('attendanceValidationCases')");
    expect(source).toContain("collection('attendanceValidationEvidence')");
    expect(source).toContain('planCachedTeacherIdentityRollout');
    expect(source).toContain('claimAndBindTeacherIdentityMapping');
    expect(source).toContain('backfillMicrosoftIdentityClaimsFromRegistry');
    expect(source).toContain('runAv53ShadowWithFirestore(');
    expect(source).toContain('sameDayContextReads');
    expect(source).toContain('graphCalls: 0');
    expect(source).toContain("source: 'cached_avs_evidence_email_bound'");
    expect(source).toContain('identityClaimConflictCount');
    expect(functionsIndex.match(/runAttendanceValidationLatestCheck/g)?.length).toBeGreaterThan(0);
    expect(functionsIndex).not.toContain('runAttendanceValidationTeacherIdentityRollout');
  });

  it('reuses cached evidence through AV5.3 and never calls Microsoft Graph', () => {
    expect(source).toContain('runAv53ShadowWithFirestore');
    expect(source).not.toContain('MicrosoftGraphClient');
    expect(source).not.toContain('collectTeamsEvidence');
    expect(source).not.toContain('createOccurrenceSelectingTeamsEvidenceGraphClient');
    expect(source).toContain('graphCalls: 0');
  });

  it('keeps sessions without cached evidence in the baseline-required queue', () => {
    expect(source).toContain('baselineRequiredSessionIds');
    expect(source).toContain('baselineRequiredCount');
    expect(source).toContain('freshEvidenceRequiredCount');
    expect(source).toContain('freshnessUnsafeCount');
  });

  it('clears successful dirty markers with last-update preconditions', () => {
    expect(source).toContain('{ lastUpdateTime: dirtyDoc.updateTime }');
    expect(source).toContain('concurrentMarkerChangeDetected = true');
    expect(source).toContain(
      'Keeping all markers is the fail-safe outcome.',
    );
  });

  it('reports a bounded read budget and cannot mutate operational attendance', () => {
    expect(source).toContain('dirtyMarkerReads');
    expect(source).toContain('validationCaseReads');
    expect(source).toContain('av53PointReads');
    expect(source).toContain('sameDayContextReads');
    expect(source).toContain('sameDayContextReadDocumentBudget');
    expect(source).toContain('boundedReadsExcludingStaffRegistry');
    expect(source).toContain('operationalMutationAllowed: false');
  });

  it('is explicitly exported as a deployable callable', () => {
    expect(functionsIndex).toContain(
      'export { runAttendanceValidationLatestCheck } from "./attendanceValidation/latestCheckCallable";',
    );
  });
});
