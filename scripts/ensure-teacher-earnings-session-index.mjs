#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const REQUIRED_ROLE = 'roles/datastore.indexAdmin';
export const REQUIRED_CREATE_PERMISSION = 'datastore.indexes.create';

const database = '(default)';
const collectionGroup = 'classSessions';
const expectedFields = [
  { fieldPath: 'teacherId', order: 'ASCENDING' },
  { fieldPath: 'date', order: 'ASCENDING' },
];
const defaultPollIntervalMs = 10_000;
const defaultMaxWaitMs = 30 * 60_000;

export class GcloudCommandError extends Error {
  constructor(commandArgs, result) {
    const status = result.status ?? 'unknown';
    super(`gcloud ${commandArgs.join(' ')} failed with exit code ${status}`);
    this.name = 'GcloudCommandError';
    this.commandArgs = commandArgs;
    this.status = result.status;
    this.stdout = String(result.stdout || '');
    this.stderr = String(result.stderr || '');
  }
}

export const createGcloudRunner = () => (commandArgs, { capture = false } = {}) => {
  const result = spawnSync('gcloud', commandArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new GcloudCommandError(commandArgs, result);
  }

  if (!capture) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  return capture ? String(result.stdout || '') : '';
};

const errorOutput = (error) =>
  `${String(error?.message || '')}\n${String(error?.stdout || '')}\n${String(error?.stderr || '')}`;

export const isPermissionDenied = (error) =>
  /PERMISSION_DENIED|permission denied|does not have permission|HTTP[^\n]*403/i.test(errorOutput(error));

export const isAlreadyExists = (error) =>
  /ALREADY_EXISTS|already exists|HTTP[^\n]*409/i.test(errorOutput(error));

const withIamGuidance = (error, action) => {
  if (!isPermissionDenied(error)) throw error;
  throw new Error(
    `Permission denied while trying to ${action}. ` +
      `Grant ${REQUIRED_ROLE} on the project to the GitHub Actions service account. ` +
      `The required index-creation permission is ${REQUIRED_CREATE_PERMISSION}.`,
    { cause: error },
  );
};

const collectionGroupOf = (index) => {
  const explicit = String(index?.collectionGroup || '').trim();
  if (explicit) return explicit;
  const name = String(index?.name || '');
  const match = name.match(/\/collectionGroups\/([^/]+)\/indexes\//);
  return match?.[1] || '';
};

const indexedFieldsOf = (index) =>
  (Array.isArray(index?.fields) ? index.fields : [])
    .filter((field) => String(field?.fieldPath || '').trim() !== '__name__')
    .map((field) => ({
      fieldPath: String(field?.fieldPath || '').trim(),
      order: String(field?.order || '').toUpperCase(),
    }));

export const isRequiredIndex = (index) => {
  if (collectionGroupOf(index) !== collectionGroup) return false;
  const queryScope = String(index?.queryScope || 'COLLECTION').toUpperCase();
  if (queryScope !== 'COLLECTION') return false;
  const fields = indexedFieldsOf(index);
  return (
    fields.length === expectedFields.length &&
    expectedFields.every(
      (expected, position) =>
        fields[position]?.fieldPath === expected.fieldPath &&
        fields[position]?.order === expected.order,
    )
  );
};

const stateOf = (index) => String(index?.state || '').toUpperCase();
const displayNameOf = (index) =>
  String(index?.name || `${collectionGroup}(teacherId ASC, date ASC)`);

export const ensureRequiredIndex = async ({
  project,
  runGcloud = createGcloudRunner(),
  pollIntervalMs = defaultPollIntervalMs,
  maxWaitMs = defaultMaxWaitMs,
  sleep = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs)),
  now = () => Date.now(),
  log = console.log,
}) => {
  const listIndexes = () => {
    let raw;
    try {
      raw = runGcloud(
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
    } catch (error) {
      withIamGuidance(error, 'list Firestore composite indexes');
    }

    if (!String(raw || '').trim()) {
      throw new Error('gcloud returned an empty response while listing Firestore composite indexes.');
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error('gcloud returned malformed JSON while listing Firestore composite indexes.', {
        cause: error,
      });
    }

    if (!Array.isArray(parsed)) {
      throw new Error(
        'gcloud returned an unexpected non-array response while listing Firestore composite indexes.',
      );
    }
    return parsed;
  };

  const findRequiredIndex = () => listIndexes().find(isRequiredIndex) || null;
  const initial = findRequiredIndex();

  if (initial && stateOf(initial) === 'READY') {
    log(`Firestore index ready: ${displayNameOf(initial)}`);
    return { created: false, index: initial };
  }

  let created = false;
  if (!initial) {
    log(`Creating required Firestore index ${collectionGroup}(teacherId ASC, date ASC)...`);
    try {
      runGcloud([
        'firestore',
        'indexes',
        'composite',
        'create',
        `--project=${project}`,
        `--database=${database}`,
        `--collection-group=${collectionGroup}`,
        '--query-scope=collection',
        '--field-config=field-path=teacherId,order=ascending',
        '--field-config=field-path=date,order=ascending',
        '--quiet',
      ]);
      created = true;
    } catch (error) {
      if (isAlreadyExists(error)) {
        log('The required index was created concurrently; waiting for the existing build.');
      } else {
        withIamGuidance(error, 'create the required Firestore composite index');
      }
    }
  } else {
    log(
      `Required Firestore index already exists (${stateOf(initial) || 'state unknown'}): ${displayNameOf(initial)}`,
    );
  }

  const deadline = now() + maxWaitMs;
  let current = initial;
  while (true) {
    if (current) {
      const state = stateOf(current);
      if (state === 'READY') {
        log(`Firestore index ready: ${displayNameOf(current)}`);
        return { created, index: current };
      }
      if (state === 'NEEDS_REPAIR') {
        throw new Error(`Firestore index needs repair: ${displayNameOf(current)}`);
      }
      log(
        `Waiting for Firestore index ${collectionGroup}(teacherId ASC, date ASC): ${state || 'BUILDING'}...`,
      );
    } else {
      log(`Waiting for Firestore index ${collectionGroup}(teacherId ASC, date ASC) to appear...`);
    }

    if (now() >= deadline) break;
    await sleep(pollIntervalMs);
    current = findRequiredIndex();
  }

  throw new Error(
    `Timed out waiting for Firestore index ${collectionGroup}(teacherId ASC, date ASC) to become READY`,
  );
};

const parseProject = (args) => {
  const projectFlagIndex = args.indexOf('--project');
  return projectFlagIndex >= 0 ? String(args[projectFlagIndex + 1] || '').trim() : '';
};

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) {
  const project = parseProject(process.argv.slice(2));
  if (!project) {
    console.error('Usage: node scripts/ensure-teacher-earnings-session-index.mjs --project <project-id>');
    process.exitCode = 64;
  } else {
    try {
      await ensureRequiredIndex({ project });
    } catch (error) {
      console.error(`::error::${String(error?.message || error)}`);
      process.exitCode = 1;
    }
  }
}
