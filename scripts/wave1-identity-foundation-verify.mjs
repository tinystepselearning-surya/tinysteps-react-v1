#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import {
  CANONICAL_BASELINE,
  CANONICAL_COLLECTIONS,
  SOURCE_BASELINE,
  countExpectedByCollection,
  deriveExpectedIdentityModel,
  compareCanonicalDocument,
  token,
  verifyReferences,
} from './verification/wave1-identity-verify-lib.mjs';

const EXPECTED_PROJECT_ID = 'tinysteps-react-v1';

const SOURCE_FIELDS = {
  users: [
    'uid','userId','role','roles','status','displayName','name',
    'firstName','lastName','countryCode','schemaVersion',
  ],
  kids: [
    'parentId','parentIds','primaryParentId','status','fullName','name',
    'displayName','studentName','firstName','lastName','age','ageYears',
    'countryCode','schemaVersion',
  ],
  schools: ['status','name','countryCode','schoolCode','schemaVersion'],
  schoolUsers: ['userId','role','schoolIds','primarySchoolId','status','schemaVersion'],
};

function parseArgs(argv) {
  const value = (name) => {
    const index = argv.indexOf(name);
    if (index === -1) return null;
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) throw new Error(name + ' requires a value');
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
  const ref = fields?.length ? db.collection(name).select(...fields) : db.collection(name);
  const snap = await ref.get();
  return snap.docs.map(row);
}

