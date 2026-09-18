#!/usr/bin/env node
import { createRequire } from 'node:module';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import {
  EXPECTED_REGION, EXPECTED_RUNTIME, batch, classifyAttempt, classifyProviderState, deploymentPlanHash,
  digestBoundedOutput, discoverEndpointPlan, filterEndpointPlan, firebaseCliDiagnosticExcerpt,
  functionsChangeDecision, normalizeRevisionId, parseDeploymentArgs,
  remainingTargets, retryProvider404, validateCheckpoint,
} from './deployment/functions-deployment-lib.mjs';

const require = createRequire(import.meta.url);
const PROJECT = process.env.FIREBASE_PROJECT_ID || 'tinysteps-react-v1';
const EXPECTED_REPOSITORY = 'tinystepselearning-surya/tinysteps-react-v1';
const FIREBASE_CLI = '15.30.0';
const REPORT_PATH = resolve('artifacts/functions-deployment-report.json');
const MAX_CAPTURE_BYTES = 2 * 1024 * 1024;
const SETTLE_TIMEOUT_MS = 10 * 60 * 1000;
const POLL_MS = 15 * 1000;
const BACKOFF_SECONDS = [60, 120, 240];

let options;
try {
  options = parseDeploymentArgs(process.argv.slice(2), process.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

if (options.mode === '--check-changes') {
  await checkFunctionsChanged(options);
  process.exit(0);
}

const firebaseConfig = JSON.parse(await readFile(resolve('firebase.json'), 'utf8'));
const functionsConfig = firebaseConfig?.functions;
if (!functionsConfig || functionsConfig.source !== 'functions') throw new Error('firebase.json must define functions.source as "functions"');
if (functionsConfig.runtime && functionsConfig.runtime !== EXPECTED_RUNTIME) throw new Error(`firebase.json Functions runtime must be ${EXPECTED_RUNTIME}`);
const codebase = functionsConfig.codebase || 'default';
const commit = process.env.GITHUB_SHA || null;
const report = {
  version: 2,
  project: PROJECT,
  region: EXPECTED_REGION,
  codebase,
  firebaseCliVersion: FIREBASE_CLI,
  commit,
  mode: options.mode.slice(2),
  startedAt: new Date().toISOString(),
  confirmedReady: [],
  batches: [],
};

try {
  await validateRuntimeContract();
  const exportsObject = require(resolve('functions/lib/index.js'));
  const fullPlan = discoverEndpointPlan(exportsObject);
  const plan = filterEndpointPlan(fullPlan, options.only);
  if (!plan.length) throw new Error('Resolved Functions deployment plan is empty');
  report.targetCount = plan.length;
  report.targets = plan.map(({ id, selector }) => ({ id, selector }));
  report.planHash = deploymentPlanHash({ project: PROJECT, region: EXPECTED_REGION, codebase, targets: report.targets });
  const groups = batch(plan, 5);
  report.batchCount = groups.length;

  if (options.mode === '--plan') {
    report.status = 'planned';
    report.finishedAt = new Date().toISOString();
    console.log(`Functions deployment plan ${report.planHash}: ${plan.length} targets in ${groups.length} sequential batch(es) of at most 5.`);
    groups.forEach((group, index) => console.log(`Batch ${index + 1}: ${group.map(target => target.id).join(', ')}`));
    await persistReport();
    process.exit(0);
  }

  validateDeployContext();
  if (options.resumeFrom) {
    const checkpoint = JSON.parse(await readFile(resolve(options.resumeFrom), 'utf8'));
    const ready = validateCheckpoint(checkpoint, report);
    report.resumedFrom = resolve(options.resumeFrom);
    report.priorBatches = Array.isArray(checkpoint.batches) ? checkpoint.batches : [];
    report.confirmedReady = [...ready].sort();
  }
  const confirmedReady = new Set(report.confirmedReady);
  await waitForRegionalOperationsToSettle();

  // The GitHub workflow holds the project-wide Firebase deployment concurrency lock
  // for this entire job. Reject a stale commit immediately before the first mutation,
  // but once a Functions mutation begins, finish this bounded plan. A newer main run
  // will remain queued behind the lock and deploy next. Aborting after one or more
  // batches have mutated production would leave a deliberately partial rollout.
  let mutationStarted = false;

  for (let index = 0; index < groups.length; index++) {
    const group = groups[index];
    let pending = remainingTargets(group, confirmedReady);
    const batchReport = {
      index: index + 1,
      targets: group.map(target => target.id),
      resumedReady: group.filter(target => confirmedReady.has(target.id)).map(target => target.id),
      attempts: [],
    };
    report.batches.push(batchReport);
    if (!pending.length) {
      batchReport.status = 'skipped-confirmed-ready';
      await persistReport();
      continue;
    }

    for (let attempt = 0; attempt < BACKOFF_SECONDS.length && pending.length; attempt++) {
      await sleepWithJitter(BACKOFF_SECONDS[attempt]);
      await waitForRegionalOperationsToSettle();
      if (!mutationStarted) {
        await requireCurrentMain();
        mutationStarted = true;
      }
      console.log(`Deploying batch ${index + 1}/${groups.length}, attempt ${attempt + 1}: ${pending.map(target => target.id).join(', ')}`);
      const result = await runBounded('npx', [
        '--yes', `firebase-tools@${FIREBASE_CLI}`, 'deploy',
        '--only', pending.map(target => target.selector).join(','),
        '--project', PROJECT,
        '--non-interactive',
      ]);
      const outputMeta = digestBoundedOutput(result.output);
      if (result.code !== 0) {
        const diagnostic = firebaseCliDiagnosticExcerpt(result.output);
        console.error(diagnostic
          ? `Firebase CLI failure diagnostic (sanitized, bounded):\n${diagnostic}`
          : 'Firebase CLI exited non-zero; no safe error-relevant diagnostic lines were found.');
      }
      const classification = result.truncated
        ? await classifyTruncatedAttempt(result, pending)
        : await classifyAttempt({ exitCode: result.code, output: result.output, expectedTargets: pending, reconcileTarget });
      const attemptReport = {
        attempt: attempt + 1,
        targets: pending.map(target => target.id),
        exitCode: result.code,
        outputBytes: outputMeta.bytes,
        outputSha256: outputMeta.sha256,
        outputTruncated: result.truncated,
        outcome: classification.reason,
        retryable: classification.retryable,
        ready: classification.ready,
        failed: classification.failed,
        uncertain: classification.uncertain,
      };
      batchReport.attempts.push(attemptReport);
      for (const item of classification.ready) confirmedReady.add(item.target);
      report.confirmedReady = [...confirmedReady].sort();
      await persistReport();

      const unresolvedItems = [...classification.failed, ...classification.uncertain];
      if (!unresolvedItems.length) {
        pending = [];
        break;
      }
      const details = unresolvedItems
        .map(item => `${item.target}: ${item.reason}${item.evidence ? ` (${formatEvidence(item.evidence)})` : ''}`)
        .join('; ');
      if (!classification.retryable) throw new Error(`Batch ${index + 1} failed closed with target attribution: ${details}. Resume with this report after correcting the cause.`);
      const unresolvedIds = new Set(unresolvedItems.map(item => item.target));
      pending = pending.filter(target => unresolvedIds.has(target.id));
    }

    if (pending.length) throw new Error(`Batch ${index + 1} exhausted bounded retries: ${pending.map(target => target.id).join(', ')}`);
    batchReport.status = 'confirmed-ready';
    await persistReport();
  }

  report.status = 'verified';
  report.finishedAt = new Date().toISOString();
  await persistReport();
  console.log(`Verified ${report.targetCount} Cloud Functions; ${report.confirmedReady.length} are checkpointed ready.`);
} catch (error) {
  report.status = 'failed';
  report.finishedAt = new Date().toISOString();
  report.error = error instanceof Error ? error.message : String(error);
  await persistReport().catch(() => {});
  console.error(report.error);
  process.exit(1);
}

async function validateRuntimeContract() {
  const pkg = JSON.parse(await readFile(resolve('functions/package.json'), 'utf8'));
  const node = pkg?.engines?.node;
  const normalized = node ? `nodejs${String(node).replace(/[^0-9]/g, '')}` : '';
  if (normalized !== EXPECTED_RUNTIME) throw new Error(`Unexpected Functions runtime: ${node ?? 'none'}; expected Node 22`);
}

function validateDeployContext() {
  if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('--deploy is restricted to GitHub Actions');
  const event = process.env.GITHUB_EVENT_NAME;
  if (!['push', 'workflow_dispatch'].includes(event)) throw new Error('--deploy requires a push or workflow_dispatch event');
  if (event === 'workflow_dispatch' && !options.only) throw new Error('Manual Functions recovery requires a non-empty FUNCTIONS_DEPLOY_ONLY/--only target list');
  if (event === 'push' && !options.only && process.env.FUNCTIONS_DEPLOY_FULL !== 'true') {
    throw new Error('Full Functions deployment requires explicit FUNCTIONS_DEPLOY_FULL=true from a known global-impact decision');
  }
  if (process.env.GITHUB_REF !== 'refs/heads/main') throw new Error('--deploy requires refs/heads/main');
  if (process.env.GITHUB_REPOSITORY !== EXPECTED_REPOSITORY) throw new Error(`Unexpected repository: ${process.env.GITHUB_REPOSITORY}`);
  if (!/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA || '')) throw new Error('Missing/invalid GITHUB_SHA');
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required for stale-main guard');
}

async function requireCurrentMain() {
  const url = `https://api.github.com/repos/${EXPECTED_REPOSITORY}/commits/main`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`Unable to verify current main (${res.status})`);
  const body = await res.json();
  if (body.sha !== process.env.GITHUB_SHA) throw new Error(`Deployment commit is stale; main is now ${body.sha}`);
}

