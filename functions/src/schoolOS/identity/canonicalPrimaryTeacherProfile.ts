import type * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from './idStrategy';
import {
  CANONICAL_AUTH_USER_CREATE_AUTHORITY,
} from './canonicalPrimaryAuthUserCreate';

export const CANONICAL_TEACHER_PROFILE_UPDATE_COMMAND =
  'teacher_profile_update' as const;

export interface CanonicalTeacherProfileUpdateInput {
  personId: string;
  firebaseUid: string;
  actorId: string;
  writeId: string;
  phone?: string | null;
  qualifications?: string | null;
  specializations?: string[] | null;
  yearsExperience?: number | null;
  languages?: string[] | null;
  city?: string | null;
  timezone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bio?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolderName?: string | null;
  bankIfscCode?: string | null;
  upiId?: string | null;
  sessionNotifications?: boolean;
  emailAlerts?: boolean;
  paymentSchedule?: 'weekly' | 'biweekly' | 'monthly';
}

export interface CanonicalTeacherProfileWriteOperation {
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
  merge: true;
}

export interface CanonicalTeacherProfileUpdatePlan {
  command:
    typeof CANONICAL_TEACHER_PROFILE_UPDATE_COMMAND;
  personId: string;
  firebaseUid: string;
  writeId: string;
  identitySemantics:
    | 'legacy_adopted_same_value'
    | 'decoupled_person_and_auth';
  canonicalWrites:
    CanonicalTeacherProfileWriteOperation[];
  compatibilityWrites:
    CanonicalTeacherProfileWriteOperation[];
  requiredExistingPaths: Array<{
    collection: string;
    documentId: string;
    kind:
      | 'person'
      | 'authIdentity'
      | 'teacherRoleAssignment'
      | 'user'
      | 'teacherRoot';
  }>;
  forbiddenSplitRootPath: {
    collection: 'teachers';
    documentId: string;
  } | null;
}

export interface CanonicalTeacherProfileWriteResult {
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

function yearsExperience(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      'teacher_profile_yearsExperience_invalid',
    );
  }
  return Math.floor(value);
}

function paymentSchedule(
  value: unknown,
): 'weekly' | 'biweekly' | 'monthly' {
  if (
    value === 'biweekly' ||
    value === 'monthly'
  ) {
    return value;
  }
  return 'weekly';
}

function authority(writeId: string) {
  return {
    schemaVersion: 1,
    authority:
      CANONICAL_AUTH_USER_CREATE_AUTHORITY,
    command:
      CANONICAL_TEACHER_PROFILE_UPDATE_COMMAND,
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
      CANONICAL_TEACHER_PROFILE_UPDATE_COMMAND,
    writeId: params.writeId,
    canonicalPersonId: params.personId,
    provider: 'firebase',
    providerSubject: params.firebaseUid,
  };
}

function setOperation(params: {
  collection: string;
  documentId: string;
  data: Record<string, unknown>;
}): CanonicalTeacherProfileWriteOperation {
  return {
    collection: params.collection,
    documentId: params.documentId,
    data: params.data,
    merge: true,
  };
}

