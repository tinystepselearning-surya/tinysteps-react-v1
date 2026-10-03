import type {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

export const IDENTITY_SCHEMA_VERSION = 1 as const;

export const IDENTITY_COLLECTIONS = {
  people: 'people',
  authIdentities: 'authIdentities',
  roleAssignments: 'roleAssignments',
  learnerProfiles: 'learnerProfiles',
  guardianRelationships: 'guardianRelationships',
  households: 'households',
  organisations: 'organisations',
  organisationMemberships: 'organisationMemberships',
} as const;

export type IdentityCollectionName =
  (typeof IDENTITY_COLLECTIONS)[keyof typeof IDENTITY_COLLECTIONS];

export type CanonicalIdentityTimestamp =
  | Timestamp
  | FieldValue;

export type PersonStatus =
  | 'active'
  | 'suspended'
  | 'archived';

export type PersonKind =
  | 'adult'
  | 'learner'
  | 'unknown';

export type AuthProvider =
  | 'firebase';

export type AuthIdentityStatus =
  | 'active'
  | 'disabled'
  | 'archived';

export type CanonicalRole =
  | 'admin'
  | 'founder'
  | 'teacher'
  | 'parent'
  | 'kid'
  | 'learningPartner'
  | 'schoolAdmin';

export type RoleScopeType =
  | 'global'
  | 'organisation'
  | 'household';

export type GuardianRelationshipType =
  | 'parent'
  | 'guardian'
  | 'other';

export type GuardianRelationshipStatus =
  | 'active'
  | 'ended';

export type OrganisationType =
  | 'school'
  | 'company'
  | 'partner'
  | 'other';

export type OrganisationStatus =
  | 'active'
  | 'paused'
  | 'archived';

export type OrganisationMembershipRole =
  | 'schoolAdmin'
  | 'teacher'
  | 'learningPartner'
  | 'member';

export type OrganisationMembershipStatus =
  | 'active'
  | 'inactive';

export interface MigrationProvenance {
  migrationId: string;
  sourceCollection: string;
  sourceId: string;
  sourceFieldVersion?: number | null;
}

export interface IdentityAuditFields {
  schemaVersion: typeof IDENTITY_SCHEMA_VERSION;
  createdAt: CanonicalIdentityTimestamp;
  updatedAt: CanonicalIdentityTimestamp;
  createdBy: string;
  updatedBy: string;
  migration?: MigrationProvenance | null;
}

export interface PersonRecord extends IdentityAuditFields {
  personId: string;
  kind: PersonKind;
  status: PersonStatus;
  displayName: string;
  countryCode?: string | null;
}

export interface AuthIdentityRecord extends IdentityAuditFields {
  authIdentityId: string;
  personId: string;
  provider: AuthProvider;
  providerSubject: string;
  status: AuthIdentityStatus;
}

export interface RoleAssignmentRecord extends IdentityAuditFields {
  roleAssignmentId: string;
  personId: string;
  role: CanonicalRole;
  scopeType: RoleScopeType;
  scopeId: string | null;
  status: 'active' | 'inactive';
}

export interface LearnerProfileRecord extends IdentityAuditFields {
  learnerProfileId: string;
  personId: string;
  status: PersonStatus;
  ageYears?: number | null;
  countryCode?: string | null;
}

export interface GuardianRelationshipRecord extends IdentityAuditFields {
  guardianRelationshipId: string;
  guardianPersonId: string;
  learnerPersonId: string;
  relationshipType: GuardianRelationshipType;
  isPrimary: boolean;
  status: GuardianRelationshipStatus;
}

export interface HouseholdRecord extends IdentityAuditFields {
  householdId: string;
  status: 'active' | 'archived';
  primaryContactPersonId?: string | null;
  countryCode?: string | null;
}

export interface OrganisationRecord extends IdentityAuditFields {
  organisationId: string;
  type: OrganisationType;
  name: string;
  status: OrganisationStatus;
  countryCode?: string | null;
  legacySchoolCode?: string | null;
}

export interface OrganisationMembershipRecord
  extends IdentityAuditFields {
  organisationMembershipId: string;
  organisationId: string;
  personId: string;
  role: OrganisationMembershipRole;
  status: OrganisationMembershipStatus;
  isPrimary: boolean;
}

export interface CanonicalIdentityDocumentMap {
  people: PersonRecord;
  authIdentities: AuthIdentityRecord;
  roleAssignments: RoleAssignmentRecord;
  learnerProfiles: LearnerProfileRecord;
  guardianRelationships: GuardianRelationshipRecord;
  households: HouseholdRecord;
  organisations: OrganisationRecord;
  organisationMemberships: OrganisationMembershipRecord;
}