async function accessToken() {
  const result = await runBounded('gcloud', ['auth', 'print-access-token'], 128 * 1024);
  if (result.code !== 0 || result.truncated) throw new Error('Unable to obtain Google access token for deployment verification');
  const token = result.output.trim().split(/\r?\n/).at(-1);
  if (!token) throw new Error('Google access token was empty');
  return token;
}

async function googleJson(url) {
  const token = await accessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const error = new Error(`Google read verification failed (${res.status}) for ${new URL(url).pathname}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

async function listUnfinishedOperations() {
  let pageToken = '';
  const unfinished = [];
  do {
    const qs = new URLSearchParams({ pageSize: '100' });
    if (pageToken) qs.set('pageToken', pageToken);
    const body = await googleJson(`https://cloudfunctions.googleapis.com/v2/projects/${PROJECT}/locations/${EXPECTED_REGION}/operations?${qs}`);
    for (const operation of body.operations ?? []) if (operation.done !== true) unfinished.push(operation.name);
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return unfinished;
}

async function waitForRegionalOperationsToSettle() {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;
  while (true) {
    const pending = await listUnfinishedOperations();
    if (!pending.length) return;
    if (Date.now() >= deadline) throw new Error(`Regional Functions operations did not settle within 10 minutes (${pending.length} still unfinished)`);
    console.log(`Waiting for ${pending.length} unfinished regional Functions operation(s) to settle.`);
    await sleep(POLL_MS);
  }
}

async function reconcileTarget(targetId) {
  return retryProvider404(async attempt => {
    if (attempt > 1) console.log(`Provider read for ${targetId} returned 404; bounded reconciliation retry ${attempt}/6.`);
    const fnUrl = `https://cloudfunctions.googleapis.com/v2/projects/${PROJECT}/locations/${EXPECTED_REGION}/functions/${encodeURIComponent(targetId)}`;
    const fn = await googleJson(fnUrl);
    if (fn.state !== 'ACTIVE') return classifyProviderState(targetId, fn);
    const functionRevision = normalizeRevisionId(fn.serviceConfig?.revision);
    const serviceResource = fn.serviceConfig?.service;
    if (!functionRevision || !serviceResource) return classifyProviderState(targetId, fn);

    const serviceId = serviceResource.split('/').at(-1);
    const service = await googleJson(`https://run.googleapis.com/v2/projects/${PROJECT}/locations/${EXPECTED_REGION}/services/${encodeURIComponent(serviceId)}`);
    return classifyProviderState(targetId, fn, service);
  });
}

async function classifyTruncatedAttempt(result, pending) {
  return classifyAttempt({
    exitCode: result.code,
    output: '',
    expectedTargets: pending,
    reconcileTarget: async id => {
      const reconciled = await reconcileTarget(id);
      return reconciled.classification === 'ready' || reconciled.classification === 'failed'
        ? reconciled
        : { classification: 'uncertain', reason: 'firebase-cli-output-truncated', evidence: reconciled.evidence };
    },
  });
}

async function checkFunctionsChanged({ before, sha }) {
  let decision;
  try {
    const ancestor = await runBounded('git', ['merge-base', '--is-ancestor', before || '', sha || ''], 64 * 1024);
    if (ancestor.code !== 0) throw new Error('before SHA is not an ancestor of the deployed SHA');
    const diff = await runBounded('git', ['diff', '--name-only', '-z', before, sha], MAX_CAPTURE_BYTES);
    if (diff.code !== 0 || diff.truncated) throw new Error('git diff was unavailable or truncated');
    decision = functionsChangeDecision({
      before,
      sha,
      isAncestor: true,
      changedFiles: diff.output.split('\0').filter(Boolean),
      firebaseFunctionsBefore: await firebaseFunctionsConfigAt(before),
      firebaseFunctionsAfter: await firebaseFunctionsConfigAt(sha),
    });
  } catch (error) {
    decision = { changed: true, reason: `fail-safe:${error instanceof Error ? error.message : String(error)}` };
  }
  const value = decision.changed ? 'true' : 'false';
  console.log(`FUNCTIONS_CHANGED=${value} (${decision.reason})`);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `functions_changed=${value}\nreason=${decision.reason}\n`, 'utf8');
}

