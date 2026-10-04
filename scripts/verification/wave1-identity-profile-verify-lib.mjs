import { createHash } from 'node:crypto';

export const PROFILE_VERIFY_SCHEMA_VERSION = 1;
export const PROFILE_MIGRATION_ID =
  'wave1-identity-profile-retirement-v1';
export const PROFILE_MIGRATION_ACTOR =
  `migration:${PROFILE_MIGRATION_ID}`;

export const PROFILE_TARGET_COLLECTIONS = Object.freeze([
  'personContacts',
  'personLifecycle',
  'staffPrivateProfiles',
  'parents',
  'teachers',
  'learningPartners',
  'admins',
  'learnerDetails',
  'learnerReadModels',
  'learnerProvenance',
  'organisationProfiles',
  'organisationAssignments',
]);

const ROLE_COLLECTIONS = Object.freeze({
  parent: 'parents',
  teacher: 'teachers',
  learningPartner: 'learningPartners',
  admin: 'admins',
});

const ACTIVE_ENROLLMENT_STATUSES = new Set([
  '',
  'active',
  'trial',
  'paused',
  'enrolled',
  'current',
  'ongoing',
]);

export function token(value) {
  return createHash('sha256')
    .update(String(value || ''), 'utf8')
    .digest('hex')
    .slice(0, 12);
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasOwn(data, key) {
  return Boolean(
    data &&
    Object.prototype.hasOwnProperty.call(data, key),
  );
}

function firstText(...values) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
}

function textList(value) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.map(cleanText).filter(Boolean),
    ),
  ];
}

function normalizeRole(value) {
  const key = cleanText(value).toLowerCase();
  if (key === 'learningpartner' || key === 'learning-partner') {
    return 'learningPartner';
  }
  if (key === 'schooladmin' || key === 'school-admin') {
    return 'schoolAdmin';
  }
  if (
    ['admin', 'founder', 'teacher', 'parent', 'kid']
      .includes(key)
  ) {
    return key;
  }
  return key || null;
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!value || typeof value !== 'object') return value;
  if (
    typeof value.toMillis === 'function' ||
    typeof value.toDate === 'function'
  ) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, cloneValue(item)]),
  );
}

function compact(value) {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, cloneValue(item)]),
  );
}

function migration(sourceCollection, sourceId) {
  return {
    migrationId: PROFILE_MIGRATION_ID,
    sourceCollection,
    sourceId,
  };
}

function baseExpected(sourceCollection, sourceId) {
  return {
    schemaVersion: PROFILE_VERIFY_SCHEMA_VERSION,
    createdBy: PROFILE_MIGRATION_ACTOR,
    updatedBy: PROFILE_MIGRATION_ACTOR,
    migration: migration(sourceCollection, sourceId),
  };
}

function profileMigration(sourceId) {
  return {
    migrationId: PROFILE_MIGRATION_ID,
    sourceCollection: 'users',
    sourceId,
  };
}

function hash32(parts) {
  return createHash('sha256')
    .update(parts.join('\u001f'), 'utf8')
    .digest('hex')
    .slice(0, 32);
}

export function expectedOrganisationAssignmentId({
  organisationId,
  personId,
  role,
}) {
  return hash32([
    'organisationAssignment',
    cleanText(organisationId),
    cleanText(personId),
    cleanText(role),
  ]);
}

function addExpected(
  documents,
  collection,
  id,
  expectedData,
  sourcePath,
  ownership = 'migration',
) {
  const key = `${collection}/${id}`;
  if (documents.has(key)) {
    throw new Error(`duplicate_expected_profile_target:${key}`);
  }
  documents.set(key, {
    key,
    collection,
    id,
    expectedData: compact(expectedData),
    sourcePath,
    ownership,
  });
}

