import assert from 'node:assert/strict';
import test from 'node:test';

import {
  accessRecordMatches,
  buildAccessBackfillPlan,
  classifyAccessRecord,
  normalizeAccessRecord,
  privacyToken,
} from '../migrations/wave1-auth-access-read-model-backfill-lib.mjs';

function record(overrides = {}) {
  return {
    schemaVersion: 1,
    authority: 'canonical-derived',
    firebaseUid: 'uid-1',
    personId: 'person-1',
    personStatus: 'active',
    authStatus: 'active',
    accessActive: true,
    globalRoles: ['parent'],
    schoolAdminOrganisationIds: [],
    sourceAuthIdentityId: 'auth-1',
    ...overrides,
  };
}

test('normalization ignores timestamp noise and sorts list fields', () => {
  const normalized =
    normalizeAccessRecord({
      ...record(),
      globalRoles: [
        'teacher',
        'parent',
        'teacher',
      ],
      updatedAt: { seconds: 123 },
    });

  assert.deepEqual(
    normalized.globalRoles,
    ['parent', 'teacher'],
  );
  assert.equal(
    Object.hasOwn(
      normalized,
      'updatedAt',
    ),
    false,
  );
});

test('matching compares only the read-model contract fields', () => {
  assert.equal(
    accessRecordMatches(
      {
        ...record(),
        updatedAt: 'old',
        unrelated: 'ignored',
      },
      {
        ...record(),
        updatedAt: 'new',
      },
    ),
    true,
  );
});

test('classification distinguishes create, unchanged, update and ownership conflicts', () => {
  assert.equal(
    classifyAccessRecord({
      firebaseUid: 'uid-1',
      expected: record(),
      existing: null,
    }).state,
    'create',
  );

  assert.equal(
    classifyAccessRecord({
      firebaseUid: 'uid-1',
      expected: record(),
      existing: record(),
    }).state,
    'unchanged',
  );

  assert.equal(
    classifyAccessRecord({
      firebaseUid: 'uid-1',
      expected: record({
        accessActive: false,
      }),
      existing: record(),
    }).state,
    'update',
  );

  assert.deepEqual(
    classifyAccessRecord({
      firebaseUid: 'uid-1',
      expected: record(),
      existing: {
        ...record(),
        authority: 'foreign',
      },
    }),
    {
      state: 'conflict',
      reason:
        'existing_document_not_canonical_derived',
    },
  );

  assert.deepEqual(
    classifyAccessRecord({
      firebaseUid: 'uid-1',
      expected: record(),
      existing: {
        ...record(),
        firebaseUid: 'uid-2',
      },
    }),
    {
      state: 'conflict',
      reason:
        'existing_firebase_uid_mismatch',
    },
  );
});

test('plan reports create/update/unchanged without raw IDs in samples', () => {
  const expected = new Map([
    ['uid-1', record()],
    [
      'uid-2',
      record({
        firebaseUid: 'uid-2',
        personId: 'person-2',
      }),
    ],
    [
      'uid-3',
      record({
        firebaseUid: 'uid-3',
        personId: 'person-3',
        accessActive: false,
      }),
    ],
  ]);
  const existing = new Map([
    ['uid-1', record()],
    [
      'uid-3',
      record({
        firebaseUid: 'uid-3',
        personId: 'person-3',
        accessActive: true,
      }),
    ],
  ]);

  const plan = buildAccessBackfillPlan({
    expectedByUid: expected,
    existingByUid: existing,
  });

  assert.deepEqual(
    plan.counts,
    {
      expected: 3,
      existing: 2,
      create: 1,
      update: 1,
      unchanged: 1,
      conflict: 0,
      unexpected: 0,
      pendingWrites: 2,
      blockingIssues: 0,
    },
  );
  assert.equal(plan.readyForWrite, true);
  assert.equal(plan.reconciled, false);
  assert.equal(
    JSON.stringify(plan.samples)
      .includes('uid-2'),
    false,
  );
});

test('unexpected and conflicting documents block write mode', () => {
  const expected = new Map([
    ['uid-1', record()],
  ]);
  const existing = new Map([
    [
      'uid-1',
      {
        ...record(),
        authority: 'foreign',
      },
    ],
    [
      'uid-extra',
      record({
        firebaseUid: 'uid-extra',
        personId: 'person-extra',
      }),
    ],
  ]);

  const plan = buildAccessBackfillPlan({
    expectedByUid: expected,
    existingByUid: existing,
  });

  assert.equal(
    plan.counts.conflict,
    1,
  );
  assert.equal(
    plan.counts.unexpected,
    1,
  );
  assert.equal(
    plan.readyForWrite,
    false,
  );
  assert.equal(
    plan.counts.blockingIssues,
    2,
  );
});

test('a fully matching state reconciles cleanly', () => {
  const expected = new Map([
    ['uid-1', record()],
  ]);
  const existing = new Map([
    ['uid-1', record()],
  ]);

  const plan = buildAccessBackfillPlan({
    expectedByUid: expected,
    existingByUid: existing,
  });

  assert.equal(plan.reconciled, true);
  assert.equal(
    plan.counts.pendingWrites,
    0,
  );
});

test('privacy token is deterministic and does not expose the source value', () => {
  const one = privacyToken(
    'uid',
    'sensitive-id',
  );
  const two = privacyToken(
    'uid',
    'sensitive-id',
  );

  assert.equal(one, two);
  assert.match(one, /^[a-f0-9]{12}$/);
  assert.notEqual(
    one,
    'sensitive-id',
  );
});
