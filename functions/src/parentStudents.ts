import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import { ensureAdmin } from './helpers/adminGuard';
import {
  CanonicalPrimaryLearnerWriteError,
  canonicalIdentityTelemetryToken,
  executeCanonicalLearnerCreate,
} from './schoolOS/identity/canonicalPrimaryWriter';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const VALID_GENDERS = [
  'male',
  'female',
  'other',
  'prefer-not-to-say',
] as const;
const VALID_STATUSES = [
  'active',
  'inactive',
  'trial',
] as const;

const MAX_STUDENT_AGE_YEARS = 25;
const MIN_STUDENT_AGE_YEARS = 3;

type LegacyStudentStatus =
  (typeof VALID_STATUSES)[number];

interface CreateStudentRequest {
  parentId: string;
  fullName: string;
  preferredName?: string;
  grade?: string;
  board?: string;
  ageYears?: number | string;
  dob?: string;
  gender?:
    | 'male'
    | 'female'
    | 'other'
    | 'prefer-not-to-say';
  status?: LegacyStudentStatus;
  courses?: string[];
  notes?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  profilePhotoUrl?: string;
}

interface CreateStudentResponse {
  success: true;
  parentId: string;
  studentId: string;
  consistencyVerified: boolean;
  message: string;
  timestamp: string;
}

interface CreateStudentErrorResponse {
  success: false;
  error: string;
  code: string;
}

function normalizeNameForStore(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim().replace(/\s+/g, ' ');
  return text || undefined;
}

function validateDobFormatIfProvided(dob: string): void {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dob)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'dob must be in ISO format YYYY-MM-DD (e.g., 2015-03-25)',
    );
  }

  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'dob must be a valid date',
    );
  }

  if (date > new Date()) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'dob cannot be in the future',
    );
  }
}

function computeAgeYearsFromDob(dob: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birth = new Date(year, month - 1, day);

  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const birthdayReached =
    now.getMonth() > birth.getMonth() ||
    (
      now.getMonth() === birth.getMonth() &&
      now.getDate() >= birth.getDate()
    );

  if (!birthdayReached) age -= 1;
  return age >= 0 && age <= 60 ? age : null;
}

function parseAndValidateAgeYears(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ageYears must be a number',
    );
  }

  if (!Number.isInteger(parsed)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ageYears must be a whole number',
    );
  }

  if (parsed < MIN_STUDENT_AGE_YEARS) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Student must be at least ${MIN_STUDENT_AGE_YEARS} years old`,
    );
  }

  if (parsed > MAX_STUDENT_AGE_YEARS) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Student must be younger than ${MAX_STUDENT_AGE_YEARS} years`,
    );
  }

  return parsed;
}

function validateCreateStudentInput(
  data: CreateStudentRequest,
): number {
  if (!data || typeof data !== 'object') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Request data is required',
    );
  }

  if (
    !data.parentId ||
    typeof data.parentId !== 'string'
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'parentId is required and must be a string',
    );
  }

  if (
    !data.fullName ||
    typeof data.fullName !== 'string'
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'fullName is required',
    );
  }

  const fullName = normalizeNameForStore(data.fullName);
  if (fullName.length < 2 || fullName.length > 100) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'fullName must be between 2 and 100 characters',
    );
  }

  if (
    data.preferredName &&
    data.preferredName.length > 50
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'preferredName must be at most 50 characters',
    );
  }

  if (data.grade && data.grade.length > 50) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'grade must be at most 50 characters',
    );
  }

  if (data.board && data.board.length > 50) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'board must be at most 50 characters',
    );
  }

  let ageInput = data.ageYears;
  const hasAge =
    ageInput !== undefined &&
    ageInput !== null &&
    String(ageInput).trim() !== '';

  if (!hasAge) {
    if (!data.dob) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ageYears is required (or provide dob for legacy clients)',
      );
    }

    validateDobFormatIfProvided(data.dob);
    const computed = computeAgeYearsFromDob(data.dob);
    if (computed == null) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Unable to compute ageYears from dob',
      );
    }
    ageInput = computed;
  }

  const ageYears = parseAndValidateAgeYears(ageInput);

  if (
    data.gender &&
    !VALID_GENDERS.includes(data.gender)
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `gender must be one of: ${VALID_GENDERS.join(', ')}`,
    );
  }

  if (
    data.status &&
    !VALID_STATUSES.includes(data.status)
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `status must be one of: ${VALID_STATUSES.join(', ')}`,
    );
  }

  if (
    data.status &&
    data.status !== 'active'
  ) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'This legacy learner status does not yet have an approved canonical mapping. Create the learner as active and manage trial/enrollment state through the admission workflow.',
    );
  }

  if (data.notes && data.notes.length > 2000) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'notes must be at most 2000 characters',
    );
  }

  if (
    data.emergencyContact &&
    data.emergencyContact.length > 200
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'emergencyContact must be at most 200 characters',
    );
  }

  if (
    data.medicalNotes &&
    data.medicalNotes.length > 1000
  ) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'medicalNotes must be at most 1000 characters',
    );
  }

  if (data.courses) {
    if (!Array.isArray(data.courses)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'courses must be an array',
      );
    }

    if (data.courses.length > 20) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Maximum 20 courses allowed',
      );
    }

    for (const course of data.courses) {
      if (
        typeof course !== 'string' ||
        course.trim().length === 0
      ) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Each course must be a non-empty string',
        );
      }

      if (course.length > 100) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Course name must be at most 100 characters',
        );
      }
    }
  }

  return ageYears;
}