function expectedContact(id, data) {
  const email = cleanText(data.email);
  return compact({
    ...baseExpected('users', id),
    personContactId: id,
    personId: id,
    ...(email ? { email } : {}),
    ...(hasOwn(data, 'phone') ? { phone: cloneValue(data.phone) } : {}),
    ...(hasOwn(data, 'phoneCountryCode')
      ? { phoneCountryCode: cloneValue(data.phoneCountryCode) }
      : {}),
    ...(hasOwn(data, 'phoneLocal')
      ? { phoneLocal: cloneValue(data.phoneLocal) }
      : {}),
    ...(hasOwn(data, 'whatsappE164')
      ? { whatsappE164: cloneValue(data.whatsappE164) }
      : {}),
    ...(hasOwn(data, 'timezone')
      ? { timezone: cloneValue(data.timezone) }
      : {}),
    ...(hasOwn(data, 'countryCodeSource')
      ? { countryCodeSource: cloneValue(data.countryCodeSource) }
      : {}),
    ...(hasOwn(data, 'countryCodeUpdatedAt')
      ? { countryCodeUpdatedAt: cloneValue(data.countryCodeUpdatedAt) }
      : {}),
  });
}

function expectedRoleProfile(id, data, role) {
  const out = {
    canonicalProfileSchemaVersion: PROFILE_VERIFY_SCHEMA_VERSION,
    personId: id,
    profileRole: role,
    profileAuthority: 'canonical',
    profileMigration: profileMigration(id),
  };

  if (hasOwn(data, 'status')) out.status = cloneValue(data.status);

  const qualifications = firstText(
    data.qualifications,
    data.qualification,
  );
  const preferredSpecializations = textList(data.specializations);
  const specializations = preferredSpecializations.length
    ? preferredSpecializations
    : textList(data.specialization);
  const preferredLanguages = textList(data.languagesSpoken);
  const languages = preferredLanguages.length
    ? preferredLanguages
    : textList(data.languages);

  if (qualifications) out.qualifications = qualifications;
  if (specializations.length) out.specializations = specializations;
  if (languages.length) out.languages = languages;

  for (const key of [
    'yearsExperience',
    'city',
    'bio',
    'region',
    'preferences',
  ]) {
    if (hasOwn(data, key)) out[key] = cloneValue(data[key]);
  }

  return compact(out);
}

function expectedStaffPrivate(id, data, role) {
  const out = {
    ...baseExpected('users', id),
    staffPrivateProfileId: id,
    personId: id,
    role,
  };

  const bankAccountNumber = firstText(
    data.bankAccountNumber,
    data.bankAccount,
  );
  if (bankAccountNumber) {
    out.bankAccountNumber = bankAccountNumber;
  }

  for (const key of [
    'bankAccountHolderName',
    'bankIfscCode',
    'upiId',
    'emergencyContactName',
    'emergencyContactPhone',
  ]) {
    if (hasOwn(data, key)) out[key] = cloneValue(data[key]);
  }

  const businessKeys = Object.keys(out).filter(
    (key) =>
      ![
        'schemaVersion',
        'createdBy',
        'updatedBy',
        'migration',
        'staffPrivateProfileId',
        'personId',
        'role',
      ].includes(key),
  );

  return businessKeys.length ? compact(out) : null;
}

function expectedLifecycle(id, sourceCollection, data) {
  const hasArchive =
    hasOwn(data, 'archivedAt') ||
    hasOwn(data, 'archivedBy') ||
    hasOwn(data, 'archivedReason');

  if (!hasArchive) return null;

  return compact({
    ...baseExpected(sourceCollection, id),
    personLifecycleId: id,
    personId: id,
    ...(hasOwn(data, 'archivedAt')
      ? { archivedAt: cloneValue(data.archivedAt) }
      : {}),
    ...(hasOwn(data, 'archivedBy')
      ? { archivedBy: cloneValue(data.archivedBy) }
      : {}),
    ...(hasOwn(data, 'archivedReason')
      ? { archivedReason: cloneValue(data.archivedReason) }
      : {}),
  });
}

