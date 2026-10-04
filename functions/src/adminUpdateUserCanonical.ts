import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import { ensureAdmin } from './helpers/adminGuard';
import {
  buildRoleClaims,
  normalizeRole,
} from './helpers/roles';
import {
  buildIdentityWriteId,
  identityLogToken,
  isGenericAuthUserRole,
} from './schoolOS/identity/authUserActivation';
import {
  resolvePersonIdFromFirebaseUid,
} from './schoolOS/identity/authPersonCompatibility';
import {
  planCanonicalAuthUserUpdate,
  writeCanonicalAuthUserUpdatePlan,
} from './schoolOS/identity/canonicalPrimaryAuthUserUpdate';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;
const MAX_CUSTOM_CLAIMS_BYTES = 1000;
const USER_ID_UNAVAILABLE_MESSAGE =
  'This user ID is already taken or not available. Please try another user ID.';
const PHONE_ALREADY_IN_USE_MESSAGE =
  'This phone number is already in use. Please use a different phone number.';

type UserStatus = 'active' | 'suspended';

interface AdminUpdateUserRequest {
  uid: string;
  displayName: string;
  email: string;
  phone?: string | null;
  role: string;
  status: UserStatus | 'archived';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string | null): string | null {
  if (typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\D/g, '') || null;
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

function validateRequest(
  data: AdminUpdateUserRequest,
) {
  if (!data || typeof data !== 'object') {
    throw new HttpsError(
      'invalid-argument',
      'Request data is required',
    );
  }

  if (
    !data.uid ||
    typeof data.uid !== 'string'
  ) {
    throw new HttpsError(
      'invalid-argument',
      'uid is required',
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

  const role = normalizeRole(data.role);
  if (!isGenericAuthUserRole(role)) {
    throw new HttpsError(
      'failed-precondition',
      'This role is managed through a dedicated learner or school-admin workflow.',
    );
  }

  if (
    data.status !== 'active' &&
    data.status !== 'suspended'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Use the archive workflow to archive a user.',
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
        !normalizePhone(trimmedPhone)
      )
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid phone. Use digits/spaces/+/-/()',
      );
    }
  }

  return role;
}

async function assertUniqueEmailAndPhone(params: {
  db: admin.firestore.Firestore;
  uid: string;
  normalizedEmail: string;
  normalizedPhone: string | null;
}) {
  const {
    db,
    uid,
    normalizedEmail,
    normalizedPhone,
  } = params;

  const usersSnap = await db
    .collection('users')
    .select('email', 'phone')
    .get();

  for (const userDoc of usersSnap.docs) {
    if (userDoc.id === uid) continue;
    const data = userDoc.data() || {};

    const existingEmail =
      typeof data.email === 'string'
        ? normalizeEmail(data.email)
        : '';
    if (
      existingEmail &&
      existingEmail === normalizedEmail
    ) {
      throw new HttpsError(
        'already-exists',
        USER_ID_UNAVAILABLE_MESSAGE,
      );
    }

    if (normalizedPhone) {
      const existingPhone =
        typeof data.phone === 'string'
          ? normalizePhone(data.phone)
          : null;
      if (
        existingPhone &&
        existingPhone ===
          normalizedPhone
      ) {
        throw new HttpsError(
          'already-exists',
          PHONE_ALREADY_IN_USE_MESSAGE,
        );
      }
    }
  }
}

