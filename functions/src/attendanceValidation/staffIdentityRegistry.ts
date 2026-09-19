import type { Firestore } from 'firebase-admin/firestore';
import {
  type StaffIdentityRegistryEntry,
} from './enrollmentIdentityBridge';
import { hashAttendanceEvidenceValue } from './teamsEvidenceCollector';

export const AV3_STAFF_REGISTRY_SCHEMA_VERSION = 1;
export const ATTENDANCE_VALIDATION_STAFF_IDENTITIES_COLLECTION =
  'attendanceValidationStaffIdentities';

const STAFF_ROLE_VALUES = [
  'admin',
  'teacher',
  'learningPartner',
  'learning-partner',
  'rm',
] as const;

const STAFF_ROLE_SET = new Set<string>(
  STAFF_ROLE_VALUES.map((value) => value.toLowerCase()),
);

const SHA256_HEX = /^[a-f0-9]{64}$/;

export type Av3StaffRegistryIssueKind =
  | 'override_without_active_staff'
  | 'invalid_email_hash'
  | 'invalid_microsoft_identity_hash'
  | 'duplicate_email_hash'
  | 'duplicate_microsoft_identity_hash'
  | 'staff_identity_missing';

export interface Av3StaffRegistryIssue {
  kind: Av3StaffRegistryIssueKind;
  staffIds: string[];
}

export interface Av3StaffRegistrySnapshot {
  schemaVersion: typeof AV3_STAFF_REGISTRY_SCHEMA_VERSION;
  loadedAt: string;
  entries: StaffIdentityRegistryEntry[];
  issues: Av3StaffRegistryIssue[];
}

export interface OperationalStaffUserSource {
  docId: string;
  uid?: unknown;
  email?: unknown;
  role?: unknown;
  status?: unknown;
  isDeleted?: unknown;
  archivedAt?: unknown;
  deletedAt?: unknown;
}

