import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  AUTH_ACCESS_READ_MODEL_COLLECTION,
  buildAuthAccessReadModel,
  loadCanonicalAuthAccessInput,
  refreshAuthAccessReadModel,
} from '../src/schoolOS/identity/authAccessReadModel';
import {
  buildAuthIdentityId,
} from '../src/schoolOS/identity/idStrategy';

type Row = Record<string, unknown> | null;

class FakeDocRef {
  constructor(
    public readonly path: string,
    private readonly rows: Map<string, Row>,
    private readonly reads: string[],
    private readonly writes: string[],
  ) {}

  async get() {
    this.reads.push(this.path);
    const data = this.rows.get(this.path) ?? null;
    return {
      id: this.path.split('/').pop()!,
      exists: Boolean(data),
      data: () => data,
    };
  }

  async set(
    data: Record<string, unknown>,
  ) {
    this.writes.push(this.path);
    this.rows.set(this.path, data);
  }
}

class FakeQuery {
  private queryField: string | null = null;
  private queryValue: unknown = null;
  private queryLimit = Number.POSITIVE_INFINITY;

  constructor(
    private readonly collectionName: string,
    private readonly rows: Map<string, Row>,
    private readonly reads: string[],
  ) {}

  where(
    field: string,
    op: string,
    value: unknown,
  ) {
    if (op !== '==') {
      throw new Error('unsupported fake query operator');
    }
    this.queryField = field;
    this.queryValue = value;
    return this;
  }

  limit(value: number) {
    this.queryLimit = value;
    return this;
  }

  async get() {
    this.reads.push(
      `${this.collectionName}:query:${this.queryField}:${String(this.queryValue)}:limit:${this.queryLimit}`,
    );

    const prefix = `${this.collectionName}/`;
    const docs = [...this.rows.entries()]
      .filter(([path, row]) => {
        if (!path.startsWith(prefix) || !row) return false;
        if (!this.queryField) return true;
        return (
          (row as Record<string, unknown>)[
            this.queryField
          ] === this.queryValue
        );
      })
      .slice(0, this.queryLimit)
      .map(([path, row]) => ({
        id: path.slice(prefix.length),
        data: () => row,
      }));

    return {
      size: docs.length,
      empty: docs.length === 0,
      docs,
    };
  }
}

class FakeCollection {
  constructor(
    private readonly name: string,
    private readonly rows: Map<string, Row>,
    private readonly reads: string[],
    private readonly writes: string[],
  ) {}

  doc(id: string) {
    return new FakeDocRef(
      `${this.name}/${id}`,
      this.rows,
      this.reads,
      this.writes,
    );
  }

  where(
    field: string,
    op: string,
    value: unknown,
  ) {
    return new FakeQuery(
      this.name,
      this.rows,
      this.reads,
    ).where(field, op, value);
  }
}

function buildDb(
  initial: Record<string, Row> = {},
) {
  const rows = new Map<string, Row>(
    Object.entries(initial),
  );
  const reads: string[] = [];
  const writes: string[] = [];

  const db = {
    collection(name: string) {
      return new FakeCollection(
        name,
        rows,
        reads,
        writes,
      );
    },
  } as unknown as admin.firestore.Firestore;

  return {
    db,
    rows,
    reads,
    writes,
  };
}

function baseCanonicalInput() {
  const firebaseUid = 'firebase-uid-1';
  const personId = 'person-1';
  const authIdentityId =
    buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );

  return {
    firebaseUid,
    person: {
      personId,
      status: 'active' as const,
    },
    authIdentity: {
      authIdentityId,
      personId,
      provider: 'firebase' as const,
      providerSubject: firebaseUid,
      status: 'active' as const,
    },
    roleAssignments: [
      {
        roleAssignmentId:
          'role-parent',
        personId,
        role: 'parent' as const,
        scopeType: 'global' as const,
        scopeId: null,
        status: 'active' as const,
      },
    ],
    organisationMemberships: [],
  };
}

