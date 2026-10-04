import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from '../src/schoolOS/identity/idStrategy';
import {
  CANONICAL_AUTH_USER_CREATE_COMMAND,
  planCanonicalAuthUserCreate,
  writeCanonicalAuthUserCreatePlan,
} from '../src/schoolOS/identity/canonicalPrimaryAuthUserCreate';

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
  ) {
    this.rows.set(ref.path, data);
  }
}

function buildDb(
  initial: Record<string, Row> = {},
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
      const snapshot = new Map(rows);
      const transaction =
        new FakeTransaction(snapshot);
      const result = await callback(transaction);
      rows.clear();
      snapshot.forEach((value, key) =>
        rows.set(key, value));
      return result;
    },
  } as unknown as admin.firestore.Firestore;

  return { db, rows };
}

const baseInput = {
  personId: 'person-generated-1',
  firebaseUid: 'firebase-uid-1',
  role: 'teacher' as const,
  displayName: 'Teacher One',
  email: 'TEACHER@example.com',
  phone: '+91 9876543210',
  phoneCountryCode: '+91',
  phoneLocal: '9876543210',
  status: 'active' as const,
  actorId: 'admin-actor',
  writeId: 'auth-create:nonce-1',
  qualification: 'B.Ed',
  specialization: ['Phonics', 'Grammar'],
  yearsExperience: 5,
  bio: 'Teacher bio',
};

