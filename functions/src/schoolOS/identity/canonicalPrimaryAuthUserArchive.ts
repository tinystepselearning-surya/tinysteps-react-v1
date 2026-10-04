import type * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import {
  getRoleMirrorCollection,
} from '../../helpers/roles';
import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from './idStrategy';
import {
  CANONICAL_AUTH_USER_CREATE_AUTHORITY,
  type CanonicalAuthUserCreateRole,
} from './canonicalPrimaryAuthUserCreate';

export const CANONICAL_AUTH_USER_ARCHIVE_COMMAND =
  'auth_user_archive' as const;

export interface CanonicalAuthUserArchiveInput {
  personId: string;
  firebaseUid: string;
  role: CanonicalAuthUserCreateRole;
  actorId: string;
  writeId: string;
  archivedReason?: string | null;
}

export interface CanonicalAuthUserArchiveWriteOperation {
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
  merge: true;
  serverTimestampFields?: string[];
}

export interface CanonicalAuthUserArchivePlan {
  command: typeof CANONICAL_AUTH_USER_ARCHIVE_COMMAND;
  personId: string;
  firebaseUid: string;
  role: CanonicalAuthUserCreateRole;
  writeId: string;
  canonicalWrites: CanonicalAuthUserArchiveWriteOperation[];
  compatibilityWrites: CanonicalAuthUserArchiveWriteOperation[];
  requiredExistingPaths: Array<{
    collection: string;
    documentId: string;
    kind:
      | 'person'
      | 'authIdentity'
      | 'roleAssignment'
      | 'user'
      | 'roleMirror';
  }>;
}

export interface CanonicalAuthUserArchiveWriteResult {
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

function optionalText(
  value: unknown,
): string | null {
  const text = cleanText(value);
  return text || null;
}

function authority(writeId: string) {
  return {
    schemaVersion: 1,
    authority:
      CANONICAL_AUTH_USER_CREATE_AUTHORITY,
    command:
      CANONICAL_AUTH_USER_ARCHIVE_COMMAND,
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
      CANONICAL_AUTH_USER_ARCHIVE_COMMAND,
    writeId: params.writeId,
    canonicalPersonId: params.personId,
    provider: 'firebase',
    providerSubject: params.firebaseUid,
  };
}

export function planCanonicalAuthUserArchive(
  input: CanonicalAuthUserArchiveInput,
): CanonicalAuthUserArchivePlan {
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
  const archivedReason =
    optionalText(input.archivedReason);

  const authIdentityId =
    buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );
  const roleAssignmentId =
    buildRoleAssignmentId({
      personId,
      role: input.role,
      scopeType: 'global',
    });
  const writeAuthority = authority(writeId);
  const projectionMarker = marker({
    personId,
    firebaseUid,
    writeId,
  });

  const canonicalWrites:
    CanonicalAuthUserArchiveWriteOperation[] = [
      {
        collection: 'people',
        documentId: personId,
        data: {
          status: 'archived',
          updatedBy: actorId,
          canonicalAuthority:
            writeAuthority,
        },
        merge: true,
      },
      {
        collection: 'authIdentities',
        documentId: authIdentityId,
        data: {
          status: 'archived',
          updatedBy: actorId,
          canonicalAuthority:
            writeAuthority,
        },
        merge: true,
      },
      {
        collection: 'roleAssignments',
        documentId: roleAssignmentId,
        data: {
          status: 'inactive',
          updatedBy: actorId,
          canonicalAuthority:
            writeAuthority,
        },
        merge: true,
      },
      {
        collection: 'personLifecycle',
        documentId: personId,
        data: {
          personLifecycleId: personId,
          personId,
          archivedBy: actorId,
          ...(archivedReason
            ? { archivedReason }
            : {}),
          updatedBy: actorId,
          canonicalAuthority:
            writeAuthority,
        },
        merge: true,
        serverTimestampFields: [
          'archivedAt',
        ],
      },
    ];

  const compatibilityWrites:
    CanonicalAuthUserArchiveWriteOperation[] = [
      {
        collection: 'users',
        documentId: firebaseUid,
        data: {
          canonicalPersonId: personId,
          status: 'archived',
          archivedBy: actorId,
          updatedBy: actorId,
          _wave1CanonicalProjection:
            projectionMarker,
        },
        merge: true,
        serverTimestampFields: [
          'archivedAt',
        ],
      },
    ];

  const roleMirrorCollection =
    getRoleMirrorCollection(input.role);

  if (roleMirrorCollection) {
    compatibilityWrites.push({
      collection: roleMirrorCollection,
      documentId: firebaseUid,
      data: {
        canonicalPersonId: personId,
        userId: firebaseUid,
        uid: firebaseUid,
        status: 'archived',
        updatedBy: actorId,
        _wave1CanonicalProjection:
          projectionMarker,
      },
      merge: true,
    });
  }

