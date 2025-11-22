import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) {
  admin.initializeApp();
}

// Keep roles aligned with your app
type TinyStepsRole = 'admin' | 'teacher' | 'parent' | 'kid' | 'learningPartner';

export const onAuthUserCreate = functions
  .region('asia-south1')
  .auth.user()
  .onCreate(async (user) => {
    try {
      const uid = user.uid;

      // Try to infer provider (google.com, password, etc.)
      const providerId = user.providerData?.[0]?.providerId ?? null;
      const provider = providerId || null;

      const db = admin.firestore();
      const userRef = db.collection('users').doc(uid);
      const docSnapshot = await userRef.get();

      // Default role for self-signups is parent
      let role: TinyStepsRole = 'parent';

      if (docSnapshot.exists) {
        // If an admin/LP created the user beforehand, reuse that role
        const existing = docSnapshot.data() || {};

        // Backfill provider if missing
        if (!existing.provider && provider) {
          await userRef.update({
            provider,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        if (typeof existing.role === 'string') {
          role = existing.role as TinyStepsRole;
        }
      } else {
        // New user created directly via Auth (e.g., Google sign-in / email+password)
        const now = admin.firestore.FieldValue.serverTimestamp();
        const userDoc: any = {
          email: user.email ?? null,
          name: user.displayName ?? null,
          displayName: user.displayName ?? null,
          provider,
          role,
          roles: [role],
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };

        await userRef.set(userDoc);
        logger.info('onAuthUserCreate: Created Firestore user doc', {
          uid,
          provider,
        });
      }

      // Custom claims for RBAC – matches your firestore.rules usage
      const customClaims: Record<string, unknown> = {
        role,
        [role]: true,
      };

      try {
        await admin.auth().setCustomUserClaims(uid, customClaims);
        logger.info('onAuthUserCreate: Set custom claims', {
          uid,
          claims: customClaims,
        });
      } catch (claimErr: any) {
        // On emulator or restricted envs this can fail – so we fall back
        logger.error('onAuthUserCreate: Failed to set custom claims', {
          uid,
          error: claimErr?.message || String(claimErr),
        });

        try {
          await userRef.set(
            {
              claimsFallback: customClaims,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          logger.info(
            'onAuthUserCreate: Persisted claimsFallback to Firestore user doc',
            { uid }
          );
        } catch (persistErr: any) {
          logger.error(
            'onAuthUserCreate: Failed to persist claimsFallback',
            {
              uid,
              error: persistErr?.message || String(persistErr),
            }
          );
        }
      }

      // ---- 🔹 Audit log for new account creation (admin-only analytics) ----
      try {
        await db.collection('auditLogs').add({
          type: 'auth_user_created',
          uid,
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          provider,
          role,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          source: 'auth_onCreate',
        });
        logger.info('onAuthUserCreate: auditLogs entry created', { uid, role });
      } catch (auditErr: any) {
        // Do NOT fail user creation if audit logging fails – just log the error
        logger.error('onAuthUserCreate: Failed to write audit log', {
          uid,
          error: auditErr?.message || String(auditErr),
        });
      }
    } catch (err: any) {
      logger.error('onAuthUserCreate failed', {
        error: err?.message || String(err),
      });
    }
  });
