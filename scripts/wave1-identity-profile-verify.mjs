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
  PROFILE_TARGET_COLLECTIONS,
  compareProfileDocument,
  countExpectedByCollection,
  deriveExpectedProfileTargets,
  isOwnedByProfileMigration,
  token,
  verifyRetirementDependencies,
} from './verification/wave1-identity-profile-verify-lib.mjs';

const EXPECTED_PROJECT_ID = 'tinysteps-react-v1';

const SOURCE_FIELDS = {
  users: [
    'role',
    'rawRole',
    'status',
    'email',
    'phone',
    'phoneCountryCode',
    'phoneLocal',
    'whatsappE164',
    'timezone',
    'countryCodeSource',
    'countryCodeUpdatedAt',
    'qualification',
    'qualifications',
    'specialization',
    'specializations',
    'languages',
    'languagesSpoken',
    'yearsExperience',
    'city',
    'bio',
    'region',
    'preferences',
    'bankAccount',
    'bankAccountNumber',
    'bankAccountHolderName',
    'bankIfscCode',
    'upiId',
    'emergencyContactName',
    'emergencyContactPhone',
    'archivedAt',
    'archivedBy',
    'archivedReason',
    'childIds',
    'displayName',
    'name',
    'firstName',
    'lastName',
  ],
  kids: [
    'grade',
    'summary',
    'progress',
    'repairedFromBrokenStudentId',
    'repairedFromEnrollmentId',
    'repairSource',
    'archivedAt',
    'archivedBy',
    'archivedReason',
    'teacherId',
    'teacherIds',
  ],
  schools: [
    'contact',
    'location',
    'nameSearch',
    'currentAcademicYearId',
    'learningPartnerId',
    'learningPartnerName',
    'learningPartnerEmail',
    'learningPartnerAssignedAt',
  ],
  enrollments: [
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
  ],
  classSessions: [
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
  ],
  guardianRelationships: [
    'guardianPersonId',
    'learnerPersonId',
  ],
};

function parseArgs(argv) {
  const value = (name) => {
    const index = argv.indexOf(name);
    if (index === -1) return null;
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(name + ' requires a value');
    }
    return next;
  };

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

function row(doc) {
  return { id: doc.id, data: doc.data() || {} };
}

async function readCollection(db, name, fields = null) {
  const ref = fields?.length
    ? db.collection(name).select(...fields)
    : db.collection(name);
  const snap = await ref.get();
  return snap.docs.map(row);
}

function toMap(rows) {
  return new Map(
    rows.map((item) => [item.id, item.data]),
  );
}

function addIssue(bucket, code, key, fields = []) {
  bucket.counts[code] = (bucket.counts[code] || 0) + 1;
  bucket.samples[code] ||= [];
  if (bucket.samples[code].length < 20) {
    bucket.samples[code].push({
      subjectToken: token(key),
      collection: String(key).split('/')[0],
      fields: [...new Set(fields)].sort(),
    });
  }
}

