import type * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import {
  getRoleMirrorCollection,
  type CanonicalRole,
} from '../../helpers/roles';
import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from './idStrategy';
import {
  buildAuthPersonCompatibilityPlan,
} from './authPersonCompatibility';
import {
  CANONICAL_AUTH_USER_CREATE_AUTHORITY,
  type CanonicalAuthUserCreateRole,
} from './canonicalPrimaryAuthUserCreate';

export const CANONICAL_AUTH_USER_UPDATE_COMMAND =
  'auth_user_update' as const;

export interface CanonicalAuthUserUpdateInput {
  personId: string;
  firebaseUid: string;
  previousRole: CanonicalAuthUserCreateRole;
  nextRole: CanonicalAuthUserCreateRole;
  displayName: string;
  email: string;
  phone?: string | null;
  status: 'active' | 'suspended' | 'archived';
  actorId: string;
  writeId: string;
}

export type CanonicalAuthUserUpdateWriteOperation =
  | {
      operation: 'set';
      collection: string;
      documentId: string;
      data: Record<string, unknown>;
      merge: true;
    }
  | {
      operation: 'delete';
      collection: string;
      documentId: string;
    };

export interface CanonicalAuthUserUpdatePlan {
  command: typeof CANONICAL_AUTH_USER_UPDATE_COMMAND;
  personId: string;
  firebaseUid: string;
  previousRole: CanonicalAuthUserCreateRole;
  nextRole: CanonicalAuthUserCreateRole;
  writeId: string;
  canonicalWrites: CanonicalAuthUserUpdateWriteOperation[];
  compatibilityWrites: CanonicalAuthUserUpdateWriteOperation[];
  requiredExistingPaths: Array<{
    collection: string;
    documentId: string;
    kind:
      | 'person'
      | 'authIdentity'
      | 'user'
      | 'previousRoleAssignment';
  }>;
  guardedExistingPaths: Array<{
    collection: string;
    documentId: string;
    kind:
      | 'nextRoleAssignment'
      | 'nextRoleMirror';
  }>;
}

export interface CanonicalAuthUserUpdateWriteResult {
  personId: string;
  firebaseUid: string;
  writeId: string;
  canonicalWritesApplied: number;
  compatibilityWritesApplied: number;
  verifiedDocuments: number;
}

