import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS Force Fresh selected-range routing', () => {
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
  });

  it('persists per-case completion before advancing the cursor', () => {
    const checkpoint = source.indexOf(
      'completedCaseIds: FieldValue.arrayUnion(item.id)',
    );
    const cursor = source.indexOf('cursorCaseId: nextCursor?.caseId');
    expect(checkpoint).toBeGreaterThan(-1);
    expect(cursor).toBeGreaterThan(checkpoint);
    expect(source).toContain('.limit(AVS_FORCE_FRESH_RANGE_QUERY_LIMIT)');
    expect(source).toContain('remainingCases');
  });

  it('writes only AVS sidecars and never imports operational writers', () => {
    expect(source).not.toContain("collection('billingCharges')");
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain("collection('teacherEarnings')");
    expect(source).not.toContain('sessionRef.update');
    expect(source).not.toContain('sessionRef.set');
    expect(source).toContain('operationalMutationAllowed: false');
  });

  it('keeps progress backend-only and exports the callable', () => {
    expect(contract).toContain(
      "forceFreshRanges: 'attendanceValidationForceFreshRanges'",
    );
    expect(rules).toContain(
      'match /attendanceValidationForceFreshRanges/{rangeId}',
    );
    expect(functionsIndex).toContain(
      'export { forceRefreshAttendanceValidationRange } from "./attendanceValidation/forceFreshRangeCallable";',
    );
  });
});
