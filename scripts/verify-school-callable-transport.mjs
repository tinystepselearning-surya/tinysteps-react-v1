#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SCHOOL_BROWSER_CALLABLES,
  SCHOOL_CALLABLE_REGION,
} from './school-callable-contract.mjs';

const DEFAULT_ORIGIN = 'https://tinystepslearning.com';
const DEFAULT_ATTEMPTS = 6;
const DEFAULT_RETRY_DELAY_MS = 5_000;

function headerValue(headers, name) {
  return headers?.get?.(name) || '';
}

export function validatePreflightResponse(response, origin) {
  const status = Number(response?.status || 0);
  const allowOrigin = headerValue(response?.headers, 'access-control-allow-origin');
  const allowMethods = headerValue(response?.headers, 'access-control-allow-methods');
  const statusOk = status === 200 || status === 204;
  const originOk = allowOrigin === '*' || allowOrigin === origin;
  const postOk = !allowMethods || allowMethods
    .split(',')
    .some((method) => method.trim().toUpperCase() === 'POST');

  const reasons = [];
  if (!statusOk) reasons.push(`unexpected status ${status}`);
  if (!allowOrigin) reasons.push('missing Access-Control-Allow-Origin');
  else if (!originOk) reasons.push(`origin not allowed: ${allowOrigin}`);
  if (!postOk) reasons.push(`POST not allowed: ${allowMethods}`);

  return {
    passed: statusOk && originOk && postOk,
    status,
    allowOrigin,
    allowMethods,
    reasons,
  };
}

export function callableUrl({ project, region, functionName }) {
  return `https://${region}-${project}.cloudfunctions.net/${functionName}`;
}

export async function verifyCallablePreflight({
  functionName,
  project,
  region = SCHOOL_CALLABLE_REGION,
  origin = DEFAULT_ORIGIN,
  attempts = DEFAULT_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  fetchImpl = fetch,
  sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
}) {
  const url = callableUrl({ project, region, functionName });
  let lastResult;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: 'OPTIONS',
        redirect: 'manual',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization',
        },
      });
      const validation = validatePreflightResponse(response, origin);
      lastResult = { functionName, url, attempt, ...validation };
    } catch (error) {
      lastResult = {
        functionName,
        url,
        attempt,
        passed: false,
        status: 0,
        allowOrigin: '',
        allowMethods: '',
        reasons: [`request failed: ${error instanceof Error ? error.message : String(error)}`],
      };
    }

    if (lastResult.passed) return lastResult;
    if (attempt < attempts) await sleep(retryDelayMs);
  }

  return lastResult;
}

export async function verifySchoolCallableTransport(options) {
  const functionNames = options.functionNames || SCHOOL_BROWSER_CALLABLES;
  const results = await Promise.all(
    functionNames.map((functionName) => verifyCallablePreflight({
      ...options,
      functionName,
    })),
  );
  return {
    passed: results.every((result) => result.passed),
    results,
  };
}

export function renderMarkdownReport({ project, region, origin, results }) {
  const lines = [
    '# School callable transport verification',
    '',
    `- Project: \`${project}\``,
    `- Region: \`${region}\``,
    `- Origin: \`${origin}\``,
    '',
    '| Function | URL | OPTIONS status | Access-Control-Allow-Origin | Attempts | Result |',
    '| --- | --- | ---: | --- | ---: | --- |',
  ];

  for (const result of results) {
    const detail = result.passed ? 'PASS' : `FAIL: ${result.reasons.join('; ')}`;
    lines.push(`| ${result.functionName} | ${result.url} | ${result.status || 'network error'} | ${result.allowOrigin || 'missing'} | ${result.attempt} | ${detail} |`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

export function parseArgs(argv) {
  const parsed = {
    project: '',
    region: SCHOOL_CALLABLE_REGION,
    origin: DEFAULT_ORIGIN,
    report: 'artifacts/school-callable-transport-verification.md',
    attempts: DEFAULT_ATTEMPTS,
    retryDelayMs: DEFAULT_RETRY_DELAY_MS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith('--') || value === undefined) continue;
    index += 1;
    if (key === '--project') parsed.project = value;
    else if (key === '--region') parsed.region = value;
    else if (key === '--origin') parsed.origin = value;
    else if (key === '--report') parsed.report = value;
    else if (key === '--attempts') parsed.attempts = Number(value);
    else if (key === '--retry-delay-ms') parsed.retryDelayMs = Number(value);
  }

  if (!parsed.project) throw new Error('--project is required');
  if (!Number.isInteger(parsed.attempts) || parsed.attempts < 1 || parsed.attempts > 10) {
    throw new Error('--attempts must be an integer from 1 to 10');
  }
  if (!Number.isFinite(parsed.retryDelayMs) || parsed.retryDelayMs < 0 || parsed.retryDelayMs > 60_000) {
    throw new Error('--retry-delay-ms must be from 0 to 60000');
  }
  return parsed;
}

async function runCli() {
  const options = parseArgs(process.argv.slice(2));
  const verification = await verifySchoolCallableTransport(options);
  const report = renderMarkdownReport({ ...options, results: verification.results });
  await fs.mkdir(path.dirname(options.report), { recursive: true });
  await fs.writeFile(options.report, report, 'utf8');
  process.stdout.write(report);

  if (!verification.passed) {
    console.error('School callable transport verification failed:', verification.results
      .filter((result) => !result.passed)
      .map((result) => `${result.functionName} (${result.status || 'network error'}, attempt ${result.attempt})`));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runCli();
}
