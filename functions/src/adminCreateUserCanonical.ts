import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

import { ensureCanonicalAdmin } from './helpers/canonicalAdminGuard';
import {
  buildRoleClaims,
  normalizeRole,
} from './helpers/roles';
import {
  GENERIC_AUTH_USER_ROLES,
  buildIdentityWriteId,
  identityLogToken,
  isGenericAuthUserRole,
} from './schoolOS/identity/authUserActivation';
import {
  planCanonicalAuthUserCreate,
  writeCanonicalAuthUserCreatePlan,
  type CanonicalAuthUserCreateRole,
} from './schoolOS/identity/canonicalPrimaryAuthUserCreate';
import {
  refreshAuthAccessReadModelBestEffort,
} from './schoolOS/identity/authAccessReadModelMaintenance';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;
const USER_ID_UNAVAILABLE_MESSAGE =
  'This user ID is already taken or not available. Please try another user ID.';
const PHONE_ALREADY_IN_USE_MESSAGE =
  'This phone number is already in use. Please use a different phone number.';
const MAX_CUSTOM_CLAIMS_BYTES = 1000;
const DEFAULT_STATUS = 'active' as const;

type UserStatus = 'active' | 'suspended';

interface AdminCreateUserRequest {
  email: string;
  displayName: string;
  password?: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneLocal?: string;
  role: string;
  qualification?: string;
  specialization?: string[];
  yearsExperience?: number;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  communicationLanguage?: string;
  sessionTime?: string;
  paymentMethods?: string[];
  region?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
  status?: UserStatus;
}

interface AdminCreateUserResponse {
  success: true;
  uid: string;
  personId: string;
  email: string;
  displayName: string;
  role: CanonicalAuthUserCreateRole;
  rawRole: CanonicalAuthUserCreateRole;
  resetLinkSent: boolean;
  resetLink?: string | null;
  emailVerificationLink?: string | null;
  message: string;
  timestamp: string;
  nextSteps: string[];
}

interface AdminCreateUserErrorResponse {
  success: false;
  code: string;
  error: string;
}