export function deriveExpectedProfileTargets({
  users = [],
  kids = [],
  schools = [],
}) {
  const documents = new Map();

  for (const row of users) {
    const id = row.id;
    const data = row.data || {};
    const sourcePath = `users/${id}`;
    const role = normalizeRole(data.role ?? data.rawRole);

    addExpected(
      documents,
      'personContacts',
      id,
      expectedContact(id, data),
      sourcePath,
    );

    const roleCollection = ROLE_COLLECTIONS[role];
    if (roleCollection) {
      addExpected(
        documents,
        roleCollection,
        id,
        expectedRoleProfile(id, data, role),
        sourcePath,
        'roleProfilePromotion',
      );
    }

    const privateProfile = expectedStaffPrivate(id, data, role);
    if (privateProfile) {
      addExpected(
        documents,
        'staffPrivateProfiles',
        id,
        privateProfile,
        sourcePath,
      );
    }

    const lifecycle = expectedLifecycle(id, 'users', data);
    if (lifecycle) {
      addExpected(
        documents,
        'personLifecycle',
        id,
        lifecycle,
        sourcePath,
      );
    }
  }

  for (const row of kids) {
    const id = row.id;
    const data = row.data || {};
    const sourcePath = `kids/${id}`;

    if (hasOwn(data, 'grade')) {
      addExpected(
        documents,
        'learnerDetails',
        id,
        {
          ...baseExpected('kids', id),
          learnerDetailsId: id,
          personId: id,
          grade: cloneValue(data.grade),
        },
        sourcePath,
      );
    }

    if (hasOwn(data, 'summary') || hasOwn(data, 'progress')) {
      addExpected(
        documents,
        'learnerReadModels',
        id,
        {
          ...baseExpected('kids', id),
          learnerReadModelId: id,
          personId: id,
          ...(hasOwn(data, 'summary')
            ? { summary: cloneValue(data.summary) }
            : {}),
          ...(hasOwn(data, 'progress')
            ? { progress: cloneValue(data.progress) }
            : {}),
        },
        sourcePath,
      );
    }

    const provenanceKeys = [
      'repairedFromBrokenStudentId',
      'repairedFromEnrollmentId',
      'repairSource',
    ];
    if (provenanceKeys.some((key) => hasOwn(data, key))) {
      addExpected(
        documents,
        'learnerProvenance',
        id,
        {
          ...baseExpected('kids', id),
          learnerProvenanceId: id,
          personId: id,
          ...Object.fromEntries(
            provenanceKeys
              .filter((key) => hasOwn(data, key))
              .map((key) => [key, cloneValue(data[key])]),
          ),
        },
        sourcePath,
      );
    }

    const lifecycle = expectedLifecycle(id, 'kids', data);
    if (lifecycle) {
      addExpected(
        documents,
        'personLifecycle',
        id,
        lifecycle,
        sourcePath,
      );
    }
  }

  for (const row of schools) {
    const id = row.id;
    const data = row.data || {};
    const sourcePath = `schools/${id}`;

    const profileKeys = [
      'contact',
      'location',
      'nameSearch',
      'currentAcademicYearId',
    ];
    if (profileKeys.some((key) => hasOwn(data, key))) {
      addExpected(
        documents,
        'organisationProfiles',
        id,
        {
          ...baseExpected('schools', id),
          organisationProfileId: id,
          organisationId: id,
          ...Object.fromEntries(
            profileKeys
              .filter((key) => hasOwn(data, key))
              .map((key) => [key, cloneValue(data[key])]),
          ),
        },
        sourcePath,
      );
    }

    const personId = cleanText(data.learningPartnerId);
    if (personId) {
      const role = 'learningPartner';
      const assignmentId = expectedOrganisationAssignmentId({
        organisationId: id,
        personId,
        role,
      });
      addExpected(
        documents,
        'organisationAssignments',
        assignmentId,
        {
          ...baseExpected('schools', id),
          organisationAssignmentId: assignmentId,
          organisationId: id,
          personId,
          role,
          status: 'active',
          ...(hasOwn(data, 'learningPartnerAssignedAt')
            ? {
                assignedAt: cloneValue(
                  data.learningPartnerAssignedAt,
                ),
              }
            : {}),
        },
        sourcePath,
      );
    }
  }

  return { documents };
}

