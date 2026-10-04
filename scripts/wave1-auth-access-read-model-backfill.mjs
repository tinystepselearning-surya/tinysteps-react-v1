#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  applicationDefault,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import {
  getFirestore,
} from 'firebase-admin/firestore';

import {
  buildAccessBackfillPlan,
  privacyToken,
} from './migrations/wave1-auth-access-read-model-backfill-lib.mjs';

const require = createRequire(import.meta.url);

const DEFAULT_PROJECT_ID =
  'tinysteps-react-v1';
const DEFAULT_MAX_RECORDS = 250;
const DEFAULT_WRITE_LIMIT = 250;
const DEFAULT_SAMPLE_SIZE = 20;

function cleanText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function parseInteger(
  value,
  field,
  min,
  max,
) {
  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    throw new Error(
      `${field}_must_be_integer_${min}_to_${max}`,
    );
  }
  return parsed;
}

function parseArgs(argv) {
  const out = {
    projectId:
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      DEFAULT_PROJECT_ID,
    mode: 'dry-run',
    maxRecords:
      DEFAULT_MAX_RECORDS,
    writeLimit:
      DEFAULT_WRITE_LIMIT,
    sampleSize:
      DEFAULT_SAMPLE_SIZE,
    report: '',
  };

  for (
    let index = 0;
    index < argv.length;
    index += 1
  ) {
    const key = argv[index];
    if (key === '--project') {
      out.projectId =
        cleanText(argv[++index]);
    } else if (key === '--mode') {
      out.mode =
        cleanText(argv[++index]);
    } else if (
      key === '--max-records'
    ) {
      out.maxRecords =
        parseInteger(
          argv[++index],
          'max_records',
          1,
          1000,
        );
    } else if (
      key === '--write-limit'
    ) {
      out.writeLimit =
        parseInteger(
          argv[++index],
          'write_limit',
          1,
          250,
        );
    } else if (
      key === '--sample-size'
    ) {
      out.sampleSize =
        parseInteger(
          argv[++index],
          'sample_size',
          0,
          100,
        );
    } else if (key === '--report') {
      out.report =
        cleanText(argv[++index]);
    } else if (
      key === '--help' ||
      key === '-h'
    ) {
      out.help = true;
    } else {
      throw new Error(
        `unknown_argument:${key}`,
      );
    }
  }

  if (
    ![
      'dry-run',
      'write',
      'reconcile',
    ].includes(out.mode)
  ) {
    throw new Error(
      'mode_must_be_dry-run_write_or_reconcile',
    );
  }
  if (!out.projectId) {
    throw new Error(
      'project_id_required',
    );
  }

  return out;
}

function timestampForFile() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, '-');
}

function loadCompiledIdentityModule() {
  const modulePath = path.resolve(
    process.cwd(),
    'functions/lib/schoolOS/identity/authAccessReadModel.js',
  );

  try {
    return require(modulePath);
  } catch (error) {
    const wrapped = new Error(
      'compiled_auth_access_module_missing_run_functions_build_first',
    );
    wrapped.cause = error;
    throw wrapped;
  }
}

function safeIssue(
  subjectNamespace,
  subject,
  error,
) {
  return {
    subjectToken:
      privacyToken(
        subjectNamespace,
        subject,
      ),
    errorCode:
      error instanceof Error &&
      error.message
        ? error.message
        : 'unknown_error',
  };
}

async function collectState(params) {
  const {
    db,
    maxRecords,
    sampleSize,
    loadCanonicalAuthAccessInput,
    buildAuthAccessReadModel,
    collectionName,
  } = params;

  const authSnap = await db
    .collection('authIdentities')
    .where('provider', '==', 'firebase')
    .limit(maxRecords + 1)
    .get();

  if (authSnap.size > maxRecords) {
    throw new Error(
      'firebase_auth_identity_bound_exceeded',
    );
  }

  const accessSnap = await db
    .collection(collectionName)
    .limit(maxRecords + 1)
    .get();

  if (accessSnap.size > maxRecords) {
    throw new Error(
      'auth_access_read_model_bound_exceeded',
    );
  }

  const expectedByUid = new Map();
  const existingByUid = new Map();
  const planningIssues = [];
  const seenProviderSubjects =
    new Set();

  for (const docSnap of authSnap.docs) {
    const authIdentity =
      docSnap.data() || {};
    const firebaseUid =
      cleanText(
        authIdentity.providerSubject,
      );

    if (!firebaseUid) {
      if (
        planningIssues.length <
        sampleSize
      ) {
        planningIssues.push({
          subjectToken:
            privacyToken(
              'authIdentity',
              docSnap.id,
            ),
          errorCode:
            'provider_subject_missing',
        });
      }
      continue;
    }

    if (
      seenProviderSubjects.has(
        firebaseUid,
      )
    ) {
      if (
        planningIssues.length <
        sampleSize
      ) {
        planningIssues.push({
          subjectToken:
            privacyToken(
              'uid',
              firebaseUid,
            ),
          errorCode:
            'duplicate_firebase_provider_subject',
        });
      }
      continue;
    }
    seenProviderSubjects.add(
      firebaseUid,
    );

    try {
      const loaded =
        await loadCanonicalAuthAccessInput({
          db,
          firebaseUid,
        });
      const expected =
        buildAuthAccessReadModel(
          loaded.input,
        );
      expectedByUid.set(
        firebaseUid,
        expected,
      );
    } catch (error) {
      if (
        planningIssues.length <
        sampleSize
      ) {
        planningIssues.push(
          safeIssue(
            'uid',
            firebaseUid,
            error,
          ),
        );
      }
    }
  }

  for (const docSnap of accessSnap.docs) {
    existingByUid.set(
      docSnap.id,
      docSnap.data() || {},
    );
  }

  const plan =
    buildAccessBackfillPlan({
      expectedByUid,
      existingByUid,
      maxSampleSize: sampleSize,
    });

  return {
    sourceAuthIdentities:
      authSnap.size,
    expectedByUid,
    existingByUid,
    planningIssues,
    plan,
  };
}