function normalizeEmailForUniqueness(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhoneForUniqueness(phone?: string | null): string | null {
  if (typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  return digits || null;
}

function normalizeCountryCode(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.trim().replace(/\D/g, '');
  return digits ? `+${digits}` : null;
}

function normalizePhoneLocal(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.trim().replace(/\D/g, '');
  return digits || null;
}

async function assertFirestoreUniqueness(params: {
  db: admin.firestore.Firestore;
  email: string;
  phone?: string | null;
}) {
  const { db, email, phone } = params;

  const existingEmailSnap = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  if (!existingEmailSnap.empty) {
    throw new HttpsError('already-exists', USER_ID_UNAVAILABLE_MESSAGE);
  }

  const phoneKey = normalizePhoneForUniqueness(phone);
  if (!phoneKey) return;

  const usersSnap = await db
    .collection('users')
    .select('phone')
    .get();

  for (const userDoc of usersSnap.docs) {
    const existingPhone = userDoc.data()?.phone;
    const existingPhoneKey = normalizePhoneForUniqueness(
      typeof existingPhone === 'string'
        ? existingPhone
        : null,
    );
    if (
      existingPhoneKey &&
      existingPhoneKey === phoneKey
    ) {
      throw new HttpsError(
        'already-exists',
        PHONE_ALREADY_IN_USE_MESSAGE,
      );
    }
  }
}

function validateClaimsSize(
  claims: Record<string, unknown>,
) {
  const bytes = Buffer.byteLength(
    JSON.stringify(claims),
    'utf8',
  );
  if (bytes > MAX_CUSTOM_CLAIMS_BYTES) {
    throw new HttpsError(
      'invalid-argument',
      `Custom claims too large (${bytes} bytes). Max ${MAX_CUSTOM_CLAIMS_BYTES}.`,
    );
  }
}

function validateInput(
  data: AdminCreateUserRequest,
): CanonicalAuthUserCreateRole {
  if (!data || typeof data !== 'object') {
    throw new HttpsError(
      'invalid-argument',
      'Request data is required',
    );
  }

  if (
    !data.email ||
    typeof data.email !== 'string' ||
    !EMAIL_REGEX.test(
      data.email.trim().toLowerCase(),
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Valid email is required',
    );
  }

  if (
    !data.displayName ||
    typeof data.displayName !== 'string'
  ) {
    throw new HttpsError(
      'invalid-argument',
      'displayName is required',
    );
  }

  const displayName = data.displayName.trim();
  if (
    displayName.length < 2 ||
    displayName.length > 100
  ) {
    throw new HttpsError(
      'invalid-argument',
      'displayName must be 2–100 chars',
    );
  }

  const role = normalizeRole(data.role);
  if (!isGenericAuthUserRole(role)) {
    throw new HttpsError(
      'failed-precondition',
      `Generic User Management supports only: ${GENERIC_AUTH_USER_ROLES.join(', ')}. Use the dedicated learner or school-admin flow for other roles.`,
    );
  }

  if (
    data.status &&
    data.status !== 'active' &&
    data.status !== 'suspended'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'New users can be active or suspended. Archive an existing user through the archive workflow.',
    );
  }

  if (data.phone != null) {
    if (typeof data.phone !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'Invalid phone. Use digits/spaces/+/-/()',
      );
    }
    const trimmedPhone = data.phone.trim();
    if (
      trimmedPhone &&
      (
        !PHONE_REGEX.test(trimmedPhone) ||
        !normalizePhoneForUniqueness(
          trimmedPhone,
        )
      )
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid phone. Use digits/spaces/+/-/()',
      );
    }
  }

  const countryCode =
    normalizeCountryCode(
      data.phoneCountryCode || null,
    );
  const phoneLocal =
    normalizePhoneLocal(
      data.phoneLocal || null,
    );

  if (
    (countryCode && !phoneLocal) ||
    (!countryCode && phoneLocal)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Provide both phoneCountryCode and phoneLocal',
    );
  }

  if (
    countryCode &&
    !/^\+\d{1,4}$/.test(countryCode)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Invalid phoneCountryCode',
    );
  }

  if (
    phoneLocal &&
    !/^\d{6,15}$/.test(phoneLocal)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Invalid phoneLocal',
    );
  }

  if (
    data.password &&
    data.password.length < 6
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Password must be at least 6 chars',
    );
  }

  if (
    data.pincode &&
    !/^\d{6}$/.test(data.pincode)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'pincode must be 6 digits',
    );
  }

  if (data.yearsExperience != null) {
    if (
      typeof data.yearsExperience !== 'number' ||
      data.yearsExperience < 0 ||
      data.yearsExperience > 100
    ) {
      throw new HttpsError(
        'invalid-argument',
        'yearsExperience must be 0–100',
      );
    }
  }

  if (
    data.specialization &&
    (
      !Array.isArray(data.specialization) ||
      data.specialization.length > 20
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'specialization must be an array (max 20)',
    );
  }

  if (
    data.qualification &&
    data.qualification.length > 500
  ) {
    throw new HttpsError(
      'invalid-argument',
      'qualification must be <= 500 chars',
    );
  }

  if (
    data.bankAccountNumber &&
    !/^\d{9,18}$/.test(
      data.bankAccountNumber,
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Invalid bankAccountNumber format',
    );
  }

  if (
    data.bankIfscCode &&
    !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
      data.bankIfscCode,
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Invalid IFSC code format',
    );
  }

  return role;
}

