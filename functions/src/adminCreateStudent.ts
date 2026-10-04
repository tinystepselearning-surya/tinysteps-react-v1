import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';
import {
  CanonicalPrimaryLearnerWriteError,
  executeCanonicalLearnerCreate,
} from './schoolOS/identity/canonicalPrimaryWriter';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const VALID_STATUS = ['active', 'suspended', 'archived'] as const;
const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

type StudentStatus = (typeof VALID_STATUS)[number];

interface AdminCreateStudentRequest {
  parentId: string;
  fullName: string;
  ageYears: number;
  grade: string;
  status?: StudentStatus;
  countryCode?: string;
}

function normalizeNameForStore(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function normalizeCountryCode(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'countryCode must be a string',
    );
  }
  const normalized = value.trim().toUpperCase();
  if (!normalized) return null;
  if (!COUNTRY_CODE_REGEX.test(normalized)) {
    throw new HttpsError(
      'invalid-argument',
      'countryCode must be a 2-letter uppercase code',
    );
  }
  return normalized;
}

function validateRequest(data: AdminCreateStudentRequest) {
  if (!data || typeof data !== 'object') {
    throw new HttpsError(
      'invalid-argument',
      'Request data is required',
    );
  }

  if (!data.parentId || typeof data.parentId !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'parentId is required',
    );
  }

  if (!data.fullName || typeof data.fullName !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'fullName is required',
    );
  }
  const fullName = normalizeNameForStore(data.fullName);
  if (fullName.length < 2 || fullName.length > 100) {
    throw new HttpsError(
      'invalid-argument',
      'fullName must be between 2 and 100 characters',
    );
  }

  if (
    typeof data.ageYears !== 'number' ||
    !Number.isInteger(data.ageYears) ||
    data.ageYears < 2 ||
    data.ageYears > 15
  ) {
    throw new HttpsError(
      'invalid-argument',
      'ageYears must be an integer between 2 and 15',
    );
  }

  if (
    !data.grade ||
    typeof data.grade !== 'string' ||
    !data.grade.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      'grade is required',
    );
  }

  if (
    data.status != null &&
    !VALID_STATUS.includes(data.status)
  ) {
    throw new HttpsError(
      'invalid-argument',
      `status must be one of: ${VALID_STATUS.join(', ')}`,
    );
  }

  normalizeCountryCode(data.countryCode);
}

function toCallableError(
  error: CanonicalPrimaryLearnerWriteError,
  fullName: string,
): HttpsError {
  switch (error.code) {
    case 'parent_compatibility_missing':
      return new HttpsError(
        'not-found',
        'Selected parent was not found',
      );

    case 'parent_canonical_person_missing':
    case 'parent_canonical_person_ineligible':
    case 'parent_canonical_role_missing':
    case 'parent_canonical_role_ineligible':
      return new HttpsError(
        'failed-precondition',
        'Selected parent does not have an active parent identity',
      );

    case 'duplicate_learner_name':
      return new HttpsError(
        'already-exists',
        `A student named "${fullName}" already exists under this parent. Use a different name or update the existing student.`,
      );

    case 'generated_person_id_collision':
    case 'canonical_target_exists':
    case 'compatibility_target_exists':
      return new HttpsError(
        'aborted',
        'Unable to allocate a new student identity. Please retry.',
      );
  }
}

export const adminCreateStudent = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const payload =
      (request.data || {}) as AdminCreateStudentRequest;
    validateRequest(payload);

    const actorId = request.auth?.uid;
    if (!actorId) {
      throw new HttpsError(
        'unauthenticated',
        'Authentication required',
      );
    }

    const parentId = payload.parentId.trim();
    const fullName =
      normalizeNameForStore(payload.fullName);
    const grade = payload.grade.trim();
    const ageYears = payload.ageYears;
    const status: StudentStatus =
      payload.status || 'active';
    const countryCode =
      normalizeCountryCode(payload.countryCode);

    try {
      const result =
        await executeCanonicalLearnerCreate({
          db: admin.firestore(),
          actorId,
          parentId,
          displayName: fullName,
          ageYears,
          grade,
          status,
          countryCode,
        });

      logger.info(
        'adminCreateStudent: created canonical-primary student',
        {
          studentId: result.personId,
          parentId,
          fullName,
          createdBy: actorId,
          writeId: result.writeId,
          canonicalDocumentsWritten:
            result.canonicalDocumentsWritten,
          compatibilityDocumentsWritten:
            result.compatibilityDocumentsWritten,
          postWriteVerified:
            result.postWriteVerified,
          verificationIssues:
            result.verificationIssues,
        },
      );

      return {
        success: true,
        kidId: result.personId,
        parentId,
        fullName,
        consistencyVerified:
          result.postWriteVerified,
        message:
          `Student "${fullName}" created successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (
        error instanceof
        CanonicalPrimaryLearnerWriteError
      ) {
        throw toCallableError(error, fullName);
      }

      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'adminCreateStudent: canonical-primary create failed',
        {
          parentId,
          fullName,
          createdBy: actorId,
          errorName:
            error instanceof Error
              ? error.name
              : 'UnknownError',
        },
      );

      throw new HttpsError(
        'internal',
        'Unable to create student',
      );
    }
  },
);
