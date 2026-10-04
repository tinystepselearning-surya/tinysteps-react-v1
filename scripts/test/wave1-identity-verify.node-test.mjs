import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CANONICAL_BASELINE,
  SOURCE_BASELINE,
  compareCanonicalDocument,
  countExpectedByCollection,
  deriveExpectedIdentityModel,
  expectedAuthIdentityId,
  expectedGuardianRelationshipId,
  expectedOrganisationMembershipId,
  expectedRoleAssignmentId,
  verifyReferences,
} from '../verification/wave1-identity-verify-lib.mjs';

function sourceFixture() {
  return {
    users: [
      {
        id: 'parent-1',
        data: {
          uid: 'parent-1',
          userId: 'parent-1',
          displayName: 'Parent One',
          role: 'parent',
          roles: ['parent'],
          status: 'active',
        },
      },
      {
        id: 'school-admin-1',
        data: {
          uid: 'school-admin-1',
          userId: 'school-admin-1',
          displayName: 'School Admin',
          role: 'schoolAdmin',
          roles: ['schoolAdmin'],
          status: 'active',
        },
      },
    ],
    kids: [
      {
        id: 'kid-1',
        data: {
          fullName: 'Kid One',
          age: 8,
          countryCode: 'IN',
          status: 'active',
          parentId: 'parent-1',
          parentIds: ['parent-1'],
          primaryParentId: 'parent-1',
        },
      },
    ],
    schools: [
      {
        id: 'school-1',
        data: {
          name: 'School One',
          schoolCode: 'TS-SCHOOL',
          status: 'active',
        },
      },
    ],
    schoolUsers: [
      {
        id: 'school-admin-1',
        data: {
          userId: 'school-admin-1',
          role: 'schoolAdmin',
          schoolIds: ['school-1'],
          primarySchoolId: 'school-1',
          status: 'active',
        },
      },
    ],
    authUsers: [
      { uid: 'parent-1', disabled: false, displayName: 'Parent Auth' },
      { uid: 'school-admin-1', disabled: false, displayName: 'Admin Auth' },
      { uid: 'orphan-auth', disabled: false, displayName: 'Orphan' },
    ],
  };
}

test('production verification baselines are frozen to completed backfill evidence', () => {
  assert.deepEqual(SOURCE_BASELINE, {
    users: 223,
    firebaseAuthUsers: 225,
    kids: 194,
    schools: 1,
    schoolUsers: 1,
  });
  assert.deepEqual(CANONICAL_BASELINE, {
    people: 417,
    authIdentities: 223,
    roleAssignments: 223,
    learnerProfiles: 194,
    guardianRelationships: 194,
    organisations: 1,
    organisationMemberships: 1,
    households: 0,
  });
});

test('independent deterministic identity IDs are stable and scoped', () => {
  assert.equal(
    expectedAuthIdentityId('uid-1'),
    expectedAuthIdentityId('uid-1'),
  );
  assert.notEqual(
    expectedAuthIdentityId('uid-1'),
    expectedAuthIdentityId('uid-2'),
  );
  assert.match(expectedAuthIdentityId('uid-1'), /^auth_[a-f0-9]{32}$/);
  assert.match(
    expectedRoleAssignmentId({
      personId: 'p1',
      role: 'parent',
      scopeType: 'global',
    }),
    /^role_[a-f0-9]{32}$/,
  );
  assert.match(
    expectedGuardianRelationshipId({
      guardianPersonId: 'p1',
      learnerPersonId: 'k1',
    }),
    /^guardian_[a-f0-9]{32}$/,
  );
  assert.match(
    expectedOrganisationMembershipId({
      organisationId: 's1',
      personId: 'p1',
    }),
    /^orgmem_[a-f0-9]{32}$/,
  );
});

test('source model derives the expected identity graph independently', () => {
  const model = deriveExpectedIdentityModel(sourceFixture());
  assert.equal(model.issues.blockingTotal, 0);
  assert.equal(model.authOnlyUsers.length, 1);

  const counts = countExpectedByCollection(model.documents);
  assert.deepEqual(counts, {
    people: 3,
    authIdentities: 2,
    roleAssignments: 2,
    learnerProfiles: 1,
    guardianRelationships: 1,
    organisations: 1,
    organisationMemberships: 1,
  });

  const kid = model.documents.get('people/kid-1');
  assert.equal(kid.expectedData.kind, 'learner');
  assert.equal(kid.expectedData.displayName, 'Kid One');

  const guardianId = expectedGuardianRelationshipId({
    guardianPersonId: 'parent-1',
    learnerPersonId: 'kid-1',
  });
  const guardian = model.documents.get(
    'guardianRelationships/' + guardianId,
  );
  assert.equal(guardian.expectedData.isPrimary, true);

  const adminRoles = [...model.documents.values()].filter(
    (item) =>
      item.collection === 'roleAssignments' &&
      item.expectedData.personId === 'school-admin-1',
  );
  assert.equal(adminRoles.length, 1);
  assert.equal(adminRoles[0].expectedData.role, 'schoolAdmin');
  assert.equal(adminRoles[0].expectedData.scopeType, 'organisation');
  assert.equal(adminRoles[0].expectedData.scopeId, 'school-1');
});

