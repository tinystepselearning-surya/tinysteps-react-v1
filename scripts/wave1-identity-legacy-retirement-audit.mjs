#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  applicationDefault,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  CANONICAL_IDENTITY_COLLECTIONS,
  EXISTING_PROFILE_COLLECTIONS,
  LEGACY_RETIREMENT_COLLECTIONS,
  buildRetirementInventory,
} from './migrations/wave1-identity-retirement-audit-lib.mjs';

const EXPECTED_PROJECT_ID = 'tinysteps-react-v1';

function parseArgs(argv) {
  const value = (name) => {
    const index = argv.indexOf(name);
    if (index === -1) return null;
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(`${name} requires a value`);
    }
    return next;
  };

  for (const arg of argv) {
    if (
      arg.startsWith('--') &&
      !['--project', '--report'].includes(arg)
    ) {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return {
    projectId:
      value('--project') ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      EXPECTED_PROJECT_ID,
    reportPath: value('--report'),
  };
}

function safeTimestampForPath(iso) {
  return iso.replace(/[:.]/g, '-');
}

async function readCollection(db, name) {
  const snap = await db.collection(name).get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() || {},
  }));
}

async function countCollection(db, name) {
  const result = await db.collection(name).count().get();
  return Number(result.data().count || 0);
}

function compactFieldRows(collection) {
  return collection.fields.map((field) => ({
    path: field.path,
    documentsPresent: field.documentsPresent,
    typeCounts: field.typeCounts,
    category: field.category,
    disposition: field.disposition,
    target: field.target,
    blocker: field.blocker,
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.projectId !== EXPECTED_PROJECT_ID) {
    throw new Error(
      `Refusing project ${args.projectId}; expected ${EXPECTED_PROJECT_ID}`,
    );
  }

  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: args.projectId,
    });
  }

  const db = getFirestore();
  const generatedAt = new Date().toISOString();

  const legacyEntries = await Promise.all(
    LEGACY_RETIREMENT_COLLECTIONS.map(
      async (collection) => [
        collection,
        await readCollection(db, collection),
      ],
    ),
  );
  const profileEntries = await Promise.all(
    EXISTING_PROFILE_COLLECTIONS.map(
      async (collection) => [
        collection,
        await readCollection(db, collection),
      ],
    ),
  );
  const canonicalEntries = await Promise.all(
    CANONICAL_IDENTITY_COLLECTIONS.map(
      async (collection) => [
        collection,
        await countCollection(db, collection),
      ],
    ),
  );

  const inventory = buildRetirementInventory({
    legacyRowsByCollection:
      Object.fromEntries(legacyEntries),
    profileRowsByCollection:
      Object.fromEntries(profileEntries),
    canonicalCounts:
      Object.fromEntries(canonicalEntries),
  });

  const report = {
    auditId: 'wave1-identity-legacy-retirement-audit-v1',
    generatedAt,
    projectId: args.projectId,
    mode: 'read_only',
    firestoreWritesPerformed: 0,
    authWritesPerformed: 0,
    legacyCollections:
      Object.fromEntries(
        Object.entries(inventory.collections)
          .map(([name, details]) => [
            name,
            {
              documentCount: details.documentCount,
              fieldCount: details.fieldCount,
              knownLegacySubcollectionNamespaces:
                details.knownLegacySubcollectionNamespaces,
              fields: compactFieldRows(details),
            },
          ]),
      ),
    canonicalCounts: inventory.canonicalCounts,
    profileCounts: inventory.profileCounts,
    mirrorCoverage: inventory.mirrorCoverage,
    blockers: inventory.blockers,
    unknownFields: inventory.unknownFields,
    blockingFields: inventory.blockingFields,
    privacy: {
      rawDocumentIdsIncluded: false,
      fieldValuesIncluded: false,
      namesIncluded: false,
      emailsIncluded: false,
      phonesIncluded: false,
      onlyHashedMissingMirrorSubjectTokens: true,
    },
    verdict: inventory.blockers.retirementReady
      ? 'RETIREMENT_READY'
      : 'RETIREMENT_BLOCKED_PENDING_FIELD_MIGRATION',
  };

  const reportPath =
    args.reportPath ||
    path.join(
      'reports',
      `wave1-identity-legacy-retirement-audit-${safeTimestampForPath(generatedAt)}.json`,
    );

  await fs.mkdir(path.dirname(reportPath), {
    recursive: true,
  });
  await fs.writeFile(
    reportPath,
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );

  console.log('\n=== WAVE 1 LEGACY IDENTITY RETIREMENT AUDIT ===');
  console.log('Project:', args.projectId);
  console.log('Mode: READ ONLY');
  console.log('');

  for (const name of LEGACY_RETIREMENT_COLLECTIONS) {
    const item = report.legacyCollections[name];
    console.log(
      `${name}: ${item.documentCount} docs, ${item.fieldCount} field paths`,
    );
  }

  console.log('');
  console.log('Canonical identity counts:');
  for (const [name, count] of Object.entries(
    report.canonicalCounts,
  )) {
    console.log(`  ${name}: ${count}`);
  }

  console.log('');
  console.log('Existing role/profile coverage:');
  console.log(
    `  required mirrors: ${report.mirrorCoverage.required}`,
  );
  console.log(
    `  present mirrors:  ${report.mirrorCoverage.present}`,
  );
  console.log(
    `  missing mirrors:  ${report.mirrorCoverage.missing}`,
  );

  console.log('');
  console.log('Retirement blockers:');
  console.log(
    `  field mappings requiring migration: ${report.blockers.blockingFieldMappings}`,
  );
  console.log(
    `  unknown/unclassified field paths:   ${report.blockers.unknownFieldMappings}`,
  );
  console.log(
    `  missing role/profile mirrors:       ${report.blockers.missingRoleMirrors}`,
  );

  if (report.unknownFields.length) {
    console.log('');
    console.log('Unknown field paths (values are NOT printed):');
    for (const item of report.unknownFields) {
      console.log(
        `  ${item.collection}.${item.path} (${item.documentsPresent} docs)`,
      );
    }
  }

  console.log('');
  console.log('Verdict:', report.verdict);
  console.log('Firestore writes performed: 0');
  console.log('Auth writes performed: 0');
  console.log('Report:', reportPath);
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : String(error),
  );
  process.exit(1);
});
