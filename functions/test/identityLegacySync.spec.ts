import { describe, expect, it } from 'vitest';

import {
  buildAuthIdentityId,
  buildGuardianRelationshipId,
  buildOrganisationMembershipId,
  buildRoleAssignmentId,
} from '../src/schoolOS/identity/idStrategy';
import {
  WAVE1_IDENTITY_MIGRATION_ACTOR,
  WAVE1_IDENTITY_MIGRATION_ID,
  buildLegacyIdentitySyncPlan,
  canonicalSyncDocumentMatches,
  hasLegacySyncMigrationOwner,
  shouldSyncLegacyIdentityWrite,
} from '../src/schoolOS/identity/legacySync';

describe('Wave 1 identity SWITCH READS Brick 3 legacy sync', () => {
  it('materializes a legacy parent into the same three canonical documents', () => {
    const uid = 'parent-1';
    const authId = buildAuthIdentityId(
      'firebase',
      uid,
    );
    const roleId = buildRoleAssignmentId({
      personId: uid,
      role: 'parent',
      scopeType: 'global',
    });

    const plan = buildLegacyIdentitySyncPlan({
      sourceCollection: 'users',
      sourceId: uid,
      currentData: {
        uid,
        userId: uid,
        displayName: 'Parent One',
        role: 'parent',
        roles: ['parent'],
        status: 'active',
        countryCode: 'IN',
      },
      authUser: {
        uid,
        disabled: false,
        displayName: 'Auth Parent',
      },
    });

    expect(plan.blockingIssues).toEqual([]);
    expect(
      plan.expectedDocuments.map(
        (document) => document.key,
      ),
    ).toEqual([
      `authIdentities/${authId}`,
      `people/${uid}`,
      `roleAssignments/${roleId}`,
    ]);

    const person = plan.expectedDocuments.find(
      (document) =>
        document.key === `people/${uid}`,
    );
    expect(person?.expectedData).toMatchObject({
      schemaVersion: 1,
      createdBy: WAVE1_IDENTITY_MIGRATION_ACTOR,
      updatedBy: WAVE1_IDENTITY_MIGRATION_ACTOR,
      migration: {
        migrationId:
          WAVE1_IDENTITY_MIGRATION_ID,
        sourceCollection: 'users',
        sourceId: uid,
        sourceFieldVersion: null,
      },
      personId: uid,
      kind: 'adult',
      status: 'active',
      displayName: 'Parent One',
      countryCode: 'IN',
    });

    const auth = plan.expectedDocuments.find(
      (document) =>
        document.key ===
        `authIdentities/${authId}`,
    );
    expect(auth?.expectedData).toMatchObject({
      authIdentityId: authId,
      personId: uid,
      provider: 'firebase',
      providerSubject: uid,
      status: 'active',
    });
  });

  it('maps disabled Firebase Auth state into the canonical AuthIdentity', () => {
    const uid = 'teacher-disabled';
    const authId = buildAuthIdentityId(
      'firebase',
      uid,
    );

    const plan = buildLegacyIdentitySyncPlan({
      sourceCollection: 'users',
      sourceId: uid,
      currentData: {
        uid,
        userId: uid,
        displayName: 'Teacher Disabled',
        role: 'teacher',
        roles: ['teacher'],
        status: 'active',
      },
      authUser: {
        uid,
        disabled: true,
      },
    });

    const auth = plan.expectedDocuments.find(
      (document) =>
        document.key ===
        `authIdentities/${authId}`,
    );
    expect(auth?.expectedData.status).toBe(
      'disabled',
    );
  });

  it('identifies the previous global role as stale during a role change', () => {
    const uid = 'role-change';
    const oldRoleId = buildRoleAssignmentId({
      personId: uid,
      role: 'parent',
      scopeType: 'global',
    });
    const newRoleId = buildRoleAssignmentId({
      personId: uid,
      role: 'teacher',
      scopeType: 'global',
    });

    const plan = buildLegacyIdentitySyncPlan({
      sourceCollection: 'users',
      sourceId: uid,
      priorData: {
        uid,
        userId: uid,
        displayName: 'Role Change',
        role: 'parent',
        roles: ['parent'],
        status: 'active',
      },
      currentData: {
        uid,
        userId: uid,
        displayName: 'Role Change',
        role: 'teacher',
        roles: ['teacher'],
        status: 'active',
      },
      authUser: {
        uid,
        disabled: false,
      },
    });

    expect(
      plan.expectedDocuments.some(
        (document) =>
          document.key ===
          `roleAssignments/${newRoleId}`,
      ),
    ).toBe(true);
    expect(plan.staleCandidates).toContainEqual({
      collection: 'roleAssignments',
      documentId: oldRoleId,
      key: `roleAssignments/${oldRoleId}`,
    });
  });

  it('removes a stale guardian relationship when the explicit parent set changes', () => {
    const kidId = 'kid-1';
    const oldParent = 'parent-old';
    const newParent = 'parent-new';
    const oldRelationshipId =
      buildGuardianRelationshipId({
        guardianPersonId: oldParent,
        learnerPersonId: kidId,
        relationshipType: 'parent',
      });
    const newRelationshipId =
      buildGuardianRelationshipId({
        guardianPersonId: newParent,
        learnerPersonId: kidId,
        relationshipType: 'parent',
      });

    const plan = buildLegacyIdentitySyncPlan({
      sourceCollection: 'kids',
      sourceId: kidId,
      priorData: {
        fullName: 'Learner One',
        status: 'active',
        parentId: oldParent,
        parentIds: [oldParent],
        primaryParentId: oldParent,
      },
      currentData: {
        fullName: 'Learner One',
        status: 'active',
        parentId: newParent,
        parentIds: [newParent],
        primaryParentId: newParent,
      },
    });

    expect(plan.blockingIssues).toEqual([]);
    expect(
      plan.expectedDocuments.some(
        (document) =>
          document.key ===
          `guardianRelationships/${newRelationshipId}`,
      ),
    ).toBe(true);
    expect(plan.staleCandidates).toContainEqual({
      collection: 'guardianRelationships',
      documentId: oldRelationshipId,
      key:
        `guardianRelationships/${oldRelationshipId}`,
    });
  });

  it('removes stale school-admin membership and scoped role when a school is removed', () => {
    const userId = 'school-admin-1';
    const schoolA = 'school-a';
    const schoolB = 'school-b';
    const staleMembership =
      buildOrganisationMembershipId({
        organisationId: schoolA,
        personId: userId,
        role: 'schoolAdmin',
      });
    const staleRole = buildRoleAssignmentId({
      personId: userId,
      role: 'schoolAdmin',
      scopeType: 'organisation',
      scopeId: schoolA,
    });
    const currentMembership =
      buildOrganisationMembershipId({
        organisationId: schoolB,
        personId: userId,
        role: 'schoolAdmin',
      });

    const plan = buildLegacyIdentitySyncPlan({
      sourceCollection: 'schoolUsers',
      sourceId: userId,
      priorData: {
        userId,
        role: 'schoolAdmin',
        schoolIds: [schoolA, schoolB],
        primarySchoolId: schoolA,
        status: 'active',
      },
      currentData: {
        userId,
        role: 'schoolAdmin',
        schoolIds: [schoolB],
        primarySchoolId: schoolB,
        status: 'active',
      },
    });

    expect(plan.blockingIssues).toEqual([]);
    expect(
      plan.expectedDocuments.some(
        (document) =>
          document.key ===
          `organisationMemberships/${currentMembership}`,
      ),
    ).toBe(true);
    expect(
      plan.staleCandidates.map(
        (candidate) => candidate.key,
      ),
    ).toEqual([
      `organisationMemberships/${staleMembership}`,
      `roleAssignments/${staleRole}`,
    ]);
  });

  it('blocks a Firestore user source that has no matching Firebase Auth identity', () => {
    const plan = buildLegacyIdentitySyncPlan({
      sourceCollection: 'users',
      sourceId: 'orphan-user',
      currentData: {
        uid: 'orphan-user',
        userId: 'orphan-user',
        displayName: 'Orphan User',
        role: 'parent',
        roles: ['parent'],
        status: 'active',
      },
      authUser: null,
    });

    expect(plan.blockingIssues).toContain(
      'user_missing_auth_directory_identity',
    );
    expect(plan.expectedDocuments).toEqual([]);
  });

  it('treats source deletion as removal of every previously projected canonical document', () => {
    const uid = 'teacher-delete';
    const authId = buildAuthIdentityId(
      'firebase',
      uid,
    );
    const roleId = buildRoleAssignmentId({
      personId: uid,
      role: 'teacher',
      scopeType: 'global',
    });

    const plan = buildLegacyIdentitySyncPlan({
      sourceCollection: 'users',
      sourceId: uid,
      priorData: {
        uid,
        userId: uid,
        displayName: 'Teacher Delete',
        role: 'teacher',
        roles: ['teacher'],
        status: 'active',
      },
      currentData: null,
    });

    expect(plan.expectedDocuments).toEqual([]);
    expect(
      plan.staleCandidates.map(
        (candidate) => candidate.key,
      ),
    ).toEqual([
      `authIdentities/${authId}`,
      `people/${uid}`,
      `roleAssignments/${roleId}`,
    ]);
  });

  it('ignores unrelated legacy field updates so they do not create canonical writes', () => {
    const before = {
      uid: 'parent-1',
      userId: 'parent-1',
      displayName: 'Parent One',
      role: 'parent',
      roles: ['parent'],
      status: 'active',
      assignedLPs: ['lp-1'],
      updatedAt: 'old',
    };
    const after = {
      ...before,
      assignedLPs: ['lp-2'],
      updatedAt: 'new',
    };

    expect(
      shouldSyncLegacyIdentityWrite({
        sourceCollection: 'users',
        beforeData: before,
        afterData: after,
      }),
    ).toBe(false);

    expect(
      shouldSyncLegacyIdentityWrite({
        sourceCollection: 'users',
        beforeData: before,
        afterData: {
          ...after,
          displayName: 'Parent One Updated',
        },
      }),
    ).toBe(true);
  });

  it('compares canonical semantics without timestamp noise and verifies migration ownership', () => {
    const sourceId = 'parent-1';
    const expected = {
      schemaVersion: 1,
      createdBy: WAVE1_IDENTITY_MIGRATION_ACTOR,
      updatedBy: WAVE1_IDENTITY_MIGRATION_ACTOR,
      migration: {
        migrationId:
          WAVE1_IDENTITY_MIGRATION_ID,
        sourceCollection: 'users',
        sourceId,
        sourceFieldVersion: null,
      },
      personId: sourceId,
      kind: 'adult',
      status: 'active',
      displayName: 'Parent One',
    };

    const existing = {
      ...expected,
      createdAt: { seconds: 1 },
      updatedAt: { seconds: 2 },
    };

    expect(
      canonicalSyncDocumentMatches(
        existing,
        expected,
      ),
    ).toBe(true);
    expect(
      hasLegacySyncMigrationOwner(
        existing,
        'users',
        sourceId,
      ),
    ).toBe(true);
    expect(
      hasLegacySyncMigrationOwner(
        existing,
        'users',
        'different-user',
      ),
    ).toBe(false);
  });

  it('suppresses canonical-origin kid projection transitions without hiding later legacy edits', () => {
    const canonicalCreate = {
      fullName: 'Learner One',
      name: 'Learner One',
      displayName: 'Learner One',
      age: 8,
      ageYears: 8,
      status: 'active',
      parentId: 'parent-1',
      parentIds: ['parent-1'],
      primaryParentId: 'parent-1',
      _wave1CanonicalProjection: {
        schemaVersion: 1,
        authority: 'canonical-primary',
        command: 'learner_create',
        writeId: 'write-1',
        canonicalPersonId: 'kid-1',
      },
    };

    expect(
      shouldSyncLegacyIdentityWrite({
        sourceCollection: 'kids',
        beforeData: null,
        afterData: canonicalCreate,
      }),
    ).toBe(false);

    expect(
      shouldSyncLegacyIdentityWrite({
        sourceCollection: 'kids',
        beforeData: canonicalCreate,
        afterData: {
          ...canonicalCreate,
          fullName: 'Learner One Canonical Update',
          _wave1CanonicalProjection: {
            ...canonicalCreate._wave1CanonicalProjection,
            writeId: 'write-2',
          },
        },
      }),
    ).toBe(false);

    expect(
      shouldSyncLegacyIdentityWrite({
        sourceCollection: 'kids',
        beforeData: canonicalCreate,
        afterData: {
          ...canonicalCreate,
          fullName: 'Learner One Legacy Edit',
        },
      }),
    ).toBe(true);
  });

});
