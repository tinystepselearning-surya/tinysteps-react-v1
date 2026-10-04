import { createHash } from 'node:crypto';

export const LEGACY_RETIREMENT_COLLECTIONS = [
  'users',
  'kids',
  'schools',
  'schoolUsers',
];

export const EXISTING_PROFILE_COLLECTIONS = [
  'parents',
  'teachers',
  'learningPartners',
  'admins',
  'students',
];

export const CANONICAL_IDENTITY_COLLECTIONS = [
  'people',
  'authIdentities',
  'roleAssignments',
  'learnerProfiles',
  'guardianRelationships',
  'organisations',
  'organisationMemberships',
];

export const KNOWN_LEGACY_SUBCOLLECTION_PATHS = {
  users: [
    'progress',
    'gameStats',
  ],
  kids: [
    'progress',
    'curriculum',
    'gameSessions',
    'gameProgress',
  ],
  schools: [
    'academicYears',
    'learningPartnerAssignments',
    'activity',
  ],
  schoolUsers: [],
};

const COMMON_AUDIT_FIELDS = new Set([
  'schemaVersion',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
]);

const USER_IDENTITY_FIELDS = new Set([
  'uid',
  'userId',
  'displayName',
  'name',
  'firstName',
  'lastName',
  'status',
  'countryCode',
  'role',
  'rawRole',
  'roles',
]);

const USER_CONTACT_FIELDS = new Set([
  'email',
  'phone',
  'phoneCountryCode',
  'phoneLocal',
  'whatsappE164',
  'timezone',
  'countryCodeSource',
  'countryCodeUpdatedAt',
]);

const USER_RELATIONSHIP_FIELDS = new Set([
  'childIds',
  'assignedLPs',
  'assignedTeachers',
  'assignedParents',
]);

const USER_COMPATIBILITY_FIELDS = new Set([
  'provider',
  'permissions',
]);

const USER_ROLE_PROFILE_FIELDS = new Set([
  'address',
  'city',
  'state',
  'pincode',
  'communicationLanguage',
  'sessionTime',
  'paymentMethods',
  'preferences',
  'qualification',
  'qualifications',
  'specialization',
  'specializations',
  'yearsExperience',
  'bio',
  'region',
  'languages',
  'languagesSpoken',
]);

const USER_PRIVATE_STAFF_FIELDS = new Set([
  'bankAccount',
  'bankAccountNumber',
  'bankIfscCode',
  'bankAccountHolderName',
  'bankDetails',
  'upiId',
  'emergencyContactName',
  'emergencyContactPhone',
  'creditsBalance',
]);

const USER_LIFECYCLE_FIELDS = new Set([
  'archivedAt',
  'archivedBy',
]);

const KID_IDENTITY_FIELDS = new Set([
  'fullName',
  'name',
  'displayName',
  'studentName',
  'firstName',
  'lastName',
  'status',
  'countryCode',
]);

const KID_ALREADY_CANONICAL_PROFILE_FIELDS = new Set([
  'age',
  'ageYears',
]);

const KID_DETAIL_FIELDS = new Set([
  'grade',
  'gender',
  'school',
  'schoolName',
]);

const KID_LIFECYCLE_FIELDS = new Set([
  'archivedAt',
  'archivedReason',
]);

const KID_READ_MODEL_FIELDS = new Set([
  'summary',
  'progress',
]);

const KID_PROVENANCE_FIELDS = new Set([
  'repairedFromBrokenStudentId',
  'repairedFromEnrollmentId',
  'repairSource',
]);

const KID_GUARDIAN_FIELDS = new Set([
  'parentId',
  'parentIds',
  'primaryParentId',
]);

const KID_ASSIGNMENT_FIELDS = new Set([
  'teacherId',
  'teacherIds',
  'assignedTeacherId',
  'primaryTeacherId',
  'teacherUid',
  'teacher_id',
  'lpId',
  'assignedLPs',
  'courseId',
  'courseIds',
  'enrollmentId',
  'enrollmentIds',
]);

