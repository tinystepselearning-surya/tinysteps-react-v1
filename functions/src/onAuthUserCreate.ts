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
      if (docSnapshot.exists) {
        // Update provider if missing
        const existing = docSnapshot.data() || {};
        if (!existing.provider && provider) {
          await userRef.update({ provider, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        return;
      }

      // For new users via Google, default role to 'parent'
      const role: any = 'parent';

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
    } catch (err: any) {
      functions.logger.error('onAuthUserCreate failed', { err });
    }
  });