describe('Wave 1 R5A canonical auth access read model', () => {
  it('builds a UID-keyed active parent projection from canonical facts', () => {
    const record =
      buildAuthAccessReadModel(
        baseCanonicalInput(),
      );

    expect(record).toEqual({
      schemaVersion: 1,
      authority: 'canonical-derived',
      firebaseUid: 'firebase-uid-1',
      personId: 'person-1',
      personStatus: 'active',
      authStatus: 'active',
      accessActive: true,
      globalRoles: ['parent'],
      schoolAdminOrganisationIds: [],
      sourceAuthIdentityId:
        buildAuthIdentityId(
          'firebase',
          'firebase-uid-1',
        ),
    });
  });

  it('sorts and de-duplicates only active global roles', () => {
    const input =
      baseCanonicalInput();

    input.roleAssignments.push(
      {
        roleAssignmentId:
          'role-teacher',
        personId: 'person-1',
        role: 'teacher',
        scopeType: 'global',
        scopeId: null,
        status: 'active',
      },
      {
        roleAssignmentId:
          'role-parent-duplicate',
        personId: 'person-1',
        role: 'parent',
        scopeType: 'global',
        scopeId: null,
        status: 'active',
      },
      {
        roleAssignmentId:
          'role-admin-inactive',
        personId: 'person-1',
        role: 'admin',
        scopeType: 'global',
        scopeId: null,
        status: 'inactive',
      },
    );

    const record =
      buildAuthAccessReadModel(input);

    expect(record.globalRoles).toEqual([
      'parent',
      'teacher',
    ]);
  });

  it('requires both active school membership and active organisation-scoped RoleAssignment', () => {
    const input =
      baseCanonicalInput();

    input.roleAssignments.push(
      {
        roleAssignmentId:
          'school-role-1',
        personId: 'person-1',
        role: 'schoolAdmin',
        scopeType:
          'organisation',
        scopeId: 'school-1',
        status: 'active',
      },
      {
        roleAssignmentId:
          'school-role-2-inactive',
        personId: 'person-1',
        role: 'schoolAdmin',
        scopeType:
          'organisation',
        scopeId: 'school-2',
        status: 'inactive',
      },
    );

    input.organisationMemberships.push(
      {
        organisationMembershipId:
          'membership-1',
        organisationId: 'school-1',
        personId: 'person-1',
        role: 'schoolAdmin',
        status: 'active',
      },
      {
        organisationMembershipId:
          'membership-2',
        organisationId: 'school-2',
        personId: 'person-1',
        role: 'schoolAdmin',
        status: 'active',
      },
      {
        organisationMembershipId:
          'membership-3',
        organisationId: 'school-3',
        personId: 'person-1',
        role: 'schoolAdmin',
        status: 'active',
      },
    );

    const record =
      buildAuthAccessReadModel(input);

    expect(
      record.schoolAdminOrganisationIds,
    ).toEqual(['school-1']);
  });

  it('marks access inactive when either Person or AuthIdentity is not active', () => {
    const suspended =
      baseCanonicalInput();
    suspended.person.status =
      'suspended';

    const disabled =
      baseCanonicalInput();
    disabled.authIdentity.status =
      'disabled';

    expect(
      buildAuthAccessReadModel(
        suspended,
      ).accessActive,
    ).toBe(false);
    expect(
      buildAuthAccessReadModel(
        disabled,
      ).accessActive,
    ).toBe(false);
  });

  it('fails closed when AuthIdentity does not map the UID to the Person', () => {
    const wrongSubject =
      baseCanonicalInput();
    wrongSubject.authIdentity.providerSubject =
      'another-uid';

    expect(() =>
      buildAuthAccessReadModel(
        wrongSubject,
      ),
    ).toThrow(
      'auth_identity_subject_mismatch',
    );

    const wrongPerson =
      baseCanonicalInput();
    wrongPerson.authIdentity.personId =
      'another-person';

    expect(() =>
      buildAuthAccessReadModel(
        wrongPerson,
      ),
    ).toThrow(
      'auth_identity_person_mismatch',
    );
  });

  it('fails closed when a role or organisation membership belongs to another Person', () => {
    const roleMismatch =
      baseCanonicalInput();
    roleMismatch.roleAssignments[0]
      .personId = 'another-person';

    expect(() =>
      buildAuthAccessReadModel(
        roleMismatch,
      ),
    ).toThrow(
      'role_assignment_person_mismatch',
    );

    const membershipMismatch =
      baseCanonicalInput();
    membershipMismatch.organisationMemberships.push(
      {
        organisationMembershipId:
          'membership-wrong',
        organisationId: 'school-1',
        personId: 'another-person',
        role: 'schoolAdmin',
        status: 'active',
      },
    );

    expect(() =>
      buildAuthAccessReadModel(
        membershipMismatch,
      ),
    ).toThrow(
      'organisation_membership_person_mismatch',
    );
  });

  it('loads only canonical identity collections and never reads users compatibility state', async () => {
    const input =
      baseCanonicalInput();
    const authIdentityId =
      input.authIdentity.authIdentityId;
    const { db, reads } = buildDb({
      [`authIdentities/${authIdentityId}`]:
        {
          ...input.authIdentity,
        },
      'people/person-1': {
        ...input.person,
      },
      'roleAssignments/role-parent': {
        ...input.roleAssignments[0],
      },
    });

    const result =
      await loadCanonicalAuthAccessInput({
        db,
        firebaseUid:
          'firebase-uid-1',
      });

    expect(
      result.input.person.personId,
    ).toBe('person-1');
    expect(
      result.input.roleAssignments,
    ).toHaveLength(1);
    expect(
      reads.some(
        (read) =>
          read.startsWith('users/'),
      ),
    ).toBe(false);
    expect(
      reads.some(
        (read) =>
          read.startsWith('users:'),
      ),
    ).toBe(false);
  });

  it('fails closed on an invalid role string loaded from canonical storage', async () => {
    const input =
      baseCanonicalInput();
    const authIdentityId =
      input.authIdentity.authIdentityId;

    const { db } = buildDb({
      [`authIdentities/${authIdentityId}`]:
        {
          ...input.authIdentity,
        },
      'people/person-1': {
        ...input.person,
      },
      'roleAssignments/role-invalid': {
        roleAssignmentId:
          'role-invalid',
        personId: 'person-1',
        role: 'unknownRole',
        scopeType: 'global',
        scopeId: null,
        status: 'active',
      },
    });

    await expect(
      loadCanonicalAuthAccessInput({
        db,
        firebaseUid:
          'firebase-uid-1',
      }),
    ).rejects.toThrow(
      'role_assignment_role_invalid',
    );
  });

  it('enforces bounded role and membership queries', async () => {
    const input =
      baseCanonicalInput();
    const authIdentityId =
      input.authIdentity.authIdentityId;

    const rows: Record<string, Row> = {
      [`authIdentities/${authIdentityId}`]:
        {
          ...input.authIdentity,
        },
      'people/person-1': {
        ...input.person,
      },
    };

    rows['roleAssignments/role-1'] = {
      ...input.roleAssignments[0],
      roleAssignmentId: 'role-1',
    };
    rows['roleAssignments/role-2'] = {
      ...input.roleAssignments[0],
      roleAssignmentId: 'role-2',
    };

    const { db } = buildDb(rows);

    await expect(
      loadCanonicalAuthAccessInput({
        db,
        firebaseUid:
          'firebase-uid-1',
        maxRoleAssignments: 1,
      }),
    ).rejects.toThrow(
      'role_assignment_bound_exceeded',
    );
  });

  it('refreshes exactly one UID-keyed derived document and does not write legacy collections', async () => {
    const input =
      baseCanonicalInput();
    const authIdentityId =
      input.authIdentity.authIdentityId;

    const { db, rows, writes } =
      buildDb({
        [`authIdentities/${authIdentityId}`]:
          {
            ...input.authIdentity,
          },
        'people/person-1': {
          ...input.person,
        },
        'roleAssignments/role-parent': {
          ...input.roleAssignments[0],
        },
      });

    const result =
      await refreshAuthAccessReadModel({
        db,
        firebaseUid:
          'firebase-uid-1',
      });

    expect(result.accessActive).toBe(true);
    expect(writes).toEqual([
      `${AUTH_ACCESS_READ_MODEL_COLLECTION}/firebase-uid-1`,
    ]);
    expect(
      rows.get(
        `${AUTH_ACCESS_READ_MODEL_COLLECTION}/firebase-uid-1`,
      ),
    ).toMatchObject({
      firebaseUid:
        'firebase-uid-1',
      personId: 'person-1',
      globalRoles: ['parent'],
      accessActive: true,
    });
    expect(
      writes.some(
        (write) =>
          write.startsWith('users/'),
      ),
    ).toBe(false);
  });
});
