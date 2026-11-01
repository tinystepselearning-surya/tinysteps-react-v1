import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  loadCurrentAuthAccessPrincipal,
  principalHasGlobalRole,
} from './schoolOS/identity/authAccessAuthorization';
import {
  summarizeProspectiveLeadCandidates,
  type AcquisitionLeadCandidate,
} from './prospectiveAcquisitionMetrics';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const CUTOVER_DATE_KEY = '2026-11-01';
const MAX_SCAN_PER_FIELD = 1200;
const MAX_RANGE_DAYS = 93;
const TIMESTAMP_FIELDS = ['firstInquiryAt', 'receivedAt', 'requestedAt', 'createdAt'] as const;
const CORS_ORIGINS = [
  'http://localhost:5173',
  'https://tinystepslearning.com',
  'https://www.tinystepslearning.com',
  'https://tinysteps-react-v1.web.app',
  'https://tinysteps-react-v1.firebaseapp.com',
];

type Request = { startDateKey?: string; endDateKey?: string };

function parseDateKey(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpsError('invalid-argument', field + ' must be YYYY-MM-DD.');
  }
  const utc = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 10) !== value) {
    throw new HttpsError('invalid-argument', field + ' is not a valid date.');
  }
  return value;
}

function istStartMs(dateKey: string): number {
  return Date.parse(dateKey + 'T00:00:00+05:30');
}

async function assertAcquisitionReader(auth: { uid?: string } | null | undefined): Promise<void> {
  const uid = typeof auth?.uid === 'string' ? auth.uid.trim() : '';
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  try {
    const principal = await loadCurrentAuthAccessPrincipal({
      db: admin.firestore(),
      firebaseUid: uid,
    });
    if (
      principalHasGlobalRole(principal, 'admin') ||
      principalHasGlobalRole(principal, 'founder')
    ) return;
  } catch {
    // Never expose identity-model or role details in responses.
  }
  throw new HttpsError('permission-denied', 'Administrator or founder access required.');
}

/**
 * READ-ONLY. No phone/name/lead identifiers, hashes, or row-level data returned.
 * Counts NEW opportunities only, not total later inquiry submissions.
 */
export const getProspectiveAcquisitionSummary = onCall<Request>(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
    cors: CORS_ORIGINS,
  },
  async (request) => {
    await assertAcquisitionReader(request.auth);
    const startDateKey = parseDateKey(request.data?.startDateKey, 'startDateKey');
    const endDateKey = parseDateKey(request.data?.endDateKey, 'endDateKey');
    if (startDateKey < CUTOVER_DATE_KEY || endDateKey < startDateKey) {
      throw new HttpsError('invalid-argument', 'Reporting starts 1 November 2026 IST.');
    }
    const firstMs = istStartMs(startDateKey);
    const endExclusiveMs = istStartMs(endDateKey) + 24 * 60 * 60 * 1000;
    if (endExclusiveMs - firstMs > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      throw new HttpsError('invalid-argument', 'Reporting range is limited to 93 days.');
    }

    const db = admin.firestore();
    // Four single-field timestamp queries; no full July-October historical scan.
    const slices = await Promise.all(TIMESTAMP_FIELDS.map(async (field) => {
      return db.collection('leads')
        .where(field, '>=', admin.firestore.Timestamp.fromMillis(firstMs))
        .where(field, '<', admin.firestore.Timestamp.fromMillis(endExclusiveMs))
        .limit(MAX_SCAN_PER_FIELD + 1)
        .get();
    }));

    // Fail closed: never present truncated query results as accurate totals.
    if (slices.some((snapshot) => snapshot.size > MAX_SCAN_PER_FIELD)) {
      throw new HttpsError('resource-exhausted', 'Acquisition report exceeds the safe query limit.');
    }

    const byId = new Map<string, AcquisitionLeadCandidate>();
    for (const snapshot of slices) {
      for (const document of snapshot.docs) {
        if (!byId.has(document.id)) {
          byId.set(document.id, { id: document.id, data: document.data() });
        }
      }
    }

    const metrics = summarizeProspectiveLeadCandidates([...byId.values()], firstMs, endExclusiveMs);
    return {
      startDateKey,
      endDateKey,
      cutoverDateKey: CUTOVER_DATE_KEY,
      ...metrics,
      canonicalizationNote: 'Canonical website leads only. Recently submitted leads may appear after processing.',
      repeatsAvailable: false,
    };
  },
);
