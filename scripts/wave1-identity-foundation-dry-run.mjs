#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const require = createRequire(import.meta.url);
const planner = require('../functions/lib/schoolOS/identity/legacyPlanner.js');
const contracts = require('../functions/lib/schoolOS/identity/contracts.js');

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  'tinysteps-react-v1';

const REPORT_PATH =
  process.env.WAVE1_IDENTITY_REPORT ||
  'reports/wave1-identity-foundation-dry-run.json';

const SAMPLE_SIZE = 20;

function token(value) {
  return createHash('sha256')
    .update(String(value || ''), 'utf8')
    .digest('hex')
    .slice(0, 12);
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function row(doc) {
  return {
    id: doc.id,
    path: doc.ref.path,
    data: doc.data() || {},
  };
}

async function readCollection(db, name, fields = []) {
  const ref = fields.length
    ? db.collection(name).select(...fields)
    : db.collection(name);
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
      disabled: user.disabled,
      roleHint: extractAuthRoleHint(user.customClaims || {}),
    })));
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

function makeIssueCollector(sampleSize = SAMPLE_SIZE) {
  const counts = {};
  const blockingCounts = {};
  const samples = {};

  return {
    add(code, sourcePath, fields = [], blocksBackfill = false) {
      counts[code] = (counts[code] || 0) + 1;
      if (blocksBackfill) {
        blockingCounts[code] = (blockingCounts[code] || 0) + 1;
      }
      if (!samples[code]) samples[code] = [];
      if (samples[code].length >= sampleSize) return;
      samples[code].push({
        sourceToken: token(sourcePath),
        sourceKind: String(sourcePath || '').split('/')[0] || 'unknown',
        fields: [...new Set(fields)].sort(),
        blocksBackfill: Boolean(blocksBackfill),
      });
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
          Object.entries(blockingCounts).sort(([a], [b]) => a.localeCompare(b)),
        ),
        samples: Object.fromEntries(
          Object.entries(samples).sort(([a], [b]) => a.localeCompare(b)),
        ),
      };
    },
  };
}

function addPlannerResult(result, plannedDocuments, issues) {
  for (const document of result.documents) {
    plannedDocuments.push(document);
  }
  for (const conflict of result.conflicts) {
    issues.add(
      conflict.code,
      conflict.sourcePath,
      conflict.fields,
      conflict.blocksBackfill,
    );
  }
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item) || '(missing)';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function expectedRoleMirrorCollection(role) {
  switch (role) {
    case 'parent':
      return 'parents';
    case 'teacher':
      return 'teachers';
    case 'learningPartner':
      return 'learningPartners';
    case 'admin':
      return 'admins';
    default:
      return null;
  }
}

function normalizeRole(value) {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  const map = {
    admin: 'admin',
    founder: 'founder',
    teacher: 'teacher',
    parent: 'parent',
    kid: 'kid',
    learningpartner: 'learningPartner',
    'learning-partner': 'learningPartner',
    schooladmin: 'schoolAdmin',
    'school-admin': 'schoolAdmin',
  };
  return map[key] || null;
}

function extractAuthRoleHint(claims) {
  const direct = normalizeRole(claims?.role) || normalizeRole(claims?.rawRole);
  if (direct) return direct;

  const candidates = [
    ['admin', 'admin'],
    ['founder', 'founder'],
    ['teacher', 'teacher'],
    ['parent', 'parent'],
    ['kid', 'kid'],
    ['learningPartner', 'learningPartner'],
    ['learning-partner', 'learningPartner'],
    ['schoolAdmin', 'schoolAdmin'],
    ['school-admin', 'schoolAdmin'],
  ];
  for (const [claimKey, role] of candidates) {
    if (claims?.[claimKey] === true) return role;
  }
  return null;
}

