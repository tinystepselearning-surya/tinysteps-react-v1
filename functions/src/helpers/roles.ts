import type * as admin from 'firebase-admin';

export const CANONICAL_ROLES = [
  'admin',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
  'schoolAdmin',
] as const;

export type CanonicalRole =
  (typeof CANONICAL_ROLES)[number];

const NORMALIZED_ROLE_MAP:
  Record<string, CanonicalRole> = {
    admin: 'admin',
    teacher: 'teacher',
    parent: 'parent',
    kid: 'kid',

    learningpartner: 'learningPartner',
    'learning-partner': 'learningPartner',

    schooladmin: 'schoolAdmin',
    'school-admin': 'schoolAdmin',
  };

const ROLE_CLAIM_FLAGS = [
  'admin',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
  'learning-partner',
  'schoolAdmin',
  'school-admin',

  // Historical value accepted by an old role setter.
  'rm',
] as const;

export function normalizeRole(
  value: unknown,
): CanonicalRole | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  return NORMALIZED_ROLE_MAP[normalized] ?? null;
}

export function isCanonicalRole(
  value: unknown,
): value is CanonicalRole {
  return normalizeRole(value) !== null;
}

export function getRoleMirrorCollection(
  role: CanonicalRole | null,
): string | null {
  switch (role) {
    case 'admin':
      return 'admins';

    case 'teacher':
      return 'teachers';

    case 'parent':
      return 'parents';

    case 'learningPartner':
      return 'learningPartners';

    case 'kid':
    case 'schoolAdmin':
    default:
      return null;
  }
}

/**
 * Preserve unrelated claims while replacing all Tiny Steps role claims.
 *
 * role and rawRole are canonical for all new writes.
 * Legacy boolean aliases are temporarily retained so older deployed
 * consumers remain compatible during the transition.
 */
export function buildRoleClaims(
  existingClaims: Record<string, unknown>,
  role: CanonicalRole,
): Record<string, unknown> {
  const claims: Record<string, unknown> = {
    ...existingClaims,
  };

  for (const key of ROLE_CLAIM_FLAGS) {
    delete claims[key];
  }

  delete claims.role;
  delete claims.rawRole;

  claims.role = role;
  claims.rawRole = role;
  claims[role] = true;

  if (role === 'learningPartner') {
    claims['learning-partner'] = true;
  }

  if (role === 'schoolAdmin') {
    claims['school-admin'] = true;
  }

  return claims;
}

export function applyRoleMirrorTransition(params: {
  db: admin.firestore.Firestore;
  batch: admin.firestore.WriteBatch;
  uid: string;
  previousRole: CanonicalRole | null;
  nextRole: CanonicalRole;
  profile: {
    email: string;
    displayName: string;
    phone?: string | null;
    status?: string | null;
    updatedAt: admin.firestore.FieldValue;
    updatedBy?: string | null;
  };
}) {
  const {
    db,
    batch,
    uid,
    previousRole,
    nextRole,
    profile,
  } = params;

  const previousCollection =
    getRoleMirrorCollection(previousRole);

  const nextCollection =
    getRoleMirrorCollection(nextRole);

  if (
    previousCollection &&
    previousCollection !== nextCollection
  ) {
    batch.delete(
      db.collection(previousCollection).doc(uid),
    );
  }

  if (nextCollection) {
    batch.set(
      db.collection(nextCollection).doc(uid),
      {
        userId: uid,
        email: profile.email,
        displayName: profile.displayName,
        phone: profile.phone ?? null,
        status: profile.status ?? 'active',
        updatedAt: profile.updatedAt,
        updatedBy: profile.updatedBy ?? null,
      },
      { merge: true },
    );
  }
}
