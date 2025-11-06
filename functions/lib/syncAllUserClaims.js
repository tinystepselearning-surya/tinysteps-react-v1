"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAllUserClaims = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Cloud Function to sync custom claims for all users from Firestore
 * Only callable by admins
 */
exports.syncAllUserClaims = (0, https_1.onCall)({ region: "asia-south1", cors: true, timeoutSeconds: 540 }, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be authenticated");
    }
    // Check admin role
    const isAdmin = request.auth.token.role === "admin";
    if (!isAdmin) {
        throw new https_1.HttpsError("permission-denied", "Only admins can sync user claims");
    }
    try {
        const auth = (0, auth_1.getAuth)();
        const db = (0, firestore_1.getFirestore)();
        // Get all users from Firestore
        const usersSnapshot = await db.collection("users").get();
        const results = {
            total: 0,
            synced: 0,
            failed: 0,
            errors: [],
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
            }
            catch (error) {
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
    }
    catch (error) {
        console.error("Error syncing claims:", error);
        throw new https_1.HttpsError("internal", error.message);
    }
});
