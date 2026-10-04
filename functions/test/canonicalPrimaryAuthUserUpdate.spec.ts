import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from '../src/schoolOS/identity/idStrategy';
import {
  planCanonicalAuthUserUpdate,
  writeCanonicalAuthUserUpdatePlan,
} from '../src/schoolOS/identity/canonicalPrimaryAuthUserUpdate';

type Row = Record<string, unknown> | null;

class FakeRef {
  constructor(
    public readonly path: string,
    private readonly rows: Map<string, Row>,
  ) {}

  async get() {
    const data = this.rows.get(this.path) ?? null;
    return {
      exists: Boolean(data),
      data: () => data,
    };
  }
}

class FakeCollection {
  constructor(
    private readonly name: string,
    private readonly rows: Map<string, Row>,
  ) {}

  doc(id: string) {
    return new FakeRef(
      `${this.name}/${id}`,
      this.rows,
    );
  }
}

class FakeTransaction {
  constructor(
    private readonly rows: Map<string, Row>,
  ) {}

  async get(ref: FakeRef) {
    return ref.get();
  }

  set(
    ref: FakeRef,
    data: Record<string, unknown>,
    options?: { merge?: boolean },
  ) {
    if (options?.merge) {
      const current =
        this.rows.get(ref.path) || {};
      this.rows.set(ref.path, {
        ...(current as Record<string, unknown>),
        ...data,
      });
      return;
    }
    this.rows.set(ref.path, data);
  }

  delete(ref: FakeRef) {
    this.rows.delete(ref.path);
  }
}

function buildDb(
  initial: Record<string, Row>,
) {
  const rows = new Map<string, Row>(
    Object.entries(initial),
  );

  const db = {
    collection(name: string) {
      return new FakeCollection(name, rows);
    },
    async runTransaction(
      callback: (
        transaction: FakeTransaction,
      ) => Promise<unknown>,
    ) {
      const staged = new Map(rows);
      const result = await callback(
        new FakeTransaction(staged),
      );
      rows.clear();
      staged.forEach((value, key) =>
        rows.set(key, value));
      return result;
    },
  } as unknown as admin.firestore.Firestore;

  return { db, rows };
}

function existingState(params?: {
  personId?: string;
  firebaseUid?: string;
  role?: 'teacher' | 'parent';
}) {
  const personId =
    params?.personId || 'person-1';
  const firebaseUid =
    params?.firebaseUid || 'uid-1';
  const role = params?.role || 'teacher';
  const authIdentityId =
    buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );
  const roleAssignmentId =
    buildRoleAssignmentId({
      personId,
      role,
      scopeType: 'global',
    });

  return {
    personId,
    firebaseUid,
    authIdentityId,
    roleAssignmentId,
    rows: {
      [`people/${personId}`]: {
        personId,
        kind: 'adult',
        status: 'active',
        displayName: 'Before Name',
      },
      [`authIdentities/${authIdentityId}`]: {
        authIdentityId,
        personId,
        provider: 'firebase',
        providerSubject: firebaseUid,
        status: 'active',
      },
      [`users/${firebaseUid}`]: {
        uid: firebaseUid,
        userId: firebaseUid,
        canonicalPersonId:
          personId === firebaseUid
            ? undefined
            : personId,
        role,
        roles: [role],
        status: 'active',
      },
      [`roleAssignments/${roleAssignmentId}`]: {
        roleAssignmentId,
        personId,
        role,
        scopeType: 'global',
        scopeId: null,
        status: 'active',
      },
      [`personContacts/${personId}`]: {
        personContactId: personId,
        personId,
        email: 'before@example.com',
        phoneCountryCode: '+91',
        phoneLocal: '9000000000',
      },
      [`${role === 'teacher' ? 'teachers' : 'parents'}/${firebaseUid}`]: {
        userId: firebaseUid,
        canonicalPersonId:
          personId === firebaseUid
            ? undefined
            : personId,
        displayName: 'Before Name',
        status: 'active',
      },
    } as Record<string, Row>,
  };
}

const updateInput = {
  personId: 'person-1',
  firebaseUid: 'uid-1',
  previousRole: 'teacher' as const,
  nextRole: 'teacher' as const,
  displayName: 'Teacher Updated',
  email: 'UPDATED@example.com',
  phone: '+91 9888888888',
  status: 'active' as const,
  actorId: 'admin-actor',
  writeId: 'auth-update:nonce-1',
};

