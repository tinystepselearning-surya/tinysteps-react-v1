#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import {
  REQUIRED_CREATE_PERMISSION,
  REQUIRED_ROLE,
  createGcloudRunner,
  isAlreadyExists,
  isPermissionDenied,
} from './ensure-parent-month-attendance-index.mjs';

const database = '(default)';
const collectionGroup = 'classSessions';
const expectedFields = [
  { fieldPath: 'kidId', order: 'ASCENDING' },
  { fieldPath: 'parentId', order: 'ASCENDING' },
  { fieldPath: 'date', order: 'ASCENDING' },
];
const defaultPollIntervalMs = 10_000;
const defaultMaxWaitMs = 30 * 60_000;

const errorOutput = (error) =>
  `${String(error?.message || '')}\n${String(error?.stdout || '')}\n${String(error?.stderr || '')}`;

const withIamGuidance = (error, action) => {
  if (!isPermissionDenied(error)) throw error;
  throw new Error(
    `Permission denied while trying to ${action}. ` +
      `Grant ${REQUIRED_ROLE} on the project to the GitHub Actions service account. ` +
      `The required index-creation permission is ${REQUIRED_CREATE_PERMISSION}; ` +
      'run scripts/grant-parent-month-attendance-index-iam.sh once with an authorized operator account.',
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

export const isRequiredQueryBIndex = (index) => {
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
  String(index?.name || `${collectionGroup}(kidId ASC, parentId ASC, date ASC)`);

export const ensureParentDashboardQueryBIndex = async ({
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

  const findRequiredIndex = () => listIndexes().find(isRequiredQueryBIndex) || null;
  const initial = findRequiredIndex();

  if (initial && stateOf(initial) === 'READY') {
    log(`Firestore ParentDashboard Query B index ready: ${displayNameOf(initial)}`);
    return { created: false, index: initial };
  }

  let created = false;
  if (!initial) {
    log('Creating required Firestore ParentDashboard Query B index classSessions(kidId ASC, parentId ASC, date ASC)...');
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
        '--field-config=field-path=kidId,order=ascending',
        '--field-config=field-path=parentId,order=ascending',
        '--field-config=field-path=date,order=ascending',
        '--quiet',
      ]);
      created = true;
    } catch (error) {
      if (isAlreadyExists(error)) {
        log('The required Query B index was created concurrently; waiting for the existing build.');
      } else {
        withIamGuidance(error, 'create the required ParentDashboard Query B Firestore composite index');
      }
    }
  } else {
    log(
      `Required Query B index already exists (${stateOf(initial) || 'state unknown'}): ${displayNameOf(initial)}`,
    );
  }

  const deadline = now() + maxWaitMs;
  let current = initial;
  while (true) {
    if (current) {
      const state = stateOf(current);
      if (state === 'READY') {
        log(`Firestore ParentDashboard Query B index ready: ${displayNameOf(current)}`);
        return { created, index: current };
      }
      if (state === 'NEEDS_REPAIR') {
        throw new Error(`Firestore ParentDashboard Query B index needs repair: ${displayNameOf(current)}`);
      }
      log(`Waiting for ParentDashboard Query B index: ${state || 'BUILDING'}...`);
    } else {
      log('Waiting for ParentDashboard Query B index to appear...');
    }

    if (now() >= deadline) break;
    await sleep(pollIntervalMs);
    current = findRequiredIndex();
  }

  throw new Error(
    'Timed out waiting for Firestore ParentDashboard Query B index classSessions(kidId ASC, parentId ASC, date ASC) to become READY',
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
    console.error('Usage: node scripts/ensure-parent-dashboard-query-b-index.mjs --project <project-id>');
    process.exitCode = 64;
  } else {
    try {
      await ensureParentDashboardQueryBIndex({ project });
    } catch (error) {
      console.error(`::error::${String(error?.message || error)}\n${errorOutput(error)}`);
      process.exitCode = 1;
    }
  }
}
