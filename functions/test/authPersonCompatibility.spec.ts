import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from '../src/schoolOS/identity/idStrategy';
import {
  AUTH_PERSON_COMPATIBILITY_MODE,
  buildAuthPersonCompatibilityPlan,
  resolveFirebaseUidFromPersonId,
  resolvePersonIdFromFirebaseUid,
} from '../src/schoolOS/identity/authPersonCompatibility';

type Row = Record<string, unknown> | null;

class FakeDocumentRef {
  constructor(
    public readonly path: string,
    protected readonly rows: Record<string, Row>,
  ) {}

  async get() {
    const data = this.rows[this.path] ?? null;
    return {
      exists: Boolean(data),
      id: this.path.split('/').pop() || '',
      data: () => data,
    };
  }
}

class FakeQuery {
  private filters: Array<{
    field: string;
    value: unknown;
  }> = [];
  private maxRows = Number.POSITIVE_INFINITY;

  constructor(
    private readonly collectionName: string,
    private readonly rows: Record<string, Row>,
  ) {}

  where(
    field: string,
    operator: string,
    value: unknown,
  ) {
    if (operator !== '==') {
      throw new Error('FakeQuery only supports equality');
    }
    this.filters.push({ field, value });
    return this;
  }

  limit(value: number) {
    this.maxRows = value;
    return this;
  }

  async get() {
    const prefix = `${this.collectionName}/`;
    const docs = Object.entries(this.rows)
      .filter(([path, data]) => {
        if (!path.startsWith(prefix) || !data) return false;
        return this.filters.every(
          ({ field, value }) => data[field] === value,
        );
      })
      .slice(0, this.maxRows)
      .map(([path, data]) => ({
        id: path.slice(prefix.length),
        data: () => data,
      }));

    return { docs };
  }
}

class FakeCollection extends FakeQuery {
  constructor(
    private readonly name: string,
    rows: Record<string, Row>,
  ) {
    super(name, rows);
  }

  doc(id: string) {
    return new FakeDocumentRef(
      `${this.name}/${id}`,
      this.rows,
    );
  }
}

function buildDb(rows: Record<string, Row>) {
  return {
    collection(name: string) {
      return new FakeCollection(name, rows);
    },
  } as unknown as admin.firestore.Firestore;
}

