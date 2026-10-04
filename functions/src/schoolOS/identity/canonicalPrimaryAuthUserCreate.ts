import type * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import {
  type CanonicalRole,
  getRoleMirrorCollection,
} from '../../helpers/roles';
import {
  IDENTITY_SCHEMA_VERSION,
  type PersonStatus,
} from './contracts';
import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from './idStrategy';
import {
  buildAuthPersonCompatibilityPlan,
} from './authPersonCompatibility';

export const CANONICAL_AUTH_USER_CREATE_COMMAND =
  'auth_user_create' as const;

export const CANONICAL_AUTH_USER_CREATE_AUTHORITY =
  'canonical-primary' as const;

export type CanonicalAuthUserCreateRole =
  | 'admin'
  | 'founder'
  | 'teacher'
  | 'parent'
  | 'learningPartner';

export interface CanonicalAuthUserCreateInput {
  personId: string;
  firebaseUid: string;
  role: CanonicalAuthUserCreateRole;
  displayName: string;
  email: string;
  phone?: string | null;
  phoneCountryCode?: string | null;
  phoneLocal?: string | null;
  status?: PersonStatus;
  actorId: string;
  writeId: string;

  qualification?: string | null;
  specialization?: string[] | null;
  yearsExperience?: number | null;
  bio?: string | null;

  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  communicationLanguage?: string | null;
  sessionTime?: string | null;
  paymentMethods?: string[] | null;

  region?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankAccountHolderName?: string | null;
}

export interface CanonicalAuthUserCreateDocumentPlan {
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
}

export interface CanonicalAuthUserCreatePlan {
  command: typeof CANONICAL_AUTH_USER_CREATE_COMMAND;
  personId: string;
  firebaseUid: string;
  writeId: string;
  role: CanonicalAuthUserCreateRole;
  canonicalDocuments: CanonicalAuthUserCreateDocumentPlan[];
  compatibilityDocuments: CanonicalAuthUserCreateDocumentPlan[];
  collisionProbePaths: Array<{
    collection: string;
    documentId: string;
  }>;
}

export interface CanonicalAuthUserCreateWriteResult {
  personId: string;
  firebaseUid: string;
  writeId: string;
  canonicalDocumentsWritten: number;
  compatibilityDocumentsWritten: number;
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

function normalizedDisplayName(value: unknown): string {
  const text = cleanText(value).replace(/\s+/g, ' ');
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

function optionalText(value: unknown): string | null {
  const text = cleanText(value);
  return text || null;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => cleanText(item))
        .filter(Boolean),
    ),
  ];
}

function normalizedStatus(
  value: unknown,
): PersonStatus {
  const text = cleanText(value).toLowerCase();
  if (!text) return 'active';
  if (
    text === 'active' ||
    text === 'suspended' ||
    text === 'archived'
  ) {
    return text;
  }
  throw new Error('person_status_not_canonical');
}

function authIdentityStatus(
  status: PersonStatus,
): 'active' | 'disabled' | 'archived' {
  if (status === 'archived') return 'archived';
  if (status === 'suspended') return 'disabled';
  return 'active';
}

function roleAssignmentStatus(
  status: PersonStatus,
): 'active' | 'inactive' {
  return status === 'active'
    ? 'active'
    : 'inactive';
}

function assertRole(
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
      'auth_user_create_role_requires_dedicated_flow',
    );
  }
}

function ownership(params: {
  writeId: string;
}) {
  return {
    schemaVersion: 1,
    authority:
      CANONICAL_AUTH_USER_CREATE_AUTHORITY,
    command:
      CANONICAL_AUTH_USER_CREATE_COMMAND,
    writeId: params.writeId,
  };
}

function canonicalBase(params: {
  actorId: string;
  writeId: string;
}) {
  return {
    schemaVersion: IDENTITY_SCHEMA_VERSION,
    createdBy: params.actorId,
    updatedBy: params.actorId,
    canonicalAuthority: ownership({
      writeId: params.writeId,
    }),
  };
}

