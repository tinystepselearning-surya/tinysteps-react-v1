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

export function normalizeRevisionId(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.split('/').filter(Boolean).at(-1) || '';
}

const TRANSIENT = [
  /429\b/i,
  /too many requests/i,
  /rate.?limit/i,
  /quota.*(?:write|mutation|cpu)/i,
  /(?:write|mutation|cpu).*quota/i,
  /resource.*exhausted/i,
  /RESOURCE_EXHAUSTED/,
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
  if (!failedTargets.length) return { retryable: false, reason: 'no-terminal-targets', failedTargets: [] };
  if (permanent) return { retryable: false, reason: 'permanent-or-mixed-failure', failedTargets };
  if (!transient) return { retryable: false, reason: 'unclassified-failure', failedTargets };
  return { retryable: true, reason: 'transient-quota-or-rate-limit', failedTargets };
}

export function digestBoundedOutput(output) {
  const buf = Buffer.from(String(output ?? ''), 'utf8');
  return { bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
