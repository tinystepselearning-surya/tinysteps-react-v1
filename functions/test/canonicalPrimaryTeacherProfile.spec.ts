import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';

import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from '../src/schoolOS/identity/idStrategy';
import {
  planCanonicalTeacherProfileUpdate,
  writeCanonicalTeacherProfileUpdatePlan,
} from '../src/schoolOS/identity/canonicalPrimaryTeacherProfile';

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
}) {
  const personId =
    params?.personId || 'person-teacher';
  const uid = params?.uid || 'uid-teacher';
  const authId =
    buildAuthIdentityId('firebase', uid);
  const roleId =
    buildRoleAssignmentId({
      personId,
      role: 'teacher',
      scopeType: 'global',
    });

  return {
    personId,
    uid,
    authId,
    roleId,
    rows: {
      [`people/${personId}`]: {
        personId,
        kind: 'adult',
        status: 'active',
        displayName: 'Teacher One',
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
        role: 'teacher',
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
        role: 'teacher',
        email: 'teacher@example.com',
      },
      [`teachers/${uid}`]: {
        uid,
        userId: uid,
        canonicalPersonId:
          personId === uid
            ? undefined
            : personId,
        displayName: 'Teacher One',
        status: 'active',
      },
      [`personContacts/${personId}`]: {
        personContactId: personId,
        personId,
        email: 'teacher@example.com',
      },
    } as Record<string, Row>,
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

const profileInput = {
  personId: 'person-teacher',
  firebaseUid: 'uid-teacher',
  actorId: 'uid-teacher',
  writeId: 'teacher-profile:1',
  phone: '+91 9888888888',
  qualifications: 'B.Ed',
  specializations: [
    'Phonics',
    'Grammar',
    'Phonics',
  ],
  yearsExperience: 6,
  languages: ['English', 'Hindi'],
  city: 'Hyderabad',
  timezone: 'Asia/Kolkata',
  emergencyContactName: 'Contact One',
  emergencyContactPhone:
    '+91 9000000000',
  bio: 'Teacher bio',
  bankAccountNumber: '1234567890',
  bankAccountHolderName: 'Teacher One',
  bankIfscCode: 'SBIN0000001',
  upiId: 'teacher@upi',
  sessionNotifications: true,
  emailAlerts: false,
  paymentSchedule: 'monthly' as const,
};

describe('Wave 1 R4 Brick 5D canonical teacher profile writer', () => {
  it('splits contact/private canonical state from UID-keyed compatibility profile for a decoupled teacher', () => {
    const plan =
      planCanonicalTeacherProfileUpdate(
        profileInput,
      );

    expect(plan.identitySemantics).toBe(
      'decoupled_person_and_auth',
    );
    expect(
      plan.canonicalWrites.map(
        (operation) =>
          `${operation.collection}/${operation.documentId}`,
      ),
    ).toEqual([
      'people/person-teacher',
      'personContacts/person-teacher',
      'staffPrivateProfiles/person-teacher',
    ]);
    expect(
      plan.compatibilityWrites.map(
        (operation) =>
          `${operation.collection}/${operation.documentId}`,
      ),
    ).toEqual([
      'users/uid-teacher',
      'teachers/uid-teacher',
    ]);
    expect(plan.forbiddenSplitRootPath).toEqual({
      collection: 'teachers',
      documentId: 'person-teacher',
    });
  });

  it('normalizes role-profile aliases without creating a decoupled person-keyed teacher root', () => {
    const plan =
      planCanonicalTeacherProfileUpdate(
        profileInput,
      );
    const teacher =
      plan.compatibilityWrites.find(
        (operation) =>
          operation.collection ===
          'teachers',
      )!;

    expect(teacher.data).toMatchObject({
      canonicalPersonId:
        'person-teacher',
      userId: 'uid-teacher',
      qualification: 'B.Ed',
      qualifications: 'B.Ed',
      specialization: [
        'Phonics',
        'Grammar',
      ],
      specializations: [
        'Phonics',
        'Grammar',
      ],
      languagesSpoken: [
        'English',
        'Hindi',
      ],
      languages: ['English', 'Hindi'],
      yearsExperience: 6,
      profileAuthority: 'compatibility',
    });
    expect(
      plan.compatibilityWrites.some(
        (operation) =>
          operation.collection ===
            'teachers' &&
          operation.documentId ===
            'person-teacher',
      ),
    ).toBe(false);
  });

  it('promotes the existing same-value teacher root as canonical profile for legacy-adopted identity', () => {
    const plan =
      planCanonicalTeacherProfileUpdate({
        ...profileInput,
        personId: 'legacy-teacher',
        firebaseUid: 'legacy-teacher',
      });

    expect(plan.identitySemantics).toBe(
      'legacy_adopted_same_value',
    );
    expect(
      plan.forbiddenSplitRootPath,
    ).toBeNull();

    const teacher =
      plan.compatibilityWrites.find(
        (operation) =>
          operation.collection ===
          'teachers',
      )!;
    expect(teacher.data).toMatchObject({
      canonicalProfileSchemaVersion: 1,
      personId: 'legacy-teacher',
      profileRole: 'teacher',
      profileAuthority: 'canonical',
    });
  });

  it('writes restricted teacher fields to staffPrivateProfiles while retaining current users compatibility', () => {
    const plan =
      planCanonicalTeacherProfileUpdate(
        profileInput,
      );
    const privateProfile =
      plan.canonicalWrites.find(
        (operation) =>
          operation.collection ===
          'staffPrivateProfiles',
      )!;
    const user =
      plan.compatibilityWrites.find(
        (operation) =>
          operation.collection === 'users',
      )!;

    expect(privateProfile.data).toMatchObject({
      personId: 'person-teacher',
      role: 'teacher',
      bankAccountNumber: '1234567890',
      bankAccountHolderName:
        'Teacher One',
      bankIfscCode: 'SBIN0000001',
      upiId: 'teacher@upi',
      emergencyContactName:
        'Contact One',
      emergencyContactPhone:
        '+91 9000000000',
    });
    expect(user.data).toMatchObject({
      bankAccountNumber: '1234567890',
      bankAccount: '1234567890',
      emergencyContactName:
        'Contact One',
      canonicalPersonId:
        'person-teacher',
      _wave1CanonicalProjection: {
        command:
          'teacher_profile_update',
        canonicalPersonId:
          'person-teacher',
        providerSubject:
          'uid-teacher',
      },
    });
  });

  it('atomically writes profile state and preserves existing contact email', async () => {
    const existing = buildState();
    const { db, rows } = buildDb(
      existing.rows,
    );
    const plan =
      planCanonicalTeacherProfileUpdate(
        profileInput,
      );

    const result =
      await writeCanonicalTeacherProfileUpdatePlan({
        db,
        plan,
      });

    expect(result).toEqual({
      personId: 'person-teacher',
      firebaseUid: 'uid-teacher',
      writeId: 'teacher-profile:1',
      canonicalWritesApplied: 3,
      compatibilityWritesApplied: 2,
      verifiedDocuments: 5,
    });

    expect(
      rows.get(
        'personContacts/person-teacher',
      ),
    ).toMatchObject({
      personId: 'person-teacher',
      email: 'teacher@example.com',
      phone: '+91 9888888888',
      timezone: 'Asia/Kolkata',
    });
    expect(
      rows.get(
        'staffPrivateProfiles/person-teacher',
      ),
    ).toMatchObject({
      personId: 'person-teacher',
      bankAccountNumber: '1234567890',
    });
    expect(
      rows.get('users/uid-teacher'),
    ).toMatchObject({
      canonicalPersonId:
        'person-teacher',
      qualification: 'B.Ed',
      paymentSchedule: undefined,
    });
  });

  it('allows profile fields to be cleared explicitly without deleting identity documents', async () => {
    const existing = buildState();
    const { db, rows } = buildDb(
      existing.rows,
    );
    const plan =
      planCanonicalTeacherProfileUpdate({
        ...profileInput,
        bankAccountNumber: '',
        bankAccountHolderName: '',
        bankIfscCode: '',
        upiId: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        qualifications: '',
        specializations: [],
        languages: [],
      });

    await writeCanonicalTeacherProfileUpdatePlan({
      db,
      plan,
    });

    expect(
      rows.get(
        'staffPrivateProfiles/person-teacher',
      ),
    ).toMatchObject({
      bankAccountNumber: null,
      bankAccountHolderName: null,
      bankIfscCode: null,
      upiId: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
    });
    expect(
      rows.get('users/uid-teacher'),
    ).toMatchObject({
      qualification: null,
      qualifications: null,
      specialization: [],
      specializations: [],
      languages: [],
    });
  });

  it('fails closed if a decoupled person-keyed teacher root already exists', async () => {
    const existing = buildState();
    existing.rows[
      'teachers/person-teacher'
    ] = {
      personId: 'person-teacher',
      profileAuthority: 'canonical',
    };
    const { db } = buildDb(existing.rows);
    const plan =
      planCanonicalTeacherProfileUpdate(
        profileInput,
      );

    await expect(
      writeCanonicalTeacherProfileUpdatePlan({
        db,
        plan,
      }),
    ).rejects.toThrow(
      'teacher_profile_split_role_root_detected',
    );
  });

  it('fails closed when the Firebase AuthIdentity points to another Person', async () => {
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
      planCanonicalTeacherProfileUpdate(
        profileInput,
      );

    await expect(
      writeCanonicalTeacherProfileUpdatePlan({
        db,
        plan,
      }),
    ).rejects.toThrow(
      'teacher_profile_auth_identity_mismatch',
    );
  });
});
