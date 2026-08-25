import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard';
import {
  analyzeTeacherEarningsCanonicalCoverage,
  type TeacherEarningAuditRow,
} from './helpers/teacherEarningsCanonicalAudit';
import { analyzeTeacherEarningsCanonicalServiceMonthCoverage } from './helpers/teacherEarningsServiceMonthEvidence';
import { evaluateTeacherEarningsSessionCreateFastPathReadiness } from './helpers/teacherEarningsSessionCreateFastPath';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const DEFAULT_MAX_DOCS = 5000;
const MAX_ALLOWED_DOCS = 10000;
const DEFAULT_SAMPLE_LIMIT = 20;
export const TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION = 2;

function currentMonthKeyIST(): string {
  const now = new Date(Date.now() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
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
  return docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));
}

/**
 * Brick 7D2A admin-only certification gate for the future session-create incremental path.
 *
 * Dry-run is the default. apply=true writes only one derived adminStats certification document.
 * The source teacherEarnings ledger is never repaired, rewritten, archived, or otherwise mutated.
 * Session-linked month ownership is validated against linked classSessions canonical service dates;
 * ledger processing timestamps are never treated as service dates.
 * A blocked/incomplete apply explicitly stores ready=false so an older certification cannot linger.
 */
export const certifyTeacherEarningsSessionCreateFastPath = onCall(
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
    const apply = request.data?.apply === true;

    const db = admin.firestore();
    const snapshot = await db.collection('teacherEarnings').limit(maxDocs + 1).get();
    const truncated = snapshot.docs.length > maxDocs;
    const docs = truncated ? snapshot.docs.slice(0, maxDocs) : snapshot.docs;
    const scannedRows = toAuditRows(docs);
    const targetMonthRows = scannedRows.filter(
      (row) => String(row.monthKey || '').trim() === monthKey,
    );

    const coverage = analyzeTeacherEarningsCanonicalCoverage(targetMonthRows, sampleLimit);
    const legacyMonthCoverage = await analyzeTeacherEarningsCanonicalServiceMonthCoverage(
      db,
      scannedRows,
      monthKey,
      sampleLimit,
    );
    const fullLedgerEvidenceComplete = !truncated;
    const readiness = evaluateTeacherEarningsSessionCreateFastPathReadiness({
      fullLedgerEvidenceComplete,
      coverage,
      legacyMonthCoverage,
    });

    const certificationPayload = {
      monthKey,
      ready: readiness.ready,
      certificationVersion: TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
      fullLedgerEvidenceComplete,
      scannedRows: scannedRows.length,
      analyzedTargetMonthRows: targetMonthRows.length,
      canonicalSessionRows: coverage.canonicalSessionRows,
      sessionLinkedRows: coverage.sessionLinkedRows,
      duplicateSessionIdGroups: coverage.duplicateSessionIdGroups,
      nonCanonicalSessionRows: coverage.nonCanonicalSessionRows,
      sessionSourceMissingSessionIdRows: coverage.sessionSourceMissingSessionIdRows,
      missingTeacherIdRows: coverage.missingTeacherIdRows,
      legacyMonthCoverageClean: legacyMonthCoverage.legacyMonthCoverageClean,
      sessionEvidence: legacyMonthCoverage.sessionEvidence,
      blockers: readiness.blockers,
      sourceCodeContract: 'canonical_session_earning_id_and_service_month_v2',
      source: 'b6_brick_7d2a_full_ledger_certification',
      evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(readiness.ready
        ? { certifiedAt: admin.firestore.FieldValue.serverTimestamp() }
        : { invalidatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    };

    if (apply) {
      await db
        .collection('adminStats')
        .doc('teacherEarningsSessionCreateFastPath')
        .collection('months')
        .doc(monthKey)
        .set(certificationPayload, { merge: true });
    }

    return {
      ok: true,
      readOnly: !apply,
      applied: apply,
      monthKey,
      maxDocs,
      truncated,
      fullLedgerEvidenceComplete,
      scannedRows: scannedRows.length,
      analyzedTargetMonthRows: targetMonthRows.length,
      coverage,
      legacyMonthCoverage,
      readyForSessionCreateFastPath: readiness.ready,
      blockers: readiness.blockers,
      certificationVersion: TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
      note: !apply
        ? 'Dry-run only. Re-run with apply=true only after reviewing the complete canonical service-month evidence.'
        : readiness.ready
          ? 'Certification stored for this month. Session-create deltas are still not enabled until Brick 7D2B.'
          : 'Certification stored as disabled because the evidence was incomplete or unsafe.',
    };
  },
);
