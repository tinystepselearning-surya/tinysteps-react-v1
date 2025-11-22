// functions/src/fetchAdminStats.ts
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface FetchAdminStatsRequest {
  limit?: number;
}

interface AdminUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: string;
}

interface FetchAdminStatsResponse {
  admins: AdminUser[];
  count: number;
}

export const fetchAdminStats = functions
  .region('asia-south1')
  .https.onCall(
    async (data: FetchAdminStatsRequest, context): Promise<FetchAdminStatsResponse> => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Must be logged in to fetch admin stats.'
        );
      }

      const claims = context.auth.token as any;
      const isAdmin = claims.admin === true || claims.role === 'admin';
      if (!isAdmin) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can fetch admin stats.'
        );
      }

      const db = admin.firestore();

      const requestedLimit = typeof data?.limit === 'number' ? data.limit : 10;
      const safeLimit =
        requestedLimit > 0 && requestedLimit <= 50 ? requestedLimit : 10;

      try {
        const snapshot = await db
          .collection('users')
          .where('role', '==', 'admin')
          .limit(safeLimit)
          .get();

        const admins: AdminUser[] = snapshot.docs.map((doc) => {
          const d = doc.data() || {};
          return {
            uid: doc.id,
            email: d.email ?? null,
            displayName: d.displayName ?? d.name ?? null,
            role: d.role ?? 'admin',
          };
        });

        return { admins, count: admins.length };
      } catch (err: any) {
        console.error('fetchAdminStats failed', err);
        throw new functions.https.HttpsError(
          'internal',
          'Failed to fetch admin stats.'
        );
      }
    }
  );
