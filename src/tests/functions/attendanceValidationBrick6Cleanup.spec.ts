import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('AVS Brick 6 supported surface cleanup', () => {
  const browserContract = read('scripts/avs-callable-contract.mjs');
  const callFunctions = read('src/lib/callFunctions.ts');
  const latest = read('functions/src/attendanceValidation/latestCheckCallable.ts');
  const baseline = read('functions/src/attendanceValidation/firstTimeBaselineCallable.ts');
  const validationContract = read('src/lib/attendanceValidationContract.ts');
  const planner = read('functions/src/attendanceValidation/forceFreshRangePlanner.ts');

  it('supports only the final three browser AVS callables', () => {
    expect(browserContract).toContain("'runAttendanceValidationRange'");
    expect(browserContract).toContain("'forceRefreshAttendanceValidationEvidence'");
    expect(browserContract).toContain("'forceRefreshAttendanceValidationRange'");
    expect(browserContract).not.toContain("'runAttendanceValidationLatestCheck'");
    expect(browserContract).not.toContain("'runAttendanceValidationFirstTimeBaseline'");
    expect(callFunctions).not.toContain('runAttendanceValidationLatestCheck:');
    expect(callFunctions).not.toContain('runAttendanceValidationFirstTimeBaseline:');
  });

  it('keeps old pipeline wrappers private while preserving reusable batch helpers', () => {
    expect(latest).toContain("invoker: 'private'");
    expect(baseline).toContain("invoker: 'private'");
    expect(latest).toContain('runAttendanceValidationLatestCheckBatch');
    expect(baseline).toContain('runAttendanceValidationFirstTimeBaselineBatch');
  });

  it('removes the obsolete deterministic Force Fresh range contract', () => {
    expect(validationContract).not.toContain('forceFreshRanges:');
    expect(planner).not.toContain('ATTENDANCE_VALIDATION_FORCE_FRESH_RANGES_COLLECTION');
    expect(validationContract).toContain(
      "forceFreshRuns: 'attendanceValidationForceFreshRuns'",
    );
  });
});
