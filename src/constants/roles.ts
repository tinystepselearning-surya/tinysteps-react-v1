// src/constants/roles.ts

/**
 * Canonical Tiny Steps application roles.
 *
 * IMPORTANT:
 * - New frontend state and new Firestore/Auth writes should use these values.
 * - Legacy role values are normalized at read/auth boundaries.
 * - Do not introduce role strings outside this module.
 */
export const AUTH_ROLES = [
  'admin',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
  'schoolAdmin',
] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

const AUTH_ROLE_SET =
  new Set<string>(AUTH_ROLES);

export const ROLE_LABELS: Record<AuthRole, string> = {
  admin: 'Administrator',
  teacher: 'Teacher',
  parent: 'Parent',
  kid: 'Kid',
  learningPartner: 'Learning Partner',
  schoolAdmin: 'School Admin',
};

export const ROLE_REDIRECT_PATHS: Record<AuthRole, string> = {
  admin: '/surya',
  teacher: '/teacher',
  parent: '/parent',
  kid: '/parent/kids',
  learningPartner: '/learning-partner/dashboard',
  schoolAdmin: '/school',
};

const NORMALIZED_ROLE_MAP: Record<string, AuthRole> = {
  admin: 'admin',
  teacher: 'teacher',
  parent: 'parent',
  kid: 'kid',

  // Canonical + legacy Learning Partner forms.
  learningpartner: 'learningPartner',
  'learning-partner': 'learningPartner',

  // Canonical + compatibility School Admin forms.
  schooladmin: 'schoolAdmin',
  'school-admin': 'schoolAdmin',
};

/**
 * Converts any supported role representation into the canonical
 * frontend/application role.
 */
export function normalizeAuthRole(value: unknown): AuthRole | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  return NORMALIZED_ROLE_MAP[normalized] ?? null;
}

export function isAuthRole(value: unknown): value is AuthRole {
  return (
    typeof value === 'string' &&
    AUTH_ROLE_SET.has(value)
  );
}

export function getRoleLabel(value: unknown): string {
  const role = normalizeAuthRole(value);
  return role ? ROLE_LABELS[role] : 'Unknown';
}

export function getRoleRedirectPath(role: AuthRole): string {
  return ROLE_REDIRECT_PATHS[role];
}
