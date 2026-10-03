import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const contracts = require(
  '../../functions/lib/schoolOS/identity/contracts.js',
);
const ids = require(
  '../../functions/lib/schoolOS/identity/idStrategy.js',
);
const planner = require(
  '../../functions/lib/schoolOS/identity/legacyPlanner.js',
);

test('existing auth-backed person ID preserves verified users document ID', () => {
  assert.equal(
    ids.adoptExistingUserPersonId({
      documentId: 'uid-123',
      uid: 'uid-123',
      userId: 'uid-123',
    }),
    'uid-123',
  );

  assert.throws(
    () =>
      ids.adoptExistingUserPersonId({
        documentId: 'uid-123',
        uid: 'different',
        userId: 'uid-123',
      }),
    /documentId\/uid mismatch/,
  );
});

test('deterministic canonical relationship IDs are stable and namespaced', () => {
  const first = ids.buildAuthIdentityId('firebase', 'uid-123');
  const second = ids.buildAuthIdentityId('firebase', 'uid-123');
  const other = ids.buildAuthIdentityId('firebase', 'uid-456');

  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.match(first, /^auth_[a-f0-9]{32}$/);

  const role = ids.buildRoleAssignmentId({
    personId: 'uid-123',
    role: 'parent',
    scopeType: 'global',
  });
  assert.match(role, /^role_[a-f0-9]{32}$/);

  assert.throws(
    () =>
      ids.buildRoleAssignmentId({
        personId: 'uid-123',
        role: 'schoolAdmin',
        scopeType: 'organisation',
      }),
    /scopeId is required/,
  );
});

test('parent user expansion plans Person, AuthIdentity and global RoleAssignment', () => {
  const result = planner.planLegacyUserExpansion({
    documentId: 'parent-1',
    uid: 'parent-1',
    userId: 'parent-1',
    role: 'parent',
    roles: ['parent'],
    status: 'active',
  });

  assert.equal(result.conflicts.length, 0);
  assert.deepEqual(
    result.documents.map((doc) => doc.kind).sort(),
    ['authIdentity', 'person', 'roleAssignment'],
  );
  assert.equal(
    result.documents.find((doc) => doc.kind === 'person')?.documentId,
    'parent-1',
  );
});

test('schoolAdmin role is not promoted to an unscoped global assignment', () => {
  const result = planner.planLegacyUserExpansion({
    documentId: 'school-user-1',
    uid: 'school-user-1',
    userId: 'school-user-1',
    role: 'schoolAdmin',
    roles: ['schoolAdmin'],
    status: 'active',
  });

  assert.equal(
    result.documents.some((doc) => doc.kind === 'roleAssignment'),
    false,
  );
  assert.equal(
    result.conflicts.some(
      (item) =>
        item.code === 'school_admin_role_requires_organisation_scope' &&
        item.blocksBackfill === false,
    ),
    true,
  );
});

test('learner expansion preserves kid ID and creates guardian relationships', () => {
  const result = planner.planLegacyKidExpansion({
    documentId: 'kid-1',
    primaryParentId: 'parent-1',
    parentId: 'parent-1',
    parentIds: ['parent-1', 'parent-2'],
    status: 'active',
  });

  assert.equal(result.conflicts.length, 0);
  assert.equal(
    result.documents.filter((doc) => doc.kind === 'person').length,
    1,
  );
  assert.equal(
    result.documents.filter((doc) => doc.kind === 'learnerProfile').length,
    1,
  );
  assert.equal(
    result.documents.filter(
      (doc) => doc.kind === 'guardianRelationship',
    ).length,
    2,
  );
  assert.equal(
    result.documents.find((doc) => doc.kind === 'person')?.documentId,
    'kid-1',
  );
});

test('guardian source disagreement blocks automatic backfill', () => {
  const result = planner.planLegacyKidExpansion({
    documentId: 'kid-1',
    primaryParentId: 'parent-1',
    parentId: 'parent-2',
    parentIds: ['parent-1', 'parent-2'],
    status: 'active',
  });

  assert.equal(
    result.conflicts.some(
      (item) =>
        item.code === 'kid_primary_parent_legacy_parent_mismatch' &&
        item.blocksBackfill,
    ),
    true,
  );
});

test('school membership creates scoped membership and role assignment', () => {
  const result = planner.planLegacySchoolUserExpansion({
    documentId: 'school-user-1',
    userId: 'school-user-1',
    role: 'schoolAdmin',
    schoolIds: ['school-1'],
    primarySchoolId: 'school-1',
    status: 'active',
  });

  assert.equal(result.conflicts.length, 0);
  assert.equal(
    result.documents.filter(
      (doc) => doc.kind === 'organisationMembership',
    ).length,
    1,
  );
  const role = result.documents.find(
    (doc) => doc.kind === 'roleAssignment',
  );
  assert.equal(role?.scopeType, 'organisation');
  assert.equal(role?.scopeId, 'school-1');
});

test('canonical identity collection names are frozen for Wave 1 expand', () => {
  assert.deepEqual(contracts.IDENTITY_COLLECTIONS, {
    people: 'people',
    authIdentities: 'authIdentities',
    roleAssignments: 'roleAssignments',
    learnerProfiles: 'learnerProfiles',
    guardianRelationships: 'guardianRelationships',
    households: 'households',
    organisations: 'organisations',
    organisationMemberships: 'organisationMemberships',
  });
});
