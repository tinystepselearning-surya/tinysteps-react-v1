import { createHash } from 'node:crypto';

export const MIGRATION_ID = 'wave1-identity-foundation-v1';
export const MIGRATION_ACTOR = `migration:${MIGRATION_ID}`;
export const SOURCE_COLLECTION_ORDER = ['users', 'kids', 'schools', 'schoolUsers'];
export const TARGET_COLLECTIONS = [
  'people',
  'authIdentities',
  'roleAssignments',
  'learnerProfiles',
  'guardianRelationships',
  'organisations',
  'organisationMemberships',
];
export const MAX_WRITES_PER_BATCH = 100;
export const MAX_RECORDS_PER_RUN = 250;

export function token(value) {
  return createHash('sha256')
    .update(String(value || ''), 'utf8')
    .digest('hex')
    .slice(0, 12);
}

export function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstText(...values) {
  for (const value of values) {
    const candidate = cleanText(value);
    if (candidate) return candidate;
  }
  return '';
}

function combinedName(data = {}) {
  return [cleanText(data.firstName), cleanText(data.lastName)]
    .filter(Boolean)
    .join(' ')
    .trim();
}

export function personStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return 'active';
  if (['active', 'suspended', 'archived'].includes(normalized)) {
    return normalized;
  }
  throw new Error(`Unsupported person status: ${String(value)}`);
}

export function organisationStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return 'active';
  if (['active', 'paused', 'archived'].includes(normalized)) {
    return normalized;
  }
  throw new Error(`Unsupported organisation status: ${String(value)}`);
}

export function membershipStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized || normalized === 'active') return 'active';
  if (['inactive', 'unassigned', 'suspended', 'archived'].includes(normalized)) {
    return 'inactive';
  }
  throw new Error(`Unsupported organisation membership status: ${String(value)}`);
}

export function userDisplayName(data = {}, authUser = null) {
  return firstText(
    data.displayName,
    data.name,
    combinedName(data),
    authUser?.displayName,
  );
}

export function learnerDisplayName(data = {}) {
  return firstText(
    data.fullName,
    data.name,
    data.displayName,
    data.studentName,
    combinedName(data),
  );
}

export function learnerAgeYears(data = {}) {
  for (const value of [data.ageYears, data.age]) {
    if (Number.isInteger(value) && value >= 0 && value <= 120) return value;
  }
  return null;
}

function directCountryCode(data = {}) {
  const value = cleanText(data.countryCode);
  return value || null;
}

function userKind(data = {}) {
  const roles = [
    data.role,
    ...(Array.isArray(data.roles) ? data.roles : []),
  ].map((value) => cleanText(value).toLowerCase());
  return roles.includes('kid') ? 'learner' : 'adult';
}

function guardianIsPrimary(sourceData, guardianPersonId) {
  const primary = cleanText(sourceData.primaryParentId);
  if (primary) return primary === guardianPersonId;

  const legacyPrimary = cleanText(sourceData.parentId);
  if (legacyPrimary) return legacyPrimary === guardianPersonId;

  const parentIds = Array.isArray(sourceData.parentIds)
    ? [...new Set(sourceData.parentIds.map(cleanText).filter(Boolean))]
    : [];
  return parentIds.length === 1 && parentIds[0] === guardianPersonId;
}

function sourceFieldVersion(sourceData = {}) {
  return Number.isInteger(sourceData.schemaVersion)
    ? sourceData.schemaVersion
    : null;
}

export function migrationProvenance(sourceCollection, sourceId, sourceData = {}) {
  return {
    migrationId: MIGRATION_ID,
    sourceCollection,
    sourceId,
    sourceFieldVersion: sourceFieldVersion(sourceData),
  };
}

function withBase(expected, sourceCollection, sourceId, sourceData) {
  return {
    schemaVersion: 1,
    createdBy: MIGRATION_ACTOR,
    updatedBy: MIGRATION_ACTOR,
    migration: migrationProvenance(sourceCollection, sourceId, sourceData),
    ...expected,
  };
}

