import fs from 'node:fs';
import path from 'node:path';
import { compareAvsSoakReports } from './avs-production-soak-compare-core.mjs';

const MAX_INPUT_BYTES = 2 * 1024 * 1024;

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || '').trim() : '';
}

function readReport(filePath, label) {
  if (!filePath) {
    throw Object.assign(
      new Error(`--${label} is required.`),
      { code: 'avs-soak-compare-missing-input' },
    );
  }
  const resolved = path.resolve(process.cwd(), filePath);
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) {
    throw Object.assign(
      new Error(`${label} must point to a file.`),
      { code: 'avs-soak-compare-input-not-file' },
    );
  }
  if (stat.size > MAX_INPUT_BYTES) {
    throw Object.assign(
      new Error(`${label} exceeds the 2 MiB input cap.`),
      { code: 'avs-soak-compare-input-too-large' },
    );
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

function run() {
  const before = readReport(readArg('--before'), 'before');
  const after = readReport(readArg('--after'), 'after');
  const comparison = compareAvsSoakReports(before, after);

  console.log(JSON.stringify(comparison, null, 2));

  const jsonOut = readArg('--json-out');
  if (jsonOut) {
    const resolved = path.resolve(process.cwd(), jsonOut);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(
      resolved,
      `${JSON.stringify(comparison, null, 2)}\n`,
      'utf8',
    );
  }

  if (
    process.argv.includes('--require-ready')
    && !comparison.exitGate.readyForManualExitReview
  ) {
    process.exitCode = 2;
  }
}

try {
  run();
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    errorName: error instanceof Error ? error.name : 'unknown',
    errorCode:
      error && typeof error === 'object' && 'code' in error
        ? String(error.code || 'unknown')
        : 'unknown',
  }));
  process.exitCode = 1;
}
