import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS targeted missing-case fresh collection', () => {
  const source = read(
    'functions/src/attendanceValidation/missingCaseFreshCollector.ts',
  );

  it('uses the current operational session and the canonical fresh evidence pipeline', () => {
    expect(source).toContain('buildBaselineEvidenceSessionSnapshot');
    expect(source).toContain(
      'createOccurrenceSelectingTeamsEvidenceGraphClient',
    );
    expect(source).toContain('collectTeamsEvidence(');
    expect(source).toContain('bindTeacherIdentityFromFreshEvidence');
    expect(source).toContain('runAv53ShadowWithFirestore');
  });

  it('avoids duplicate Graph work only when the referenced evidence really exists', () => {
    expect(source).toContain(
      ".collection('attendanceValidationEvidence')",
    );
    expect(source).toContain('referencedEvidenceSnapshot.exists');
    expect(source).toContain("status: 'existing_case' as const");
    expect(source).toContain('graphLogicalCalls: 0');
  });

  it('continues to first-evidence collection when an existing case points to a missing evidence document', () => {
    const evidenceCheck = source.indexOf(
      'referencedEvidenceSnapshot.exists',
    );
    const sessionBuild = source.indexOf(
      'buildBaselineEvidenceSessionSnapshot',
      evidenceCheck,
    );
    expect(evidenceCheck).toBeGreaterThan(-1);
    expect(sessionBuild).toBeGreaterThan(evidenceCheck);
    expect(source).toContain('referencedEvidenceReads');
  });

  it('clears only the dirty marker with an update-time precondition after success', () => {
    expect(source).toContain('lastUpdateTime: dirtySnapshot.updateTime');
    expect(source).toContain('concurrentMarkerChangeDetected = true');
    expect(source).not.toContain('sessionRef.update');
    expect(source).not.toContain('sessionRef.set');
  });

  it('never writes finance or operational attendance', () => {
    expect(source).not.toContain("collection('billingCharges')");
    expect(source).not.toContain("collection('teacherEarnings')");
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain("collection('rescheduleCredits')");
    expect(source).toContain('operationalMutationAllowed: false');
  });
});
