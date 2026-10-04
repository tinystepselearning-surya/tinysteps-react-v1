#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  applicationDefault,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import {
  FieldValue,
  getFirestore,
} from 'firebase-admin/firestore';

import {
  PROFILE_RETIREMENT_MIGRATION_ID,
  buildProfilePlan,
  classifyProfileTarget,
  partitionRecordsByWrites,
  privacyToken,
  summarizeClassifiedRecords,
} from './migrations/wave1-identity-profile-retirement-lib.mjs';

const EXPECTED_PROJECT_ID = 'tinysteps-react-v1';
const MAX_SOURCE_RECORDS_PER_RUN = 250;
const MAX_WRITES_PER_BATCH = 100;

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
  const limit =
    limitRaw === null ? null : Number(limitRaw);

  if (
    limit !== null &&
    (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_SOURCE_RECORDS_PER_RUN
    )
  ) {
    throw new Error(
      `--limit must be an integer between 1 and ${MAX_SOURCE_RECORDS_PER_RUN}`,
    );
  }

  if (modes[0] === '--write' && limit === null) {
    throw new Error(
      `--write requires --limit N (maximum ${MAX_SOURCE_RECORDS_PER_RUN})`,
    );
  }

  return {
    mode: modes[0].slice(2),
    projectId:
      value('--project') ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      EXPECTED_PROJECT_ID,
    confirmProject: value('--confirm-project'),
    reportPath: value('--report'),
    limit,
  };
}

async function readCollection(db, name, fields = null) {
  let query = db.collection(name);
  if (Array.isArray(fields) && fields.length) {
    query = query.select(...fields);
  }
  const snap = await query.get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() || {},
  }));
}

async function readSourceState(db) {
  const [
    users,
    kids,
    schools,
    enrollments,
    classSessions,
    guardianRelationships,
    people,
    learnerProfiles,
    organisations,
  ] = await Promise.all([
    readCollection(db, 'users'),
    readCollection(db, 'kids'),
    readCollection(db, 'schools'),
    readCollection(db, 'enrollments', [
      'kidId',
      'studentId',
      'childId',
      'kidIds',
      'teacherId',
      'teacherIds',
      'assignedTeacherId',
      'primaryTeacherId',
      'teacherUid',
      'teacher_id',
      'status',
      'archived',
      'isArchived',
      'deleted',
      'isDeleted',
      'archivedAt',
      'deletedAt',
    ]),
    readCollection(db, 'classSessions', [
      'kidId',
      'studentId',
      'childId',
      'kidIds',
      'teacherId',
      'teacherIds',
      'assignedTeacherId',
      'primaryTeacherId',
      'teacherUid',
      'teacher_id',
    ]),
    readCollection(db, 'guardianRelationships', [
      'guardianPersonId',
      'learnerPersonId',
      'status',
    ]),
    readCollection(db, 'people', ['personId']),
    readCollection(db, 'learnerProfiles', [
      'learnerProfileId',
      'personId',
    ]),
    readCollection(db, 'organisations', [
      'organisationId',
    ]),
  ]);

  return {
    users,
    kids,
    schools,
    enrollments,
    classSessions,
    guardianRelationships,
    peopleIds: new Set(people.map((row) => row.id)),
    learnerProfileIds: new Set(
      learnerProfiles.map((row) => row.id),
    ),
    organisationIds: new Set(
      organisations.map((row) => row.id),
    ),
  };
}

async function getAllInChunks(
  db,
  refs,
  chunkSize = 100,
) {
  const out = [];
  for (
    let index = 0;
    index < refs.length;
    index += chunkSize
  ) {
    const chunk = refs.slice(
      index,
      index + chunkSize,
    );
    if (chunk.length) {
      out.push(...await db.getAll(...chunk));
    }
  }
  return out;
}

