import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface AdminResetPasswordRequest {
  uid: string;
  newPassword: string;
}

interface AdminResetPasswordResponse {
  success: true;
  uid: string;
  message: string;
}

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export const adminResetPassword = onCall(
  { region: 'asia-south1', timeoutSeconds: 60, memory: '256MiB' },
  async (request): Promise<AdminResetPasswordResponse> => {
    const { auth, data } = request;
    await ensureAdmin(auth);

    const payload = (data || {}) as Partial<AdminResetPasswordRequest>;
    const uid = typeof payload.uid === 'string' ? payload.uid.trim() : '';
    const newPassword =
      typeof payload.newPassword === 'string' ? payload.newPassword : '';

    if (!uid) {
      throw new HttpsError('invalid-argument', 'uid is required');
    }

    if (
      !newPassword ||
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > MAX_PASSWORD_LENGTH
    ) {
      throw new HttpsError(
        'invalid-argument',
        `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`
      );
    }

    try {
      await admin.auth().updateUser(uid, { password: newPassword });

      await admin
        .firestore()
        .collection('password_reset_requests')
        .add({
          targetUid: uid,
          requestedBy: auth?.uid || null,
          requestedByEmail: auth?.token?.email || null,
          mode: 'admin_password_update',
          success: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      logger.info('adminResetPassword: password updated', {
        targetUid: uid,
        requestedBy: auth?.uid,
      });

      return {
        success: true,
        uid,
        message: 'Password updated successfully',
      };
    } catch (err: any) {
      logger.error('adminResetPassword failed', {
        targetUid: uid,
        requestedBy: auth?.uid,
        error: String(err),
      });

      if (err?.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', 'User not found');
      }

      if (err?.code === 'auth/invalid-password') {
        throw new HttpsError('invalid-argument', 'Password does not meet requirements');
      }

      throw new HttpsError('internal', 'Failed to reset password');
    }
  }
);
