import { createHash } from 'node:crypto';

export const PROFILE_RETIREMENT_MIGRATION_ID =
  'wave1-identity-profile-retirement-v1';

export const PROFILE_RETIREMENT_MIGRATION_ACTOR =
  `migration:${PROFILE_RETIREMENT_MIGRATION_ID}`;

export const PROFILE_RETIREMENT_SCHEMA_VERSION = 1;

export const PROFILE_TARGET_COLLECTIONS = [
  'personContacts',
  'personLifecycle',
  'staffPrivateProfiles',
  'learnerDetails',
  'learnerReadModels',
  'learnerProvenance',
  'organisationProfiles',
  'organisationAssignments',
];

export const ROLE_PROFILE_COLLECTIONS = {
  parent: 'parents',
  teacher: 'teachers',
  learningPartner: 'learningPartners',
  admin: 'admins',
};

const ACTIVE_ENROLLMENT_STATUSES = new Set([
  '',
  'active',
  'trial',
  'paused',
  'enrolled',
  'current',
  'ongoing',
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasOwn(data, key) {
  return Boolean(
    data &&
    Object.prototype.hasOwnProperty.call(data, key),
  );
}

function presentValue(data, key) {
  return hasOwn(data, key) ? data[key] : undefined;
}

function firstText(...values) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
}

function stringList(value) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => cleanText(item))
        .filter(Boolean),
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
    [
      'admin',
      'founder',
      'teacher',
      'parent',
      'kid',
    ].includes(key)
  ) {
    return key;
  }
  return key || null;
}

function safeClone(value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(safeClone);
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
      .map(([key, item]) => [key, safeClone(item)]),
  );
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, safeClone(item)]),
  );
}

function migration(sourceCollection, sourceId) {
  return {
    migrationId: PROFILE_RETIREMENT_MIGRATION_ID,
    sourceCollection,
    sourceId,
  };
}

function expectedBase(sourceCollection, sourceId) {
  return {
    schemaVersion: PROFILE_RETIREMENT_SCHEMA_VERSION,
    createdBy: PROFILE_RETIREMENT_MIGRATION_ACTOR,
    updatedBy: PROFILE_RETIREMENT_MIGRATION_ACTOR,
    migration: migration(sourceCollection, sourceId),
  };
}

function roleProfileMigration(sourceId) {
  return {
    migrationId: PROFILE_RETIREMENT_MIGRATION_ID,
    sourceCollection: 'users',
    sourceId,
  };
}

function action(params) {
  const {
    sourceCollection,
    sourceId,
    collection,
    documentId,
    expectedData,
    ownership = 'migration',
    identityFields = {},
  } = params;

  return {
    sourceCollection,
    sourceId,
    collection,
    documentId,
    key: `${collection}/${documentId}`,
    expectedData: compactObject(expectedData),
    ownership,
    identityFields,
  };
}

function hashedId(parts) {
  return createHash('sha256')
    .update(parts.join('\u001f'), 'utf8')
    .digest('hex')
    .slice(0, 32);
}

export function privacyToken(value) {
  return createHash('sha256')
    .update(String(value || ''), 'utf8')
    .digest('hex')
    .slice(0, 12);
}

export function buildOrganisationAssignmentId({
  organisationId,
  personId,
  role,
}) {
  return hashedId([
    'organisationAssignment',
    organisationId,
    personId,
    role,
  ]);
}

