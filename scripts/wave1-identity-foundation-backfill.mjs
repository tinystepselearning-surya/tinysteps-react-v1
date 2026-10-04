#!/usr/bin/env node

import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import {
  MAX_RECORDS_PER_RUN,
  MAX_WRITES_PER_BATCH,
  MIGRATION_ID,
  SOURCE_COLLECTION_ORDER,
  TARGET_COLLECTIONS,
  advanceCheckpoint,
  buildExpectedCanonicalData,
  classifyTarget,
  initialCheckpoint,
  partitionRecordsByWrites,
  token,
  validateCheckpoint,
} from './migrations/wave1-identity-backfill-lib.mjs';

const require = createRequire(import.meta.url);
const planner = require('../functions/lib/schoolOS/identity/legacyPlanner.js');

const EXPECTED_PROJECT_ID = 'tinysteps-react-v1';
const DEFAULT_CHECKPOINT_PATH =
  'reports/wave1-identity-backfill-checkpoint.json';

const SOURCE_FIELDS = {
  users: [
    'uid',
    'userId',
    'role',
    'roles',
    'status',
    'displayName',
    'name',
    'firstName',
    'lastName',
    'countryCode',
    'schemaVersion',
  ],
  kids: [
    'parentId',
    'parentIds',
    'primaryParentId',
    'status',
    'fullName',
    'name',
    'displayName',
    'studentName',
    'firstName',
    'lastName',
    'age',
    'ageYears',
    'countryCode',
    'schemaVersion',
  ],
  schools: [
    'status',
    'name',
    'countryCode',
    'schoolCode',
    'schemaVersion',
  ],
  schoolUsers: [
    'userId',
    'role',
    'schoolIds',
    'primarySchoolId',
    'status',
    'schemaVersion',
  ],
};

function parseArgs(argv) {
  const modes = argv.filter((arg) =>
    ['--dry-run', '--write', '--reconcile'].includes(arg));
  if (modes.length !== 1) {
    throw new Error(
      'Choose exactly one mode: --dry-run, --write, or --reconcile',
    );
  }

  const value = (name) => {
    const index = argv.indexOf(name);
    if (index === -1) return null;
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(`${name} requires a value`);
    }
    return next;
  };

  const limitRaw = value('--limit');
  const limit = limitRaw === null ? null : Number(limitRaw);
  if (
    limit !== null &&
    (!Number.isInteger(limit) || limit < 1 || limit > MAX_RECORDS_PER_RUN)
  ) {
    throw new Error(
      `--limit must be an integer between 1 and ${MAX_RECORDS_PER_RUN}`,
    );
  }

  if (modes[0] === '--write' && limit === null) {
    throw new Error(
      `--write requires --limit N (maximum ${MAX_RECORDS_PER_RUN})`,
    );
  }

  return {
    mode: modes[0].slice(2),
    limit,
    projectId:
      value('--project') ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      EXPECTED_PROJECT_ID,
    confirmProject: value('--confirm-project'),
    checkpointPath:
      value('--checkpoint') ||
      process.env.WAVE1_IDENTITY_CHECKPOINT ||
      DEFAULT_CHECKPOINT_PATH,
    reportPath: value('--report'),
  };
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sourceRow(doc, collection) {
  return {
    collection,
    id: doc.id,
    path: doc.ref.path,
    data: doc.data() || {},
    plannedDocuments: [],
    expectedDocuments: [],
  };
}

async function readCollection(db, name, fields) {
  const snap = await db.collection(name).select(...fields).get();
  return snap.docs.map((doc) => sourceRow(doc, name));
}

