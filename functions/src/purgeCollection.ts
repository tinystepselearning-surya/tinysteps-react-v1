import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-south1";

export const purgeCollection = onCall(
  { region: REGION, timeoutSeconds: 540, memory: "1GiB" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const db = admin.firestore();
    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists || (userSnap.data()?.role || "").toLowerCase() !== "admin") {
      throw new HttpsError("permission-denied", "Admin only.");
    }

    const { path, dryRun } = request.data as { path?: string; dryRun?: boolean };
    if (!path || typeof path !== "string") {
      throw new HttpsError("invalid-argument", "Missing path.");
    }

    const ALLOWED = new Set(["sessions"]);
    if (!ALLOWED.has(path)) {
      throw new HttpsError("invalid-argument", `Path not allowed: ${path}`);
    }

    const colRef = db.collection(path);

    if (dryRun) {
      const snap = await colRef.limit(5).get();
      return {
        ok: true,
        dryRun: true,
        sampleIds: snap.docs.map((d) => d.id),
      };
    }

    await db.recursiveDelete(colRef);

    return { ok: true, path };
  }
);
