import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_RECORDS_PER_RUN,
  MAX_WRITES_PER_BATCH,
  MIGRATION_ID,
  SOURCE_COLLECTION_ORDER,
  advanceCheckpoint,
  buildExpectedCanonicalData,
  canonicalDocumentsMatch,
  classifyTarget,
  initialCheckpoint,
  partitionRecordsByWrites,
  validateCheckpoint,
} from '../migrations/wave1-identity-backfill-lib.mjs';

const migration = (collection, sourceId) => ({
  migrationId: MIGRATION_ID,
  sourceCollection: collection,
  sourceId,
  sourceFieldVersion: null,
});

test('backfill safety limits remain bounded', () => {
  assert.equal(MAX_WRITES_PER_BATCH, 100);
  assert.equal(MAX_RECORDS_PER_RUN, 250);
  assert.deepEqual(
    SOURCE_COLLECTION_ORDER,
    ['users', 'kids', 'schools', 'schoolUsers'],
  );
});

test('materializes an auth-backed parent into canonical Person data', () => {
  const expected = buildExpectedCanonicalData({
    plannedDocument: {
      kind: 'person',
      collection: 'people',
      documentId: 'parent-1',
      personId: 'parent-1',
    },
    sourceCollection: 'users',
    sourceId: 'parent-1',
    sourceData: {
      uid: 'parent-1',
      role: 'parent',
      roles: ['parent'],
      displayName: 'Parent One',
      status: 'active',
    },
    authUser: {
      uid: 'parent-1',
      disabled: false,
      displayName: 'Auth Parent',
    },
  });

  assert.deepEqual(expected, {
    schemaVersion: 1,
    createdBy: 'migration:wave1-identity-foundation-v1',
    updatedBy: 'migration:wave1-identity-foundation-v1',
    migration: migration('users', 'parent-1'),
    personId: 'parent-1',
    kind: 'adult',
    status: 'active',
    displayName: 'Parent One',
  });
});

test('legacy missing person status maps to active without inventing identity', () => {
  const expected = buildExpectedCanonicalData({
    plannedDocument: {
      kind: 'person',
      collection: 'people',
      documentId: 'teacher-1',
      personId: 'teacher-1',
    },
    sourceCollection: 'users',
    sourceId: 'teacher-1',
    sourceData: {
      role: 'teacher',
      displayName: 'Teacher One',
    },
    authUser: {
      uid: 'teacher-1',
      disabled: false,
    },
  });

  assert.equal(expected.status, 'active');
  assert.equal(expected.personId, 'teacher-1');
});

test('unsupported person status fails closed', () => {
  assert.throws(() => buildExpectedCanonicalData({
    plannedDocument: {
      kind: 'person',
      collection: 'people',
      documentId: 'parent-1',
      personId: 'parent-1',
    },
    sourceCollection: 'users',
    sourceId: 'parent-1',
    sourceData: {
      role: 'parent',
      displayName: 'Parent One',
      status: 'mystery',
    },
    authUser: {
      uid: 'parent-1',
      disabled: false,
    },
  }), /Unsupported person status/);
});

test('auth identity requires exact Firebase UID and reflects disabled state', () => {
  const plannedDocument = {
    kind: 'authIdentity',
    collection: 'authIdentities',
    documentId: 'auth-1',
    personId: 'parent-1',
  };

  const expected = buildExpectedCanonicalData({
    plannedDocument,
    sourceCollection: 'users',
    sourceId: 'parent-1',
    sourceData: { status: 'active' },
    authUser: {
      uid: 'parent-1',
      disabled: true,
    },
  });

  assert.equal(expected.provider, 'firebase');
  assert.equal(expected.providerSubject, 'parent-1');
  assert.equal(expected.status, 'disabled');

  assert.throws(() => buildExpectedCanonicalData({
    plannedDocument,
    sourceCollection: 'users',
    sourceId: 'parent-1',
    sourceData: { status: 'active' },
    authUser: {
      uid: 'different-user',
      disabled: false,
    },
  }), /UID does not match Person ID/);
});

test('learner Person and LearnerProfile preserve kid identity and explicit fields', () => {
  const sourceData = {
    fullName: 'Learner One',
    age: 8,
    countryCode: 'IN',
    status: 'active',
    primaryParentId: 'parent-1',
    parentIds: ['parent-1'],
  };

  const person = buildExpectedCanonicalData({
    plannedDocument: {
      kind: 'person',
      collection: 'people',
      documentId: 'kid-1',
      personId: 'kid-1',
    },
    sourceCollection: 'kids',
    sourceId: 'kid-1',
    sourceData,
  });
  const profile = buildExpectedCanonicalData({
    plannedDocument: {
      kind: 'learnerProfile',
      collection: 'learnerProfiles',
      documentId: 'kid-1',
      personId: 'kid-1',
    },
    sourceCollection: 'kids',
    sourceId: 'kid-1',
    sourceData,
  });

  assert.equal(person.personId, 'kid-1');
  assert.equal(person.kind, 'learner');
  assert.equal(person.displayName, 'Learner One');
  assert.equal(profile.learnerProfileId, 'kid-1');
  assert.equal(profile.personId, 'kid-1');
  assert.equal(profile.ageYears, 8);
  assert.equal(profile.countryCode, 'IN');
});

