import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard';
import {
  analyzeTeacherEarningsCanonicalCoverage,
  type TeacherEarningAuditRow,
} from './helpers/teacherEarningsCanonicalAudit';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const DEFAULT_MAX_DOCS = 5000;
const MAX_ALLOWED_DOCS = 10000;
const DEFAULT_SAMPLE_LIMIT = 20;

function currentMonthKeyIST(): string {
  const now = new Date(Date.now() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function normalizeMonthKey(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return currentMonthKeyIST();
  if (!/^\d{4}-\d{2}$/.test(raw)) {
    throw new HttpsError('invalid-argument', 'monthKey must be YYYY-MM');
  }
  return raw;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

/**
 * Admin-only, read-only B6 integrity audit.
 *
 * It intentionally queries one explicit teacherEarnings month only and performs no writes.
 * The extra +1 document is used solely to report truncation without running a second query.
 */
export const auditTeacherEarningsCanonicalCoverage = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const monthKey = normalizeMonthKey(request.data?.monthKey);
    const maxDocs = clampInt(request.data?.maxDocs, DEFAULT_MAX_DOCS, 1, MAX_ALLOWED_DOCS);
    const sampleLimit = clampInt(request.data?.sampleLimit, DEFAULT_SAMPLE_LIMIT, 0, 100);

    const snapshot = await admin
      .firestore()
      .collection('teacherEarnings')
      .where('monthKey', '==', monthKey)
      .limit(maxDocs + 1)
      .get();

    const truncated = snapshot.docs.length > maxDocs;
    const docs = truncated ? snapshot.docs.slice(0, maxDocs) : snapshot.docs;
    const rows: TeacherEarningAuditRow[] = docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() || {}),
    }));

    const coverage = analyzeTeacherEarningsCanonicalCoverage(rows, sampleLimit);

    return {
      ok: true,
      readOnly: true,
      monthKey,
      maxDocs,
      truncated,
      scannedRows: rows.length,
      coverage,
      note:
        'coverageCleanForFurtherDeltaDesign is evidence only. It does not enable incremental finance writes by itself.',
    };
  },
);
