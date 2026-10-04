import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  aggregateCollectionFieldInventory,
  buildMirrorCoverage,
  buildRetirementInventory,
  classifyLegacyField,
  flattenFieldTypes,
} from '../migrations/wave1-identity-retirement-audit-lib.mjs';

test('flattens nested legacy field paths without exposing values', () => {
  const rows = flattenFieldTypes({
    displayName: 'Example',
    contact: {
      email: 'hidden@example.com',
      nested: { phone: '+10000000000' },
    },
    tags: ['a', 'b'],
  });

  assert.deepEqual(
    rows.map((row) => row.path),
    [
      'displayName',
      'contact',
      'contact.email',
      'contact.nested',
      'contact.nested.phone',
      'tags',
    ],
  );
  assert.equal(
    JSON.stringify(rows).includes('hidden@example.com'),
    false,
  );
  assert.equal(
    JSON.stringify(rows).includes('+10000000000'),
    false,
  );
});

test('classifies user identity as already canonical and contact as a migration blocker', () => {
  assert.deepEqual(
    classifyLegacyField('users', 'uid'),
    {
      category: 'canonical_identity',
      disposition: 'already_or_partially_canonical',
      target: 'people/authIdentities/roleAssignments',
      blocker: false,
    },
  );

  const email =
    classifyLegacyField('users', 'email');
  assert.equal(email.category, 'contact_profile');
  assert.equal(email.blocker, true);
  assert.match(email.target, /personContacts/);
});

test('classifies learner grade and legacy assignment aliases as retirement blockers', () => {
  const grade =
    classifyLegacyField('kids', 'grade');
  assert.equal(grade.category, 'learner_profile');
  assert.equal(grade.blocker, true);
  assert.match(grade.target, /learnerProfiles/);

  const teacher =
    classifyLegacyField('kids', 'teacherId');
  assert.equal(
    teacher.category,
    'operational_relationship',
  );
  assert.equal(teacher.blocker, true);

  const parent =
    classifyLegacyField('kids', 'parentId');
  assert.equal(
    parent.category,
    'guardian_relationship',
  );
  assert.equal(parent.blocker, false);
});

test('classifies school contact/location as requiring a permanent organisation profile', () => {
  for (const path of [
    'contact',
    'contact.email',
    'location.city',
  ]) {
    const result =
      classifyLegacyField('schools', path);
    assert.equal(
      result.category,
      'organisation_profile',
    );
    assert.equal(result.blocker, true);
  }
});

test('unknown fields fail retirement readiness closed', () => {
  const result =
    classifyLegacyField('users', 'mysteryField');
  assert.equal(result.category, 'unclassified');
  assert.equal(result.blocker, true);
  assert.equal(
    result.disposition,
    'must_map_before_retirement',
  );
});

test('aggregates field frequency and types without retaining field values', () => {
  const inventory =
    aggregateCollectionFieldInventory([
      {
        id: 'a',
        data: {
          status: 'active',
          score: 1,
        },
      },
      {
        id: 'b',
        data: {
          status: 'archived',
          score: null,
        },
      },
    ]);

  assert.deepEqual(
    inventory.find((row) => row.path === 'status'),
    {
      path: 'status',
      documentsPresent: 2,
      typeCounts: { string: 2 },
    },
  );

  assert.deepEqual(
    inventory.find((row) => row.path === 'score'),
    {
      path: 'score',
      documentsPresent: 2,
      typeCounts: {
        number: 1,
        null: 1,
      },
    },
  );
  assert.equal(
    JSON.stringify(inventory).includes('active'),
    false,
  );
});

test('role/profile mirror coverage is keyed only by document ID membership', () => {
  const users = [
    {
      id: 'parent-a',
      data: { role: 'parent' },
    },
    {
      id: 'teacher-a',
      data: { role: 'teacher' },
    },
    {
      id: 'founder-a',
      data: { role: 'founder' },
    },
  ];

  const coverage = buildMirrorCoverage(
    users,
    {
      parents: new Set(['parent-a']),
      teachers: new Set(),
      learningPartners: new Set(),
      admins: new Set(),
      students: new Set(),
    },
  );

  assert.equal(coverage.required, 2);
  assert.equal(coverage.present, 1);
  assert.equal(coverage.missing, 1);
  assert.equal(coverage.notApplicable, 1);
  assert.equal(
    coverage.missingSubjectTokens.length,
    1,
  );
  assert.match(
    coverage.missingSubjectTokens[0],
    /^[a-f0-9]{12}$/,
  );
});

test('retirement inventory remains blocked until every mandatory legacy field has a permanent target', () => {
  const result = buildRetirementInventory({
    legacyRowsByCollection: {
      users: [{
        id: 'parent-a',
        data: {
          uid: 'parent-a',
          role: 'parent',
          email: 'hidden@example.com',
        },
      }],
      kids: [],
      schools: [],
      schoolUsers: [],
    },
    profileRowsByCollection: {
      parents: [{ id: 'parent-a', data: {} }],
      teachers: [],
      learningPartners: [],
      admins: [],
      students: [],
    },
    canonicalCounts: {
      people: 1,
    },
  });

  assert.equal(
    result.blockers.retirementReady,
    false,
  );
  assert.equal(
    result.blockers.missingRoleMirrors,
    0,
  );
  assert.ok(
    result.blockingFields.some(
      (item) =>
        item.collection === 'users' &&
        item.path === 'email',
    ),
  );
  assert.equal(
    result.unknownFields.length,
    0,
  );
});

test('production audit source is read-only against Firestore/Auth', () => {
  const source = readFileSync(
    'scripts/wave1-identity-legacy-retirement-audit.mjs',
    'utf8',
  );

  assert.equal(
    source.includes('.set('),
    false,
  );
  assert.equal(
    source.includes('.update('),
    false,
  );
  assert.equal(
    source.includes('.delete('),
    false,
  );
  assert.equal(
    source.includes('batch('),
    false,
  );
  assert.equal(
    source.includes('runTransaction('),
    false,
  );
  assert.equal(
    source.includes('Firestore writes performed: 0'),
    true,
  );
  assert.equal(
    source.includes('Auth writes performed: 0'),
    true,
  );
});