function compatibilityMarker(params: {
  personId: string;
  firebaseUid: string;
  writeId: string;
}) {
  return {
    schemaVersion: 1,
    authority:
      CANONICAL_AUTH_USER_CREATE_AUTHORITY,
    command:
      CANONICAL_AUTH_USER_CREATE_COMMAND,
    writeId: params.writeId,
    canonicalPersonId: params.personId,
    provider: 'firebase',
    providerSubject: params.firebaseUid,
  };
}

function normalizedYearsExperience(
  value: unknown,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error('yearsExperience_invalid');
  }
  return Math.floor(value);
}

function staffPrivateDocument(params: {
  input: CanonicalAuthUserCreateInput;
  personId: string;
  actorId: string;
  writeId: string;
}): CanonicalAuthUserCreateDocumentPlan | null {
  const {
    input,
    personId,
    actorId,
    writeId,
  } = params;

  if (
    input.role !== 'admin' &&
    input.role !== 'founder' &&
    input.role !== 'teacher' &&
    input.role !== 'learningPartner'
  ) {
    return null;
  }

  const bankAccountNumber =
    optionalText(input.bankAccountNumber);
  const bankIfscCode =
    optionalText(input.bankIfscCode);
  const bankAccountHolderName =
    optionalText(input.bankAccountHolderName);

  if (
    !bankAccountNumber &&
    !bankIfscCode &&
    !bankAccountHolderName
  ) {
    return null;
  }

  return {
    collection: 'staffPrivateProfiles',
    documentId: personId,
    data: {
      ...canonicalBase({
        actorId,
        writeId,
      }),
      staffPrivateProfileId: personId,
      personId,
      role: input.role,
      ...(bankAccountNumber
        ? { bankAccountNumber }
        : {}),
      ...(bankIfscCode
        ? { bankIfscCode }
        : {}),
      ...(bankAccountHolderName
        ? { bankAccountHolderName }
        : {}),
    },
  };
}

function roleCompatibilityData(params: {
  input: CanonicalAuthUserCreateInput;
  personId: string;
  firebaseUid: string;
  status: PersonStatus;
  marker: Record<string, unknown>;
}): Record<string, unknown> | null {
  const {
    input,
    personId,
    firebaseUid,
    status,
    marker,
  } = params;

  if (input.role === 'founder') {
    return null;
  }

  const common = {
    userId: firebaseUid,
    uid: firebaseUid,
    canonicalPersonId: personId,
    email: normalizedEmail(input.email),
    displayName:
      normalizedDisplayName(input.displayName),
    phone: optionalText(input.phone),
    status,
    _wave1CanonicalProjection: marker,
  };

  if (input.role === 'teacher') {
    return {
      ...common,
      qualification:
        optionalText(input.qualification),
      specialization:
        uniqueStrings(input.specialization),
      yearsExperience:
        normalizedYearsExperience(
          input.yearsExperience,
        ) ?? 0,
      bio: optionalText(input.bio),
      assignedLPs: [],
    };
  }

  if (input.role === 'parent') {
    return {
      ...common,
      address: optionalText(input.address),
      city: optionalText(input.city),
      state: optionalText(input.state),
      pincode: optionalText(input.pincode),
      assignedLPs: [],
      preferences: {
        communicationLanguage:
          optionalText(
            input.communicationLanguage,
          ) || 'English',
        sessionTime:
          optionalText(input.sessionTime),
      },
      paymentMethods:
        uniqueStrings(input.paymentMethods),
    };
  }

  if (input.role === 'learningPartner') {
    return {
      ...common,
      region: optionalText(input.region),
      qualification:
        optionalText(input.qualification),
      specialization:
        uniqueStrings(input.specialization),
      yearsExperience:
        normalizedYearsExperience(
          input.yearsExperience,
        ) ?? 0,
      assignedParents: [],
      assignedTeachers: [],
      creditsBalance: 0,
      bankDetails: {
        accountNumber:
          optionalText(input.bankAccountNumber),
        ifscCode:
          optionalText(input.bankIfscCode),
        accountHolderName:
          optionalText(
            input.bankAccountHolderName,
          ),
      },
    };
  }

  if (input.role === 'admin') {
    return common;
  }

  return null;
}

