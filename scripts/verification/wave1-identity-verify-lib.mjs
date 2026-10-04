import { createHash } from 'node:crypto';

export const VERIFY_SCHEMA_VERSION = 1;
export const MIGRATION_ID = 'wave1-identity-foundation-v1';
export const MIGRATION_ACTOR = `migration:${MIGRATION_ID}`;

export const SOURCE_BASELINE = Object.freeze({
  users: 223,
  firebaseAuthUsers: 225,
  kids: 194,
  schools: 1,
  schoolUsers: 1,
});

export const CANONICAL_BASELINE = Object.freeze({
  people: 417,
  authIdentities: 223,
  roleAssignments: 223,
  learnerProfiles: 194,
  guardianRelationships: 194,
  organisations: 1,
  organisationMemberships: 1,
  households: 0,
});

export const CANONICAL_COLLECTIONS = Object.freeze([
  'people',
  'authIdentities',
  'roleAssignments',
  'learnerProfiles',
  'guardianRelationships',
  'organisations',
  'organisationMemberships',
]);

const GLOBAL_ROLES = new Set([
  'admin',
  'founder',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
]);

const ROLE_MAP = Object.freeze({
  admin: 'admin',
  founder: 'founder',
  teacher: 'teacher',
  parent: 'parent',
  kid: 'kid',
  learningpartner: 'learningPartner',
  'learning-partner': 'learningPartner',
  schooladmin: 'schoolAdmin',
  'school-admin': 'schoolAdmin',
});

export function token(value) {
  return createHash('sha256')
    .update(String(value || ''), 'utf8')
    .digest('hex')
    .slice(0, 12);
}

export function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeRole(value) {
  const key = cleanText(value).toLowerCase();
  return key ? ROLE_MAP[key] || null : null;
}

function textList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(cleanText).filter(Boolean))];
}

function canonicalRoles(data = {}) {
  return [
    ...new Set([
      data.role,
      ...(Array.isArray(data.roles) ? data.roles : []),
    ].map(normalizeRole).filter(Boolean)),
  ];
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

function userDisplayName(data = {}, authUser = null) {
  return firstText(
    data.displayName,
    data.name,
    combinedName(data),
    authUser?.displayName,
  );
}

function learnerDisplayName(data = {}) {
  return firstText(
    data.fullName,
    data.name,
    data.displayName,
    data.studentName,
    combinedName(data),
  );
}

function learnerAgeYears(data = {}) {
  for (const value of [data.ageYears, data.age]) {
    if (Number.isInteger(value) && value >= 0 && value <= 120) return value;
  }
  return null;
}

function directCountryCode(data = {}) {
  return cleanText(data.countryCode) || null;
}

export function personStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return 'active';
  if (['active', 'suspended', 'archived'].includes(normalized)) {
    return normalized;
  }
  return null;
}

export function organisationStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return 'active';
  if (['active', 'paused', 'archived'].includes(normalized)) {
    return normalized;
  }
  return null;
}

export function membershipStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized || normalized === 'active') return 'active';
  if (['inactive', 'unassigned', 'suspended', 'archived'].includes(normalized)) {
    return 'inactive';
  }
  return null;
}

function hashIdentityKey(namespace, parts) {
  const body = [namespace, ...parts].join('\u001f');
  return createHash('sha256').update(body, 'utf8').digest('hex').slice(0, 32);
}

export function expectedAuthIdentityId(uid) {
  return `auth_${hashIdentityKey('authIdentity', ['firebase', cleanText(uid)])}`;
}

export function expectedRoleAssignmentId({
  personId,
  role,
  scopeType,
  scopeId = null,
}) {
  return `role_${hashIdentityKey('roleAssignment', [
    cleanText(personId),
    cleanText(role),
    cleanText(scopeType),
    cleanText(scopeId),
  ])}`;
}

export function expectedGuardianRelationshipId({
  guardianPersonId,
  learnerPersonId,
}) {
  return `guardian_${hashIdentityKey('guardianRelationship', [
    cleanText(guardianPersonId),
    cleanText(learnerPersonId),
    'parent',
  ])}`;
}

