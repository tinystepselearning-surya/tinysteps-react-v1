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
  normalizeCanonicalUserStatus,
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

const MAX_CUSTOM_CLAIMS_BYTES = 1000;

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

export const adminSetUserRole = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const uid =
      typeof request.data?.uid === 'string'
        ? request.data.uid.trim()
        : '';
    const nextRole =
      normalizeRole(request.data?.role);

    if (!uid) {
      throw new HttpsError(
        'invalid-argument',
        'uid is required',
      );
    }

    if (!isGenericAuthUserRole(nextRole)) {
      throw new HttpsError(
        'failed-precondition',
        'This role is managed through a dedicated learner or school-admin workflow.',
      );
    }

    const db = admin.firestore();
    const userSnap =
      await db.collection('users')
        .doc(uid)
        .get();

    if (!userSnap.exists) {
      throw new HttpsError(
        'not-found',
        'User not found',
      );
    }

    const before =
      userSnap.data() || {};
    const previousRole =
      normalizeRole(
        before.role ??
        before.rawRole,
      );

    if (
      !isGenericAuthUserRole(
        previousRole,
      )
    ) {
      throw new HttpsError(
        'failed-precondition',
        'This current role is managed through a dedicated workflow.',
      );
    }

    const status =
      normalizeCanonicalUserStatus(
        before.status,
      );
    if (status === 'archived') {
      throw new HttpsError(
        'failed-precondition',
        'Archived users cannot change role. Restore through the approved lifecycle workflow first.',
      );
    }

    const displayName =
      String(
        before.displayName ||
        before.name ||
        '',
      ).trim();

    const email =
      String(before.email || '')
        .trim()
        .toLowerCase();

    if (!displayName || !email) {
      throw new HttpsError(
        'failed-precondition',
        'User profile is missing the display name or email required for a role transition.',
      );
    }

    const phone =
      typeof before.phone === 'string'
        ? before.phone
        : null;

    const resolution =
      await resolvePersonIdFromFirebaseUid({
        db,
        firebaseUid: uid,
      });
    const personId =
      resolution.personId;
    const actorId =
      request.auth!.uid;
    const writeId =
      buildIdentityWriteId(
        'auth_user_update',
      );

    const authUser =
      await admin.auth().getUser(uid);
    const priorClaims =
      authUser.customClaims || {};
    const nextClaims =
      buildRoleClaims(
        priorClaims,
        nextRole,
      );
    validateClaimsSize(nextClaims);

    let claimsMutated = false;
    let firestoreCommitted = false;

    try {
      await admin.auth()
        .setCustomUserClaims(
          uid,
          nextClaims,
        );
      claimsMutated = true;

      const plan =
        planCanonicalAuthUserUpdate({
          personId,
          firebaseUid: uid,
          previousRole,
          nextRole,
          displayName,
          email,
          phone,
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
    } catch (error) {
      if (
        claimsMutated &&
        !firestoreCommitted
      ) {
        try {
          await admin.auth()
            .setCustomUserClaims(
              uid,
              priorClaims,
            );
        } catch (rollbackError) {
          logger.error(
            'adminSetUserRole: claims rollback failed',
            {
              uidToken:
                identityLogToken(
                  'uid',
                  uid,
                ),
              errorName:
                rollbackError instanceof Error
                  ? rollbackError.name
                  : 'UnknownError',
            },
          );
        }
      }

      logger.error(
        'adminSetUserRole: canonical transition failed',
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
          ? 'Role was changed but verification did not complete. Review the user before retrying.'
          : 'Failed to change user role',
      );
    }

    logger.info(
      'adminSetUserRole: canonical role changed',
      {
        actorToken:
          identityLogToken(
            'actor',
            actorId,
          ),
        uidToken:
          identityLogToken('uid', uid),
        personToken:
          identityLogToken(
            'person',
            personId,
          ),
        previousRole,
        nextRole,
      },
    );

    return {
      ok: true,
      uid,
      personId,
      role: nextRole,
    };
  },
);
