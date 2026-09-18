import crypto from 'node:crypto';

export const EXPECTED_REGION = 'asia-south1';
export const EXPECTED_RUNTIME = 'nodejs22';
export const BATCH_SIZE = 5;

export function discoverEndpointPlan(exported) {
  const seen = new Set();
  const functions = [];
  for (const [exportName, value] of Object.entries(exported ?? {})) {
    const ep = value?.__endpoint;
    if (!ep) continue;
    if (ep.platform !== 'gcfv2') throw new Error(`Unsupported platform for ${exportName}: ${ep.platform ?? 'unknown'}`);
    const regions = Array.isArray(ep.region) ? ep.region : ep.region ? [ep.region] : [];
    if (regions.length !== 1 || regions[0] !== EXPECTED_REGION) {
      throw new Error(`Unexpected region topology for ${exportName}: ${regions.join(',') || 'none'}`);
    }
    const id = String(exportName);
    if (ep.entryPoint && typeof ep.entryPoint !== 'string') throw new Error(`Invalid entryPoint metadata for ${exportName}`);
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(id)) throw new Error(`Unsafe function id: ${id}`);
    if (seen.has(id)) throw new Error(`Duplicate function id: ${id}`);
    seen.add(id);
    functions.push({ exportName, id, region: regions[0], selector: `functions:${id}` });
  }
  if (!functions.length) throw new Error('No deployable compiled function exports found');
  functions.sort((a, b) => a.id.localeCompare(b.id));
  return functions;
}

