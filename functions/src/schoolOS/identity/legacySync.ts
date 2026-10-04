import { createHash } from 'node:crypto';

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { FieldValue } from 'firebase-admin/firestore';

import {
  isCanonicalProjectionTransition,
} from './canonicalPrimaryPlanner';
import {
  planLegacyKidExpansion,
  planLegacySchoolExpansion,
  planLegacySchoolUserExpansion,
  planLegacyUserExpansion,
  type ExpansionConflict,
  type PlannedCanonicalDocument,
} from './legacyPlanner';

export const WAVE1_IDENTITY_MIGRATION_ID =
  'wave1-identity-foundation-v1' as const;

export const WAVE1_IDENTITY_MIGRATION_ACTOR =
  `migration:${WAVE1_IDENTITY_MIGRATION_ID}` as const;

export const WAVE1_IDENTITY_LEGACY_SYNC_EVENT =
  'wave1_identity_legacy_sync' as const;

export const WAVE1_IDENTITY_LEGACY_SYNC_ERROR_EVENT =
  'wave1_identity_legacy_sync_error' as const;

export type LegacyIdentitySourceCollection =
  | 'users'
  | 'kids'
  | 'schools'
  | 'schoolUsers';

type LooseDoc = admin.firestore.DocumentData;

export interface LegacyIdentityAuthUser {
  uid: string;
  disabled: boolean;
  displayName?: string | null;
}

export interface ExpectedCanonicalSyncDocument {
  collection: string;
  documentId: string;
  key: string;
  expectedData: Record<string, unknown>;
}

export interface CanonicalSyncCandidate {
  collection: string;
  documentId: string;
  key: string;
}

export interface LegacyIdentitySyncPlan {
  expectedDocuments: ExpectedCanonicalSyncDocument[];
  staleCandidates: CanonicalSyncCandidate[];
  blockingIssues: string[];
  nonBlockingIssues: string[];
}

export interface LegacyIdentitySyncResult {
  sourceCollection: LegacyIdentitySourceCollection;
  subjectToken: string;
  sourceExists: boolean;
  outcome: 'noop' | 'synced' | 'source_deleted' | 'blocked';
  expectedDocuments: number;
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  blockingIssues: string[];
  nonBlockingIssues: string[];
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
}

function combinedName(data: LooseDoc): string {
  return [
    cleanText(data.firstName),
    cleanText(data.lastName),
  ].filter(Boolean).join(' ').trim();
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((entry) => cleanText(entry))
        .filter(Boolean),
    ),
  ];
}

function sortedStringList(value: unknown): string[] {
  return stringList(value).sort((a, b) => a.localeCompare(b));
}

function normalizeRoleKey(value: unknown): string {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === 'learningpartner' || normalized === 'learning-partner') {
    return 'learningPartner';
  }
  if (normalized === 'schooladmin' || normalized === 'school-admin') {
    return 'schoolAdmin';
  }
  return normalized;
}