export function planCanonicalAuthUserCreate(
  input: CanonicalAuthUserCreateInput,
): CanonicalAuthUserCreatePlan {
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

  assertRole(input.role);

  if (personId === firebaseUid) {
    throw new Error(
      'new_auth_user_person_id_must_be_decoupled',
    );
  }

  const displayName =
    normalizedDisplayName(input.displayName);
  const email = normalizedEmail(input.email);
  const status = normalizedStatus(input.status);

  const compatibility =
    buildAuthPersonCompatibilityPlan({
      personId,
      firebaseUid,
      role: input.role,
    });

  if (
    compatibility.identitySemantics !==
    'decoupled_person_and_auth'
  ) {
    throw new Error(
      'auth_person_compatibility_not_decoupled',
    );
  }

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
  const base = canonicalBase({
    actorId,
    writeId,
  });
  const marker = compatibilityMarker({
    personId,
    firebaseUid,
    writeId,
  });

  const canonicalDocuments:
    CanonicalAuthUserCreateDocumentPlan[] = [
      {
        collection: 'people',
        documentId: personId,
        data: {
          ...base,
          personId,
          kind: 'adult',
          status,
          displayName,
        },
      },
      {
        collection: 'authIdentities',
        documentId: authIdentityId,
        data: {
          ...base,
          authIdentityId,
          personId,
          provider: 'firebase',
          providerSubject: firebaseUid,
          status: authIdentityStatus(status),
        },
      },
      {
        collection: 'roleAssignments',
        documentId: roleAssignmentId,
        data: {
          ...base,
          roleAssignmentId,
          personId,
          role: input.role,
          scopeType: 'global',
          scopeId: null,
          status: roleAssignmentStatus(status),
        },
      },
      {
        collection: 'personContacts',
        documentId: personId,
        data: {
          ...base,
          personContactId: personId,
          personId,
          email,
          phone: optionalText(input.phone),
          phoneCountryCode:
            optionalText(
              input.phoneCountryCode,
            ),
          phoneLocal:
            optionalText(input.phoneLocal),
        },
      },
    ];

  const privateDocument =
    staffPrivateDocument({
      input,
      personId,
      actorId,
      writeId,
    });
  if (privateDocument) {
    canonicalDocuments.push(privateDocument);
  }

  const compatibilityDocuments:
    CanonicalAuthUserCreateDocumentPlan[] = [
      {
        collection: 'users',
        documentId: firebaseUid,
        data: {
          userId: firebaseUid,
          uid: firebaseUid,
          canonicalPersonId: personId,
          email,
          displayName,
          name: displayName,
          phone: optionalText(input.phone),
          phoneCountryCode:
            optionalText(
              input.phoneCountryCode,
            ),
          phoneLocal:
            optionalText(input.phoneLocal),
          role: input.role,
          rawRole: input.role,
          roles: [input.role],
          status,
          provider: 'admin:create',
          permissions: [],
          _wave1CanonicalProjection: marker,
        },
      },
    ];

  const roleMirrorCollection =
    getRoleMirrorCollection(input.role);
  const roleMirrorData =
    roleCompatibilityData({
      input,
      personId,
      firebaseUid,
      status,
      marker,
    });

  if (
    roleMirrorCollection &&
    roleMirrorData
  ) {
    compatibilityDocuments.push({
      collection: roleMirrorCollection,
      documentId: firebaseUid,
      data: roleMirrorData,
    });
  }

  const collisionProbePaths = [
    ...canonicalDocuments.map(
      ({ collection, documentId }) => ({
        collection,
        documentId,
      }),
    ),
    ...compatibilityDocuments.map(
      ({ collection, documentId }) => ({
        collection,
        documentId,
      }),
    ),
    {
      collection: 'people',
      documentId: firebaseUid,
    },
    {
      collection: 'users',
      documentId: personId,
    },
    {
      collection: 'kids',
      documentId: personId,
    },
    {
      collection: 'kids',
      documentId: firebaseUid,
    },
    ...(roleMirrorCollection
      ? [{
          collection: roleMirrorCollection,
          documentId: personId,
        }]
      : []),
  ];

  const uniqueProbes = [
    ...new Map(
      collisionProbePaths.map((probe) => [
        `${probe.collection}/${probe.documentId}`,
        probe,
      ]),
    ).values(),
  ];

  return {
    command:
      CANONICAL_AUTH_USER_CREATE_COMMAND,
    personId,
    firebaseUid,
    writeId,
    role: input.role,
    canonicalDocuments,
    compatibilityDocuments,
    collisionProbePaths: uniqueProbes,
  };
}