async function assertAuthEmailAvailable(
  uid: string,
  email: string,
) {
  try {
    const authUser =
      await admin.auth()
        .getUserByEmail(email);
    if (authUser.uid !== uid) {
      throw new HttpsError(
        'already-exists',
        USER_ID_UNAVAILABLE_MESSAGE,
      );
    }
  } catch (error: any) {
    if (error instanceof HttpsError) {
      throw error;
    }
    if (
      error?.code ===
      'auth/user-not-found'
    ) {
      return;
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

async function rollbackAuthState(params: {
  uid: string;
  email: string | undefined;
  displayName: string | undefined;
  disabled: boolean;
  claims: Record<string, unknown>;
}) {
  const {
    uid,
    email,
    displayName,
    disabled,
    claims,
  } = params;

  try {
    await admin.auth().updateUser(uid, {
      ...(email ? { email } : {}),
      ...(displayName
        ? { displayName }
        : {}),
      disabled,
    });
    await admin.auth()
      .setCustomUserClaims(uid, claims);
  } catch (error) {
    logger.error(
      'adminUpdateUser: auth rollback failed',
      {
        uidToken:
          identityLogToken('uid', uid),
        errorName:
          error instanceof Error
            ? error.name
            : 'UnknownError',
      },
    );
  }
}

export const adminUpdateUser = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const payload =
      (request.data || {}) as
        AdminUpdateUserRequest;
    const nextRole =
      validateRequest(payload);

    const uid = payload.uid.trim();
    const displayName =
      payload.displayName.trim();
    const email =
      normalizeEmail(payload.email);
    const status = payload.status as UserStatus;
    const phone =
      typeof payload.phone === 'string'
        ? payload.phone.trim()
        : '';
    const phoneKey =
      normalizePhone(phone);
    const db = admin.firestore();
    const actorId =
      request.auth!.uid;

    const userRef =
      db.collection('users').doc(uid);
    const beforeSnap =
      await userRef.get();

    if (!beforeSnap.exists) {
      throw new HttpsError(
        'not-found',
        'User not found',
      );
    }

    const beforeData =
      beforeSnap.data() || {};
    const previousRole =
      normalizeRole(
        beforeData.role ??
        beforeData.rawRole,
      );

    if (
      !isGenericAuthUserRole(
        previousRole,
      )
    ) {
      throw new HttpsError(
        'failed-precondition',
        'This user role is managed through a dedicated workflow.',
      );
    }

    const resolution =
      await resolvePersonIdFromFirebaseUid({
        db,
        firebaseUid: uid,
      });
    const personId =
      resolution.personId;

    await assertUniqueEmailAndPhone({
      db,
      uid,
      normalizedEmail: email,
      normalizedPhone: phoneKey,
    });
    await assertAuthEmailAvailable(
      uid,
      email,
    );

    const authBefore =
      await admin.auth().getUser(uid);
    const priorClaims =
      authBefore.customClaims || {};
    const nextClaims =
      buildRoleClaims(
        priorClaims,
        nextRole,
      );
    validateClaimsSize(nextClaims);

    let authMutated = false;
    let firestoreCommitted = false;
    const writeId =
      buildIdentityWriteId(
        'auth_user_update',
      );

    try {
      await admin.auth().updateUser(uid, {
        email,
        displayName,
        disabled:
          status !== 'active',
      });
      authMutated = true;

      await admin.auth()
        .setCustomUserClaims(
          uid,
          nextClaims,
        );

      const plan =
        planCanonicalAuthUserUpdate({
          personId,
          firebaseUid: uid,
          previousRole,
          nextRole,
          displayName,
          email,
          phone: phone || null,
          status,
          actorId,
          writeId,
        });

      try {
        await writeCanonicalAuthUserUpdatePlan({
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
        const authority =
          personSnap?.data()
            ?.canonicalAuthority;
        firestoreCommitted =
          Boolean(
            personSnap?.exists &&
            authority &&
            typeof authority === 'object' &&
            (authority as any).writeId ===
              writeId,
          );
        throw error;
      }
    } catch (error: any) {
      if (
        authMutated &&
        !firestoreCommitted
      ) {
        await rollbackAuthState({
          uid,
          email: authBefore.email,
          displayName:
            authBefore.displayName ||
            undefined,
          disabled:
            authBefore.disabled,
          claims: priorClaims,
        });
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

      logger.error(
        'adminUpdateUser: canonical update failed',
        {
          uidToken:
            identityLogToken('uid', uid),
          personToken:
            identityLogToken(
              'person',
              personId,
            ),
          firestoreCommitted,
          errorName:
            error instanceof Error
              ? error.name
              : 'UnknownError',
        },
      );

      throw new HttpsError(
        'internal',
        firestoreCommitted
          ? 'User data was updated but verification did not complete. Review the user before retrying.'
          : 'Failed to update user',
      );
    }

    logger.info(
      'adminUpdateUser: canonical user updated',
      {
        uidToken:
          identityLogToken('uid', uid),
        personToken:
          identityLogToken(
            'person',
            personId,
          ),
        previousRole,
        nextRole,
        status,
      },
    );

    return {
      success: true,
      uid,
      personId,
      email,
      displayName,
      role: nextRole,
      rawRole: nextRole,
      status,
      message:
        'User updated successfully',
      timestamp:
        new Date().toISOString(),
    };
  },
);
