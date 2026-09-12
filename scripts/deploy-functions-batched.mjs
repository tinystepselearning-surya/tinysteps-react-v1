#!/usr/bin/env node
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import {
  EXPECTED_REGION, EXPECTED_RUNTIME, batch, classifyFailure,
  digestBoundedOutput, discoverEndpointPlan, normalizeRevisionId,
  trafficPercentForRevision,
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

const mode = process.argv[2];
if (!['--plan', '--deploy'].includes(mode)) {
  console.error('Usage: node scripts/deploy-functions-batched.mjs --plan|--deploy');
  process.exit(2);
}

const report = {
  version: 1,
  project: PROJECT,
  region: EXPECTED_REGION,
  firebaseCliVersion: FIREBASE_CLI,
  commit: process.env.GITHUB_SHA || null,
  mode: mode.slice(2),
  startedAt: new Date().toISOString(),
  batches: [],
};

try {
  await validateRuntimeContract();
  const exportsObject = require(resolve('functions/lib/index.js'));
  const plan = discoverEndpointPlan(exportsObject);
  report.targetCount = plan.length;
  report.targets = plan.map(({ id, selector }) => ({ id, selector }));
  const groups = batch(plan, 5);
  report.batchCount = groups.length;

  if (mode === '--plan') {
    report.status = 'planned';
    console.log(`Functions deployment plan: ${plan.length} targets in ${groups.length} sequential batch(es) of at most 5.`);
    groups.forEach((g, i) => console.log(`Batch ${i + 1}: ${g.map(x => x.id).join(', ')}`));
    await persistReport();
    process.exit(0);
  }

  validateDeployContext();
  await requireCurrentMain();
  await waitForRegionalOperationsToSettle();

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const batchReport = { index: i + 1, targets: group.map(x => x.id), attempts: [] };
    report.batches.push(batchReport);
    let pending = group;

    for (let attempt = 0; attempt < BACKOFF_SECONDS.length && pending.length; attempt++) {
      await requireCurrentMain();
      await sleepWithJitter(BACKOFF_SECONDS[attempt]);
      await requireCurrentMain();
      await waitForRegionalOperationsToSettle();

      console.log(`Deploying batch ${i + 1}/${groups.length}, attempt ${attempt + 1}: ${pending.map(x => x.id).join(', ')}`);
      const selectors = pending.map(x => x.selector).join(',');
      const result = await runBounded('npx', [
        '--yes', `firebase-tools@${FIREBASE_CLI}`, 'deploy',
        '--only', selectors,
        '--project', PROJECT,
        '--non-interactive',
      ]);
      const meta = digestBoundedOutput(result.output);
      const attemptReport = {
        attempt: attempt + 1,
        targets: pending.map(x => x.id),
        exitCode: result.code,
        outputBytes: meta.bytes,
        outputSha256: meta.sha256,
        outputTruncated: result.truncated,
      };
      batchReport.attempts.push(attemptReport);

      await waitForRegionalOperationsToSettle();

      if (result.code === 0) {
        await verifyTargets(pending);
        attemptReport.classification = 'success';
        pending = [];
        break;
      }
      if (result.truncated) throw new Error(`Firebase CLI output was truncated for batch ${i + 1}; refusing to classify/retry`);

      const classification = classifyFailure(result.output, pending.map(x => x.id));
      attemptReport.classification = classification.reason;
      attemptReport.failedTargets = classification.failedTargets;
      if (!classification.retryable) {
        throw new Error(`Batch ${i + 1} failed closed: ${classification.reason} (${classification.failedTargets.join(', ') || 'no target attribution'})`);
      }

      const failedSet = new Set(classification.failedTargets);
      const succeeded = pending.filter(x => !failedSet.has(x.id));
      if (succeeded.length) await verifyTargets(succeeded);
      pending = pending.filter(x => failedSet.has(x.id));
    }

    if (pending.length) throw new Error(`Batch ${i + 1} exhausted bounded retries: ${pending.map(x => x.id).join(', ')}`);
    await verifyTargets(group);
  }

  report.status = 'verified';
  report.finishedAt = new Date().toISOString();
  await persistReport();
  console.log(`Verified ${report.targetCount} Cloud Functions and their Cloud Run revisions.`);
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
  if (process.env.GITHUB_EVENT_NAME !== 'push') throw new Error('--deploy requires a push event');
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
  const r = await runBounded('gcloud', ['auth', 'print-access-token'], 128 * 1024);
  if (r.code !== 0 || r.truncated) throw new Error('Unable to obtain Google access token for deployment verification');
  const token = r.output.trim().split(/\r?\n/).at(-1);
  if (!token) throw new Error('Google access token was empty');
  return token;
}

