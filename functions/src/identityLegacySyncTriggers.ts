import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import {
  handleLegacyIdentityWrite,
  type LegacyIdentitySourceCollection,
} from './schoolOS/identity/legacySync';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';

function docData(
  snapshot: FirebaseFirestore.DocumentSnapshot | undefined,
): FirebaseFirestore.DocumentData | null {
  if (!snapshot?.exists) return null;
  return snapshot.data() || {};
}

function legacyIdentityTrigger(
  sourceCollection: LegacyIdentitySourceCollection,
  document: string,
) {
  return onDocumentWritten(
    {
      document,
      region: REGION,
      retry: true,
      memory: '256MiB',
      timeoutSeconds: 60,
    },
    async (event) => {
      const sourceId = String(
        event.params.sourceId || '',
      ).trim();
      if (!sourceId) return;

      await handleLegacyIdentityWrite({
        sourceCollection,
        sourceId,
        beforeData: docData(event.data?.before),
        afterData: docData(event.data?.after),
      });
    },
  );
}

export const onWave1LegacyUserIdentityWrite =
  legacyIdentityTrigger(
    'users',
    'users/{sourceId}',
  );

export const onWave1LegacyKidIdentityWrite =
  legacyIdentityTrigger(
    'kids',
    'kids/{sourceId}',
  );

export const onWave1LegacySchoolIdentityWrite =
  legacyIdentityTrigger(
    'schools',
    'schools/{sourceId}',
  );

export const onWave1LegacySchoolUserIdentityWrite =
  legacyIdentityTrigger(
    'schoolUsers',
    'schoolUsers/{sourceId}',
  );