async function main() {
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }

  const db = getFirestore();
  const auth = getAuth();
  const targetCollectionNames = Object.values(contracts.IDENTITY_COLLECTIONS);

  const [
    users,
    kids,
    schools,
    schoolUsers,
    parents,
    teachers,
    learningPartners,
    admins,
    authUsers,
    ...targetCollections
  ] = await Promise.all([
    readCollection(db, 'users', [
      'uid',
      'userId',
      'role',
      'roles',
      'status',
    ]),
    readCollection(db, 'kids', [
      'parentId',
      'parentIds',
      'primaryParentId',
      'status',
    ]),
    readCollection(db, 'schools', [
      'status',
    ]),
    readCollection(db, 'schoolUsers', [
      'userId',
      'role',
      'schoolIds',
      'primarySchoolId',
      'status',
    ]),
    readCollection(db, 'parents', ['userId', 'status']),
    readCollection(db, 'teachers', ['userId', 'status']),
    readCollection(db, 'learningPartners', ['userId', 'status']),
    readCollection(db, 'admins', ['userId', 'status']),
    readAuthDirectory(auth),
    ...targetCollectionNames.map((name) =>
      readCollection(db, name, ['schemaVersion']),
    ),
  ]);

  const issues = makeIssueCollector();
  const plannedDocuments = [];

  const userIds = new Set(users.map((entry) => entry.id));
  const kidIds = new Set(kids.map((entry) => entry.id));
  const schoolIds = new Set(schools.map((entry) => entry.id));
  const authUidSet = new Set(authUsers.map((entry) => entry.uid));
  const authUsersByUid = new Map(authUsers.map((entry) => [entry.uid, entry]));

  const schoolUserPersonIds = new Set(
    schoolUsers.map((entry) => text(entry.data.userId) || entry.id),
  );

  const roleMirrorIds = {
    parents: new Set(parents.map((entry) => entry.id)),
    teachers: new Set(teachers.map((entry) => entry.id)),
    learningPartners: new Set(learningPartners.map((entry) => entry.id)),
    admins: new Set(admins.map((entry) => entry.id)),
  };

  for (const collisionId of userIds) {
    if (kidIds.has(collisionId)) {
      issues.add(
        'person_id_collision_user_and_kid',
        `users/${collisionId}`,
        ['documentId'],
        true,
      );
    }
  }

  const authClaimRoleComparisons = {
    authUsersWithRoleHint: 0,
    roleHintMatchesFirestoreRoleSet: 0,
    roleHintMismatch: 0,
    adminRoleHintMismatch: 0,
  };

  for (const user of users) {
    const data = user.data;
    const declaredUid = text(data.uid);
    const authUid = authUidSet.has(user.id)
      ? user.id
      : declaredUid && authUidSet.has(declaredUid)
        ? declaredUid
        : '';

    if (!authUid) {
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

    const userId = text(data.userId);
    if (userId && userId !== user.id) {
      issues.add(
        'user_declared_user_id_mismatch',
        user.path,
        ['userId'],
        true,
      );
    }

    addPlannerResult(
      planner.planLegacyUserExpansion({
        documentId: user.id,
        uid: authUid || declaredUid || null,
        userId: userId || null,
        role: data.role ?? null,
        roles: data.roles,
        status: data.status ?? null,
      }),
      plannedDocuments,
      issues,
    );

    const roles = [
      data.role,
      ...(Array.isArray(data.roles) ? data.roles : []),
    ]
      .map(normalizeRole)
      .filter(Boolean);

    const authDirectoryUser = authUsersByUid.get(user.id);
    const roleHint = authDirectoryUser?.roleHint || null;
    if (roleHint) {
      authClaimRoleComparisons.authUsersWithRoleHint += 1;
      if (new Set(roles).has(roleHint)) {
        authClaimRoleComparisons.roleHintMatchesFirestoreRoleSet += 1;
      } else {
        authClaimRoleComparisons.roleHintMismatch += 1;
        if (roleHint === 'admin') {
          authClaimRoleComparisons.adminRoleHintMismatch += 1;
        }
        issues.add(
          'auth_claim_role_not_in_firestore_roles',
          user.path,
          ['role', 'roles', 'authClaims'],
          roleHint === 'admin',
        );
      }
    }

    for (const role of new Set(roles)) {
      const mirrorCollection = expectedRoleMirrorCollection(role);
      if (
        mirrorCollection &&
        !roleMirrorIds[mirrorCollection].has(user.id)
      ) {
        issues.add(
          'role_assignment_source_missing_expected_mirror',
          user.path,
          ['role', 'roles'],
          false,
        );
      }

      if (
        role === 'schoolAdmin' &&
        !schoolUserPersonIds.has(user.id)
      ) {
        issues.add(
          'school_admin_missing_school_user_scope',
          user.path,
          ['role', 'roles'],
          true,
        );
      }
    }
  }

  const authOnlyAccounts = [];
  for (const authUser of authUsers) {
    if (!userIds.has(authUser.uid)) {
      issues.add(
        'auth_identity_without_user_document',
        `firebaseAuth/${authUser.uid}`,
        ['uid'],
        false,
      );

      const mirrorCollections = Object.entries(roleMirrorIds)
        .filter(([, ids]) => ids.has(authUser.uid))
        .map(([name]) => name)
        .sort();
      const schoolUserPresent = schoolUserPersonIds.has(authUser.uid);
      const learnerSourcePresent = kidIds.has(authUser.uid);
      const hasBusinessReference =
        mirrorCollections.length > 0 ||
        schoolUserPresent ||
        learnerSourcePresent;

      authOnlyAccounts.push({
        sourceToken: token(`firebaseAuth/${authUser.uid}`),
        disabled: Boolean(authUser.disabled),
        roleHint: authUser.roleHint || null,
        mirrorCollections,
        schoolUserPresent,
        learnerSourcePresent,
        disposition: hasBusinessReference
          ? 'auth_only_account_with_business_reference_requires_manual_mapping'
          : 'auth_orphan_excluded_from_person_backfill_pending_account_cleanup_review',
      });
    }
  }

  for (const kid of kids) {
    addPlannerResult(
      planner.planLegacyKidExpansion({
        documentId: kid.id,
        parentId: kid.data.parentId ?? null,
        parentIds: kid.data.parentIds,
        primaryParentId: kid.data.primaryParentId ?? null,
        status: kid.data.status ?? null,
      }),
      plannedDocuments,
      issues,
    );

    const parentRefs = [
      text(kid.data.primaryParentId),
      text(kid.data.parentId),
      ...(Array.isArray(kid.data.parentIds)
        ? kid.data.parentIds.map(text)
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
      planner.planLegacySchoolExpansion({
        documentId: school.id,
        status: school.data.status ?? null,
      }),
      plannedDocuments,
      issues,
    );
  }

  for (const schoolUser of schoolUsers) {
    addPlannerResult(
      planner.planLegacySchoolUserExpansion({
        documentId: schoolUser.id,
        userId: schoolUser.data.userId ?? null,
        role: schoolUser.data.role ?? null,
        schoolIds: schoolUser.data.schoolIds,
        primarySchoolId: schoolUser.data.primarySchoolId ?? null,
        status: schoolUser.data.status ?? null,
      }),
      plannedDocuments,
      issues,
    );

    const personId = text(schoolUser.data.userId) || schoolUser.id;
    if (!userIds.has(personId)) {
      issues.add(
        'organisation_membership_missing_person_source',
        schoolUser.path,
        ['userId'],
        true,
      );
    }

    const memberships = Array.isArray(schoolUser.data.schoolIds)
      ? schoolUser.data.schoolIds.map(text).filter(Boolean)
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

  const targetKeys = new Map();
  for (const document of plannedDocuments) {
    const key = `${document.collection}/${document.documentId}`;
    const existing = targetKeys.get(key);
    if (existing && existing.sourcePath !== document.sourcePath) {
      issues.add(
        'planned_target_document_collision',
        document.sourcePath,
        ['documentId'],
        true,
      );
    } else {
      targetKeys.set(key, document);
    }
  }

  const targetExistingCounts = Object.fromEntries(
    targetCollectionNames.map((name, index) => [
      name,
      targetCollections[index].length,
    ]),
  );

  for (const [collection, count] of Object.entries(targetExistingCounts)) {
    if (count > 0) {
      issues.add(
        'canonical_target_collection_not_empty_before_first_expand',
        `${collection}/*`,
        ['collection'],
        true,
      );
    }
  }

  const issueResult = issues.result();

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'wave1_identity_foundation_expand_dry_run',
    projectId: PROJECT_ID,
    source: process.env.FIRESTORE_EMULATOR_HOST
      ? 'firestore_emulator'
      : 'production_read_only',
    writesPerformed: 0,
    privacy: {
      namesRead: false,
      emailsRead: false,
      phonesRead: false,
      rawIdsInReport: false,
      sampleReferences: 'sha256 tokens only',
    },
    sourceCounts: {
      users: users.length,
      firebaseAuthUsers: authUsers.length,
      kids: kids.length,
      schools: schools.length,
      schoolUsers: schoolUsers.length,
      parents: parents.length,
      teachers: teachers.length,
      learningPartners: learningPartners.length,
      admins: admins.length,
    },
    sourceCoverage: {
      firestoreUsersBackedByFirebaseAuth: users.filter((entry) =>
        authUidSet.has(entry.id),
      ).length,
      firebaseAuthUsersBackedByFirestoreUser: authUsers.filter((entry) =>
        userIds.has(entry.uid),
      ).length,
      authOnlyAccounts: authOnlyAccounts.length,
      userKidDocumentIdCollisions: [...userIds]
        .filter((id) => kidIds.has(id))
        .length,
    },
    authOnlyAccounts,
    authClaimRoleComparisons,
    expectedTransformations: {
      organisationScopedSchoolAdminAssignments: schoolUsers.length,
      householdBackfillDeferred: true,
    },
    targetExistingCounts,
    planned: {
      totalDocuments: plannedDocuments.length,
      byCollection: countBy(
        plannedDocuments,
        (document) => document.collection,
      ),
      byKind: countBy(
        plannedDocuments,
        (document) => document.kind,
      ),
      households: {
        planned: 0,
        status: 'deferred',
        reason:
          'Wave 0 did not establish a safe one-household-per-parent inference. Household creation requires an explicit household-boundary rule; GuardianRelationship can migrate first.',
      },
    },
    issues: issueResult,
    backfillGate: {
      readyForBoundedBackfill:
        issueResult.blockingTotal === 0 &&
        Object.values(targetExistingCounts).every((count) => count === 0),
      blockingIssueCount: issueResult.blockingTotal,
      note:
        'This dry run does not authorize writes. A reviewed migration manifest and bounded write mode are required before BACKFILL.',
    },
  };

  const absoluteReport = path.resolve(process.cwd(), REPORT_PATH);
  await fs.mkdir(path.dirname(absoluteReport), { recursive: true });
  await fs.writeFile(
    absoluteReport,
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );

  console.log('\n=== Wave 1 Identity Foundation Expand Dry Run ===');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Users: ${report.sourceCounts.users}; Firebase Auth users: ${report.sourceCounts.firebaseAuthUsers}`);
  console.log(`Kids: ${report.sourceCounts.kids}; Schools: ${report.sourceCounts.schools}; School users: ${report.sourceCounts.schoolUsers}`);
  console.log(`User↔Auth direct UID coverage: ${report.sourceCoverage.firestoreUsersBackedByFirebaseAuth}/${report.sourceCounts.users}`);
  console.log(`Auth-only accounts excluded from Person backfill: ${report.sourceCoverage.authOnlyAccounts}`);
  console.log(`Auth claim role mismatches for current users: ${report.authClaimRoleComparisons.roleHintMismatch}; admin mismatches: ${report.authClaimRoleComparisons.adminRoleHintMismatch}`);
  console.log(`Planned canonical documents: ${report.planned.totalDocuments}`);
  console.log(`Planned by collection: ${JSON.stringify(report.planned.byCollection)}`);
  console.log(`Existing canonical target counts: ${JSON.stringify(report.targetExistingCounts)}`);
  console.log(`Issues: ${report.issues.total}; blocking: ${report.issues.blockingTotal}`);
  console.log(`Ready for bounded backfill review: ${report.backfillGate.readyForBoundedBackfill}`);
  console.log('Read-only dry run complete. No Firestore/Auth writes were performed.\n');
}

main().catch((error) => {
  console.error(
    'Wave 1 identity foundation dry run failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
