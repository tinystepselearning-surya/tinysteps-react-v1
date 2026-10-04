import type * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import type {
  AuthIdentityStatus,
  CanonicalRole,
  OrganisationMembershipRecord,
  PersonRecord,
  PersonStatus,
  RoleAssignmentRecord,
} from './contracts';
import {
  buildAuthIdentityId,
} from './idStrategy';

export const AUTH_ACCESS_READ_MODEL_COLLECTION =
  'authAccessReadModels' as const;

export const AUTH_ACCESS_READ_MODEL_SCHEMA_VERSION =
  1 as const;

export const AUTH_ACCESS_READ_MODEL_AUTHORITY =
  'canonical-derived' as const;

const ALL_CANONICAL_ROLES = [
  'admin',
  'founder',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
  'schoolAdmin',
] as const satisfies readonly CanonicalRole[];

const GLOBAL_ACCESS_ROLES = [
  'admin',
  'founder',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
] as const satisfies readonly CanonicalRole[];

export type GlobalAccessRole =
  (typeof GLOBAL_ACCESS_ROLES)[number];

export interface AuthAccessReadModelRecord {
  schemaVersion:
    typeof AUTH_ACCESS_READ_MODEL_SCHEMA_VERSION;
  authority:
    typeof AUTH_ACCESS_READ_MODEL_AUTHORITY;
  firebaseUid: string;
  personId: string;
  personStatus: PersonStatus;
  authStatus: AuthIdentityStatus;
  accessActive: boolean;
  globalRoles: GlobalAccessRole[];
  schoolAdminOrganisationIds: string[];
  sourceAuthIdentityId: string;
  updatedAt?: admin.firestore.FieldValue;
}

export interface AuthAccessCanonicalInput {
  firebaseUid: string;
  person: Pick<
    PersonRecord,
    'personId' | 'status'
  >;
  authIdentity: {
    authIdentityId: string;
    personId: string;
    provider: 'firebase';
    providerSubject: string;
    status: AuthIdentityStatus;
  };
  roleAssignments: Array<
    Pick<
      RoleAssignmentRecord,
      | 'roleAssignmentId'
      | 'personId'
      | 'role'
      | 'scopeType'
      | 'scopeId'
      | 'status'
    >
  >;
  organisationMemberships: Array<
    Pick<
      OrganisationMembershipRecord,
      | 'organisationMembershipId'
      | 'organisationId'
      | 'personId'
      | 'role'
      | 'status'
    >
  >;
}

export interface LoadCanonicalAuthAccessResult {
  input: AuthAccessCanonicalInput;
  sourceReads: {
    authIdentity: 1;
    person: 1;
    roleAssignments: number;
    organisationMemberships: number;
  };
}

function cleanText(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function requireId(
  value: unknown,
  fieldName: string,
): string {
  const normalized = cleanText(value);
  if (!normalized) {
    throw new Error(
      `${fieldName}_required`,
    );
  }
  if (normalized.includes('/')) {
    throw new Error(
      `${fieldName}_must_not_contain_slash`,
    );
  }
  return normalized;
}

function isPersonStatus(
  value: unknown,
): value is PersonStatus {
  return (
    value === 'active' ||
    value === 'suspended' ||
    value === 'archived'
  );
}

function isAuthStatus(
  value: unknown,
): value is AuthIdentityStatus {
  return (
    value === 'active' ||
    value === 'disabled' ||
    value === 'archived'
  );
}

function isCanonicalRoleValue(
  value: unknown,
): value is CanonicalRole {
  return (
    typeof value === 'string' &&
    (
      ALL_CANONICAL_ROLES as
        readonly string[]
    ).includes(value)
  );
}

function isGlobalAccessRole(
  role: CanonicalRole,
): role is GlobalAccessRole {
  return (
    GLOBAL_ACCESS_ROLES as
      readonly string[]
  ).includes(role);
}

function uniqueSorted<T extends string>(
  values: T[],
): T[] {
  return [
    ...new Set(values),
  ].sort((a, b) =>
    a.localeCompare(b),
  );
}

function assertCanonicalInput(
  input: AuthAccessCanonicalInput,
) {
  const firebaseUid = requireId(
    input.firebaseUid,
    'firebaseUid',
  );
  const personId = requireId(
    input.person.personId,
    'personId',
  );

  if (!isPersonStatus(input.person.status)) {
    throw new Error(
      'person_status_invalid',
    );
  }

  const expectedAuthIdentityId =
    buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );

  if (
    cleanText(
      input.authIdentity.authIdentityId,
    ) !== expectedAuthIdentityId
  ) {
    throw new Error(
      'auth_identity_id_mismatch',
    );
  }
  if (
    input.authIdentity.provider !==
    'firebase'
  ) {
    throw new Error(
      'auth_identity_provider_mismatch',
    );
  }
  if (
    cleanText(
      input.authIdentity.providerSubject,
    ) !== firebaseUid
  ) {
    throw new Error(
      'auth_identity_subject_mismatch',
    );
  }
  if (
    cleanText(
      input.authIdentity.personId,
    ) !== personId
  ) {
    throw new Error(
      'auth_identity_person_mismatch',
    );
  }
  if (
    !isAuthStatus(
      input.authIdentity.status,
    )
  ) {
    throw new Error(
      'auth_identity_status_invalid',
    );
  }

  for (
    const assignment of
    input.roleAssignments
  ) {
    if (
      cleanText(assignment.personId) !==
      personId
    ) {
      throw new Error(
        'role_assignment_person_mismatch',
      );
    }
  }

  for (
    const membership of
    input.organisationMemberships
  ) {
    if (
      cleanText(membership.personId) !==
      personId
    ) {
      throw new Error(
        'organisation_membership_person_mismatch',
      );
    }
  }
}