export interface StaffIdentityOverrideSource {
  docId: string;
  staffId?: unknown;
  status?: unknown;
  emailAddressHash?: unknown;
  microsoftIdentityIdHashes?: unknown;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function staffIdFromUser(user: OperationalStaffUserSource): string {
  return text(user.uid) || text(user.docId);
}

function normalizedRole(value: unknown): string | null {
  const role = text(value);
  if (!role || !STAFF_ROLE_SET.has(role.toLowerCase())) return null;
  return role;
}

function isActiveStaffUser(user: OperationalStaffUserSource): boolean {
  if (!normalizedRole(user.role)) return false;
  if (user.isDeleted === true || user.archivedAt || user.deletedAt) return false;

  const status = text(user.status).toLowerCase();
  return !['suspended', 'archived', 'inactive', 'deleted'].includes(status);
}

function normalizeHash(value: unknown): string | null {
  const normalized = text(value).toLowerCase();
  return SHA256_HEX.test(normalized) ? normalized : null;
}

function hashEmail(value: unknown): string | null {
  const normalized = text(value).toLowerCase();
  return normalized ? hashAttendanceEvidenceValue(normalized) : null;
}

function overrideEnabled(value: StaffIdentityOverrideSource): boolean {
  const status = text(value.status).toLowerCase();
  return !['inactive', 'disabled', 'archived', 'deleted'].includes(status);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function duplicateOwnershipIssues(
  entries: readonly StaffIdentityRegistryEntry[],
  field: 'emailAddressHash' | 'microsoftIdentityIdHashes',
  kind: 'duplicate_email_hash' | 'duplicate_microsoft_identity_hash',
): Av3StaffRegistryIssue[] {
  const owners = new Map<string, Set<string>>();

  for (const entry of entries) {
    const values = field === 'emailAddressHash'
      ? (entry.emailAddressHash ? [entry.emailAddressHash] : [])
      : entry.microsoftIdentityIdHashes;

    for (const value of values) {
      if (!owners.has(value)) owners.set(value, new Set());
      owners.get(value)!.add(entry.staffId);
    }
  }

  return [...owners.values()]
    .filter((staffIds) => staffIds.size > 1)
    .map((staffIds) => ({
      kind,
      staffIds: [...staffIds].sort(),
    }));
}

/**
 * Builds the privacy-minimized AV3 staff registry used by participant identity matching.
 *
 * Production Tiny Steps user documents are the authority for internal staff membership and staffId.
 * School-admin/customer-side roles are deliberately excluded so a school/customer account cannot
 * be silently removed from learner-side evidence.
 * Their email address is read transiently, normalized, SHA-256 hashed, and never returned.
 *
 * The validation-owned override collection may replace the email hash and add verified
 * Microsoft/Entra identity hashes. It never makes a non-staff operational user into staff.
 */
export function buildStaffIdentityRegistrySnapshot(
  users: readonly OperationalStaffUserSource[],
  overrides: readonly StaffIdentityOverrideSource[],
  loadedAt = new Date().toISOString(),
): Av3StaffRegistrySnapshot {
  const issues: Av3StaffRegistryIssue[] = [];
  const activeStaff = new Map<string, StaffIdentityRegistryEntry>();

  for (const user of users) {
    if (!isActiveStaffUser(user)) continue;

    const staffId = staffIdFromUser(user);
    const role = normalizedRole(user.role);
    if (!staffId || !role) continue;

    activeStaff.set(staffId, {
      staffId,
      role,
      emailAddressHash: hashEmail(user.email),
      microsoftIdentityIdHashes: [],
    });
  }

  for (const override of overrides) {
    if (!overrideEnabled(override)) continue;

    const staffId = text(override.staffId) || text(override.docId);
    const entry = activeStaff.get(staffId);
    if (!entry) {
      issues.push({
        kind: 'override_without_active_staff',
        staffIds: staffId ? [staffId] : [],
      });
      continue;
    }

    if (override.emailAddressHash !== undefined && override.emailAddressHash !== null) {
      const emailHash = normalizeHash(override.emailAddressHash);
      if (!emailHash) {
        issues.push({ kind: 'invalid_email_hash', staffIds: [staffId] });
      } else {
        entry.emailAddressHash = emailHash;
      }
    }

    if (override.microsoftIdentityIdHashes !== undefined) {
      if (!Array.isArray(override.microsoftIdentityIdHashes)) {
        issues.push({
          kind: 'invalid_microsoft_identity_hash',
          staffIds: [staffId],
        });
      } else {
        const hashes: string[] = [];
        let invalid = false;
        for (const candidate of override.microsoftIdentityIdHashes) {
          const normalized = normalizeHash(candidate);
          if (!normalized) {
            invalid = true;
            continue;
          }
          hashes.push(normalized);
        }
        if (invalid) {
          issues.push({
            kind: 'invalid_microsoft_identity_hash',
            staffIds: [staffId],
          });
        }
        entry.microsoftIdentityIdHashes = uniqueStrings(hashes);
      }
    }
  }

  const entries = [...activeStaff.values()]
    .sort((left, right) => left.staffId.localeCompare(right.staffId));

  for (const entry of entries) {
    if (!entry.emailAddressHash && entry.microsoftIdentityIdHashes.length === 0) {
      issues.push({
        kind: 'staff_identity_missing',
        staffIds: [entry.staffId],
      });
    }
  }

  issues.push(
    ...duplicateOwnershipIssues(
      entries,
      'emailAddressHash',
      'duplicate_email_hash',
    ),
    ...duplicateOwnershipIssues(
      entries,
      'microsoftIdentityIdHashes',
      'duplicate_microsoft_identity_hash',
    ),
  );

  return {
    schemaVersion: AV3_STAFF_REGISTRY_SCHEMA_VERSION,
    loadedAt,
    entries,
    issues,
  };
}

/**
 * Production adapter. It performs read-only Firestore reads and returns the exact registry
 * consumed by AV3. Callers should load this once per validation run, not once per session.
 *
 * The override collection stores hashes only; raw Microsoft identities/emails are not read
 * from it and no Graph directory permission is required.
 */
export async function loadProductionStaffIdentityRegistry(
  db: Firestore,
  now: () => Date = () => new Date(),
): Promise<Av3StaffRegistrySnapshot> {
  const [usersSnapshot, overridesSnapshot] = await Promise.all([
    db.collection('users')
      .where('role', 'in', [...STAFF_ROLE_VALUES])
      .get(),
    db.collection(ATTENDANCE_VALIDATION_STAFF_IDENTITIES_COLLECTION).get(),
  ]);

  const users: OperationalStaffUserSource[] = usersSnapshot.docs.map((doc) => ({
    ...(doc.data() as Record<string, unknown>),
    docId: doc.id,
  }));

  const overrides: StaffIdentityOverrideSource[] = overridesSnapshot.docs.map((doc) => ({
    ...(doc.data() as Record<string, unknown>),
    docId: doc.id,
  }));

  return buildStaffIdentityRegistrySnapshot(
    users,
    overrides,
    now().toISOString(),
  );
}
