import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  PROFILE_RETIREMENT_MIGRATION_ID,
  buildOrganisationAssignmentId,
  buildProfilePlan,
  buildSourceActions,
  classifyProfileTarget,
  partitionRecordsByWrites,
  subsetMatches,
  verifyDerivedRelationshipCoverage,
} from '../migrations/wave1-identity-profile-retirement-lib.mjs';

const row = (id, data) => ({ id, data });

test('routes user contact, public staff profile, private staff fields, and lifecycle separately', () => {
  const records = buildSourceActions({
    users: [
      row('teacher-1', {
        role: 'teacher',
        email: 'teacher@example.com',
        phone: '+911234567890',
        whatsappE164: '+911234567890',
        timezone: 'Asia/Kolkata',
        countryCodeSource: 'phone',
        countryCodeUpdatedAt: { seconds: 1 },
        qualifications: 'B.Ed',
        specializations: ['Phonics'],
        languagesSpoken: ['English'],
        yearsExperience: 5,
        city: 'Hyderabad',
        bio: 'Teacher',
        preferences: {
          sessionNotifications: true,
        },
        bankAccountNumber: '123456789',
        bankAccountHolderName: 'Teacher One',
        bankIfscCode: 'TEST0001',
        upiId: 'teacher@upi',
        emergencyContactName: 'Contact',
        emergencyContactPhone: '+911111111111',
        archivedAt: { seconds: 2 },
        archivedBy: 'admin-1',
      }),
    ],
    kids: [],
    schools: [],
  });

  const actions = records[0].actions;
  assert.deepEqual(
    actions.map((item) => item.collection).sort(),
    [
      'personContacts',
      'personLifecycle',
      'staffPrivateProfiles',
      'teachers',
    ],
  );

  const contact = actions.find(
    (item) => item.collection === 'personContacts',
  );
  assert.equal(
    contact.expectedData.personId,
    'teacher-1',
  );
  assert.equal(
    contact.expectedData.whatsappE164,
    '+911234567890',
  );
  assert.equal(
    contact.expectedData.timezone,
    'Asia/Kolkata',
  );
  assert.equal(
    contact.expectedData.bankAccountNumber,
    undefined,
  );

  const teacher = actions.find(
    (item) => item.collection === 'teachers',
  );
  assert.equal(
    teacher.expectedData.profileAuthority,
    'canonical',
  );
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
  assert.equal(
    teacher.expectedData.bankAccountNumber,
    undefined,
  );

  const privateProfile = actions.find(
    (item) =>
      item.collection === 'staffPrivateProfiles',
  );
  assert.equal(
    privateProfile.expectedData.bankAccountNumber,
    '123456789',
  );
  assert.equal(
    privateProfile.expectedData.emergencyContactName,
    'Contact',
  );
  assert.equal(
    privateProfile.expectedData.email,
    undefined,
  );

  const lifecycle = actions.find(
    (item) => item.collection === 'personLifecycle',
  );
  assert.equal(
    lifecycle.expectedData.archivedBy,
    'admin-1',
  );
});

test('normalizes duplicate teacher profile aliases instead of carrying both legacy shapes', () => {
  const actions = buildSourceActions({
    users: [
      row('teacher-1', {
        role: 'teacher',
        email: 'teacher@example.com',
        qualification: 'Older',
        qualifications: 'Current',
        specialization: ['Grammar'],
        specializations: ['Phonics'],
        languages: ['Hindi'],
        languagesSpoken: ['English'],
        bankAccount: 'legacy-account',
      }),
    ],
    kids: [],
    schools: [],
  })[0].actions;

  const teacher = actions.find(
    (item) => item.collection === 'teachers',
  );
  assert.equal(
    teacher.expectedData.qualifications,
    'Current',
  );
  assert.deepEqual(
    teacher.expectedData.specializations,
    ['Phonics'],
  );
  assert.deepEqual(
    teacher.expectedData.languages,
    ['English'],
  );
  assert.equal(
    teacher.expectedData.qualification,
    undefined,
  );
  assert.equal(
    teacher.expectedData.specialization,
    undefined,
  );

  const privateProfile = actions.find(
    (item) =>
      item.collection === 'staffPrivateProfiles',
  );
  assert.equal(
    privateProfile.expectedData.bankAccountNumber,
    'legacy-account',
  );
});

test('creates a role profile promotion for the missing admin mirror without copying contact details into it', () => {
  const actions = buildSourceActions({
    users: [
      row('admin-2', {
        role: 'admin',
        email: 'admin@example.com',
        displayName: 'Admin Two',
        status: 'active',
      }),
    ],
    kids: [],
    schools: [],
  })[0].actions;

  const admin = actions.find(
    (item) => item.collection === 'admins',
  );
  assert.ok(admin);
  assert.equal(
    admin.expectedData.personId,
    'admin-2',
  );
  assert.equal(
    admin.expectedData.profileRole,
    'admin',
  );
  assert.equal(
    admin.expectedData.email,
    undefined,
  );
});