describe('Wave 1 R4 Brick 5A auth-backed UID/Person compatibility contract', () => {
  it('preserves same-value legacy adoption without semantic UID coupling', () => {
    const uid = 'legacy-teacher-1';
    const roleAssignmentId = buildRoleAssignmentId({
      personId: uid,
      role: 'teacher',
      scopeType: 'global',
    });

    const plan = buildAuthPersonCompatibilityPlan({
      personId: uid,
      firebaseUid: uid,
      role: 'teacher',
    });

    expect(plan).toMatchObject({
      mode: AUTH_PERSON_COMPATIBILITY_MODE,
      personId: uid,
      firebaseUid: uid,
      roleAssignmentId,
      identitySemantics: 'legacy_adopted_same_value',
      roleProfileState: 'same_document_legacy_adoption',
      requiresRoleRootKeyCutover: false,
      canonical: {
        personPath: `people/${uid}`,
        roleProfilePath: `teachers/${uid}`,
      },
      compatibility: {
        userPath: `users/${uid}`,
        roleMirrorPath: `teachers/${uid}`,
      },
    });
  });

  it('keeps a new Person ID independent from Firebase UID and blocks duplicate role roots', () => {
    const personId = 'person-generated-123';
    const firebaseUid = 'firebase-auth-abc';

    const plan = buildAuthPersonCompatibilityPlan({
      personId,
      firebaseUid,
      role: 'teacher',
    });

    expect(plan.identitySemantics).toBe(
      'decoupled_person_and_auth',
    );
    expect(plan.canonical.personPath).toBe(
      `people/${personId}`,
    );
    expect(plan.canonical.authIdentityPath).toBe(
      `authIdentities/${buildAuthIdentityId(
        'firebase',
        firebaseUid,
      )}`,
    );
    expect(plan.canonical.roleAssignmentPath).toContain(
      'roleAssignments/role_',
    );
    expect(plan.compatibility.userPath).toBe(
      `users/${firebaseUid}`,
    );
    expect(plan.compatibility.roleMirrorPath).toBe(
      `teachers/${firebaseUid}`,
    );
    expect(plan.canonical.roleProfilePath).toBeNull();
    expect(plan.roleProfileState).toBe(
      'deferred_person_key_cutover',
    );
    expect(plan.requiresRoleRootKeyCutover).toBe(true);
  });

  it('does not invent role-root compatibility for roles without a root mirror', () => {
    const plan = buildAuthPersonCompatibilityPlan({
      personId: 'person-school-admin',
      firebaseUid: 'uid-school-admin',
      role: 'schoolAdmin',
    });

    expect(plan.compatibility.roleMirrorPath).toBeNull();
    expect(plan.canonical.roleProfilePath).toBeNull();
    expect(plan.roleProfileState).toBe('not_applicable');
    expect(plan.requiresRoleRootKeyCutover).toBe(false);
    expect(plan.canonical.staffPrivateProfilePath).toBe(
      'staffPrivateProfiles/person-school-admin',
    );
  });

  it('resolves a decoupled Firebase UID to Person only through AuthIdentity', async () => {
    const personId = 'person-42';
    const firebaseUid = 'uid-42';
    const authIdentityId = buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );
    const db = buildDb({
      [`authIdentities/${authIdentityId}`]: {
        authIdentityId,
        personId,
        provider: 'firebase',
        providerSubject: firebaseUid,
        status: 'active',
      },
      [`people/${personId}`]: {
        personId,
        kind: 'adult',
        status: 'active',
        displayName: 'Teacher Forty Two',
      },
    });

    await expect(
      resolvePersonIdFromFirebaseUid({
        db,
        firebaseUid,
      }),
    ).resolves.toEqual({
      personId,
      firebaseUid,
      authIdentityId,
      source: 'authIdentity',
    });
  });

  it('refuses to infer personId = uid when AuthIdentity is absent', async () => {
    const firebaseUid = 'uid-without-auth-bridge';
    const db = buildDb({
      [`users/${firebaseUid}`]: {
        uid: firebaseUid,
      },
      [`people/${firebaseUid}`]: {
        personId: firebaseUid,
      },
    });

    await expect(
      resolvePersonIdFromFirebaseUid({
        db,
        firebaseUid,
      }),
    ).rejects.toThrow('auth_identity_missing');
  });

  it('allows the old same-value adoption only through an explicit fallback', async () => {
    const firebaseUid = 'legacy-parent';
    const db = buildDb({
      [`users/${firebaseUid}`]: {
        uid: firebaseUid,
        role: 'parent',
      },
      [`people/${firebaseUid}`]: {
        personId: firebaseUid,
        kind: 'adult',
      },
    });

    await expect(
      resolvePersonIdFromFirebaseUid({
        db,
        firebaseUid,
        allowLegacyAdoptionFallback: true,
      }),
    ).resolves.toMatchObject({
      personId: firebaseUid,
      firebaseUid,
      source: 'legacy_adopted_fallback',
    });
  });

  it('rejects an AuthIdentity whose provider subject does not match the Firebase UID', async () => {
    const firebaseUid = 'uid-correct';
    const authIdentityId = buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );
    const db = buildDb({
      [`authIdentities/${authIdentityId}`]: {
        authIdentityId,
        personId: 'person-1',
        provider: 'firebase',
        providerSubject: 'uid-wrong',
      },
    });

    await expect(
      resolvePersonIdFromFirebaseUid({
        db,
        firebaseUid,
        verifyPersonExists: false,
      }),
    ).rejects.toThrow('auth_identity_subject_mismatch');
  });

  it('resolves Person back to the one deterministic Firebase AuthIdentity', async () => {
    const personId = 'person-reverse';
    const firebaseUid = 'uid-reverse';
    const authIdentityId = buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );
    const db = buildDb({
      [`authIdentities/${authIdentityId}`]: {
        authIdentityId,
        personId,
        provider: 'firebase',
        providerSubject: firebaseUid,
      },
    });

    await expect(
      resolveFirebaseUidFromPersonId({
        db,
        personId,
      }),
    ).resolves.toEqual({
      personId,
      firebaseUid,
      authIdentityId,
    });
  });

  it('fails closed if more than one Firebase AuthIdentity points to one Person', async () => {
    const personId = 'person-ambiguous';
    const uidA = 'uid-a';
    const uidB = 'uid-b';
    const idA = buildAuthIdentityId('firebase', uidA);
    const idB = buildAuthIdentityId('firebase', uidB);
    const db = buildDb({
      [`authIdentities/${idA}`]: {
        authIdentityId: idA,
        personId,
        provider: 'firebase',
        providerSubject: uidA,
      },
      [`authIdentities/${idB}`]: {
        authIdentityId: idB,
        personId,
        provider: 'firebase',
        providerSubject: uidB,
      },
    });

    await expect(
      resolveFirebaseUidFromPersonId({
        db,
        personId,
      }),
    ).rejects.toThrow('firebase_auth_identity_ambiguous');
  });
});