export function batch(items, size = BATCH_SIZE) {
  if (!Number.isInteger(size) || size < 1) throw new Error('Invalid batch size');
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function parseDeploymentArgs(argv, env = {}) {
  const args = [...argv];
  const mode = args.shift();
  if (!['--plan', '--deploy', '--check-changes'].includes(mode)) {
    throw new Error('Usage: node scripts/deploy-functions-batched.mjs --plan|--deploy|--check-changes [--only <targets>] [--resume-from <checkpoint>]');
  }
  const options = { mode, only: env.FUNCTIONS_DEPLOY_ONLY || '', resumeFrom: '' };
  while (args.length) {
    const flag = args.shift();
    if (!['--only', '--resume-from', '--before', '--sha'].includes(flag)) throw new Error(`Unknown argument: ${flag}`);
    const value = args.shift();
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (flag === '--only') options.only = value;
    else if (flag === '--resume-from') options.resumeFrom = value;
    else if (flag === '--before') options.before = value;
    else options.sha = value;
  }
  if (mode !== '--deploy' && options.resumeFrom) throw new Error('--resume-from requires --deploy');
  return options;
}

export function filterEndpointPlan(plan, only) {
  if (!only) return plan;
  const requested = String(only).split(',').map(value => value.trim().replace(/^functions:/, '')).filter(Boolean);
  const requestedSet = new Set(requested);
  if (requestedSet.size !== requested.length) throw new Error('Duplicate target in --only/FUNCTIONS_DEPLOY_ONLY');
  const selected = plan.filter(target => requestedSet.has(target.id));
  const found = new Set(selected.map(target => target.id));
  const missing = requested.filter(id => !found.has(id));
  if (missing.length) throw new Error(`Unknown Functions target(s): ${missing.join(', ')}`);
  return selected;
}

export function deploymentPlanHash({ project, region, codebase = 'default', targets }) {
  const identity = { project, region, codebase, targets: targets.map(({ id, selector }) => ({ id, selector })) };
  return crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex');
}

export function validateCheckpoint(checkpoint, expected) {
  const mismatches = [];
  for (const key of ['project', 'region', 'codebase', 'commit', 'planHash']) {
    if (checkpoint?.[key] !== expected[key]) mismatches.push(`${key}: checkpoint=${checkpoint?.[key] ?? '<missing>'}, current=${expected[key] ?? '<missing>'}`);
  }
  if (JSON.stringify(checkpoint?.targets) !== JSON.stringify(expected.targets)) mismatches.push('resolved target plan differs');
  if (mismatches.length) throw new Error(`Checkpoint identity mismatch; refusing resume (${mismatches.join('; ')})`);
  const targetSet = new Set(expected.targets.map(target => target.id));
  const ready = checkpoint?.confirmedReady;
  if (!Array.isArray(ready) || ready.some(id => !targetSet.has(id)) || new Set(ready).size !== ready.length) {
    throw new Error('Checkpoint confirmedReady list is invalid for the current target plan');
  }
  return new Set(ready);
}

export function remainingTargets(plan, confirmedReady) {
  const ready = confirmedReady instanceof Set ? confirmedReady : new Set(confirmedReady ?? []);
  return plan.filter(target => !ready.has(target.id));
}

export function functionsChangeDecision({ before, sha, isAncestor, changedFiles, firebaseFunctionsBefore, firebaseFunctionsAfter }) {
  if (!/^[a-f0-9]{40}$/.test(before || '') || /^0{40}$/.test(before || '')) return { changed: true, reason: 'missing-or-zero-before-sha' };
  if (!/^[a-f0-9]{40}$/.test(sha || '') || isAncestor !== true || !Array.isArray(changedFiles)) return { changed: true, reason: 'unreliable-git-history' };
  if (firebaseFunctionsBefore === undefined || firebaseFunctionsAfter === undefined) return { changed: true, reason: 'firebase-functions-config-unavailable' };
  if (JSON.stringify(firebaseFunctionsBefore) !== JSON.stringify(firebaseFunctionsAfter)) return { changed: true, reason: 'firebase-functions-config-changed' };
  const relevant = changedFiles.find(path => path === '.firebaserc' || path === 'firebase.json' || path === 'functions' || path.startsWith('functions/'));
  if (relevant && relevant !== 'firebase.json') return { changed: true, reason: `function-artifact-path-changed:${relevant}` };
  return { changed: false, reason: 'no-function-artifact-or-config-change' };
}

export function terminalReadyTargets(output, candidateIds) {
  const ready = new Set();
  for (const line of String(output ?? '').split(/\r?\n/)) {
    if (!/successful (?:create|update|delete) operation|deployed successfully/i.test(line)) continue;
    for (const id of candidateIds) {
      if (new RegExp(`(?:^|[^A-Za-z0-9_-])${escapeRegExp(id)}(?:\\([^)]*\\))?(?:$|[^A-Za-z0-9_-])`).test(line)) ready.add(id);
    }
  }
  return [...ready];
}

export function enforcePartition(expectedIds, result) {
  const expected = new Set(expectedIds);
  const memberships = new Map(expectedIds.map(id => [id, 0]));
  for (const key of ['ready', 'failed', 'uncertain']) {
    if (!Array.isArray(result[key])) throw new Error(`Missing ${key} classification array`);
    for (const item of result[key]) {
      const id = typeof item === 'string' ? item : item?.target;
      if (!expected.has(id)) throw new Error(`Unexpected classified target: ${id ?? '<missing>'}`);
      memberships.set(id, (memberships.get(id) || 0) + 1);
    }
  }
  const invalid = [...memberships].filter(([, count]) => count !== 1).map(([id, count]) => `${id}(${count})`);
  if (invalid.length) throw new Error(`Deployment classification partition invariant failed: ${invalid.join(', ')}`);
  return result;
}

export async function classifyAttempt({ exitCode, output, expectedTargets, reconcileTarget }) {
  const ids = expectedTargets.map(target => typeof target === 'string' ? target : target.id);
  const failedIds = new Set(terminalFailedTargets(output, ids));
  const readyIds = new Set(terminalReadyTargets(output, ids).filter(id => !failedIds.has(id)));
  const result = { exitCode, ready: [], failed: [], uncertain: [] };
  for (const id of ids) {
    if (failedIds.has(id)) {
      result.failed.push({ target: id, reason: 'firebase-cli-explicit-failure', evidence: boundedEvidence(output, id) });
    } else if (readyIds.has(id)) {
      result.ready.push({ target: id, reason: 'firebase-cli-explicit-success' });
    }
  }
  for (const id of ids.filter(id => !failedIds.has(id) && !readyIds.has(id))) {
    try {
      const reconciled = await reconcileTarget(id);
      const classification = reconciled?.classification;
      if (!['ready', 'failed', 'uncertain'].includes(classification)) {
        result.uncertain.push({ target: id, reason: 'invalid-provider-reconciliation-result', evidence: reconciled ?? null });
      } else {
        result[classification].push({ target: id, reason: reconciled.reason || `provider-${classification}`, evidence: reconciled.evidence ?? null });
      }
    } catch (error) {
      result.uncertain.push({ target: id, reason: 'provider-reconciliation-error', evidence: error instanceof Error ? error.message : String(error) });
    }
  }
  const cliFailure = classifyFailure(output, ids);
  result.retryable = exitCode !== 0 && cliFailure.retryable && result.failed.every(item => item.reason === 'firebase-cli-explicit-failure');
  result.reason = result.failed.length ? 'failed-targets' : result.uncertain.length ? 'uncertain-targets' : 'all-targets-ready';
  return enforcePartition(ids, result);
}

export function normalizeRevisionId(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.split('/').filter(Boolean).at(-1) || '';
}

export function trafficPercentForRevision(service, revision) {
  const targetRevision = normalizeRevisionId(revision);
  if (!targetRevision) throw new Error('Missing target revision for traffic verification');

  const latestReadyRevision = normalizeRevisionId(service?.latestReadyRevision);
  const trafficStatuses = Array.isArray(service?.trafficStatuses) ? service.trafficStatuses : [];
  const desiredTraffic = Array.isArray(service?.traffic) ? service.traffic : [];

  // Cloud Run documents that an empty traffic configuration defaults to 100%
  // traffic to the latest Ready revision. Some API responses represent this
  // implicit default without an observed trafficStatuses entry.
  if (!trafficStatuses.length) {
    if (!desiredTraffic.length && latestReadyRevision === targetRevision) return 100;
    return 0;
  }

  let total = 0;
  for (const status of trafficStatuses) {
    const percent = Number(status?.percent ?? 0);
    if (!Number.isFinite(percent) || !Number.isInteger(percent) || percent < 0 || percent > 100) {
      throw new Error(`Invalid Cloud Run traffic percent: ${status?.percent ?? 'missing'}`);
    }

    const statusRevision = normalizeRevisionId(status?.revision);
    if (status?.type === 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST') {
      if (statusRevision && statusRevision !== latestReadyRevision) {
        throw new Error(`Cloud Run LATEST traffic revision ${statusRevision} does not match latest ready ${latestReadyRevision || 'missing'}`);
      }
      if (latestReadyRevision === targetRevision) total += percent;
      continue;
    }

    if (statusRevision === targetRevision) total += percent;
  }
  return total;
}

export function classifyProviderState(target, fn, service) {
  const functionEvidence = { state: fn?.state ?? null, stateMessages: fn?.stateMessages ?? [], revision: fn?.serviceConfig?.revision ?? null };
  if (fn?.state === 'FAILED') return { classification: 'failed', reason: 'provider-function-state-failed', evidence: functionEvidence };
  if (fn?.state !== 'ACTIVE') return { classification: 'uncertain', reason: 'provider-function-not-active', evidence: functionEvidence };
  const functionRevision = normalizeRevisionId(fn?.serviceConfig?.revision);
  const serviceResource = fn?.serviceConfig?.service;
  if (!functionRevision || !serviceResource) return { classification: 'uncertain', reason: 'provider-function-missing-service-revision', evidence: functionEvidence };
  if (!service) return { classification: 'uncertain', reason: 'provider-cloud-run-state-unavailable', evidence: functionEvidence };

  const serviceEvidence = {
    service: serviceResource,
    reconciling: service.reconciling ?? null,
    generation: service.generation ?? null,
    observedGeneration: service.observedGeneration ?? null,
    terminalCondition: service.terminalCondition ?? null,
    latestCreatedRevision: service.latestCreatedRevision ?? null,
    latestReadyRevision: service.latestReadyRevision ?? null,
  };
  const evidence = { target, function: functionEvidence, cloudRun: serviceEvidence };
  if (service.terminalCondition?.state === 'CONDITION_FAILED') return { classification: 'failed', reason: 'provider-cloud-run-terminal-condition-failed', evidence };
  if (service.reconciling === true || service.generation !== service.observedGeneration) return { classification: 'uncertain', reason: 'provider-cloud-run-still-reconciling', evidence };
  if (service.terminalCondition?.state && service.terminalCondition.state !== 'CONDITION_SUCCEEDED') return { classification: 'uncertain', reason: 'provider-cloud-run-terminal-condition-indeterminate', evidence };
  const created = normalizeRevisionId(service.latestCreatedRevision);
  const ready = normalizeRevisionId(service.latestReadyRevision);
  if (created !== ready || ready !== functionRevision) return { classification: 'uncertain', reason: 'provider-revision-mismatch', evidence };
  const traffic = trafficPercentForRevision(service, functionRevision);
  if (traffic !== 100) return { classification: 'uncertain', reason: 'provider-latest-revision-traffic-not-100', evidence: { ...evidence, traffic } };
  return { classification: 'ready', reason: 'provider-latest-revision-ready-serving', evidence };
}

const TRANSIENT = [
  /429\b/i,
  /too many requests/i,
  /rate.?limit/i,
  /quota.*(?:write|mutation|cpu)/i,
  /(?:write|mutation|cpu).*quota/i,
  /resource.*exhausted/i,
  /RESOURCE_EXHAUSTED/,
  /\b5\d\d\b/,
  /ETIMEDOUT|ECONNRESET|ENOTFOUND|socket hang up|network error|timed? out/i,
];
const PERMANENT = [
  /permission.?denied/i,
  /PERMISSION_DENIED/,
  /unauthori[sz]ed/i,
  /invalid argument/i,
  /INVALID_ARGUMENT/,
  /build failed/i,
  /failed to build/i,
  /could not build/i,
  /syntax error/i,
];

export function terminalFailedTargets(output, candidateIds) {
  const ids = [...candidateIds];
  const failed = new Set();
  const lines = String(output ?? '').split(/\r?\n/);
  let inFinalList = false;
  for (const line of lines) {
    if (/errors with the following functions/i.test(line) || /failed functions/i.test(line)) {
      inFinalList = true;
      continue;
    }
    if (inFinalList && /^\s*$/.test(line)) continue;
    for (const id of ids) {
      if (new RegExp(`(?:^|[^A-Za-z0-9_-])${escapeRegExp(id)}(?:\\([^)]*\\))?(?:$|[^A-Za-z0-9_-])`).test(line)) {
        if (inFinalList || /failed|error|could not|quota|429|resource.?exhausted/i.test(line)) failed.add(id);
      }
    }
  }
  return [...failed];
}

export function classifyFailure(output, candidateIds) {
  const text = String(output ?? '');
  const failedTargets = terminalFailedTargets(text, candidateIds);
  const permanent = PERMANENT.some((r) => r.test(text));
  const transient = TRANSIENT.some((r) => r.test(text));
  if (!failedTargets.length) return { retryable: false, reason: 'unattributed-cli-failure', failedTargets: [] };
  if (permanent) return { retryable: false, reason: 'permanent-or-mixed-failure', failedTargets };
  if (!transient) return { retryable: false, reason: 'unclassified-failure', failedTargets };
  return { retryable: true, reason: 'transient-quota-or-rate-limit', failedTargets };
}

export function digestBoundedOutput(output) {
  const buf = Buffer.from(String(output ?? ''), 'utf8');
  return { bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
}

const FIREBASE_DIAGNOSTIC_LINE = /(?:^|\b)(?:error|failed|failure|permission(?:_denied)?|denied|forbidden|unauthori[sz]ed|invoker|iam|http\s*[45]\d\d|status[=: ]+[45]\d\d|cannot|could not|unable to|functions deploy had errors)(?:\b|:)/i;
const SENSITIVE_ASSIGNMENT = /((?:access[_-]?token|auth(?:orization)?|bearer|client[_-]?secret|credential(?:s)?|id[_-]?token|password|private[_-]?key|refresh[_-]?token|secret|token)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s,}]+)/gi;
const SENSITIVE_QUERY_VALUE = /([?&](?:access_token|api_key|auth|authorization|client_secret|credential|key|password|signature|token)=)[^&#\s]+/gi;
const SENSITIVE_ENV_VALUE = /((?:^|\s)[A-Z0-9_]*(?:CREDENTIAL|KEY|PASSWORD|SECRET|TOKEN)[A-Z0-9_]*\s*=\s*)(?:"[^"]*"|'[^']*'|\S+)/g;

/**
 * Return only bounded, error-relevant Firebase CLI lines after aggressive
 * credential redaction. The deployment report continues to store only the
 * byte count and SHA-256 digest of the complete captured stream.
 */
export function firebaseCliDiagnosticExcerpt(output, { maxLines = 40, maxChars = 12 * 1024 } = {}) {
  if (!Number.isInteger(maxLines) || maxLines < 1 || !Number.isInteger(maxChars) || maxChars < 1) {
    throw new Error('Firebase diagnostic bounds must be positive integers');
  }

  const text = String(output ?? '')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, '[REDACTED PEM]');
  const relevant = text.split(/\r?\n/).filter(line => FIREBASE_DIAGNOSTIC_LINE.test(line));
  const selected = relevant.slice(-maxLines);
  let excerpt = selected.map(redactFirebaseDiagnosticLine).join('\n');
  if (excerpt.length > maxChars) excerpt = `${excerpt.slice(0, Math.max(0, maxChars - 14))}\n[TRUNCATED]`;
  return excerpt;
}