function contactPatch(userId, data) {
  const email = cleanText(data.email);
  const phone = presentValue(data, 'phone');
  const phoneCountryCode =
    presentValue(data, 'phoneCountryCode');
  const phoneLocal = presentValue(data, 'phoneLocal');
  const whatsappE164 =
    presentValue(data, 'whatsappE164');
  const timezone = presentValue(data, 'timezone');
  const countryCodeSource =
    presentValue(data, 'countryCodeSource');
  const countryCodeUpdatedAt =
    presentValue(data, 'countryCodeUpdatedAt');

  return compactObject({
    ...expectedBase('users', userId),
    personContactId: userId,
    personId: userId,
    ...(email ? { email } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(phoneCountryCode !== undefined
      ? { phoneCountryCode }
      : {}),
    ...(phoneLocal !== undefined
      ? { phoneLocal }
      : {}),
    ...(whatsappE164 !== undefined
      ? { whatsappE164 }
      : {}),
    ...(timezone !== undefined
      ? { timezone }
      : {}),
    ...(countryCodeSource !== undefined
      ? { countryCodeSource }
      : {}),
    ...(countryCodeUpdatedAt !== undefined
      ? { countryCodeUpdatedAt }
      : {}),
  });
}

function normalizedQualifications(data) {
  return firstText(
    data.qualifications,
    data.qualification,
  );
}

function normalizedSpecializations(data) {
  const preferred = stringList(data.specializations);
  return preferred.length
    ? preferred
    : stringList(data.specialization);
}

function normalizedLanguages(data) {
  const preferred = stringList(data.languagesSpoken);
  return preferred.length
    ? preferred
    : stringList(data.languages);
}

function roleProfilePatch(userId, data, role) {
  const patch = {
    canonicalProfileSchemaVersion:
      PROFILE_RETIREMENT_SCHEMA_VERSION,
    personId: userId,
    profileRole: role,
    profileAuthority: 'canonical',
    profileMigration: roleProfileMigration(userId),
  };

  if (hasOwn(data, 'status')) {
    patch.status = data.status;
  }

  const qualifications =
    normalizedQualifications(data);
  const specializations =
    normalizedSpecializations(data);
  const languages = normalizedLanguages(data);

  if (qualifications) {
    patch.qualifications = qualifications;
  }
  if (specializations.length) {
    patch.specializations = specializations;
  }
  if (languages.length) {
    patch.languages = languages;
  }

  for (const key of [
    'yearsExperience',
    'city',
    'bio',
    'region',
    'preferences',
  ]) {
    if (hasOwn(data, key)) {
      patch[key] = safeClone(data[key]);
    }
  }

  return compactObject(patch);
}

function privateStaffPatch(userId, data, role) {
  const patch = {
    ...expectedBase('users', userId),
    staffPrivateProfileId: userId,
    personId: userId,
    role,
  };

  const bankAccountNumber = firstText(
    data.bankAccountNumber,
    data.bankAccount,
  );

  if (bankAccountNumber) {
    patch.bankAccountNumber = bankAccountNumber;
  }

  for (const key of [
    'bankAccountHolderName',
    'bankIfscCode',
    'upiId',
    'emergencyContactName',
    'emergencyContactPhone',
  ]) {
    if (hasOwn(data, key)) {
      patch[key] = safeClone(data[key]);
    }
  }

  const businessKeys = Object.keys(patch).filter(
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

  return businessKeys.length
    ? compactObject(patch)
    : null;
}

function lifecyclePatch(personId, sourceCollection, data) {
  const hasArchive =
    hasOwn(data, 'archivedAt') ||
    hasOwn(data, 'archivedBy') ||
    hasOwn(data, 'archivedReason');

  if (!hasArchive) return null;

  return compactObject({
    ...expectedBase(sourceCollection, personId),
    personLifecycleId: personId,
    personId,
    ...(hasOwn(data, 'archivedAt')
      ? { archivedAt: safeClone(data.archivedAt) }
      : {}),
    ...(hasOwn(data, 'archivedBy')
      ? { archivedBy: safeClone(data.archivedBy) }
      : {}),
    ...(hasOwn(data, 'archivedReason')
      ? { archivedReason: safeClone(data.archivedReason) }
      : {}),
  });
}

function learnerDetailsPatch(kidId, data) {
  if (!hasOwn(data, 'grade')) return null;
  return compactObject({
    ...expectedBase('kids', kidId),
    learnerDetailsId: kidId,
    personId: kidId,
    grade: safeClone(data.grade),
  });
}

function learnerReadModelPatch(kidId, data) {
  const hasSummary = hasOwn(data, 'summary');
  const hasProgress = hasOwn(data, 'progress');
  if (!hasSummary && !hasProgress) return null;

  return compactObject({
    ...expectedBase('kids', kidId),
    learnerReadModelId: kidId,
    personId: kidId,
    ...(hasSummary
      ? { summary: safeClone(data.summary) }
      : {}),
    ...(hasProgress
      ? { progress: safeClone(data.progress) }
      : {}),
  });
}

function learnerProvenancePatch(kidId, data) {
  const keys = [
    'repairedFromBrokenStudentId',
    'repairedFromEnrollmentId',
    'repairSource',
  ];
  if (!keys.some((key) => hasOwn(data, key))) {
    return null;
  }

  return compactObject({
    ...expectedBase('kids', kidId),
    learnerProvenanceId: kidId,
    personId: kidId,
    ...Object.fromEntries(
      keys
        .filter((key) => hasOwn(data, key))
        .map((key) => [key, safeClone(data[key])]),
    ),
  });
}

function organisationProfilePatch(schoolId, data) {
  const keys = [
    'contact',
    'location',
    'nameSearch',
    'currentAcademicYearId',
  ];
  if (!keys.some((key) => hasOwn(data, key))) {
    return null;
  }

  return compactObject({
    ...expectedBase('schools', schoolId),
    organisationProfileId: schoolId,
    organisationId: schoolId,
    ...Object.fromEntries(
      keys
        .filter((key) => hasOwn(data, key))
        .map((key) => [key, safeClone(data[key])]),
    ),
  });
}

function organisationAssignmentPatch(schoolId, data) {
  const personId = cleanText(data.learningPartnerId);
  if (!personId) return null;

  const role = 'learningPartner';
  const organisationAssignmentId =
    buildOrganisationAssignmentId({
      organisationId: schoolId,
      personId,
      role,
    });

  return compactObject({
    ...expectedBase('schools', schoolId),
    organisationAssignmentId,
    organisationId: schoolId,
    personId,
    role,
    status: 'active',
    ...(hasOwn(data, 'learningPartnerAssignedAt')
      ? {
          assignedAt: safeClone(
            data.learningPartnerAssignedAt,
          ),
        }
      : {}),
  });
}

export function buildSourceActions({
  users,
  kids,
  schools,
}) {
  const records = [];

  for (const row of users) {
    const data = row.data || {};
    const role = normalizeRole(
      data.role ?? data.rawRole,
    );

    const actions = [
      action({
        sourceCollection: 'users',
        sourceId: row.id,
        collection: 'personContacts',
        documentId: row.id,
        expectedData: contactPatch(row.id, data),
        identityFields: { personId: row.id },
      }),
    ];

    const roleCollection =
      ROLE_PROFILE_COLLECTIONS[role];
    if (roleCollection) {
      actions.push(
        action({
          sourceCollection: 'users',
          sourceId: row.id,
          collection: roleCollection,
          documentId: row.id,
          expectedData: roleProfilePatch(
            row.id,
            data,
            role,
          ),
          ownership: 'roleProfilePromotion',
          identityFields: {
            personId: row.id,
            profileRole: role,
          },
        }),
      );
    }

    const privatePatch =
      privateStaffPatch(row.id, data, role);
    if (privatePatch) {
      actions.push(
        action({
          sourceCollection: 'users',
          sourceId: row.id,
          collection: 'staffPrivateProfiles',
          documentId: row.id,
          expectedData: privatePatch,
          identityFields: {
            personId: row.id,
          },
        }),
      );
    }

    const lifecycle =
      lifecyclePatch(row.id, 'users', data);
    if (lifecycle) {
      actions.push(
        action({
          sourceCollection: 'users',
          sourceId: row.id,
          collection: 'personLifecycle',
          documentId: row.id,
          expectedData: lifecycle,
          identityFields: {
            personId: row.id,
          },
        }),
      );
    }

    records.push({
      sourceCollection: 'users',
      sourceId: row.id,
      actions,
    });
  }

  for (const row of kids) {
    const data = row.data || {};
    const actions = [];

    const details =
      learnerDetailsPatch(row.id, data);
    if (details) {
      actions.push(
        action({
          sourceCollection: 'kids',
          sourceId: row.id,
          collection: 'learnerDetails',
          documentId: row.id,
          expectedData: details,
          identityFields: {
            personId: row.id,
          },
        }),
      );
    }

    const readModel =
      learnerReadModelPatch(row.id, data);
    if (readModel) {
      actions.push(
        action({
          sourceCollection: 'kids',
          sourceId: row.id,
          collection: 'learnerReadModels',
          documentId: row.id,
          expectedData: readModel,
          identityFields: {
            personId: row.id,
          },
        }),
      );
    }

    const provenance =
      learnerProvenancePatch(row.id, data);
    if (provenance) {
      actions.push(
        action({
          sourceCollection: 'kids',
          sourceId: row.id,
          collection: 'learnerProvenance',
          documentId: row.id,
          expectedData: provenance,
          identityFields: {
            personId: row.id,
          },
        }),
      );
    }

    const lifecycle =
      lifecyclePatch(row.id, 'kids', data);
    if (lifecycle) {
      actions.push(
        action({
          sourceCollection: 'kids',
          sourceId: row.id,
          collection: 'personLifecycle',
          documentId: row.id,
          expectedData: lifecycle,
          identityFields: {
            personId: row.id,
          },
        }),
      );
    }

    records.push({
      sourceCollection: 'kids',
      sourceId: row.id,
      actions,
    });
  }

  for (const row of schools) {
    const data = row.data || {};
    const actions = [];

    const profile =
      organisationProfilePatch(row.id, data);
    if (profile) {
      actions.push(
        action({
          sourceCollection: 'schools',
          sourceId: row.id,
          collection: 'organisationProfiles',
          documentId: row.id,
          expectedData: profile,
          identityFields: {
            organisationId: row.id,
          },
        }),
      );
    }

    const assignment =
      organisationAssignmentPatch(row.id, data);
    if (assignment) {
      actions.push(
        action({
          sourceCollection: 'schools',
          sourceId: row.id,
          collection: 'organisationAssignments',
          documentId:
            assignment.organisationAssignmentId,
          expectedData: assignment,
          identityFields: {
            organisationId: row.id,
            personId: assignment.personId,
            role: assignment.role,
          },
        }),
      );
    }

    records.push({
      sourceCollection: 'schools',
      sourceId: row.id,
      actions,
    });
  }

  return records;
}

function normalizedComparable(value) {
  if (Array.isArray(value)) {
    return value.map(normalizedComparable);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (
    typeof value.toMillis === 'function' ||
    typeof value.toDate === 'function'
  ) {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter(
        (key) =>
          value[key] !== undefined &&
          key !== 'createdAt' &&
          key !== 'updatedAt',
      )
      .map((key) => [
        key,
        normalizedComparable(value[key]),
      ]),
  );
}

function valuesEqual(a, b) {
  if (
    a &&
    typeof a === 'object' &&
    typeof a.toMillis === 'function' &&
    b &&
    typeof b === 'object' &&
    typeof b.toMillis === 'function'
  ) {
    return a.toMillis() === b.toMillis();
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(
      normalizedComparable(a),
    ) === JSON.stringify(
      normalizedComparable(b),
    );
  }

  if (
    a &&
    typeof a === 'object' &&
    b &&
    typeof b === 'object'
  ) {
    return subsetMatches(a, b);
  }

  return a === b;
}

export function subsetMatches(actual, expected) {
  if (!actual || typeof actual !== 'object') {
    return false;
  }

  for (const [key, expectedValue] of Object.entries(
    expected || {},
  )) {
    if (key === 'createdAt' || key === 'updatedAt') {
      continue;
    }
    if (!hasOwn(actual, key)) return false;
    if (!valuesEqual(actual[key], expectedValue)) {
      return false;
    }
  }

  return true;
}

export function classifyProfileTarget(
  existingData,
  plannedAction,
) {
  if (!existingData) return 'create';

  for (const [field, expectedValue] of Object.entries(
    plannedAction.identityFields || {},
  )) {
    if (
      hasOwn(existingData, field) &&
      !valuesEqual(
        existingData[field],
        expectedValue,
      )
    ) {
      return 'conflict';
    }
  }

  if (
    plannedAction.ownership === 'migration' &&
    existingData.migration &&
    existingData.migration.migrationId &&
    existingData.migration.migrationId !==
      PROFILE_RETIREMENT_MIGRATION_ID
  ) {
    return 'conflict';
  }

  return subsetMatches(
    existingData,
    plannedAction.expectedData,
  )
    ? 'unchanged'
    : 'update';
}

function kidGuardianIds(data) {
  return [
    ...new Set(
      [
        cleanText(data.primaryParentId),
        cleanText(data.parentId),
        ...stringList(data.parentIds),
      ].filter(Boolean),
    ),
  ];
}

function enrollmentKidIds(data) {
  return [
    ...new Set(
      [
        cleanText(data.kidId),
        cleanText(data.studentId),
        cleanText(data.childId),
        ...stringList(data.kidIds),
      ].filter(Boolean),
    ),
  ];
}

function enrollmentTeacherIds(data) {
  return [
    ...new Set(
      [
        cleanText(data.teacherId),
        cleanText(data.assignedTeacherId),
        cleanText(data.primaryTeacherId),
        cleanText(data.teacherUid),
        cleanText(data.teacher_id),
        ...stringList(data.teacherIds),
      ].filter(Boolean),
    ),
  ];
}

function enrollmentIsUsable(data) {
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

export function verifyDerivedRelationshipCoverage({
  users,
  kids,
  enrollments,
  guardianRelationships,
  peopleIds,
  organisationIds,
  schools,
}) {
  const issues = [];
  const samples = {};

  const add = (code, subject) => {
    issues.push(code);
    samples[code] ||= [];
    if (samples[code].length < 20) {
      samples[code].push(privacyToken(subject));
    }
  };

  const guardianPairs = new Set(
    guardianRelationships.map((row) => {
      const data = row.data || {};
      return [
        cleanText(data.guardianPersonId),
        cleanText(data.learnerPersonId),
      ].join(':');
    }),
  );

  for (const user of users) {
    const legacyChildren =
      stringList(user.data?.childIds);
    for (const kidId of legacyChildren) {
      if (
        !guardianPairs.has(
          `${user.id}:${kidId}`,
        )
      ) {
        add(
          'legacy_child_backlink_missing_canonical_guardian_relationship',
          `users/${user.id}:kids/${kidId}`,
        );
      }
    }
  }

  const enrollmentTeachersByKid = new Map();
  for (const row of enrollments) {
    const data = row.data || {};
    if (!enrollmentIsUsable(data)) continue;
    const teachers =
      enrollmentTeacherIds(data);
    if (!teachers.length) continue;
    for (const kidId of enrollmentKidIds(data)) {
      const set =
        enrollmentTeachersByKid.get(kidId) ||
        new Set();
      teachers.forEach((teacherId) =>
        set.add(teacherId));
      enrollmentTeachersByKid.set(
        kidId,
        set,
      );
    }
  }

  for (const kid of kids) {
    const legacyTeachers = [
      ...new Set(
        [
          cleanText(kid.data?.teacherId),
          ...stringList(kid.data?.teacherIds),
        ].filter(Boolean),
      ),
    ];
    if (!legacyTeachers.length) continue;

    const enrollmentTeachers =
      enrollmentTeachersByKid.get(kid.id) ||
      new Set();

    for (const teacherId of legacyTeachers) {
      if (!enrollmentTeachers.has(teacherId)) {
        add(
          'legacy_kid_teacher_missing_usable_enrollment_assignment',
          `kids/${kid.id}:teacher/${teacherId}`,
        );
      }
    }
  }

  for (const school of schools) {
    const lpId =
      cleanText(school.data?.learningPartnerId);
    if (!lpId) continue;

    if (!peopleIds.has(lpId)) {
      add(
        'school_learning_partner_missing_canonical_person',
        `schools/${school.id}:lp/${lpId}`,
      );
    }
    if (!organisationIds.has(school.id)) {
      add(
        'school_profile_missing_canonical_organisation',
        `schools/${school.id}`,
      );
    }
  }

  const byCode = {};
  for (const code of issues) {
    byCode[code] = (byCode[code] || 0) + 1;
  }

  return {
    issueCount: issues.length,
    byCode: Object.fromEntries(
      Object.entries(byCode)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
    samples: Object.fromEntries(
      Object.entries(samples)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
    safeToRetireDerivedRelationshipFields:
      issues.length === 0,
  };
}

export function buildProfilePlan(params) {
  const records = buildSourceActions(params);

  const coreIssues = [];
  for (const row of params.users) {
    if (!params.peopleIds.has(row.id)) {
      coreIssues.push({
        code: 'user_missing_canonical_person',
        token: privacyToken(`users/${row.id}`),
      });
    }
  }
  for (const row of params.kids) {
    if (!params.peopleIds.has(row.id)) {
      coreIssues.push({
        code: 'kid_missing_canonical_person',
        token: privacyToken(`kids/${row.id}`),
      });
    }
    if (!params.learnerProfileIds.has(row.id)) {
      coreIssues.push({
        code: 'kid_missing_canonical_learner_profile',
        token: privacyToken(`kids/${row.id}`),
      });
    }
  }
  for (const row of params.schools) {
    if (!params.organisationIds.has(row.id)) {
      coreIssues.push({
        code: 'school_missing_canonical_organisation',
        token: privacyToken(`schools/${row.id}`),
      });
    }
  }

  const relationships =
    verifyDerivedRelationshipCoverage(params);

  return {
    records,
    coreIssues,
    relationships,
  };
}

export function summarizeClassifiedRecords(records) {
  const counts = {
    sourceRecords: records.length,
    sourceRecordsWithWrites: 0,
    create: 0,
    update: 0,
    unchanged: 0,
    conflict: 0,
  };
  const byCollection = {};

  for (const record of records) {
    const hasWrite = record.actions.some(
      (item) =>
        item.classification === 'create' ||
        item.classification === 'update',
    );
    if (hasWrite) counts.sourceRecordsWithWrites += 1;

    for (const item of record.actions) {
      counts[item.classification] += 1;
      byCollection[item.collection] ||= {
        create: 0,
        update: 0,
        unchanged: 0,
        conflict: 0,
      };
      byCollection[item.collection][
        item.classification
      ] += 1;
    }
  }

  return {
    ...counts,
    byCollection: Object.fromEntries(
      Object.entries(byCollection)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

export function partitionRecordsByWrites(
  records,
  maxWrites = 100,
) {
  const groups = [];
  let current = [];
  let currentWrites = 0;

  for (const record of records) {
    const writes = record.actions.filter(
      (item) =>
        item.classification === 'create' ||
        item.classification === 'update',
    ).length;

    if (writes > maxWrites) {
      throw new Error(
        'single_source_record_exceeds_write_cap',
      );
    }

    if (
      current.length &&
      currentWrites + writes > maxWrites
    ) {
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