test('guardian relationship uses verified parent source and primary marker', () => {
  const expected = buildExpectedCanonicalData({
    plannedDocument: {
      kind: 'guardianRelationship',
      collection: 'guardianRelationships',
      documentId: 'guardian-1',
      personId: 'kid-1',
      relatedPersonId: 'parent-1',
    },
    sourceCollection: 'kids',
    sourceId: 'kid-1',
    sourceData: {
      status: 'active',
      primaryParentId: 'parent-1',
      parentId: 'parent-1',
      parentIds: ['parent-1', 'parent-2'],
    },
  });

  assert.equal(expected.guardianPersonId, 'parent-1');
  assert.equal(expected.learnerPersonId, 'kid-1');
  assert.equal(expected.relationshipType, 'parent');
  assert.equal(expected.isPrimary, true);
  assert.equal(expected.status, 'active');
});

test('school materialization preserves school ID, name, status and legacy code', () => {
  const expected = buildExpectedCanonicalData({
    plannedDocument: {
      kind: 'organisation',
      collection: 'organisations',
      documentId: 'school-1',
      organisationId: 'school-1',
    },
    sourceCollection: 'schools',
    sourceId: 'school-1',
    sourceData: {
      name: 'Tiny Steps School',
      schoolCode: 'TS-ABC',
      status: 'active',
    },
  });

  assert.equal(expected.organisationId, 'school-1');
  assert.equal(expected.type, 'school');
  assert.equal(expected.name, 'Tiny Steps School');
  assert.equal(expected.legacySchoolCode, 'TS-ABC');
});

test('school membership remains organisation scoped and primary when verified', () => {
  const membership = buildExpectedCanonicalData({
    plannedDocument: {
      kind: 'organisationMembership',
      collection: 'organisationMemberships',
      documentId: 'membership-1',
      organisationId: 'school-1',
      personId: 'school-admin-1',
      role: 'schoolAdmin',
    },
    sourceCollection: 'schoolUsers',
    sourceId: 'school-admin-1',
    sourceData: {
      role: 'schoolAdmin',
      schoolIds: ['school-1'],
      primarySchoolId: 'school-1',
      status: 'active',
    },
  });

  const role = buildExpectedCanonicalData({
    plannedDocument: {
      kind: 'roleAssignment',
      collection: 'roleAssignments',
      documentId: 'role-1',
      organisationId: 'school-1',
      personId: 'school-admin-1',
      role: 'schoolAdmin',
      scopeType: 'organisation',
      scopeId: 'school-1',
    },
    sourceCollection: 'schoolUsers',
    sourceId: 'school-admin-1',
    sourceData: {
      role: 'schoolAdmin',
      schoolIds: ['school-1'],
      primarySchoolId: 'school-1',
      status: 'active',
    },
  });

  assert.equal(membership.organisationId, 'school-1');
  assert.equal(membership.isPrimary, true);
  assert.equal(role.scopeType, 'organisation');
  assert.equal(role.scopeId, 'school-1');
});

test('canonical comparison ignores audit timestamps but not semantic drift', () => {
  const expected = {
    schemaVersion: 1,
    personId: 'p1',
    displayName: 'Name',
    migration: migration('users', 'p1'),
  };
  const existing = {
    ...expected,
    createdAt: { seconds: 1 },
    updatedAt: { seconds: 2 },
  };

  assert.equal(canonicalDocumentsMatch(existing, expected), true);
  assert.equal(classifyTarget(existing, expected), 'unchanged');
  assert.equal(
    classifyTarget({ ...existing, displayName: 'Other' }, expected),
    'update',
  );
  assert.equal(
    classifyTarget({
      ...existing,
      displayName: 'Other',
      migration: migration('users', 'different'),
    }, expected),
    'conflict',
  );
  assert.equal(classifyTarget(null, expected), 'create');
});

test('write partition never splits a source record or exceeds 100 writes', () => {
  const records = [
    { id: 'a', writeCount: 60 },
    { id: 'b', writeCount: 40 },
    { id: 'c', writeCount: 1 },
    { id: 'd', writeCount: 99 },
  ];

  const groups = partitionRecordsByWrites(records, 100);
  assert.deepEqual(
    groups.map((group) => group.map((record) => record.id)),
    [['a', 'b'], ['c', 'd']],
  );
  assert.throws(
    () => partitionRecordsByWrites([{ id: 'x', writeCount: 101 }], 100),
    /exceeds the write batch limit/,
  );
});

test('checkpoint is project-bound, resumable and completes in source order', () => {
  const checkpoint = initialCheckpoint('tinysteps-react-v1');
  validateCheckpoint(checkpoint, 'tinysteps-react-v1');
  assert.throws(
    () => validateCheckpoint(checkpoint, 'wrong-project'),
    /projectId mismatch/,
  );

  const afterUsers = advanceCheckpoint(
    checkpoint,
    [{
      collection: 'users',
      id: 'u2',
      indexInCollection: 1,
    }],
    {
      users: 2,
      kids: 1,
      schools: 1,
      schoolUsers: 1,
    },
  );

  assert.equal(afterUsers.cursors.users, 'u2');
  assert.deepEqual(afterUsers.completedCollections, ['users']);
  assert.equal(afterUsers.completed, false);

  const done = advanceCheckpoint(
    {
      ...afterUsers,
      completedCollections: ['users', 'kids', 'schools'],
      cursors: {
        ...afterUsers.cursors,
        kids: 'k1',
        schools: 's1',
      },
    },
    [{
      collection: 'schoolUsers',
      id: 'su1',
      indexInCollection: 0,
    }],
    {
      users: 2,
      kids: 1,
      schools: 1,
      schoolUsers: 1,
    },
  );

  assert.equal(done.completed, true);
});