function cleanText(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function requiredId(
  value: unknown,
  field: string,
): string {
  const text = cleanText(value);
  if (!text) throw new Error(`${field}_required`);
  if (text.includes('/')) {
    throw new Error(`${field}_must_not_contain_slash`);
  }
  return text;
}

function normalizedDisplayName(
  value: unknown,
): string {
  const text =
    cleanText(value).replace(/\s+/g, ' ');
  if (!text) throw new Error('displayName_required');
  if (text.length < 2 || text.length > 100) {
    throw new Error('displayName_length_invalid');
  }
  return text;
}

function normalizedEmail(value: unknown): string {
  const text = cleanText(value).toLowerCase();
  if (!text) throw new Error('email_required');
  return text;
}

function optionalText(
  value: unknown,
): string | null {
  const text = cleanText(value);
  return text || null;
}

function assertGenericRole(
  role: CanonicalRole,
): asserts role is CanonicalAuthUserCreateRole {
  if (
    role !== 'admin' &&
    role !== 'founder' &&
    role !== 'teacher' &&
    role !== 'parent' &&
    role !== 'learningPartner'
  ) {
    throw new Error(
      'auth_user_update_role_requires_dedicated_flow',
    );
  }
}

function ownership(writeId: string) {
  return {
    schemaVersion: 1,
    authority:
      CANONICAL_AUTH_USER_CREATE_AUTHORITY,
    command:
      CANONICAL_AUTH_USER_UPDATE_COMMAND,
    writeId,
  };
}

function marker(params: {
  personId: string;
  firebaseUid: string;
  writeId: string;
}) {
  return {
    schemaVersion: 1,
    authority:
      CANONICAL_AUTH_USER_CREATE_AUTHORITY,
    command:
      CANONICAL_AUTH_USER_UPDATE_COMMAND,
    writeId: params.writeId,
    canonicalPersonId: params.personId,
    provider: 'firebase',
    providerSubject: params.firebaseUid,
  };
}

function authIdentityStatus(
  status: CanonicalAuthUserUpdateInput['status'],
): 'active' | 'disabled' | 'archived' {
  if (status === 'archived') return 'archived';
  if (status === 'suspended') return 'disabled';
  return 'active';
}

function roleAssignmentStatus(
  status: CanonicalAuthUserUpdateInput['status'],
): 'active' | 'inactive' {
  return status === 'active'
    ? 'active'
    : 'inactive';
}

function setOperation(params: {
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
}): CanonicalAuthUserUpdateWriteOperation {
  return {
    operation: 'set',
    collection: params.collection,
    documentId: params.documentId,
    data: params.data,
    merge: true,
  };
}

export function planCanonicalAuthUserUpdate(
  input: CanonicalAuthUserUpdateInput,
): CanonicalAuthUserUpdatePlan {
  const personId = requiredId(
    input.personId,
    'personId',
  );
  const firebaseUid = requiredId(
    input.firebaseUid,
    'firebaseUid',
  );
  const actorId = requiredId(
    input.actorId,
    'actorId',
  );
  const writeId = requiredId(
    input.writeId,
    'writeId',
  );
  const displayName =
    normalizedDisplayName(input.displayName);
  const email = normalizedEmail(input.email);

  assertGenericRole(input.previousRole);
  assertGenericRole(input.nextRole);

  const authIdentityId =
    buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );
  const previousRoleAssignmentId =
    buildRoleAssignmentId({
      personId,
      role: input.previousRole,
      scopeType: 'global',
    });
  const nextRoleAssignmentId =
    buildRoleAssignmentId({
      personId,
      role: input.nextRole,
      scopeType: 'global',
    });
  const authority = ownership(writeId);
  const projectionMarker = marker({
    personId,
    firebaseUid,
    writeId,
  });

  const nextCompatibility =
    buildAuthPersonCompatibilityPlan({
      personId,
      firebaseUid,
      role: input.nextRole,
    });

  const canonicalWrites:
    CanonicalAuthUserUpdateWriteOperation[] = [
      setOperation({
        collection: 'people',
        documentId: personId,
        data: {
          displayName,
          status: input.status,
          updatedBy: actorId,
          canonicalAuthority: authority,
        },
      }),
      setOperation({
        collection: 'authIdentities',
        documentId: authIdentityId,
        data: {
          status:
            authIdentityStatus(input.status),
          updatedBy: actorId,
          canonicalAuthority: authority,
        },
      }),
      setOperation({
        collection: 'personContacts',
        documentId: personId,
        data: {
          personContactId: personId,
          personId,
          email,
          phone: optionalText(input.phone),
          updatedBy: actorId,
          canonicalAuthority: authority,
        },
      }),
    ];

  if (
    previousRoleAssignmentId ===
    nextRoleAssignmentId
  ) {
    canonicalWrites.push(
      setOperation({
        collection: 'roleAssignments',
        documentId: nextRoleAssignmentId,
        data: {
          roleAssignmentId:
            nextRoleAssignmentId,
          personId,
          role: input.nextRole,
          scopeType: 'global',
          scopeId: null,
          status:
            roleAssignmentStatus(
              input.status,
            ),
          updatedBy: actorId,
          canonicalAuthority: authority,
        },
      }),
    );
  } else {
    canonicalWrites.push(
      setOperation({
        collection: 'roleAssignments',
        documentId:
          previousRoleAssignmentId,
        data: {
          status: 'inactive',
          updatedBy: actorId,
          canonicalAuthority: authority,
        },
      }),
      setOperation({
        collection: 'roleAssignments',
        documentId:
          nextRoleAssignmentId,
        data: {
          roleAssignmentId:
            nextRoleAssignmentId,
          personId,
          role: input.nextRole,
          scopeType: 'global',
          scopeId: null,
          status:
            roleAssignmentStatus(
              input.status,
            ),
          updatedBy: actorId,
          canonicalAuthority: authority,
        },
      }),
    );
  }

  const compatibilityWrites:
    CanonicalAuthUserUpdateWriteOperation[] = [
      setOperation({
        collection: 'users',
        documentId: firebaseUid,
        data: {
          canonicalPersonId: personId,
          uid: firebaseUid,
          userId: firebaseUid,
          displayName,
          name: displayName,
          email,
          phone: optionalText(input.phone),
          role: input.nextRole,
          rawRole: input.nextRole,
          roles: [input.nextRole],
          status: input.status,
          updatedBy: actorId,
          _wave1CanonicalProjection:
            projectionMarker,
        },
      }),
    ];

  const previousRoleMirrorCollection =
    getRoleMirrorCollection(
      input.previousRole,
    );
  const nextRoleMirrorCollection =
    getRoleMirrorCollection(input.nextRole);

  if (
    previousRoleMirrorCollection &&
    previousRoleMirrorCollection !==
      nextRoleMirrorCollection
  ) {
    compatibilityWrites.push({
      operation: 'delete',
      collection:
        previousRoleMirrorCollection,
      documentId: firebaseUid,
    });
  }

  if (nextRoleMirrorCollection) {
    compatibilityWrites.push(
      setOperation({
        collection:
          nextRoleMirrorCollection,
        documentId: firebaseUid,
        data: {
          userId: firebaseUid,
          uid: firebaseUid,
          canonicalPersonId: personId,
          email,
          displayName,
          phone: optionalText(input.phone),
          status: input.status,
          updatedBy: actorId,
          _wave1CanonicalProjection:
            projectionMarker,
        },
      }),
    );
  }

  const requiredExistingPaths:
    CanonicalAuthUserUpdatePlan[
      'requiredExistingPaths'
    ] = [
      {
        collection: 'people',
        documentId: personId,
        kind: 'person',
      },
      {
        collection: 'authIdentities',
        documentId: authIdentityId,
        kind: 'authIdentity',
      },
      {
        collection: 'users',
        documentId: firebaseUid,
        kind: 'user',
      },
      {
        collection: 'roleAssignments',
        documentId:
          previousRoleAssignmentId,
        kind: 'previousRoleAssignment',
      },
    ];

  const guardedExistingPaths:
    CanonicalAuthUserUpdatePlan[
      'guardedExistingPaths'
    ] = [];

  if (
    nextRoleAssignmentId !==
    previousRoleAssignmentId
  ) {
    guardedExistingPaths.push({
      collection: 'roleAssignments',
      documentId: nextRoleAssignmentId,
      kind: 'nextRoleAssignment',
    });
  }

  if (
    nextRoleMirrorCollection &&
    nextRoleMirrorCollection !==
      previousRoleMirrorCollection
  ) {
    guardedExistingPaths.push({
      collection:
        nextRoleMirrorCollection,
      documentId: firebaseUid,
      kind: 'nextRoleMirror',
    });
  }

  if (
    nextCompatibility.compatibility
      .roleMirrorPath &&
    nextCompatibility.roleProfileState ===
      'deferred_person_key_cutover'
  ) {
    const personKeyedMirror =
      nextCompatibility.compatibility
        .roleMirrorPath.replace(
          `/${firebaseUid}`,
          `/${personId}`,
        );
    const [collection, documentId] =
      personKeyedMirror.split('/');
    guardedExistingPaths.push({
      collection,
      documentId,
      kind: 'nextRoleMirror',
    });
  }

  return {
    command:
      CANONICAL_AUTH_USER_UPDATE_COMMAND,
    personId,
    firebaseUid,
    previousRole: input.previousRole,
    nextRole: input.nextRole,
    writeId,
    canonicalWrites,
    compatibilityWrites,
    requiredExistingPaths,
    guardedExistingPaths: [
      ...new Map(
        guardedExistingPaths.map(
          (entry) => [
            `${entry.kind}:${entry.collection}/${entry.documentId}`,
            entry,
          ],
        ),
      ).values(),
    ],
  };
}

