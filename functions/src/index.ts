/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Type definitions
interface SetUserRoleRequest {
  uid: string;
  role: "admin" | "teacher" | "parent" | "kid" | "learningPartner";
}

interface SetUserRoleSuccessResponse {
  success: true;
  uid: string;
  role: string;
  message: string;
  timestamp: string;
}

// Import required modules for the new function
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Game-related v1 callables removed from bundle during cleanup.

// Allowed roles
const ALLOWED_ROLES = ["admin", "teacher", "parent", "kid", "learningPartner"];

/**
 * Cloud Function to set user roles and custom claims.
 * Only callable by admins. Sets custom claims on Firebase Auth users for RBAC.
 *
 * @param data - The input data containing uid and role.
 * @param context - The callable context containing auth information.
 * @returns Promise<SetUserRoleSuccessResponse | SetUserRoleErrorResponse>
 */
// Long-term: expose a test-friendly handler and ensure we throw HttpsError for rejections.
export async function setUserRoleHandler(data: any, context: any) {
  const now = new Date().toISOString();

  try {
    // Security check: Only admins can call this function
    if (!context.auth || !context.auth.token.admin) {
      const errorMsg = `Unauthorized setUserRole attempt by uid=${context.auth?.uid || 'unknown'}`;
      logger.warn(errorMsg);
      throw new HttpsError("permission-denied", "Admin access required");
    }

    // Input validation
    const { uid, role } = data as SetUserRoleRequest;
    if (!uid || typeof uid !== "string" || uid.length !== 28) {
      throw new HttpsError("invalid-argument", "Invalid uid: must be a 28-character string");
    }
    if (!role || !ALLOWED_ROLES.includes(role)) {
      throw new HttpsError("invalid-argument", `Invalid role: must be one of ${ALLOWED_ROLES.join(", ")}`);
    }

    // Get current user to check old role for logging
    let oldRole = "none";
    try {
      const user = await admin.auth().getUser(uid);
      oldRole = user.customClaims?.role || "none";
    } catch (error) {
      // User might not exist, but we'll proceed to set claims anyway
      logger.info(`User ${uid} not found or no custom claims, proceeding to set role`);
    }

    // Set custom claims
    const customClaims = {
      admin: role === "admin",
      teacher: role === "teacher",
      parent: role === "parent",
      kid: role === "kid",
      learningPartner: role === "learningPartner",
      role: role,
    };

    await admin.auth().setCustomUserClaims(uid, customClaims);

    // Log successful operation
    const logMsg = `Role updated: uid=${uid}, oldRole=${oldRole}, newRole=${role}, changedBy=${context.auth.uid}, timestamp=${now}`;
    logger.info(logMsg);

    // Return success response
    const response: SetUserRoleSuccessResponse = {
      success: true,
      uid,
      role,
      message: `User role updated successfully to ${role}`,
      timestamp: now,
    };

    return response;

  } catch (error) {
    // If this was an HttpsError from our validation/security checks, rethrow it
    const httpError = error as HttpsError;
    if (httpError && httpError.code) {
      throw httpError;
    }

    // Handle unexpected errors by throwing an HttpsError so callers/tests receive a rejection
    logger.error("Unexpected error in setUserRole", { error, uid: data?.uid, role: data?.role, caller: context?.auth?.uid });
    throw new HttpsError("internal", "An unexpected error occurred. Please try again.");
  }
}

