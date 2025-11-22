/**
 * Main Cloud Functions entry point.
 * Exposes:
 *  - setUserRole, getUidByEmail, adminResetPassword, subscribeNewsletter
 *  - plus re-exports of other modules (adminCreateUser, onAuthUserCreate, etc.)
 */

import { setGlobalOptions } from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

// Limit max instances per function (cost + safety)
setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// ---------- Types ----------

interface SetUserRoleRequest {
  uid: string;
  role: 'admin' | 'teacher' | 'parent' | 'kid' | 'learningPartner';
}

interface SetUserRoleSuccessResponse {
  success: true;
  uid: string;
  role: string;
  message: string;
  timestamp: string;
}

interface SetUserRoleErrorResponse {
  success: false;
  error: string;
  code: string;
}

interface GetUidByEmailRequest {
  email: string;
}

interface GetUidByEmailResponse {
  uid: string;
}

interface AdminResetPasswordRequest {
  uid: string;
  newPassword: string;
}

interface AdminResetPasswordResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

interface SubscribeRequest {
  email: string;
}
interface SubscribeResponse {
  success: boolean;
}

// Allowed roles for setUserRole
const ALLOWED_ROLES = ['admin', 'teacher', 'parent', 'kid', 'learningPartner'] as const;

// ---------- Helper: ensureAdmin ----------

/**
 * Ensure caller is admin:
 *  - token.admin === true OR token.role === 'admin'
 *  - OR /users/{uid}.role === 'admin' OR roles includes 'admin'
 */
async function ensureAdmin(auth: any) {
  if (!auth) {
    logger.warn('Admin callable called without auth');
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const callerUid = auth.uid;
  const tokenIsAdmin =
    auth.token?.admin === true || auth.token?.role === 'admin';

  if (tokenIsAdmin) return;

  try {
    const doc = await admin.firestore().collection('users').doc(callerUid).get();
    const data = doc.data();
    const docIsAdmin =
      !!data &&
      (
        data.role === 'admin' ||
        (Array.isArray(data.roles) && data.roles.includes('admin'))
      );

    if (!docIsAdmin) {
      logger.warn('ensureAdmin: caller not admin', { callerUid });
      throw new HttpsError('permission-denied', 'Admin access required');
    }
  } catch (err) {
    logger.error('ensureAdmin: error verifying admin via Firestore', {
      callerUid,
      error: String(err),
    });
    throw new HttpsError('permission-denied', 'Admin access required');
  }
}

// ---------- setUserRole ----------

export async function setUserRoleHandler(
  request: any
): Promise<SetUserRoleSuccessResponse | SetUserRoleErrorResponse> {
  const now = new Date().toISOString();
  const { data, auth } = request;

  try {
    await ensureAdmin(auth);

    const { uid, role } = data as SetUserRoleRequest;

    // Input validation
    if (!uid || typeof uid !== 'string' || uid.length !== 28) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid uid: must be a 28-character string'
      );
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      throw new HttpsError(
        'invalid-argument',
        `Invalid role: must be one of ${ALLOWED_ROLES.join(', ')}`
      );
    }

    // Get current role for logging
    let oldRole = 'none';
    try {
      const user = await admin.auth().getUser(uid);
      oldRole = (user.customClaims?.role as string) || 'none';
    } catch {
      logger.info(
        `setUserRole: user ${uid} not found or no custom claims; proceeding`
      );
    }

    // Set custom claims
    const customClaims = {
      admin: role === 'admin',
      teacher: role === 'teacher',
      parent: role === 'parent',
      kid: role === 'kid',
      learningPartner: role === 'learningPartner',
      role,
    };

    await admin.auth().setCustomUserClaims(uid, customClaims);

    logger.info('Role updated', {
      uid,
      oldRole,
      newRole: role,
      changedBy: auth?.uid,
      timestamp: now,
    });

    const response: SetUserRoleSuccessResponse = {
      success: true,
      uid,
      role,
      message: `User role updated successfully to ${role}`,
      timestamp: now,
    };
    return response;
  } catch (error: any) {
    const httpError = error as HttpsError;
    if (httpError && (httpError as any).code) {
      const errorResponse: SetUserRoleErrorResponse = {
        success: false,
        error: httpError.message,
        code: (httpError as any).code,
      };
      return errorResponse;
    }

    logger.error('Unexpected error in setUserRole', {
      error: String(error),
      data,
      caller: auth?.uid,
    });

    const errorResponse: SetUserRoleErrorResponse = {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'internal',
    };
    return errorResponse;
  }
}

