import {
  IDENTITY_COLLECTIONS,
  type CanonicalRole,
  type PersonStatus,
} from './contracts';
import {
  adoptExistingLearnerPersonId,
  adoptExistingSchoolOrganisationId,
  adoptExistingUserPersonId,
  buildAuthIdentityId,
  buildGuardianRelationshipId,
  buildOrganisationMembershipId,
  buildRoleAssignmentId,
} from './idStrategy';

export interface LegacyUserIdentityInput {
  documentId: string;
  uid?: string | null;
  userId?: string | null;
  role?: string | null;
  roles?: unknown;
  status?: string | null;
}

export interface LegacyKidIdentityInput {
  documentId: string;
  parentId?: string | null;
  parentIds?: unknown;
  primaryParentId?: string | null;
  status?: string | null;
}

export interface LegacySchoolIdentityInput {
  documentId: string;
  status?: string | null;
}

export interface LegacySchoolUserIdentityInput {
  documentId: string;
  userId?: string | null;
  role?: string | null;
  schoolIds?: unknown;
  primarySchoolId?: string | null;
  status?: string | null;
}

export interface PlannedCanonicalDocument {
  collection: string;
  documentId: string;
  kind:
    | 'person'
    | 'authIdentity'
    | 'roleAssignment'
    | 'learnerProfile'
    | 'guardianRelationship'
    | 'organisation'
    | 'organisationMembership';
  sourcePath: string;
  personId?: string;
  relatedPersonId?: string;
  organisationId?: string;
  role?: string;
  scopeType?: string;
  scopeId?: string | null;
}

export interface ExpansionConflict {
  code: string;
  sourcePath: string;
  fields: string[];
  blocksBackfill: boolean;
}

export interface IdentityExpansionPlan {
  documents: PlannedCanonicalDocument[];
  conflicts: ExpansionConflict[];
}

const GLOBAL_ROLES = new Set<CanonicalRole>([
  'admin',
  'founder',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
]);

const ROLE_MAP: Record<string, CanonicalRole> = {
  admin: 'admin',
  founder: 'founder',
  teacher: 'teacher',
  parent: 'parent',
  kid: 'kid',
  learningpartner: 'learningPartner',
  'learning-partner': 'learningPartner',
  schooladmin: 'schoolAdmin',
  'school-admin': 'schoolAdmin',
};

function normalizeRole(value: unknown): CanonicalRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return ROLE_MAP[normalized] ?? null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function canonicalRoles(input: LegacyUserIdentityInput): CanonicalRole[] {
  const values = [
    input.role,
    ...stringList(input.roles),
  ];
  const roles = values
    .map(normalizeRole)
    .filter((role): role is CanonicalRole => Boolean(role));
  return [...new Set(roles)];
}

export function normalizePersonStatus(
  value: unknown,
): PersonStatus | null {
  if (value === 'active' || value === 'suspended' || value === 'archived') {
    return value;
  }
  return null;
}

export function planLegacyUserExpansion(
  input: LegacyUserIdentityInput,
): IdentityExpansionPlan {
  const sourcePath = `users/${input.documentId}`;
  const documents: PlannedCanonicalDocument[] = [];
  const conflicts: ExpansionConflict[] = [];

  let personId: string;
  try {
    personId = adoptExistingUserPersonId({
      documentId: input.documentId,
      uid: input.uid,
      userId: input.userId,
    });
  } catch {
    conflicts.push({
      code: 'user_identity_id_mismatch',
      sourcePath,
      fields: ['documentId', 'uid', 'userId'],
      blocksBackfill: true,
    });
    return { documents, conflicts };
  }

  if (!normalizePersonStatus(input.status)) {
    conflicts.push({
      code: 'user_status_not_canonical',
      sourcePath,
      fields: ['status'],
      blocksBackfill: false,
    });
  }

  documents.push({
    collection: IDENTITY_COLLECTIONS.people,
    documentId: personId,
    kind: 'person',
    sourcePath,
    personId,
  });

  const uid = input.uid?.trim() || '';
  if (uid) {
    documents.push({
      collection: IDENTITY_COLLECTIONS.authIdentities,
      documentId: buildAuthIdentityId('firebase', uid),
      kind: 'authIdentity',
      sourcePath,
      personId,
    });
  } else {
    conflicts.push({
      code: 'user_missing_firebase_uid',
      sourcePath,
      fields: ['uid'],
      blocksBackfill: false,
    });
  }

  const roles = canonicalRoles(input);
  if (!roles.length) {
    conflicts.push({
      code: 'user_missing_canonical_role',
      sourcePath,
      fields: ['role', 'roles'],
      blocksBackfill: true,
    });
  }

  for (const role of roles) {
    if (role === 'schoolAdmin') {
      conflicts.push({
        code: 'school_admin_role_requires_organisation_scope',
        sourcePath,
        fields: ['role', 'roles'],
        blocksBackfill: false,
      });
      continue;
    }
    if (!GLOBAL_ROLES.has(role)) continue;

    documents.push({
      collection: IDENTITY_COLLECTIONS.roleAssignments,
      documentId: buildRoleAssignmentId({
        personId,
        role,
        scopeType: 'global',
      }),
      kind: 'roleAssignment',
      sourcePath,
      personId,
      role,
      scopeType: 'global',
      scopeId: null,
    });
  }

  return { documents, conflicts };
}