export function buildExpectedCanonicalData({
  plannedDocument,
  sourceCollection,
  sourceId,
  sourceData,
  authUser = null,
}) {
  if (!plannedDocument || !sourceCollection || !sourceId || !sourceData) {
    throw new Error('Missing canonical materialization input');
  }

  const plan = plannedDocument;

  switch (plan.kind) {
    case 'person': {
      if (sourceCollection === 'users') {
        const displayName = userDisplayName(sourceData, authUser);
        if (!displayName) throw new Error('User display name is missing');
        return withBase({
          personId: plan.personId,
          kind: userKind(sourceData),
          status: personStatus(sourceData.status),
          displayName,
          ...(directCountryCode(sourceData)
            ? { countryCode: directCountryCode(sourceData) }
            : {}),
        }, sourceCollection, sourceId, sourceData);
      }

      if (sourceCollection === 'kids') {
        const displayName = learnerDisplayName(sourceData);
        if (!displayName) throw new Error('Learner display name is missing');
        return withBase({
          personId: plan.personId,
          kind: 'learner',
          status: personStatus(sourceData.status),
          displayName,
          ...(directCountryCode(sourceData)
            ? { countryCode: directCountryCode(sourceData) }
            : {}),
        }, sourceCollection, sourceId, sourceData);
      }

      throw new Error(`Unsupported Person source: ${sourceCollection}`);
    }

    case 'authIdentity': {
      if (sourceCollection !== 'users') {
        throw new Error('AuthIdentity must originate from users');
      }
      if (!authUser?.uid || authUser.uid !== plan.personId) {
        throw new Error('Firebase Auth UID does not match Person ID');
      }
      const status = authUser.disabled
        ? 'disabled'
        : personStatus(sourceData.status) === 'archived'
          ? 'archived'
          : 'active';
      return withBase({
        authIdentityId: plan.documentId,
        personId: plan.personId,
        provider: 'firebase',
        providerSubject: authUser.uid,
        status,
      }, sourceCollection, sourceId, sourceData);
    }

    case 'roleAssignment': {
      const isOrganisationScoped = plan.scopeType === 'organisation';
      const status = isOrganisationScoped
        ? membershipStatus(sourceData.status)
        : personStatus(sourceData.status) === 'active'
          ? 'active'
          : 'inactive';
      return withBase({
        roleAssignmentId: plan.documentId,
        personId: plan.personId,
        role: plan.role,
        scopeType: plan.scopeType,
        scopeId: plan.scopeId ?? null,
        status,
      }, sourceCollection, sourceId, sourceData);
    }

    case 'learnerProfile': {
      const ageYears = learnerAgeYears(sourceData);
      return withBase({
        learnerProfileId: plan.documentId,
        personId: plan.personId,
        status: personStatus(sourceData.status),
        ...(ageYears !== null ? { ageYears } : {}),
        ...(directCountryCode(sourceData)
          ? { countryCode: directCountryCode(sourceData) }
          : {}),
      }, sourceCollection, sourceId, sourceData);
    }

    case 'guardianRelationship': {
      return withBase({
        guardianRelationshipId: plan.documentId,
        guardianPersonId: plan.relatedPersonId,
        learnerPersonId: plan.personId,
        relationshipType: 'parent',
        isPrimary: guardianIsPrimary(sourceData, plan.relatedPersonId),
        status: personStatus(sourceData.status) === 'archived'
          ? 'ended'
          : 'active',
      }, sourceCollection, sourceId, sourceData);
    }

    case 'organisation': {
      const name = firstText(sourceData.name);
      if (!name) throw new Error('School name is missing');
      const countryCode = directCountryCode(sourceData);
      const legacySchoolCode = firstText(sourceData.schoolCode) || null;
      return withBase({
        organisationId: plan.organisationId || plan.documentId,
        type: 'school',
        name,
        status: organisationStatus(sourceData.status),
        ...(countryCode ? { countryCode } : {}),
        ...(legacySchoolCode ? { legacySchoolCode } : {}),
      }, sourceCollection, sourceId, sourceData);
    }

    case 'organisationMembership': {
      const schoolIds = Array.isArray(sourceData.schoolIds)
        ? sourceData.schoolIds.map(cleanText).filter(Boolean)
        : [];
      const primarySchoolId = cleanText(sourceData.primarySchoolId);
      return withBase({
        organisationMembershipId: plan.documentId,
        organisationId: plan.organisationId,
        personId: plan.personId,
        role: plan.role,
        status: membershipStatus(sourceData.status),
        isPrimary: primarySchoolId
          ? primarySchoolId === plan.organisationId
          : schoolIds.length === 1 && schoolIds[0] === plan.organisationId,
      }, sourceCollection, sourceId, sourceData);
    }

    default:
      throw new Error(`Unsupported planned canonical kind: ${plan.kind}`);
  }
}