export function buildAuthAccessReadModel(
  input: AuthAccessCanonicalInput,
): AuthAccessReadModelRecord {
  assertCanonicalInput(input);

  const firebaseUid =
    requireId(
      input.firebaseUid,
      'firebaseUid',
    );
  const personId =
    requireId(
      input.person.personId,
      'personId',
    );

  const globalRoles =
    uniqueSorted(
      input.roleAssignments
        .filter(
          (assignment) =>
            assignment.status ===
              'active' &&
            assignment.scopeType ===
              'global' &&
            isGlobalAccessRole(
              assignment.role,
            ),
        )
        .map(
          (assignment) =>
            assignment.role as
              GlobalAccessRole,
        ),
    );

  const activeSchoolRoleScopes =
    new Set(
      input.roleAssignments
        .filter(
          (assignment) =>
            assignment.status ===
              'active' &&
            assignment.role ===
              'schoolAdmin' &&
            assignment.scopeType ===
              'organisation' &&
            Boolean(
              cleanText(
                assignment.scopeId,
              ),
            ),
        )
        .map(
          (assignment) =>
            cleanText(
              assignment.scopeId,
            ),
        ),
    );

  const schoolAdminOrganisationIds =
    uniqueSorted(
      input.organisationMemberships
        .filter(
          (membership) =>
            membership.status ===
              'active' &&
            membership.role ===
              'schoolAdmin' &&
            activeSchoolRoleScopes.has(
              cleanText(
                membership.organisationId,
              ),
            ),
        )
        .map(
          (membership) =>
            requireId(
              membership.organisationId,
              'organisationId',
            ),
        ),
    );

  const accessActive =
    input.person.status === 'active' &&
    input.authIdentity.status ===
      'active';

  return {
    schemaVersion:
      AUTH_ACCESS_READ_MODEL_SCHEMA_VERSION,
    authority:
      AUTH_ACCESS_READ_MODEL_AUTHORITY,
    firebaseUid,
    personId,
    personStatus: input.person.status,
    authStatus:
      input.authIdentity.status,
    accessActive,
    globalRoles,
    schoolAdminOrganisationIds,
    sourceAuthIdentityId:
      input.authIdentity.authIdentityId,
  };
}

function readRequiredString(
  data: admin.firestore.DocumentData,
  field: string,
): string {
  return requireId(
    data[field],
    field,
  );
}

function readPerson(
  data: admin.firestore.DocumentData,
): AuthAccessCanonicalInput['person'] {
  const personId =
    readRequiredString(
      data,
      'personId',
    );
  const status = data.status;
  if (!isPersonStatus(status)) {
    throw new Error(
      'person_status_invalid',
    );
  }
  return {
    personId,
    status,
  };
}

function readAuthIdentity(
  data: admin.firestore.DocumentData,
): AuthAccessCanonicalInput['authIdentity'] {
  const authIdentityId =
    readRequiredString(
      data,
      'authIdentityId',
    );
  const personId =
    readRequiredString(
      data,
      'personId',
    );
  const provider =
    cleanText(data.provider);
  const providerSubject =
    readRequiredString(
      data,
      'providerSubject',
    );
  const status = data.status;

  if (provider !== 'firebase') {
    throw new Error(
      'auth_identity_provider_mismatch',
    );
  }
  if (!isAuthStatus(status)) {
    throw new Error(
      'auth_identity_status_invalid',
    );
  }

  return {
    authIdentityId,
    personId,
    provider: 'firebase',
    providerSubject,
    status,
  };
}

function readRoleAssignment(
  data: admin.firestore.DocumentData,
): AuthAccessCanonicalInput['roleAssignments'][number] {
  const roleAssignmentId =
    readRequiredString(
      data,
      'roleAssignmentId',
    );
  const personId =
    readRequiredString(
      data,
      'personId',
    );
  const roleValue =
    cleanText(data.role);
  if (!isCanonicalRoleValue(roleValue)) {
    throw new Error(
      'role_assignment_role_invalid',
    );
  }
  const role = roleValue;
  const scopeType =
    cleanText(data.scopeType) as
      RoleAssignmentRecord[
        'scopeType'
      ];
  const scopeId =
    cleanText(data.scopeId) || null;
  const status =
    cleanText(data.status) as
      RoleAssignmentRecord['status'];

  if (
    status !== 'active' &&
    status !== 'inactive'
  ) {
    throw new Error(
      'role_assignment_status_invalid',
    );
  }
  if (
    scopeType !== 'global' &&
    scopeType !== 'organisation' &&
    scopeType !== 'household'
  ) {
    throw new Error(
      'role_assignment_scope_invalid',
    );
  }

  return {
    roleAssignmentId,
    personId,
    role,
    scopeType,
    scopeId,
    status,
  };
}