export function planLegacyKidExpansion(
  input: LegacyKidIdentityInput,
): IdentityExpansionPlan {
  const sourcePath = `kids/${input.documentId}`;
  const documents: PlannedCanonicalDocument[] = [];
  const conflicts: ExpansionConflict[] = [];
  const personId = adoptExistingLearnerPersonId(input.documentId);

  documents.push(
    {
      collection: IDENTITY_COLLECTIONS.people,
      documentId: personId,
      kind: 'person',
      sourcePath,
      personId,
    },
    {
      collection: IDENTITY_COLLECTIONS.learnerProfiles,
      documentId: personId,
      kind: 'learnerProfile',
      sourcePath,
      personId,
    },
  );

  if (!normalizePersonStatus(input.status)) {
    conflicts.push({
      code: 'kid_status_not_canonical',
      sourcePath,
      fields: ['status'],
      blocksBackfill: false,
    });
  }

  const primaryParentId = input.primaryParentId?.trim() || '';
  const legacyParentId = input.parentId?.trim() || '';
  const parentIds = stringList(input.parentIds);
  const allParents = [
    ...new Set(
      [primaryParentId, legacyParentId, ...parentIds].filter(Boolean),
    ),
  ];

  if (!allParents.length) {
    conflicts.push({
      code: 'kid_missing_guardian_reference',
      sourcePath,
      fields: ['primaryParentId', 'parentId', 'parentIds'],
      blocksBackfill: true,
    });
  }

  if (primaryParentId && parentIds.length && !parentIds.includes(primaryParentId)) {
    conflicts.push({
      code: 'kid_primary_parent_not_in_parent_ids',
      sourcePath,
      fields: ['primaryParentId', 'parentIds'],
      blocksBackfill: true,
    });
  }

  if (
    primaryParentId &&
    legacyParentId &&
    primaryParentId !== legacyParentId
  ) {
    conflicts.push({
      code: 'kid_primary_parent_legacy_parent_mismatch',
      sourcePath,
      fields: ['primaryParentId', 'parentId'],
      blocksBackfill: true,
    });
  }

  for (const guardianPersonId of allParents) {
    documents.push({
      collection: IDENTITY_COLLECTIONS.guardianRelationships,
      documentId: buildGuardianRelationshipId({
        guardianPersonId,
        learnerPersonId: personId,
        relationshipType: 'parent',
      }),
      kind: 'guardianRelationship',
      sourcePath,
      personId,
      relatedPersonId: guardianPersonId,
    });
  }

  return { documents, conflicts };
}

export function planLegacySchoolExpansion(
  input: LegacySchoolIdentityInput,
): IdentityExpansionPlan {
  const sourcePath = `schools/${input.documentId}`;
  const organisationId = adoptExistingSchoolOrganisationId(input.documentId);

  return {
    documents: [{
      collection: IDENTITY_COLLECTIONS.organisations,
      documentId: organisationId,
      kind: 'organisation',
      sourcePath,
      organisationId,
    }],
    conflicts: [],
  };
}

export function planLegacySchoolUserExpansion(
  input: LegacySchoolUserIdentityInput,
): IdentityExpansionPlan {
  const sourcePath = `schoolUsers/${input.documentId}`;
  const documents: PlannedCanonicalDocument[] = [];
  const conflicts: ExpansionConflict[] = [];
  const userId = input.userId?.trim() || input.documentId.trim();
  const role = normalizeRole(input.role);

  if (input.userId?.trim() && input.userId.trim() !== input.documentId.trim()) {
    conflicts.push({
      code: 'school_user_document_user_id_mismatch',
      sourcePath,
      fields: ['documentId', 'userId'],
      blocksBackfill: true,
    });
  }

  if (role !== 'schoolAdmin') {
    conflicts.push({
      code: 'school_user_role_not_school_admin',
      sourcePath,
      fields: ['role'],
      blocksBackfill: true,
    });
  }

  const schoolIds = stringList(input.schoolIds);
  const primarySchoolId = input.primarySchoolId?.trim() || '';

  if (primarySchoolId && !schoolIds.includes(primarySchoolId)) {
    conflicts.push({
      code: 'school_user_primary_school_not_in_school_ids',
      sourcePath,
      fields: ['primarySchoolId', 'schoolIds'],
      blocksBackfill: true,
    });
  }

  if (!schoolIds.length) {
    conflicts.push({
      code: 'school_user_without_school_membership',
      sourcePath,
      fields: ['schoolIds'],
      blocksBackfill: true,
    });
  }

  for (const organisationId of schoolIds) {
    documents.push(
      {
        collection: IDENTITY_COLLECTIONS.organisationMemberships,
        documentId: buildOrganisationMembershipId({
          organisationId,
          personId: userId,
          role: 'schoolAdmin',
        }),
        kind: 'organisationMembership',
        sourcePath,
        personId: userId,
        organisationId,
        role: 'schoolAdmin',
      },
      {
        collection: IDENTITY_COLLECTIONS.roleAssignments,
        documentId: buildRoleAssignmentId({
          personId: userId,
          role: 'schoolAdmin',
          scopeType: 'organisation',
          scopeId: organisationId,
        }),
        kind: 'roleAssignment',
        sourcePath,
        personId: userId,
        organisationId,
        role: 'schoolAdmin',
        scopeType: 'organisation',
        scopeId: organisationId,
      },
    );
  }

  return { documents, conflicts };
}