export function expectedOrganisationMembershipId({
  organisationId,
  personId,
}) {
  return `orgmem_${hashIdentityKey('organisationMembership', [
    cleanText(organisationId),
    cleanText(personId),
    'schoolAdmin',
  ])}`;
}

function sourceFieldVersion(data = {}) {
  return Number.isInteger(data.schemaVersion) ? data.schemaVersion : null;
}

function migration(sourceCollection, sourceId, data = {}) {
  return {
    migrationId: MIGRATION_ID,
    sourceCollection,
    sourceId,
    sourceFieldVersion: sourceFieldVersion(data),
  };
}

function baseExpected(sourceCollection, sourceId, data, semantic) {
  return {
    schemaVersion: 1,
    createdBy: MIGRATION_ACTOR,
    updatedBy: MIGRATION_ACTOR,
    migration: migration(sourceCollection, sourceId, data),
    ...semantic,
  };
}

function addExpected(model, collection, id, data, sourcePath) {
  const key = `${collection}/${id}`;
  const existing = model.documents.get(key);
  if (existing && existing.sourcePath !== sourcePath) {
    model.addIssue(
      'expected_target_collision',
      sourcePath,
      ['documentId'],
      true,
    );
    return;
  }
  model.documents.set(key, {
    key,
    collection,
    id,
    expectedData: data,
    sourcePath,
  });
}

function guardianIsPrimary(data, guardianPersonId) {
  const primary = cleanText(data.primaryParentId);
  if (primary) return primary === guardianPersonId;

  const legacy = cleanText(data.parentId);
  if (legacy) return legacy === guardianPersonId;

  const parents = textList(data.parentIds);
  return parents.length === 1 && parents[0] === guardianPersonId;
}

function makeModel() {
  const counts = {};
  const blockingCounts = {};
  const samples = {};
  return {
    documents: new Map(),
    addIssue(code, sourcePath, fields = [], blocking = false) {
      counts[code] = (counts[code] || 0) + 1;
      if (blocking) {
        blockingCounts[code] = (blockingCounts[code] || 0) + 1;
      }
      if (!samples[code]) samples[code] = [];
      if (samples[code].length < 20) {
        samples[code].push({
          sourceToken: token(sourcePath),
          sourceKind: String(sourcePath || '').split('/')[0] || 'unknown',
          fields: [...new Set(fields)].sort(),
          blocksVerification: Boolean(blocking),
        });
      }
    },
    issues() {
      return {
        total: Object.values(counts).reduce((sum, value) => sum + value, 0),
        blockingTotal: Object.values(blockingCounts)
          .reduce((sum, value) => sum + value, 0),
        byCode: Object.fromEntries(
          Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
        ),
        blockingByCode: Object.fromEntries(
          Object.entries(blockingCounts)
            .sort(([a], [b]) => a.localeCompare(b)),
        ),
        samples: Object.fromEntries(
          Object.entries(samples).sort(([a], [b]) => a.localeCompare(b)),
        ),
      };
    },
  };
}

