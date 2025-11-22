import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const onAuthUserCreate = functions
  .region('asia-south1')
  .auth.user()
  .onCreate(async (user) => {
    try {
      const uid = user.uid;
  const providerId = (user.providerData && user.providerData[0] && (user.providerData[0] as any).providerId) || null;
  const provider = providerId || null;

      // If user doc exists, don't overwrite
      const userRef = admin.firestore().collection('users').doc(uid);
      const docSnapshot = await userRef.get();
      let role: string;
      if (docSnapshot.exists) {
        // Update provider if missing
        const existing = docSnapshot.data() || {};
        if (!existing.provider && provider) {
          await userRef.update({ provider, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        role = existing.role || 'parent';
      } else {
        // For new users via Google, default role to 'parent'
        role = 'parent';

        const now = admin.firestore.FieldValue.serverTimestamp();
        const userDoc: any = {
          email: user.email || null,
          name: user.displayName || null,
          displayName: user.displayName || null,
          provider: provider || null,
          role,
          roles: [role],
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };

        await userRef.set(userDoc);
        functions.logger.info(`onAuthUserCreate: Created Firestore user doc for ${uid} provider=${provider}`);
      }

      // Set custom claims based on role
      const customClaims = {
        [role]: true,
        role,
      };

      try {
        await admin.auth().setCustomUserClaims(uid, customClaims);
        functions.logger.info(`Set custom claims for ${uid}: ${JSON.stringify(customClaims)}`);
      } catch (claimErr: any) {
        // In emulators or restricted environments setCustomUserClaims may fail.
        // Log full details and persist a fallback to the Firestore user doc so the client
        // and other services can still read role information from the user document.
        functions.logger.error(`Failed to set custom claims for ${uid}`, { error: claimErr?.message || claimErr });
        try {
          await userRef.set({ claimsFallback: customClaims, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
          functions.logger.info(`Persisted claimsFallback for ${uid} to Firestore user doc.`);
        } catch (persistErr: any) {
          functions.logger.error(`Failed to persist claimsFallback for ${uid}`, { error: persistErr?.message || persistErr });
        }
      }
    } catch (err: any) {
      functions.logger.error('onAuthUserCreate failed', { err });
    }
  });
