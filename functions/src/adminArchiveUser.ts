import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) admin.initializeApp();

export const adminArchiveUser = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const { auth, data } = request;
    await ensureAdmin(auth);

    const uid = (data as any)?.uid;
    if (!uid || typeof uid !== 'string') {
      throw new HttpsError('invalid-argument', 'uid is required');
    }

    if (auth?.uid === uid) {
      throw new HttpsError('failed-precondition', 'You cannot archive yourself');
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = snap.data();
    const role = userData?.role;

    // Prevent archiving last admin
    if (role === 'admin') {
      const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
      if (adminsSnap.size <= 1) {
        throw new HttpsError('failed-precondition', 'Cannot archive the last admin');
      }
    }

    await userRef.update({
      status: 'archived',
      archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      archivedBy: auth?.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: auth?.uid,
    });

    // Optional: disable login in Auth
    try {
      await admin.auth().updateUser(uid, { disabled: true });
    } catch (err: any) {
      if (err?.code !== 'auth/user-not-found') {
        logger.warn('Archive: failed to disable auth user (continuing)', { uid, error: String(err) });
      }
    }

    logger.info('User archived', { uid, archivedBy: auth?.uid });
    return { success: true, uid, status: 'archived' };
  }
);
