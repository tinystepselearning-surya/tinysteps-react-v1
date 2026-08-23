#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const projectFlagIndex = args.indexOf('--project');
const project =
  projectFlagIndex >= 0 ? String(args[projectFlagIndex + 1] || '').trim() : '';

if (!project) {
  console.error('Usage: node scripts/ensure-parent-month-attendance-index.mjs --project <project-id>');
  process.exit(64);
}

const database = '(default)';
const collectionGroup = 'classSessions';
const expectedFields = ['parentId', 'date'];
const pollIntervalMs = 10_000;
const maxWaitMs = 30 * 60_000;

const runGcloud = (commandArgs, { capture = false } = {}) => {
  const result = spawnSync('gcloud', commandArgs, {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

  if (result.status !== 0) {
    if (capture) {
      if (result.stdout) process.stderr.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    throw new Error(`gcloud ${commandArgs.join(' ')} failed with exit code ${result.status}`);
  }
  return capture ? String(result.stdout || '') : '';
};

const listIndexes = () => {
  const raw = runGcloud(
    [
      'firestore',
      'indexes',
      'composite',
      'list',
      `--project=${project}`,
      `--database=${database}`,
      '--format=json',
    ],
    { capture: true },
  );
  const parsed = JSON.parse(raw || '[]');
  return Array.isArray(parsed) ? parsed : [];
};

const collectionGroupOf = (index) => {
  const explicit = String(index?.collectionGroup || '').trim();
  if (explicit) return explicit;
  const name = String(index?.name || '');
  const match = name.match(/\/collectionGroups\/([^/]+)\/indexes\//);
  return match?.[1] || '';
};

const fieldPathsOf = (index) =>
  (Array.isArray(index?.fields) ? index.fields : [])
    .map((field) => String(field?.fieldPath || '').trim())
    .filter((fieldPath) => fieldPath && fieldPath !== '__name__');

const isRequiredIndex = (index) => {
  if (collectionGroupOf(index) !== collectionGroup) return false;
  const queryScope = String(index?.queryScope || 'COLLECTION').toUpperCase();
  if (queryScope !== 'COLLECTION') return false;
  const fieldPaths = fieldPathsOf(index);
  return (
    fieldPaths.length === expectedFields.length &&
    expectedFields.every((fieldPath, position) => fieldPaths[position] === fieldPath)
  );
};

const findRequiredIndex = () => listIndexes().find(isRequiredIndex) || null;
const stateOf = (index) => String(index?.state || '').toUpperCase();

const waitForReady = async () => {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const index = findRequiredIndex();
    if (index) {
      const state = stateOf(index);
      if (state === 'READY') {
        console.log(`Firestore index ready: ${String(index.name || `${collectionGroup}(parentId,date)`)}`);
        return;
      }
      if (state === 'NEEDS_REPAIR') {
        throw new Error(`Firestore index needs repair: ${String(index.name || collectionGroup)}`);
      }
      console.log(`Waiting for Firestore index ${collectionGroup}(parentId,date): ${state || 'BUILDING'}...`);
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`Timed out waiting for Firestore index ${collectionGroup}(parentId,date) to become READY`);
};

const existing = findRequiredIndex();
if (!existing) {
  console.log(`Creating required Firestore index ${collectionGroup}(parentId ASC, date ASC)...`);
  runGcloud([
    'firestore',
    'indexes',
    'composite',
    'create',
    `--project=${project}`,
    `--database=${database}`,
    `--collection-group=${collectionGroup}`,
    '--query-scope=collection',
    '--field-config=field-path=parentId,order=ascending',
    '--field-config=field-path=date,order=ascending',
    '--quiet',
  ]);
} else {
  console.log(
    `Required Firestore index already exists (${stateOf(existing) || 'state unknown'}): ${String(existing.name || collectionGroup)}`,
  );
}

await waitForReady();
