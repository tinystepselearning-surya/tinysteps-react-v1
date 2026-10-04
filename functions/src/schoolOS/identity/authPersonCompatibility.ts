import type * as admin from 'firebase-admin';

import {
  getRoleMirrorCollection,
  type CanonicalRole,
} from '../../helpers/roles';
import {
  buildAuthIdentityId,
  buildRoleAssignmentId,
} from './idStrategy';

export const AUTH_PERSON_COMPATIBILITY_MODE =
  'canonical_person_uid_operational_compatibility' as const;

export type AuthPersonResolutionSource =
  | 'authIdentity'
  | 'legacy_adopted_fallback';

export interface AuthPersonCompatibilityPlan {
  mode: typeof AUTH_PERSON_COMPATIBILITY_MODE;
  personId: string;
  firebaseUid: string;
  authIdentityId: string;
  roleAssignmentId: string;
  canonical: {
    personPath: string;
    authIdentityPath: string;
    roleAssignmentPath: string;
    personContactPath: string;
    personLifecyclePath: string;
    staffPrivateProfilePath: string | null;
    roleProfilePath: string | null;
  };
  compatibility: {
    userPath: string;
    roleMirrorPath: string | null;
  };
  identitySemantics:
    | 'legacy_adopted_same_value'
    | 'decoupled_person_and_auth';
  roleProfileState:
    | 'same_document_legacy_adoption'
    | 'deferred_person_key_cutover'
    | 'not_applicable';
  requiresRoleRootKeyCutover: boolean;
}

export interface FirebaseUidPersonResolution {
  personId: string;
  firebaseUid: string;
  authIdentityId: string;
  source: AuthPersonResolutionSource;
}

export interface PersonFirebaseUidResolution {
  personId: string;
  firebaseUid: string;
  authIdentityId: string;
}