function validateRequiredExisting(
  params: {
    kind:
      CanonicalAuthUserUpdatePlan[
        'requiredExistingPaths'
      ][number]['kind'];
    data: Record<string, unknown>;
    personId: string;
    firebaseUid: string;
    previousRole:
      CanonicalAuthUserCreateRole;
  },
) {
  const {
    kind,
    data,
    personId,
    firebaseUid,
    previousRole,
  } = params;

  if (kind === 'person') {
    if (
      cleanText(data.personId) !==
      personId
    ) {
      throw new Error(
        'auth_user_update_person_mismatch',
      );
    }
    return;
  }

  if (kind === 'authIdentity') {
    if (
      cleanText(data.personId) !==
        personId ||
      cleanText(data.provider) !==
        'firebase' ||
      cleanText(data.providerSubject) !==
        firebaseUid
    ) {
      throw new Error(
        'auth_user_update_auth_identity_mismatch',
      );
    }
    return;
  }

  if (kind === 'user') {
    const uid =
      cleanText(data.uid) ||
      cleanText(data.userId);
    if (uid && uid !== firebaseUid) {
      throw new Error(
        'auth_user_update_user_uid_mismatch',
      );
    }
    const canonicalPersonId =
      cleanText(data.canonicalPersonId);
    if (
      canonicalPersonId &&
      canonicalPersonId !== personId
    ) {
      throw new Error(
        'auth_user_update_user_person_mismatch',
      );
    }
    return;
  }

  if (kind === 'previousRoleAssignment') {
    if (
      cleanText(data.personId) !==
        personId ||
      cleanText(data.role) !==
        previousRole
    ) {
      throw new Error(
        'auth_user_update_previous_role_assignment_mismatch',
      );
    }
  }
}