function normalizeForCompare(value) {
  if (Array.isArray(value)) return value.map(normalizeForCompare);
  if (!value || typeof value !== 'object') return value;

  const out = {};
  for (const key of Object.keys(value).sort()) {
    if (key === 'createdAt' || key === 'updatedAt') continue;
    const item = value[key];
    if (item === undefined) continue;
    out[key] = normalizeForCompare(item);
  }
  return out;
}

export function canonicalDocumentsMatch(existingData, expectedData) {
  return JSON.stringify(normalizeForCompare(existingData))
    === JSON.stringify(normalizeForCompare(expectedData));
}

export function hasSameMigrationOwner(existingData, expectedData) {
  const actual = existingData?.migration;
  const expected = expectedData?.migration;
  return Boolean(
    actual &&
    expected &&
    actual.migrationId === expected.migrationId &&
    actual.sourceCollection === expected.sourceCollection &&
    actual.sourceId === expected.sourceId,
  );
}

export function classifyTarget(existingData, expectedData) {
  if (!existingData) return 'create';
  if (canonicalDocumentsMatch(existingData, expectedData)) return 'unchanged';
  if (hasSameMigrationOwner(existingData, expectedData)) return 'update';
  return 'conflict';
}

export function partitionRecordsByWrites(records, maxWrites = MAX_WRITES_PER_BATCH) {
  if (!Number.isInteger(maxWrites) || maxWrites < 1) {
    throw new Error('Invalid maxWrites');
  }

  const groups = [];
  let current = [];
  let currentWrites = 0;

  for (const record of records) {
    const writes = Number(record.writeCount || 0);
    if (!Number.isInteger(writes) || writes < 0) {
      throw new Error('Invalid record writeCount');
    }
    if (writes > maxWrites) {
      throw new Error('One source record exceeds the write batch limit');
    }

    if (current.length && currentWrites + writes > maxWrites) {
      groups.push(current);
      current = [];
      currentWrites = 0;
    }

    current.push(record);
    currentWrites += writes;
  }

  if (current.length) groups.push(current);
  return groups;
}

export function initialCheckpoint(projectId) {
  return {
    version: 1,
    migrationId: MIGRATION_ID,
    projectId,
    completed: false,
    completedCollections: [],
    cursors: Object.fromEntries(SOURCE_COLLECTION_ORDER.map((name) => [name, null])),
    totals: {
      sourceRecordsCommitted: 0,
      documentsCreated: 0,
      documentsUpdated: 0,
      documentsUnchanged: 0,
    },
  };
}

export function validateCheckpoint(checkpoint, projectId) {
  if (!checkpoint || checkpoint.version !== 1) {
    throw new Error('Invalid identity backfill checkpoint version');
  }
  if (checkpoint.migrationId !== MIGRATION_ID) {
    throw new Error('Checkpoint migrationId mismatch');
  }
  if (checkpoint.projectId !== projectId) {
    throw new Error('Checkpoint projectId mismatch');
  }
  if (!checkpoint.cursors || !checkpoint.totals) {
    throw new Error('Checkpoint is incomplete');
  }
  return checkpoint;
}

export function advanceCheckpoint(checkpoint, records, collectionTotals) {
  const next = structuredClone(checkpoint);
  const completed = new Set(next.completedCollections || []);

  for (const record of records) {
    next.cursors[record.collection] = record.id;
    const total = collectionTotals[record.collection] || 0;
    if (record.indexInCollection + 1 >= total) {
      completed.add(record.collection);
    }
  }

  next.completedCollections = SOURCE_COLLECTION_ORDER.filter((name) => completed.has(name));
  next.completed = next.completedCollections.length === SOURCE_COLLECTION_ORDER.length;
  return next;
}