test('source contradictions block independent verification', () => {
  const fixture = sourceFixture();
  fixture.kids[0].data.primaryParentId = 'parent-2';
  const model = deriveExpectedIdentityModel(fixture);
  assert.ok(model.issues.blockingTotal > 0);
  assert.ok(
    model.issues.byCode.source_kid_primary_not_in_parent_ids > 0 ||
    model.issues.byCode.source_kid_primary_legacy_parent_mismatch > 0,
  );
});

test('canonical comparison requires timestamps and catches semantic drift', () => {
  const expected = {
    schemaVersion: 1,
    personId: 'p1',
    kind: 'adult',
    status: 'active',
    displayName: 'Person One',
    createdBy: 'migration:wave1-identity-foundation-v1',
    updatedBy: 'migration:wave1-identity-foundation-v1',
    migration: {
      migrationId: 'wave1-identity-foundation-v1',
      sourceCollection: 'users',
      sourceId: 'p1',
      sourceFieldVersion: null,
    },
  };
  const timestamp = { toMillis: () => 123 };
  assert.deepEqual(
    compareCanonicalDocument(
      { ...expected, createdAt: timestamp, updatedAt: timestamp },
      expected,
    ),
    [],
  );
  assert.deepEqual(
    compareCanonicalDocument(expected, expected),
    ['createdAt', 'updatedAt'],
  );
  assert.ok(
    compareCanonicalDocument(
      {
        ...expected,
        displayName: 'Wrong',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      expected,
    ).includes('displayName'),
  );
});

test('reference verifier detects orphaned and unscoped canonical relations', () => {
  const actual = {
    people: new Map([
      ['kid-1', { personId: 'kid-1', kind: 'learner' }],
    ]),
    organisations: new Map(),
    authIdentities: new Map([
      ['auth-x', {
        authIdentityId: 'auth-x',
        personId: 'missing',
        provider: 'firebase',
        providerSubject: 'uid-missing',
      }],
    ]),
    roleAssignments: new Map([
      ['role-x', {
        roleAssignmentId: 'role-x',
        personId: 'missing',
        role: 'schoolAdmin',
        scopeType: 'global',
        scopeId: null,
      }],
    ]),
    learnerProfiles: new Map([
      ['kid-1', { learnerProfileId: 'kid-1', personId: 'kid-1' }],
    ]),
    guardianRelationships: new Map([
      ['g-x', {
        guardianRelationshipId: 'g-x',
        guardianPersonId: 'missing',
        learnerPersonId: 'kid-1',
        relationshipType: 'parent',
      }],
    ]),
    organisationMemberships: new Map(),
  };

  const issues = verifyReferences(actual, []);
  const codes = new Set(issues.map((item) => item.code));
  assert.ok(codes.has('auth_identity_missing_person'));
  assert.ok(codes.has('auth_identity_provider_subject_invalid'));
  assert.ok(codes.has('role_assignment_missing_person'));
  assert.ok(codes.has('school_admin_role_not_organisation_scoped'));
  assert.ok(codes.has('guardian_relationship_missing_guardian'));
});

test('production verifier source is read-only by construction', () => {
  const source = readFileSync(
    'scripts/wave1-identity-foundation-verify.mjs',
    'utf8',
  );

  // Allowlist the only Firestore/Auth member calls used by the verifier.
  assert.equal(source.split('db.').length - 1, 2);
  assert.equal(source.split('db.collection(').length - 1, 2);
  assert.equal(source.split('ref.').length - 1, 1);
  assert.equal(source.includes('ref.get()'), true);
  assert.equal(source.split('auth.').length - 1, 1);
  assert.equal(source.includes('auth.listUsers('), true);
  assert.equal(source.includes('FieldValue'), false);
  assert.equal(source.includes('writesPerformed: 0'), true);
});