function toCallableError(
  error: CanonicalPrimaryLearnerWriteError,
  fullName: string,
): functions.https.HttpsError {
  switch (error.code) {
    case 'parent_compatibility_missing':
    case 'parent_profile_compatibility_missing':
      return new functions.https.HttpsError(
        'not-found',
        'Parent account not found',
      );

    case 'parent_canonical_person_missing':
    case 'parent_canonical_person_ineligible':
    case 'parent_canonical_role_missing':
    case 'parent_canonical_role_ineligible':
    case 'parent_profile_compatibility_inactive':
      return new functions.https.HttpsError(
        'failed-precondition',
        'Cannot add students to this parent account',
      );

    case 'duplicate_learner_name':
    case 'duplicate_nested_learner_name':
      return new functions.https.HttpsError(
        'already-exists',
        `An active student named "${fullName}" already exists under this parent. Use a different name or update the existing student.`,
      );

    case 'generated_person_id_collision':
    case 'canonical_target_exists':
    case 'compatibility_target_exists':
      return new functions.https.HttpsError(
        'aborted',
        'Unable to allocate a new student identity. Please retry.',
      );
  }
}

async function createStudentForParentHandlerImpl(
  request: any,
): Promise<
  CreateStudentResponse |
  CreateStudentErrorResponse
> {
  const now = new Date().toISOString();

  try {
    const rawData =
      request?.data as CreateStudentRequest | undefined;
    const auth = request?.auth as
      | {
          uid: string;
          token?: admin.auth.DecodedIdToken;
        }
      | undefined;

    await ensureAdmin(auth);

    if (!rawData) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Request data is required',
      );
    }

    const ageYears =
      validateCreateStudentInput(rawData);

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required',
      );
    }

    const parentId = rawData.parentId.trim();
    const fullName =
      normalizeNameForStore(rawData.fullName);
    const grade = optionalText(rawData.grade);
    const preferredName =
      optionalText(rawData.preferredName);
    const board = optionalText(rawData.board);
    const profilePhotoUrl =
      optionalText(rawData.profilePhotoUrl);
    const notes = optionalText(rawData.notes);
    const emergencyContact =
      optionalText(rawData.emergencyContact);
    const medicalNotes =
      optionalText(rawData.medicalNotes);

    const result =
      await executeCanonicalLearnerCreate({
        db: admin.firestore(),
        actorId: auth.uid,
        parentId,
        displayName: fullName,
        ageYears,
        grade,
        status: 'active',
        details: {
          preferredName,
          grade,
          board,
          gender: rawData.gender || null,
          profilePhotoUrl,
        },
        privateProfile: {
          notes,
          emergencyContact,
          medicalNotes,
        },
        nestedParentStudentCompatibility: {
          enabled: true,
          courses: rawData.courses || [],
          createdByRole: 'admin',
        },
      });

    logger.info(
      'createStudentForParent: canonical-primary student created',
      {
        studentToken:
          canonicalIdentityTelemetryToken(
            'learner',
            result.personId,
          ),
        parentToken:
          canonicalIdentityTelemetryToken(
            'parent',
            parentId,
          ),
        actorToken:
          canonicalIdentityTelemetryToken(
            'actor',
            auth.uid,
          ),
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
      parentId,
      studentId: result.personId,
      consistencyVerified:
        result.postWriteVerified,
      message:
        `Student "${fullName}" created successfully under parent ${parentId}`,
      timestamp: now,
    };
  } catch (error) {
    if (
      error instanceof
      CanonicalPrimaryLearnerWriteError
    ) {
      const callable = toCallableError(
        error,
        normalizeNameForStore(
          String(request?.data?.fullName || 'student'),
        ),
      );

      return {
        success: false,
        error: callable.message,
        code: callable.code,
      };
    }

    if (
      error instanceof
      functions.https.HttpsError
    ) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    logger.error(
      'createStudentForParent: canonical-primary create failed',
      {
        actorToken:
          request?.auth?.uid
            ? canonicalIdentityTelemetryToken(
                'actor',
                request.auth.uid,
              )
            : null,
        errorName:
          error instanceof Error
            ? error.name
            : 'UnknownError',
      },
    );

    return {
      success: false,
      error:
        'An unexpected error occurred. Please try again.',
      code: 'internal',
    };
  }
}

export const createStudentForParent =
  functions.https.onCall(
    {
      region: 'asia-south1',
      memory: '256MiB',
      timeoutSeconds: 60,
      maxInstances: 10,
    },
    createStudentForParentHandlerImpl,
  );
