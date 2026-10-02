import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';

if (!admin.apps.length) admin.initializeApp();

const COLLECTION = 'attendanceValidationMonthlyParentProgress';
const START_MONTH = '2026-09';
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const ALLOWED_STATUSES = new Set(['not_started', 'in_progress', 'completed']);

type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

function cleanId(value: unknown, field: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > 180 || text.includes('/') || [...text].some((char) => char.charCodeAt(0) < 32)) {
    throw new HttpsError('invalid-argument', `${field} is invalid.`);
  }
  return text;
}

function cleanMonth(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!MONTH_RE.test(text) || text < START_MONTH) {
    throw new HttpsError('invalid-argument', 'monthKey must be a completed AVS month from 2026-09 onward.');
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const currentMonth = year && month ? `${year}-${month}` : '';
  if (!MONTH_RE.test(currentMonth)) {
    throw new HttpsError('internal', 'Unable to resolve the current IST month.');
  }
  if (text >= currentMonth) {
    throw new HttpsError('failed-precondition', 'Only fully completed months can be tracked.');
  }
  return text;
}

function cleanStatus(value: unknown): ProgressStatus {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!ALLOWED_STATUSES.has(text)) {
    throw new HttpsError('invalid-argument', 'status must be not_started, in_progress, or completed.');
  }
  return text as ProgressStatus;
}

function actorEmail(auth: unknown): string | null {
  const token = (auth as { token?: Record<string, unknown> } | null)?.token;
  return typeof token?.email === 'string' ? token.email : null;
}

export const updateAttendanceValidationMonthlyParentProgress = onCall({
  region: 'asia-south1',
  memory: '256MiB',
  invoker: 'public',
  labels: { 'avs-public-invoker': 'true' },
  timeoutSeconds: 60,
  maxInstances: 2,
}, async (request) => {
  await ensureAdmin(request.auth);
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in as an admin.');

  const parentId = cleanId(request.data?.parentId, 'parentId');
  const monthKey = cleanMonth(request.data?.monthKey);
  const status = cleanStatus(request.data?.status);
  const db = admin.firestore();

  const parentSnapshot = await db.collection('users').doc(parentId).get();
  const parentRole = String(parentSnapshot.data()?.role ?? '').trim().toLowerCase();
  if (!parentSnapshot.exists || parentRole !== 'parent') {
    throw new HttpsError('failed-precondition', 'The selected user is not a canonical parent.');
  }

  const progressId = `${monthKey}__${parentId}`;
  const ref = db.collection(COLLECTION).doc(progressId);

  if (status === 'not_started') {
    await ref.delete();
    return {
      ok: true,
      parentId,
      monthKey,
      status,
      updatedAt: null,
      completedAt: null,
    };
  }

  const existing = await ref.get();
  const existingData = existing.data() as Record<string, unknown> | undefined;
  const now = admin.firestore.Timestamp.now();
  const completedAt = status === 'completed'
    ? (
        existingData?.status === 'completed'
        && existingData.completedAt instanceof admin.firestore.Timestamp
          ? existingData.completedAt
          : now
      )
    : null;

  await ref.set({
    schemaVersion: 1,
    parentId,
    monthKey,
    status,
    updatedAt: now,
    updatedByUid: uid,
    updatedByEmail: actorEmail(request.auth),
    completedAt,
  });

  return {
    ok: true,
    parentId,
    monthKey,
    status,
    updatedAt: now.toDate().toISOString(),
    completedAt: completedAt?.toDate().toISOString() ?? null,
  };
});