function canonicalRoleKeys(data: LooseDoc): string[] {
  return [
    ...new Set(
      [
        data.role,
        ...(Array.isArray(data.roles) ? data.roles : []),
      ]
        .map(normalizeRoleKey)
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

function personStatus(value: unknown): 'active' | 'suspended' | 'archived' {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return 'active';
  if (
    normalized === 'active' ||
    normalized === 'suspended' ||
    normalized === 'archived'
  ) {
    return normalized;
  }
  throw new Error('unsupported_person_status');
}

function organisationStatus(
  value: unknown,
): 'active' | 'paused' | 'archived' {
  const normalized = cleanText(value).toLowerCase();
  if (!normalized) return 'active';
  if (
    normalized === 'active' ||
    normalized === 'paused' ||
    normalized === 'archived'
  ) {
    return normalized;
  }
  throw new Error('unsupported_organisation_status');
}

function membershipStatus(value: unknown): 'active' | 'inactive' {
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
  throw new Error('unsupported_membership_status');
}

function userDisplayName(
  data: LooseDoc,
  authUser: LegacyIdentityAuthUser | null,
): string {
  return firstText(
    data.displayName,
    data.name,
    combinedName(data),
    authUser?.displayName,
  );
}

function learnerDisplayName(data: LooseDoc): string {
  return firstText(
    data.fullName,
    data.name,
    data.displayName,
    data.studentName,
    combinedName(data),
  );
}

function learnerAgeYears(data: LooseDoc): number | null {
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

function directCountryCode(data: LooseDoc): string | null {
  return cleanText(data.countryCode) || null;
}

function guardianIds(data: LooseDoc): string[] {
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

function guardianIsPrimary(
  sourceData: LooseDoc,
  guardianPersonId: string,
): boolean {
  const primary = cleanText(sourceData.primaryParentId);
  if (primary) return primary === guardianPersonId;

  const legacyPrimary = cleanText(sourceData.parentId);
  if (legacyPrimary) return legacyPrimary === guardianPersonId;

  const parentIds = stringList(sourceData.parentIds);
  return (
    parentIds.length === 1 &&
    parentIds[0] === guardianPersonId
  );
}

function sourceFieldVersion(sourceData: LooseDoc): number | null {
  return Number.isInteger(sourceData.schemaVersion)
    ? Number(sourceData.schemaVersion)
    : null;
}

function migrationProvenance(
  sourceCollection: LegacyIdentitySourceCollection,
  sourceId: string,
  sourceData: LooseDoc,
) {
  return {
    migrationId: WAVE1_IDENTITY_MIGRATION_ID,
    sourceCollection,
    sourceId,
    sourceFieldVersion: sourceFieldVersion(sourceData),
  };
}

function withBase(
  expected: Record<string, unknown>,
  sourceCollection: LegacyIdentitySourceCollection,
  sourceId: string,
  sourceData: LooseDoc,
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    createdBy: WAVE1_IDENTITY_MIGRATION_ACTOR,
    updatedBy: WAVE1_IDENTITY_MIGRATION_ACTOR,
    migration: migrationProvenance(
      sourceCollection,
      sourceId,
      sourceData,
    ),
    ...expected,
  };
}

function sourceToken(
  sourceCollection: LegacyIdentitySourceCollection,
  sourceId: string,
): string {
  return createHash('sha256')
    .update(
      [sourceCollection, sourceId].join('\u001f'),
      'utf8',
    )
    .digest('hex')
    .slice(0, 12);
}

function plannerResultFor(
  sourceCollection: LegacyIdentitySourceCollection,
  sourceId: string,
  sourceData: LooseDoc,
  options: { assumeAuthIdentity: boolean },
) {
  switch (sourceCollection) {
    case 'users':
      return planLegacyUserExpansion({
        documentId: sourceId,
        uid: options.assumeAuthIdentity
          ? sourceId
          : cleanText(sourceData.uid) || null,
        userId: cleanText(sourceData.userId) || null,
        role: cleanText(sourceData.role) || null,
        roles: sourceData.roles,
        status: cleanText(sourceData.status) || null,
      });

    case 'kids':
      return planLegacyKidExpansion({
        documentId: sourceId,
        parentId: cleanText(sourceData.parentId) || null,
        parentIds: sourceData.parentIds,
        primaryParentId:
          cleanText(sourceData.primaryParentId) || null,
        status: cleanText(sourceData.status) || null,
      });

    case 'schools':
      return planLegacySchoolExpansion({
        documentId: sourceId,
        status: cleanText(sourceData.status) || null,
      });

    case 'schoolUsers':
      return planLegacySchoolUserExpansion({
        documentId: sourceId,
        userId: cleanText(sourceData.userId) || null,
        role: cleanText(sourceData.role) || null,
        schoolIds: sourceData.schoolIds,
        primarySchoolId:
          cleanText(sourceData.primarySchoolId) || null,
        status: cleanText(sourceData.status) || null,
      });
  }
}

function issueCodes(
  conflicts: ExpansionConflict[],
  blocking: boolean,
): string[] {
  return [
    ...new Set(
      conflicts
        .filter((conflict) =>
          Boolean(conflict.blocksBackfill) === blocking)
        .map((conflict) => conflict.code),
    ),
  ].sort();
}

function buildExpectedData(params: {
  plannedDocument: PlannedCanonicalDocument;
  sourceCollection: LegacyIdentitySourceCollection;
  sourceId: string;
  sourceData: LooseDoc;
  authUser: LegacyIdentityAuthUser | null;
}): Record<string, unknown> {
  const {
    plannedDocument: plan,
    sourceCollection,
    sourceId,
    sourceData,
    authUser,
  } = params;

  switch (plan.kind) {
    case 'person': {
      if (sourceCollection === 'users') {
        const displayName = userDisplayName(
          sourceData,
          authUser,
        );
        if (!displayName) {
          throw new Error('user_display_name_missing');
        }
        const countryCode = directCountryCode(sourceData);
        return withBase({
          personId: plan.personId,
          kind: canonicalRoleKeys(sourceData).includes('kid')
            ? 'learner'
            : 'adult',
          status: personStatus(sourceData.status),
          displayName,
          ...(countryCode ? { countryCode } : {}),
        }, sourceCollection, sourceId, sourceData);
      }

      if (sourceCollection === 'kids') {
        const displayName = learnerDisplayName(sourceData);
        if (!displayName) {
          throw new Error('learner_display_name_missing');
        }
        const countryCode = directCountryCode(sourceData);
        return withBase({
          personId: plan.personId,
          kind: 'learner',
          status: personStatus(sourceData.status),
          displayName,
          ...(countryCode ? { countryCode } : {}),
        }, sourceCollection, sourceId, sourceData);
      }

      throw new Error('unsupported_person_source');
    }

    case 'authIdentity': {
      if (
        sourceCollection !== 'users' ||
        !authUser ||
        authUser.uid !== plan.personId
      ) {
        throw new Error('firebase_auth_identity_mismatch');
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
      const scopedToOrganisation =
        plan.scopeType === 'organisation';
      const status = scopedToOrganisation
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
      const countryCode = directCountryCode(sourceData);
      return withBase({
        learnerProfileId: plan.documentId,
        personId: plan.personId,
        status: personStatus(sourceData.status),
        ...(ageYears !== null ? { ageYears } : {}),
        ...(countryCode ? { countryCode } : {}),
      }, sourceCollection, sourceId, sourceData);
    }

    case 'guardianRelationship':
      return withBase({
        guardianRelationshipId: plan.documentId,
        guardianPersonId: plan.relatedPersonId,
        learnerPersonId: plan.personId,
        relationshipType: 'parent',
        isPrimary: guardianIsPrimary(
          sourceData,
          String(plan.relatedPersonId || ''),
        ),
        status: personStatus(sourceData.status) === 'archived'
          ? 'ended'
          : 'active',
      }, sourceCollection, sourceId, sourceData);

    case 'organisation': {
      const name = firstText(sourceData.name);
      if (!name) throw new Error('school_name_missing');
      const countryCode = directCountryCode(sourceData);
      const legacySchoolCode =
        firstText(sourceData.schoolCode) || null;
      return withBase({
        organisationId:
          plan.organisationId || plan.documentId,
        type: 'school',
        name,
        status: organisationStatus(sourceData.status),
        ...(countryCode ? { countryCode } : {}),
        ...(legacySchoolCode
          ? { legacySchoolCode }
          : {}),
      }, sourceCollection, sourceId, sourceData);
    }

    case 'organisationMembership': {
      const schoolIds = stringList(sourceData.schoolIds);
      const primarySchoolId =
        cleanText(sourceData.primarySchoolId);
      return withBase({
        organisationMembershipId: plan.documentId,
        organisationId: plan.organisationId,
        personId: plan.personId,
        role: plan.role,
        status: membershipStatus(sourceData.status),
        isPrimary: primarySchoolId
          ? primarySchoolId === plan.organisationId
          : schoolIds.length === 1 &&
            schoolIds[0] === plan.organisationId,
      }, sourceCollection, sourceId, sourceData);
    }
  }
}

function candidateFromPlan(
  plan: PlannedCanonicalDocument,
): CanonicalSyncCandidate {
  return {
    collection: plan.collection,
    documentId: plan.documentId,
    key: `${plan.collection}/${plan.documentId}`,
  };
}

function uniqueCandidates(
  candidates: CanonicalSyncCandidate[],
): CanonicalSyncCandidate[] {
  const byKey = new Map<string, CanonicalSyncCandidate>();
  for (const candidate of candidates) {
    byKey.set(candidate.key, candidate);
  }
  return [...byKey.values()].sort((a, b) =>
    a.key.localeCompare(b.key));
}

export function buildLegacyIdentitySyncPlan(params: {
  sourceCollection: LegacyIdentitySourceCollection;
  sourceId: string;
  currentData: LooseDoc | null;
  priorData?: LooseDoc | null;
  authUser?: LegacyIdentityAuthUser | null;
}): LegacyIdentitySyncPlan {
  const {
    sourceCollection,
    sourceId,
    currentData,
    priorData = null,
    authUser = null,
  } = params;

  const blockingIssues = new Set<string>();
  const nonBlockingIssues = new Set<string>();
  const expectedDocuments: ExpectedCanonicalSyncDocument[] = [];

  if (currentData) {
    const result = plannerResultFor(
      sourceCollection,
      sourceId,
      currentData,
      {
        assumeAuthIdentity:
          sourceCollection !== 'users' || Boolean(authUser),
      },
    );

    issueCodes(result.conflicts, true)
      .forEach((code) => blockingIssues.add(code));
    issueCodes(result.conflicts, false)
      .forEach((code) => nonBlockingIssues.add(code));

    if (sourceCollection === 'users' && !authUser) {
      blockingIssues.add(
        'user_missing_auth_directory_identity',
      );
    }

    if (blockingIssues.size === 0) {
      try {
        for (const plan of result.documents) {
          const candidate = candidateFromPlan(plan);
          expectedDocuments.push({
            ...candidate,
            expectedData: buildExpectedData({
              plannedDocument: plan,
              sourceCollection,
              sourceId,
              sourceData: currentData,
              authUser,
            }),
          });
        }
      } catch (error) {
        blockingIssues.add(
          error instanceof Error && error.message
            ? error.message
            : 'canonical_materialization_failed',
        );
      }
    }
  }

  const priorCandidates: CanonicalSyncCandidate[] = [];
  if (priorData) {
    const prior = plannerResultFor(
      sourceCollection,
      sourceId,
      priorData,
      { assumeAuthIdentity: true },
    );
    prior.documents.forEach((plan) => {
      priorCandidates.push(candidateFromPlan(plan));
    });
  }

  const currentKeys = new Set(
    expectedDocuments.map((document) => document.key),
  );
  const staleCandidates = uniqueCandidates(
    priorCandidates.filter(
      (candidate) => !currentKeys.has(candidate.key),
    ),
  );

  return {
    expectedDocuments:
      [...expectedDocuments].sort((a, b) =>
        a.key.localeCompare(b.key)),
    staleCandidates,
    blockingIssues: [...blockingIssues].sort(),
    nonBlockingIssues: [...nonBlockingIssues].sort(),
  };
}

function normalizeForCompare(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForCompare);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const out: Record<string, unknown> = {};
  for (const key of Object.keys(
    value as Record<string, unknown>,
  ).sort()) {
    if (key === 'createdAt' || key === 'updatedAt') {
      continue;
    }
    const item =
      (value as Record<string, unknown>)[key];
    if (item === undefined) continue;
    out[key] = normalizeForCompare(item);
  }
  return out;
}

export function canonicalSyncDocumentMatches(
  existingData: LooseDoc,
  expectedData: Record<string, unknown>,
): boolean {
  return JSON.stringify(normalizeForCompare(existingData)) ===
    JSON.stringify(normalizeForCompare(expectedData));
}

export function hasLegacySyncMigrationOwner(
  existingData: LooseDoc,
  sourceCollection: LegacyIdentitySourceCollection,
  sourceId: string,
): boolean {
  const migration =
    existingData.migration as Record<string, unknown> | undefined;
  return Boolean(
    migration &&
    migration.migrationId === WAVE1_IDENTITY_MIGRATION_ID &&
    migration.sourceCollection === sourceCollection &&
    migration.sourceId === sourceId,
  );
}

function sourceProjection(
  sourceCollection: LegacyIdentitySourceCollection,
  data: LooseDoc | null,
): unknown {
  if (!data) return null;

  switch (sourceCollection) {
    case 'users':
      return {
        uid: cleanText(data.uid),
        userId: cleanText(data.userId),
        displayName: cleanText(data.displayName),
        name: cleanText(data.name),
        firstName: cleanText(data.firstName),
        lastName: cleanText(data.lastName),
        role: normalizeRoleKey(data.role),
        roles: canonicalRoleKeys(data),
        status: cleanText(data.status).toLowerCase(),
        countryCode: cleanText(data.countryCode),
      };

    case 'kids':
      return {
        fullName: cleanText(data.fullName),
        name: cleanText(data.name),
        displayName: cleanText(data.displayName),
        studentName: cleanText(data.studentName),
        firstName: cleanText(data.firstName),
        lastName: cleanText(data.lastName),
        ageYears: Number.isInteger(data.ageYears)
          ? Number(data.ageYears)
          : null,
        age: Number.isInteger(data.age)
          ? Number(data.age)
          : null,
        status: cleanText(data.status).toLowerCase(),
        countryCode: cleanText(data.countryCode),
        parentId: cleanText(data.parentId),
        primaryParentId:
          cleanText(data.primaryParentId),
        parentIds: sortedStringList(data.parentIds),
      };

    case 'schools':
      return {
        name: cleanText(data.name),
        status: cleanText(data.status).toLowerCase(),
        countryCode: cleanText(data.countryCode),
        schoolCode: cleanText(data.schoolCode),
      };

    case 'schoolUsers':
      return {
        userId: cleanText(data.userId),
        role: normalizeRoleKey(data.role),
        schoolIds: sortedStringList(data.schoolIds),
        primarySchoolId:
          cleanText(data.primarySchoolId),
        status: cleanText(data.status).toLowerCase(),
      };
  }
}

export function canonicalProjectionMatchesAuthority(params: {
  sourceId: string;
  afterData: LooseDoc | null;
  personData: LooseDoc | null;
}): boolean {
  const marker =
    params.afterData?._wave1CanonicalProjection;
  const authority =
    params.personData?.canonicalAuthority;

  if (
    !marker ||
    typeof marker !== 'object' ||
    !authority ||
    typeof authority !== 'object'
  ) {
    return false;
  }

  const markerData =
    marker as Record<string, unknown>;
  const authorityData =
    authority as Record<string, unknown>;

  return (
    markerData.schemaVersion === 1 &&
    cleanText(markerData.authority) ===
      'canonical-primary' &&
    cleanText(markerData.command) ===
      'learner_create' &&
    cleanText(markerData.canonicalPersonId) ===
      params.sourceId &&
    Boolean(cleanText(markerData.writeId)) &&
    cleanText(params.personData?.personId) ===
      params.sourceId &&
    authorityData.schemaVersion === 1 &&
    cleanText(authorityData.authority) ===
      'canonical-primary' &&
    cleanText(authorityData.command) ===
      cleanText(markerData.command) &&
    cleanText(authorityData.writeId) ===
      cleanText(markerData.writeId)
  );
}

export function shouldSyncLegacyIdentityWrite(params: {
  sourceCollection: LegacyIdentitySourceCollection;
  beforeData: LooseDoc | null;
  afterData: LooseDoc | null;
}): boolean {
  if (!params.beforeData || !params.afterData) {
    return true;
  }

  return JSON.stringify(
    sourceProjection(
      params.sourceCollection,
      params.beforeData,
    ),
  ) !== JSON.stringify(
    sourceProjection(
      params.sourceCollection,
      params.afterData,
    ),
  );
}

async function authUserFor(
  auth: admin.auth.Auth,
  uid: string,
): Promise<LegacyIdentityAuthUser | null> {
  try {
    const user = await auth.getUser(uid);
    return {
      uid: user.uid,
      disabled: Boolean(user.disabled),
      displayName: cleanText(user.displayName) || null,
    };
  } catch (error) {
    const code = cleanText(
      (error as { code?: unknown } | null)?.code,
    );
    if (code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

async function validateCurrentReferences(params: {
  transaction: admin.firestore.Transaction;
  db: admin.firestore.Firestore;
  sourceCollection: LegacyIdentitySourceCollection;
  sourceId: string;
  currentData: LooseDoc;
}): Promise<string[]> {
  const {
    transaction,
    db,
    sourceCollection,
    sourceId,
    currentData,
  } = params;
  const issues = new Set<string>();

  if (sourceCollection === 'users') {
    const kidSnap = await transaction.get(
      db.collection('kids').doc(sourceId),
    );
    if (kidSnap.exists) {
      issues.add('person_id_collision_user_and_kid');
    }
  }

  if (sourceCollection === 'kids') {
    const userCollision = await transaction.get(
      db.collection('users').doc(sourceId),
    );
    if (userCollision.exists) {
      issues.add('person_id_collision_user_and_kid');
    }

    for (const guardianId of guardianIds(currentData)) {
      const guardian = await transaction.get(
        db.collection('users').doc(guardianId),
      );
      if (!guardian.exists) {
        issues.add(
          'guardian_reference_missing_person_source',
        );
      }
    }
  }

  if (sourceCollection === 'schoolUsers') {
    const personId =
      cleanText(currentData.userId) || sourceId;
    const person = await transaction.get(
      db.collection('users').doc(personId),
    );
    if (!person.exists) {
      issues.add(
        'organisation_membership_missing_person_source',
      );
    }

    for (const schoolId of stringList(
      currentData.schoolIds,
    )) {
      const school = await transaction.get(
        db.collection('schools').doc(schoolId),
      );
      if (!school.exists) {
        issues.add(
          'organisation_membership_missing_school_source',
        );
      }
    }
  }

  return [...issues].sort();
}

function telemetryForResult(
  result: LegacyIdentitySyncResult,
) {
  return {
    event: WAVE1_IDENTITY_LEGACY_SYNC_EVENT,
    sourceCollection: result.sourceCollection,
    subjectToken: result.subjectToken,
    sourceExists: result.sourceExists,
    outcome: result.outcome,
    expectedDocuments: result.expectedDocuments,
    created: result.created,
    updated: result.updated,
    deleted: result.deleted,
    unchanged: result.unchanged,
    blockingIssues: result.blockingIssues,
    nonBlockingIssues: result.nonBlockingIssues,
  };
}

export async function syncLegacyIdentitySource(params: {
  db: admin.firestore.Firestore;
  auth: admin.auth.Auth;
  sourceCollection: LegacyIdentitySourceCollection;
  sourceId: string;
  priorData?: LooseDoc | null;
}): Promise<LegacyIdentitySyncResult> {
  const {
    db,
    auth,
    sourceCollection,
    sourceId,
    priorData = null,
  } = params;

  const result = await db.runTransaction(
    async (transaction): Promise<LegacyIdentitySyncResult> => {
      const sourceRef = db
        .collection(sourceCollection)
        .doc(sourceId);
      const sourceSnap =
        await transaction.get(sourceRef);
      const currentData = sourceSnap.exists
        ? (sourceSnap.data() || {})
        : null;

      const authUser =
        sourceCollection === 'users' && currentData
          ? await authUserFor(auth, sourceId)
          : null;

      const plan = buildLegacyIdentitySyncPlan({
        sourceCollection,
        sourceId,
        currentData,
        priorData,
        authUser,
      });

      const referenceIssues = currentData
        ? await validateCurrentReferences({
            transaction,
            db,
            sourceCollection,
            sourceId,
            currentData,
          })
        : [];

      const blockingIssues = [
        ...new Set([
          ...plan.blockingIssues,
          ...referenceIssues,
        ]),
      ].sort();

      if (blockingIssues.length) {
        return {
          sourceCollection,
          subjectToken:
            sourceToken(sourceCollection, sourceId),
          sourceExists: Boolean(currentData),
          outcome: 'blocked',
          expectedDocuments:
            plan.expectedDocuments.length,
          created: 0,
          updated: 0,
          deleted: 0,
          unchanged: 0,
          blockingIssues,
          nonBlockingIssues:
            plan.nonBlockingIssues,
        };
      }

      const allCandidates = uniqueCandidates([
        ...plan.expectedDocuments.map(
          ({ collection, documentId, key }) => ({
            collection,
            documentId,
            key,
          }),
        ),
        ...plan.staleCandidates,
      ]);

      const snapshots = new Map<
        string,
        admin.firestore.DocumentSnapshot
      >();

      for (const candidate of allCandidates) {
        const snap = await transaction.get(
          db.collection(candidate.collection)
            .doc(candidate.documentId),
        );
        snapshots.set(candidate.key, snap);
      }

      const ownershipConflicts: string[] = [];
      for (const candidate of allCandidates) {
        const snap = snapshots.get(candidate.key);
        if (!snap?.exists) continue;
        const existing = snap.data() || {};
        if (
          !hasLegacySyncMigrationOwner(
            existing,
            sourceCollection,
            sourceId,
          )
        ) {
          ownershipConflicts.push(
            'canonical_target_owned_elsewhere',
          );
        }
      }

      if (ownershipConflicts.length) {
        return {
          sourceCollection,
          subjectToken:
            sourceToken(sourceCollection, sourceId),
          sourceExists: Boolean(currentData),
          outcome: 'blocked',
          expectedDocuments:
            plan.expectedDocuments.length,
          created: 0,
          updated: 0,
          deleted: 0,
          unchanged: 0,
          blockingIssues: [
            ...new Set(ownershipConflicts),
          ],
          nonBlockingIssues:
            plan.nonBlockingIssues,
        };
      }

      const now = FieldValue.serverTimestamp();
      let created = 0;
      let updated = 0;
      let deleted = 0;
      let unchanged = 0;

      for (const expected of plan.expectedDocuments) {
        const ref = db
          .collection(expected.collection)
          .doc(expected.documentId);
        const snap = snapshots.get(expected.key);

        if (!snap?.exists) {
          transaction.set(ref, {
            ...expected.expectedData,
            createdAt: now,
            updatedAt: now,
          });
          created += 1;
          continue;
        }

        const existing = snap.data() || {};
        const timestampComplete =
          Boolean(existing.createdAt) &&
          Boolean(existing.updatedAt);
        if (
          timestampComplete &&
          canonicalSyncDocumentMatches(
            existing,
            expected.expectedData,
          )
        ) {
          unchanged += 1;
          continue;
        }

        transaction.set(ref, {
          ...expected.expectedData,
          createdAt: existing.createdAt || now,
          updatedAt: now,
        });
        updated += 1;
      }

      for (const stale of plan.staleCandidates) {
        const snap = snapshots.get(stale.key);
        if (!snap?.exists) continue;
        transaction.delete(
          db.collection(stale.collection)
            .doc(stale.documentId),
        );
        deleted += 1;
      }

      const writeCount = created + updated + deleted;
      return {
        sourceCollection,
        subjectToken:
          sourceToken(sourceCollection, sourceId),
        sourceExists: Boolean(currentData),
        outcome: currentData
          ? writeCount > 0
            ? 'synced'
            : 'noop'
          : 'source_deleted',
        expectedDocuments:
          plan.expectedDocuments.length,
        created,
        updated,
        deleted,
        unchanged,
        blockingIssues: [],
        nonBlockingIssues:
          plan.nonBlockingIssues,
      };
    },
  );

  logger.info(
    WAVE1_IDENTITY_LEGACY_SYNC_EVENT,
    telemetryForResult(result),
  );

  return result;
}

export async function handleLegacyIdentityWrite(params: {
  sourceCollection: LegacyIdentitySourceCollection;
  sourceId: string;
  beforeData: LooseDoc | null;
  afterData: LooseDoc | null;
}): Promise<void> {
  const {
    sourceCollection,
    sourceId,
    beforeData,
    afterData,
  } = params;

  const canonicalProjectionTransition =
    sourceCollection === 'kids' &&
    isCanonicalProjectionTransition({
      beforeData,
      afterData,
    });

  if (
    !canonicalProjectionTransition &&
    !shouldSyncLegacyIdentityWrite({
      sourceCollection,
      beforeData,
      afterData,
    })
  ) {
    return;
  }

  try {
    const db = admin.firestore();

    if (canonicalProjectionTransition) {
      const personSnap = await db
        .collection('people')
        .doc(sourceId)
        .get();

      if (
        canonicalProjectionMatchesAuthority({
          sourceId,
          afterData,
          personData: personSnap.exists
            ? personSnap.data() || {}
            : null,
        })
      ) {
        return;
      }

      if (
        !shouldSyncLegacyIdentityWrite({
          sourceCollection,
          beforeData,
          afterData,
        })
      ) {
        return;
      }
    }

    await syncLegacyIdentitySource({
      db,
      auth: admin.auth(),
      sourceCollection,
      sourceId,
      priorData: beforeData,
    });
  } catch (error) {
    logger.error(
      WAVE1_IDENTITY_LEGACY_SYNC_ERROR_EVENT,
      {
        event:
          WAVE1_IDENTITY_LEGACY_SYNC_ERROR_EVENT,
        sourceCollection,
        subjectToken:
          sourceToken(sourceCollection, sourceId),
        errorName:
          error instanceof Error
            ? error.name || 'Error'
            : 'UnknownError',
      },
    );
    throw error;
  }
}
