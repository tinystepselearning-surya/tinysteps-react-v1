import * as fns from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard'; // ✅ central admin checker

if (!admin.apps.length) {
  admin.initializeApp();
}

// ---------- Constants ----------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RESETS_PER_ADMIN_PER_HOUR = 50;

// ---------- Types ----------
interface GenerateResetLinkRequest {
  email: string;
}

interface GenerateResetLinkResponse {
  success: true;
  resetLink: string;
  message: string;
  expiresIn: string;
}

interface GenerateResetLinkErrorResponse {
  success: false;
  error: string;
  code: string;
}

// ---------- Rate Limit Helper ----------
async function checkRateLimit(adminUid: string): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentResets = await admin
    .firestore()
    .collection('password_reset_requests')
    .where('requestedBy', '==', adminUid)
    .where('timestamp', '>', oneHourAgo)
    .count()
    .get();

  const count = recentResets.data().count;

  if (count >= MAX_RESETS_PER_ADMIN_PER_HOUR) {
    fns.logger.warn('Rate limit exceeded for password reset', {
      adminUid,
      count,
      limit: MAX_RESETS_PER_ADMIN_PER_HOUR,
    });

    throw new HttpsError(
      'resource-exhausted',
      `Rate limit exceeded. Maximum ${MAX_RESETS_PER_ADMIN_PER_HOUR} resets per hour.`
    );
  }
}

// ---------- Main Function ----------
export const adminGenerateResetLink = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (
    request
  ): Promise<GenerateResetLinkResponse | GenerateResetLinkErrorResponse> => {
    const { data, auth } = request;

    try {
      // 1. Validate admin
      await ensureAdmin(auth);
      const callerUid = auth!.uid;

      // 2. Rate limit protection
      await checkRateLimit(callerUid);

      // 3. Validate input
      const email = (data as GenerateResetLinkRequest)?.email?.trim().toLowerCase();
      if (!email || !EMAIL_REGEX.test(email)) {
        throw new HttpsError('invalid-argument', 'A valid email is required');
      }

      // 4. Check user existence (but don't reveal if not)
      let exists = true;
      try {
        await admin.auth().getUserByEmail(email);
      } catch (err: any) {
        if (err?.code === 'auth/user-not-found') {
          exists = false;
        } else {
          fns.logger.error('Unexpected error checking user existence', {
            email,
            error: String(err),
          });
        }
      }

      if (!exists) {
        // Audit but do not reveal
        fns.logger.warn('Password reset requested for non-existent user', {
          email,
          callerUid,
        });
        throw new HttpsError(
          'invalid-argument',
          'Unable to generate reset link for this email'
        );
      }

      // 5. Generate reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email, {
        url: process.env.PASSWORD_RESET_URL || 'https://tinysteps.com/reset-password',
        handleCodeInApp: false,
      });

      // 6. Audit trail
      await admin.firestore().collection('password_reset_requests').add({
        targetEmail: email,
        requestedBy: callerUid,
        requestedByEmail: auth?.token?.email || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        success: true,
      });

      fns.logger.info('Generated password reset link', {
        email,
        callerUid,
        callerEmail: auth?.token?.email,
      });

      return {
        success: true,
        resetLink,
        message: 'Password reset link generated successfully',
        expiresIn: '1 hour',
      };
    } catch (err: any) {
      // Audit failed attempts
      if (auth?.uid) {
        await admin
          .firestore()
          .collection('password_reset_requests')
          .add({
            targetEmail: data?.email || 'unknown',
            requestedBy: auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            success: false,
            error: err.message || String(err),
          })
          .catch((logErr) => {
            fns.logger.error('Failed to log failed reset attempt', {
              error: String(logErr),
            });
          });
      }

      // Known errors
      if (err instanceof HttpsError) {
        return {
          success: false,
          error: err.message,
          code: err.code,
        };
      }

      // Firebase throttle
      if (err?.code === 'auth/too-many-requests') {
        return {
          success: false,
          error: 'Too many password reset requests. Please try again later.',
          code: 'resource-exhausted',
        };
      }

      // Unexpected
      fns.logger.error('Unexpected error in adminGenerateResetLink', {
        error: String(err),
        stack: err.stack,
      });

      return {
        success: false,
        error: 'Failed to generate password reset link',
        code: 'internal',
      };
    }
  }
);
