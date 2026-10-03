import { createHash } from 'node:crypto';

import type {
  CanonicalRole,
  RoleScopeType,
} from './contracts';

function normalizeSegment(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} must not be empty`);
  }
  if (normalized.includes('/')) {
    throw new Error(`${fieldName} must not contain '/'`);
  }
  return normalized;
}

function hashIdentityKey(namespace: string, parts: string[]): string {
  const body = [namespace, ...parts].join('\u001f');
  return createHash('sha256').update(body, 'utf8').digest('hex').slice(0, 32);
}

export function adoptExistingUserPersonId(params: {
  documentId: string;
  uid?: string | null;
  userId?: string | null;
}): string {
  const documentId = normalizeSegment(params.documentId, 'documentId');
  const uid = params.uid?.trim() || '';
  const userId = params.userId?.trim() || '';

  if (uid && uid !== documentId) {
    throw new Error('users documentId/uid mismatch');
  }
  if (userId && userId !== documentId) {
    throw new Error('users documentId/userId mismatch');
  }

  return documentId;
}

export function adoptExistingLearnerPersonId(kidDocumentId: string): string {
  return normalizeSegment(kidDocumentId, 'kidDocumentId');
}

export function adoptExistingSchoolOrganisationId(
  schoolDocumentId: string,
): string {
  return normalizeSegment(schoolDocumentId, 'schoolDocumentId');
}

export function buildAuthIdentityId(
  provider: string,
  providerSubject: string,
): string {
  const providerKey = normalizeSegment(provider, 'provider');
  const subjectKey = providerSubject.trim();
  if (!subjectKey) throw new Error('providerSubject must not be empty');
  return `auth_${hashIdentityKey('authIdentity', [providerKey, subjectKey])}`;
}

export function buildRoleAssignmentId(params: {
  personId: string;
  role: CanonicalRole;
  scopeType: RoleScopeType;
  scopeId?: string | null;
}): string {
  const personId = normalizeSegment(params.personId, 'personId');
  const scopeId = params.scopeId?.trim() || '';
  if (params.scopeType !== 'global' && !scopeId) {
    throw new Error('scopeId is required for non-global role assignments');
  }
  return `role_${hashIdentityKey('roleAssignment', [
    personId,
    params.role,
    params.scopeType,
    scopeId,
  ])}`;
}

export function buildGuardianRelationshipId(params: {
  guardianPersonId: string;
  learnerPersonId: string;
  relationshipType: string;
}): string {
  const guardianPersonId = normalizeSegment(
    params.guardianPersonId,
    'guardianPersonId',
  );
  const learnerPersonId = normalizeSegment(
    params.learnerPersonId,
    'learnerPersonId',
  );
  const relationshipType = normalizeSegment(
    params.relationshipType,
    'relationshipType',
  );

  return `guardian_${hashIdentityKey('guardianRelationship', [
    guardianPersonId,
    learnerPersonId,
    relationshipType,
  ])}`;
}

export function buildOrganisationMembershipId(params: {
  organisationId: string;
  personId: string;
  role: string;
}): string {
  const organisationId = normalizeSegment(
    params.organisationId,
    'organisationId',
  );
  const personId = normalizeSegment(params.personId, 'personId');
  const role = normalizeSegment(params.role, 'role');

  return `orgmem_${hashIdentityKey('organisationMembership', [
    organisationId,
    personId,
    role,
  ])}`;
}

export function buildHouseholdId(seedPersonId: string): string {
  const personId = normalizeSegment(seedPersonId, 'seedPersonId');
  return `household_${hashIdentityKey('household', [personId])}`;
}
