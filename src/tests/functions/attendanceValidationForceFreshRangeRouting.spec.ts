import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS Force Fresh generation routing', () => {
  const source = read(
    'functions/src/attendanceValidation/forceFreshRangeCallable.ts',
  );
  const singleCaseSource = read(
    'functions/src/attendanceValidation/forceFreshEvidenceCallable.ts',
  );
  const functionsIndex = read('functions/src/index.ts');
  const contract = read('src/lib/attendanceValidationContract.ts');
  const rules = read('firestore.rules');

  it('discovers only existing AVS cases by service date', () => {
    expect(source).toContain(".collection('attendanceValidationCases')");
    expect(source).toContain(".where('serviceDateYmd', '>=', range.fromDate)");
    expect(source).toContain(".where('serviceDateYmd', '<=', range.toDate)");
    expect(source).not.toContain(".collection('classSessions').where");
  });

  it('uses the shared single-case Force Fresh pipeline with concurrency five', () => {
    expect(source).toContain('refreshAttendanceValidationCaseEvidence({');
    expect(source).toContain('AVS_FORCE_FRESH_RANGE_CONCURRENCY');
    expect(singleCaseSource).toContain(
      'refreshAttendanceValidationCaseEvidence({',
    );
    expect(singleCaseSource).toContain('inputFingerprint,');
    expect(source).toContain(
      'loadProductionStaffIdentityRegistry(params.db)',
    );
    expect(source).toContain('staffRegistry: staffRegistry!');
  });

  it('persists per-case terminal checkpoints before advancing the discovery cursor', () => {
    const checkpoint = source.indexOf('await persistOutcome({');
    const cursor = source.indexOf(
      'cursorCaseId: plan.nextCursor?.caseId',
    );
    expect(checkpoint).toBeGreaterThan(-1);
    expect(cursor).toBeGreaterThan(checkpoint);
    expect(source).toContain(
      'ATTENDANCE_VALIDATION_FORCE_FRESH_RUN_CASES_SUBCOLLECTION',
    );
    expect(source).toContain('.limit(AVS_FORCE_FRESH_RANGE_QUERY_LIMIT)');
    expect(source).not.toContain('completedCaseIds: FieldValue.arrayUnion');
  });

  it('uses explicit generation ids and never reuses permanent date-range state', () => {
    expect(source).toContain('cleanAvsForceFreshRunId(request.data?.runId)');
    expect(source).toContain('runs.doc(params.requestedRunId)');
    expect(source).toContain('runs.doc()');
    expect(source).toContain(
      'ATTENDANCE_VALIDATION_FORCE_FRESH_RUNS_COLLECTION',
    );
    expect(source).not.toContain('avsForceFreshRangeId(');
    expect(source).not.toContain(
      '.collection(ATTENDANCE_VALIDATION_FORCE_FRESH_RANGES_COLLECTION)',
    );
  });

  it('serializes coordinator requests while keeping internal case concurrency at five', () => {
    expect(source).toContain('maxInstances: 1');
    expect(source).toContain('concurrency: 1');
    expect(source).toContain('AVS_FORCE_FRESH_RANGE_CONCURRENCY');
  });

  it('supports complete-with-failures and bounded failed-case retries', () => {
    expect(source).toContain("status !== 'complete_with_failures'");
    expect(source).toContain(".where('status', '==', 'failed')");
    expect(source).toContain('retryCursorCaseId');
    expect(source).toContain('retryFailures');
    expect(source).toContain('AVS_FORCE_FRESH_RANGE_MAX_CASES');
  });

  it('writes only AVS sidecars and never imports operational writers', () => {
    expect(source).not.toContain("collection('billingCharges')");
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain("collection('teacherEarnings')");
    expect(source).not.toContain('sessionRef.update');
    expect(source).not.toContain('sessionRef.set');
    expect(source).toContain('operationalMutationAllowed: false');
  });

  it('keeps generation progress backend-only and exports the callable', () => {
    expect(contract).toContain(
      "forceFreshRuns: 'attendanceValidationForceFreshRuns'",
    );
    expect(rules).toContain(
      'match /attendanceValidationForceFreshRuns/{runId}',
    );
    expect(rules).toContain(
      'match /cases/{caseId}',
    );
    expect(functionsIndex).toContain(
      'export { forceRefreshAttendanceValidationRange } from "./attendanceValidation/forceFreshRangeCallable";',
    );
  });
});
