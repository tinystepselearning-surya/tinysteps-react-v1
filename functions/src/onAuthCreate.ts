import { beforeUserCreated } from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const onAuthCreate = beforeUserCreated(
  { region: "asia-south1" },
  async (event) => {
    const user = event.data;
    if (!user) return;
    
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