export function planCanonicalTeacherProfileUpdate(
  input: CanonicalTeacherProfileUpdateInput,
): CanonicalTeacherProfileUpdatePlan {
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
  const writeAuthority = authority(writeId);
  const projectionMarker = marker({
    personId,
    firebaseUid,
    writeId,
  });
  const sameValue =
    personId === firebaseUid;

  const normalizedQualifications =
    optionalText(input.qualifications);
  const normalizedSpecializations =
    uniqueStrings(input.specializations);
  const normalizedLanguages =
    uniqueStrings(input.languages);
  const normalizedYears =
    yearsExperience(input.yearsExperience);
  const preferences = {
    sessionNotifications:
      input.sessionNotifications !== false,
    emailAlerts:
      input.emailAlerts !== false,
    paymentSchedule:
      paymentSchedule(
        input.paymentSchedule,
      ),
  };

  const canonicalWrites:
    CanonicalTeacherProfileWriteOperation[] = [
      setOperation({
        collection: 'people',
        documentId: personId,
        data: {
          updatedBy: actorId,
          canonicalAuthority:
            writeAuthority,
        },
      }),
      setOperation({
        collection: 'personContacts',
        documentId: personId,
        data: {
          personContactId: personId,
          personId,
          phone: optionalText(input.phone),
          timezone:
            optionalText(input.timezone),
          updatedBy: actorId,
          canonicalAuthority:
            writeAuthority,
        },
      }),
      setOperation({
        collection:
          'staffPrivateProfiles',
        documentId: personId,
        data: {
          staffPrivateProfileId:
            personId,
          personId,
          role: 'teacher',
          bankAccountNumber:
            optionalText(
              input.bankAccountNumber,
            ),
          bankAccountHolderName:
            optionalText(
              input.bankAccountHolderName,
            ),
          bankIfscCode:
            optionalText(
              input.bankIfscCode,
            ),
          upiId: optionalText(input.upiId),
          emergencyContactName:
            optionalText(
              input.emergencyContactName,
            ),
          emergencyContactPhone:
            optionalText(
              input.emergencyContactPhone,
            ),
          updatedBy: actorId,
          canonicalAuthority:
            writeAuthority,
        },
      }),
    ];

  const teacherProfileData:
    Record<string, unknown> = {
      canonicalPersonId: personId,
      userId: firebaseUid,
      uid: firebaseUid,
      phone: optionalText(input.phone),
      qualification:
        normalizedQualifications,
      qualifications:
        normalizedQualifications,
      specialization:
        normalizedSpecializations,
      specializations:
        normalizedSpecializations,
      yearsExperience:
        normalizedYears,
      languagesSpoken:
        normalizedLanguages,
      languages:
        normalizedLanguages,
      city: optionalText(input.city),
      timezone:
        optionalText(input.timezone),
      bio: optionalText(input.bio),
      preferences,
      updatedBy: actorId,
      _wave1CanonicalProjection:
        projectionMarker,
    };

  if (sameValue) {
    Object.assign(
      teacherProfileData,
      {
        canonicalProfileSchemaVersion: 1,
        personId,
        profileRole: 'teacher',
        profileAuthority: 'canonical',
      },
    );
  } else {
    teacherProfileData.profileAuthority =
      'compatibility';
  }

  const compatibilityWrites:
    CanonicalTeacherProfileWriteOperation[] = [
      setOperation({
        collection: 'users',
        documentId: firebaseUid,
        data: {
          canonicalPersonId: personId,
          phone: optionalText(input.phone),
          qualification:
            normalizedQualifications,
          qualifications:
            normalizedQualifications,
          specialization:
            normalizedSpecializations,
          specializations:
            normalizedSpecializations,
          yearsExperience:
            normalizedYears,
          languagesSpoken:
            normalizedLanguages,
          languages:
            normalizedLanguages,
          city: optionalText(input.city),
          timezone:
            optionalText(input.timezone),
          emergencyContactName:
            optionalText(
              input.emergencyContactName,
            ),
          emergencyContactPhone:
            optionalText(
              input.emergencyContactPhone,
            ),
          bio: optionalText(input.bio),
          bankAccountNumber:
            optionalText(
              input.bankAccountNumber,
            ),
          bankAccount:
            optionalText(
              input.bankAccountNumber,
            ),
          bankAccountHolderName:
            optionalText(
              input.bankAccountHolderName,
            ),
          bankIfscCode:
            optionalText(
              input.bankIfscCode,
            ),
          upiId: optionalText(input.upiId),
          preferences,
          updatedBy: actorId,
          _wave1CanonicalProjection:
            projectionMarker,
        },
      }),
      setOperation({
        collection: 'teachers',
        documentId: firebaseUid,
        data: teacherProfileData,
      }),
    ];

  const authIdentityId =
    buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );
  const teacherRoleAssignmentId =
    buildRoleAssignmentId({
      personId,
      role: 'teacher',
      scopeType: 'global',
    });

  return {
    command:
      CANONICAL_TEACHER_PROFILE_UPDATE_COMMAND,
    personId,
    firebaseUid,
    writeId,
    identitySemantics: sameValue
      ? 'legacy_adopted_same_value'
      : 'decoupled_person_and_auth',
    canonicalWrites,
    compatibilityWrites,
    requiredExistingPaths: [
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
        documentId:
          teacherRoleAssignmentId,
        kind: 'teacherRoleAssignment',
      },
      {
        collection: 'users',
        documentId: firebaseUid,
        kind: 'user',
      },
      {
        collection: 'teachers',
        documentId: firebaseUid,
        kind: 'teacherRoot',
      },
    ],
    forbiddenSplitRootPath: sameValue
      ? null
      : {
          collection: 'teachers',
          documentId: personId,
        },
  };
}

