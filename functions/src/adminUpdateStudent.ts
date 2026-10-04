import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import { ensureAdmin } from './helpers/adminGuard';
import {
  CanonicalPrimaryLearnerUpdateError,
  executeCanonicalLearnerUpdate,
  normalizeCanonicalLearnerUpdateFields,
} from './schoolOS/identity/canonicalPrimaryLearnerUpdate';
import {
  canonicalIdentityTelemetryToken,
} from './schoolOS/identity/canonicalPrimaryWriter';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';

interface AdminUpdateStudentRequest {
  kidId: string;
  fullName: string;
  ageYears: number;
  grade: string;
  status?: 'active' | 'suspended' | 'archived' | null;
  countryCode?: string | null;
}

function toCallableError(
  error: CanonicalPrimaryLearnerUpdateError,
): HttpsError {
  switch (error.code) {
    case 'learner_canonical_person_missing':
    case 'learner_profile_missing':
    case 'learner_compatibility_missing':
      return new HttpsError(
        'not-found',
        'Student identity was not found',
      );

    case 'archive_requires_lifecycle_workflow':
      return new HttpsError(
        'failed-precondition',
        'Archive this student through the archive workflow.',
      );

    case 'archived_reactivation_unsupported':
      return new HttpsError(
        'failed-precondition',
        'Archived students cannot be reactivated from profile editing.',
      );

    case 'learner_canonical_person_ineligible':
    case 'learner_profile_ineligible':
      return new HttpsError(
        'failed-precondition',
        'Student identity is not eligible for canonical profile updates.',
      );
  }
}

export const adminUpdateStudent = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const actorId = request.auth?.uid;
    if (!actorId) {
      throw new HttpsError(
        'unauthenticated',
        'Authentication required',
      );
    }

    const data =
      (request.data || {}) as AdminUpdateStudentRequest;
    const kidId =
      typeof data.kidId === 'string'
        ? data.kidId.trim()
        : '';
    if (!kidId) {
      throw new HttpsError(
        'invalid-argument',
        'kidId is required',
      );
    }

    let fields;
    try {
      fields = normalizeCanonicalLearnerUpdateFields({
        displayName: data.fullName,
        ageYears: data.ageYears,
        grade: data.grade,
        status: data.status ?? null,
        countryCode: data.countryCode ?? null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'invalid learner update';
      throw new HttpsError(
        'invalid-argument',
        message,
      );
    }

    try {
      const result =
        await executeCanonicalLearnerUpdate({
          db: admin.firestore(),
          actorId,
          personId: kidId,
          ...fields,
        });

      logger.info(
        'adminUpdateStudent: updated canonical-primary student',
        {
          studentToken: canonicalIdentityTelemetryToken(
            'learner',
            result.personId,
          ),
          actorToken: canonicalIdentityTelemetryToken(
            'actor',
            actorId,
          ),
          writeToken: canonicalIdentityTelemetryToken(
            'write',
            result.writeId,
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
        kidId: result.personId,
        consistencyVerified:
          result.postWriteVerified,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (
        error instanceof
        CanonicalPrimaryLearnerUpdateError
      ) {
        throw toCallableError(error);
      }

      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'adminUpdateStudent: canonical-primary update failed',
        {
          studentToken: canonicalIdentityTelemetryToken(
            'learner',
            kidId,
          ),
          actorToken: canonicalIdentityTelemetryToken(
            'actor',
            actorId,
          ),
          errorName:
            error instanceof Error
              ? error.name
              : 'UnknownError',
        },
      );

      throw new HttpsError(
        'internal',
        'Unable to update student',
      );
    }
  },
);
