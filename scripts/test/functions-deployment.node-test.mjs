import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';
import {
  discoverEndpointPlan, batch, classifyAttempt, classifyFailure, classifyProviderState, deploymentPlanHash,
  digestBoundedOutput, enforcePartition, filterEndpointPlan, functionsChangeDecision,
  firebaseCliDiagnosticExcerpt,
  normalizeRevisionId, parseDeploymentArgs, terminalFailedTargets, trafficPercentForRevision,
  remainingTargets, retryProvider404, validateCheckpoint,
} from '../deployment/functions-deployment-lib.mjs';
import { buildDependencyGraph } from '../deployment/functions-impact-lib.mjs';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

const fn = (entryPoint, region = ['asia-south1'], platform = 'gcfv2') => ({ __endpoint: { entryPoint, region, platform } });

test('discovers and sorts compiled v2 asia-south1 exports', () => {
  const plan = discoverEndpointPlan({ z: fn('zFn'), a: fn('aFn'), helper: {} });
  assert.deepEqual(plan.map(x => x.id), ['a', 'z']);
  assert.equal(plan[0].selector, 'functions:a');
});

test('source dependency roots exactly match compiled deployed Function exports', () => {
  const files = execFileSync('git', ['ls-files', 'functions/src'], { encoding: 'utf8' })
    .split(/\r?\n/).filter(file => /\.[cm]?[jt]sx?$/.test(file));
  const graph = buildDependencyGraph(new Map(files.map(file => [file, readFileSync(file, 'utf8')])));
  const compiled = discoverEndpointPlan(require('../../functions/lib/index.js')).map(target => target.id);
  assert.deepEqual([...graph.roots.keys()].sort(), compiled);
});

test('fails closed on unexpected region or platform', () => {
  assert.throws(() => discoverEndpointPlan({ a: fn('a', ['us-central1']) }), /Unexpected region topology/);
  assert.throws(() => discoverEndpointPlan({ a: fn('a', ['asia-south1'], 'gcfv1') }), /Unsupported platform/);
});

test('batches deterministically in groups of five', () => {
  assert.deepEqual(batch([1,2,3,4,5,6,7,8,9,10,11]), [[1,2,3,4,5],[6,7,8,9,10],[11]]);
});

test('normalizes short and fully-qualified Cloud Run revision identifiers', () => {
  const id = 'adminadjustparentwallet-00100-fiz';
  const full = `projects/tinysteps-react-v1/locations/asia-south1/services/adminadjustparentwallet/revisions/${id}`;
  assert.equal(normalizeRevisionId(id), id);
  assert.equal(normalizeRevisionId(full), id);
  assert.equal(normalizeRevisionId(`/${full}/`), id);
  assert.equal(normalizeRevisionId(null), '');
});

test('counts explicit Cloud Run revision traffic after normalizing resource names', () => {
  const id = 'adminadjustparentwallet-00100-fiz';
  const full = `projects/tinysteps-react-v1/locations/asia-south1/services/adminadjustparentwallet/revisions/${id}`;
  const service = {
    latestReadyRevision: full,
    trafficStatuses: [{ revision: full, percent: 100 }],
  };
  assert.equal(trafficPercentForRevision(service, id), 100);
});

test('counts Cloud Run LATEST traffic against latest ready revision', () => {
  const id = 'adminadjustparentwallet-00100-fiz';
  const service = {
    latestReadyRevision: `projects/tinysteps-react-v1/locations/asia-south1/services/adminadjustparentwallet/revisions/${id}`,
    trafficStatuses: [{ type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 100 }],
  };
  assert.equal(trafficPercentForRevision(service, id), 100);
});

test('accepts documented implicit 100% latest traffic only when no traffic config is present', () => {
  const id = 'adminadjustparentwallet-00100-fiz';
  assert.equal(trafficPercentForRevision({ latestReadyRevision: id, traffic: [], trafficStatuses: [] }, id), 100);
  assert.equal(trafficPercentForRevision({ latestReadyRevision: id, traffic: [{ percent: 100 }], trafficStatuses: [] }, id), 0);
});

test('fails closed for split, mismatched, or malformed Cloud Run traffic', () => {
  const id = 'adminadjustparentwallet-00100-fiz';
  assert.equal(trafficPercentForRevision({
    latestReadyRevision: id,
    trafficStatuses: [
      { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 90 },
      { revision: 'older-revision', percent: 10 },
    ],
  }, id), 90);
  assert.equal(trafficPercentForRevision({
    latestReadyRevision: 'different-revision',
    trafficStatuses: [{ type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 100 }],
  }, id), 0);
  assert.throws(() => trafficPercentForRevision({
    latestReadyRevision: id,
    trafficStatuses: [{ type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 101 }],
  }, id), /Invalid Cloud Run traffic percent/);
});

