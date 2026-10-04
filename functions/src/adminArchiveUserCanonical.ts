import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import { ensureAdmin } from './helpers/adminGuard';
import { normalizeRole } from './helpers/roles';
import {
  buildIdentityWriteId,
  identityLogToken,
  isGenericAuthUserRole,
} from './schoolOS/identity/authUserActivation';
import {
  resolvePersonIdFromFirebaseUid,
} from './schoolOS/identity/authPersonCompatibility';
import {
  planCanonicalAuthUserArchive,
  writeCanonicalAuthUserArchivePlan,
} from './schoolOS/identity/canonicalPrimaryAuthUserArchive';
import {
  refreshAuthAccessReadModelBestEffort,
} from './schoolOS/identity/authAccessReadModelMaintenance';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const adminArchiveUser = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    const { auth, data } = request;
    await ensureAdmin(auth);

    const uid =
      typeof (data as any)?.uid ===
      'string'
        ? (data as any).uid.trim()
        : '';

    if (!uid) {
      throw new HttpsError(
        'invalid-argument',
        'uid is required',
      );
    }

    if (auth?.uid === uid) {
      throw new HttpsError(
        'failed-precondition',
        'You cannot archive yourself',
      );
    }

    const db = admin.firestore();
    const userRef =
      db.collection('users').doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      throw new HttpsError(
        'not-found',
        'User not found',
      );
    }

    const userData = snap.data() || {};
    const role =
      normalizeRole(userData.role);

    if (!isGenericAuthUserRole(role)) {
      throw new HttpsError(
        'failed-precondition',
        'This user role must be archived through its dedicated workflow.',
      );
    }

    if (role === 'admin') {
      const adminsSnap =
        await db.collection('users')
          .where('role', '==', 'admin')
          .get();

      const otherOperationalAdmins =
        adminsSnap.docs.filter((docSnap) => {
          if (docSnap.id === uid) {
            return false;
          }
          const status =
            String(
              docSnap.data()?.status ||
              'active',
            )
              .trim()
              .toLowerCase();
          return status === 'active';
        });

      if (
        otherOperationalAdmins.length === 0
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Cannot archive the last active admin',
        );
      }
    }

    const resolution =
      await resolvePersonIdFromFirebaseUid({
        db,
        firebaseUid: uid,
      });
    const personId =
      resolution.personId;
    const actorId = auth!.uid;
    const writeId =
      buildIdentityWriteId(
        'auth_user_archive',
      );

    let authBefore:
      admin.auth.UserRecord | null = null;
    let authDisabledByThisCall = false;
    let firestoreCommitted = false;

    try {
      try {
        authBefore =
          await admin.auth().getUser(uid);
        if (!authBefore.disabled) {
          await admin.auth().updateUser(
            uid,
            { disabled: true },
          );
          authDisabledByThisCall = true;
        }
      } catch (error: any) {
        if (
          error?.code !==
          'auth/user-not-found'
        ) {
          throw error;
        }
      }

      const plan =
        planCanonicalAuthUserArchive({
          personId,
          firebaseUid: uid,
          role,
          actorId,
          writeId,
          archivedReason:
            typeof (data as any)
              ?.archivedReason ===
              'string'
              ? (data as any)
                .archivedReason
                .trim()
              : null,
        });

      try {
        await writeCanonicalAuthUserArchivePlan({
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
        authBefore &&
        authDisabledByThisCall &&
        !firestoreCommitted
      ) {
        try {
          await admin.auth().updateUser(
            uid,
            {
              disabled:
                authBefore.disabled,
            },
          );
        } catch (rollbackError) {
          logger.error(
            'adminArchiveUser: auth rollback failed',
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
        'adminArchiveUser: canonical archive failed',
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
          ? 'User was archived but verification did not complete. Review the user before retrying.'
          : 'Failed to archive user',
      );
    }

    await refreshAuthAccessReadModelBestEffort({
      db,
      firebaseUid: uid,
      context: 'adminArchiveUser',
    });

    logger.info(
      'adminArchiveUser: canonical user archived',
      {
        uidToken:
          identityLogToken('uid', uid),
        personToken:
          identityLogToken(
            'person',
            personId,
          ),
        role,
      },
    );

    return {
      success: true,
      uid,
      personId,
      status: 'archived',
    };
  },
);
