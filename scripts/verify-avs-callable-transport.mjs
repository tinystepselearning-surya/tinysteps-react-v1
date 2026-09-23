#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AVS_BROWSER_CALLABLES,
  AVS_CALLABLE_REGION,
} from './avs-callable-contract.mjs';
import {
  verifyCallablePreflight,
} from './verify-school-callable-transport.mjs';

const DEFAULT_ORIGIN = 'https://tinystepslearning.com';
const DEFAULT_ATTEMPTS = 6;
const DEFAULT_RETRY_DELAY_MS = 5_000;

export async function verifyAvsCallableTransport(options) {
  const functionNames = options.functionNames || AVS_BROWSER_CALLABLES;
  const results = await Promise.all(
    functionNames.map((functionName) => verifyCallablePreflight({
      ...options,
      region: options.region || AVS_CALLABLE_REGION,
      functionName,
    })),
  );
  return {
    passed: results.every((result) => result.passed),
    results,
  };
}

export function renderAvsMarkdownReport({ project, region, origin, results }) {
  const lines = [
    '# AVS callable transport verification',
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
    region: AVS_CALLABLE_REGION,
    origin: DEFAULT_ORIGIN,
    report: 'artifacts/avs-callable-transport-verification.md',
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
  const verification = await verifyAvsCallableTransport(options);
  const report = renderAvsMarkdownReport({
    ...options,
    results: verification.results,
  });
  await fs.mkdir(path.dirname(options.report), { recursive: true });
  await fs.writeFile(options.report, report, 'utf8');
  process.stdout.write(report);

  if (!verification.passed) {
    console.error(
      'AVS callable transport verification failed:',
      verification.results
        .filter((result) => !result.passed)
        .map((result) =>
          `${result.functionName} (${result.status || 'network error'}, attempt ${result.attempt})`,
        ),
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runCli();
}
