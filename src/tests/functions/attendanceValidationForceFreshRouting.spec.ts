import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS force-fresh Teams evidence routing', () => {
  const source = read(
    'functions/src/attendanceValidation/forceFreshEvidenceCallable.ts',
  );
  const functionsIndex = read('functions/src/index.ts');

  it('is admin-only and binds only the existing Graph secrets', () => {
    expect(source).toContain('await ensureAdmin(request.auth)');
    expect(source).toContain("defineSecret('MICROSOFT_TENANT_ID')");
    expect(source).toContain("defineSecret('MICROSOFT_CLIENT_ID')");
    expect(source).toContain("defineSecret('MICROSOFT_CLIENT_SECRET')");
    expect(source).not.toContain('MICROSOFT_ORGANIZER_USER_ID');
  });

  it('binds the request to the exact saved AVS case revision', () => {
    expect(source).toContain("cleanFingerprint(request.data?.inputFingerprint)");
    expect(source).toContain('storedFingerprint !== inputFingerprint');
    expect(source).toContain(
      'Reload saved results before forcing fresh evidence.',
    );
  });

  it('supports one session-backed case and resolves the canonical backend organizer', () => {
    expect(source).toContain('classSessionId !== caseId');
    expect(source).toContain(
      'Force Fresh Teams Evidence supports session-backed AVS cases only.',
    );
    expect(source).toContain('resolveAttendanceValidationOrganizerUserId(db)');
    expect(source).not.toContain('previousEvidence.organizerUserId');
    expect(source).toContain('buildFreshEvidenceSessionSnapshot');
  });

  it('collects fresh Graph evidence then reruns AV5.3 for exactly that class', () => {
    expect(source).toContain('collectTeamsEvidence(');
    expect(source).toContain(
      'createOccurrenceSelectingTeamsEvidenceGraphClient',
    );
    expect(source).toContain('runAv53ShadowWithFirestore');
    expect(source).toContain('classSessionId,');
    expect(source).toContain('evidenceId: evidenceResult.evidence.id');
  });

  it('writes only AVS sidecars and does not expose operational writers', () => {
    expect(source).not.toContain(".collection('billingCharges')");
    expect(source).not.toContain(".collection('teacherEarnings')");
    expect(source).not.toContain(".collection('rescheduleCredits')");
    expect(source).not.toContain("sessionRef.set");
    expect(source).not.toContain("sessionRef.update");
    expect(source).toContain('operationalMutationAllowed: false');
  });

  it('uses guarded dirty-marker cleanup and exposes read/Graph costs', () => {
    expect(source).toContain('await dirtyRef.delete({');
    expect(source).toContain('lastUpdateTime: dirtySnapshot.updateTime');
    expect(source).toContain('graphLogicalCalls: counted.count()');
    expect(source).toContain('issueDetails: evidenceResult.evidence.issues.map');
    expect(source).toContain('httpStatus: issue.httpStatus');
    expect(source).toContain('graphCode: issue.graphCode');
    expect(source).toContain('sameDayContextReads');
    expect(source).toContain('sameDayContextReadDocumentBudget');
    expect(source).toContain('boundedReadsExcludingStaffRegistry');
    expect(source).toContain('concurrentMarkerChangeDetected');
  });

  it('is explicitly exported for bounded deployment', () => {
    expect(functionsIndex).toContain(
      'export { forceRefreshAttendanceValidationEvidence } from "./attendanceValidation/forceFreshEvidenceCallable";',
    );
  });
});
