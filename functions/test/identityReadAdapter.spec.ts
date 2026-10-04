import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  buildAuthIdentityId,
  buildGuardianRelationshipId,
  buildOrganisationMembershipId,
  buildRoleAssignmentId,
} from '../src/schoolOS/identity/idStrategy';
import {
  readLegacyLearnerIdentityShadow,
  readLegacyOrganisationIdentityShadow,
  readLegacyOrganisationMembershipShadow,
  readLegacyUserIdentityShadow,
} from '../src/schoolOS/identity/readAdapter';

type Row = Record<string, unknown> | null;

class FakeRef {
  constructor(
    public readonly path: string,
    private readonly rows: Record<string, Row>,
    private readonly errors: Set<string>,
    private readonly reads: string[],
  ) {}

  async get() {
    this.reads.push(this.path);
    if (this.errors.has(this.path)) {
      throw new Error('forced read failure');
    }
    const data = this.rows[this.path] ?? null;
    return {
      exists: Boolean(data),
      data: () => data,
    };
  }
}

class FakeCollection {
  constructor(
    private readonly path: string,
    private readonly rows: Record<string, Row>,
    private readonly errors: Set<string>,
    private readonly reads: string[],
  ) {}

  doc(id: string) {
    return new FakeRef(
      `${this.path}/${id}`,
      this.rows,
      this.errors,
      this.reads,
    );
  }
}

function buildDb(
  rows: Record<string, Row>,
  errorPaths: string[] = [],
) {
  const reads: string[] = [];
  const errors = new Set(errorPaths);
  const db = {
    collection(name: string) {
      return new FakeCollection(
        name,
        rows,
        errors,
        reads,
      );
    },
  } as unknown as admin.firestore.Firestore;

  return { db, reads };
}

