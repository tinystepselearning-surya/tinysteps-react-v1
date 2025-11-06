import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Cloud Function to set custom claims for a user
 * Only callable by admins
 */
export const adminSetUserClaims = onCall(
  { region: "asia-south1", cors: true },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    // Check admin role
    const isAdmin = request.auth.token.role === "admin";
    if (!isAdmin) {
      throw new HttpsError(
        "permission-denied",
        "Only admins can set user claims"
      );
    }

    const { uid, role } = request.data;

    // Validate required fields
    if (!uid) {
      throw new HttpsError("invalid-argument", "Missing required field: uid");
    }

    if (!role) {
      throw new HttpsError("invalid-argument", "Missing required field: role");
    }

    // Validate role
    const validRoles = ["parent", "student", "teacher", "learning-partner", "admin"];
    if (!validRoles.includes(role)) {
      throw new HttpsError("invalid-argument", `Invalid role: ${role}`);
    }

    try {
      const auth = getAuth();
      const db = getFirestore();

      // Get user from Auth
      const userRecord = await auth.getUser(uid);

      // Set custom claims
      await auth.setCustomUserClaims(uid, { role });

      // Update Firestore /users/{uid} document with role
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        await userRef.update({
          role,
          updatedAt: new Date(),
          updatedBy: request.auth.uid,
        });
      }

      console.log(`✅ Set custom claims for ${userRecord.email}: role=${role}`);

      return {
        success: true,
        uid,
        email: userRecord.email,
        role,
        message: `Custom claims updated for ${userRecord.email}`,
      };
    } catch (error: any) {
      console.error("Error setting custom claims:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);