const KID_DERIVED_FIELDS = new Set([
  'summary',
]);

const SCHOOL_IDENTITY_FIELDS = new Set([
  'name',
  'status',
  'countryCode',
  'schoolCode',
]);

const SCHOOL_PROFILE_FIELDS = new Set([
  'nameSearch',
  'contact',
  'location',
  'currentAcademicYearId',
]);

const SCHOOL_ASSIGNMENT_FIELDS = new Set([
  'learningPartnerId',
  'learningPartnerName',
  'learningPartnerEmail',
  'learningPartnerAssignedAt',
]);

const SCHOOL_USER_FIELDS = new Set([
  'userId',
  'role',
  'schoolIds',
  'primarySchoolId',
  'status',
]);

export function privacyToken(value) {
  return createHash('sha256')
    .update(String(value || ''), 'utf8')
    .digest('hex')
    .slice(0, 12);
}

function valueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (
    value &&
    typeof value === 'object' &&
    typeof value.toDate === 'function' &&
    typeof value.seconds === 'number'
  ) {
    return 'timestamp';
  }
  if (value && typeof value === 'object') return 'object';
  return typeof value;
}

export function flattenFieldTypes(data, prefix = '', depth = 0, maxDepth = 4) {
  const rows = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return rows;
  }

  for (const [key, value] of Object.entries(data)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const type = valueType(value);
    rows.push({ path, type });

    if (
      type === 'object' &&
      depth < maxDepth &&
      value &&
      !(
        typeof value.toDate === 'function' &&
        typeof value.seconds === 'number'
      )
    ) {
      rows.push(
        ...flattenFieldTypes(value, path, depth + 1, maxDepth),
      );
    }
  }

  return rows;
}

function rootField(path) {
  return String(path || '').split('.')[0] || '';
}