function documentMatchesCreateIdentity(params: {
  data: Record<string, unknown>;
  plan: CanonicalAuthUserCreateDocumentPlan;
  personId: string;
  firebaseUid: string;
  writeId: string;
}): boolean {
  const {
    data,
    plan,
    personId,
    firebaseUid,
    writeId,
  } = params;

  if (plan.collection === 'people') {
    return (
      cleanText(data.personId) === personId &&
      cleanText(
        (
          data.canonicalAuthority as
            Record<string, unknown> | undefined
        )?.writeId,
      ) === writeId
    );
  }

  if (plan.collection === 'authIdentities') {
    return (
      cleanText(data.personId) === personId &&
      cleanText(data.provider) === 'firebase' &&
      cleanText(data.providerSubject) ===
        firebaseUid
    );
  }

  if (plan.collection === 'roleAssignments') {
    return (
      cleanText(data.personId) === personId &&
      cleanText(data.role) !== ''
    );
  }

  if (
    plan.collection === 'personContacts' ||
    plan.collection ===
      'staffPrivateProfiles'
  ) {
    return cleanText(data.personId) === personId;
  }

  if (plan.collection === 'users') {
    const marker =
      data._wave1CanonicalProjection as
        Record<string, unknown> | undefined;
    return (
      cleanText(data.uid) === firebaseUid &&
      cleanText(data.canonicalPersonId) ===
        personId &&
      cleanText(marker?.writeId) === writeId &&
      cleanText(marker?.canonicalPersonId) ===
        personId
    );
  }

  return (
    cleanText(data.userId) === firebaseUid &&
    cleanText(data.canonicalPersonId) ===
      personId
  );
}

export async function writeCanonicalAuthUserCreatePlan(
  params: {
    db: admin.firestore.Firestore;
    plan: CanonicalAuthUserCreatePlan;
  },
): Promise<CanonicalAuthUserCreateWriteResult> {
  const { db, plan } = params;

  await db.runTransaction(async (transaction) => {
    for (
      const probe of plan.collisionProbePaths
    ) {
      const snap = await transaction.get(
        db.collection(probe.collection)
          .doc(probe.documentId),
      );
      if (snap.exists) {
        throw new Error(
          `auth_user_create_target_exists:${probe.collection}/${probe.documentId}`,
        );
      }
    }

    const now = FieldValue.serverTimestamp();

    for (const document of [
      ...plan.canonicalDocuments,
      ...plan.compatibilityDocuments,
    ]) {
      transaction.set(
        db.collection(document.collection)
          .doc(document.documentId),
        {
          ...document.data,
          createdAt: now,
          updatedAt: now,
        },
      );
    }
  });

  let verifiedDocuments = 0;
  for (const document of [
    ...plan.canonicalDocuments,
    ...plan.compatibilityDocuments,
  ]) {
    const snap = await db
      .collection(document.collection)
      .doc(document.documentId)
      .get();
    if (!snap.exists) {
      throw new Error(
        `auth_user_create_verification_missing:${document.collection}/${document.documentId}`,
      );
    }
    const data = snap.data() || {};
    if (
      !documentMatchesCreateIdentity({
        data,
        plan: document,
        personId: plan.personId,
        firebaseUid: plan.firebaseUid,
        writeId: plan.writeId,
      })
    ) {
      throw new Error(
        `auth_user_create_verification_mismatch:${document.collection}/${document.documentId}`,
      );
    }
    verifiedDocuments += 1;
  }

  return {
    personId: plan.personId,
    firebaseUid: plan.firebaseUid,
    writeId: plan.writeId,
    canonicalDocumentsWritten:
      plan.canonicalDocuments.length,
    compatibilityDocumentsWritten:
      plan.compatibilityDocuments.length,
    verifiedDocuments,
  };
}
