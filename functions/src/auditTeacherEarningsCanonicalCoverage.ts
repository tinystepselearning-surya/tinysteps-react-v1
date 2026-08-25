import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard';
import {
  analyzeTeacherEarningsCanonicalCoverage,
  analyzeTeacherEarningsLegacyMonthCoverage,
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

function toAuditRows(
  docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[],
): TeacherEarningAuditRow[] {
  return docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() || {}),
  }));
}

/**
 * Admin-only, read-only B6 integrity audit.
 *
 * Default mode performs one bounded query for the explicit target month.
 * Optional includeLegacyMonthCoverage mode performs one bounded full-ledger scan instead so it
 * can detect active rows whose target month exists only in timestamps or conflicts with monthKey.
 * Neither mode performs Firestore writes or repairs.
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
    const includeLegacyMonthCoverage = request.data?.includeLegacyMonthCoverage === true;

    const collectionRef = admin.firestore().collection('teacherEarnings');
    const baseQuery = includeLegacyMonthCoverage
      ? collectionRef.limit(maxDocs + 1)
      : collectionRef.where('monthKey', '==', monthKey).limit(maxDocs + 1);

    const snapshot = await baseQuery.get();
    const truncated = snapshot.docs.length > maxDocs;
    const docs = truncated ? snapshot.docs.slice(0, maxDocs) : snapshot.docs;
    const scannedRows = toAuditRows(docs);

    const targetMonthRows = includeLegacyMonthCoverage
      ? scannedRows.filter((row) => String(row.monthKey || '').trim() === monthKey)
      : scannedRows;

    const coverage = analyzeTeacherEarningsCanonicalCoverage(targetMonthRows, sampleLimit);
    const legacyMonthCoverage = includeLegacyMonthCoverage
      ? analyzeTeacherEarningsLegacyMonthCoverage(scannedRows, monthKey, sampleLimit)
      : null;

    const fullLedgerEvidenceComplete = includeLegacyMonthCoverage && !truncated;
    const readyForMonthBoundReads = Boolean(
      fullLedgerEvidenceComplete &&
        coverage.coverageCleanForFurtherDeltaDesign &&
        legacyMonthCoverage?.legacyMonthCoverageClean,
    );
    const readyForFurtherDeltaDesign = readyForMonthBoundReads;

    return {
      ok: true,
      readOnly: true,
      monthKey,
      maxDocs,
      queryScope: includeLegacyMonthCoverage ? 'bounded_full_ledger' : 'explicit_month_only',
      includeLegacyMonthCoverage,
      truncated,
      scannedRows: scannedRows.length,
      analyzedTargetMonthRows: targetMonthRows.length,
      fullLedgerEvidenceComplete,
      coverage,
      legacyMonthCoverage,
      readyForMonthBoundReads,
      readyForFurtherDeltaDesign,
      note: truncated
        ? 'Audit evidence is incomplete because the bounded scan truncated. Do not use clean-looking partial results to enable read cutovers or incremental finance writes.'
        : includeLegacyMonthCoverage
          ? 'Read-only evidence only. A clean result supports the next design review but does not itself enable incremental finance writes.'
          : 'Explicit-month coverage only. Run again with includeLegacyMonthCoverage=true before month-bounding reads or expanding incremental finance behavior.',
    };
  },
);