export const setUserRole = onCall(
  {
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  setUserRoleHandler
);

// Type for getUidByEmail
interface GetUidByEmailRequest {
  email: string;
}

interface GetUidByEmailResponse {
  uid: string;
}

export const getUidByEmail = onCall(
  {
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (data: any, context: any) => {
    try {
      // Security check: Only admins can call this function
      if (!context.auth || !context.auth.token.admin) {
        throw new HttpsError("permission-denied", "Admin access required");
      }

      const { email } = data as GetUidByEmailRequest;
      if (!email || typeof email !== "string") {
        throw new HttpsError("invalid-argument", "Invalid email");
      }

      const user = await admin.auth().getUserByEmail(email);
      return { uid: user.uid } as GetUidByEmailResponse;

    } catch (error) {
      const httpError = error as HttpsError;
      if (httpError.code) {
        throw httpError;
      }
      throw new HttpsError("internal", "Failed to get UID");
    }
  }
);

// Type for adminResetPassword
interface AdminResetPasswordRequest {
  uid: string;
  newPassword: string;
}

interface AdminResetPasswordResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * Cloud Function to reset a user's password.
 * Only callable by admins. Updates the user's password in Firebase Auth.
 *
 * @param data - The input data containing uid and newPassword.
 * @param context - The callable context containing auth information.
 * @returns Promise<AdminResetPasswordResponse>
 */
export const adminResetPassword = onCall(
  {
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (data: any, context: any) => {
    const now = new Date().toISOString();

    try {
      // Security check: Only admins can call this function
      if (!context.auth || !context.auth.token.admin) {
        const errorMsg = `Unauthorized adminResetPassword attempt by uid=${context.auth?.uid || 'unknown'}`;
        logger.warn(errorMsg);
        throw new HttpsError("permission-denied", "Admin access required");
      }

      // Input validation
      const { uid, newPassword } = data as AdminResetPasswordRequest;
      if (!uid || typeof uid !== "string" || uid.length !== 28) {
        throw new HttpsError("invalid-argument", "Invalid uid: must be a 28-character string");
      }
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        throw new HttpsError("invalid-argument", "Invalid password: must be at least 6 characters");
      }

      // Update user password
      await admin.auth().updateUser(uid, {
        password: newPassword,
      });

      // Log successful operation
      const logMsg = `Password reset: uid=${uid}, changedBy=${context.auth.uid}, timestamp=${now}`;
      logger.info(logMsg);

      // Return success response
      const response: AdminResetPasswordResponse = {
        success: true,
        message: "Password reset successfully",
        timestamp: now,
      };

      return response;

    } catch (error) {
      // Handle known HttpsError
      const httpError = error as HttpsError;
      if (httpError.code) {
        throw httpError;
      }

      // Handle unexpected errors
      logger.error("Unexpected error in adminResetPassword", { error, uid: data.uid, caller: context.auth?.uid });
      throw new HttpsError("internal", "An unexpected error occurred. Please try again.");
    }
  }
);

// Export the adminCreateUser function
export { adminCreateUser } from './adminCreateUser';
export { onAuthUserCreate } from './onAuthUserCreate';
export { onSessionComplete, onSessionCompleteTrigger } from './onSessionComplete';
export { adminGenerateResetLink } from './adminGenerateResetLink';
export { onEnrollmentUpdate } from './onEnrollmentUpdate';
export { adminProcessEnrollmentCSV } from './adminProcessEnrollmentCSV';
export { webhookPhonePe } from './webhookPhonePe';
export { createPhonePeOrder, verifyPhonePePayment } from './phonepePayments';
export { assignLPToParent, unassignLPFromParent, assignLPToTeacher, unassignLPFromTeacher } from './assignLP';

// Newsletter subscription (callable)
interface SubscribeRequest { email: string }
interface SubscribeResponse { success: boolean }

export const subscribeNewsletter = onCall(
  { region: 'asia-south1', memory: '128MiB', timeoutSeconds: 30 },
  async (data: any, context: any) => {
    try {
      const { email } = data as SubscribeRequest;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new HttpsError('invalid-argument', 'Valid email required');
      }
      const db = admin.firestore();
      await db.collection('newsletter_subscribers').doc(email.toLowerCase()).set({
        email: email.toLowerCase(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        source: context.rawRequest?.headers?.referer || 'website',
        uid: context.auth?.uid || null
      }, { merge: true });
      return { success: true } as SubscribeResponse;
    } catch (err:any) {
      logger.error('subscribeNewsletter error', { err });
      throw new HttpsError('internal', 'Subscription failed');
    }
  }
);

// Export the new game data functions
// game seed/content functions removed
// @ts-ignore
// export { createUserProfile } from '../createUserProfile';
// @ts-ignore
// export { aggregateDailyMetrics } from '../aggregateDailyMetrics';
