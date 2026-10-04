import { createHash } from 'node:crypto';

import type * as admin from 'firebase-admin';

import {
  normalizeRole,
  type CanonicalRole,
} from '../../helpers/roles';
import {
  buildAuthIdentityId,
  buildGuardianRelationshipId,
  buildOrganisationMembershipId,
  buildRoleAssignmentId,
} from './idStrategy';

export const IDENTITY_SHADOW_READ_MODE =
  'shadow_legacy_authoritative' as const;

export type IdentityShadowSourceCollection =
  | 'users'
  | 'kids'
  | 'schools'
  | 'schoolUsers';

export type IdentityShadowStatus =
  | 'match'
  | 'legacy_missing'
  | 'canonical_missing'
  | 'semantic_mismatch'
  | 'canonical_read_error';

export interface IdentityShadowObservation {
  mode: typeof IDENTITY_SHADOW_READ_MODE;
  sourceCollection: IdentityShadowSourceCollection;
  subjectToken: string;
  status: IdentityShadowStatus;
  canonicalDocumentsExpected: number;
  canonicalDocumentsRead: number;
  missingCanonicalKinds: string[];
  mismatchFields: string[];
  canonicalReadErrorKinds: string[];
  legacyReadMs: number;
  canonicalReadMs: number;
}

export interface LegacyAuthoritativeIdentityRead {
  authority: 'legacy';
  sourceCollection: IdentityShadowSourceCollection;
  legacyExists: boolean;
  legacyData: admin.firestore.DocumentData | null;
  shadow: IdentityShadowObservation;
}

type CanonicalExpectation = {
  kind: string;
  ref: admin.firestore.DocumentReference;
  fields: Record<string, unknown>;
};

type CanonicalReadResult = {
  kind: string;
  exists: boolean;
  data: admin.firestore.DocumentData | null;
  error: boolean;
};

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [
    ...new Set(
      values
        .map((value) => cleanText(value))
        .filter(Boolean),
    ),
  ];
}

function subjectToken(
  sourceCollection: IdentityShadowSourceCollection,
  id: string,
): string {
  return createHash('sha256')
    .update(`${sourceCollection}\u001f${id}`, 'utf8')
    .digest('hex')
    .slice(0, 12);
}

function normalizedPersonStatus(value: unknown): string {
  const normalized = cleanText(value).toLowerCase();
  return normalized || 'active';
}

function normalizedMembershipStatus(value: unknown): string {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized || normalized === 'active') return 'active';
  if (
    normalized === 'inactive' ||
    normalized === 'unassigned' ||
    normalized === 'suspended' ||
    normalized === 'archived'
  ) {
    return 'inactive';
  }
  return normalized;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
}