function timestampLike(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    (
      typeof value.toMillis === 'function' ||
      typeof value.toDate === 'function'
    ),
  );
}

function valuesEqual(actual, expected) {
  if (timestampLike(actual) && timestampLike(expected)) {
    if (
      typeof actual.toMillis === 'function' &&
      typeof expected.toMillis === 'function'
    ) {
      return actual.toMillis() === expected.toMillis();
    }
    return String(actual.toDate()) === String(expected.toDate());
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      return false;
    }
    return expected.every(
      (item, index) => valuesEqual(actual[index], item),
    );
  }

  if (expected && typeof expected === 'object') {
    if (!actual || typeof actual !== 'object') return false;
    return Object.entries(expected).every(
      ([key, value]) =>
        hasOwn(actual, key) &&
        valuesEqual(actual[key], value),
    );
  }

  return actual === expected;
}

export function compareProfileDocument(actual, expectedData) {
  if (!actual || typeof actual !== 'object') {
    return ['document'];
  }

  const mismatches = [];
  for (const [key, expected] of Object.entries(expectedData || {})) {
    if (!hasOwn(actual, key) || !valuesEqual(actual[key], expected)) {
      mismatches.push(key);
    }
  }

  if (!timestampLike(actual.createdAt)) mismatches.push('createdAt');
  if (!timestampLike(actual.updatedAt)) mismatches.push('updatedAt');

  return [...new Set(mismatches)].sort();
}

