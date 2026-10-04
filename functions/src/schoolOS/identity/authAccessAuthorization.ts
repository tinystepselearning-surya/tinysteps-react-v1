import type * as admin from 'firebase-admin';

import {
  AUTH_ACCESS_READ_MODEL_AUTHORITY,
  AUTH_ACCESS_READ_MODEL_COLLECTION,
  AUTH_ACCESS_READ_MODEL_SCHEMA_VERSION,
  type GlobalAccessRole,
} from './authAccessReadModel';

const GLOBAL_ACCESS_ROLES = new Set<GlobalAccessRole>([
  'admin',
  'founder',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
]);

type PersonStatus =
  | 'active'
  | 'suspended'
  | 'archived';

type AuthStatus =
  | 'active'
  | 'disabled'
  | 'archived';

export interface CurrentAuthAccessPrincipal {
  firebaseUid: string;
  personId: string;
  personStatus: PersonStatus;
  authStatus: AuthStatus;
  accessActive: boolean;
  globalRoles: GlobalAccessRole[];
  schoolAdminOrganisationIds: string[];
  sourceAuthIdentityId: string;
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
  const normalized = cleanText(value);
  if (!normalized) {
    throw new Error(`${field}_required`);
  }
  if (normalized.includes('/')) {
    throw new Error(
      `${field}_must_not_contain_slash`,
    );
  }
  return normalized;
}

function parsePersonStatus(
  value: unknown,
): PersonStatus {
  if (
    value === 'active' ||
    value === 'suspended' ||
    value === 'archived'
  ) {
    return value;
  }
  throw new Error(
    'auth_access_person_status_invalid',
  );
}

function parseAuthStatus(
  value: unknown,
): AuthStatus {
  if (
    value === 'active' ||
    value === 'disabled' ||
    value === 'archived'
  ) {
    return value;
  }
  throw new Error(
    'auth_access_auth_status_invalid',
  );
}

function parseGlobalRoles(
  value: unknown,
): GlobalAccessRole[] {
  if (!Array.isArray(value)) {
    throw new Error(
      'auth_access_global_roles_invalid',
    );
  }

  const roles: GlobalAccessRole[] = [];
  const seen = new Set<string>();

  for (const raw of value) {
    const role = cleanText(raw);
    if (
      !GLOBAL_ACCESS_ROLES.has(
        role as GlobalAccessRole,
      )
    ) {
      throw new Error(
        'auth_access_global_role_invalid',
      );
    }
    if (seen.has(role)) {
      throw new Error(
        'auth_access_global_role_duplicate',
      );
    }
    seen.add(role);
    roles.push(role as GlobalAccessRole);
  }

  return roles;
}

function parseOrganisationIds(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      'auth_access_school_ids_invalid',
    );
  }

  const ids: string[] = [];
  const seen = new Set<string>();

  for (const raw of value) {
    const id = requiredId(
      raw,
      'schoolAdminOrganisationId',
    );
    if (seen.has(id)) {
      throw new Error(
        'auth_access_school_id_duplicate',
      );
    }
    seen.add(id);
    ids.push(id);
  }

  return ids;
}

export function parseCurrentAuthAccessPrincipal(
  params: {
    documentId: string;
    data: admin.firestore.DocumentData;
  },
): CurrentAuthAccessPrincipal {
  const documentId = requiredId(
    params.documentId,
    'firebaseUid',
  );
  const data = params.data;

  if (
    data.schemaVersion !==
    AUTH_ACCESS_READ_MODEL_SCHEMA_VERSION
  ) {
    throw new Error(
      'auth_access_schema_version_invalid',
    );
  }

  if (
    cleanText(data.authority) !==
    AUTH_ACCESS_READ_MODEL_AUTHORITY
  ) {
    throw new Error(
      'auth_access_authority_invalid',
    );
  }

  const firebaseUid = requiredId(
    data.firebaseUid,
    'firebaseUid',
  );
  if (firebaseUid !== documentId) {
    throw new Error(
      'auth_access_firebase_uid_mismatch',
    );
  }

  const personId = requiredId(
    data.personId,
    'personId',
  );
  const sourceAuthIdentityId =
    requiredId(
      data.sourceAuthIdentityId,
      'sourceAuthIdentityId',
    );
  const personStatus =
    parsePersonStatus(data.personStatus);
  const authStatus =
    parseAuthStatus(data.authStatus);

  if (
    typeof data.accessActive !==
    'boolean'
  ) {
    throw new Error(
      'auth_access_active_invalid',
    );
  }

  const expectedAccessActive =
    personStatus === 'active' &&
    authStatus === 'active';

  if (
    data.accessActive !==
    expectedAccessActive
  ) {
    throw new Error(
      'auth_access_active_inconsistent',
    );
  }

  return {
    firebaseUid,
    personId,
    personStatus,
    authStatus,
    accessActive:
      data.accessActive,
    globalRoles:
      parseGlobalRoles(
        data.globalRoles,
      ),
    schoolAdminOrganisationIds:
      parseOrganisationIds(
        data.schoolAdminOrganisationIds,
      ),
    sourceAuthIdentityId,
  };
}

export async function loadCurrentAuthAccessPrincipal(
  params: {
    db: admin.firestore.Firestore;
    firebaseUid: string;
  },
): Promise<CurrentAuthAccessPrincipal> {
  const firebaseUid = requiredId(
    params.firebaseUid,
    'firebaseUid',
  );

  const snap = await params.db
    .collection(
      AUTH_ACCESS_READ_MODEL_COLLECTION,
    )
    .doc(firebaseUid)
    .get();

  if (!snap.exists) {
    throw new Error(
      'auth_access_read_model_missing',
    );
  }

  return parseCurrentAuthAccessPrincipal({
    documentId: firebaseUid,
    data: snap.data() || {},
  });
}

export function principalHasGlobalRole(
  principal: CurrentAuthAccessPrincipal,
  role: GlobalAccessRole,
): boolean {
  return (
    principal.accessActive &&
    principal.globalRoles.includes(role)
  );
}

export function principalHasSchoolAdminAccess(
  principal: CurrentAuthAccessPrincipal,
  organisationId: string,
): boolean {
  const normalized = requiredId(
    organisationId,
    'organisationId',
  );

  return (
    principal.accessActive &&
    principal.schoolAdminOrganisationIds
      .includes(normalized)
  );
}