function validateRequired(params: {
  kind:
    CanonicalTeacherProfileUpdatePlan[
      'requiredExistingPaths'
    ][number]['kind'];
  data: Record<string, unknown>;
  personId: string;
  firebaseUid: string;
}) {
  const {
    kind,
    data,
    personId,
    firebaseUid,
  } = params;

  if (kind === 'person') {
    if (
      cleanText(data.personId) !==
      personId
    ) {
      throw new Error(
        'teacher_profile_person_mismatch',
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
        'teacher_profile_auth_identity_mismatch',
      );
    }
    return;
  }

  if (
    kind ===
    'teacherRoleAssignment'
  ) {
    if (
      cleanText(data.personId) !==
        personId ||
      cleanText(data.role) !== 'teacher'
    ) {
      throw new Error(
        'teacher_profile_role_assignment_mismatch',
      );
    }
    return;
  }

  const uid =
    cleanText(data.uid) ||
    cleanText(data.userId);
  if (uid && uid !== firebaseUid) {
    throw new Error(
      'teacher_profile_uid_mismatch',
    );
  }

  const canonicalPersonId =
    cleanText(data.canonicalPersonId);
  const storedPersonId =
    cleanText(data.personId);
  if (
    canonicalPersonId &&
    canonicalPersonId !== personId
  ) {
    throw new Error(
      'teacher_profile_compatibility_person_mismatch',
    );
  }
  if (
    storedPersonId &&
    storedPersonId !== personId
  ) {
    throw new Error(
      'teacher_profile_role_root_person_mismatch',
    );
  }
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
      cleanText(
        (
          data.canonicalAuthority as
            Record<string, unknown> | undefined
        )?.writeId,
      ) === writeId
    );
  }

  if (
    collection === 'personContacts' ||
    collection ===
      'staffPrivateProfiles'
  ) {
    return (
      cleanText(data.personId) ===
      personId
    );
  }

  const projection =
    data._wave1CanonicalProjection as
      Record<string, unknown> | undefined;

  return (
    cleanText(data.canonicalPersonId) ===
      personId &&
    cleanText(projection?.writeId) ===
      writeId &&
    (
      collection !== 'teachers' ||
      cleanText(data.uid) ===
        firebaseUid ||
      cleanText(data.userId) ===
        firebaseUid
    )
  );
}

export async function writeCanonicalTeacherProfileUpdatePlan(
  params: {
    db: admin.firestore.Firestore;
    plan: CanonicalTeacherProfileUpdatePlan;
  },
): Promise<CanonicalTeacherProfileWriteResult> {
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
          `teacher_profile_required_missing:${required.collection}/${required.documentId}`,
        );
      }
      validateRequired({
        kind: required.kind,
        data: snap.data() || {},
        personId: plan.personId,
        firebaseUid: plan.firebaseUid,
      });
    }

    if (plan.forbiddenSplitRootPath) {
      const splitSnap =
        await transaction.get(
          db.collection(
            plan.forbiddenSplitRootPath
              .collection,
          ).doc(
            plan.forbiddenSplitRootPath
              .documentId,
          ),
        );
      if (splitSnap.exists) {
        throw new Error(
          'teacher_profile_split_role_root_detected',
        );
      }
    }

    const now = FieldValue.serverTimestamp();

    for (const operation of [
      ...plan.canonicalWrites,
      ...plan.compatibilityWrites,
    ]) {
      transaction.set(
        db.collection(operation.collection)
          .doc(operation.documentId),
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
    const snap = await db
      .collection(operation.collection)
      .doc(operation.documentId)
      .get();
    if (!snap.exists) {
      throw new Error(
        `teacher_profile_verification_missing:${operation.collection}/${operation.documentId}`,
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
        `teacher_profile_verification_mismatch:${operation.collection}/${operation.documentId}`,
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
