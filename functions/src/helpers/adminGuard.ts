import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

/**
 * Single Source of Truth for Admin Authorization
 */
export async function ensureAdmin(auth: any): Promise<void> {
  if (!auth || !auth.uid) {
    logger.warn('ensureAdmin: missing auth');
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const uid = auth.uid;

  // 1. Fast path: custom claims
  const isAdmin =
    auth.token?.role === 'admin' ||
    auth.token?.admin === true;

  if (isAdmin) return;

  // 2. Slow path: Firestore
  try {
    const snap = await admin.firestore().collection('users').doc(uid).get();
    if (!snap.exists) {
      logger.warn('ensureAdmin: no user doc', { uid });
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    const data = snap.data();
    const roleValid =
      data?.role === 'admin' ||
      (Array.isArray(data?.roles) && data.roles.includes('admin'));

    if (!roleValid) {
      logger.warn('ensureAdmin: caller not admin', { uid, role: data?.role });
      throw new HttpsError('permission-denied', 'Admin access required');
    }
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;

    logger.error('ensureAdmin failed', { uid, err: String(err) });
    throw new HttpsError('internal', 'Failed to verify admin status');
  }
}
