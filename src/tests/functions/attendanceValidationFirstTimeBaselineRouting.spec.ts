import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS first-time date-range baseline routing', () => {
  const source = read(
    'functions/src/attendanceValidation/firstTimeBaselineCallable.ts',
  );
  const functionsIndex = read('functions/src/index.ts');
  const contract = read('src/lib/attendanceValidationContract.ts');
  const rules = read('firestore.rules');

  it('is admin-only, secret-bound, and processes completed historical dates only', () => {
    expect(source).toContain('await ensureAdmin(request.auth)');
    expect(source).toContain("defineSecret('MICROSOFT_TENANT_ID')");
    expect(source).toContain("defineSecret('MICROSOFT_CLIENT_ID')");
    expect(source).toContain("defineSecret('MICROSOFT_CLIENT_SECRET')");
    expect(source).toContain('range.toDate >= todayIst');
    expect(source).toContain(
      'First-time baseline can include only completed service dates through yesterday IST.',
    );
  });

  it('uses a persisted cursor and a hard 100-session batch with one lookahead row', () => {
    expect(source).toContain('ATTENDANCE_VALIDATION_BASELINE_RANGES_COLLECTION');
    expect(source).toContain('AVS_BASELINE_QUERY_LIMIT');
    expect(source).toContain('baselineBatchFromQueryRows(rows, maxSessions)');
    expect(source).toContain('runAttendanceValidationFirstTimeBaselineBatch');
    expect(source).toContain('timeoutSeconds: 540');
    expect(source).toContain('cursorDate: batchPlan.nextCursor?.serviceDateYmd');
    expect(source).toContain('cursorSessionId: batchPlan.nextCursor?.sessionId');
  });

  it('trusts a completed range checkpoint only for the current business schema', () => {
    const schemaGate = source.indexOf('checkpointMatchesCurrentBusinessSchema');
    const completeGate = source.indexOf("text(state.status) === 'complete'");
    const graphClient = source.indexOf('new MicrosoftGraphClient');
    expect(schemaGate).toBeGreaterThan(-1);
    expect(completeGate).toBeGreaterThan(schemaGate);
    expect(graphClient).toBeGreaterThan(completeGate);
    expect(source).toContain('businessCaseSchemaVersion');
    expect(source).toContain('AVS_BUSINESS_CASE_SCHEMA_VERSION');
    expect(source).toContain('const activeState = checkpointMatchesCurrentBusinessSchema');
    expect(source).toContain('alreadyComplete: true');
    expect(source).toContain('graphLogicalCalls: 0');
  });

  it('reuses current cases, migrates legacy cases from cached evidence, and fresh-collects only when needed', () => {
    expect(source).toContain("db.collection('attendanceValidationCases').doc(item.id)");
    expect(source).toContain('isCurrentAvsBusinessCaseDocument(row.data)');
    expect(source).toContain('cachedLegacyRows');
    expect(source).toContain('evidenceId: text(row.data?.evidenceId)');
    expect(source).toContain('legacyWithoutCachedEvidenceRows');
    expect(source).toContain('freshCollectionRows');
    expect(source).toContain('collectTeamsEvidence(');
    expect(source).toContain('bindTeacherIdentityFromFreshEvidence');
    expect(source).toContain('runAv53ShadowWithFirestore');
    expect(source).toContain('missingEvidenceRequiresFresh: true');
    expect(source).toContain('migratedLegacyCaseCount');
    expect(source).toContain('migrationDeferredCount');
  });

  it('can migrate compatible cached legacy cases even while fresh collection is disabled', () => {
    expect(source).toContain('allowFreshEvidence?: boolean');
    expect(source).toContain('const allowFreshEvidence = options.allowFreshEvidence ?? true');
    expect(source).toContain('const deferredFreshRows = allowFreshEvidence');
    expect(source).toContain('for (const item of allowFreshEvidence ? freshCollectionRows : [])');
    expect(source).toContain('cachedLegacyRows.map');
    expect(source).toContain("reason: 'validation_infrastructure_retry'");
  });

  it('resolves one canonical backend organizer without teacher/session fallbacks', () => {
    expect(source).toContain('resolveAttendanceValidationOrganizerUserId(db)');
    expect(source).not.toContain('resolveBaselineOrganizerCandidate');
    expect(source).not.toContain("db.collection('users').doc(teacherId)");
    expect(source).not.toContain('item.data.teamsOrganizerUserId');
    expect(source).not.toContain('item.data.organizerUserId');
    expect(source).not.toContain('item.data.teacherEmail');
    expect(source).not.toContain('request.data?.organizerUserId');
  });

  it('keeps organizer/infrastructure-blocked baseline sessions retryable instead of creating placeholder review cases', () => {
    expect(source).toContain("'organizer_identity_unresolved'");
    expect(source).toContain("reason: 'validation_infrastructure_retry'");
    expect(source).toContain('markAttendanceValidationDirtySession(db, {');
    expect(source).not.toContain('evidenceId: missingEvidenceId(item.id)');
  });

  it('writes only validation-owned sidecars and never operational attendance/finance', () => {
    expect(source).not.toContain("collection('billingCharges')");
    expect(source).not.toContain("collection('teacherEarnings')");
    expect(source).not.toContain("collection('rescheduleCredits')");
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain('sessionRef.update');
    expect(source).not.toContain('sessionRef.set');
    expect(source).toContain('operationalMutationAllowed: false');
  });

  it('includes bounded same-day context reads in the returned budget', () => {
    expect(source).toContain('sameDayContextReads');
    expect(source).toContain('sameDayContextReadDocumentBudget');
    expect(source).toContain('boundedReadsExcludingStaffRegistry');
  });

  it('keeps the cursor collection backend-only and exports the callable', () => {
    expect(contract).toContain(
      "baselineRanges: 'attendanceValidationBaselineRanges'",
    );
    expect(rules).toContain(
      'match /attendanceValidationBaselineRanges/{rangeId}',
    );
    expect(rules).toContain('allow read, create, update, delete: if false;');
    expect(functionsIndex).toContain(
      'export { runAttendanceValidationFirstTimeBaseline } from "./attendanceValidation/firstTimeBaselineCallable";',
    );
  });
});