function readOrganisationMembership(
  data: admin.firestore.DocumentData,
): AuthAccessCanonicalInput[
  'organisationMemberships'
][number] {
  const organisationMembershipId =
    readRequiredString(
      data,
      'organisationMembershipId',
    );
  const organisationId =
    readRequiredString(
      data,
      'organisationId',
    );
  const personId =
    readRequiredString(
      data,
      'personId',
    );
  const role =
    cleanText(
      data.role,
    ) as
      OrganisationMembershipRecord['role'];
  const status =
    cleanText(
      data.status,
    ) as
      OrganisationMembershipRecord['status'];

  if (
    status !== 'active' &&
    status !== 'inactive'
  ) {
    throw new Error(
      'organisation_membership_status_invalid',
    );
  }

  return {
    organisationMembershipId,
    organisationId,
    personId,
    role,
    status,
  };
}

export async function loadCanonicalAuthAccessInput(
  params: {
    db: admin.firestore.Firestore;
    firebaseUid: string;
    maxRoleAssignments?: number;
    maxOrganisationMemberships?: number;
  },
): Promise<LoadCanonicalAuthAccessResult> {
  const firebaseUid =
    requireId(
      params.firebaseUid,
      'firebaseUid',
    );
  const authIdentityId =
    buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );

  const authSnap =
    await params.db
      .collection('authIdentities')
      .doc(authIdentityId)
      .get();

  if (!authSnap.exists) {
    throw new Error(
      'auth_identity_missing',
    );
  }

  const authIdentity =
    readAuthIdentity(
      authSnap.data() || {},
    );
  if (
    authIdentity.providerSubject !==
    firebaseUid
  ) {
    throw new Error(
      'auth_identity_subject_mismatch',
    );
  }

  const personSnap =
    await params.db
      .collection('people')
      .doc(authIdentity.personId)
      .get();

  if (!personSnap.exists) {
    throw new Error(
      'canonical_person_missing',
    );
  }
  const person =
    readPerson(
      personSnap.data() || {},
    );

  if (
    person.personId !==
    authIdentity.personId
  ) {
    throw new Error(
      'canonical_person_id_mismatch',
    );
  }

  const roleLimit =
    params.maxRoleAssignments ?? 50;
  const membershipLimit =
    params.maxOrganisationMemberships ??
    50;

  const [
    roleSnap,
    membershipSnap,
  ] = await Promise.all([
    params.db
      .collection('roleAssignments')
      .where(
        'personId',
        '==',
        person.personId,
      )
      .limit(roleLimit + 1)
      .get(),
    params.db
      .collection(
        'organisationMemberships',
      )
      .where(
        'personId',
        '==',
        person.personId,
      )
      .limit(membershipLimit + 1)
      .get(),
  ]);

  if (
    roleSnap.size > roleLimit
  ) {
    throw new Error(
      'role_assignment_bound_exceeded',
    );
  }
  if (
    membershipSnap.size >
    membershipLimit
  ) {
    throw new Error(
      'organisation_membership_bound_exceeded',
    );
  }

  const roleAssignments =
    roleSnap.docs.map((docSnap) =>
      readRoleAssignment(
        docSnap.data() || {},
      ),
    );
  const organisationMemberships =
    membershipSnap.docs.map(
      (docSnap) =>
        readOrganisationMembership(
          docSnap.data() || {},
        ),
    );

  const input: AuthAccessCanonicalInput = {
    firebaseUid,
    person,
    authIdentity,
    roleAssignments,
    organisationMemberships,
  };

  assertCanonicalInput(input);

  return {
    input,
    sourceReads: {
      authIdentity: 1,
      person: 1,
      roleAssignments:
        roleAssignments.length,
      organisationMemberships:
        organisationMemberships.length,
    },
  };
}

export async function refreshAuthAccessReadModel(
  params: {
    db: admin.firestore.Firestore;
    firebaseUid: string;
  },
): Promise<AuthAccessReadModelRecord> {
  const loaded =
    await loadCanonicalAuthAccessInput({
      db: params.db,
      firebaseUid:
        params.firebaseUid,
    });

  const record =
    buildAuthAccessReadModel(
      loaded.input,
    );

  await params.db
    .collection(
      AUTH_ACCESS_READ_MODEL_COLLECTION,
    )
    .doc(record.firebaseUid)
    .set(
      {
        ...record,
        updatedAt:
          FieldValue.serverTimestamp(),
      },
      { merge: false },
    );

  return record;
}