test('extracts terminal failed targets and retries only transient failures', () => {
  const out = `Error: quota exceeded with HTTP 429 while updating alpha\nFunctions deploy had errors with the following functions:\n  alpha(asia-south1)\n`;
  assert.deepEqual(terminalFailedTargets(out, ['alpha','beta']), ['alpha']);
  assert.deepEqual(classifyFailure(out, ['alpha','beta']), {
    retryable: true, reason: 'transient-quota-or-rate-limit', failedTargets: ['alpha'],
  });
});

test('does not retry unknown or permission failures', () => {
  const unknown = `Error updating alpha\nFunctions deploy had errors with the following functions:\n alpha(asia-south1)`;
  assert.equal(classifyFailure(unknown, ['alpha']).retryable, false);
  const denied = `PERMISSION_DENIED for alpha; quota 429\nFunctions deploy had errors with the following functions:\n alpha(asia-south1)`;
  assert.equal(classifyFailure(denied, ['alpha']).reason, 'permanent-or-mixed-failure');
});

test('keeps bounded retry support for attributed provider 5xx and network failures', () => {
  for (const message of ['HTTP 503 while updating alpha', 'ETIMEDOUT while updating alpha']) {
    const output = `${message}\nFunctions deploy had errors with the following functions:\n alpha(asia-south1)`;
    assert.equal(classifyFailure(output, ['alpha']).retryable, true);
  }
});

test('report stores digest metadata, not raw output', () => {
  const d = digestBoundedOutput('secret-ish raw output');
  assert.equal(d.bytes, 21);
  assert.match(d.sha256, /^[a-f0-9]{64}$/);
  assert.equal('output' in d, false);
});

test('Firebase CLI failure diagnostics keep relevant errors and redact credentials', () => {
  const output = [
    'i  functions: preparing codebase default for deployment',
    'Authorization: Bearer eyJhbGciOi.test.signature',
    'Error: Unable to set the invoker IAM policy: PERMISSION_DENIED',
    'client_secret=super-sensitive-value',
    'GOOGLE_APPLICATION_CREDENTIALS=/tmp/credentials.json failed to load',
    'Request failed: https://example.test/path?access_token=ya29.secret&key=AIzaabcdefghijklmnopqrstuvwxyz123456',
    '{"type":"service_account","private_key":"-----BEGIN PRIVATE KEY-----secret"} failed',
    'Error: -----BEGIN PRIVATE KEY-----unclosed-sensitive-material',
    `Error: opaque token ${'A'.repeat(64)}`,
  ].join('\n');
  const excerpt = firebaseCliDiagnosticExcerpt(output);
  assert.match(excerpt, /Unable to set the invoker IAM policy: PERMISSION_DENIED/);
  assert.match(excerpt, /GOOGLE_APPLICATION_CREDENTIALS=\[REDACTED\] failed to load/);
  assert.doesNotMatch(excerpt, new RegExp(`eyJhbGci|super-sensitive|ya29\\.secret|AIzaabcdefghijklmnopqrstuvwxyz123456|BEGIN PRIVATE KEY|unclosed-sensitive|${'A'.repeat(64)}|credentials\\.json`));
  assert.doesNotMatch(excerpt, /preparing codebase/);
});

test('Firebase CLI failure diagnostics are line- and character-bounded', () => {
  const output = Array.from({ length: 100 }, (_, index) => `Error ${index}: failed ${'x'.repeat(80)}`).join('\n');
  const excerpt = firebaseCliDiagnosticExcerpt(output, { maxLines: 5, maxChars: 160 });
  assert.ok(excerpt.length <= 160);
  assert.doesNotMatch(excerpt, /Error 0:/);
  assert.match(excerpt, /\[TRUNCATED\]$/);
});

