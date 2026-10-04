import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  PROFILE_MIGRATION_ID,
  compareProfileDocument,
  countExpectedByCollection,
  deriveExpectedProfileTargets,
  expectedOrganisationAssignmentId,
  isOwnedByProfileMigration,
  verifyRetirementDependencies,
} from '../verification/wave1-identity-profile-verify-lib.mjs';

function row(id, data) {
  return { id, data };
}

function fixture() {
  return {
    users: [
      row('parent-1', {
        role: 'parent',
        email: 'parent@example.com',
        childIds: ['kid-1'],
        displayName: 'Parent One',
      }),
      row('teacher-1', {
        role: 'teacher',
        qualification: 'B.Ed',
        specializations: ['Phonics'],
        languagesSpoken: ['English'],
        bankAccount: '1234',
      }),
      row('lp-1', {
        role: 'learningPartner',
        displayName: 'LP One',
        email: 'lp@example.com',
      }),
    ],
    kids: [
      row('kid-1', {
        grade: '2',
        summary: { completed: 3 },
        progress: { score: 7 },
        repairedFromEnrollmentId: 'old-enrollment',
        teacherId: 'teacher-1',
      }),
    ],
    schools: [
      row('school-1', {
        contact: { email: 'school@example.com' },
        location: { country: 'India' },
        currentAcademicYearId: 'ay-1',
        learningPartnerId: 'lp-1',
        learningPartnerName: 'LP One',
        learningPartnerEmail: 'lp@example.com',
      }),
    ],
  };
}

test('independent profile model derives retirement targets without migration planner imports', () => {
  const model = deriveExpectedProfileTargets(fixture());
  const counts = countExpectedByCollection(model.documents);

  assert.deepEqual(counts, {
    learnerDetails: 1,
    learnerProvenance: 1,
    learnerReadModels: 1,
    learningPartners: 1,
    organisationAssignments: 1,
    organisationProfiles: 1,
    parents: 1,
    personContacts: 3,
    staffPrivateProfiles: 1,
    teachers: 1,
  });

  const parentContact =
    model.documents.get('personContacts/parent-1');
  assert.equal(
    parentContact.expectedData.email,
    'parent@example.com',
  );
  assert.equal(
    parentContact.expectedData.migration.migrationId,
    PROFILE_MIGRATION_ID,
  );

  const teacher =
    model.documents.get('teachers/teacher-1');
  assert.equal(
    teacher.expectedData.qualifications,
    'B.Ed',
  );
  assert.deepEqual(
    teacher.expectedData.specializations,
    ['Phonics'],
  );
  assert.deepEqual(
    teacher.expectedData.languages,
    ['English'],
  );

  const privateProfile =
    model.documents.get(
      'staffPrivateProfiles/teacher-1',
    );
  assert.equal(
    privateProfile.expectedData.bankAccountNumber,
    '1234',
  );
});

test('organisation assignment ID is deterministic and scoped', () => {
  const a = expectedOrganisationAssignmentId({
    organisationId: 'school-1',
    personId: 'lp-1',
    role: 'learningPartner',
  });
  const b = expectedOrganisationAssignmentId({
    organisationId: 'school-1',
    personId: 'lp-1',
    role: 'learningPartner',
  });
  const c = expectedOrganisationAssignmentId({
    organisationId: 'school-2',
    personId: 'lp-1',
    role: 'learningPartner',
  });

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[a-f0-9]{32}$/);
});

