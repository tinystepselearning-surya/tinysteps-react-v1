import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Deletes a user permanently:
 * - Firebase Auth user
 * - Firestore /users/{uid}
 * - Firestore role mirror docs (admins, teachers, parents, learningPartners)
 */
export const adminDeleteUser = onCall(
  { region: 'asia-south1', timeoutSeconds: 60 },
  async (request) => {
    const { auth, data } = request;

    // ---------- Auth & Admin check ----------
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    await ensureAdmin(auth);

    const targetUid = data?.uid as string | undefined;

    if (!targetUid) {
      throw new HttpsError('invalid-argument', 'uid is required');
    }

    // Prevent admin deleting themselves
    if (auth.uid === targetUid) {
      throw new HttpsError(
        'failed-precondition',
        'You cannot delete your own admin account'
      );
    }

    const db = admin.firestore();

    // ---------- Fetch user document ----------
    const userRef = db.collection('users').doc(targetUid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User not found in Firestore');
    }

    const userData = userSnap.data() || {};
    const role = userData.role as string | undefined;

    logger.info('Admin deleting user', {
      adminUid: auth.uid,
      targetUid,
      role,
    });

    // ---------- Delete Firebase Auth user ----------
    try {
      await admin.auth().deleteUser(targetUid);
      logger.info('Auth user deleted', { targetUid });
    } catch (err: any) {
      // If user already missing in Auth, continue cleanup
      if (err?.code !== 'auth/user-not-found') {
        logger.error('Auth delete failed', err);
        throw new HttpsError(
          'internal',
          'Failed to delete authentication user'
        );
      }
    }

    // ---------- Firestore cleanup (transactional) ----------
    const batch = db.batch();

    // Main user doc
    batch.delete(userRef);

    // Role mirror collections (if used)
    const roleCollections: Record<string, string> = {
      admin: 'admins',
      teacher: 'teachers',
      parent: 'parents',
      learningPartner: 'learningPartners',
    };

    if (role && roleCollections[role]) {
      const roleDocRef = db
        .collection(roleCollections[role])
        .doc(targetUid);
      batch.delete(roleDocRef);
    }

    // OPTIONAL future cleanup (safe even if empty):
    // - enrollments
    // - sessions
    // - mappings
    // We intentionally do NOT auto-delete kids, sessions, invoices etc.
    // That should be a deliberate admin action.

    try {
      await batch.commit();
      logger.info('Firestore cleanup completed', { targetUid });
    } catch (err) {
      logger.error('Firestore delete failed', err);
      throw new HttpsError(
        'internal',
        'Failed to delete Firestore user data'
      );
    }

    return {
      success: true,
      uid: targetUid,
      message: 'User deleted permanently',
    };
  }
);