async function googleJson(url) {
  const token = await accessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Google read verification failed (${res.status}) for ${new URL(url).pathname}`);
  return res.json();
}

async function listUnfinishedOperations() {
  let pageToken = '';
  const unfinished = [];
  do {
    const qs = new URLSearchParams({ pageSize: '100' });
    if (pageToken) qs.set('pageToken', pageToken);
    const url = `https://cloudfunctions.googleapis.com/v2/projects/${PROJECT}/locations/${EXPECTED_REGION}/operations?${qs}`;
    const body = await googleJson(url);
    for (const op of body.operations ?? []) if (op.done !== true) unfinished.push(op.name);
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

async function verifyTargets(targets) {
  for (const target of targets) {
    const fnUrl = `https://cloudfunctions.googleapis.com/v2/projects/${PROJECT}/locations/${EXPECTED_REGION}/functions/${encodeURIComponent(target.id)}`;
    const fn = await googleJson(fnUrl);
    if (fn.state !== 'ACTIVE') throw new Error(`Function ${target.id} is not ACTIVE (state=${fn.state ?? 'unknown'})`);
    const functionRevision = normalizeRevisionId(fn.serviceConfig?.revision);
    const serviceResource = fn.serviceConfig?.service;
    if (!functionRevision || !serviceResource) throw new Error(`Function ${target.id} is missing service revision metadata`);
    const serviceId = serviceResource.split('/').at(-1);
    const runUrl = `https://run.googleapis.com/v2/projects/${PROJECT}/locations/${EXPECTED_REGION}/services/${encodeURIComponent(serviceId)}`;
    const service = await googleJson(runUrl);
    if (service.reconciling === true) throw new Error(`Cloud Run service for ${target.id} is still reconciling`);
    if (service.generation !== service.observedGeneration) {
      throw new Error(`Cloud Run generation mismatch for ${target.id}: generation=${service.generation}, observed=${service.observedGeneration}`);
    }
    if (service.terminalCondition?.state && service.terminalCondition.state !== 'CONDITION_SUCCEEDED') {
      throw new Error(`Cloud Run terminal condition is not successful for ${target.id}: ${service.terminalCondition.state}`);
    }
    const created = normalizeRevisionId(service.latestCreatedRevision);
    const ready = normalizeRevisionId(service.latestReadyRevision);
    if (created !== ready || ready !== functionRevision) {
      throw new Error(`Revision mismatch for ${target.id}: function=${functionRevision}, created=${created}, ready=${ready}`);
    }
    const latestTraffic = trafficPercentForRevision(service, functionRevision);
    if (latestTraffic !== 100) throw new Error(`Function ${target.id} latest revision has ${latestTraffic}% traffic, expected 100%`);
  }
}

async function sleepWithJitter(seconds) {
  const jitterMs = Math.floor(Math.random() * 5000);
  console.log(`Rate guard: waiting at least ${seconds}s before next mutation attempt.`);
  await sleep(seconds * 1000 + jitterMs);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function runBounded(command, args, limit = MAX_CAPTURE_BYTES) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    let bytes = 0;
    let truncated = false;
    const collect = chunk => {
      if (bytes >= limit) { truncated = true; return; }
      const b = Buffer.from(chunk);
      const keep = Math.min(b.length, limit - bytes);
      chunks.push(b.subarray(0, keep));
      bytes += keep;
      if (keep < b.length) truncated = true;
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', reject);
    child.on('close', code => resolvePromise({ code: code ?? 1, output: Buffer.concat(chunks).toString('utf8'), truncated }));
  });
}

async function persistReport() {
  await mkdir(resolve('artifacts'), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