export const setUserRole = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  setUserRoleHandler
);

// ---------- getUidByEmail ----------

export const getUidByEmail = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request): Promise<GetUidByEmailResponse> => {
    const { data, auth } = request;

    await ensureAdmin(auth);

    const { email } = data as GetUidByEmailRequest;
    if (!email || typeof email !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid email');
    }

    try {
      const user = await admin.auth().getUserByEmail(email);
      return { uid: user.uid };
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', 'No user found with that email');
      }
      logger.error('getUidByEmail: unexpected error', {
        email,
        error: String(error),
      });
      throw new HttpsError('internal', 'Failed to get UID');
    }
  }
);

// ---------- adminResetPassword ----------

export const adminResetPassword = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request): Promise<AdminResetPasswordResponse> => {
    const now = new Date().toISOString();
    const { data, auth } = request;

    await ensureAdmin(auth);

    const { uid, newPassword } = data as AdminResetPasswordRequest;

    if (!uid || typeof uid !== 'string' || uid.length !== 28) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid uid: must be a 28-character string'
      );
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid password: must be at least 6 characters'
      );
    }

    try {
      await admin.auth().updateUser(uid, { password: newPassword });

      logger.info('Password reset', {
        uid,
        changedBy: auth?.uid,
        timestamp: now,
      });

      return {
        success: true,
        message: 'Password reset successfully',
        timestamp: now,
      };
    } catch (error: any) {
      const httpError = error as HttpsError;
      if (httpError && (httpError as any).code) {
        throw httpError;
      }

      logger.error('Unexpected error in adminResetPassword', {
        error: String(error),
        uid,
        caller: auth?.uid,
      });
      throw new HttpsError(
        'internal',
        'An unexpected error occurred. Please try again.'
      );
    }
  }
);

// ---------- Re-exports from other modules ----------

export { adminCreateUser } from './adminCreateUser';
export { onAuthUserCreate } from './onAuthUserCreate';
export {
  onSessionComplete,
  onSessionCompleteTrigger,
} from './onSessionComplete';
export { adminGenerateResetLink } from './adminGenerateResetLink';
export { onEnrollmentUpdate } from './onEnrollmentUpdate';
export { adminProcessEnrollmentCSV } from './adminProcessEnrollmentCSV';
export { webhookPhonePe } from './webhookPhonePe';
export { createPhonePeOrder, verifyPhonePePayment } from './phonepePayments';
export {
  assignLPToParent,
  unassignLPFromParent,
  assignLPToTeacher,
  unassignLPFromTeacher,
} from './assignLP';

// ---------- subscribeNewsletter (callable) ----------

export const subscribeNewsletter = onCall(
  { region: 'asia-south1', memory: '128MiB', timeoutSeconds: 30 },
  async (request): Promise<SubscribeResponse> => {
    const { data, auth, rawRequest } = request;

    try {
      const { email } = data as SubscribeRequest;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new HttpsError('invalid-argument', 'Valid email required');
      }

      const db = admin.firestore();
      await db
        .collection('newsletter_subscribers')
        .doc(email.toLowerCase())
        .set(
          {
            email: email.toLowerCase(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: rawRequest?.headers?.referer || 'website',
            uid: auth?.uid || null,
          },
          { merge: true }
        );

      return { success: true };
    } catch (err: any) {
      logger.error('subscribeNewsletter error', { error: String(err) });
      throw new HttpsError('internal', 'Subscription failed');
    }
  }
);
export { checkSubscriptionAccess } from "./checkSubscriptionAccess";
export { fetchAdminStats } from './fetchAdminStats';
