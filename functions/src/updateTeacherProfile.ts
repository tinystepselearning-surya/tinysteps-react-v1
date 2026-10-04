import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import { ensureAdmin } from './helpers/adminGuard';
import { normalizeRole } from './helpers/roles';
import {
  buildIdentityWriteId,
  identityLogToken,
} from './schoolOS/identity/authUserActivation';
import {
  resolvePersonIdFromFirebaseUid,
} from './schoolOS/identity/authPersonCompatibility';
import {
  planCanonicalTeacherProfileUpdate,
  writeCanonicalTeacherProfileUpdatePlan,
} from './schoolOS/identity/canonicalPrimaryTeacherProfile';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface UpdateTeacherProfileRequest {
  teacherUid?: string;
  phone?: string | null;
  qualifications?: string | null;
  specializations?: string[];
  yearsExperience?: number | null;
  languages?: string[];
  city?: string | null;
  timezone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bio?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolderName?: string | null;
  bankIfscCode?: string | null;
  upiId?: string | null;
  sessionNotifications?: boolean;
  emailAlerts?: boolean;
  paymentSchedule?: 'weekly' | 'biweekly' | 'monthly';
}

function optionalText(
  value: unknown,
  maxLength: number,
  field: string,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      `${field} must be a string`,
    );
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new HttpsError(
      'invalid-argument',
      `${field} is too long`,
    );
  }
  return normalized || null;
}

function stringList(
  value: unknown,
  field: string,
): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new HttpsError(
      'invalid-argument',
      `${field} must be an array`,
    );
  }
  const values = [
    ...new Set(
      value.map((entry) => {
        if (typeof entry !== 'string') {
          throw new HttpsError(
            'invalid-argument',
            `${field} must contain strings`,
          );
        }
        return entry.trim();
      }).filter(Boolean),
    ),
  ];
  if (values.length > 30) {
    throw new HttpsError(
      'invalid-argument',
      `${field} has too many values`,
    );
  }
  return values;
}

export const updateTeacherProfile = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError(
        'unauthenticated',
        'Authentication required',
      );
    }

    const data =
      (request.data || {}) as
        UpdateTeacherProfileRequest;
    const teacherUid =
      typeof data.teacherUid === 'string'
        ? data.teacherUid.trim()
        : request.auth.uid;

    if (!teacherUid) {
      throw new HttpsError(
        'invalid-argument',
        'teacherUid is required',
      );
    }

    const db = admin.firestore();

    if (
      request.auth.uid !== teacherUid
    ) {
      await ensureAdmin(request.auth);
    } else {
      const userSnap =
        await db.collection('users')
          .doc(teacherUid)
          .get();
      if (!userSnap.exists) {
        throw new HttpsError(
          'not-found',
          'Teacher account not found',
        );
      }
      const userData =
        userSnap.data() || {};
      if (
        normalizeRole(userData.role) !==
          'teacher' ||
        String(
          userData.status || 'active',
        )
          .trim()
          .toLowerCase() !== 'active'
      ) {
        throw new HttpsError(
          'permission-denied',
          'An active teacher account is required',
        );
      }
    }

    const yearsExperience =
      data.yearsExperience;
    if (
      yearsExperience !== null &&
      yearsExperience !== undefined &&
      (
        typeof yearsExperience !== 'number' ||
        !Number.isFinite(
          yearsExperience,
        ) ||
        yearsExperience < 0 ||
        yearsExperience > 100
      )
    ) {
      throw new HttpsError(
        'invalid-argument',
        'yearsExperience must be between 0 and 100',
      );
    }

    const paymentSchedule =
      data.paymentSchedule;
    if (
      paymentSchedule !== undefined &&
      paymentSchedule !== 'weekly' &&
      paymentSchedule !== 'biweekly' &&
      paymentSchedule !== 'monthly'
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid paymentSchedule',
      );
    }

    const resolution =
      await resolvePersonIdFromFirebaseUid({
        db,
        firebaseUid: teacherUid,
      });
    const personId =
      resolution.personId;
    const actorId =
      request.auth.uid;
    const writeId =
      buildIdentityWriteId(
        'teacher_profile_update',
      );

    const plan =
      planCanonicalTeacherProfileUpdate({
        personId,
        firebaseUid: teacherUid,
        actorId,
        writeId,
        phone:
          optionalText(
            data.phone,
            40,
            'phone',
          ),
        qualifications:
          optionalText(
            data.qualifications,
            500,
            'qualifications',
          ),
        specializations:
          stringList(
            data.specializations,
            'specializations',
          ),
        yearsExperience:
          yearsExperience === null ||
          yearsExperience === undefined
            ? null
            : Math.floor(
                yearsExperience,
              ),
        languages:
          stringList(
            data.languages,
            'languages',
          ),
        city:
          optionalText(
            data.city,
            120,
            'city',
          ),
        timezone:
          optionalText(
            data.timezone,
            100,
            'timezone',
          ),
        emergencyContactName:
          optionalText(
            data.emergencyContactName,
            150,
            'emergencyContactName',
          ),
        emergencyContactPhone:
          optionalText(
            data.emergencyContactPhone,
            40,
            'emergencyContactPhone',
          ),
        bio:
          optionalText(
            data.bio,
            2000,
            'bio',
          ),
        bankAccountNumber:
          optionalText(
            data.bankAccountNumber,
            30,
            'bankAccountNumber',
          ),
        bankAccountHolderName:
          optionalText(
            data.bankAccountHolderName,
            150,
            'bankAccountHolderName',
          ),
        bankIfscCode:
          optionalText(
            data.bankIfscCode,
            20,
            'bankIfscCode',
          ),
        upiId:
          optionalText(
            data.upiId,
            120,
            'upiId',
          ),
        sessionNotifications:
          data.sessionNotifications,
        emailAlerts:
          data.emailAlerts,
        paymentSchedule,
      });

    try {
      const result =
        await writeCanonicalTeacherProfileUpdatePlan({
          db,
          plan,
        });

      logger.info(
        'updateTeacherProfile: canonical profile updated',
        {
          actorToken:
            identityLogToken(
              'actor',
              actorId,
            ),
          uidToken:
            identityLogToken(
              'uid',
              teacherUid,
            ),
          personToken:
            identityLogToken(
              'person',
              personId,
            ),
        },
      );

      return {
        success: true,
        uid: teacherUid,
        personId,
        verifiedDocuments:
          result.verifiedDocuments,
      };
    } catch (error) {
      logger.error(
        'updateTeacherProfile: canonical profile update failed',
        {
          actorToken:
            identityLogToken(
              'actor',
              actorId,
            ),
          uidToken:
            identityLogToken(
              'uid',
              teacherUid,
            ),
          personToken:
            identityLogToken(
              'person',
              personId,
            ),
          errorName:
            error instanceof Error
              ? error.name
              : 'UnknownError',
        },
      );
      throw new HttpsError(
        'internal',
        'Could not update teacher profile',
      );
    }
  },
);