export function deriveExpectedIdentityModel({
  users,
  kids,
  schools,
  schoolUsers,
  authUsers,
}) {
  const model = makeModel();
  const userById = new Map(users.map((row) => [row.id, row]));
  const kidById = new Map(kids.map((row) => [row.id, row]));
  const schoolById = new Map(schools.map((row) => [row.id, row]));
  const authByUid = new Map(authUsers.map((row) => [row.uid, row]));

  for (const userId of userById.keys()) {
    if (kidById.has(userId)) {
      model.addIssue(
        'source_person_id_collision_user_kid',
        `users/${userId}`,
        ['documentId'],
        true,
      );
    }
  }

  for (const user of users) {
    const sourcePath = `users/${user.id}`;
    const data = user.data || {};
    const declaredUid = cleanText(data.uid);
    const declaredUserId = cleanText(data.userId);
    const authUser = authByUid.get(user.id);

    if (declaredUid && declaredUid !== user.id) {
      model.addIssue(
        'source_user_uid_mismatch',
        sourcePath,
        ['uid'],
        true,
      );
    }
    if (declaredUserId && declaredUserId !== user.id) {
      model.addIssue(
        'source_user_user_id_mismatch',
        sourcePath,
        ['userId'],
        true,
      );
    }
    if (!authUser) {
      model.addIssue(
        'source_user_missing_firebase_auth',
        sourcePath,
        ['uid'],
        true,
      );
    }

    const status = personStatus(data.status);
    if (!status) {
      model.addIssue(
        'source_user_status_unsupported',
        sourcePath,
        ['status'],
        true,
      );
      continue;
    }

    const roles = canonicalRoles(data);
    if (!roles.length) {
      model.addIssue(
        'source_user_missing_canonical_role',
        sourcePath,
        ['role', 'roles'],
        true,
      );
    }

    const displayName = userDisplayName(data, authUser);
    if (!displayName) {
      model.addIssue(
        'source_user_missing_display_name',
        sourcePath,
        ['displayName', 'name', 'firstName', 'lastName'],
        true,
      );
    }

    addExpected(
      model,
      'people',
      user.id,
      baseExpected('users', user.id, data, {
        personId: user.id,
        kind: roles.includes('kid') ? 'learner' : 'adult',
        status,
        displayName,
        ...(directCountryCode(data)
          ? { countryCode: directCountryCode(data) }
          : {}),
      }),
      sourcePath,
    );

    if (authUser) {
      const authStatus = authUser.disabled
        ? 'disabled'
        : status === 'archived'
          ? 'archived'
          : 'active';
      const authId = expectedAuthIdentityId(user.id);
      addExpected(
        model,
        'authIdentities',
        authId,
        baseExpected('users', user.id, data, {
          authIdentityId: authId,
          personId: user.id,
          provider: 'firebase',
          providerSubject: user.id,
          status: authStatus,
        }),
        sourcePath,
      );
    }

    for (const role of roles) {
      if (!GLOBAL_ROLES.has(role)) continue;
      const roleId = expectedRoleAssignmentId({
        personId: user.id,
        role,
        scopeType: 'global',
      });
      addExpected(
        model,
        'roleAssignments',
        roleId,
        baseExpected('users', user.id, data, {
          roleAssignmentId: roleId,
          personId: user.id,
          role,
          scopeType: 'global',
          scopeId: null,
          status: status === 'active' ? 'active' : 'inactive',
        }),
        sourcePath,
      );
    }
  }

  for (const kid of kids) {
    const sourcePath = `kids/${kid.id}`;
    const data = kid.data || {};
    const status = personStatus(data.status);
    if (!status) {
      model.addIssue(
        'source_kid_status_unsupported',
        sourcePath,
        ['status'],
        true,
      );
      continue;
    }

    const displayName = learnerDisplayName(data);
    if (!displayName) {
      model.addIssue(
        'source_kid_missing_display_name',
        sourcePath,
        ['fullName', 'name', 'displayName', 'studentName'],
        true,
      );
    }

    const ageYears = learnerAgeYears(data);
    addExpected(
      model,
      'people',
      kid.id,
      baseExpected('kids', kid.id, data, {
        personId: kid.id,
        kind: 'learner',
        status,
        displayName,
        ...(directCountryCode(data)
          ? { countryCode: directCountryCode(data) }
          : {}),
      }),
      sourcePath,
    );
    addExpected(
      model,
      'learnerProfiles',
      kid.id,
      baseExpected('kids', kid.id, data, {
        learnerProfileId: kid.id,
        personId: kid.id,
        status,
        ...(ageYears !== null ? { ageYears } : {}),
        ...(directCountryCode(data)
          ? { countryCode: directCountryCode(data) }
          : {}),
      }),
      sourcePath,
    );

    const primaryParentId = cleanText(data.primaryParentId);
    const legacyParentId = cleanText(data.parentId);
    const parentIds = textList(data.parentIds);
    const guardians = [
      ...new Set(
        [primaryParentId, legacyParentId, ...parentIds].filter(Boolean),
      ),
    ];

    if (!guardians.length) {
      model.addIssue(
        'source_kid_missing_guardian',
        sourcePath,
        ['primaryParentId', 'parentId', 'parentIds'],
        true,
      );
    }
    if (
      primaryParentId &&
      parentIds.length &&
      !parentIds.includes(primaryParentId)
    ) {
      model.addIssue(
        'source_kid_primary_not_in_parent_ids',
        sourcePath,
        ['primaryParentId', 'parentIds'],
        true,
      );
    }
    if (
      primaryParentId &&
      legacyParentId &&
      primaryParentId !== legacyParentId
    ) {
      model.addIssue(
        'source_kid_primary_legacy_parent_mismatch',
        sourcePath,
        ['primaryParentId', 'parentId'],
        true,
      );
    }

    for (const guardianPersonId of guardians) {
      if (!userById.has(guardianPersonId)) {
        model.addIssue(
          'source_guardian_missing_user',
          sourcePath,
          ['primaryParentId', 'parentId', 'parentIds'],
          true,
        );
      }
      const relationshipId = expectedGuardianRelationshipId({
        guardianPersonId,
        learnerPersonId: kid.id,
      });
      addExpected(
        model,
        'guardianRelationships',
        relationshipId,
        baseExpected('kids', kid.id, data, {
          guardianRelationshipId: relationshipId,
          guardianPersonId,
          learnerPersonId: kid.id,
          relationshipType: 'parent',
          isPrimary: guardianIsPrimary(data, guardianPersonId),
          status: status === 'archived' ? 'ended' : 'active',
        }),
        sourcePath,
      );
    }
  }

  for (const school of schools) {
    const sourcePath = `schools/${school.id}`;
    const data = school.data || {};
    const status = organisationStatus(data.status);
    const name = cleanText(data.name);

    if (!status) {
      model.addIssue(
        'source_school_status_unsupported',
        sourcePath,
        ['status'],
        true,
      );
      continue;
    }
    if (!name) {
      model.addIssue(
        'source_school_missing_name',
        sourcePath,
        ['name'],
        true,
      );
    }

    const countryCode = directCountryCode(data);
    const schoolCode = cleanText(data.schoolCode);
    addExpected(
      model,
      'organisations',
      school.id,
      baseExpected('schools', school.id, data, {
        organisationId: school.id,
        type: 'school',
        name,
        status,
        ...(countryCode ? { countryCode } : {}),
        ...(schoolCode ? { legacySchoolCode: schoolCode } : {}),
      }),
      sourcePath,
    );
  }

  for (const schoolUser of schoolUsers) {
    const sourcePath = `schoolUsers/${schoolUser.id}`;
    const data = schoolUser.data || {};
    const personId = cleanText(data.userId) || schoolUser.id;
    const role = normalizeRole(data.role);
    const schoolIds = textList(data.schoolIds);
    const primarySchoolId = cleanText(data.primarySchoolId);
    const status = membershipStatus(data.status);

    if (cleanText(data.userId) && personId !== schoolUser.id) {
      model.addIssue(
        'source_school_user_id_mismatch',
        sourcePath,
        ['userId'],
        true,
      );
    }
    if (role !== 'schoolAdmin') {
      model.addIssue(
        'source_school_user_role_not_school_admin',
        sourcePath,
        ['role'],
        true,
      );
    }
    if (!userById.has(personId)) {
      model.addIssue(
        'source_school_user_missing_person',
        sourcePath,
        ['userId'],
        true,
      );
    }
    if (!schoolIds.length) {
      model.addIssue(
        'source_school_user_missing_school_ids',
        sourcePath,
        ['schoolIds'],
        true,
      );
    }
    if (primarySchoolId && !schoolIds.includes(primarySchoolId)) {
      model.addIssue(
        'source_school_user_primary_not_in_school_ids',
        sourcePath,
        ['primarySchoolId', 'schoolIds'],
        true,
      );
    }
    if (!status) {
      model.addIssue(
        'source_school_user_status_unsupported',
        sourcePath,
        ['status'],
        true,
      );
    }

    for (const organisationId of schoolIds) {
      if (!schoolById.has(organisationId)) {
        model.addIssue(
          'source_school_user_missing_school',
          sourcePath,
          ['schoolIds'],
          true,
        );
      }

      const membershipId = expectedOrganisationMembershipId({
        organisationId,
        personId,
      });
      addExpected(
        model,
        'organisationMemberships',
        membershipId,
        baseExpected('schoolUsers', schoolUser.id, data, {
          organisationMembershipId: membershipId,
          organisationId,
          personId,
          role: 'schoolAdmin',
          status: status || 'inactive',
          isPrimary: primarySchoolId
            ? primarySchoolId === organisationId
            : schoolIds.length === 1 && schoolIds[0] === organisationId,
        }),
        sourcePath,
      );

      const roleId = expectedRoleAssignmentId({
        personId,
        role: 'schoolAdmin',
        scopeType: 'organisation',
        scopeId: organisationId,
      });
      addExpected(
        model,
        'roleAssignments',
        roleId,
        baseExpected('schoolUsers', schoolUser.id, data, {
          roleAssignmentId: roleId,
          personId,
          role: 'schoolAdmin',
          scopeType: 'organisation',
          scopeId: organisationId,
          status: status || 'inactive',
        }),
        sourcePath,
      );
    }
  }

  const authOnlyUsers = authUsers.filter((authUser) =>
    !userById.has(authUser.uid));

  return {
    documents: model.documents,
    issues: model.issues(),
    authOnlyUsers,
    sourceCounts: {
      users: users.length,
      firebaseAuthUsers: authUsers.length,
      kids: kids.length,
      schools: schools.length,
      schoolUsers: schoolUsers.length,
    },
  };
}

