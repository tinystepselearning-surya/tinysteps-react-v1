import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { FieldValue } from 'firebase-admin/firestore';

import {
  planCanonicalLearnerCreate,
  type CanonicalLearnerCreatePlan,
} from './canonicalPrimaryPlanner';
import { buildRoleAssignmentId } from './idStrategy';

type LooseDoc = admin.firestore.DocumentData;

export const CANONICAL_PRIMARY_LEARNER_WRITE_EVENT =
  'wave1_canonical_primary_learner_write' as const;

export const DEFAULT_LEARNER_SUMMARY = {
  phonicsMastery: 0,
  grammarMastery: 0,
  speakingMastery: 0,
  attendanceRate30d: 0,
  creditsRemaining: 0,
} as const;

export type CanonicalPrimaryLearnerWriteErrorCode =
  | 'parent_compatibility_missing'
  | 'parent_canonical_person_missing'
  | 'parent_canonical_person_ineligible'
  | 'parent_canonical_role_missing'
  | 'parent_canonical_role_ineligible'
  | 'duplicate_learner_name'
  | 'generated_person_id_collision'
  | 'canonical_target_exists'
  | 'compatibility_target_exists';

export class CanonicalPrimaryLearnerWriteError
  extends Error {
  readonly code: CanonicalPrimaryLearnerWriteErrorCode;

  constructor(
    code: CanonicalPrimaryLearnerWriteErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CanonicalPrimaryLearnerWriteError';
    this.code = code;
  }
}

export interface ExecuteCanonicalLearnerCreateInput {
  db: admin.firestore.Firestore;
  actorId: string;
  parentId: string;
  displayName: string;
  ageYears: number;
  grade: string;
  status: 'active' | 'suspended' | 'archived';
  countryCode?: string | null;
}

export interface ExecuteCanonicalLearnerCreateResult {
  personId: string;
  writeId: string;
  canonicalDocumentsWritten: number;
  compatibilityDocumentsWritten: number;
  postWriteVerified: boolean;
  verificationIssues: string[];
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNameForCompare(value: unknown): string {
  return cleanText(value)
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function learnerNameFromCompatibility(
  data: LooseDoc,
): string {
  return (
    cleanText(data.fullName) ||
    cleanText(data.name) ||
    cleanText(data.displayName) ||
    cleanText(data.studentName)
  );
}

export function canonicalParentEligibilityIssue(params: {
  personData: LooseDoc | null;
  roleData: LooseDoc | null;
  parentId: string;
}): CanonicalPrimaryLearnerWriteErrorCode | null {
  const { personData, roleData, parentId } = params;

  if (!personData) {
    return 'parent_canonical_person_missing';
  }

  if (
    cleanText(personData.personId) !== parentId ||
    cleanText(personData.kind) !== 'adult' ||
    cleanText(personData.status) !== 'active'
  ) {
    return 'parent_canonical_person_ineligible';
  }

  if (!roleData) {
    return 'parent_canonical_role_missing';
  }

  if (
    cleanText(roleData.personId) !== parentId ||
    cleanText(roleData.role) !== 'parent' ||
    cleanText(roleData.scopeType) !== 'global' ||
    cleanText(roleData.status) !== 'active' ||
    (roleData.scopeId !== null &&
      roleData.scopeId !== undefined &&
      cleanText(roleData.scopeId) !== '')
  ) {
    return 'parent_canonical_role_ineligible';
  }

  return null;
}

function normalizedComparable(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizedComparable);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(
    value as Record<string, unknown>,
  ).sort()) {
    result[key] = normalizedComparable(
      (value as Record<string, unknown>)[key],
    );
  }
  return result;
}

export function expectedFieldsMatch(
  actual: LooseDoc | null,
  expected: Record<string, unknown>,
): boolean {
  if (!actual) return false;

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (
      JSON.stringify(normalizedComparable(actualValue)) !==
      JSON.stringify(normalizedComparable(expectedValue))
    ) {
      return false;
    }
  }

  return true;
}