export const adminCreateUser = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (
    request,
  ): Promise<
    AdminCreateUserResponse |
    AdminCreateUserErrorResponse
  > => {
    const timestamp = new Date().toISOString();
    let createdUid: string | null = null;
    let firestoreCommitted = false;

    try {
      await ensureCanonicalAdmin(request.auth);

      const data =
        (request.data || {}) as
          AdminCreateUserRequest;
      const role = validateInput(data);

      const email =
        normalizeEmailForUniqueness(
          data.email,
        );
      const displayName =
        data.displayName.trim();
      const phoneCountryCode =
        normalizeCountryCode(
          data.phoneCountryCode || null,
        ) || '';
      const phoneLocal =
        normalizePhoneLocal(
          data.phoneLocal || null,
        ) || '';
      const phoneFromParts =
        phoneCountryCode && phoneLocal
          ? `${phoneCountryCode}${phoneLocal}`
          : '';
      const phone =
        phoneFromParts ||
        (
          typeof data.phone === 'string'
            ? data.phone.trim()
            : ''
        );
      const status: UserStatus =
        data.status || DEFAULT_STATUS;
      const db = admin.firestore();
      const actorId = request.auth!.uid;

      logger.info(
        'adminCreateUser: canonical request',
        {
          actorToken:
            identityLogToken(
              'actor',
              actorId,
            ),
          emailToken:
            identityLogToken(
              'email',
              email,
            ),
          role,
          status,
        },
      );

      await assertFirestoreUniqueness({
        db,
        email,
        phone,
      });

      try {
        await admin.auth()
          .getUserByEmail(email);
        throw new HttpsError(
          'already-exists',
          USER_ID_UNAVAILABLE_MESSAGE,
        );
      } catch (error: any) {
        if (
          error?.code !==
          'auth/user-not-found'
        ) {
          if (error instanceof HttpsError) {
            throw error;
          }
          if (
            error?.code ===
            'auth/email-already-exists'
          ) {
            throw new HttpsError(
              'already-exists',
              USER_ID_UNAVAILABLE_MESSAGE,
            );
          }
          throw new HttpsError(
            'internal',
            'Failed checking existing user',
          );
        }
      }

      const personId =
        db.collection('people').doc().id;

      const createRequest:
        admin.auth.CreateRequest = {
          email,
          displayName,
          emailVerified: false,
          disabled: status !== 'active',
        };
      if (data.password) {
        createRequest.password =
          data.password;
      }

      const authUser =
        await admin.auth()
          .createUser(createRequest);
      createdUid = authUser.uid;

      const claims =
        buildRoleClaims({}, role);
      validateClaimsSize(claims);
      try {
        await admin.auth()
          .setCustomUserClaims(
            authUser.uid,
            claims,
          );
      } catch {
        try {
          await admin.auth()
            .deleteUser(authUser.uid);
          createdUid = null;
        } catch (rollbackError) {
          logger.error(
            'adminCreateUser: auth rollback failed after claims error',
            {
              uidToken:
                identityLogToken(
                  'uid',
                  authUser.uid,
                ),
              errorName:
                rollbackError instanceof Error
                  ? rollbackError.name
                  : 'UnknownError',
            },
          );
        }
        throw new HttpsError(
          'internal',
          'Failed to initialize user authorization',
        );
      }

      const writeId =
        buildIdentityWriteId(
          'auth_user_create',
        );
      const plan =
        planCanonicalAuthUserCreate({
          personId,
          firebaseUid: authUser.uid,
          role,
          displayName,
          email,
          phone: phone || null,
          phoneCountryCode:
            phoneCountryCode || null,
          phoneLocal:
            phoneLocal || null,
          status,
          actorId,
          writeId,
          qualification:
            data.qualification || null,
          specialization:
            data.specialization || [],
          yearsExperience:
            data.yearsExperience ?? null,
          bio: data.bio || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          pincode: data.pincode || null,
          communicationLanguage:
            data.communicationLanguage ||
            null,
          sessionTime:
            data.sessionTime || null,
          paymentMethods:
            data.paymentMethods || [],
          region: data.region || null,
          bankAccountNumber:
            data.bankAccountNumber ||
            null,
          bankIfscCode:
            data.bankIfscCode || null,
          bankAccountHolderName:
            data.bankAccountHolderName ||
            null,
        });

      try {
        await writeCanonicalAuthUserCreatePlan({
          db,
          plan,
        });
        firestoreCommitted = true;
      } catch (error) {
        const personSnap =
          await db.collection('people')
            .doc(personId)
            .get()
            .catch(() => null);
        firestoreCommitted =
          Boolean(personSnap?.exists);
        throw error;
      }

      await refreshAuthAccessReadModelBestEffort({
        db,
        firebaseUid: authUser.uid,
        context: 'adminCreateUser',
      });

      let resetLinkSent = false;
      let resetLink: string | null = null;
      if (!data.password) {
        try {
          resetLink =
            await admin.auth()
              .generatePasswordResetLink(
                email,
              );
          resetLinkSent = true;
        } catch (error) {
          logger.warn(
            'adminCreateUser: failed to generate reset link',
            {
              uidToken:
                identityLogToken(
                  'uid',
                  authUser.uid,
                ),
              errorName:
                error instanceof Error
                  ? error.name
                  : 'UnknownError',
            },
          );
        }
      }

      let emailVerificationLink:
        string | null = null;
      try {
        emailVerificationLink =
          await admin.auth()
            .generateEmailVerificationLink(
              email,
            );
      } catch (error) {
        logger.warn(
          'adminCreateUser: failed to generate verification link',
          {
            uidToken:
              identityLogToken(
                'uid',
                authUser.uid,
              ),
            errorName:
              error instanceof Error
                ? error.name
                : 'UnknownError',
          },
        );
      }

      logger.info(
        'adminCreateUser: canonical user created',
        {
          uidToken:
            identityLogToken(
              'uid',
              authUser.uid,
            ),
          personToken:
            identityLogToken(
              'person',
              personId,
            ),
          role,
          status,
        },
      );

      const nextSteps = data.password
        ? [
            'Share the login credentials with the user securely.',
            'User can sign in immediately.',
            'Ask user to verify email (optional).',
            'If claims are not seen immediately, the user must re-login or refresh the token.',
          ]
        : [
            'Share the password reset link securely (or email it via your own system).',
            'User sets a password via the reset link, then signs in.',
            'If claims are not seen immediately, the user must re-login or refresh the token.',
          ];

      return {
        success: true,
        uid: authUser.uid,
        personId,
        email,
        displayName,
        role,
        rawRole: role,
        resetLinkSent,
        resetLink,
        emailVerificationLink,
        message:
          `User "${displayName}" created as ${role}`,
        timestamp,
        nextSteps,
      };
    } catch (error: any) {
      if (
        createdUid &&
        !firestoreCommitted
      ) {
        try {
          await admin.auth()
            .deleteUser(createdUid);
        } catch (rollbackError) {
          logger.error(
            'adminCreateUser: final auth rollback failed',
            {
              uidToken:
                identityLogToken(
                  'uid',
                  createdUid,
                ),
              errorName:
                rollbackError instanceof Error
                  ? rollbackError.name
                  : 'UnknownError',
            },
          );
        }
      }

      if (error instanceof HttpsError) {
        return {
          success: false,
          code: error.code,
          error: error.message,
        };
      }

      logger.error(
        'adminCreateUser: canonical create failed',
        {
          uidToken:
            identityLogToken(
              'uid',
              createdUid,
            ),
          firestoreCommitted,
          errorName:
            error instanceof Error
              ? error.name
              : 'UnknownError',
        },
      );

      return {
        success: false,
        code: 'internal',
        error:
          firestoreCommitted
            ? 'User identity was created but verification did not complete. Please review the user before retrying.'
            : 'An unexpected error occurred',
      };
    }
  },
);