function combinedName(
  data: admin.firestore.DocumentData,
): string {
  return [
    cleanText(data.firstName),
    cleanText(data.lastName),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function userDisplayName(
  data: admin.firestore.DocumentData,
): string {
  return firstText(
    data.displayName,
    data.name,
    combinedName(data),
  );
}

function learnerDisplayName(
  data: admin.firestore.DocumentData,
): string {
  return firstText(
    data.fullName,
    data.name,
    data.displayName,
    data.studentName,
    combinedName(data),
  );
}

function learnerAgeYears(
  data: admin.firestore.DocumentData,
): number | null {
  for (const value of [data.ageYears, data.age]) {
    if (
      Number.isInteger(value) &&
      Number(value) >= 0 &&
      Number(value) <= 120
    ) {
      return Number(value);
    }
  }
  return null;
}

function canonicalRoles(
  data: admin.firestore.DocumentData,
): CanonicalRole[] {
  const raw = [
    data.role,
    ...(Array.isArray(data.roles) ? data.roles : []),
  ];

  return [
    ...new Set(
      raw
        .map((value) => normalizeRole(value))
        .filter((value): value is CanonicalRole =>
          value !== null,
        ),
    ),
  ];
}

function compareFields(
  kind: string,
  actual: admin.firestore.DocumentData,
  expected: Record<string, unknown>,
): string[] {
  const mismatches: string[] = [];

  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[field];
    if (
      JSON.stringify(actualValue ?? null) !==
      JSON.stringify(expectedValue ?? null)
    ) {
      mismatches.push(`${kind}.${field}`);
    }
  }

  return mismatches;
}

async function inspectCanonicalExpectations(
  expectations: CanonicalExpectation[],
): Promise<{
  results: CanonicalReadResult[];
  canonicalReadMs: number;
}> {
  const startedAt = Date.now();

  const results = await Promise.all(
    expectations.map(async (expectation): Promise<CanonicalReadResult> => {
      try {
        const snap = await expectation.ref.get();
        return {
          kind: expectation.kind,
          exists: snap.exists,
          data: snap.exists ? (snap.data() || {}) : null,
          error: false,
        };
      } catch {
        return {
          kind: expectation.kind,
          exists: false,
          data: null,
          error: true,
        };
      }
    }),
  );

  return {
    results,
    canonicalReadMs: Math.max(0, Date.now() - startedAt),
  };
}

async function buildLegacyAuthoritativeResult(params: {
  db: admin.firestore.Firestore;
  sourceCollection: IdentityShadowSourceCollection;
  sourceId: string;
  buildExpectations: (
    legacyData: admin.firestore.DocumentData,
  ) => CanonicalExpectation[];
  minimumExpectationsWhenLegacyMissing?: () => CanonicalExpectation[];
}): Promise<LegacyAuthoritativeIdentityRead> {
  const {
    db,
    sourceCollection,
    sourceId,
    buildExpectations,
    minimumExpectationsWhenLegacyMissing,
  } = params;

  const legacyStartedAt = Date.now();
  const legacySnap = await db
    .collection(sourceCollection)
    .doc(sourceId)
    .get();
  const legacyReadMs = Math.max(
    0,
    Date.now() - legacyStartedAt,
  );
  const legacyData = legacySnap.exists
    ? (legacySnap.data() || {})
    : null;

  const expectations = legacyData
    ? buildExpectations(legacyData)
    : minimumExpectationsWhenLegacyMissing?.() || [];

  const { results, canonicalReadMs } =
    await inspectCanonicalExpectations(expectations);

  const canonicalReadErrorKinds = results
    .filter((result) => result.error)
    .map((result) => result.kind)
    .sort();

  const missingCanonicalKinds = results
    .filter((result) => !result.error && !result.exists)
    .map((result) => result.kind)
    .sort();

  const mismatchFields: string[] = [];
  if (legacyData) {
    for (const expectation of expectations) {
      const result = results.find(
        (candidate) => candidate.kind === expectation.kind,
      );
      if (
        !result ||
        result.error ||
        !result.exists ||
        !result.data
      ) {
        continue;
      }
      mismatchFields.push(
        ...compareFields(
          expectation.kind,
          result.data,
          expectation.fields,
        ),
      );
    }
  }

  let status: IdentityShadowStatus = 'match';
  if (!legacyData) {
    status = 'legacy_missing';
  } else if (canonicalReadErrorKinds.length) {
    status = 'canonical_read_error';
  } else if (missingCanonicalKinds.length) {
    status = 'canonical_missing';
  } else if (mismatchFields.length) {
    status = 'semantic_mismatch';
  }

  return {
    authority: 'legacy',
    sourceCollection,
    legacyExists: Boolean(legacyData),
    legacyData,
    shadow: {
      mode: IDENTITY_SHADOW_READ_MODE,
      sourceCollection,
      subjectToken: subjectToken(sourceCollection, sourceId),
      status,
      canonicalDocumentsExpected: expectations.length,
      canonicalDocumentsRead:
        results.filter((result) => !result.error).length,
      missingCanonicalKinds,
      mismatchFields: [...new Set(mismatchFields)].sort(),
      canonicalReadErrorKinds,
      legacyReadMs,
      canonicalReadMs,
    },
  };
}

export async function readLegacyUserIdentityShadow(params: {
  db: admin.firestore.Firestore;
  uid: string;
}): Promise<LegacyAuthoritativeIdentityRead> {
  const uid = cleanText(params.uid);
  if (!uid) throw new Error('uid is required');

  const legacyAdoptedPersonRef =
    params.db.collection('people').doc(uid);
  const authIdentityRef = params.db
    .collection('authIdentities')
    .doc(buildAuthIdentityId('firebase', uid));

  return buildLegacyAuthoritativeResult({
    db: params.db,
    sourceCollection: 'users',
    sourceId: uid,
    minimumExpectationsWhenLegacyMissing: () => [
      {
        kind: 'person',
        ref: legacyAdoptedPersonRef,
        fields: { personId: uid },
      },
      {
        kind: 'authIdentity',
        ref: authIdentityRef,
        fields: {
          personId: uid,
          provider: 'firebase',
          providerSubject: uid,
        },
      },
    ],
    buildExpectations: (legacy) => {
      const personId =
        cleanText(
          legacy.canonicalPersonId,
        ) || uid;
      const personRef =
        params.db.collection('people')
          .doc(personId);
      const roles = canonicalRoles(legacy);
      const status =
        normalizedPersonStatus(
          legacy.status,
        );
      const countryCode =
        cleanText(legacy.countryCode);

      const expectations:
        CanonicalExpectation[] = [
          {
            kind: 'person',
            ref: personRef,
            fields: {
              personId,
              kind:
                roles.includes('kid')
                  ? 'learner'
                  : 'adult',
              status,
              displayName:
                userDisplayName(legacy),
              ...(countryCode
                ? { countryCode }
                : {}),
            },
          },
          {
            kind: 'authIdentity',
            ref: authIdentityRef,
            fields: {
              personId,
              provider: 'firebase',
              providerSubject: uid,
            },
          },
        ];

      for (const role of roles) {
        if (role === 'schoolAdmin') {
          continue;
        }
        const roleAssignmentId =
          buildRoleAssignmentId({
            personId,
            role,
            scopeType: 'global',
          });
        expectations.push({
          kind:
            `roleAssignment:${role}`,
          ref: params.db
            .collection(
              'roleAssignments',
            )
            .doc(roleAssignmentId),
          fields: {
            roleAssignmentId,
            personId,
            role,
            scopeType: 'global',
            scopeId: null,
            status:
              status === 'active'
                ? 'active'
                : 'inactive',
          },
        });
      }

      return expectations;
    },
  });
}

export async function readLegacyLearnerIdentityShadow(params: {
  db: admin.firestore.Firestore;
  kidId: string;
}): Promise<LegacyAuthoritativeIdentityRead> {
  const kidId = cleanText(params.kidId);
  if (!kidId) throw new Error('kidId is required');

  const personRef = params.db.collection('people').doc(kidId);
  const learnerProfileRef = params.db
    .collection('learnerProfiles')
    .doc(kidId);

  return buildLegacyAuthoritativeResult({
    db: params.db,
    sourceCollection: 'kids',
    sourceId: kidId,
    minimumExpectationsWhenLegacyMissing: () => [
      {
        kind: 'person',
        ref: personRef,
        fields: { personId: kidId },
      },
      {
        kind: 'learnerProfile',
        ref: learnerProfileRef,
        fields: {
          learnerProfileId: kidId,
          personId: kidId,
        },
      },
    ],
    buildExpectations: (legacy) => {
      const status = normalizedPersonStatus(legacy.status);
      const countryCode = cleanText(legacy.countryCode);
      const ageYears = learnerAgeYears(legacy);

      const expectations: CanonicalExpectation[] = [
        {
          kind: 'person',
          ref: personRef,
          fields: {
            personId: kidId,
            kind: 'learner',
            status,
            displayName: learnerDisplayName(legacy),
            ...(countryCode ? { countryCode } : {}),
          },
        },
        {
          kind: 'learnerProfile',
          ref: learnerProfileRef,
          fields: {
            learnerProfileId: kidId,
            personId: kidId,
            status,
            ...(ageYears !== null ? { ageYears } : {}),
            ...(countryCode ? { countryCode } : {}),
          },
        },
      ];

      const primaryParentId = cleanText(
        legacy.primaryParentId,
      );
      const legacyParentId = cleanText(legacy.parentId);
      const parentIds = uniqueStrings(legacy.parentIds);
      const guardians = [
        ...new Set(
          [
            primaryParentId,
            legacyParentId,
            ...parentIds,
          ].filter(Boolean),
        ),
      ];

      for (const guardianPersonId of guardians) {
        const relationshipId = buildGuardianRelationshipId({
          guardianPersonId,
          learnerPersonId: kidId,
          relationshipType: 'parent',
        });
        const isPrimary = primaryParentId
          ? primaryParentId === guardianPersonId
          : legacyParentId
            ? legacyParentId === guardianPersonId
            : parentIds.length === 1 &&
              parentIds[0] === guardianPersonId;

        expectations.push({
          kind: `guardianRelationship:${
            subjectToken('users', guardianPersonId)
          }`,
          ref: params.db
            .collection('guardianRelationships')
            .doc(relationshipId),
          fields: {
            guardianRelationshipId: relationshipId,
            guardianPersonId,
            learnerPersonId: kidId,
            relationshipType: 'parent',
            isPrimary,
            status: status === 'archived'
              ? 'ended'
              : 'active',
          },
        });
      }

      return expectations;
    },
  });
}

export async function readLegacyOrganisationIdentityShadow(params: {
  db: admin.firestore.Firestore;
  schoolId: string;
}): Promise<LegacyAuthoritativeIdentityRead> {
  const schoolId = cleanText(params.schoolId);
  if (!schoolId) throw new Error('schoolId is required');

  const organisationRef = params.db
    .collection('organisations')
    .doc(schoolId);

  return buildLegacyAuthoritativeResult({
    db: params.db,
    sourceCollection: 'schools',
    sourceId: schoolId,
    minimumExpectationsWhenLegacyMissing: () => [
      {
        kind: 'organisation',
        ref: organisationRef,
        fields: { organisationId: schoolId },
      },
    ],
    buildExpectations: (legacy) => {
      const name = cleanText(legacy.name);
      const status =
        cleanText(legacy.status).toLowerCase() || 'active';
      const countryCode = cleanText(legacy.countryCode);
      const schoolCode = cleanText(legacy.schoolCode);

      return [
        {
          kind: 'organisation',
          ref: organisationRef,
          fields: {
            organisationId: schoolId,
            type: 'school',
            name,
            status,
            ...(countryCode ? { countryCode } : {}),
            ...(schoolCode
              ? { legacySchoolCode: schoolCode }
              : {}),
          },
        },
      ];
    },
  });
}

export async function readLegacyOrganisationMembershipShadow(
  params: {
    db: admin.firestore.Firestore;
    schoolUserId: string;
  },
): Promise<LegacyAuthoritativeIdentityRead> {
  const schoolUserId = cleanText(params.schoolUserId);
  if (!schoolUserId) {
    throw new Error('schoolUserId is required');
  }

  return buildLegacyAuthoritativeResult({
    db: params.db,
    sourceCollection: 'schoolUsers',
    sourceId: schoolUserId,
    buildExpectations: (legacy) => {
      const personId =
        cleanText(legacy.userId) || schoolUserId;
      const schoolIds = uniqueStrings(legacy.schoolIds);
      const primarySchoolId = cleanText(
        legacy.primarySchoolId,
      );
      const status = normalizedMembershipStatus(
        legacy.status,
      );
      const expectations: CanonicalExpectation[] = [];

      for (const organisationId of schoolIds) {
        const membershipId =
          buildOrganisationMembershipId({
            organisationId,
            personId,
            role: 'schoolAdmin',
          });
        const roleAssignmentId = buildRoleAssignmentId({
          personId,
          role: 'schoolAdmin',
          scopeType: 'organisation',
          scopeId: organisationId,
        });
        const isPrimary = primarySchoolId
          ? primarySchoolId === organisationId
          : schoolIds.length === 1 &&
            schoolIds[0] === organisationId;

        expectations.push(
          {
            kind: `organisationMembership:${
              subjectToken('schools', organisationId)
            }`,
            ref: params.db
              .collection('organisationMemberships')
              .doc(membershipId),
            fields: {
              organisationMembershipId: membershipId,
              organisationId,
              personId,
              role: 'schoolAdmin',
              status,
              isPrimary,
            },
          },
          {
            kind: `organisationRole:${
              subjectToken('schools', organisationId)
            }`,
            ref: params.db
              .collection('roleAssignments')
              .doc(roleAssignmentId),
            fields: {
              roleAssignmentId,
              personId,
              role: 'schoolAdmin',
              scopeType: 'organisation',
              scopeId: organisationId,
              status,
            },
          },
        );
      }

      return expectations;
    },
  });
}