function canonicalWriteData(
  data: Record<string, unknown>,
  now: admin.firestore.FieldValue,
): Record<string, unknown> {
  return {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
}

function compatibilityWriteData(params: {
  data: Record<string, unknown>;
  actorId: string;
  now: admin.firestore.FieldValue;
}): Record<string, unknown> {
  return {
    ...params.data,
    createdAt: params.now,
    updatedAt: params.now,
    createdBy: params.actorId,
    updatedBy: params.actorId,
  };
}

async function verifyCanonicalLearnerWrite(params: {
  db: admin.firestore.Firestore;
  plan: CanonicalLearnerCreatePlan;
  actorId: string;
  parentId: string;
}): Promise<string[]> {
  const {
    db,
    plan,
    actorId,
    parentId,
  } = params;

  const issues: string[] = [];

  for (const document of plan.canonicalDocuments) {
    const snapshot = await db
      .collection(document.collection)
      .doc(document.documentId)
      .get();
    const actual = snapshot.exists
      ? snapshot.data() || {}
      : null;

    if (
      !expectedFieldsMatch(actual, {
        ...document.data,
        createdBy: actorId,
        updatedBy: actorId,
      })
    ) {
      issues.push(
        `canonical_mismatch:${document.collection}/${document.documentId}`,
      );
    }
  }

  for (const document of plan.compatibilityDocuments) {
    const snapshot = await db
      .collection(document.collection)
      .doc(document.documentId)
      .get();
    const actual = snapshot.exists
      ? snapshot.data() || {}
      : null;

    if (
      !expectedFieldsMatch(actual, {
        ...document.data,
        createdBy: actorId,
        updatedBy: actorId,
      })
    ) {
      issues.push(
        `compatibility_mismatch:${document.collection}/${document.documentId}`,
      );
    }
  }

  const parentSnapshot = await db
    .collection('users')
    .doc(parentId)
    .get();
  const childIds = parentSnapshot.exists &&
    Array.isArray(parentSnapshot.data()?.childIds)
    ? parentSnapshot.data()?.childIds
    : [];

  if (!childIds.includes(plan.personId)) {
    issues.push('compatibility_mismatch:users.childIds');
  }

  return issues;
}

export async function executeCanonicalLearnerCreate(
  input: ExecuteCanonicalLearnerCreateInput,
): Promise<ExecuteCanonicalLearnerCreateResult> {
  const {
    db,
    actorId,
    parentId,
    displayName,
    ageYears,
    grade,
    status,
    countryCode = null,
  } = input;

  const personId = db.collection('people').doc().id;
  const writeId = `learner_create:${personId}`;

  const plan = planCanonicalLearnerCreate({
    personId,
    parentId,
    displayName,
    ageYears,
    grade,
    status,
    countryCode,
    summary: { ...DEFAULT_LEARNER_SUMMARY },
    actorId,
    writeId,
  });

  const parentRoleAssignmentId = buildRoleAssignmentId({
    personId: parentId,
    role: 'parent',
    scopeType: 'global',
  });

  await db.runTransaction(async (transaction) => {
    const parentCompatibilityRef = db
      .collection('users')
      .doc(parentId);
    const parentPersonRef = db
      .collection('people')
      .doc(parentId);
    const parentRoleRef = db
      .collection('roleAssignments')
      .doc(parentRoleAssignmentId);
    const userCollisionRef = db
      .collection('users')
      .doc(personId);

    const parentCompatibility =
      await transaction.get(parentCompatibilityRef);
    if (!parentCompatibility.exists) {
      throw new CanonicalPrimaryLearnerWriteError(
        'parent_compatibility_missing',
        'Selected parent compatibility record was not found',
      );
    }

    const parentPerson =
      await transaction.get(parentPersonRef);
    const parentRole =
      await transaction.get(parentRoleRef);

    const parentIssue = canonicalParentEligibilityIssue({
      personData: parentPerson.exists
        ? parentPerson.data() || {}
        : null,
      roleData: parentRole.exists
        ? parentRole.data() || {}
        : null,
      parentId,
    });

    if (parentIssue) {
      throw new CanonicalPrimaryLearnerWriteError(
        parentIssue,
        'Selected parent does not have an active canonical parent identity',
      );
    }

    const duplicateQuery = db
      .collection('kids')
      .where('parentIds', 'array-contains', parentId)
      .select(
        'fullName',
        'name',
        'displayName',
        'studentName',
      );
    const existingKids =
      await transaction.get(duplicateQuery);
    const normalizedRequestedName =
      normalizeNameForCompare(displayName);

    const duplicate = existingKids.docs.some(
      (snapshot) =>
        normalizeNameForCompare(
          learnerNameFromCompatibility(
            snapshot.data() || {},
          ),
        ) === normalizedRequestedName,
    );

    if (duplicate) {
      throw new CanonicalPrimaryLearnerWriteError(
        'duplicate_learner_name',
        'A learner with this name already exists under the selected parent',
      );
    }

    const userCollision =
      await transaction.get(userCollisionRef);
    if (userCollision.exists) {
      throw new CanonicalPrimaryLearnerWriteError(
        'generated_person_id_collision',
        'Generated learner Person ID collides with an auth-backed user ID',
      );
    }

    const canonicalSnapshots = new Map<
      string,
      admin.firestore.DocumentSnapshot
    >();
    for (const document of plan.canonicalDocuments) {
      const key =
        `${document.collection}/${document.documentId}`;
      const snapshot = await transaction.get(
        db.collection(document.collection)
          .doc(document.documentId),
      );
      canonicalSnapshots.set(key, snapshot);
    }

    const compatibilitySnapshots = new Map<
      string,
      admin.firestore.DocumentSnapshot
    >();
    for (const document of plan.compatibilityDocuments) {
      const key =
        `${document.collection}/${document.documentId}`;
      const snapshot = await transaction.get(
        db.collection(document.collection)
          .doc(document.documentId),
      );
      compatibilitySnapshots.set(key, snapshot);
    }

    for (const [key, snapshot] of canonicalSnapshots) {
      if (snapshot.exists) {
        throw new CanonicalPrimaryLearnerWriteError(
          'canonical_target_exists',
          `Canonical learner target already exists: ${key}`,
        );
      }
    }

    for (const [key, snapshot] of compatibilitySnapshots) {
      if (snapshot.exists) {
        throw new CanonicalPrimaryLearnerWriteError(
          'compatibility_target_exists',
          `Compatibility learner target already exists: ${key}`,
        );
      }
    }

    const now = FieldValue.serverTimestamp();

    for (const document of plan.canonicalDocuments) {
      transaction.create(
        db.collection(document.collection)
          .doc(document.documentId),
        canonicalWriteData(document.data, now),
      );
    }

    for (const document of plan.compatibilityDocuments) {
      transaction.create(
        db.collection(document.collection)
          .doc(document.documentId),
        compatibilityWriteData({
          data: document.data,
          actorId,
          now,
        }),
      );
    }

    for (const union of plan.compatibilityArrayUnions) {
      transaction.set(
        db.collection(union.collection)
          .doc(union.documentId),
        {
          [union.field]:
            FieldValue.arrayUnion(union.value),
          updatedAt: now,
          updatedBy: actorId,
        },
        { merge: true },
      );
    }
  });

  const verificationIssues =
    await verifyCanonicalLearnerWrite({
      db,
      plan,
      actorId,
      parentId,
    });

  const result: ExecuteCanonicalLearnerCreateResult = {
    personId,
    writeId,
    canonicalDocumentsWritten:
      plan.canonicalDocuments.length,
    compatibilityDocumentsWritten:
      plan.compatibilityDocuments.length,
    postWriteVerified:
      verificationIssues.length === 0,
    verificationIssues,
  };

  const telemetry = {
    event: CANONICAL_PRIMARY_LEARNER_WRITE_EVENT,
    personId,
    parentId,
    actorId,
    writeId,
    canonicalDocumentsWritten:
      result.canonicalDocumentsWritten,
    compatibilityDocumentsWritten:
      result.compatibilityDocumentsWritten,
    postWriteVerified:
      result.postWriteVerified,
    verificationIssues:
      result.verificationIssues,
  };

  if (result.postWriteVerified) {
    logger.info(
      CANONICAL_PRIMARY_LEARNER_WRITE_EVENT,
      telemetry,
    );
  } else {
    logger.error(
      CANONICAL_PRIMARY_LEARNER_WRITE_EVENT,
      telemetry,
    );
  }

  return result;
}