  const requiredExistingPaths:
    CanonicalAuthUserArchivePlan[
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
        collection: 'roleAssignments',
        documentId: roleAssignmentId,
        kind: 'roleAssignment',
      },
      {
        collection: 'users',
        documentId: firebaseUid,
        kind: 'user',
      },
    ];

  if (roleMirrorCollection) {
    requiredExistingPaths.push({
      collection: roleMirrorCollection,
      documentId: firebaseUid,
      kind: 'roleMirror',
    });
  }

  return {
    command:
      CANONICAL_AUTH_USER_ARCHIVE_COMMAND,
    personId,
    firebaseUid,
    role: input.role,
    writeId,
    canonicalWrites,
    compatibilityWrites,
    requiredExistingPaths,
  };
}

function validateRequired(params: {
  kind:
    CanonicalAuthUserArchivePlan[
      'requiredExistingPaths'
    ][number]['kind'];
  data: Record<string, unknown>;
  personId: string;
  firebaseUid: string;
  role: CanonicalAuthUserCreateRole;
}) {
  const {
    kind,
    data,
    personId,
    firebaseUid,
    role,
  } = params;

  if (kind === 'person') {
    if (
      cleanText(data.personId) !==
      personId
    ) {
      throw new Error(
        'auth_user_archive_person_mismatch',
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
        'auth_user_archive_auth_identity_mismatch',
      );
    }
    return;
  }

  if (kind === 'roleAssignment') {
    if (
      cleanText(data.personId) !==
        personId ||
      cleanText(data.role) !== role
    ) {
      throw new Error(
        'auth_user_archive_role_assignment_mismatch',
      );
    }
    return;
  }

  const uid =
    cleanText(data.uid) ||
    cleanText(data.userId);
  if (uid && uid !== firebaseUid) {
    throw new Error(
      'auth_user_archive_uid_mismatch',
    );
  }

  const canonicalPersonId =
    cleanText(data.canonicalPersonId);
  if (
    canonicalPersonId &&
    canonicalPersonId !== personId
  ) {
    throw new Error(
      'auth_user_archive_compatibility_person_mismatch',
    );
  }
}

function withServerTimestamps(
  operation:
    CanonicalAuthUserArchiveWriteOperation,
  now: admin.firestore.FieldValue,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    ...operation.data,
    updatedAt: now,
  };
  for (
    const field of
    operation.serverTimestampFields || []
  ) {
    data[field] = now;
  }
  return data;
}

function verifyDocument(params: {
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
      cleanText(data.status) ===
        'archived' &&
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
        firebaseUid &&
      cleanText(data.status) ===
        'archived'
    );
  }

  if (collection === 'roleAssignments') {
    return (
      cleanText(data.personId) ===
        personId &&
      cleanText(data.status) ===
        'inactive'
    );
  }

  if (collection === 'personLifecycle') {
    return (
      cleanText(data.personId) ===
        personId &&
      Boolean(data.archivedAt)
    );
  }

  const projection =
    data._wave1CanonicalProjection as
      Record<string, unknown> | undefined;

  return (
    cleanText(data.canonicalPersonId) ===
      personId &&
    cleanText(data.status) ===
      'archived' &&
    cleanText(projection?.writeId) ===
      writeId &&
    (
      collection !== 'users' ||
      cleanText(projection?.providerSubject) ===
        firebaseUid
    )
  );
}

export async function writeCanonicalAuthUserArchivePlan(
  params: {
    db: admin.firestore.Firestore;
    plan: CanonicalAuthUserArchivePlan;
  },
): Promise<CanonicalAuthUserArchiveWriteResult> {
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
          `auth_user_archive_required_missing:${required.collection}/${required.documentId}`,
        );
      }
      validateRequired({
        kind: required.kind,
        data: snap.data() || {},
        personId: plan.personId,
        firebaseUid: plan.firebaseUid,
        role: plan.role,
      });
    }

    const now = FieldValue.serverTimestamp();

    for (const operation of [
      ...plan.canonicalWrites,
      ...plan.compatibilityWrites,
    ]) {
      transaction.set(
        db.collection(operation.collection)
          .doc(operation.documentId),
        withServerTimestamps(
          operation,
          now,
        ),
        { merge: true },
      );
    }
  });

  let verifiedDocuments = 0;
  for (const operation of [
    ...plan.canonicalWrites,
    ...plan.compatibilityWrites,
  ]) {
    const snap = await db
      .collection(operation.collection)
      .doc(operation.documentId)
      .get();
    if (!snap.exists) {
      throw new Error(
        `auth_user_archive_verification_missing:${operation.collection}/${operation.documentId}`,
      );
    }
    if (
      !verifyDocument({
        collection: operation.collection,
        data: snap.data() || {},
        personId: plan.personId,
        firebaseUid: plan.firebaseUid,
        writeId: plan.writeId,
      })
    ) {
      throw new Error(
        `auth_user_archive_verification_mismatch:${operation.collection}/${operation.documentId}`,
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