function plainValue(value) {
  if (Array.isArray(value)) return value.map(plainValue);
  if (
    value &&
    typeof value === 'object' &&
    typeof value.toMillis === 'function'
  ) {
    return { __timestampMillis: value.toMillis() };
  }
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, plainValue(value[key])]),
  );
}

function comparable(value) {
  const copy = { ...(value || {}) };
  delete copy.createdAt;
  delete copy.updatedAt;
  return plainValue(copy);
}

export function compareCanonicalDocument(actualData, expectedData) {
  const mismatches = [];
  const actual = actualData || {};

  if (!actual.createdAt || typeof actual.createdAt.toMillis !== 'function') {
    mismatches.push('createdAt');
  }
  if (!actual.updatedAt || typeof actual.updatedAt.toMillis !== 'function') {
    mismatches.push('updatedAt');
  }

  if (
    JSON.stringify(comparable(actual)) !==
    JSON.stringify(comparable(expectedData))
  ) {
    const keys = new Set([
      ...Object.keys(comparable(actual)),
      ...Object.keys(comparable(expectedData)),
    ]);
    for (const key of [...keys].sort()) {
      if (
        JSON.stringify(comparable(actual)[key]) !==
        JSON.stringify(comparable(expectedData)[key])
      ) {
        mismatches.push(key);
      }
    }
  }

  return [...new Set(mismatches)].sort();
}

