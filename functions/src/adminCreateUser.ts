/**
 * Tiny Steps – Admin Create User (Enterprise Modular Version)
 * Clean, maintainable, SOLID-oriented implementation.
 */

import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

import { ensureAdmin } from "./helpers/adminGuard";
import { validateCreateUserPayload } from "./helpers/validation/userValidation";
import {
  createAuthUser,
  rollbackAuthUser,
  maybeGeneratePasswordResetLink,
  generateEmailVerification,
} from "./helpers/auth/userAuth";
import {
  buildUserDocBase,
  buildRoleSpecificDocuments,
} from "./helpers/firestore/userFirestoreBuilders";
import { setUserClaims } from "./helpers/auth/userClaims";
import { sanitizeForLogging } from "./helpers/util/sanitize";
import { CreateUserResponse } from "./helpers/types/createUserTypes";

// Ensure Admin SDK initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const adminCreateUser = functions.onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 10,
  },
  async (request): Promise<CreateUserResponse> => {
    const now = new Date().toISOString();
    let createdUid: string | null = null;

    try {
      const caller = request.auth;
      await ensureAdmin(caller);

      const cleanData = validateCreateUserPayload(request.data);
      const { email, displayName, role } = cleanData;

      logger.info("AdminCreateUser — Request", {
        callerUid: caller?.uid,
        data: sanitizeForLogging(cleanData),
      });

      // 1) Create Auth User
      const authUser = await createAuthUser(cleanData);
      createdUid = authUser.uid;

      logger.info("Auth user created", {
        uid: authUser.uid,
        email: authUser.email,
      });

      // 2) Build Firestore docs
      const db = admin.firestore();
      const batch = db.batch();
      const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

      const baseUserDoc = buildUserDocBase(cleanData, caller?.uid || 'system');
      const roleDocs = buildRoleSpecificDocuments(
        cleanData,
        authUser.uid,
        caller?.uid || 'system'
      );

      // Add main /users/{uid}
      batch.set(db.collection("users").doc(authUser.uid), {
        ...baseUserDoc,
        createdAt: serverTimestamp,
        updatedAt: serverTimestamp,
      });

      // Add role-specific docs
      for (const { path, data } of roleDocs) {
        batch.set(db.doc(path), {
          ...data,
          createdAt: serverTimestamp,
          updatedAt: serverTimestamp,
        });
      }

      // Commit write
      await batch.commit();
      logger.info("Firestore documents created", { uid: authUser.uid });

      // 3) Set custom claims
      await setUserClaims(authUser.uid, cleanData.role);

      logger.info("Custom claims set", {
        uid: authUser.uid,
        role: cleanData.role,
      });

      // 4) Password reset (only if no password input)
      const resetLink = await maybeGeneratePasswordResetLink(
        authUser,
        cleanData
      );

      // 5) Email verification
      const verifyLink = await generateEmailVerification(authUser);

      const resp: CreateUserResponse = {
        success: true,
        uid: authUser.uid,
        email,
        displayName,
        role,
        message: `User ${displayName} created successfully`,
        timestamp: now,
        resetLink: resetLink,
        emailVerificationLink: verifyLink,
        nextSteps: cleanData.password
          ? [
              "User can log in using the provided password.",
              "Advise user to verify their email.",
            ]
          : [
              "User must open the password reset link to set their password.",
              "Then log in and verify email.",
            ],
      };

      return resp;
    } catch (error: any) {
      logger.error("adminCreateUser — ERROR", {
        error: error?.message || String(error),
        stack: error?.stack,
        createdUid,
      });

      // Rollback Auth User if Firestore failed
      if (createdUid) {
        await rollbackAuthUser(createdUid);
      }

      if (error instanceof functions.HttpsError) {
        return {
          success: false,
          error: error.message,
          code: error.code,
        };
      }

      return {
        success: false,
        error: "Unexpected error occurred.",
        code: "internal",
      };
    }
  }
);
