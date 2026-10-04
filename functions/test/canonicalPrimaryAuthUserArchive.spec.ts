import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from '../src/schoolOS/identity/idStrategy';
import {
  planCanonicalAuthUserArchive,
  writeCanonicalAuthUserArchivePlan,
} from '../src/schoolOS/identity/canonicalPrimaryAuthUserArchive';

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
    const current =
      options?.merge
        ? this.rows.get(ref.path) || {}
        : {};
    this.rows.set(ref.path, {
      ...(current as Record<string, unknown>),
      ...data,
    });
  }
}

function buildState(params?: {
  personId?: string;
  uid?: string;
  role?: 'teacher' | 'founder';
}) {
  const personId =
    params?.personId || 'person-archive';
  const uid = params?.uid || 'uid-archive';
  const role = params?.role || 'teacher';
  const authId =
    buildAuthIdentityId('firebase', uid);
  const roleId =
    buildRoleAssignmentId({
      personId,
      role,
      scopeType: 'global',
    });

  const rows: Record<string, Row> = {
    [`people/${personId}`]: {
      personId,
      kind: 'adult',
      status: 'active',
    },
    [`authIdentities/${authId}`]: {
      authIdentityId: authId,
      personId,
      provider: 'firebase',
      providerSubject: uid,
      status: 'active',
    },
    [`roleAssignments/${roleId}`]: {
      roleAssignmentId: roleId,
      personId,
      role,
      scopeType: 'global',
      scopeId: null,
      status: 'active',
    },
    [`users/${uid}`]: {
      uid,
      userId: uid,
      canonicalPersonId:
        personId === uid
          ? undefined
          : personId,
      role,
      status: 'active',
    },
  };

  if (role === 'teacher') {
    rows[`teachers/${uid}`] = {
      uid,
      userId: uid,
      canonicalPersonId:
        personId === uid
          ? undefined
          : personId,
      status: 'active',
    };
  }

  return {
    personId,
    uid,
    authId,
    roleId,
    rows,
  };
}

function buildDb(initial: Record<string, Row>) {
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

describe('Wave 1 R4 Brick 5D canonical auth-user archive writer', () => {
  it('plans canonical archive lifecycle plus UID compatibility status', () => {
    const plan =
      planCanonicalAuthUserArchive({
        personId: 'person-1',
        firebaseUid: 'uid-1',
        role: 'teacher',
        actorId: 'admin-1',
        writeId: 'archive-write-1',
        archivedReason: 'No longer active',
      });

    expect(
      plan.canonicalWrites.map(
        (operation) =>
          `${operation.collection}/${operation.documentId}`,
      ),
    ).toEqual([
      'people/person-1',
      expect.stringMatching(
        /^authIdentities\\/auth_/,
      ),
      expect.stringMatching(
        /^roleAssignments\\/role_/,
      ),
      'personLifecycle/person-1',
    ]);

    expect(
      plan.compatibilityWrites.map(
        (operation) =>
          `${operation.collection}/${operation.documentId}`,
      ),
    ).toEqual([
      'users/uid-1',
      'teachers/uid-1',
    ]);

    const lifecycle =
      plan.canonicalWrites.find(
        (operation) =>
          operation.collection ===
          'personLifecycle',
      );
    expect(lifecycle?.data).toMatchObject({
      personId: 'person-1',
      archivedBy: 'admin-1',
      archivedReason: 'No longer active',
    });
    expect(
      lifecycle?.serverTimestampFields,
    ).toEqual(['archivedAt']);
  });

  it('does not invent a role mirror for founder', () => {
    const plan =
      planCanonicalAuthUserArchive({
        personId: 'founder-person',
        firebaseUid: 'founder-uid',
        role: 'founder',
        actorId: 'admin-1',
        writeId: 'archive-founder',
      });

    expect(
      plan.compatibilityWrites.map(
        (operation) => operation.collection,
      ),
    ).toEqual(['users']);
  });

  it('archives canonical and compatibility state atomically', async () => {
    const existing = buildState();
    const { db, rows } = buildDb(
      existing.rows,
    );
    const plan =
      planCanonicalAuthUserArchive({
        personId: existing.personId,
        firebaseUid: existing.uid,
        role: 'teacher',
        actorId: 'admin-1',
        writeId: 'archive-write-2',
      });

    const result =
      await writeCanonicalAuthUserArchivePlan({
        db,
        plan,
      });

    expect(result).toEqual({
      personId: existing.personId,
      firebaseUid: existing.uid,
      writeId: 'archive-write-2',
      canonicalWritesApplied: 4,
      compatibilityWritesApplied: 2,
      verifiedDocuments: 6,
    });

    expect(
      rows.get(
        `people/${existing.personId}`,
      ),
    ).toMatchObject({
      status: 'archived',
    });
    expect(
      rows.get(
        `authIdentities/${existing.authId}`,
      ),
    ).toMatchObject({
      status: 'archived',
    });
    expect(
      rows.get(
        `roleAssignments/${existing.roleId}`,
      ),
    ).toMatchObject({
      status: 'inactive',
    });
    expect(
      rows.get(
        `personLifecycle/${existing.personId}`,
      ),
    ).toMatchObject({
      personId: existing.personId,
      archivedBy: 'admin-1',
    });
    expect(
      rows.get(
        `users/${existing.uid}`,
      ),
    ).toMatchObject({
      status: 'archived',
      canonicalPersonId:
        existing.personId,
    });
  });

  it('supports legacy-adopted same-value identity', async () => {
    const existing = buildState({
      personId: 'legacy-uid',
      uid: 'legacy-uid',
    });
    const { db, rows } = buildDb(
      existing.rows,
    );
    const plan =
      planCanonicalAuthUserArchive({
        personId: 'legacy-uid',
        firebaseUid: 'legacy-uid',
        role: 'teacher',
        actorId: 'admin-1',
        writeId: 'archive-legacy',
      });

    await writeCanonicalAuthUserArchivePlan({
      db,
      plan,
    });

    expect(
      rows.get('people/legacy-uid'),
    ).toMatchObject({
      status: 'archived',
    });
    expect(
      rows.get('teachers/legacy-uid'),
    ).toMatchObject({
      status: 'archived',
    });
  });

  it('fails closed when AuthIdentity points to another Person', async () => {
    const existing = buildState();
    existing.rows[
      `authIdentities/${existing.authId}`
    ] = {
      authIdentityId: existing.authId,
      personId: 'wrong-person',
      provider: 'firebase',
      providerSubject: existing.uid,
    };
    const { db } = buildDb(existing.rows);
    const plan =
      planCanonicalAuthUserArchive({
        personId: existing.personId,
        firebaseUid: existing.uid,
        role: 'teacher',
        actorId: 'admin-1',
        writeId: 'archive-mismatch',
      });

    await expect(
      writeCanonicalAuthUserArchivePlan({
        db,
        plan,
      }),
    ).rejects.toThrow(
      'auth_user_archive_auth_identity_mismatch',
    );
  });

  it('fails closed when a required compatibility role root is missing', async () => {
    const existing = buildState();
    delete existing.rows[
      `teachers/${existing.uid}`
    ];
    const { db } = buildDb(existing.rows);
    const plan =
      planCanonicalAuthUserArchive({
        personId: existing.personId,
        firebaseUid: existing.uid,
        role: 'teacher',
        actorId: 'admin-1',
        writeId: 'archive-missing-root',
      });

    await expect(
      writeCanonicalAuthUserArchivePlan({
        db,
        plan,
      }),
    ).rejects.toThrow(
      `auth_user_archive_required_missing:teachers/${existing.uid}`,
    );
  });
});