describe('Wave 1 identity SWITCH READS Brick 1 shadow adapter', () => {
  it('returns legacy user data as authority while canonical shadow matches', async () => {
    const uid = 'parent-1';
    const authId = buildAuthIdentityId('firebase', uid);
    const roleId = buildRoleAssignmentId({
      personId: uid,
      role: 'parent',
      scopeType: 'global',
    });

    const { db, reads } = buildDb({
      [`users/${uid}`]: {
        uid,
        userId: uid,
        displayName: 'Parent One',
        role: 'parent',
        roles: ['parent'],
        status: 'active',
      },
      [`people/${uid}`]: {
        personId: uid,
        kind: 'adult',
        status: 'active',
        displayName: 'Parent One',
      },
      [`authIdentities/${authId}`]: {
        authIdentityId: authId,
        personId: uid,
        provider: 'firebase',
        providerSubject: uid,
        status: 'active',
      },
      [`roleAssignments/${roleId}`]: {
        roleAssignmentId: roleId,
        personId: uid,
        role: 'parent',
        scopeType: 'global',
        scopeId: null,
        status: 'active',
      },
    });

    const result = await readLegacyUserIdentityShadow({
      db,
      uid,
    });

    expect(result.authority).toBe('legacy');
    expect(result.legacyExists).toBe(true);
    expect(result.legacyData?.displayName).toBe('Parent One');
    expect(result.shadow).toMatchObject({
      mode: 'shadow_legacy_authoritative',
      sourceCollection: 'users',
      status: 'match',
      canonicalDocumentsExpected: 3,
      canonicalDocumentsRead: 3,
      missingCanonicalKinds: [],
      mismatchFields: [],
      canonicalReadErrorKinds: [],
    });
    expect(result.shadow.subjectToken).toMatch(/^[a-f0-9]{12}$/);
    expect(reads).toEqual([
      `users/${uid}`,
      `people/${uid}`,
      `authIdentities/${authId}`,
      `roleAssignments/${roleId}`,
    ]);
  });

  it('never replaces legacy user data when canonical semantics differ', async () => {
    const uid = 'parent-2';
    const authId = buildAuthIdentityId('firebase', uid);
    const roleId = buildRoleAssignmentId({
      personId: uid,
      role: 'parent',
      scopeType: 'global',
    });

    const { db } = buildDb({
      [`users/${uid}`]: {
        displayName: 'Legacy Parent',
        role: 'parent',
        status: 'active',
      },
      [`people/${uid}`]: {
        personId: uid,
        kind: 'adult',
        status: 'active',
        displayName: 'Wrong Canonical Name',
      },
      [`authIdentities/${authId}`]: {
        personId: uid,
        provider: 'firebase',
        providerSubject: uid,
      },
      [`roleAssignments/${roleId}`]: {
        roleAssignmentId: roleId,
        personId: uid,
        role: 'parent',
        scopeType: 'global',
        scopeId: null,
        status: 'active',
      },
    });

    const result = await readLegacyUserIdentityShadow({
      db,
      uid,
    });

    expect(result.authority).toBe('legacy');
    expect(result.legacyData?.displayName).toBe('Legacy Parent');
    expect(result.shadow.status).toBe('semantic_mismatch');
    expect(result.shadow.mismatchFields).toEqual([
      'person.displayName',
    ]);
  });

  it('contains canonical read failures and preserves legacy authority', async () => {
    const uid = 'teacher-1';
    const authId = buildAuthIdentityId('firebase', uid);
    const roleId = buildRoleAssignmentId({
      personId: uid,
      role: 'teacher',
      scopeType: 'global',
    });

    const { db } = buildDb(
      {
        [`users/${uid}`]: {
          displayName: 'Teacher One',
          role: 'teacher',
          status: 'active',
        },
        [`authIdentities/${authId}`]: {
          personId: uid,
          provider: 'firebase',
          providerSubject: uid,
        },
        [`roleAssignments/${roleId}`]: {
          roleAssignmentId: roleId,
          personId: uid,
          role: 'teacher',
          scopeType: 'global',
          scopeId: null,
          status: 'active',
        },
      },
      [`people/${uid}`],
    );

    const result = await readLegacyUserIdentityShadow({
      db,
      uid,
    });

    expect(result.authority).toBe('legacy');
    expect(result.legacyData?.displayName).toBe('Teacher One');
    expect(result.shadow.status).toBe('canonical_read_error');
    expect(result.shadow.canonicalReadErrorKinds).toEqual([
      'person',
    ]);
  });

  it('classifies missing canonical documents without changing the legacy result', async () => {
    const uid = 'admin-1';
    const authId = buildAuthIdentityId('firebase', uid);
    const roleId = buildRoleAssignmentId({
      personId: uid,
      role: 'admin',
      scopeType: 'global',
    });

    const { db } = buildDb({
      [`users/${uid}`]: {
        displayName: 'Admin One',
        role: 'admin',
        status: 'active',
      },
      [`authIdentities/${authId}`]: {
        personId: uid,
        provider: 'firebase',
        providerSubject: uid,
      },
      [`roleAssignments/${roleId}`]: {
        roleAssignmentId: roleId,
        personId: uid,
        role: 'admin',
        scopeType: 'global',
        scopeId: null,
        status: 'active',
      },
    });

    const result = await readLegacyUserIdentityShadow({
      db,
      uid,
    });

    expect(result.authority).toBe('legacy');
    expect(result.shadow.status).toBe('canonical_missing');
    expect(result.shadow.missingCanonicalKinds).toEqual([
      'person',
    ]);
  });

  it('compares learner Person, profile and verified guardian relationship by point read', async () => {
    const kidId = 'kid-1';
    const guardianPersonId = 'parent-1';
    const guardianId = buildGuardianRelationshipId({
      guardianPersonId,
      learnerPersonId: kidId,
      relationshipType: 'parent',
    });

    const { db } = buildDb({
      [`kids/${kidId}`]: {
        fullName: 'Learner One',
        age: 8,
        countryCode: 'IN',
        status: 'active',
        parentId: guardianPersonId,
        parentIds: [guardianPersonId],
        primaryParentId: guardianPersonId,
      },
      [`people/${kidId}`]: {
        personId: kidId,
        kind: 'learner',
        status: 'active',
        displayName: 'Learner One',
        countryCode: 'IN',
      },
      [`learnerProfiles/${kidId}`]: {
        learnerProfileId: kidId,
        personId: kidId,
        status: 'active',
        ageYears: 8,
        countryCode: 'IN',
      },
      [`guardianRelationships/${guardianId}`]: {
        guardianRelationshipId: guardianId,
        guardianPersonId,
        learnerPersonId: kidId,
        relationshipType: 'parent',
        isPrimary: true,
        status: 'active',
      },
    });

    const result = await readLegacyLearnerIdentityShadow({
      db,
      kidId,
    });

    expect(result.authority).toBe('legacy');
    expect(result.legacyData?.fullName).toBe('Learner One');
    expect(result.shadow.status).toBe('match');
    expect(result.shadow.canonicalDocumentsExpected).toBe(3);
  });

  it('compares school Organisation and school-admin membership without globalising the role', async () => {
    const schoolId = 'school-1';
    const personId = 'school-admin-1';
    const membershipId = buildOrganisationMembershipId({
      organisationId: schoolId,
      personId,
      role: 'schoolAdmin',
    });
    const roleId = buildRoleAssignmentId({
      personId,
      role: 'schoolAdmin',
      scopeType: 'organisation',
      scopeId: schoolId,
    });

    const rows = {
      [`schools/${schoolId}`]: {
        name: 'School One',
        schoolCode: 'TS-1',
        status: 'active',
      },
      [`organisations/${schoolId}`]: {
        organisationId: schoolId,
        type: 'school',
        name: 'School One',
        status: 'active',
        legacySchoolCode: 'TS-1',
      },
      [`schoolUsers/${personId}`]: {
        userId: personId,
        role: 'schoolAdmin',
        schoolIds: [schoolId],
        primarySchoolId: schoolId,
        status: 'active',
      },
      [`organisationMemberships/${membershipId}`]: {
        organisationMembershipId: membershipId,
        organisationId: schoolId,
        personId,
        role: 'schoolAdmin',
        status: 'active',
        isPrimary: true,
      },
      [`roleAssignments/${roleId}`]: {
        roleAssignmentId: roleId,
        personId,
        role: 'schoolAdmin',
        scopeType: 'organisation',
        scopeId: schoolId,
        status: 'active',
      },
    };

    const school = await readLegacyOrganisationIdentityShadow({
      db: buildDb(rows).db,
      schoolId,
    });
    const membership =
      await readLegacyOrganisationMembershipShadow({
        db: buildDb(rows).db,
        schoolUserId: personId,
      });

    expect(school.authority).toBe('legacy');
    expect(school.shadow.status).toBe('match');
    expect(membership.authority).toBe('legacy');
    expect(membership.shadow.status).toBe('match');
    expect(membership.shadow.canonicalDocumentsExpected).toBe(2);
  });

  it('does not promote canonical state when the legacy authority is missing', async () => {
    const uid = 'missing-legacy';
    const authId = buildAuthIdentityId('firebase', uid);

    const { db } = buildDb({
      [`people/${uid}`]: {
        personId: uid,
        kind: 'adult',
        status: 'active',
        displayName: 'Canonical Only',
      },
      [`authIdentities/${authId}`]: {
        personId: uid,
        provider: 'firebase',
        providerSubject: uid,
      },
    });

    const result = await readLegacyUserIdentityShadow({
      db,
      uid,
    });

    expect(result.authority).toBe('legacy');
    expect(result.legacyExists).toBe(false);
    expect(result.legacyData).toBeNull();
    expect(result.shadow.status).toBe('legacy_missing');
  });
});