function validateGuardedExisting(
  params: {
    kind:
      CanonicalAuthUserUpdatePlan[
        'guardedExistingPaths'
      ][number]['kind'];
    data: Record<string, unknown>;
    personId: string;
    firebaseUid: string;
    nextRole:
      CanonicalAuthUserCreateRole;
  },
) {
  const {
    kind,
    data,
    personId,
    firebaseUid,
    nextRole,
  } = params;

  if (kind === 'nextRoleAssignment') {
    if (
      cleanText(data.personId) !==
        personId ||
      cleanText(data.role) !== nextRole
    ) {
      throw new Error(
        'auth_user_update_next_role_assignment_collision',
      );
    }
    return;
  }

  const canonicalPersonId =
    cleanText(data.canonicalPersonId);
  const uid =
    cleanText(data.uid) ||
    cleanText(data.userId);

  if (
    canonicalPersonId &&
    canonicalPersonId !== personId
  ) {
    throw new Error(
      'auth_user_update_next_role_mirror_collision',
    );
  }
  if (uid && uid !== firebaseUid) {
    throw new Error(
      'auth_user_update_next_role_mirror_uid_collision',
    );
  }
}

function verifyPostWriteDocument(params: {
  collection: string;
  data: Record<string, unknown>;
  personId: string;
  firebaseUid: string;
  writeId: string;
}): boolean {
  const {
    collection,
    data,
    personId,
    firebaseUid,
    writeId,
  } = params;

  if (collection === 'people') {
    return (
      cleanText(data.personId) ===
        personId &&
      cleanText(
        (
          data.canonicalAuthority as
            Record<string, unknown> | undefined
        )?.writeId,
      ) === writeId
    );
  }

  if (collection === 'authIdentities') {
    return (
      cleanText(data.personId) ===
        personId &&
      cleanText(data.providerSubject) ===
        firebaseUid
    );
  }

  if (
    collection === 'personContacts' ||
    collection === 'roleAssignments'
  ) {
    return (
      cleanText(data.personId) ===
      personId
    );
  }

  if (collection === 'users') {
    const projection =
      data._wave1CanonicalProjection as
        Record<string, unknown> | undefined;
    return (
      cleanText(data.canonicalPersonId) ===
        personId &&
      cleanText(data.uid) === firebaseUid &&
      cleanText(projection?.writeId) ===
        writeId
    );
  }

  return (
    cleanText(data.canonicalPersonId) ===
      personId &&
    (
      cleanText(data.uid) ===
        firebaseUid ||
      cleanText(data.userId) ===
        firebaseUid
    )
  );
}