test('bounded deployer prints sanitized diagnostics only for non-zero Firebase CLI exits', () => {
  const source = readFileSync('scripts/deploy-functions-batched.mjs', 'utf8');
  assert.match(source, /if \(result\.code !== 0\) \{[\s\S]*firebaseCliDiagnosticExcerpt\(result\.output\)/);
  assert.doesNotMatch(source, /console\.(?:log|error)\(result\.output\)/);
});

test('bounded deployer fails closed unless the documented Google deploy principal is active', () => {
  const source = readFileSync('scripts/deploy-functions-batched.mjs', 'utf8');
  assert.match(source, /EXPECTED_DEPLOY_PRINCIPAL = 'github-action-1086722180@tinysteps-react-v1\.iam\.gserviceaccount\.com'/);
  assert.match(source, /validateDeployContext\(\);\s*await verifyGoogleDeployPrincipal\(\);/);
  assert.match(source, /accounts\.length !== 1 \|\| accounts\[0\] !== EXPECTED_DEPLOY_PRINCIPAL/);
});

test('provider reconciliation retries only bounded transient 404 reads', async () => {
  let reads = 0;
  const sleeps = [];
  const result = await retryProvider404(async () => {
    reads++;
    if (reads < 3) throw Object.assign(new Error('not propagated yet'), { status: 404 });
    return { state: 'ACTIVE' };
  }, { attempts: 3, delayMs: 10, sleep: async delay => sleeps.push(delay) });
  assert.deepEqual(result, { state: 'ACTIVE' });
  assert.equal(reads, 3);
  assert.deepEqual(sleeps, [10, 10]);
});

test('provider reconciliation never converts a persistent 404 or another error into success', async () => {
  let reads = 0;
  await assert.rejects(() => retryProvider404(async () => {
    reads++;
    throw Object.assign(new Error('missing'), { status: 404 });
  }, { attempts: 2, delayMs: 0, sleep: async () => {} }), /missing/);
  assert.equal(reads, 2);
  await assert.rejects(() => retryProvider404(async () => {
    throw Object.assign(new Error('denied'), { status: 403 });
  }, { attempts: 6, sleep: async () => {} }), /denied/);
});

test('exit zero with no CLI target records reconciles a latest serving revision as ready', async () => {
  const revision = 'alpha-00001-abc';
  const provider = classifyProviderState('alpha', {
    state: 'ACTIVE',
    serviceConfig: { revision, service: 'projects/project/locations/asia-south1/services/alpha' },
  }, {
    reconciling: false,
    generation: '7',
    observedGeneration: '7',
    terminalCondition: { state: 'CONDITION_SUCCEEDED' },
    latestCreatedRevision: revision,
    latestReadyRevision: revision,
    trafficStatuses: [{ revision, percent: 100 }],
  });
  const result = await classifyAttempt({
    exitCode: 0,
    output: 'Deploy complete!',
    expectedTargets: ['alpha'],
    reconcileTarget: async () => provider,
  });
  assert.deepEqual(result.ready.map(item => item.target), ['alpha']);
  assert.deepEqual(result.failed, []);
  assert.deepEqual(result.uncertain, []);
  assert.equal(result.reason, 'all-targets-ready');
});

test('an explicit provider FAILED state retains target and provider reason', async () => {
  const provider = classifyProviderState('alpha', { state: 'FAILED', stateMessages: [{ message: 'Build rejected' }] });
  const result = await classifyAttempt({
    exitCode: 0,
    output: '',
    expectedTargets: ['alpha'],
    reconcileTarget: async () => provider,
  });
  assert.equal(result.failed[0].target, 'alpha');
  assert.equal(result.failed[0].reason, 'provider-function-state-failed');
  assert.match(result.failed[0].evidence.stateMessages[0].message, /Build rejected/);
  assert.equal(result.retryable, false);
});

test('indeterminate provider state attributes every expected target as uncertain', async () => {
  const expectedTargets = ['alpha', 'beta'];
  const result = await classifyAttempt({
    exitCode: 0,
    output: '',
    expectedTargets,
    reconcileTarget: async target => ({ classification: 'uncertain', reason: 'provider-revision-mismatch', evidence: { target } }),
  });
  assert.deepEqual(result.uncertain.map(item => item.target), expectedTargets);
  assert.equal(result.reason, 'uncertain-targets');
});

test('regression batch keeps all five batch 34 targets represented exactly once', async () => {
  const targets = [
    'setEnrollmentStatus',
    'setInsightsEnabled',
    'setRollingEnrollmentLifecycle',
    'setWalletAutomationConfig',
    'syncMessageThreadsForActiveStudents',
  ];
  const states = new Map([
    [targets[0], 'ready'],
    [targets[1], 'failed'],
    [targets[2], 'uncertain'],
    [targets[3], 'ready'],
    [targets[4], 'ready'],
  ]);
  const result = await classifyAttempt({
    exitCode: 0,
    output: 'Deploy complete!',
    expectedTargets: targets,
    reconcileTarget: async target => ({ classification: states.get(target), reason: `provider-${states.get(target)}`, evidence: { target } }),
  });
  const represented = [...result.ready, ...result.failed, ...result.uncertain].map(item => item.target).sort();
  assert.deepEqual(represented, [...targets].sort());
  assert.throws(() => enforcePartition(targets, { ready: [{ target: targets[0] }], failed: [{ target: targets[0] }], uncertain: targets.slice(1).map(target => ({ target })) }), /partition invariant/);
});

test('explicit CLI successes remain successful without provider fallback', async () => {
  let reconciliations = 0;
  const result = await classifyAttempt({
    exitCode: 0,
    output: '✔  functions[alpha(asia-south1)] Successful update operation.',
    expectedTargets: ['alpha'],
    reconcileTarget: async () => { reconciliations++; return { classification: 'uncertain' }; },
  });
  assert.deepEqual(result.ready.map(item => item.target), ['alpha']);
  assert.equal(reconciliations, 0);
});

test('change decision deploys only for Functions artifact/config paths and fails safe', () => {
  const base = { before: 'a'.repeat(40), sha: 'b'.repeat(40), isAncestor: true, firebaseFunctionsBefore: { source: 'functions' }, firebaseFunctionsAfter: { source: 'functions' } };
  assert.equal(functionsChangeDecision({ ...base, changedFiles: ['src/App.tsx'] }).changed, false);
  assert.equal(functionsChangeDecision({ ...base, changedFiles: ['.github/workflows/deploy.yml', 'scripts/deploy-functions-batched.mjs'] }).changed, false);
  assert.equal(functionsChangeDecision({ ...base, changedFiles: ['firebase.json'] }).changed, false);
  assert.equal(functionsChangeDecision({ ...base, changedFiles: ['functions/src/index.ts'] }).changed, true);
  assert.equal(functionsChangeDecision({ ...base, changedFiles: ['firebase.json'], firebaseFunctionsAfter: { source: 'functions', runtime: 'nodejs22' } }).changed, true);
  assert.equal(functionsChangeDecision({ ...base, before: '0'.repeat(40), changedFiles: [] }).changed, true);
  assert.equal(functionsChangeDecision({ ...base, isAncestor: false, changedFiles: [] }).changed, true);
});

test('--check-changes fails safe when a valid-looking before SHA is unavailable locally', async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/deploy-functions-batched.mjs', '--check-changes',
    '--before', 'f'.repeat(40), '--sha', 'e'.repeat(40),
  ], { cwd: process.cwd() });
  assert.match(stdout, /FUNCTIONS_CHANGED=true \(fail-safe:/);
});