function requireId(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} must not be empty`);
  }
  if (normalized.includes('/')) {
    throw new Error(`${fieldName} must not contain '/'`);
  }
  return normalized;
}

function isStaffRole(role: CanonicalRole): boolean {
  return (
    role === 'admin' ||
    role === 'founder' ||
    role === 'teacher' ||
    role === 'learningPartner' ||
    role === 'schoolAdmin'
  );
}

/**
 * Plans the key-space used while Wave 1 still has UID-keyed operational
 * compatibility readers.
 *
 * Important:
 * - personId is canonical identity.
 * - firebaseUid is only the Firebase authentication subject.
 * - decoupled identities MUST NOT create a second person-keyed document in a
 *   role root that is still used as a UID-keyed operational namespace.
 */
export function buildAuthPersonCompatibilityPlan(params: {
  personId: string;
  firebaseUid: string;
  role: CanonicalRole;
}): AuthPersonCompatibilityPlan {
  const personId = requireId(params.personId, 'personId');
  const firebaseUid = requireId(params.firebaseUid, 'firebaseUid');
  const roleMirrorCollection = getRoleMirrorCollection(params.role);
  const authIdentityId = buildAuthIdentityId('firebase', firebaseUid);
  const roleAssignmentId = buildRoleAssignmentId({
    personId,
    role: params.role,
    scopeType: 'global',
  });
  const sameValue = personId === firebaseUid;

  const roleMirrorPath = roleMirrorCollection
    ? `${roleMirrorCollection}/${firebaseUid}`
    : null;

  const roleProfilePath =
    roleMirrorCollection && sameValue
      ? `${roleMirrorCollection}/${personId}`
      : null;

  return {
    mode: AUTH_PERSON_COMPATIBILITY_MODE,
    personId,
    firebaseUid,
    authIdentityId,
    roleAssignmentId,
    canonical: {
      personPath: `people/${personId}`,
      authIdentityPath: `authIdentities/${authIdentityId}`,
      roleAssignmentPath: `roleAssignments/${roleAssignmentId}`,
      personContactPath: `personContacts/${personId}`,
      personLifecyclePath: `personLifecycle/${personId}`,
      staffPrivateProfilePath: isStaffRole(params.role)
        ? `staffPrivateProfiles/${personId}`
        : null,
      roleProfilePath,
    },
    compatibility: {
      userPath: `users/${firebaseUid}`,
      roleMirrorPath,
    },
    identitySemantics: sameValue
      ? 'legacy_adopted_same_value'
      : 'decoupled_person_and_auth',
    roleProfileState: !roleMirrorCollection
      ? 'not_applicable'
      : sameValue
        ? 'same_document_legacy_adoption'
        : 'deferred_person_key_cutover',
    requiresRoleRootKeyCutover:
      Boolean(roleMirrorCollection) && !sameValue,
  };
}

function readString(
  data: admin.firestore.DocumentData,
  field: string,
): string {
  const value = data[field];
  return typeof value === 'string' ? value.trim() : '';
}

async function assertCanonicalPersonExists(params: {
  db: admin.firestore.Firestore;
  personId: string;
}) {
  const personSnap = await params.db
    .collection('people')
    .doc(params.personId)
    .get();

  if (!personSnap.exists) {
    throw new Error('canonical_person_missing');
  }

  const data = personSnap.data() || {};
  const storedPersonId = readString(data, 'personId');
  if (storedPersonId && storedPersonId !== params.personId) {
    throw new Error('canonical_person_id_mismatch');
  }
}

/**
 * Resolves Firebase Auth UID -> canonical Person ID by deterministic
 * AuthIdentity point read.
 *
 * No caller should infer personId = uid. The explicit legacy fallback exists
 * only for already-adopted Wave 1 identities and is opt-in.
 */
export async function resolvePersonIdFromFirebaseUid(params: {
  db: admin.firestore.Firestore;
  firebaseUid: string;
  allowLegacyAdoptionFallback?: boolean;
  verifyPersonExists?: boolean;
}): Promise<FirebaseUidPersonResolution> {
  const firebaseUid = requireId(
    params.firebaseUid,
    'firebaseUid',
  );
  const authIdentityId = buildAuthIdentityId(
    'firebase',
    firebaseUid,
  );
  const authSnap = await params.db
    .collection('authIdentities')
    .doc(authIdentityId)
    .get();

  if (authSnap.exists) {
    const data = authSnap.data() || {};
    const provider = readString(data, 'provider');
    const providerSubject = readString(
      data,
      'providerSubject',
    );
    const personId = readString(data, 'personId');
    const storedAuthIdentityId = readString(
      data,
      'authIdentityId',
    );

    if (provider !== 'firebase') {
      throw new Error('auth_identity_provider_mismatch');
    }
    if (providerSubject !== firebaseUid) {
      throw new Error('auth_identity_subject_mismatch');
    }
    if (!personId) {
      throw new Error('auth_identity_person_missing');
    }
    if (
      storedAuthIdentityId &&
      storedAuthIdentityId !== authIdentityId
    ) {
      throw new Error('auth_identity_id_mismatch');
    }

    if (params.verifyPersonExists !== false) {
      await assertCanonicalPersonExists({
        db: params.db,
        personId,
      });
    }

    return {
      personId,
      firebaseUid,
      authIdentityId,
      source: 'authIdentity',
    };
  }

  if (!params.allowLegacyAdoptionFallback) {
    throw new Error('auth_identity_missing');
  }

  const [legacyUserSnap, personSnap] = await Promise.all([
    params.db.collection('users').doc(firebaseUid).get(),
    params.db.collection('people').doc(firebaseUid).get(),
  ]);

  if (!legacyUserSnap.exists) {
    throw new Error('legacy_user_missing');
  }
  if (!personSnap.exists) {
    throw new Error('legacy_adopted_person_missing');
  }

  const personData = personSnap.data() || {};
  const storedPersonId = readString(
    personData,
    'personId',
  );
  if (storedPersonId && storedPersonId !== firebaseUid) {
    throw new Error('legacy_adopted_person_id_mismatch');
  }

  return {
    personId: firebaseUid,
    firebaseUid,
    authIdentityId,
    source: 'legacy_adopted_fallback',
  };
}

/**
 * Resolves canonical Person ID -> Firebase UID. This remains server-side and
 * bounded; AuthIdentity is the only semantic bridge.
 */
export async function resolveFirebaseUidFromPersonId(params: {
  db: admin.firestore.Firestore;
  personId: string;
}): Promise<PersonFirebaseUidResolution> {
  const personId = requireId(params.personId, 'personId');
  const snap = await params.db
    .collection('authIdentities')
    .where('personId', '==', personId)
    .limit(5)
    .get();

  const matches = snap.docs
    .map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        documentId: docSnap.id,
        provider: readString(data, 'provider'),
        providerSubject: readString(
          data,
          'providerSubject',
        ),
        personId: readString(data, 'personId'),
        authIdentityId: readString(
          data,
          'authIdentityId',
        ),
      };
    })
    .filter(
      (row) =>
        row.provider === 'firebase' &&
        row.personId === personId,
    );

  if (matches.length === 0) {
    throw new Error('firebase_auth_identity_missing');
  }
  if (matches.length > 1) {
    throw new Error('firebase_auth_identity_ambiguous');
  }

  const match = matches[0];
  const firebaseUid = requireId(
    match.providerSubject,
    'providerSubject',
  );
  const expectedId = buildAuthIdentityId(
    'firebase',
    firebaseUid,
  );
  if (
    match.documentId !== expectedId ||
    (
      match.authIdentityId &&
      match.authIdentityId !== expectedId
    )
  ) {
    throw new Error('firebase_auth_identity_id_mismatch');
  }

  return {
    personId,
    firebaseUid,
    authIdentityId: expectedId,
  };
}
