import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS unified Run Validation backend routing', () => {
  const source = read(
    'functions/src/attendanceValidation/runValidationCallable.ts',
  );
  const index = read('functions/src/index.ts');
  const calls = read('src/lib/callFunctions.ts');
  const contract = read('scripts/avs-callable-contract.mjs');

  it('is one admin-only browser callable with the Graph secrets and hardened transport', () => {
    expect(source).toContain('await ensureAdmin(request.auth)');
    expect(source).toContain("invoker: 'public'");
    expect(source).toContain("'avs-public-invoker': 'true'");
    expect(source).toContain('MICROSOFT_TENANT_ID');
    expect(source).toContain('MICROSOFT_CLIENT_ID');
    expect(source).toContain('MICROSOFT_CLIENT_SECRET');
    expect(contract).toContain("'runAttendanceValidationRange'");
  });

  it('runs cached dirty reconciliation before deciding fresh work', () => {
    const latest = source.indexOf(
      'runAttendanceValidationLatestCheckBatch(',
    );
    const targets = source.indexOf(
      'uniqueFreshValidationTargets({',
    );
    expect(latest).toBeGreaterThan(-1);
    expect(targets).toBeGreaterThan(latest);
  });

  it('automatically refreshes stale cases and collects first evidence for missing cases or missing referenced evidence', () => {
    expect(source).toContain(
      'refreshAttendanceValidationCaseEvidence({',
    );
    expect(source).toContain(
      'collectMissingAttendanceValidationCase({',
    );
    expect(source).toContain(
      'missingCaseSessionIds: latest.baselineRequiredSessionIds',
    );
    expect(source).toContain(
      'AVS_FORCE_FRESH_RANGE_CONCURRENCY',
    );
    expect(source).toContain('mapWithConcurrency(');
  });

  it('uses remaining capacity for the existing baseline cursor engine', () => {
    expect(source).toContain(
      'remainingUnifiedValidationCapacity(',
    );
    expect(source).toContain(
      'runAttendanceValidationFirstTimeBaselineBatch(',
    );
    expect(source).toContain('{ maxSessions: remainingCapacity }');
    expect(source).toContain(
      'AVS_UNIFIED_VALIDATION_MAX_SESSIONS_PER_RUN',
    );
  });

  it('returns continuation, failure, Graph-call, and review diagnostics', () => {
    expect(source).toContain('continueValidation: hasMore');
    expect(source).toContain('freshFailedCount');
    expect(source).toContain('freshnessUnsafeCount');
    expect(source).toContain('organizerBlockedReason');
    expect(source).toContain('graphLogicalCalls');
    expect(source).toContain('operationalMutationAllowed: false');
  });

  it('does not import or write attendance/finance collections', () => {
    expect(source).not.toContain("collection('billingCharges')");
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain("collection('teacherEarnings')");
    expect(source).not.toContain("collection('rescheduleCredits')");
    expect(source).not.toContain('sessionRef.update');
    expect(source).not.toContain('sessionRef.set');
  });

  it('is exported and region-routed for the future simplified UI', () => {
    expect(index).toContain(
      'export { runAttendanceValidationRange } from "./attendanceValidation/runValidationCallable";',
    );
    expect(calls).toContain(
      "runAttendanceValidationRange: 'asia-south1'",
    );
  });

  it('gives the long-running AVS range callables a browser deadline beyond the 540 second backend limit', () => {
    expect(calls).toContain(
      'const AVS_LONG_RUNNING_CALLABLE_TIMEOUT_MS = 600_000',
    );
    expect(calls).toContain(
      'runAttendanceValidationRange: {\n    timeout: AVS_LONG_RUNNING_CALLABLE_TIMEOUT_MS',
    );
    expect(calls).toContain(
      'forceRefreshAttendanceValidationRange: {\n    timeout: AVS_LONG_RUNNING_CALLABLE_TIMEOUT_MS',
    );
    expect(calls).toContain(
      'httpsCallable(client, name, callableOptions)',
    );
  });
});