test('--only and environment target filters preserve surgical recovery support', () => {
  const plan = [{ id: 'alpha', selector: 'functions:alpha' }, { id: 'beta', selector: 'functions:beta' }];
  assert.equal(parseDeploymentArgs(['--plan', '--only', 'alpha']).only, 'alpha');
  assert.equal(parseDeploymentArgs(['--plan'], { FUNCTIONS_DEPLOY_ONLY: 'beta' }).only, 'beta');
  assert.deepEqual(filterEndpointPlan(plan, 'functions:beta'), [plan[1]]);
  assert.throws(() => filterEndpointPlan(plan, 'missing'), /Unknown Functions target/);
});

test('workflow dispatch exposes a main-only non-empty surgical recovery input', () => {
  const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
  assert.match(workflow, /workflow_dispatch:\n\s+inputs:\n\s+functions_only:/);
  assert.match(workflow, /recover-functions-manually:[\s\S]*github\.ref == 'refs\/heads\/main'[\s\S]*inputs\.functions_only != ''/);
  assert.match(workflow, /FUNCTIONS_DEPLOY_ONLY: \$\{\{ inputs\.functions_only \}\}/);
  assert.match(workflow, /recover-functions-manually:[\s\S]*group: firebase-deployment-tinysteps-react-v1[\s\S]*cancel-in-progress: false/);
});

test('normal Firebase deployment remains serialized and non-cancelling', () => {
  const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
  assert.match(workflow, /deploy-to-firebase:[\s\S]*group: firebase-deployment-tinysteps-react-v1[\s\S]*cancel-in-progress: false/);
});