describe('Wave 1 R4 Brick 5B canonical auth-user create writer', () => {
  it('plans a decoupled teacher Person, AuthIdentity, role and compatibility projection', () => {
    const plan =
      planCanonicalAuthUserCreate(baseInput);

    const authIdentityId =
      buildAuthIdentityId(
        'firebase',
        baseInput.firebaseUid,
      );
    const roleAssignmentId =
      buildRoleAssignmentId({
        personId: baseInput.personId,
        role: 'teacher',
        scopeType: 'global',
      });

    expect(plan.command).toBe(
      CANONICAL_AUTH_USER_CREATE_COMMAND,
    );
    expect(plan.personId).not.toBe(
      plan.firebaseUid,
    );
    expect(
      plan.canonicalDocuments.map(
        (document) =>
          `${document.collection}/${document.documentId}`,
      ),
    ).toEqual([
      `people/${baseInput.personId}`,
      `authIdentities/${authIdentityId}`,
      `roleAssignments/${roleAssignmentId}`,
      `personContacts/${baseInput.personId}`,
    ]);

    expect(
      plan.compatibilityDocuments.map(
        (document) =>
          `${document.collection}/${document.documentId}`,
      ),
    ).toEqual([
      `users/${baseInput.firebaseUid}`,
      `teachers/${baseInput.firebaseUid}`,
    ]);
  });

  it('marks canonical documents and UID-keyed compatibility documents with one write authority', () => {
    const plan =
      planCanonicalAuthUserCreate(baseInput);
    const person = plan.canonicalDocuments.find(
      (document) =>
        document.collection === 'people',
    )!;
    const user =
      plan.compatibilityDocuments.find(
        (document) =>
          document.collection === 'users',
      )!;

    expect(person.data).toMatchObject({
      personId: baseInput.personId,
      kind: 'adult',
      status: 'active',
      displayName: 'Teacher One',
      canonicalAuthority: {
        schemaVersion: 1,
        authority: 'canonical-primary',
        command: 'auth_user_create',
        writeId: baseInput.writeId,
      },
    });

    expect(user.data).toMatchObject({
      uid: baseInput.firebaseUid,
      userId: baseInput.firebaseUid,
      canonicalPersonId: baseInput.personId,
      email: 'teacher@example.com',
      role: 'teacher',
      roles: ['teacher'],
      _wave1CanonicalProjection: {
        schemaVersion: 1,
        authority: 'canonical-primary',
        command: 'auth_user_create',
        writeId: baseInput.writeId,
        canonicalPersonId:
          baseInput.personId,
        provider: 'firebase',
        providerSubject:
          baseInput.firebaseUid,
      },
    });
  });

  it('does not create a second person-keyed teacher root for a decoupled identity', () => {
    const plan =
      planCanonicalAuthUserCreate(baseInput);

    expect(
      plan.canonicalDocuments.some(
        (document) =>
          document.collection ===
            'teachers' &&
          document.documentId ===
            baseInput.personId,
      ),
    ).toBe(false);

    expect(
      plan.compatibilityDocuments.some(
        (document) =>
          document.collection ===
            'teachers' &&
          document.documentId ===
            baseInput.firebaseUid,
      ),
    ).toBe(true);

    expect(
      plan.collisionProbePaths,
    ).toContainEqual({
      collection: 'teachers',
      documentId: baseInput.personId,
    });
  });

  it('writes canonical Learning Partner bank data to staff-private state while preserving current compatibility shape', () => {
    const plan =
      planCanonicalAuthUserCreate({
        ...baseInput,
        role: 'learningPartner',
        region: 'South',
        bankAccountNumber: '1234567890',
        bankIfscCode: 'SBIN0000001',
        bankAccountHolderName: 'LP One',
      });

    const privateProfile =
      plan.canonicalDocuments.find(
        (document) =>
          document.collection ===
          'staffPrivateProfiles',
      );
    const mirror =
      plan.compatibilityDocuments.find(
        (document) =>
          document.collection ===
          'learningPartners',
      );

    expect(privateProfile?.data).toMatchObject({
      personId: baseInput.personId,
      role: 'learningPartner',
      bankAccountNumber: '1234567890',
      bankIfscCode: 'SBIN0000001',
      bankAccountHolderName: 'LP One',
    });
    expect(mirror?.data).toMatchObject({
      userId: baseInput.firebaseUid,
      canonicalPersonId:
        baseInput.personId,
      region: 'South',
      bankDetails: {
        accountNumber: '1234567890',
        ifscCode: 'SBIN0000001',
        accountHolderName: 'LP One',
      },
    });
  });

  it('keeps parent-only compatibility fields out of canonical Person/contact authority', () => {
    const plan =
      planCanonicalAuthUserCreate({
        ...baseInput,
        role: 'parent',
        address: 'Legacy address',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        communicationLanguage: 'English',
        sessionTime: 'Evening',
        paymentMethods: ['UPI'],
      });

    const canonicalSerialized =
      JSON.stringify(
        plan.canonicalDocuments,
      );
    expect(canonicalSerialized).not.toContain(
      'Legacy address',
    );
    expect(canonicalSerialized).not.toContain(
      'paymentMethods',
    );

    const parent =
      plan.compatibilityDocuments.find(
        (document) =>
          document.collection === 'parents',
      );
    expect(parent?.data).toMatchObject({
      address: 'Legacy address',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
      preferences: {
        communicationLanguage: 'English',
        sessionTime: 'Evening',
      },
      paymentMethods: ['UPI'],
    });
  });

  it('supports founder canonical identity without inventing a founder root mirror', () => {
    const plan =
      planCanonicalAuthUserCreate({
        ...baseInput,
        role: 'founder',
      });

    expect(
      plan.compatibilityDocuments.map(
        (document) => document.collection,
      ),
    ).toEqual(['users']);
    expect(
      plan.canonicalDocuments.some(
        (document) =>
          document.collection ===
          'roleAssignments',
      ),
    ).toBe(true);
  });

  it('requires dedicated flows for kid and schoolAdmin instead of creating invalid global identity', () => {
    expect(() =>
      planCanonicalAuthUserCreate({
        ...baseInput,
        role: 'kid' as any,
      }),
    ).toThrow(
      'auth_user_create_role_requires_dedicated_flow',
    );

    expect(() =>
      planCanonicalAuthUserCreate({
        ...baseInput,
        role: 'schoolAdmin' as any,
      }),
    ).toThrow(
      'auth_user_create_role_requires_dedicated_flow',
    );
  });

  it('rejects same-value Person ID and Firebase UID for a new auth-backed user', () => {
    expect(() =>
      planCanonicalAuthUserCreate({
        ...baseInput,
        personId: baseInput.firebaseUid,
      }),
    ).toThrow(
      'new_auth_user_person_id_must_be_decoupled',
    );
  });

  it('commits canonical and compatibility documents atomically and verifies them', async () => {
    const plan =
      planCanonicalAuthUserCreate(baseInput);
    const { db, rows } = buildDb();

    const result =
      await writeCanonicalAuthUserCreatePlan({
        db,
        plan,
      });

    expect(result).toEqual({
      personId: baseInput.personId,
      firebaseUid: baseInput.firebaseUid,
      writeId: baseInput.writeId,
      canonicalDocumentsWritten: 4,
      compatibilityDocumentsWritten: 2,
      verifiedDocuments: 6,
    });

    expect(
      rows.get(
        `people/${baseInput.personId}`,
      ),
    ).toMatchObject({
      personId: baseInput.personId,
    });
    expect(
      rows.get(
        `users/${baseInput.firebaseUid}`,
      ),
    ).toMatchObject({
      canonicalPersonId:
        baseInput.personId,
    });
  });

  it('fails before writing when any canonical, compatibility or cross-key collision exists', async () => {
    const plan =
      planCanonicalAuthUserCreate(baseInput);
    const { db, rows } = buildDb({
      [`people/${baseInput.firebaseUid}`]: {
        personId: baseInput.firebaseUid,
      },
    });

    await expect(
      writeCanonicalAuthUserCreatePlan({
        db,
        plan,
      }),
    ).rejects.toThrow(
      `auth_user_create_target_exists:people/${baseInput.firebaseUid}`,
    );

    expect(
      rows.has(
        `people/${baseInput.personId}`,
      ),
    ).toBe(false);
    expect(
      rows.has(
        `users/${baseInput.firebaseUid}`,
      ),
    ).toBe(false);
  });
});