export function verifyReferences(actualByCollection, authUsers) {
  const issues = [];
  const people = actualByCollection.people || new Map();
  const organisations = actualByCollection.organisations || new Map();
  const authUidSet = new Set(authUsers.map((user) => user.uid));

  const seenProviderSubjects = new Set();
  for (const [id, data] of actualByCollection.authIdentities || []) {
    if (data.authIdentityId !== id) {
      issues.push({ code: 'auth_identity_id_field_mismatch', key: `authIdentities/${id}` });
    }
    if (!people.has(data.personId)) {
      issues.push({ code: 'auth_identity_missing_person', key: `authIdentities/${id}` });
    }
    if (data.provider !== 'firebase' || !authUidSet.has(data.providerSubject)) {
      issues.push({ code: 'auth_identity_provider_subject_invalid', key: `authIdentities/${id}` });
    }
    const logical = `${data.provider}:${data.providerSubject}`;
    if (seenProviderSubjects.has(logical)) {
      issues.push({ code: 'auth_identity_duplicate_provider_subject', key: `authIdentities/${id}` });
    }
    seenProviderSubjects.add(logical);
  }

  const seenRoles = new Set();
  for (const [id, data] of actualByCollection.roleAssignments || []) {
    if (data.roleAssignmentId !== id) {
      issues.push({ code: 'role_assignment_id_field_mismatch', key: `roleAssignments/${id}` });
    }
    if (!people.has(data.personId)) {
      issues.push({ code: 'role_assignment_missing_person', key: `roleAssignments/${id}` });
    }
    if (data.scopeType === 'organisation' && !organisations.has(data.scopeId)) {
      issues.push({ code: 'role_assignment_missing_scope_organisation', key: `roleAssignments/${id}` });
    }
    if (data.role === 'schoolAdmin' && data.scopeType !== 'organisation') {
      issues.push({ code: 'school_admin_role_not_organisation_scoped', key: `roleAssignments/${id}` });
    }
    const logical = `${data.personId}:${data.role}:${data.scopeType}:${data.scopeId || ''}`;
    if (seenRoles.has(logical)) {
      issues.push({ code: 'role_assignment_duplicate_logical_role', key: `roleAssignments/${id}` });
    }
    seenRoles.add(logical);
  }

  for (const [id, data] of actualByCollection.learnerProfiles || []) {
    if (data.learnerProfileId !== id || data.personId !== id) {
      issues.push({ code: 'learner_profile_id_link_mismatch', key: `learnerProfiles/${id}` });
    }
    const person = people.get(data.personId);
    if (!person) {
      issues.push({ code: 'learner_profile_missing_person', key: `learnerProfiles/${id}` });
    } else if (person.kind !== 'learner') {
      issues.push({ code: 'learner_profile_person_not_learner', key: `learnerProfiles/${id}` });
    }
  }

  const seenGuardians = new Set();
  for (const [id, data] of actualByCollection.guardianRelationships || []) {
    if (data.guardianRelationshipId !== id) {
      issues.push({ code: 'guardian_relationship_id_field_mismatch', key: `guardianRelationships/${id}` });
    }
    if (!people.has(data.guardianPersonId)) {
      issues.push({ code: 'guardian_relationship_missing_guardian', key: `guardianRelationships/${id}` });
    }
    const learner = people.get(data.learnerPersonId);
    if (!learner) {
      issues.push({ code: 'guardian_relationship_missing_learner', key: `guardianRelationships/${id}` });
    } else if (learner.kind !== 'learner') {
      issues.push({ code: 'guardian_relationship_target_not_learner', key: `guardianRelationships/${id}` });
    }
    const logical = `${data.guardianPersonId}:${data.learnerPersonId}:${data.relationshipType}`;
    if (seenGuardians.has(logical)) {
      issues.push({ code: 'guardian_relationship_duplicate_logical_relation', key: `guardianRelationships/${id}` });
    }
    seenGuardians.add(logical);
  }

  for (const [id, data] of actualByCollection.organisations || []) {
    if (data.organisationId !== id) {
      issues.push({ code: 'organisation_id_field_mismatch', key: `organisations/${id}` });
    }
  }

  const seenMemberships = new Set();
  for (const [id, data] of actualByCollection.organisationMemberships || []) {
    if (data.organisationMembershipId !== id) {
      issues.push({ code: 'organisation_membership_id_field_mismatch', key: `organisationMemberships/${id}` });
    }
    if (!people.has(data.personId)) {
      issues.push({ code: 'organisation_membership_missing_person', key: `organisationMemberships/${id}` });
    }
    if (!organisations.has(data.organisationId)) {
      issues.push({ code: 'organisation_membership_missing_organisation', key: `organisationMemberships/${id}` });
    }
    const logical = `${data.organisationId}:${data.personId}:${data.role}`;
    if (seenMemberships.has(logical)) {
      issues.push({ code: 'organisation_membership_duplicate_logical_membership', key: `organisationMemberships/${id}` });
    }
    seenMemberships.add(logical);
  }

  return issues;
}

export function countExpectedByCollection(documents) {
  const counts = Object.fromEntries(
    CANONICAL_COLLECTIONS.map((collection) => [collection, 0]),
  );
  for (const document of documents.values()) {
    counts[document.collection] += 1;
  }
  return counts;
}