describe('Wave 1 R4 Brick 5C canonical auth-user update writer', () => {
  it('plans same-role canonical and UID-keyed compatibility updates', () => {
    const plan =
      planCanonicalAuthUserUpdate(
        updateInput,
      );

    expect(plan.canonicalWrites).toHaveLength(4);
    expect(
      plan.compatibilityWrites.map(
        (operation) =>
          `${operation.operation}:${operation.collection}/${operation.documentId}`,
      ),
    ).toEqual([
      'set:users/uid-1',
      'set:teachers/uid-1',
    ]);

    const userWrite =
      plan.compatibilityWrites[0];
    expect(
      userWrite.operation === 'set'
        ? userWrite.data
        : {},
    ).toMatchObject({
      canonicalPersonId: 'person-1',
      uid: 'uid-1',
      role: 'teacher',
      status: 'active',
      _wave1CanonicalProjection: {
        authority: 'canonical-primary',
        command: 'auth_user_update',
        canonicalPersonId: 'person-1',
        providerSubject: 'uid-1',
        writeId: 'auth-update:nonce-1',
      },
    });
  });

  it('plans a role transition as old RoleAssignment inactive plus new RoleAssignment active', () => {
    const plan =
      planCanonicalAuthUserUpdate({
        ...updateInput,
        nextRole: 'parent',
      });

    const roleWrites =
      plan.canonicalWrites.filter(
        (operation) =>
          operation.collection ===
          'roleAssignments',
      );

    expect(roleWrites).toHaveLength(2);
    expect(
      roleWrites.map((operation) =>
        operation.operation === 'set'
          ? operation.data.status
          : null),
    ).toEqual(['inactive', 'active']);

    expect(
      plan.compatibilityWrites.map(
        (operation) =>
          `${operation.operation}:${operation.collection}/${operation.documentId}`,
      ),
    ).toEqual([
      'set:users/uid-1',
      'delete:teachers/uid-1',
      'set:parents/uid-1',
    ]);
  });

  it('never creates a second person-keyed destination role root for a decoupled identity', () => {
    const plan =
      planCanonicalAuthUserUpdate({
        ...updateInput,
        nextRole: 'parent',
      });

    expect(
      plan.compatibilityWrites.some(
        (operation) =>
          operation.collection ===
            'parents' &&
          operation.documentId ===
            'person-1',
      ),
    ).toBe(false);

    expect(
      plan.guardedExistingPaths,
    ).toContainEqual({
      collection: 'parents',
      documentId: 'person-1',
      kind: 'nextRoleMirror',
    });
  });

  it('supports legacy-adopted same-value Person and UID without treating equality as a new-ID rule', () => {
    const plan =
      planCanonicalAuthUserUpdate({
        ...updateInput,
        personId: 'legacy-uid',
        firebaseUid: 'legacy-uid',
      });

    expect(plan.personId).toBe('legacy-uid');
    expect(plan.firebaseUid).toBe('legacy-uid');
    expect(
      plan.guardedExistingPaths.some(
        (entry) =>
          entry.collection === 'teachers' &&
          entry.documentId === 'legacy-uid',
      ),
    ).toBe(false);
  });

  it('maps suspended status to disabled AuthIdentity and inactive role assignment', () => {
    const plan =
      planCanonicalAuthUserUpdate({
        ...updateInput,
        status: 'suspended',
      });

    const authWrite =
      plan.canonicalWrites.find(
        (operation) =>
          operation.collection ===
          'authIdentities',
      );
    const roleWrite =
      plan.canonicalWrites.find(
        (operation) =>
          operation.collection ===
          'roleAssignments',
      );

    expect(
      authWrite?.operation === 'set'
        ? authWrite.data.status
        : null,
    ).toBe('disabled');
    expect(
      roleWrite?.operation === 'set'
        ? roleWrite.data.status
        : null,
    ).toBe('inactive');
  });

  it('requires dedicated flows for kid and schoolAdmin role transitions', () => {
    expect(() =>
      planCanonicalAuthUserUpdate({
        ...updateInput,
        nextRole: 'kid' as any,
      }),
    ).toThrow(
      'auth_user_update_role_requires_dedicated_flow',
    );

    expect(() =>
      planCanonicalAuthUserUpdate({
        ...updateInput,
        nextRole: 'schoolAdmin' as any,
      }),
    ).toThrow(
      'auth_user_update_role_requires_dedicated_flow',
    );
  });

  it('atomically updates canonical and compatibility state for a decoupled same-role user', async () => {
    const existing = existingState();
    const { db, rows } = buildDb(
      existing.rows,
    );
    const plan =
      planCanonicalAuthUserUpdate(
        updateInput,
      );

    const result =
      await writeCanonicalAuthUserUpdatePlan({
        db,
        plan,
      });

    expect(result).toEqual({
      personId: 'person-1',
      firebaseUid: 'uid-1',
      writeId: 'auth-update:nonce-1',
      canonicalWritesApplied: 4,
      compatibilityWritesApplied: 2,
      verifiedDocuments: 6,
    });

    expect(
      rows.get('people/person-1'),
    ).toMatchObject({
      personId: 'person-1',
      displayName: 'Teacher Updated',
      status: 'active',
    });
    expect(
      rows.get('users/uid-1'),
    ).toMatchObject({
      canonicalPersonId: 'person-1',
      displayName: 'Teacher Updated',
      email: 'updated@example.com',
    });
    expect(
      rows.get(
        'personContacts/person-1',
      ),
    ).toMatchObject({
      personId: 'person-1',
      email: 'updated@example.com',
      phoneCountryCode: '+91',
      phoneLocal: '9000000000',
    });
  });

  it('atomically performs a teacher to parent role transition and preserves role history', async () => {
    const existing = existingState();
    const { db, rows } = buildDb(
      existing.rows,
    );
    const plan =
      planCanonicalAuthUserUpdate({
        ...updateInput,
        nextRole: 'parent',
      });

    const result =
      await writeCanonicalAuthUserUpdatePlan({
        db,
        plan,
      });

    expect(
      result.canonicalWritesApplied,
    ).toBe(5);
    expect(
      result.compatibilityWritesApplied,
    ).toBe(3);
    expect(
      rows.has('teachers/uid-1'),
    ).toBe(false);
    expect(
      rows.get('parents/uid-1'),
    ).toMatchObject({
      canonicalPersonId: 'person-1',
      userId: 'uid-1',
      status: 'active',
    });

    const oldRoleId =
      buildRoleAssignmentId({
        personId: 'person-1',
        role: 'teacher',
        scopeType: 'global',
      });
    const newRoleId =
      buildRoleAssignmentId({
        personId: 'person-1',
        role: 'parent',
        scopeType: 'global',
      });

    expect(
      rows.get(
        `roleAssignments/${oldRoleId}`,
      ),
    ).toMatchObject({
      personId: 'person-1',
      role: 'teacher',
      status: 'inactive',
    });
    expect(
      rows.get(
        `roleAssignments/${newRoleId}`,
      ),
    ).toMatchObject({
      personId: 'person-1',
      role: 'parent',
      status: 'active',
    });
  });

  it('fails closed when AuthIdentity does not map the UID to the requested Person', async () => {
    const existing = existingState();
    existing.rows[
      `authIdentities/${existing.authIdentityId}`
    ] = {
      authIdentityId:
        existing.authIdentityId,
      personId: 'different-person',
      provider: 'firebase',
      providerSubject: 'uid-1',
    };

    const { db, rows } = buildDb(
      existing.rows,
    );
    const plan =
      planCanonicalAuthUserUpdate(
        updateInput,
      );

    await expect(
      writeCanonicalAuthUserUpdatePlan({
        db,
        plan,
      }),
    ).rejects.toThrow(
      'auth_user_update_auth_identity_mismatch',
    );

    expect(
      rows.get('people/person-1'),
    ).toMatchObject({
      displayName: 'Before Name',
    });
  });

  it('fails closed on a destination role-mirror collision owned by another Person', async () => {
    const existing = existingState();
    existing.rows['parents/uid-1'] = {
      userId: 'uid-1',
      canonicalPersonId:
        'different-person',
    };

    const { db } = buildDb(existing.rows);
    const plan =
      planCanonicalAuthUserUpdate({
        ...updateInput,
        nextRole: 'parent',
      });

    await expect(
      writeCanonicalAuthUserUpdatePlan({
        db,
        plan,
      }),
    ).rejects.toThrow(
      'auth_user_update_next_role_mirror_collision',
    );
  });
});