function redactFirebaseDiagnosticLine(line) {
  const text = String(line ?? '');
  if (/\{[^\n]*(?:"private_key"|"private_key_id"|"type"\s*:\s*"service_account")[^\n]*\}/i.test(text)) {
    return '[REDACTED CREDENTIAL JSON]';
  }
  return text
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [REDACTED]')
    .replace(/\b(?:ya29\.[A-Za-z0-9._~-]+|AIza[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, '[REDACTED TOKEN]')
    .replace(SENSITIVE_QUERY_VALUE, '$1[REDACTED]')
    .replace(SENSITIVE_ENV_VALUE, '$1[REDACTED]')
    .replace(SENSITIVE_ASSIGNMENT, '$1[REDACTED]');
}

export async function retryProvider404(read, { attempts = 6, delayMs = 5000, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  if (!Number.isInteger(attempts) || attempts < 1) throw new Error('Provider read attempts must be a positive integer');
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await read(attempt);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404 || attempt === attempts) throw error;
      await sleep(delayMs);
    }
  }
  throw lastError;
}

function boundedEvidence(output, target) {
  const lines = String(output ?? '').split(/\r?\n/).filter(line => line.includes(target) || /error|failed|quota|429|resource.?exhausted/i.test(line));
  return lines.slice(-8).join('\n').slice(0, 4000);
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
