import * as fns from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface GenerateResetLinkRequest {
  email: string;
}

interface GenerateResetLinkResponse {
  resetLink: string;
}

/**
 * Callable function for admins to generate a password reset link
 * for a given email.
 */
export const adminGenerateResetLink = onCall(
  {
    region: 'asia-south1',
    memory: '128MiB',
    timeoutSeconds: 30,
  },
  async (request): Promise<GenerateResetLinkResponse> => {
    const { data, auth } = request;

    // 1) Authentication check
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const callerUid = auth.uid;

    // 2) Admin check: via custom claims OR Firestore user doc
    const callerIsAdminClaim =
      auth.token?.admin === true || auth.token?.role === 'admin';

    let callerIsAdminDoc = false;
    try {
      const callerDoc = await admin.firestore()
        .collection('users')
        .doc(callerUid)
        .get();
      const callerData = callerDoc.data();
      callerIsAdminDoc =
        !!callerData &&
        (
          (Array.isArray(callerData.roles) && callerData.roles.includes('admin')) ||
          callerData.role === 'admin'
        );
    } catch (err) {
      fns.logger.warn('adminGenerateResetLink: failed to fetch caller user doc', {
        callerUid,
        error: String(err),
      });
    }

    if (!(callerIsAdminClaim || callerIsAdminDoc)) {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    // 3) Validate input
    const email = (data as GenerateResetLinkRequest | undefined)?.email;
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new HttpsError('invalid-argument', 'Email is required');
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new HttpsError('invalid-argument', 'Invalid email format');
    }

    // 4) Generate reset link
    try {
      const resetLink = await admin.auth().generatePasswordResetLink(trimmedEmail);
      fns.logger.info('Generated password reset link', {
        email: trimmedEmail,
        callerUid,
      });
      return { resetLink };
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        throw new HttpsError(
          'not-found',
          `No user found with email ${trimmedEmail}`
        );
      }

      fns.logger.error(
        'adminGenerateResetLink: error from generatePasswordResetLink',
        { email: trimmedEmail, callerUid, error: String(err) }
      );
      throw new HttpsError('internal', 'Failed to generate password reset link');
    }
  }
);
