import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('AVS Brick 8 soak trend guardrails', () => {
  const cli = read('scripts/avs-production-soak-compare.mjs');
  const core = read('scripts/avs-production-soak-compare-core.mjs');
  const packageJson = read('package.json');

  it('is local-file-only and has no Firebase, Graph, or network dependency', () => {
    for (const source of [cli, core]) {
      for (const forbidden of [
        'firebase-admin',
        'firebase/firestore',
        'MicrosoftGraphClient',
        'collectTeamsEvidence',
        'httpsCallable(',
        'fetch(',
        'axios',
        'http.request',
        'https.request',
        'onSchedule(',
        'onSnapshot(',
      ]) {
        expect(source).not.toContain(forbidden);
      }
    }
    expect(core).toContain('firebaseReads: 0');
    expect(core).toContain('firebaseWrites: 0');
    expect(core).toContain('graphCalls: 0');
    expect(core).toContain('operationalWrites: 0');
  });

  it('gates only corrected current-state Brick 7 backlog', () => {
    expect(core).toContain('AVS_SOAK_REPORT_SCHEMA_VERSION = 2');
    expect(core).toContain('currentStateSchemaVersion');
    expect(core).toContain('failedCaseBacklog');
    expect(core).toContain('retryableFailureBacklog');
    expect(core).toContain('actionRequiredFailureBacklog');
    expect(core).toContain('legacyUncategorizedFailureBacklog');
    expect(core).toContain('remainingCaseBacklog');
    expect(core).toContain('current failure backlog counters are inconsistent');
  });

  it('requires genuinely comparable observation windows', () => {
    expect(core).toContain('after.range.fromDate !== before.range.fromDate');
    expect(core).toContain('after.range.toDate !== before.range.toDate');
    expect(core).toContain('exact same service-date window');
  });

  it('never authorizes automation from the soak exit gate', () => {
    expect(core).toContain('automationAuthorized: false');
    expect(core).toContain("'ready_for_manual_exit_review'");
    expect(core).toContain("'continue_soak'");
    expect(core).toContain("'blocked_safety'");
    expect(core).toContain('businessReviewCasesBlockExitGate: false');
  });

  it('keeps comparison manual and opt-in for a non-ready exit code', () => {
    expect(cli).toContain("process.argv.includes('--require-ready')");
    expect(cli).toContain('process.exitCode = 2');
    expect(cli).toContain('MAX_INPUT_BYTES = 2 * 1024 * 1024');
    expect(packageJson).toContain('"audit:avs-soak"');
    expect(packageJson).toContain('"audit:avs-soak-compare"');
  });
});
