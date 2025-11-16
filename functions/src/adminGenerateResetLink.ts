import * as fns from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
// Using fns.logger for logging

if (!admin.apps.length) {
  admin.initializeApp();
}

interface GenerateResetLinkRequest {
  email: string;
}

interface GenerateResetLinkResponse {
  resetLink: string;
}

export const adminGenerateResetLink = onCall(
  {
    region: 'asia-south1',
    memory: '128MiB',
    timeoutSeconds: 30,
  },
  async (data: any, context: any) => {
    try {
      // Security check
      if (!context.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in');
      }

      // Fallback: allow caller with admin claim or Firestore role
      const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
      const callerData = callerDoc.data();
      const callerIsAdminClaim = (context.auth?.token?.admin === true) || (context.auth?.token?.role === 'admin');
      if (!((callerData && (callerData.roles?.includes('admin') || callerData.role === 'admin')) || callerIsAdminClaim)) {
        throw new HttpsError('permission-denied', 'Admin access required');
      }

      const { email } = data as GenerateResetLinkRequest;
      if (!email || typeof email !== 'string') {
        throw new HttpsError('invalid-argument', 'Email is required');
      }

      const resetLink = await admin.auth().generatePasswordResetLink(email);
  fns.logger.info(`Generated password reset link for ${email}`);
      return { resetLink } as GenerateResetLinkResponse;
    } catch (error: any) {
      if (error instanceof HttpsError) throw error;
  fns.logger.error('adminGenerateResetLink error', { error, caller: context.auth?.uid });
      throw new HttpsError('internal', 'Failed to generate password reset link');
    }
  }
);
