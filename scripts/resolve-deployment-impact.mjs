#!/usr/bin/env node
import { appendFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { classifyArtifactChanges, resolveFunctionsImpact } from './deployment/functions-impact-lib.mjs';
import { SCHOOL_BROWSER_CALLABLES } from './school-callable-contract.mjs';
import { AVS_BROWSER_CALLABLES } from './avs-callable-contract.mjs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1]);
const before = args.get('--before');
const functionsBefore = args.get('--functions-before') || before;
const hostingBefore = args.get('--hosting-before') || before;
const firestoreRulesBefore = args.get('--firestore-rules-before') || before;
const firestoreIndexesBefore = args.get('--firestore-indexes-before') || before;
const forceFunctionsFull = args.get('--force-functions-full') === 'true';
const forceHosting = args.get('--force-hosting') === 'true';
const forceFirestoreRules = args.get('--force-firestore-rules') === 'true';
const forceFirestoreIndexes = args.get('--force-firestore-indexes') === 'true';
const sha = args.get('--sha');

function requireSha(value, label, { allowZero = false } = {}) {
  if (!/^[a-f0-9]{40}$/.test(value || '') || (!allowZero && /^0{40}$/.test(value || ''))) {
    throw new Error(`A ${allowZero ? '' : 'non-zero '}40-character ${label} SHA is required`);
  }
}

requireSha(before, '--before');
requireSha(functionsBefore, '--functions-before');
requireSha(hostingBefore, '--hosting-before');
requireSha(firestoreRulesBefore, '--firestore-rules-before');
requireSha(firestoreIndexesBefore, '--firestore-indexes-before');
requireSha(sha, '--sha', { allowZero: true });

for (const baseline of [before, functionsBefore, hostingBefore, firestoreRulesBefore, firestoreIndexesBefore]) {
  execFileSync('git', ['merge-base', '--is-ancestor', baseline, sha], { stdio: 'ignore' });
}

function gitText(parameters) {
  return execFileSync('git', parameters, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

function changedPaths(fromRevision, toRevision) {
  const fields = gitText(['diff', '--name-status', '-z', '--find-renames', fromRevision, toRevision]).split('\0').filter(Boolean);
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

const changedFiles = changedPaths(before, sha);
const functionsChangedFiles = changedPaths(functionsBefore, sha);
const hostingChangedFiles = changedPaths(hostingBefore, sha);
const firestoreRulesChangedFiles = changedPaths(firestoreRulesBefore, sha);
const firestoreIndexesChangedFiles = changedPaths(firestoreIndexesBefore, sha);
const currentFirebase = firebaseAt(sha);

const artifactResult = resolveFunctionsImpact({
  changedFiles,
  beforeSources: sourceSnapshot(before),
  afterSources: sourceSnapshot(sha),
  beforeFirebase: firebaseAt(before),
  afterFirebase: currentFirebase,
});
const functionsResult = resolveFunctionsImpact({
  changedFiles: functionsChangedFiles,
  beforeSources: sourceSnapshot(functionsBefore),
  afterSources: sourceSnapshot(sha),
  beforeFirebase: firebaseAt(functionsBefore),
  afterFirebase: currentFirebase,
});
const hostingResult = classifyArtifactChanges(
  hostingChangedFiles,
  firebaseAt(hostingBefore),
  currentFirebase,
);
const firestoreRulesResult = classifyArtifactChanges(
  firestoreRulesChangedFiles,
  firebaseAt(firestoreRulesBefore),
  currentFirebase,
);
const firestoreIndexesResult = classifyArtifactChanges(
  firestoreIndexesChangedFiles,
  firebaseAt(firestoreIndexesBefore),
  currentFirebase,
);

const result = {
  ...artifactResult,
  functionsSourceChanged: functionsResult.functionsSourceChanged,
  functionsValidationRequired:
    artifactResult.functionsValidationRequired
    || functionsResult.functionsValidationRequired
    || forceFunctionsFull,
  frontendValidationRequired:
    artifactResult.frontendValidationRequired
    || hostingResult.frontendValidationRequired
    || forceHosting,
  firestoreValidationRequired:
    artifactResult.firestoreValidationRequired
    || firestoreRulesResult.firestoreValidationRequired
    || firestoreIndexesResult.firestoreValidationRequired
    || forceFirestoreRules
    || forceFirestoreIndexes,
  hostingChanged: hostingResult.hostingChanged || forceHosting,
  firestoreRulesChanged: firestoreRulesResult.firestoreRulesChanged || forceFirestoreRules,
  firestoreIndexesChanged: firestoreIndexesResult.firestoreIndexesChanged || forceFirestoreIndexes,
  functionsDeploymentRequired:
    functionsResult.functionsDeploymentRequired || forceFunctionsFull,
  fullDeployment: functionsResult.fullDeployment || forceFunctionsFull,
  fullDeploymentReason: forceFunctionsFull
    ? 'production-functions-baseline-missing-or-invalid'
    : functionsResult.fullDeploymentReason,
  impactedFunctions: forceFunctionsFull ? [] : functionsResult.impactedFunctions,
  retiredFunctions: forceFunctionsFull ? [] : functionsResult.retiredFunctions,
  reasons: forceFunctionsFull ? {} : functionsResult.reasons,
};
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
  content_only_validation: String(result.contentOnlyValidation),
  firestore_rules_changed: String(result.firestoreRulesChanged),
  firestore_indexes_changed: String(result.firestoreIndexesChanged),
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
  `- Functions production baseline: ${functionsBefore}`,
  `- Functions baseline differs from event parent: ${functionsBefore !== before}`,
  `- Functions force-full recovery: ${forceFunctionsFull}`,
  `- Hosting production baseline: ${hostingBefore}`,
  `- Hosting baseline differs from event parent: ${hostingBefore !== before}`,
  `- Hosting forced recovery: ${forceHosting}`,
  `- Firestore rules production baseline: ${firestoreRulesBefore}`,
  `- Firestore rules baseline differs from event parent: ${firestoreRulesBefore !== before}`,
  `- Firestore rules forced recovery: ${forceFirestoreRules}`,
  `- Firestore indexes production baseline: ${firestoreIndexesBefore}`,
  `- Firestore indexes baseline differs from event parent: ${firestoreIndexesBefore !== before}`,
  `- Firestore indexes forced recovery: ${forceFirestoreIndexes}`,
  `- Functions source changed: ${result.functionsSourceChanged}`,
  `- Functions validation required: ${result.functionsValidationRequired}`,
  `- Functions deployment required: ${result.functionsDeploymentRequired}`,
  `- Functions full deployment: ${result.fullDeployment}`,
  `- Functions impacted: ${result.fullDeployment ? 'all (known global impact)' : result.impactedFunctions.length}`,
  `- Functions intentionally retired from source: ${(result.retiredFunctions || []).length}`,
  `- Hosting changed: ${result.hostingChanged}`,
  `- Content-only validation: ${result.contentOnlyValidation}`,
  `- Firestore rules changed: ${result.firestoreRulesChanged}`,
  `- Firestore indexes changed: ${result.firestoreIndexesChanged}`,
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
lines.push('', '### Event changed files', '', ...changedFiles.map(file => `- \`${file}\``), '');
if (functionsBefore !== before || forceFunctionsFull) {
  lines.push('', '### Functions-baseline changed files', '', ...functionsChangedFiles.map(file => `- \`${file}\``), '');
}
if (hostingBefore !== before || forceHosting) {
  lines.push('', '### Hosting-baseline changed files', '', ...hostingChangedFiles.map(file => `- \`${file}\``), '');
}
if (firestoreRulesBefore !== before || forceFirestoreRules) {
  lines.push('', '### Firestore-rules-baseline changed files', '', ...firestoreRulesChangedFiles.map(file => `- \`${file}\``), '');
}
if (firestoreIndexesBefore !== before || forceFirestoreIndexes) {
  lines.push('', '### Firestore-indexes-baseline changed files', '', ...firestoreIndexesChangedFiles.map(file => `- \`${file}\``), '');
}
const summary = `${lines.join('\n')}\n`;
process.stdout.write(summary);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