test('routes learner grade, read model, repair provenance, and lifecycle without modifying learnerProfiles', () => {
  const records = buildSourceActions({
    users: [],
    kids: [
      row('kid-1', {
        age: 7,
        grade: '2',
        summary: {
          phonicsMastery: 80,
        },
        progress: {
          byGame: {
            'letter-tracing': {
              completedLevels: 3,
            },
          },
        },
        repairedFromBrokenStudentId: 'old-kid',
        repairedFromEnrollmentId: 'enr-1',
        repairSource: 'repair',
        archivedAt: { seconds: 10 },
        archivedReason: 'duplicate',
      }),
    ],
    schools: [],
  });

  const actions = records[0].actions;
  assert.deepEqual(
    actions.map((item) => item.collection).sort(),
    [
      'learnerDetails',
      'learnerProvenance',
      'learnerReadModels',
      'personLifecycle',
    ],
  );

  const details = actions.find(
    (item) => item.collection === 'learnerDetails',
  );
  assert.equal(details.expectedData.grade, '2');
  assert.equal(details.expectedData.age, undefined);
  assert.equal(
    actions.some(
      (item) => item.collection === 'learnerProfiles',
    ),
    false,
  );

  const readModel = actions.find(
    (item) => item.collection === 'learnerReadModels',
  );
  assert.deepEqual(
    readModel.expectedData.summary,
    { phonicsMastery: 80 },
  );
  assert.equal(
    readModel.expectedData.progress.byGame['letter-tracing']
      .completedLevels,
    3,
  );
});

test('routes school profile fields and current LP assignment without duplicating LP name/email snapshots', () => {
  const records = buildSourceActions({
    users: [],
    kids: [],
    schools: [
      row('school-1', {
        contact: {
          name: 'Coordinator',
          email: null,
        },
        location: {
          country: 'India',
        },
        nameSearch: 'school one',
        currentAcademicYearId: 'ay-1',
        learningPartnerId: 'lp-1',
        learningPartnerName: 'LP One',
        learningPartnerEmail: 'lp@example.com',
        learningPartnerAssignedAt: { seconds: 20 },
      }),
    ],
  });

  const actions = records[0].actions;
  const profile = actions.find(
    (item) =>
      item.collection === 'organisationProfiles',
  );
  assert.equal(
    profile.expectedData.currentAcademicYearId,
    'ay-1',
  );
  assert.deepEqual(
    profile.expectedData.location,
    { country: 'India' },
  );

  const assignment = actions.find(
    (item) =>
      item.collection === 'organisationAssignments',
  );
  assert.equal(
    assignment.expectedData.personId,
    'lp-1',
  );
  assert.equal(
    assignment.expectedData.role,
    'learningPartner',
  );
  assert.equal(
    assignment.expectedData.learningPartnerName,
    undefined,
  );
  assert.equal(
    assignment.expectedData.learningPartnerEmail,
    undefined,
  );
  assert.equal(
    assignment.documentId,
    buildOrganisationAssignmentId({
      organisationId: 'school-1',
      personId: 'lp-1',
      role: 'learningPartner',
    }),
  );
});

test('treats legacy childIds as derivable only when every backlink is represented by canonical guardian relationships', () => {
  const healthy =
    verifyDerivedRelationshipCoverage({
      users: [
        row('parent-1', {
          childIds: ['kid-1'],
        }),
      ],
      kids: [],
      enrollments: [],
      guardianRelationships: [
        row('rel-1', {
          guardianPersonId: 'parent-1',
          learnerPersonId: 'kid-1',
        }),
      ],
      peopleIds: new Set(['parent-1', 'kid-1']),
      organisationIds: new Set(),
      schools: [],
    });

  assert.equal(healthy.issueCount, 0);

  const broken =
    verifyDerivedRelationshipCoverage({
      users: [
        row('parent-1', {
          childIds: ['kid-1'],
        }),
      ],
      kids: [],
      enrollments: [],
      guardianRelationships: [],
      peopleIds: new Set(['parent-1', 'kid-1']),
      organisationIds: new Set(),
      schools: [],
    });

  assert.equal(broken.issueCount, 1);
  assert.equal(
    broken.byCode
      .legacy_child_backlink_missing_canonical_guardian_relationship,
    1,
  );
});

test('allows legacy learner teacher aliases to retire only when represented by a usable enrollment', () => {
  const common = {
    users: [],
    guardianRelationships: [],
    peopleIds: new Set(['kid-1', 'teacher-1']),
    organisationIds: new Set(),
    schools: [],
  };

  const healthy =
    verifyDerivedRelationshipCoverage({
      ...common,
      kids: [
        row('kid-1', {
          teacherId: 'teacher-1',
          teacherIds: ['teacher-1'],
        }),
      ],
      enrollments: [
        row('enr-1', {
          kidId: 'kid-1',
          teacherId: 'teacher-1',
          status: 'active',
        }),
      ],
    });
  assert.equal(healthy.issueCount, 0);

  const archivedOnly =
    verifyDerivedRelationshipCoverage({
      ...common,
      kids: [
        row('kid-1', {
          teacherId: 'teacher-1',
          teacherIds: ['teacher-1'],
        }),
      ],
      enrollments: [
        row('enr-1', {
          kidId: 'kid-1',
          teacherId: 'teacher-1',
          status: 'active',
          archived: true,
        }),
      ],
    });
  assert.equal(
    archivedOnly.byCode
      .legacy_kid_teacher_missing_usable_enrollment_assignment,
    1,
  );
});