test('profile comparison is subset-based but requires audit timestamps', () => {
  const expected = {
    personId: 'parent-1',
    profileRole: 'parent',
    profileAuthority: 'canonical',
  };
  const timestamp = { toMillis: () => 123 };

  assert.deepEqual(
    compareProfileDocument(
      {
        ...expected,
        unrelatedOperationalField: 'preserved',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      expected,
    ),
    [],
  );

  assert.deepEqual(
    compareProfileDocument(expected, expected),
    ['createdAt', 'updatedAt'],
  );

  assert.ok(
    compareProfileDocument(
      {
        ...expected,
        profileRole: 'teacher',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      expected,
    ).includes('profileRole'),
  );
});

test('migration ownership detection covers profile and ordinary migration metadata', () => {
  assert.equal(
    isOwnedByProfileMigration({
      migration: {
        migrationId: PROFILE_MIGRATION_ID,
      },
    }),
    true,
  );
  assert.equal(
    isOwnedByProfileMigration({
      profileMigration: {
        migrationId: PROFILE_MIGRATION_ID,
      },
    }),
    true,
  );
  assert.equal(
    isOwnedByProfileMigration({
      migration: {
        migrationId: 'other',
      },
    }),
    false,
  );
});

test('retirement dependency verification independently accepts durable relationship evidence', () => {
  const source = fixture();
  const issues = verifyRetirementDependencies({
    ...source,
    enrollments: [
      row('enrollment-1', {
        kidId: 'kid-1',
        teacherId: 'teacher-1',
        status: 'active',
      }),
    ],
    classSessions: [],
    guardianRelationships: [
      row('guardian-1', {
        guardianPersonId: 'parent-1',
        learnerPersonId: 'kid-1',
      }),
    ],
    peopleIds: new Set([
      'parent-1',
      'teacher-1',
      'lp-1',
      'kid-1',
    ]),
    learnerProfileIds: new Set(['kid-1']),
    organisationIds: new Set(['school-1']),
  });

  assert.deepEqual(issues, []);
});

test('retirement dependency verification catches missing child backlink and teacher evidence', () => {
  const source = fixture();
  const issues = verifyRetirementDependencies({
    ...source,
    enrollments: [],
    classSessions: [],
    guardianRelationships: [],
    peopleIds: new Set([
      'parent-1',
      'teacher-1',
      'lp-1',
      'kid-1',
    ]),
    learnerProfileIds: new Set(['kid-1']),
    organisationIds: new Set(['school-1']),
  });

  const codes = new Set(
    issues.map((item) => item.code),
  );
  assert.ok(
    codes.has(
      'legacy_child_backlink_missing_canonical_guardian_relationship',
    ),
  );
  assert.ok(
    codes.has(
      'legacy_kid_teacher_missing_any_operational_or_historical_evidence',
    ),
  );
});

test('retirement dependency verification catches school LP snapshot drift', () => {
  const source = fixture();
  source.schools[0].data.learningPartnerName =
    'Wrong Name';

  const issues = verifyRetirementDependencies({
    ...source,
    enrollments: [
      row('enrollment-1', {
        kidId: 'kid-1',
        teacherId: 'teacher-1',
        status: 'active',
      }),
    ],
    classSessions: [],
    guardianRelationships: [
      row('guardian-1', {
        guardianPersonId: 'parent-1',
        learnerPersonId: 'kid-1',
      }),
    ],
    peopleIds: new Set([
      'parent-1',
      'teacher-1',
      'lp-1',
      'kid-1',
    ]),
    learnerProfileIds: new Set(['kid-1']),
    organisationIds: new Set(['school-1']),
  });

  assert.ok(
    issues.some(
      (item) =>
        item.code ===
        'school_learning_partner_name_snapshot_mismatch',
    ),
  );
});

test('production profile verifier is independent and read-only by construction', () => {
  const verifier = readFileSync(
    'scripts/wave1-identity-profile-verify.mjs',
    'utf8',
  );
  const model = readFileSync(
    'scripts/verification/wave1-identity-profile-verify-lib.mjs',
    'utf8',
  );

  for (const source of [verifier, model]) {
    assert.equal(
      source.includes(
        'wave1-identity-profile-retirement-lib.mjs',
      ),
      false,
    );
  }

  assert.equal(verifier.includes('FieldValue'), false);
  assert.equal(verifier.includes('.set('), false);
  assert.equal(verifier.includes('.update('), false);
  assert.equal(verifier.includes('.delete('), false);
  assert.equal(verifier.includes('batch('), false);
  assert.equal(verifier.includes('getAuth('), false);
  assert.equal(
    verifier.includes('writesPerformed: 0'),
    true,
  );
});