export async function writeCanonicalAuthUserUpdatePlan(
  params: {
    db: admin.firestore.Firestore;
    plan: CanonicalAuthUserUpdatePlan;
  },
): Promise<CanonicalAuthUserUpdateWriteResult> {
  const { db, plan } = params;

  await db.runTransaction(async (transaction) => {
    for (
      const required of
      plan.requiredExistingPaths
    ) {
      const snap = await transaction.get(
        db.collection(required.collection)
          .doc(required.documentId),
      );
      if (!snap.exists) {
        throw new Error(
          `auth_user_update_required_missing:${required.collection}/${required.documentId}`,
        );
      }
      validateRequiredExisting({
        kind: required.kind,
        data: snap.data() || {},
        personId: plan.personId,
        firebaseUid: plan.firebaseUid,
        previousRole:
          plan.previousRole,
      });
    }

    for (
      const guarded of
      plan.guardedExistingPaths
    ) {
      const snap = await transaction.get(
        db.collection(guarded.collection)
          .doc(guarded.documentId),
      );
      if (!snap.exists) continue;
      validateGuardedExisting({
        kind: guarded.kind,
        data: snap.data() || {},
        personId: plan.personId,
        firebaseUid: plan.firebaseUid,
        nextRole: plan.nextRole,
      });
    }

    const now = FieldValue.serverTimestamp();

    for (const operation of [
      ...plan.canonicalWrites,
      ...plan.compatibilityWrites,
    ]) {
      const ref = db
        .collection(operation.collection)
        .doc(operation.documentId);

      if (operation.operation === 'delete') {
        transaction.delete(ref);
        continue;
      }

      transaction.set(
        ref,
        {
          ...operation.data,
          updatedAt: now,
        },
        { merge: true },
      );
    }
  });

  let verifiedDocuments = 0;
  for (const operation of [
    ...plan.canonicalWrites,
    ...plan.compatibilityWrites,
  ]) {
    const ref = db
      .collection(operation.collection)
      .doc(operation.documentId);
    const snap = await ref.get();

    if (operation.operation === 'delete') {
      if (snap.exists) {
        throw new Error(
          `auth_user_update_verification_delete_failed:${operation.collection}/${operation.documentId}`,
        );
      }
      verifiedDocuments += 1;
      continue;
    }

    if (!snap.exists) {
      throw new Error(
        `auth_user_update_verification_missing:${operation.collection}/${operation.documentId}`,
      );
    }

    if (
      !verifyPostWriteDocument({
        collection: operation.collection,
        data: snap.data() || {},
        personId: plan.personId,
        firebaseUid: plan.firebaseUid,
        writeId: plan.writeId,
      })
    ) {
      throw new Error(
        `auth_user_update_verification_mismatch:${operation.collection}/${operation.documentId}`,
      );
    }

    verifiedDocuments += 1;
  }

  return {
    personId: plan.personId,
    firebaseUid: plan.firebaseUid,
    writeId: plan.writeId,
    canonicalWritesApplied:
      plan.canonicalWrites.length,
    compatibilityWritesApplied:
      plan.compatibilityWrites.length,
    verifiedDocuments,
  };
}
