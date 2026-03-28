import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;

interface LegacyFallbackUsageRequest {
  fallbackType?: string;
  reader?: string;
  kidId?: string | null;
  hitCount?: number;
  inputCount?: number;
}

function sanitizeMetricKey(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'unknown';
  return raw.replace(/[^a-z0-9_-]/g, '_').slice(0, 64) || 'unknown';
}

function toPositiveInt(value: unknown, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(1000, Math.floor(parsed)));
}

function dayKeyNowIST(): string {
  const shifted = new Date(Date.now() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const recordLegacyFallbackUsage = onCall<LegacyFallbackUsageRequest>(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }

    const fallbackType = sanitizeMetricKey(request.data?.fallbackType);
    const reader = sanitizeMetricKey(request.data?.reader);
    const actorRole = sanitizeMetricKey(request.auth?.token?.role);
    const hitCount = toPositiveInt(request.data?.hitCount, 1);
    const inputCount = toPositiveInt(request.data?.inputCount, 1);
    const dayKey = dayKeyNowIST();

    const docRef = admin
      .firestore()
      .collection('adminStats')
      .doc('legacyFallbackUsage')
      .collection('days')
      .doc(dayKey);

    await docRef.set(
      {
        dayKey,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalEvents: admin.firestore.FieldValue.increment(1),
        totalHits: admin.firestore.FieldValue.increment(hitCount),
        totalInputs: admin.firestore.FieldValue.increment(inputCount),
        [`byFallbackType.${fallbackType}.events`]: admin.firestore.FieldValue.increment(1),
        [`byFallbackType.${fallbackType}.hits`]: admin.firestore.FieldValue.increment(hitCount),
        [`byReader.${reader}.events`]: admin.firestore.FieldValue.increment(1),
        [`byReader.${reader}.hits`]: admin.firestore.FieldValue.increment(hitCount),
        [`byRole.${actorRole}.events`]: admin.firestore.FieldValue.increment(1),
        lastEvent: {
          fallbackType,
          reader,
          actorUid: request.auth.uid,
          actorRole,
          kidId: typeof request.data?.kidId === 'string' ? request.data.kidId.trim() || null : null,
          hitCount,
          inputCount,
          atMs: Date.now(),
        },
      },
      { merge: true },
    );

    return { ok: true, dayKey };
  },
);