test('blocks dropping school LP name/email snapshots if they disagree with the referenced legacy person', () => {
  const result =
    verifyDerivedRelationshipCoverage({
      users: [
        row('lp-1', {
          displayName: 'Current LP',
          email: 'current@example.com',
        }),
      ],
      kids: [],
      enrollments: [],
      guardianRelationships: [],
      peopleIds: new Set(['lp-1']),
      organisationIds: new Set(['school-1']),
      schools: [
        row('school-1', {
          learningPartnerId: 'lp-1',
          learningPartnerName: 'Different LP',
          learningPartnerEmail:
            'old@example.com',
        }),
      ],
    });

  assert.equal(
    result.byCode
      .school_learning_partner_name_snapshot_mismatch,
    1,
  );
  assert.equal(
    result.byCode
      .school_learning_partner_email_snapshot_mismatch,
    1,
  );
});

test('profile target comparison is subset-based so promoted role profiles keep unrelated existing fields', () => {
  const action = {
    ownership: 'roleProfilePromotion',
    identityFields: {
      personId: 'teacher-1',
      profileRole: 'teacher',
    },
    expectedData: {
      personId: 'teacher-1',
      profileRole: 'teacher',
      qualifications: 'B.Ed',
    },
  };

  const existing = {
    personId: 'teacher-1',
    profileRole: 'teacher',
    qualifications: 'B.Ed',
    existingOperationalField: 'keep-me',
  };

  assert.equal(
    subsetMatches(
      existing,
      action.expectedData,
    ),
    true,
  );
  assert.equal(
    classifyProfileTarget(
      existing,
      action,
    ),
    'unchanged',
  );

  assert.equal(
    classifyProfileTarget(
      {
        ...existing,
        profileRole: 'parent',
      },
      action,
    ),
    'conflict',
  );
});

test('migration-owned targets refuse another migration owner', () => {
  const action = {
    ownership: 'migration',
    identityFields: {
      personId: 'person-1',
    },
    expectedData: {
      personId: 'person-1',
      migration: {
        migrationId:
          PROFILE_RETIREMENT_MIGRATION_ID,
      },
    },
  };

  assert.equal(
    classifyProfileTarget(
      {
        personId: 'person-1',
        migration: {
          migrationId: 'different-migration',
        },
      },
      action,
    ),
    'conflict',
  );
});

test('profile plan fails closed when core canonical identities are missing', () => {
  const plan = buildProfilePlan({
    users: [
      row('parent-1', {
        role: 'parent',
        email: 'parent@example.com',
      }),
    ],
    kids: [
      row('kid-1', {
        grade: '1',
      }),
    ],
    schools: [
      row('school-1', {}),
    ],
    enrollments: [],
    guardianRelationships: [],
    peopleIds: new Set(),
    learnerProfileIds: new Set(),
    organisationIds: new Set(),
  });

  assert.equal(plan.coreIssues.length, 4);
  assert.deepEqual(
    plan.coreIssues
      .map((item) => item.code)
      .sort(),
    [
      'kid_missing_canonical_learner_profile',
      'kid_missing_canonical_person',
      'school_missing_canonical_organisation',
      'user_missing_canonical_person',
    ],
  );
});

test('write partition never exceeds the documented 100-write ceiling', () => {
  const records = Array.from(
    { length: 51 },
    (_, index) => ({
      actions: [
        {
          classification: 'create',
        },
        {
          classification: 'update',
        },
      ],
      sourceId: String(index),
    }),
  );

  const groups =
    partitionRecordsByWrites(records, 100);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].length, 50);
  assert.equal(groups[1].length, 1);
});

test('production executor is destructive-data safe by construction', () => {
  const source = readFileSync(
    'scripts/wave1-identity-profile-retirement.mjs',
    'utf8',
  );

  assert.equal(
    source.includes('batch.delete('),
    false,
  );
  assert.equal(
    source.includes('.delete()'),
    false,
  );
  assert.equal(
    source.includes('getAuth('),
    false,
  );
  assert.equal(
    source.includes('legacyDocumentsMutated: false'),
    true,
  );
  assert.equal(
    source.includes('firebaseAuthMutated: false'),
    true,
  );
  assert.equal(
    source.includes('canonicalIdentityCoreMutated: false'),
    true,
  );
  assert.equal(
    source.includes('destructiveDeletionAuthorized: false'),
    true,
  );
});
