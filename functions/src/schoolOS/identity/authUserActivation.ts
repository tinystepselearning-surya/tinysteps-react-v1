import { createHash, randomUUID } from 'node:crypto';

import type { CanonicalRole } from '../../helpers/roles';
import type { CanonicalAuthUserCreateRole } from './canonicalPrimaryAuthUserCreate';

export const GENERIC_AUTH_USER_ROLES = [
  'admin',
  'founder',
  'teacher',
  'parent',
  'learningPartner',
] as const satisfies readonly CanonicalAuthUserCreateRole[];

export function isGenericAuthUserRole(
  role: CanonicalRole | null,
): role is CanonicalAuthUserCreateRole {
  return Boolean(
    role &&
    (
      GENERIC_AUTH_USER_ROLES as
        readonly string[]
    ).includes(role),
  );
}

export function requireGenericAuthUserRole(
  role: CanonicalRole | null,
): CanonicalAuthUserCreateRole {
  if (!isGenericAuthUserRole(role)) {
    throw new Error(
      'generic_auth_user_role_requires_dedicated_flow',
    );
  }
  return role;
}

export function buildIdentityWriteId(
  command:
    | 'auth_user_create'
    | 'auth_user_update'
    | 'auth_user_archive'
    | 'teacher_profile_update',
): string {
  return `${command}:${randomUUID()}`;
}

export function identityLogToken(
  namespace: string,
  value: string | null | undefined,
): string | null {
  const normalized =
    typeof value === 'string'
      ? value.trim()
      : '';
  if (!normalized) return null;

  return createHash('sha256')
    .update(
      `${namespace}\u001f${normalized}`,
      'utf8',
    )
    .digest('hex')
    .slice(0, 12);
}

export function normalizeCanonicalUserStatus(
  value: unknown,
): 'active' | 'suspended' | 'archived' {
  const normalized =
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : '';

  if (
    normalized === 'active' ||
    normalized === 'suspended' ||
    normalized === 'archived'
  ) {
    return normalized;
  }

  return 'active';
}