async function classifyPlan(db, plan) {
  const actions = plan.records.flatMap(
    (record) => record.actions,
  );
  const refs = actions.map((item) =>
    db.collection(item.collection)
      .doc(item.documentId));

  const snapshots =
    await getAllInChunks(db, refs);

  let cursor = 0;
  const records = plan.records.map((record) => ({
    ...record,
    actions: record.actions.map((item) => {
      const snap = snapshots[cursor++];
      const existingData =
        snap?.exists
          ? (snap.data() || {})
          : null;
      return {
        ...item,
        ref: snap?.ref ||
          db.collection(item.collection)
            .doc(item.documentId),
        existingData,
        classification:
          classifyProfileTarget(
            existingData,
            item,
          ),
      };
    }),
  }));

  return {
    ...plan,
    records,
    summary: summarizeClassifiedRecords(
      records,
    ),
  };
}

function reportPathFor(options) {
  if (options.reportPath) {
    return options.reportPath;
  }
  const suffix = new Date()
    .toISOString()
    .replace(/[:.]/g, '-');
  return (
    'reports/' +
    `wave1-identity-profile-retirement-${options.mode}-${suffix}.json`
  );
}

async function writeReport(options, report) {
  const reportPath = reportPathFor(options);
  const absolute = path.resolve(
    process.cwd(),
    reportPath,
  );
  await fs.mkdir(path.dirname(absolute), {
    recursive: true,
  });
  await fs.writeFile(
    absolute,
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  return reportPath;
}

function actionSamples(records) {
  const out = {};
  for (const record of records) {
    for (const item of record.actions) {
      const key =
        `${item.collection}:${item.classification}`;
      out[key] ||= [];
      if (out[key].length < 20) {
        out[key].push(
          privacyToken(
            `${record.sourceCollection}/${record.sourceId}`,
          ),
        );
      }
    }
  }
  return Object.fromEntries(
    Object.entries(out)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

function baseReport(options, state) {
  return {
    generatedAt: new Date().toISOString(),
    migrationId:
      PROFILE_RETIREMENT_MIGRATION_ID,
    mode: options.mode,
    projectId: options.projectId,
    sourceCounts: {
      users: state.users.length,
      kids: state.kids.length,
      schools: state.schools.length,
      enrollments: state.enrollments.length,
      classSessions: state.classSessions.length,
      guardianRelationships:
        state.guardianRelationships.length,
    },
    targetState: state.summary,
    coreIssues: {
      count: state.coreIssues.length,
      byCode: state.coreIssues.reduce(
        (acc, item) => {
          acc[item.code] =
            (acc[item.code] || 0) + 1;
          return acc;
        },
        {},
      ),
      samples:
        state.coreIssues.slice(0, 20),
    },
    derivedRelationshipCoverage:
      state.relationships,
    privacy: {
      rawSourceIdsInReport: false,
      namesInReport: false,
      emailsInReport: false,
      phonesInReport: false,
      onlyHashedSubjectSamples: true,
    },
    safety: {
      maxSourceRecordsPerRun:
        MAX_SOURCE_RECORDS_PER_RUN,
      maxWritesPerBatch:
        MAX_WRITES_PER_BATCH,
      legacyDocumentsMutated: false,
      firebaseAuthMutated: false,
      canonicalIdentityCoreMutated: false,
      destructiveDeletionAuthorized: false,
    },
    actionSamples:
      actionSamples(state.records),
  };
}

function blockingCount(state) {
  return (
    state.coreIssues.length +
    state.relationships.issueCount +
    state.summary.conflict
  );
}

function canWrite(state) {
  return blockingCount(state) === 0;
}

function pendingRecords(state) {
  return state.records.filter(
    (record) =>
      record.actions.some(
        (item) =>
          item.classification === 'create' ||
          item.classification === 'update',
      ),
  );
}

function sanitizeSelected(records) {
  return records.map((record) => ({
    sourceCollection:
      record.sourceCollection,
    sourceToken: privacyToken(
      `${record.sourceCollection}/${record.sourceId}`,
    ),
    actions: record.actions.map((item) => ({
      collection: item.collection,
      classification:
        item.classification,
    })),
  }));
}

async function runDryRun(
  options,
  state,
) {
  const report = {
    ...baseReport(options, state),
    dryRun: {
      readyForBoundedWrite:
        canWrite(state),
      pendingSourceRecords:
        pendingRecords(state).length,
      writesPlanned:
        state.summary.create +
        state.summary.update,
      blockingIssues:
        blockingCount(state),
    },
    writesPerformed: 0,
  };

  const reportPath =
    await writeReport(options, report);

  console.log(
    '\n=== Wave 1 Identity Profile Retirement Dry Run ===',
  );
  console.log(
    `Sources — users: ${state.users.length}, kids: ${state.kids.length}, schools: ${state.schools.length}`,
  );
  console.log(
    `Targets — create: ${state.summary.create}, update: ${state.summary.update}, unchanged: ${state.summary.unchanged}, conflicts: ${state.summary.conflict}`,
  );
  console.log(
    `Pending source records: ${pendingRecords(state).length}`,
  );
  console.log(
    `Core issues: ${state.coreIssues.length}`,
  );
  console.log(
    `Derived relationship issues: ${state.relationships.issueCount}`,
  );
  console.log(
    `Ready for bounded write: ${canWrite(state)}`,
  );
  console.log('Writes performed: 0');
  console.log(`Report: ${reportPath}\n`);
}

function assertWriteAllowed(options, state) {
  if (
    options.projectId !== EXPECTED_PROJECT_ID
  ) {
    throw new Error(
      `Refusing project ${options.projectId}; expected ${EXPECTED_PROJECT_ID}`,
    );
  }
  if (
    options.confirmProject !==
      EXPECTED_PROJECT_ID
  ) {
    throw new Error(
      `Write mode requires --confirm-project ${EXPECTED_PROJECT_ID}`,
    );
  }
  if (!canWrite(state)) {
    throw new Error(
      `Profile retirement write blocked by ${blockingCount(state)} issue(s)`,
    );
  }
}

async function runWrite(
  db,
  options,
  state,
) {
  assertWriteAllowed(options, state);

  const selected = pendingRecords(state)
    .slice(0, options.limit);

  if (!selected.length) {
    const report = {
      ...baseReport(options, state),
      writeRun: {
        requestedLimit: options.limit,
        selectedSourceRecords: 0,
        note: 'No pending profile-retirement writes remain.',
      },
      writesPerformed: 0,
    };
    const reportPath =
      await writeReport(options, report);
    console.log(
      '\n=== Wave 1 Identity Profile Retirement Write ===',
    );
    console.log(
      'No pending source records. No writes performed.',
    );
    console.log(`Report: ${reportPath}\n`);
    return;
  }

  const groups =
    partitionRecordsByWrites(
      selected,
      MAX_WRITES_PER_BATCH,
    );

  const counts = {
    sourceRecordsCommitted: 0,
    documentsCreated: 0,
    documentsUpdated: 0,
    writeBatchesCommitted: 0,
  };

  for (const group of groups) {
    const batch = db.batch();
    let writes = 0;

    for (const record of group) {
      for (const item of record.actions) {
        if (
          !['create', 'update'].includes(
            item.classification,
          )
        ) {
          continue;
        }

        const now =
          FieldValue.serverTimestamp();
        const writeData = {
          ...item.expectedData,
          createdAt:
            item.existingData?.createdAt ||
            now,
          updatedAt: now,
        };

        batch.set(
          item.ref,
          writeData,
          { merge: true },
        );

        if (
          item.classification === 'create'
        ) {
          counts.documentsCreated += 1;
        } else {
          counts.documentsUpdated += 1;
        }
        writes += 1;
      }
    }

    if (writes > MAX_WRITES_PER_BATCH) {
      throw new Error(
        'Internal error: write batch cap exceeded',
      );
    }

    if (writes > 0) {
      await batch.commit();
      counts.writeBatchesCommitted += 1;
    }
    counts.sourceRecordsCommitted +=
      group.length;
  }

  const freshSource =
    await readSourceState(db);
  const freshPlan =
    buildProfilePlan(freshSource);
  const freshState =
    await classifyPlan(db, {
      ...freshSource,
      ...freshPlan,
    });

  const selectedKeys = new Set(
    selected.flatMap((record) =>
      record.actions
        .filter((item) =>
          ['create', 'update'].includes(
            item.classification,
          ))
        .map((item) => item.key),
    ),
  );

  const mismatches =
    freshState.records.flatMap(
      (record) => record.actions,
    ).filter(
      (item) =>
        selectedKeys.has(item.key) &&
        item.classification !== 'unchanged',
    );

  if (mismatches.length) {
    throw new Error(
      `Post-write verification failed for ${mismatches.length} selected target(s)`,
    );
  }

  const writesPerformed =
    counts.documentsCreated +
    counts.documentsUpdated;

  const report = {
    ...baseReport(options, freshState),
    writeRun: {
      requestedLimit: options.limit,
      selectedSourceRecords:
        selected.length,
      selected:
        sanitizeSelected(selected),
      ...counts,
      postWriteSelectedMismatches: 0,
      remainingPendingSourceRecords:
        pendingRecords(freshState).length,
    },
    writesPerformed,
  };

  const reportPath =
    await writeReport(options, report);

  console.log(
    '\n=== Wave 1 Identity Profile Retirement Write ===',
  );
  console.log(
    `Source records committed: ${counts.sourceRecordsCommitted}`,
  );
  console.log(
    `Target docs created: ${counts.documentsCreated}; updated: ${counts.documentsUpdated}`,
  );
  console.log(
    `Write batches committed: ${counts.writeBatchesCommitted}`,
  );
  console.log(
    'Post-write selected mismatches: 0',
  );
  console.log(
    `Remaining pending source records: ${pendingRecords(freshState).length}`,
  );
  console.log(
    `Writes performed: ${writesPerformed}`,
  );
  console.log(`Report: ${reportPath}\n`);
}

async function runReconcile(
  options,
  state,
) {
  const pending =
    state.summary.create +
    state.summary.update +
    state.summary.conflict;
  const reconciled =
    pending === 0 &&
    state.coreIssues.length === 0 &&
    state.relationships.issueCount === 0;

  const report = {
    ...baseReport(options, state),
    reconciliation: {
      expectedTargets:
        state.summary.create +
        state.summary.update +
        state.summary.unchanged +
        state.summary.conflict,
      matchedTargets:
        state.summary.unchanged,
      missingTargets:
        state.summary.create,
      driftedTargets:
        state.summary.update,
      conflictingTargets:
        state.summary.conflict,
      coreIssues:
        state.coreIssues.length,
      derivedRelationshipIssues:
        state.relationships.issueCount,
      reconciled,
    },
    writesPerformed: 0,
  };

  const reportPath =
    await writeReport(options, report);

  console.log(
    '\n=== Wave 1 Identity Profile Retirement Reconciliation ===',
  );
  console.log(
    `Expected targets: ${report.reconciliation.expectedTargets}; matched: ${report.reconciliation.matchedTargets}`,
  );
  console.log(
    `Missing: ${report.reconciliation.missingTargets}; drifted: ${report.reconciliation.driftedTargets}; conflicts: ${report.reconciliation.conflictingTargets}`,
  );
  console.log(
    `Core issues: ${report.reconciliation.coreIssues}`,
  );
  console.log(
    `Derived relationship issues: ${report.reconciliation.derivedRelationshipIssues}`,
  );
  console.log(
    `RECONCILED: ${reconciled}`,
  );
  console.log('Writes performed: 0');
  console.log(`Report: ${reportPath}\n`);

  if (!reconciled) {
    process.exitCode = 2;
  }
}

async function main() {
  const options =
    parseArgs(process.argv.slice(2));

  if (
    options.projectId !== EXPECTED_PROJECT_ID
  ) {
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
  const source =
    await readSourceState(db);
  const plan =
    buildProfilePlan(source);
  const state =
    await classifyPlan(db, {
      ...source,
      ...plan,
    });

  if (options.mode === 'dry-run') {
    await runDryRun(options, state);
    return;
  }
  if (options.mode === 'write') {
    await runWrite(db, options, state);
    return;
  }
  await runReconcile(options, state);
}

main().catch((error) => {
  console.error(
    'Wave 1 identity profile retirement migration failed:',
    error instanceof Error
      ? error.message
      : String(error),
  );
  process.exitCode = 1;
});
