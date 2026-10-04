import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { normalizeRole } from './roles';

type AuthLike = {
  uid?: string;
  token?: Record<string, unknown>;
} | null | undefined;

function isActiveOrLegacyUser(data: admin.firestore.DocumentData): boolean {
  if (data.status === undefined || data.status === null) return true;
  return (
    typeof data.status === 'string' &&
    data.status.trim().toLowerCase() === 'active'
  );
}

function hasAdminRole(data: admin.firestore.DocumentData): boolean {
  if (data.superUser === true) return true;
  if (normalizeRole(data.role) === 'admin') return true;
  if (!Array.isArray(data.roles)) return false;
  return data.roles.some(
    (value: unknown) => normalizeRole(value) === 'admin',
  );
}

/**
 * Returns true only when the authenticated UID has a current active/legacy
 * users/{uid} record whose business role is Admin.
 *
 * Custom claims are intentionally not authoritative here. They remain an
 * authentication cache, but an orphan/stale claim cannot bypass current
 * Tiny Steps business identity.
 */
export async function isCurrentAdmin(auth: AuthLike): Promise<boolean> {
  const uid = auth?.uid;
  if (!uid || typeof uid !== 'string') return false;

  try {
    const snap = await admin
      .firestore()
      .collection('users')
      .doc(uid)
      .get();

    if (!snap.exists) {
      if (
        normalizeRole(auth?.token?.role) === 'admin' ||
        auth?.token?.admin === true
      ) {
        logger.warn('isCurrentAdmin: stale/orphan Admin claim rejected', {
          uid,
        });
      }
      return false;
    }

    const data = snap.data() || {};
    if (!isActiveOrLegacyUser(data)) {
      logger.warn('isCurrentAdmin: inactive user rejected', {
        uid,
        status: data.status,
      });
      return false;
    }

    const allowed = hasAdminRole(data);
    if (
      !allowed &&
      (
        normalizeRole(auth?.token?.role) === 'admin' ||
        auth?.token?.admin === true
      )
    ) {
      logger.warn('isCurrentAdmin: stale Admin claim rejected', {
        uid,
        role: data.role,
      });
    }

    return allowed;
  } catch (err) {
    logger.error('isCurrentAdmin failed', {
      uid,
      err: String(err),
    });
    return false;
  }
}

/**
 * Single source of truth for callable Admin authorization.
 *
 * A current active/legacy Firestore user record is required even when the
 * Firebase token contains an Admin custom claim.
 */
export async function ensureAdmin(auth: AuthLike): Promise<void> {
  if (!auth?.uid) {
    logger.warn('ensureAdmin: missing auth');
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  if (await isCurrentAdmin(auth)) return;

  throw new HttpsError('permission-denied', 'Admin access required');
}
