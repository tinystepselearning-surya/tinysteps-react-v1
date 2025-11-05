import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";

admin.apps.length || admin.initializeApp();

const bootstrapToken = defineSecret("BOOTSTRAP_TOKEN");

export const createAdmin = onRequest(
  { 
    region: "us-central1",
    secrets: [bootstrapToken]
  },
  async (req, res) => {
    try {
      const allowed = bootstrapToken.value();
      const token = req.get("X-Bootstrap-Token") || "";
      if (!allowed || token !== allowed) {
        res.status(401).json({ ok: false, error: "Unauthorized: bad token" });
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({ ok: false, error: "Use POST" });
        return;
      }

      const { email, username, name, createIfMissing } = req.body || {};
      if (!email) {
        res.status(400).json({ ok: false, error: "Missing email" });
        return;
      }

      let user;
      try {
        user = await admin.auth().getUserByEmail(email);
      } catch {
        if (createIfMissing) {
          user = await admin.auth().createUser({
            email,
            emailVerified: true,
            password: "Temp@123456"
          });
        } else {
          res.status(404).json({ ok: false, error: `User not found: ${email}` });
          return;
        }
      }

      await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });
      await admin.auth().revokeRefreshTokens(user.uid);

      const db = admin.firestore();
      const uname = (username || email.split("@")[0]).trim();
      const usernameLower = uname.toLowerCase();

      await db.doc(`usernames/${usernameLower}`).set({ uid: user.uid });
      await db.doc(`users/${user.uid}`).set({
        email,
        username: uname,
        usernameLower,
        displayName: name || user.displayName || uname,
        role: "admin",
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "bootstrap-fn"
      }, { merge: true });

      res.status(200).json({ ok: true, uid: user.uid, username: uname });
    } catch (err: any) {
      console.error("[createAdmin] Error:", err?.stack || err?.message || String(err));
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  }
);