export function countExpectedByCollection(documents) {
  const counts = {};
  for (const item of documents.values()) {
    counts[item.collection] = (counts[item.collection] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export function isOwnedByProfileMigration(data) {
  return Boolean(
    data &&
    (
      data.migration?.migrationId === PROFILE_MIGRATION_ID ||
      data.profileMigration?.migrationId === PROFILE_MIGRATION_ID
    )
  );
}

function relationshipKidIds(data) {
  return [
    ...new Set(
      [
        cleanText(data.kidId),
        cleanText(data.studentId),
        cleanText(data.childId),
        ...textList(data.kidIds),
      ].filter(Boolean),
    ),
  ];
}

function relationshipTeacherIds(data) {
  return [
    ...new Set(
      [
        cleanText(data.teacherId),
        cleanText(data.assignedTeacherId),
        cleanText(data.primaryTeacherId),
        cleanText(data.teacherUid),
        cleanText(data.teacher_id),
        ...textList(data.teacherIds),
      ].filter(Boolean),
    ),
  ];
}

function evidenceByKid(rows) {
  const byKid = new Map();
  for (const row of rows || []) {
    const data = row.data || {};
    const teacherIds = relationshipTeacherIds(data);
    if (!teacherIds.length) continue;
    for (const kidId of relationshipKidIds(data)) {
      const set = byKid.get(kidId) || new Set();
      teacherIds.forEach((teacherId) => set.add(teacherId));
      byKid.set(kidId, set);
    }
  }
  return byKid;
}

function usableEnrollment(data) {
  if (
    data.archived === true ||
    data.isArchived === true ||
    data.deleted === true ||
    data.isDeleted === true ||
    data.archivedAt ||
    data.deletedAt
  ) {
    return false;
  }
  return ACTIVE_ENROLLMENT_STATUSES.has(
    cleanText(data.status).toLowerCase(),
  );
}

function userDisplayName(data) {
  return firstText(
    data.displayName,
    data.name,
    [cleanText(data.firstName), cleanText(data.lastName)]
      .filter(Boolean)
      .join(' '),
  );
}

export function verifyRetirementDependencies({
  users = [],
  kids = [],
  schools = [],
  enrollments = [],
  classSessions = [],
  guardianRelationships = [],
  peopleIds = new Set(),
  learnerProfileIds = new Set(),
  organisationIds = new Set(),
}) {
  const issues = [];
  const add = (code, key) => issues.push({ code, key });

  for (const row of users) {
    if (!peopleIds.has(row.id)) {
      add('user_missing_canonical_person', `users/${row.id}`);
    }
  }

  for (const row of kids) {
    if (!peopleIds.has(row.id)) {
      add('kid_missing_canonical_person', `kids/${row.id}`);
    }
    if (!learnerProfileIds.has(row.id)) {
      add(
        'kid_missing_canonical_learner_profile',
        `kids/${row.id}`,
      );
    }
  }

  for (const row of schools) {
    if (!organisationIds.has(row.id)) {
      add(
        'school_missing_canonical_organisation',
        `schools/${row.id}`,
      );
    }
  }

  const guardianPairs = new Set(
    guardianRelationships.map((row) => {
      const data = row.data || {};
      return [
        cleanText(data.guardianPersonId),
        cleanText(data.learnerPersonId),
      ].join(':');
    }),
  );

  for (const row of users) {
    for (const kidId of textList(row.data?.childIds)) {
      if (!guardianPairs.has(`${row.id}:${kidId}`)) {
        add(
          'legacy_child_backlink_missing_canonical_guardian_relationship',
          `users/${row.id}:kids/${kidId}`,
        );
      }
    }
  }

  const usableTeachers = evidenceByKid(
    enrollments.filter((row) => usableEnrollment(row.data || {})),
  );
  const anyEnrollmentTeachers = evidenceByKid(enrollments);
  const sessionTeachers = evidenceByKid(classSessions);

  for (const row of kids) {
    const legacyTeachers = [
      ...new Set(
        [
          cleanText(row.data?.teacherId),
          ...textList(row.data?.teacherIds),
        ].filter(Boolean),
      ),
    ];

    for (const teacherId of legacyTeachers) {
      if (usableTeachers.get(row.id)?.has(teacherId)) continue;
      if (anyEnrollmentTeachers.get(row.id)?.has(teacherId)) continue;
      if (sessionTeachers.get(row.id)?.has(teacherId)) continue;
      add(
        'legacy_kid_teacher_missing_any_operational_or_historical_evidence',
        `kids/${row.id}:teacher/${teacherId}`,
      );
    }
  }

  const usersById = new Map(
    users.map((row) => [row.id, row.data || {}]),
  );

  for (const row of schools) {
    const data = row.data || {};
    const lpId = cleanText(data.learningPartnerId);
    if (!lpId) continue;

    if (!peopleIds.has(lpId)) {
      add(
        'school_learning_partner_missing_canonical_person',
        `schools/${row.id}:lp/${lpId}`,
      );
    }

    const lp = usersById.get(lpId);
    if (!lp) {
      add(
        'school_learning_partner_missing_legacy_user',
        `schools/${row.id}:lp/${lpId}`,
      );
      continue;
    }

    const schoolName = cleanText(data.learningPartnerName);
    const currentName = userDisplayName(lp);
    if (
      schoolName &&
      currentName &&
      schoolName.toLowerCase() !== currentName.toLowerCase()
    ) {
      add(
        'school_learning_partner_name_snapshot_mismatch',
        `schools/${row.id}:lp/${lpId}`,
      );
    }

    const schoolEmail = cleanText(
      data.learningPartnerEmail,
    ).toLowerCase();
    const currentEmail = cleanText(lp.email).toLowerCase();
    if (
      schoolEmail &&
      currentEmail &&
      schoolEmail !== currentEmail
    ) {
      add(
        'school_learning_partner_email_snapshot_mismatch',
        `schools/${row.id}:lp/${lpId}`,
      );
    }
  }

  return issues;
}