async function readAuthDirectory(auth) {
  const users = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    users.push(...result.users.map((user) => ({
      uid: user.uid,
      disabled: Boolean(user.disabled),
      displayName: cleanText(user.displayName) || null,
    })));
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

function issueCollector() {
  const counts = {};
  const blockingCounts = {};
  const samples = {};

  return {
    add(code, sourcePath, fields = [], blocking = false) {
      counts[code] = (counts[code] || 0) + 1;
      if (blocking) {
        blockingCounts[code] = (blockingCounts[code] || 0) + 1;
      }
      if (!samples[code]) samples[code] = [];
      if (samples[code].length < 20) {
        samples[code].push({
          sourceToken: token(sourcePath),
          sourceKind: String(sourcePath || '').split('/')[0] || 'unknown',
          fields: [...new Set(fields)].sort(),
          blocksBackfill: Boolean(blocking),
        });
      }
    },
    result() {
      return {
        total: Object.values(counts).reduce((sum, value) => sum + value, 0),
        blockingTotal: Object.values(blockingCounts)
          .reduce((sum, value) => sum + value, 0),
        byCode: Object.fromEntries(
          Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
        ),
        blockingByCode: Object.fromEntries(
          Object.entries(blockingCounts)
            .sort(([a], [b]) => a.localeCompare(b)),
        ),
        samples: Object.fromEntries(
          Object.entries(samples).sort(([a], [b]) => a.localeCompare(b)),
        ),
      };
    },
  };
}

function compareIds(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sourcePath(collection, id) {
  return `${collection}/${id}`;
}

function addPlannerResult(record, result, issues) {
  record.plannedDocuments.push(...result.documents);
  for (const conflict of result.conflicts) {
    issues.add(
      conflict.code,
      conflict.sourcePath,
      conflict.fields,
      conflict.blocksBackfill,
    );
  }
}

function buildGlobalPlan(sourceState) {
  const issues = issueCollector();
  const records = SOURCE_COLLECTION_ORDER.flatMap((collection) =>
    sourceState[collection])
    .sort((a, b) => {
      const collectionDiff =
        SOURCE_COLLECTION_ORDER.indexOf(a.collection) -
        SOURCE_COLLECTION_ORDER.indexOf(b.collection);
      return collectionDiff || compareIds(a.id, b.id);
    });

  const recordsByPath = new Map(records.map((record) => [record.path, record]));
  const users = sourceState.users;
  const kids = sourceState.kids;
  const schools = sourceState.schools;
  const schoolUsers = sourceState.schoolUsers;
  const authUsers = sourceState.authUsers;

  const userIds = new Set(users.map((record) => record.id));
  const kidIds = new Set(kids.map((record) => record.id));
  const schoolIds = new Set(schools.map((record) => record.id));
  const authByUid = new Map(authUsers.map((user) => [user.uid, user]));

  for (const userId of userIds) {
    if (kidIds.has(userId)) {
      issues.add(
        'person_id_collision_user_and_kid',
        sourcePath('users', userId),
        ['documentId'],
        true,
      );
    }
  }

  for (const user of users) {
    const declaredUid = cleanText(user.data.uid);
    const declaredUserId = cleanText(user.data.userId);

    if (!authByUid.has(user.id)) {
      issues.add(
        'user_missing_auth_directory_identity',
        user.path,
        ['documentId', 'uid'],
        true,
      );
    }
    if (declaredUid && declaredUid !== user.id) {
      issues.add(
        'user_declared_uid_mismatch',
        user.path,
        ['uid'],
        true,
      );
    }
    if (declaredUserId && declaredUserId !== user.id) {
      issues.add(
        'user_declared_user_id_mismatch',
        user.path,
        ['userId'],
        true,
      );
    }

    addPlannerResult(
      user,
      planner.planLegacyUserExpansion({
        documentId: user.id,
        uid: authByUid.has(user.id) ? user.id : declaredUid || null,
        userId: declaredUserId || null,
        role: user.data.role ?? null,
        roles: user.data.roles,
        status: user.data.status ?? null,
      }),
      issues,
    );
  }

  for (const kid of kids) {
    addPlannerResult(
      kid,
      planner.planLegacyKidExpansion({
        documentId: kid.id,
        parentId: kid.data.parentId ?? null,
        parentIds: kid.data.parentIds,
        primaryParentId: kid.data.primaryParentId ?? null,
        status: kid.data.status ?? null,
      }),
      issues,
    );

    const parentRefs = [
      cleanText(kid.data.primaryParentId),
      cleanText(kid.data.parentId),
      ...(Array.isArray(kid.data.parentIds)
        ? kid.data.parentIds.map(cleanText)
        : []),
    ].filter(Boolean);

    for (const parentId of new Set(parentRefs)) {
      if (!userIds.has(parentId)) {
        issues.add(
          'guardian_reference_missing_person_source',
          kid.path,
          ['primaryParentId', 'parentId', 'parentIds'],
          true,
        );
      }
    }
  }

  for (const school of schools) {
    addPlannerResult(
      school,
      planner.planLegacySchoolExpansion({
        documentId: school.id,
        status: school.data.status ?? null,
      }),
      issues,
    );
  }

  for (const schoolUser of schoolUsers) {
    addPlannerResult(
      schoolUser,
      planner.planLegacySchoolUserExpansion({
        documentId: schoolUser.id,
        userId: schoolUser.data.userId ?? null,
        role: schoolUser.data.role ?? null,
        schoolIds: schoolUser.data.schoolIds,
        primarySchoolId: schoolUser.data.primarySchoolId ?? null,
        status: schoolUser.data.status ?? null,
      }),
      issues,
    );

    const personId = cleanText(schoolUser.data.userId) || schoolUser.id;
    if (!userIds.has(personId)) {
      issues.add(
        'organisation_membership_missing_person_source',
        schoolUser.path,
        ['userId'],
        true,
      );
    }

    const memberships = Array.isArray(schoolUser.data.schoolIds)
      ? schoolUser.data.schoolIds.map(cleanText).filter(Boolean)
      : [];
    for (const schoolId of memberships) {
      if (!schoolIds.has(schoolId)) {
        issues.add(
          'organisation_membership_missing_school_source',
          schoolUser.path,
          ['schoolIds'],
          true,
        );
      }
    }
  }

  const plannedTargetKeys = new Map();
  for (const record of records) {
    for (const plannedDocument of record.plannedDocuments) {
      const key =
        `${plannedDocument.collection}/${plannedDocument.documentId}`;
      const existing = plannedTargetKeys.get(key);
      if (existing && existing.path !== record.path) {
        issues.add(
          'planned_target_document_collision',
          record.path,
          ['documentId'],
          true,
        );
        continue;
      }
      plannedTargetKeys.set(key, record);
    }
  }

  for (const record of records) {
    const authUser =
      record.collection === 'users'
        ? authByUid.get(record.id) || null
        : null;

    for (const plannedDocument of record.plannedDocuments) {
      try {
        const expectedData = buildExpectedCanonicalData({
          plannedDocument,
          sourceCollection: record.collection,
          sourceId: record.id,
          sourceData: record.data,
          authUser,
        });
        record.expectedDocuments.push({
          key:
            `${plannedDocument.collection}/${plannedDocument.documentId}`,
          collection: plannedDocument.collection,
          documentId: plannedDocument.documentId,
          expectedData,
        });
      } catch {
        issues.add(
          'canonical_materialization_input_invalid',
          record.path,
          ['canonicalRequiredFields'],
          true,
        );
      }
    }
  }

  const expectedDocuments = records.flatMap((record) =>
    record.expectedDocuments.map((document) => ({
      ...document,
      sourceRecord: record,
    })));

  const expectedKeys = new Set(expectedDocuments.map((document) => document.key));
  const expectedCounts = Object.fromEntries(
    TARGET_COLLECTIONS.map((collection) => [
      collection,
      expectedDocuments.filter((document) =>
        document.collection === collection).length,
    ]),
  );

  return {
    records,
    recordsByPath,
    expectedDocuments,
    expectedKeys,
    expectedCounts,
    issues: issues.result(),
    sourceCounts: {
      users: users.length,
      firebaseAuthUsers: authUsers.length,
      kids: kids.length,
      schools: schools.length,
      schoolUsers: schoolUsers.length,
    },
    authOnlyAccountsExcluded: authUsers.filter((user) => !userIds.has(user.uid))
      .length,
  };
}

async function readSourceState(db, auth) {
  const [users, kids, schools, schoolUsers, authUsers] = await Promise.all([
    readCollection(db, 'users', SOURCE_FIELDS.users),
    readCollection(db, 'kids', SOURCE_FIELDS.kids),
    readCollection(db, 'schools', SOURCE_FIELDS.schools),
    readCollection(db, 'schoolUsers', SOURCE_FIELDS.schoolUsers),
    readAuthDirectory(auth),
  ]);

  return {
    users,
    kids,
    schools,
    schoolUsers,
    authUsers,
  };
}

async function getAllInChunks(db, refs, chunkSize = 100) {
  const snapshots = [];
  for (let index = 0; index < refs.length; index += chunkSize) {
    const chunk = refs.slice(index, index + chunkSize);
    if (chunk.length) {
      snapshots.push(...await db.getAll(...chunk));
    }
  }
  return snapshots;
}

async function classifyTargetState(db, plan) {
  const refs = plan.expectedDocuments.map((document) =>
    db.collection(document.collection).doc(document.documentId));
  const snapshots = await getAllInChunks(db, refs);

  const byKey = new Map();
  const stateCounts = {
    create: 0,
    update: 0,
    unchanged: 0,
    conflict: 0,
  };

  plan.expectedDocuments.forEach((document, index) => {
    const snap = snapshots[index];
    const existingData = snap?.exists ? snap.data() || {} : null;
    const classification = classifyTarget(
      existingData,
      document.expectedData,
    );
    stateCounts[classification] += 1;
    const state = {
      ...document,
      ref: refs[index],
      existingData,
      classification,
    };
    byKey.set(document.key, state);
  });

  const actualCounts = {};
  const extras = [];
  for (const collection of TARGET_COLLECTIONS) {
    const snap = await db
      .collection(collection)
      .select('schemaVersion', 'migration')
      .get();
    actualCounts[collection] = snap.size;
    for (const doc of snap.docs) {
      const key = `${collection}/${doc.id}`;
      if (!plan.expectedKeys.has(key)) {
        extras.push({
          collection,
          documentToken: token(key),
        });
      }
    }
  }

  return {
    byKey,
    stateCounts,
    actualCounts,
    extras,
  };
}

function countByCollection(records) {
  return Object.fromEntries(
    SOURCE_COLLECTION_ORDER.map((collection) => [
      collection,
      records.filter((record) => record.collection === collection).length,
    ]),
  );
}

async function loadCheckpoint(checkpointPath, projectId) {
  const absolute = path.resolve(process.cwd(), checkpointPath);
  try {
    const body = JSON.parse(await fs.readFile(absolute, 'utf8'));
    return validateCheckpoint(body, projectId);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return initialCheckpoint(projectId);
    }
    throw error;
  }
}

async function persistCheckpoint(checkpointPath, checkpoint) {
  const absolute = path.resolve(process.cwd(), checkpointPath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(
    absolute,
    `${JSON.stringify({
      ...checkpoint,
      updatedAt: new Date().toISOString(),
    }, null, 2)}\n`,
    'utf8',
  );
}

function checkpointCoversRecord(record, checkpoint) {
  if ((checkpoint.completedCollections || []).includes(record.collection)) {
    return true;
  }
  const cursor = checkpoint.cursors?.[record.collection];
  return Boolean(cursor && compareIds(record.id, cursor) <= 0);
}

function validateCheckpointAgainstSource(plan, targetState, checkpoint) {
  const issues = [];

  for (const collection of SOURCE_COLLECTION_ORDER) {
    const collectionRecords = plan.records
      .filter((record) => record.collection === collection)
      .sort((a, b) => compareIds(a.id, b.id));
    const cursor = checkpoint.cursors?.[collection];

    if (
      cursor &&
      !collectionRecords.some((record) => record.id === cursor)
    ) {
      issues.push({
        code: 'checkpoint_cursor_source_missing',
        collection,
      });
    }
  }

  for (const record of plan.records) {
    if (!checkpointCoversRecord(record, checkpoint)) continue;
    for (const document of record.expectedDocuments) {
      const state = targetState.byKey.get(document.key);
      if (!state || state.classification !== 'unchanged') {
        issues.push({
          code: 'checkpoint_target_divergence',
          collection: record.collection,
          sourceToken: token(record.path),
        });
        break;
      }
    }
  }

  return issues;
}

function selectRecords(plan, checkpoint, limit) {
  const selected = [];
  const completed = new Set(checkpoint.completedCollections || []);

  for (const collection of SOURCE_COLLECTION_ORDER) {
    if (selected.length >= limit) break;
    if (completed.has(collection)) continue;

    const collectionRecords = plan.records
      .filter((record) => record.collection === collection)
      .sort((a, b) => compareIds(a.id, b.id));
    const cursor = checkpoint.cursors?.[collection];

    for (let index = 0; index < collectionRecords.length; index += 1) {
      const record = collectionRecords[index];
      if (cursor && compareIds(record.id, cursor) <= 0) continue;
      selected.push({
        ...record,
        indexInCollection: index,
      });
      if (selected.length >= limit) break;
    }
  }

  return selected;
}

function prepareSelectedRecords(selectedRecords, targetState) {
  return selectedRecords.map((record) => {
    const actions = record.expectedDocuments.map((document) => {
      const state = targetState.byKey.get(document.key);
      return {
        ...state,
      };
    });
    return {
      ...record,
      actions,
      writeCount: actions.filter((action) =>
        action.classification === 'create' ||
        action.classification === 'update').length,
    };
  });
}

function reportPathFor(options) {
  if (options.reportPath) return options.reportPath;
  const suffix = new Date().toISOString().replace(/[:.]/g, '-');
  return `reports/wave1-identity-backfill-${options.mode}-${suffix}.json`;
}

async function persistReport(options, report) {
  const reportPath = reportPathFor(options);
  const absolute = path.resolve(process.cwd(), reportPath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(
    absolute,
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  return reportPath;
}

function baseReport(options, plan, targetState) {
  return {
    generatedAt: new Date().toISOString(),
    migrationId: MIGRATION_ID,
    mode: options.mode,
    projectId: options.projectId,
    source: process.env.FIRESTORE_EMULATOR_HOST
      ? 'firestore_emulator'
      : 'production',
    privacy: {
      rawIdsInReport: false,
      checkpointContainsRawCursorIds: true,
      checkpointPath: options.checkpointPath,
    },
    writesPerformed: 0,
    sourceCounts: plan.sourceCounts,
    sourceRecordsTotal:
      SOURCE_COLLECTION_ORDER.reduce(
        (sum, collection) => sum + plan.sourceCounts[collection],
        0,
      ),
    authOnlyAccountsExcluded: plan.authOnlyAccountsExcluded,
    expectedCanonicalDocuments: {
      total: plan.expectedDocuments.length,
      byCollection: plan.expectedCounts,
    },
    targetState: {
      expectedDocuments: targetState.stateCounts,
      actualCounts: targetState.actualCounts,
      unexpectedTargetDocuments: targetState.extras.length,
      unexpectedTargetSamples: targetState.extras.slice(0, 20),
    },
    issues: plan.issues,
    safety: {
      maxWritesPerBatch: MAX_WRITES_PER_BATCH,
      maxRecordsPerRun: MAX_RECORDS_PER_RUN,
      householdBackfillDeferred: true,
      legacyAuthorityUnchanged: true,
      firebaseAuthUnchanged: true,
      readSwitchPerformed: false,
    },
  };
}

function assertWriteAllowed(options, plan, targetState) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(
      '--write is reserved for the real production project; emulator writes are not part of this execution path',
    );
  }
  if (options.projectId !== EXPECTED_PROJECT_ID) {
    throw new Error(
      `Refusing write to project ${options.projectId}; expected ${EXPECTED_PROJECT_ID}`,
    );
  }
  if (options.confirmProject !== EXPECTED_PROJECT_ID) {
    throw new Error(
      `Write mode requires --confirm-project ${EXPECTED_PROJECT_ID}`,
    );
  }
  if (plan.issues.blockingTotal > 0) {
    throw new Error(
      `Backfill blocked by ${plan.issues.blockingTotal} source/planning issue(s)`,
    );
  }
  if (targetState.stateCounts.conflict > 0) {
    throw new Error(
      `Backfill blocked by ${targetState.stateCounts.conflict} canonical target conflict(s)`,
    );
  }
  if (targetState.extras.length > 0) {
    throw new Error(
      `Backfill blocked by ${targetState.extras.length} unexpected canonical target document(s)`,
    );
  }
}

async function runWrite({
  db,
  options,
  plan,
  targetState,
}) {
  assertWriteAllowed(options, plan, targetState);

  let checkpoint = await loadCheckpoint(
    options.checkpointPath,
    options.projectId,
  );
  const checkpointIssues = validateCheckpointAgainstSource(
    plan,
    targetState,
    checkpoint,
  );
  if (checkpointIssues.length) {
    throw new Error(
      `Checkpoint reconciliation failed (${checkpointIssues[0].code}); no writes performed`,
    );
  }

  const selected = selectRecords(plan, checkpoint, options.limit);
  const collectionTotals = countByCollection(plan.records);

  if (!selected.length) {
    const report = {
      ...baseReport(options, plan, targetState),
      writeRun: {
        requestedLimit: options.limit,
        selectedSourceRecords: 0,
        completed: checkpoint.completed,
        note: checkpoint.completed
          ? 'Backfill checkpoint is already complete.'
          : 'No source records remain after the current checkpoint.',
      },
    };
    const reportPath = await persistReport(options, report);
    console.log('\n=== Wave 1 Identity Backfill Write ===');
    console.log('No source records selected. No writes performed.');
    console.log(`Checkpoint complete: ${checkpoint.completed}`);
    console.log(`Report: ${reportPath}\n`);
    return;
  }

  const prepared = prepareSelectedRecords(selected, targetState);
  const selectedConflicts = prepared.flatMap((record) =>
    record.actions.filter((action) => action.classification === 'conflict'));
  if (selectedConflicts.length) {
    throw new Error(
      `Selected records contain ${selectedConflicts.length} target conflict(s); no writes performed`,
    );
  }

  const groups = partitionRecordsByWrites(
    prepared,
    MAX_WRITES_PER_BATCH,
  );

  const runCounts = {
    sourceRecordsCommitted: 0,
    documentsCreated: 0,
    documentsUpdated: 0,
    documentsUnchanged: 0,
    writeBatchesCommitted: 0,
  };

  for (const group of groups) {
    const batch = db.batch();
    let writeCount = 0;

    for (const record of group) {
      for (const action of record.actions) {
        if (action.classification === 'unchanged') {
          runCounts.documentsUnchanged += 1;
          continue;
        }

        if (
          action.classification !== 'create' &&
          action.classification !== 'update'
        ) {
          throw new Error(
            `Unexpected write classification: ${action.classification}`,
          );
        }

        const now = FieldValue.serverTimestamp();
        const writeData = {
          ...action.expectedData,
          createdAt:
            action.classification === 'update' &&
            action.existingData?.createdAt
              ? action.existingData.createdAt
              : now,
          updatedAt: now,
        };

        if (action.classification === 'create') {
          batch.create(action.ref, writeData);
          runCounts.documentsCreated += 1;
        } else {
          batch.set(action.ref, writeData);
          runCounts.documentsUpdated += 1;
        }
        writeCount += 1;
      }
    }

    if (writeCount > MAX_WRITES_PER_BATCH) {
      throw new Error('Internal error: write batch limit exceeded');
    }

    if (writeCount > 0) {
      await batch.commit();
      runCounts.writeBatchesCommitted += 1;
    }

    checkpoint = advanceCheckpoint(
      checkpoint,
      group,
      collectionTotals,
    );
    checkpoint.totals.sourceRecordsCommitted += group.length;
    checkpoint.totals.documentsCreated += group.reduce(
      (sum, record) =>
        sum + record.actions.filter((action) =>
          action.classification === 'create').length,
      0,
    );
    checkpoint.totals.documentsUpdated += group.reduce(
      (sum, record) =>
        sum + record.actions.filter((action) =>
          action.classification === 'update').length,
      0,
    );
    checkpoint.totals.documentsUnchanged += group.reduce(
      (sum, record) =>
        sum + record.actions.filter((action) =>
          action.classification === 'unchanged').length,
      0,
    );
    runCounts.sourceRecordsCommitted += group.length;

    await persistCheckpoint(options.checkpointPath, checkpoint);
  }

  const postState = await classifyTargetState(db, plan);
  const selectedMismatchCount = prepared.reduce((sum, record) =>
    sum + record.expectedDocuments.filter((document) =>
      postState.byKey.get(document.key)?.classification !== 'unchanged').length,
  0);

  if (selectedMismatchCount > 0) {
    throw new Error(
      `Post-write verification failed for ${selectedMismatchCount} selected canonical document(s)`,
    );
  }

  const writesPerformed =
    runCounts.documentsCreated + runCounts.documentsUpdated;
  const report = {
    ...baseReport(options, plan, postState),
    writesPerformed,
    writeRun: {
      requestedLimit: options.limit,
      selectedSourceRecords: selected.length,
      selectedByCollection: countByCollection(selected),
      ...runCounts,
      postWriteSelectedMismatches: selectedMismatchCount,
      checkpointComplete: checkpoint.completed,
      checkpointCursorTokens: Object.fromEntries(
        SOURCE_COLLECTION_ORDER.map((collection) => [
          collection,
          checkpoint.cursors?.[collection]
            ? token(`${collection}/${checkpoint.cursors[collection]}`)
            : null,
        ]),
      ),
    },
  };
  const reportPath = await persistReport(options, report);

  console.log('\n=== Wave 1 Identity Backfill Write ===');
  console.log(`Source records committed: ${selected.length}`);
  console.log(
    `Canonical docs created: ${runCounts.documentsCreated}; updated: ${runCounts.documentsUpdated}; unchanged: ${runCounts.documentsUnchanged}`,
  );
  console.log(`Write batches committed: ${runCounts.writeBatchesCommitted}`);
  console.log(`Writes performed: ${writesPerformed}`);
  console.log(`Post-write selected mismatches: ${selectedMismatchCount}`);
  console.log(`Checkpoint complete: ${checkpoint.completed}`);
  console.log(`Checkpoint: ${options.checkpointPath}`);
  console.log(`Report: ${reportPath}\n`);
}

async function runDryRun({ options, plan, targetState }) {
  const canWrite =
    plan.issues.blockingTotal === 0 &&
    targetState.stateCounts.conflict === 0 &&
    targetState.extras.length === 0;

  const report = {
    ...baseReport(options, plan, targetState),
    dryRun: {
      canStartOrResumeBoundedWrite: canWrite,
      plannedCreates: targetState.stateCounts.create,
      plannedUpdates: targetState.stateCounts.update,
      alreadyReconciled: targetState.stateCounts.unchanged,
      conflicts: targetState.stateCounts.conflict,
    },
  };

  const reportPath = await persistReport(options, report);
  console.log('\n=== Wave 1 Identity Backfill Dry Run ===');
  console.log(
    `Sources — users: ${plan.sourceCounts.users}, kids: ${plan.sourceCounts.kids}, schools: ${plan.sourceCounts.schools}, schoolUsers: ${plan.sourceCounts.schoolUsers}`,
  );
  console.log(
    `Expected canonical documents: ${plan.expectedDocuments.length}`,
  );
  console.log(
    `Target state — create: ${targetState.stateCounts.create}, update: ${targetState.stateCounts.update}, unchanged: ${targetState.stateCounts.unchanged}, conflicts: ${targetState.stateCounts.conflict}`,
  );
  console.log(
    `Unexpected target documents: ${targetState.extras.length}`,
  );
  console.log(
    `Issues: ${plan.issues.total}; blocking: ${plan.issues.blockingTotal}`,
  );
  console.log(`Ready for bounded write: ${canWrite}`);
  console.log('Writes performed: 0');
  console.log(`Report: ${reportPath}\n`);
}

async function runReconcile({ options, plan, targetState }) {
  const mismatches =
    targetState.stateCounts.create +
    targetState.stateCounts.update +
    targetState.stateCounts.conflict +
    targetState.extras.length;

  const reconciled =
    plan.issues.blockingTotal === 0 &&
    mismatches === 0 &&
    plan.expectedDocuments.length ===
      Object.values(targetState.actualCounts)
        .reduce((sum, count) => sum + count, 0);

  const report = {
    ...baseReport(options, plan, targetState),
    reconciliation: {
      reconciled,
      expectedDocuments: plan.expectedDocuments.length,
      matchedDocuments: targetState.stateCounts.unchanged,
      missingDocuments: targetState.stateCounts.create,
      driftedMigrationOwnedDocuments: targetState.stateCounts.update,
      conflictingDocuments: targetState.stateCounts.conflict,
      unexpectedDocuments: targetState.extras.length,
      mismatchCount: mismatches,
    },
  };

  const reportPath = await persistReport(options, report);
  console.log('\n=== Wave 1 Identity Backfill Reconciliation ===');
  console.log(
    `Expected: ${plan.expectedDocuments.length}; matched: ${targetState.stateCounts.unchanged}`,
  );
  console.log(
    `Missing: ${targetState.stateCounts.create}; drifted: ${targetState.stateCounts.update}; conflicts: ${targetState.stateCounts.conflict}; unexpected: ${targetState.extras.length}`,
  );
  console.log(`Blocking source/planning issues: ${plan.issues.blockingTotal}`);
  console.log(`RECONCILED: ${reconciled}`);
  console.log('Writes performed: 0');
  console.log(`Report: ${reportPath}\n`);

  if (!reconciled) process.exitCode = 2;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.projectId !== EXPECTED_PROJECT_ID) {
    throw new Error(
      `This migration is scoped to ${EXPECTED_PROJECT_ID}; received ${options.projectId}`,
    );
  }

  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: options.projectId,
    });
  }

  const db = getFirestore();
  const auth = getAuth();

  const sourceState = await readSourceState(db, auth);
  const plan = buildGlobalPlan(sourceState);
  const targetState = await classifyTargetState(db, plan);

  if (options.mode === 'dry-run') {
    await runDryRun({ options, plan, targetState });
    return;
  }

  if (options.mode === 'write') {
    await runWrite({ db, options, plan, targetState });
    return;
  }

  await runReconcile({ options, plan, targetState });
}

main().catch((error) => {
  console.error(
    'Wave 1 identity backfill failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