function publicPlan(plan) {
  return {
    version: plan.version,
    counts: plan.counts,
    samples: plan.samples,
    readyForWrite:
      plan.readyForWrite,
    reconciled:
      plan.reconciled,
  };
}

async function writeReport(
  reportPath,
  report,
) {
  await fs.mkdir(
    path.dirname(reportPath),
    { recursive: true },
  );
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      report,
      null,
      2,
    ) + '\n',
    'utf8',
  );
}

async function main() {
  const args = parseArgs(
    process.argv.slice(2),
  );

  if (args.help) {
    console.log(
      'Usage: node scripts/wave1-auth-access-read-model-backfill.mjs --mode dry-run|write|reconcile [--write-limit 20] [--max-records 250] [--report path]',
    );
    return;
  }

  if (!getApps().length) {
    initializeApp({
      credential:
        applicationDefault(),
      projectId: args.projectId,
    });
  }

  const {
    AUTH_ACCESS_READ_MODEL_COLLECTION,
    buildAuthAccessReadModel,
    loadCanonicalAuthAccessInput,
    refreshAuthAccessReadModel,
  } = loadCompiledIdentityModule();

  const db = getFirestore();
  const runAt =
    new Date().toISOString();
  const reportPath =
    args.report ||
    path.resolve(
      process.cwd(),
      'reports',
      `wave1-auth-access-read-model-${args.mode}-${timestampForFile()}.json`,
    );

  const before =
    await collectState({
      db,
      maxRecords:
        args.maxRecords,
      sampleSize:
        args.sampleSize,
      loadCanonicalAuthAccessInput,
      buildAuthAccessReadModel,
      collectionName:
        AUTH_ACCESS_READ_MODEL_COLLECTION,
    });

  const planningIssueCount =
    before.sourceAuthIdentities -
    before.expectedByUid.size;

  const report = {
    schemaVersion: 1,
    runAt,
    mode: args.mode,
    projectId: args.projectId,
    privacy: {
      rawFirebaseUidsInReport: false,
      rawPersonIdsInReport: false,
      rawEmailsInReport: false,
      samples:
        'sha256 tokens only',
    },
    bounds: {
      maxRecords:
        args.maxRecords,
      writeLimit:
        args.writeLimit,
    },
    sourceAuthIdentities:
      before.sourceAuthIdentities,
    canonicalExpectedRecords:
      before.expectedByUid.size,
    planningIssueCount,
    planningIssueSamples:
      before.planningIssues,
    before:
      publicPlan(before.plan),
    writes: {
      attempted: 0,
      succeeded: 0,
      failed: 0,
      sampleTokens: [],
    },
    after: null,
    result: 'dry_run_complete',
  };

  if (args.mode === 'write') {
    if (
      planningIssueCount > 0 ||
      !before.plan.readyForWrite
    ) {
      report.result =
        'write_blocked';
      await writeReport(
        reportPath,
        report,
      );
      console.log(
        JSON.stringify(
          report,
          null,
          2,
        ),
      );
      process.exitCode = 2;
      return;
    }

    const pending =
      before.plan.items.filter(
        (item) =>
          item.state === 'create' ||
          item.state === 'update',
      );
    const selected =
      pending.slice(
        0,
        args.writeLimit,
      );

    report.writes.attempted =
      selected.length;

    for (const item of selected) {
      try {
        await refreshAuthAccessReadModel({
          db,
          firebaseUid:
            item.firebaseUid,
        });
        report.writes.succeeded += 1;
        if (
          report.writes.sampleTokens
            .length < args.sampleSize
        ) {
          report.writes.sampleTokens
            .push(
              privacyToken(
                'uid',
                item.firebaseUid,
              ),
            );
        }
      } catch (error) {
        report.writes.failed += 1;
        if (
          report.planningIssueSamples
            .length < args.sampleSize
        ) {
          report.planningIssueSamples
            .push(
              safeIssue(
                'uid',
                item.firebaseUid,
                error,
              ),
            );
        }
      }
    }

    const after =
      await collectState({
        db,
        maxRecords:
          args.maxRecords,
        sampleSize:
          args.sampleSize,
        loadCanonicalAuthAccessInput,
        buildAuthAccessReadModel,
        collectionName:
          AUTH_ACCESS_READ_MODEL_COLLECTION,
      });

    report.after =
      publicPlan(after.plan);

    report.result =
      report.writes.failed > 0
        ? 'write_completed_with_failures'
        : after.plan.reconciled
          ? 'write_complete_reconciled'
          : 'bounded_write_complete_pending_remaining';

    if (
      report.writes.failed > 0
    ) {
      process.exitCode = 2;
    }
  } else if (
    args.mode === 'reconcile'
  ) {
    report.result =
      planningIssueCount === 0 &&
      before.plan.reconciled
        ? 'reconciled'
        : 'reconciliation_failed';

    if (
      report.result !==
      'reconciled'
    ) {
      process.exitCode = 2;
    }
  } else {
    report.result =
      planningIssueCount === 0 &&
      before.plan.readyForWrite
        ? 'dry_run_ready'
        : 'dry_run_blocked';
  }

  await writeReport(
    reportPath,
    report,
  );

  console.log(
    JSON.stringify(
      report,
      null,
      2,
    ),
  );
  console.error(
    `Report: ${reportPath}`,
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
