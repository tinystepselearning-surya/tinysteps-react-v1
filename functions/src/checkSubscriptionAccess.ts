import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) {
  admin.initializeApp();
}

// Feature matrix – same as your JS version
const FEATURE_ACCESS: Record<string, string[]> = {
  'daily-practice': ['free', 'starter', 'pro', 'premium'],
  worksheets: ['free', 'starter', 'pro', 'premium'],
  'essay-scoring': ['pro', 'premium'],
  'weekly-reports': ['free', 'starter', 'pro', 'premium'],
  'voice-coach': ['premium'],
  'ai-tutor': ['premium'],
};

interface CheckSubscriptionAccessRequest {
  parentId: string;
  featureName: string;
}

interface CheckSubscriptionAccessResponse {
  hasAccess: boolean;
  tier: string;
}

export const checkSubscriptionAccess = onCall(
  {
    region: 'asia-south1',
    memory: '128MiB',
    timeoutSeconds: 30,
  },
  async (request): Promise<CheckSubscriptionAccessResponse> => {
    const { parentId, featureName } =
      request.data as Partial<CheckSubscriptionAccessRequest>;

    // ✅ Read from request.data (v2 style)
    if (!parentId || typeof parentId !== 'string') {
      throw new HttpsError('invalid-argument', 'parentId is required');
    }
    if (!featureName || typeof featureName !== 'string') {
      throw new HttpsError('invalid-argument', 'featureName is required');
    }

    // (Optional but recommended) basic auth check
    const callerUid = request.auth?.uid || null;
    const isAdmin =
      !!request.auth?.token?.admin ||
      request.auth?.token?.role === 'admin';

    if (!callerUid) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Only allow:
    // - the same parent, OR
    // - an admin
    if (!isAdmin && callerUid !== parentId) {
      throw new HttpsError(
        'permission-denied',
        'Not allowed to check another parent’s subscription.'
      );
    }

    try {
      const subDoc = await admin
        .firestore()
        .collection('subscriptions')
        .doc(parentId)
        .get();

      const tier =
        (subDoc.exists ? (subDoc.data()?.tier as string) : null) || 'free';

      const allowed =
        FEATURE_ACCESS[featureName]?.includes(tier) ?? false;

      logger.info('checkSubscriptionAccess', {
        parentId,
        featureName,
        tier,
        allowed,
        callerUid,
      });

      return { hasAccess: allowed, tier };
    } catch (err: any) {
      logger.error('checkSubscriptionAccess failed', {
        err: err?.message || String(err),
        parentId,
        featureName,
      });
      throw new HttpsError(
        'internal',
        'Failed to check subscription access'
      );
    }
  }
);