test('workflow feeds resolver targets to bounded deployment and skips zero-impact mutations', () => {
  const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
  assert.match(workflow, /Resolve artifact and Function impact[\s\S]*resolve-deployment-impact\.mjs/);
  assert.match(workflow, /FUNCTIONS_DEPLOY_ONLY: \$\{\{ needs\.analyze-changes\.outputs\.functions_targets \}\}/);
  assert.match(workflow, /FUNCTIONS_DEPLOY_FULL: \$\{\{ needs\.analyze-changes\.outputs\.functions_full_deployment \}\}/);
  assert.match(workflow, /Deploy Cloud Functions in bounded batches\n\s+if: needs\.analyze-changes\.outputs\.functions_deployment_required == 'true'/);
  assert.match(workflow, /Deploy Firestore Security Rules\n\s+if: needs\.analyze-changes\.outputs\.firestore_rules_changed == 'true'/);
  assert.match(workflow, /Deploy to Firebase Production\n\s+if: needs\.analyze-changes\.outputs\.hosting_changed == 'true'/);
});

test('automated full-fleet mutation requires an explicit known-global decision', () => {
  const source = readFileSync('scripts/deploy-functions-batched.mjs', 'utf8');
  assert.match(source, /event === 'push' && !options\.only && process\.env\.FUNCTIONS_DEPLOY_FULL !== 'true'/);
});

test('Functions deployment report upload survives a failed deployment step', () => {
  const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
  assert.match(workflow, /Upload bounded Functions deployment report\n\s+if: always\(\) && needs\.analyze-changes\.outputs\.functions_deployment_required == 'true'/);
});

test('backend-only validation does not install Playwright or build Hosting', () => {
  const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
  assert.match(workflow, /Install Playwright browsers\n\s+if: needs\.analyze-changes\.outputs\.frontend_validation_required == 'true'/);
  assert.match(workflow, /Build app\n\s+if: needs\.analyze-changes\.outputs\.frontend_validation_required == 'true'/);
});

test('stale-main guard is checked only at the first Functions mutation boundary', () => {
  const source = readFileSync('scripts/deploy-functions-batched.mjs', 'utf8');
  const start = source.indexOf('let mutationStarted = false;');
  const end = source.indexOf("report.status = 'verified';");
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const deployLoop = source.slice(start, end);
  const staleChecks = deployLoop.match(/await requireCurrentMain\(\);/g) ?? [];
  assert.equal(staleChecks.length, 1);
  assert.match(
    deployLoop,
    /if \(!mutationStarted\) \{\s*await requireCurrentMain\(\);\s*mutationStarted = true;\s*\}/,
  );
  assert.doesNotMatch(deployLoop, /requireCurrentMain\(\);[\s\S]{0,200}sleepWithJitter/);
});

test('checkpoint resume accepts matching identity and rejects stale metadata', () => {
  const targets = [{ id: 'alpha', selector: 'functions:alpha' }, { id: 'beta', selector: 'functions:beta' }];
  const expected = {
    project: 'project', region: 'asia-south1', codebase: 'default', commit: 'a'.repeat(40),
    targets, planHash: deploymentPlanHash({ project: 'project', region: 'asia-south1', codebase: 'default', targets }),
  };
  const checkpoint = { ...expected, confirmedReady: ['alpha'] };
  const confirmedReady = validateCheckpoint(checkpoint, expected);
  assert.deepEqual([...confirmedReady], ['alpha']);
  assert.deepEqual(remainingTargets(targets, confirmedReady), [targets[1]]);
  assert.throws(() => validateCheckpoint({ ...checkpoint, commit: 'b'.repeat(40) }, expected), /Checkpoint identity mismatch/);
  assert.throws(() => validateCheckpoint({ ...checkpoint, confirmedReady: ['missing'] }, expected), /confirmedReady list is invalid/);
});

test('--plan resolves the exact regression batch without invoking deployment mode', async () => {
  const targets = [
    'setEnrollmentStatus',
    'setInsightsEnabled',
    'setRollingEnrollmentLifecycle',
    'setWalletAutomationConfig',
    'syncMessageThreadsForActiveStudents',
  ];
  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/deploy-functions-batched.mjs', '--plan', '--only', targets.join(','),
  ], { cwd: process.cwd(), env: { ...process.env, GITHUB_ACTIONS: 'false' } });
  assert.match(stdout, /5 targets in 1 sequential batch/);
  assert.match(stdout, new RegExp(`Batch 1: ${targets.join(', ')}`));
});