async function firebaseFunctionsConfigAt(revision) {
  const result = await runBounded('git', ['show', `${revision}:firebase.json`], MAX_CAPTURE_BYTES);
  if (result.code !== 0 || result.truncated) throw new Error(`firebase.json unavailable at ${revision}`);
  return JSON.parse(result.output).functions ?? null;
}

async function sleepWithJitter(seconds) {
  const jitterMs = Math.floor(Math.random() * 5000);
  console.log(`Rate guard: waiting at least ${seconds}s before next mutation attempt.`);
  await sleep(seconds * 1000 + jitterMs);
}

function sleep(ms) { return new Promise(resolvePromise => setTimeout(resolvePromise, ms)); }

async function runBounded(command, args, limit = MAX_CAPTURE_BYTES) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    let bytes = 0;
    let truncated = false;
    const collect = chunk => {
      if (bytes >= limit) { truncated = true; return; }
      const buffer = Buffer.from(chunk);
      const keep = Math.min(buffer.length, limit - bytes);
      chunks.push(buffer.subarray(0, keep));
      bytes += keep;
      if (keep < buffer.length) truncated = true;
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', reject);
    child.on('close', code => resolvePromise({ code: code ?? 1, output: Buffer.concat(chunks).toString('utf8'), truncated }));
  });
}

function formatEvidence(evidence) {
  return typeof evidence === 'string' ? evidence.replace(/\s+/g, ' ').slice(0, 500) : JSON.stringify(evidence).slice(0, 1000);
}

async function persistReport() {
  report.completedTargets = [...new Set(report.confirmedReady)].sort();
  const completed = new Set(report.completedTargets);
  const lastAttempts = report.batches.map(batchReport => batchReport.attempts?.at(-1)).filter(Boolean);
  report.failedTargets = [...new Set(lastAttempts.flatMap(attempt =>
    attempt.failed?.map(item => item.target).filter(target => !completed.has(target)) ?? []))].sort();
  report.uncertainTargets = [...new Set(lastAttempts.flatMap(attempt =>
    attempt.uncertain?.map(item => item.target).filter(target => !completed.has(target)) ?? []))].sort();
  report.batchesAttempted = report.batches.filter(batchReport => (batchReport.attempts?.length ?? 0) > 0).length;
  report.attemptCount = report.batches.reduce((total, batchReport) => total + (batchReport.attempts?.length ?? 0), 0);
  await mkdir(resolve('artifacts'), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
