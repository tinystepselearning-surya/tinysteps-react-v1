import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const onAuthCreate = functions
  .region("asia-south1")
  .auth.user()
  .onCreate(async (user) => {
    const now = admin.firestore.FieldValue.serverTimestamp();
    await admin.firestore().doc(`users/${user.uid}`).set(
      {
        role: "guest",
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        phone: user.phoneNumber ?? "",
        status: "active",
        childIds: [],
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  });
