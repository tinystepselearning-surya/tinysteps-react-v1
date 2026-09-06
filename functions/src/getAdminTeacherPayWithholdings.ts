import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MAX_SCAN = 1000;
const CALLABLE_CORS_ORIGINS: Array<string | RegExp> = [
  'http://localhost:5173',
  'https://tinystepslearning.com',
  'https://www.tinystepslearning.com',
  'https://tinysteps-react-v1.web.app',
  'https://tinysteps-react-v1.firebaseapp.com',
];

function clean(value: unknown, maxLen = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

function normalizeRole(value: unknown): string {
  const raw = clean(value, 80).toLowerCase();
  return raw === 'learningpartner' ? 'learning-partner' : raw;
}

function money(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  if (value && typeof value === 'object' && 'seconds' in value) {
    const seconds = Number((value as { seconds?: unknown }).seconds);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

async function assertAdmin(auth: { uid?: string; token?: Record<string, unknown> } | undefined): Promise<string> {
  const uid = clean(auth?.uid, 160);
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  if (normalizeRole(auth?.token?.role) === 'admin') return uid;
  const userSnap = await admin.firestore().collection('users').doc(uid).get();
  if (normalizeRole(userSnap.data()?.role) !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  return uid;
}

function serializeTimestamp(value: unknown): string | null {
  const ms = toMillis(value);
  return ms > 0 ? new Date(ms).toISOString() : null;
}

function serializeRow(id: string, data: Record<string, unknown>) {
  return {
    id,
    ledgerVersion: Number(data.ledgerVersion || 0),
    recordType: clean(data.recordType, 80) || null,
    sessionId: clean(data.sessionId, 160) || id,
    teacherEarningId: clean(data.teacherEarningId, 160) || null,
    enrollmentId: clean(data.enrollmentId, 160) || null,
    kidId: clean(data.kidId, 160) || null,
    parentId: clean(data.parentId, 160) || null,
    teacherId: clean(data.teacherId, 160) || null,
    courseId: clean(data.courseId, 160) || null,
    serviceDate: clean(data.serviceDate, 40) || null,
    serviceMonthKey: clean(data.serviceMonthKey, 20) || null,
    currency: clean(data.currency, 20) || 'INR',
    teacherRateSnapshot: money(data.teacherRateSnapshot),
    expectedTeacherAmount: money(data.expectedTeacherAmount),
    creditedTeacherAmount: money(data.creditedTeacherAmount),
    schoolRetainedAmount: money(data.schoolRetainedAmount),
    teacherPayDisposition: clean(data.teacherPayDisposition, 80) || null,
    reasonCode: clean(data.reasonCode, 120) || null,
    reason: clean(data.reason, 2000) || null,
    attendanceCorrectionId: clean(data.attendanceCorrectionId, 160) || null,
    teacherPayDecisionId: clean(data.teacherPayDecisionId, 160) || null,
    decidedByUid: clean(data.decidedByUid, 160) || null,
    decidedByName: clean(data.decidedByName, 320) || null,
    decidedAt: serializeTimestamp(data.decidedAt),
    recordedAt: serializeTimestamp(data.recordedAt || data.createdAt),
    status: clean(data.status, 80) || null,
    source: clean(data.source, 120) || null,
  };
}

export const getAdminTeacherPayWithholdings = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
    cors: CALLABLE_CORS_ORIGINS,
  },
  async (request) => {
    await assertAdmin(request.auth);
    const payload = (request.data || {}) as Record<string, unknown>;
    const monthKey = clean(payload.monthKey, 20);
    const teacherId = clean(payload.teacherId, 160);
    const reasonCode = clean(payload.reasonCode, 120).toLowerCase();
    const sessionId = clean(payload.sessionId, 160);
    const requestedLimit = Number(payload.limit);
    const rowLimit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 500)
      : 200;

    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      throw new HttpsError('invalid-argument', 'monthKey must use YYYY-MM format.');
    }

    const db = admin.firestore();
    let docs: admin.firestore.QueryDocumentSnapshot[] = [];
    let truncated = false;

    if (sessionId) {
      const snap = await db.collection('teacherPayWithholdings').doc(sessionId).get();
      if (snap.exists) docs = [snap as admin.firestore.QueryDocumentSnapshot];
    } else {
      const snap = await db
        .collection('teacherPayWithholdings')
        .where('serviceMonthKey', '==', monthKey)
        .limit(MAX_SCAN)
        .get();
      docs = snap.docs;
      truncated = snap.size >= MAX_SCAN;
    }

    const filtered = docs
      .map((docSnap) => serializeRow(docSnap.id, (docSnap.data() || {}) as Record<string, unknown>))
      .filter((row) => row.serviceMonthKey === monthKey)
      .filter((row) => !teacherId || row.teacherId === teacherId)
      .filter((row) => !reasonCode || row.reasonCode === reasonCode)
      .filter((row) => row.status === 'active')
      .sort((a, b) => {
        const left = a.serviceDate ? new Date(`${a.serviceDate}T00:00:00Z`).getTime() : 0;
        const right = b.serviceDate ? new Date(`${b.serviceDate}T00:00:00Z`).getTime() : 0;
        return right - left || String(b.id).localeCompare(String(a.id));
      });

    const rows = filtered.slice(0, rowLimit);
    const byReason: Record<string, { count: number; amount: number }> = {};
    let totalRetained = 0;
    const teacherIds = new Set<string>();
    for (const row of filtered) {
      totalRetained += row.schoolRetainedAmount;
      if (row.teacherId) teacherIds.add(row.teacherId);
      const key = row.reasonCode || 'unspecified';
      const bucket = byReason[key] || { count: 0, amount: 0 };
      bucket.count += 1;
      bucket.amount += row.schoolRetainedAmount;
      byReason[key] = bucket;
    }

    return {
      ok: true,
      monthKey,
      filters: {
        teacherId: teacherId || null,
        reasonCode: reasonCode || null,
        sessionId: sessionId || null,
      },
      summary: {
        activeWithholdingCount: filtered.length,
        totalSchoolRetainedAmount: totalRetained,
        teacherCount: teacherIds.size,
        byReason,
      },
      rows,
      returnedCount: rows.length,
      matchedCount: filtered.length,
      truncated: truncated || filtered.length > rowLimit,
      scanLimit: MAX_SCAN,
    };
  },
);
