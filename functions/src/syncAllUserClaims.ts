import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Cloud Function to sync custom claims for all users from Firestore
 * Only callable by admins
 */
export const syncAllUserClaims = onCall(
  { region: "asia-south1", cors: true, timeoutSeconds: 540 },
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
        "Only admins can sync user claims"
      );
    }

    try {
      const auth = getAuth();
      const db = getFirestore();

      // Get all users from Firestore
      const usersSnapshot = await db.collection("users").get();

      const results = {
        total: 0,
        synced: 0,
        failed: 0,
        errors: [] as Array<{ uid: string; email: string; error: string }>,
      };

      for (const doc of usersSnapshot.docs) {
        results.total++;
        const uid = doc.id;
        const userData = doc.data();
        const role = userData.role;

        if (!role) {
          console.warn(`⚠️  User ${uid} has no role in Firestore, skipping`);
          results.failed++;
          results.errors.push({
            uid,
            email: userData.email || "unknown",
            error: "No role in Firestore",
          });
          continue;
        }

        try {
          // Get user from Auth
          const userRecord = await auth.getUser(uid);

          // Set custom claims
          await auth.setCustomUserClaims(uid, { role });

          console.log(`✅ Synced claims for ${userRecord.email}: role=${role}`);
          results.synced++;
        } catch (error: any) {
          console.error(`❌ Failed to sync claims for ${uid}:`, error);
          results.failed++;
          results.errors.push({
            uid,
            email: userData.email || "unknown",
            error: error.message,
          });
        }
      }

      console.log(`
=== Sync Complete ===
Total users: ${results.total}
Synced: ${results.synced}
Failed: ${results.failed}
      `);

      return {
        success: true,
        ...results,
      };
    } catch (error: any) {
      console.error("Error syncing claims:", error);
      throw new HttpsError("internal", error.message);
    }
  }
);
