#!/usr/bin/env node
import { appendFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolveFunctionsImpact } from './deployment/functions-impact-lib.mjs';
import { SCHOOL_BROWSER_CALLABLES } from './school-callable-contract.mjs';
import { AVS_BROWSER_CALLABLES } from './avs-callable-contract.mjs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1]);
const before = args.get('--before');
const sha = args.get('--sha');
if (!/^[a-f0-9]{40}$/.test(before || '') || /^0{40}$/.test(before || '')) throw new Error('A non-zero 40-character --before SHA is required');
if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('A 40-character --sha is required');
execFileSync('git', ['merge-base', '--is-ancestor', before, sha], { stdio: 'ignore' });

function gitText(parameters) {
  return execFileSync('git', parameters, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

function changedPaths() {
  const fields = gitText(['diff', '--name-status', '-z', '--find-renames', before, sha]).split('\0').filter(Boolean);
  const paths = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (/^[RC]/.test(status)) paths.push(fields[index++], fields[index++]);
    else paths.push(fields[index++]);
  }
  return [...new Set(paths)];
}

function sourceSnapshot(revision) {
  const names = gitText(['ls-tree', '-r', '-z', '--name-only', revision, '--', 'functions/src'])
    .split('\0').filter(file => /\.[cm]?[jt]sx?$/.test(file));
  return new Map(names.map(file => [file, gitText(['show', `${revision}:${file}`])]));
}

function firebaseAt(revision) {
  return JSON.parse(gitText(['show', `${revision}:firebase.json`]));
}

const changedFiles = changedPaths();
const result = resolveFunctionsImpact({
  changedFiles,
  beforeSources: sourceSnapshot(before),
  afterSources: sourceSnapshot(sha),
  beforeFirebase: firebaseAt(before),
  afterFirebase: firebaseAt(sha),
});
const targetsCsv = result.impactedFunctions.join(',');
const schoolCallables = new Set(SCHOOL_BROWSER_CALLABLES);
const avsCallables = new Set(AVS_BROWSER_CALLABLES);
const output = {
  functions_source_changed: String(result.functionsSourceChanged),
  functions_validation_required: String(result.functionsValidationRequired),
  functions_deployment_required: String(result.functionsDeploymentRequired),
  functions_full_deployment: String(result.fullDeployment),
  functions_targets: targetsCsv,
  functions_retired_targets: (result.retiredFunctions || []).join(','),
  hosting_changed: String(result.hostingChanged),
  frontend_validation_required: String(result.frontendValidationRequired),
  firestore_rules_changed: String(result.firestoreRulesChanged),
  firestore_validation_required: String(result.firestoreValidationRequired),
  school_transport_required: String(result.fullDeployment || result.impactedFunctions.some(id => schoolCallables.has(id))),
  avs_transport_required: String(result.fullDeployment || result.impactedFunctions.some(id => avsCallables.has(id))),
  lead_iam_required: String(result.fullDeployment || result.impactedFunctions.includes('enrichPublicLeadAttribution')),
};
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, Object.entries(output).map(([key, value]) => `${key}=${value}`).join('\n') + '\n');
}

const lines = [
  '## Artifact impact analysis', '',
  `- Functions source changed: ${result.functionsSourceChanged}`,
  `- Functions validation required: ${result.functionsValidationRequired}`,
  `- Functions deployment required: ${result.functionsDeploymentRequired}`,
  `- Functions full deployment: ${result.fullDeployment}`,
  `- Functions impacted: ${result.fullDeployment ? 'all (known global impact)' : result.impactedFunctions.length}`,
  `- Functions intentionally retired from source: ${(result.retiredFunctions || []).length}`,
  `- Hosting changed: ${result.hostingChanged}`,
  `- Firestore rules changed: ${result.firestoreRulesChanged}`,
  `- AVS callable transport verification required: ${result.fullDeployment || result.impactedFunctions.some(id => avsCallables.has(id))}`,
];
if (result.fullDeploymentReason) lines.push(`- Full deployment reason: ${result.fullDeploymentReason}`);
if ((result.retiredFunctions || []).length) {
  lines.push('', '### Intentionally retired Function exports', '');
  for (const id of result.retiredFunctions) lines.push(`- \`${id}\``);
}
if (result.impactedFunctions.length) {
  lines.push('', '### Function targets', '');
  for (const id of result.impactedFunctions) {
    lines.push(`- \`functions:${id}\``);
    for (const reason of result.reasons[id]) lines.push(`  - ${reason}`);
  }
}
lines.push('', '### Changed files', '', ...changedFiles.map(file => `- \`${file}\``), '');
const summary = `${lines.join('\n')}\n`;
process.stdout.write(summary);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