function issueResult(bucket) {
  return {
    total: Object.values(bucket.counts)
      .reduce((sum, value) => sum + value, 0),
    byCode: Object.fromEntries(
      Object.entries(bucket.counts)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
    samples: Object.fromEntries(
      Object.entries(bucket.samples)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.projectId !== EXPECTED_PROJECT_ID) {
    throw new Error(
      'Profile verifier is scoped to ' +
      EXPECTED_PROJECT_ID +
      '; received ' +
      options.projectId,
    );
  }

  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: options.projectId,
    });
  }

  const db = getFirestore();

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
    ...targetRows
  ] = await Promise.all([
    readCollection(db, 'users', SOURCE_FIELDS.users),
    readCollection(db, 'kids', SOURCE_FIELDS.kids),
    readCollection(db, 'schools', SOURCE_FIELDS.schools),
    readCollection(db, 'enrollments', SOURCE_FIELDS.enrollments),
    readCollection(db, 'classSessions', SOURCE_FIELDS.classSessions),
    readCollection(
      db,
      'guardianRelationships',
      SOURCE_FIELDS.guardianRelationships,
    ),
    readCollection(db, 'people', ['personId']),
    readCollection(
      db,
      'learnerProfiles',
      ['learnerProfileId', 'personId'],
    ),
    readCollection(db, 'organisations', ['organisationId']),
    ...PROFILE_TARGET_COLLECTIONS.map(
      (collection) => readCollection(db, collection),
    ),
  ]);

  const expectedModel = deriveExpectedProfileTargets({
    users,
    kids,
    schools,
  });

  const actualByCollection = Object.fromEntries(
    PROFILE_TARGET_COLLECTIONS.map((collection, index) => [
      collection,
      toMap(targetRows[index]),
    ]),
  );

  const semanticBucket = { counts: {}, samples: {} };
  let matched = 0;
  let missing = 0;
  let migrationOwnedUnexpected = 0;

  for (const [key, expected] of expectedModel.documents) {
    const actual =
      actualByCollection[expected.collection].get(expected.id);

    if (!actual) {
      missing += 1;
      addIssue(
        semanticBucket,
        'expected_profile_target_missing',
        key,
      );
      continue;
    }

    const fields = compareProfileDocument(
      actual,
      expected.expectedData,
    );

    if (fields.length) {
      addIssue(
        semanticBucket,
        'profile_target_semantic_mismatch',
        key,
        fields,
      );
      continue;
    }

    matched += 1;
  }

  const expectedKeys = new Set(expectedModel.documents.keys());

  for (const collection of PROFILE_TARGET_COLLECTIONS) {
    for (const [id, data] of actualByCollection[collection]) {
      const key = `${collection}/${id}`;
      if (
        !expectedKeys.has(key) &&
        isOwnedByProfileMigration(data)
      ) {
        migrationOwnedUnexpected += 1;
        addIssue(
          semanticBucket,
          'unexpected_migration_owned_profile_target',
          key,
        );
      }
    }
  }

  const dependencyIssues = verifyRetirementDependencies({
    users,
    kids,
    schools,
    enrollments,
    classSessions,
    guardianRelationships,
    peopleIds: new Set(people.map((item) => item.id)),
    learnerProfileIds: new Set(
      learnerProfiles.map((item) => item.id),
    ),
    organisationIds: new Set(
      organisations.map((item) => item.id),
    ),
  });

  const dependencyBucket = { counts: {}, samples: {} };
  for (const issue of dependencyIssues) {
    addIssue(
      dependencyBucket,
      issue.code,
      issue.key,
    );
  }

  const semanticResult = issueResult(semanticBucket);
  const dependencyResult = issueResult(dependencyBucket);
  const expectedCounts =
    countExpectedByCollection(expectedModel.documents);
  const actualCounts = Object.fromEntries(
    PROFILE_TARGET_COLLECTIONS.map((collection) => [
      collection,
      actualByCollection[collection].size,
    ]),
  );

  const verified =
    matched === expectedModel.documents.size &&
    missing === 0 &&
    migrationOwnedUnexpected === 0 &&
    semanticResult.total === 0 &&
    dependencyResult.total === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'wave1_identity_profile_verify_read_only',
    projectId: options.projectId,
    writesPerformed: 0,
    privacy: {
      rawSourceIdsInReport: false,
      namesInReport: false,
      emailsInReport: false,
      phonesInReport: false,
      bankDataInReport: false,
      samplesUseSha256Tokens: true,
    },
    sourceCounts: {
      users: users.length,
      kids: kids.length,
      schools: schools.length,
      enrollments: enrollments.length,
      classSessions: classSessions.length,
      guardianRelationships: guardianRelationships.length,
    },
    coreCounts: {
      people: people.length,
      learnerProfiles: learnerProfiles.length,
      organisations: organisations.length,
    },
    expectedTargetsByCollection: expectedCounts,
    actualTargetsByCollection: actualCounts,
    documentVerification: {
      expected: expectedModel.documents.size,
      matched,
      missing,
      migrationOwnedUnexpected,
      semanticMismatchCount:
        semanticResult.byCode.profile_target_semantic_mismatch || 0,
      issues: semanticResult,
    },
    retirementDependencyVerification:
      dependencyResult,
    verified,
  };

  const suffix = new Date()
    .toISOString()
    .replace(/[:.]/g, '-');

  const reportPath =
    options.reportPath ||
    'reports/wave1-identity-profile-verify-' +
      suffix +
      '.json';

  const absolute = path.resolve(
    process.cwd(),
    reportPath,
  );

  await fs.mkdir(path.dirname(absolute), {
    recursive: true,
  });
  await fs.writeFile(
    absolute,
    JSON.stringify(report, null, 2) + '\n',
    'utf8',
  );

  console.log(
    '\n=== Wave 1 Identity Profile Independent VERIFY ===',
  );
  console.log(
    'Expected targets: ' +
      expectedModel.documents.size +
      '; matched: ' +
      matched,
  );
  console.log('Missing targets: ' + missing);
  console.log(
    'Semantic/profile issues: ' +
      semanticResult.total,
  );
  console.log(
    'Unexpected migration-owned targets: ' +
      migrationOwnedUnexpected,
  );
  console.log(
    'Retirement dependency issues: ' +
      dependencyResult.total,
  );
  console.log('VERIFIED: ' + verified);
  console.log('Writes performed: 0');
  console.log('Report: ' + reportPath + '\n');

  if (!verified) process.exitCode = 2;
}

main().catch((error) => {
  console.error(
    'Wave 1 independent profile verification failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