export function classifyLegacyField(collection, path) {
  const root = rootField(path);

  if (COMMON_AUDIT_FIELDS.has(root)) {
    return {
      category: 'audit_metadata',
      disposition: 'preserve_or_recreate',
      target: 'canonical audit fields',
      blocker: false,
    };
  }

  if (collection === 'users') {
    if (USER_IDENTITY_FIELDS.has(root)) {
      return {
        category: 'canonical_identity',
        disposition: 'already_or_partially_canonical',
        target: 'people/authIdentities/roleAssignments',
        blocker: false,
      };
    }
    if (USER_CONTACT_FIELDS.has(root)) {
      return {
        category: 'contact_profile',
        disposition: 'requires_permanent_target',
        target: 'personContacts (new canonical profile target)',
        blocker: true,
      };
    }
    if (USER_RELATIONSHIP_FIELDS.has(root)) {
      return {
        category: 'operational_relationship',
        disposition: 'derive_or_migrate_before_retirement',
        target: 'explicit domain relationships/enrollments',
        blocker: true,
      };
    }
    if (USER_COMPATIBILITY_FIELDS.has(root)) {
      return {
        category: 'legacy_compatibility',
        disposition: 'drop_after_validation',
        target: 'none',
        blocker: false,
      };
    }
    if (USER_ROLE_PROFILE_FIELDS.has(root)) {
      return {
        category: 'role_profile',
        disposition: 'migrate_to_current_role_profile',
        target: 'parents/teachers/learningPartners/admins by current role',
        blocker: true,
      };
    }
    if (USER_PRIVATE_STAFF_FIELDS.has(root)) {
      return {
        category: 'private_staff_profile',
        disposition: 'migrate_to_restricted_profile',
        target: 'staffPrivateProfiles/{personId}',
        blocker: true,
      };
    }
    if (USER_LIFECYCLE_FIELDS.has(root)) {
      return {
        category: 'person_lifecycle',
        disposition: 'migrate_before_retirement',
        target: 'personLifecycle/{personId}',
        blocker: true,
      };
    }
  }

  if (collection === 'kids') {
    if (KID_IDENTITY_FIELDS.has(root)) {
      return {
        category: 'canonical_identity',
        disposition: 'already_or_partially_canonical',
        target: 'people/learnerProfiles',
        blocker: false,
      };
    }
    if (KID_ALREADY_CANONICAL_PROFILE_FIELDS.has(root)) {
      return {
        category: 'canonical_learner_profile',
        disposition: 'already_canonical_as_ageYears',
        target: 'learnerProfiles/{personId}',
        blocker: false,
      };
    }
    if (KID_DETAIL_FIELDS.has(root)) {
      return {
        category: 'learner_details',
        disposition: 'migrate_before_retirement',
        target: 'learnerDetails/{personId}',
        blocker: true,
      };
    }
    if (KID_LIFECYCLE_FIELDS.has(root)) {
      return {
        category: 'person_lifecycle',
        disposition: 'migrate_before_retirement',
        target: 'personLifecycle/{personId}',
        blocker: true,
      };
    }
    if (KID_READ_MODEL_FIELDS.has(root)) {
      return {
        category: 'derived_read_model',
        disposition: 'migrate_before_retirement',
        target: 'learnerReadModels/{personId}',
        blocker: true,
      };
    }
    if (KID_PROVENANCE_FIELDS.has(root)) {
      return {
        category: 'repair_provenance',
        disposition: 'migrate_before_retirement',
        target: 'learnerProvenance/{personId}',
        blocker: true,
      };
    }
    if (KID_GUARDIAN_FIELDS.has(root)) {
      return {
        category: 'guardian_relationship',
        disposition: 'already_canonical',
        target: 'guardianRelationships',
        blocker: false,
      };
    }
    if (KID_ASSIGNMENT_FIELDS.has(root)) {
      return {
        category: 'operational_relationship',
        disposition: 'derive_or_migrate_before_retirement',
        target: 'enrollments/explicit staff assignment model',
        blocker: true,
      };
    }
    if (KID_DERIVED_FIELDS.has(root)) {
      return {
        category: 'derived_read_model',
        disposition: 'migrate_before_retirement',
        target: 'learnerReadModels/{personId}',
        blocker: true,
      };
    }
  }

  if (collection === 'schools') {
    if (SCHOOL_IDENTITY_FIELDS.has(root)) {
      return {
        category: 'canonical_identity',
        disposition: 'already_or_partially_canonical',
        target: 'organisations',
        blocker: false,
      };
    }
    if (SCHOOL_PROFILE_FIELDS.has(root)) {
      return {
        category: 'organisation_profile',
        disposition: 'requires_permanent_target',
        target: 'organisationProfiles/school profile',
        blocker: true,
      };
    }
    if (SCHOOL_ASSIGNMENT_FIELDS.has(root)) {
      return {
        category: 'organisation_relationship',
        disposition: 'migrate_before_retirement',
        target: 'organisationAssignments/{deterministicId}',
        blocker: true,
      };
    }
  }

  if (collection === 'schoolUsers') {
    if (SCHOOL_USER_FIELDS.has(root)) {
      return {
        category: 'organisation_membership',
        disposition: 'already_or_partially_canonical',
        target: 'organisationMemberships/roleAssignments',
        blocker: false,
      };
    }
  }

  return {
    category: 'unclassified',
    disposition: 'must_map_before_retirement',
    target: null,
    blocker: true,
  };
}

export function aggregateCollectionFieldInventory(rows) {
  const byPath = new Map();

  for (const row of rows) {
    const seenPaths = new Set();
    for (const item of flattenFieldTypes(row.data || {})) {
      let record = byPath.get(item.path);
      if (!record) {
        record = {
          path: item.path,
          documentsPresent: 0,
          typeCounts: {},
        };
        byPath.set(item.path, record);
      }
      if (!seenPaths.has(item.path)) {
        record.documentsPresent += 1;
        seenPaths.add(item.path);
      }
      record.typeCounts[item.type] =
        (record.typeCounts[item.type] || 0) + 1;
    }
  }

  return [...byPath.values()]
    .sort((a, b) => a.path.localeCompare(b.path));
}