async function readAuthDirectory(auth) {
  const users = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    users.push(...result.users.map((user) => ({
      uid: user.uid,
      disabled: Boolean(user.disabled),
      displayName: typeof user.displayName === 'string' ? user.displayName.trim() : null,
    })));
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

function toMap(rows) {
  return new Map(rows.map((item) => [item.id, item.data]));
}

function addIssue(bucket, code, key, fields = []) {
  bucket.counts[code] = (bucket.counts[code] || 0) + 1;
  if (!bucket.samples[code]) bucket.samples[code] = [];
  if (bucket.samples[code].length < 20) {
    bucket.samples[code].push({
      documentToken: token(key),
      collection: String(key).split('/')[0],
      fields: [...new Set(fields)].sort(),
    });
  }
}

function issueResult(bucket) {
  return {
    total: Object.values(bucket.counts).reduce((sum, value) => sum + value, 0),
    byCode: Object.fromEntries(Object.entries(bucket.counts).sort(([a],[b]) => a.localeCompare(b))),
    samples: Object.fromEntries(Object.entries(bucket.samples).sort(([a],[b]) => a.localeCompare(b))),
  };
}

function countsEqual(actual, expected) {
  return Object.entries(expected).every(([key, value]) => actual[key] === value);
}

function authIdentityId(uid) {
  const body = ['authIdentity', 'firebase', uid].join('\u001f');
  return 'auth_' + createHash('sha256').update(body, 'utf8').digest('hex').slice(0, 32);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.projectId !== EXPECTED_PROJECT_ID) {
    throw new Error('Verifier is scoped to ' + EXPECTED_PROJECT_ID + '; received ' + options.projectId);
  }

  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: options.projectId,
    });
  }

  const db = getFirestore();
  const auth = getAuth();

  const [users, kids, schools, schoolUsers, authUsers, ...canonicalRows] = await Promise.all([
    readCollection(db, 'users', SOURCE_FIELDS.users),
    readCollection(db, 'kids', SOURCE_FIELDS.kids),
    readCollection(db, 'schools', SOURCE_FIELDS.schools),
    readCollection(db, 'schoolUsers', SOURCE_FIELDS.schoolUsers),
    readAuthDirectory(auth),
    ...CANONICAL_COLLECTIONS.map((collection) => readCollection(db, collection)),
  ]);

  const householdRows = await readCollection(db, 'households', ['schemaVersion']);

  const expectedModel = deriveExpectedIdentityModel({
    users,
    kids,
    schools,
    schoolUsers,
    authUsers,
  });

  const actualByCollection = Object.fromEntries(
    CANONICAL_COLLECTIONS.map((collection, index) => [
      collection,
      toMap(canonicalRows[index]),
    ]),
  );

  const expectedCounts = countExpectedByCollection(expectedModel.documents);
  const actualCounts = Object.fromEntries(
    CANONICAL_COLLECTIONS.map((collection) => [
      collection,
      actualByCollection[collection].size,
    ]),
  );
  actualCounts.households = householdRows.length;

  const semanticIssues = { counts: {}, samples: {} };
  let matched = 0;
  let missing = 0;
  let unexpected = 0;

  for (const [key, expected] of expectedModel.documents) {
    const actual = actualByCollection[expected.collection].get(expected.id);
    if (!actual) {
      missing += 1;
      addIssue(semanticIssues, 'expected_canonical_document_missing', key);
      continue;
    }
    const fields = compareCanonicalDocument(actual, expected.expectedData);
    if (fields.length) {
      addIssue(semanticIssues, 'canonical_semantic_mismatch', key, fields);
      continue;
    }
    matched += 1;
  }

  const expectedKeys = new Set(expectedModel.documents.keys());
  for (const collection of CANONICAL_COLLECTIONS) {
    for (const id of actualByCollection[collection].keys()) {
      const key = collection + '/' + id;
      if (!expectedKeys.has(key)) {
        unexpected += 1;
        addIssue(semanticIssues, 'unexpected_canonical_document', key);
      }
    }
  }

  const referenceIssues = verifyReferences(actualByCollection, authUsers);
  const referenceBucket = { counts: {}, samples: {} };
  for (const issue of referenceIssues) {
    addIssue(referenceBucket, issue.code, issue.key);
  }

  const authOnlyAccounts = expectedModel.authOnlyUsers;
  let authOnlyCanonicalLeakCount = 0;
  for (const account of authOnlyAccounts) {
    if (actualByCollection.people.has(account.uid)) {
      authOnlyCanonicalLeakCount += 1;
      addIssue(semanticIssues, 'auth_only_account_has_person', 'people/' + account.uid);
    }
    const authId = authIdentityId(account.uid);
    if (actualByCollection.authIdentities.has(authId)) {
      authOnlyCanonicalLeakCount += 1;
      addIssue(
        semanticIssues,
        'auth_only_account_has_auth_identity',
        'authIdentities/' + authId,
      );
    }
  }

  const sourceCounts = {
    users: users.length,
    firebaseAuthUsers: authUsers.length,
    kids: kids.length,
    schools: schools.length,
    schoolUsers: schoolUsers.length,
  };

  const sourceBaselineMatches = countsEqual(sourceCounts, SOURCE_BASELINE);
  const canonicalBaselineMatches = countsEqual(actualCounts, CANONICAL_BASELINE);
  const expectedBaselineMatches = countsEqual(
    { ...expectedCounts, households: 0 },
    CANONICAL_BASELINE,
  );

  const semanticResult = issueResult(semanticIssues);
  const referenceResult = issueResult(referenceBucket);

  const verified =
    expectedModel.issues.blockingTotal === 0 &&
    sourceBaselineMatches &&
    expectedBaselineMatches &&
    canonicalBaselineMatches &&
    matched === expectedModel.documents.size &&
    missing === 0 &&
    unexpected === 0 &&
    semanticResult.total === 0 &&
    referenceResult.total === 0 &&
    authOnlyCanonicalLeakCount === 0 &&
    householdRows.length === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'wave1_identity_foundation_verify_read_only',
    projectId: options.projectId,
    writesPerformed: 0,
    privacy: {
      rawIdsInReport: false,
      samplesUseSha256Tokens: true,
      namesIncludedInReport: false,
      emailsIncludedInReport: false,
      phonesIncludedInReport: false,
    },
    sourceCounts,
    sourceBaseline: SOURCE_BASELINE,
    sourceBaselineMatches,
    expectedCanonicalCounts: {
      ...expectedCounts,
      households: 0,
    },
    canonicalBaseline: CANONICAL_BASELINE,
    expectedBaselineMatches,
    actualCanonicalCounts: actualCounts,
    canonicalBaselineMatches,
    documentVerification: {
      expected: expectedModel.documents.size,
      matched,
      missing,
      unexpected,
      semanticMismatchCount: semanticResult.total,
      semanticIssues: semanticResult,
    },
    referenceVerification: referenceResult,
    sourceModelIssues: expectedModel.issues,
    authOnlyAccounts: {
      expectedExcludedCount: authOnlyAccounts.length,
      canonicalLeakCount: authOnlyCanonicalLeakCount,
    },
    households: {
      expected: 0,
      actual: householdRows.length,
      deferred: true,
    },
    verified,
  };

  const suffix = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath =
    options.reportPath ||
    'reports/wave1-identity-verify-' + suffix + '.json';
  const absolute = path.resolve(process.cwd(), reportPath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('\n=== Wave 1 Identity VERIFY ===');
  console.log('People: ' + actualCounts.people + '/' + CANONICAL_BASELINE.people);
  console.log('Auth identities: ' + actualCounts.authIdentities + '/' + CANONICAL_BASELINE.authIdentities);
  console.log('Role assignments: ' + actualCounts.roleAssignments + '/' + CANONICAL_BASELINE.roleAssignments);
  console.log('Learner profiles: ' + actualCounts.learnerProfiles + '/' + CANONICAL_BASELINE.learnerProfiles);
  console.log('Guardian relationships: ' + actualCounts.guardianRelationships + '/' + CANONICAL_BASELINE.guardianRelationships);
  console.log('Organisations: ' + actualCounts.organisations + '/' + CANONICAL_BASELINE.organisations);
  console.log('Organisation memberships: ' + actualCounts.organisationMemberships + '/' + CANONICAL_BASELINE.organisationMemberships);
  console.log('Households: ' + actualCounts.households + '/0 (deferred)');
  console.log('Expected documents: ' + expectedModel.documents.size + '; matched: ' + matched + '; missing: ' + missing + '; unexpected: ' + unexpected);
  console.log('Semantic mismatches: ' + semanticResult.total);
  console.log('Broken/reference invariant issues: ' + referenceResult.total);
  console.log('Blocking source-model issues: ' + expectedModel.issues.blockingTotal);
  console.log('Auth-only accounts excluded: ' + authOnlyAccounts.length + '; canonical leaks: ' + authOnlyCanonicalLeakCount);
  console.log('Source baseline unchanged: ' + sourceBaselineMatches);
  console.log('Canonical baseline exact: ' + canonicalBaselineMatches);
  console.log('VERIFIED: ' + verified);
  console.log('Writes performed: 0');
  console.log('Report: ' + reportPath + '\n');

  if (!verified) process.exitCode = 2;
}

main().catch((error) => {
  console.error(
    'Wave 1 identity verification failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