function normalizeRole(value) {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  const map = {
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
  return map[key] || null;
}

export function roleMirrorCollectionForUser(data) {
  const role = normalizeRole(data?.role ?? data?.rawRole);
  if (role === 'parent') return 'parents';
  if (role === 'teacher') return 'teachers';
  if (role === 'learningPartner') return 'learningPartners';
  if (role === 'admin') return 'admins';
  return null;
}

export function buildMirrorCoverage(users, mirrorIdSets) {
  const coverage = {
    required: 0,
    present: 0,
    missing: 0,
    notApplicable: 0,
    byCollection: {},
    missingSubjectTokens: [],
  };

  for (const user of users) {
    const collection = roleMirrorCollectionForUser(user.data || {});
    if (!collection) {
      coverage.notApplicable += 1;
      continue;
    }
    coverage.required += 1;
    coverage.byCollection[collection] ||= {
      required: 0,
      present: 0,
      missing: 0,
    };
    coverage.byCollection[collection].required += 1;

    const exists =
      mirrorIdSets?.[collection]?.has(user.id) === true;
    if (exists) {
      coverage.present += 1;
      coverage.byCollection[collection].present += 1;
    } else {
      coverage.missing += 1;
      coverage.byCollection[collection].missing += 1;
      if (coverage.missingSubjectTokens.length < 20) {
        coverage.missingSubjectTokens.push(
          privacyToken(`users/${user.id}`),
        );
      }
    }
  }

  return coverage;
}

export function buildRetirementInventory({
  legacyRowsByCollection,
  profileRowsByCollection,
  canonicalCounts,
}) {
  const collections = {};
  const blockingFields = [];
  const unknownFields = [];

  for (const collection of LEGACY_RETIREMENT_COLLECTIONS) {
    const rows = legacyRowsByCollection[collection] || [];
    const fields = aggregateCollectionFieldInventory(rows)
      .map((field) => {
        const classification =
          classifyLegacyField(collection, field.path);
        const item = {
          ...field,
          ...classification,
        };
        if (item.blocker) blockingFields.push({
          collection,
          path: item.path,
          category: item.category,
          disposition: item.disposition,
          target: item.target,
        });
        if (item.category === 'unclassified') {
          unknownFields.push({
            collection,
            path: item.path,
            documentsPresent: item.documentsPresent,
            typeCounts: item.typeCounts,
          });
        }
        return item;
      });

    collections[collection] = {
      documentCount: rows.length,
      fieldCount: fields.length,
      fields,
      knownLegacySubcollectionNamespaces:
        KNOWN_LEGACY_SUBCOLLECTION_PATHS[collection] || [],
    };
  }

  const mirrorIdSets = Object.fromEntries(
    EXISTING_PROFILE_COLLECTIONS.map((collection) => [
      collection,
      new Set(
        (profileRowsByCollection[collection] || [])
          .map((row) => row.id),
      ),
    ]),
  );

  const mirrorCoverage = buildMirrorCoverage(
    legacyRowsByCollection.users || [],
    mirrorIdSets,
  );

  return {
    collections,
    canonicalCounts,
    profileCounts: Object.fromEntries(
      EXISTING_PROFILE_COLLECTIONS.map((collection) => [
        collection,
        (profileRowsByCollection[collection] || []).length,
      ]),
    ),
    mirrorCoverage,
    blockers: {
      blockingFieldMappings: blockingFields.length,
      unknownFieldMappings: unknownFields.length,
      missingRoleMirrors: mirrorCoverage.missing,
      retirementReady:
        blockingFields.length === 0 &&
        unknownFields.length === 0 &&
        mirrorCoverage.missing === 0,
    },
    unknownFields,
    blockingFields,
  };
}
