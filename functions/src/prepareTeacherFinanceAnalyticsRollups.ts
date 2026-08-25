import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard';
import {
  analyzeTeacherEarningsCanonicalCoverage,
  analyzeTeacherEarningsLegacyMonthCoverage,
  type TeacherEarningAuditRow,
} from './helpers/teacherEarningsCanonicalAudit';
import {
  buildTeacherFinanceAnalyticsProjection,
  evaluateTeacherFinanceRollupParity,
  type TeacherFinanceProjectionEarningRow,
} from './helpers/teacherFinanceAnalyticsProjection';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const DEFAULT_MAX_DOCS = 5000;
const MAX_ALLOWED_DOCS = 10000;
const DEFAULT_SAMPLE_LIMIT = 20;
const ANALYTICS_PROJECTION_VERSION = 1;
const ANALYTICS_PROJECTION_SOURCE = 'b6_teacher_earnings_certification_v1';
const ROLLUP_BATCH_SIZE = 400;

function normalizeMonthKey(value: unknown): string {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}$/.test(raw)) {
    throw new HttpsError('invalid-argument', 'monthKey is required in YYYY-MM format');
  }
  return raw;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function toRows(
  docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[],
): TeacherEarningAuditRow[] {
  return docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));
}

function groupTargetMonthRowsByTeacher(
  rows: TeacherEarningAuditRow[],
  monthKey: string,
): Map<string, TeacherFinanceProjectionEarningRow[]> {
  const byTeacher = new Map<string, TeacherFinanceProjectionEarningRow[]>();
  for (const row of rows) {
    if (String(row.monthKey || '').trim() !== monthKey) continue;
    const teacherId = String(row.teacherId || '').trim();
    if (!teacherId) continue;
    const bucket = byTeacher.get(teacherId) || [];
    bucket.push(row as TeacherFinanceProjectionEarningRow);
    byTeacher.set(teacherId, bucket);
  }
  return byTeacher;
}

function sample<T>(rows: T[], limit: number): T[] {
  return rows.length <= limit ? rows : rows.slice(0, limit);
}

async function setMonthReadiness(
  db: FirebaseFirestore.Firestore,
  monthKey: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await db
    .collection('adminStats')
    .doc('teacherFinanceAnalyticsProjection')
    .collection('months')
    .doc(monthKey)
    .set(
      {
        monthKey,
        analyticsProjectionVersion: ANALYTICS_PROJECTION_VERSION,
        source: ANALYTICS_PROJECTION_SOURCE,
        ...payload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

/**
 * B6 Brick 6B1.
 *
 * Admin-only, on-demand preparation of existing teacher monthly rollups for the Analytics read
 * cutover. This callable never writes teacherEarnings. It performs a bounded full-ledger evidence
 * scan so target-month rows hidden by missing/conflicting monthKey values cannot be missed.
 *
 * Dry-run is the default. `apply: true` is required to write analytics metadata to the derived
 * teacher-month rollups. Authoritative financial totals remain untouched.
 */
export const prepareTeacherFinanceAnalyticsRollups = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const monthKey = normalizeMonthKey(request.data?.monthKey);
    const apply = request.data?.apply === true;
    const maxDocs = clampInt(request.data?.maxDocs, DEFAULT_MAX_DOCS, 1, MAX_ALLOWED_DOCS);
    const sampleLimit = clampInt(request.data?.sampleLimit, DEFAULT_SAMPLE_LIMIT, 0, 100);
    const db = admin.firestore();

    const fullLedgerSnap = await db.collection('teacherEarnings').limit(maxDocs + 1).get();
    const truncated = fullLedgerSnap.docs.length > maxDocs;
    const scannedDocs = truncated ? fullLedgerSnap.docs.slice(0, maxDocs) : fullLedgerSnap.docs;
    const allRows = toRows(scannedDocs);
    const targetMonthRows = allRows.filter((row) => String(row.monthKey || '').trim() === monthKey);

    const canonicalCoverage = analyzeTeacherEarningsCanonicalCoverage(targetMonthRows, sampleLimit);
    const legacyMonthCoverage = analyzeTeacherEarningsLegacyMonthCoverage(allRows, monthKey, sampleLimit);
    const byTeacher = groupTargetMonthRowsByTeacher(allRows, monthKey);
    const teacherIds = Array.from(byTeacher.keys()).sort();

    const rollupRefs = teacherIds.map((teacherId) =>
      db.collection('teachers').doc(teacherId).collection('earnings').doc(monthKey),
    );
    const rollupSnaps = rollupRefs.length > 0 ? await db.getAll(...rollupRefs) : [];
    const rollupByTeacher = new Map<string, Record<string, unknown> | null>();
    teacherIds.forEach((teacherId, index) => {
      const snap = rollupSnaps[index];
      rollupByTeacher.set(teacherId, snap?.exists ? ((snap.data() || {}) as Record<string, unknown>) : null);
    });

    const teacherResults = teacherIds.map((teacherId) => {
      const rows = byTeacher.get(teacherId) || [];
      const projection = buildTeacherFinanceAnalyticsProjection(rows);
      const parity = evaluateTeacherFinanceRollupParity(projection, rollupByTeacher.get(teacherId));
      return {
        teacherId,
        rowCount: rows.length,
        projection,
        parity,
      };
    });

    const unsafeTeacherResults = teacherResults.filter((result) => !result.parity.safeToPrepare);
    const monthReadyToApply =
      !truncated &&
      canonicalCoverage.coverageCleanForFurtherDeltaDesign &&
      legacyMonthCoverage.legacyMonthCoverageClean &&
      unsafeTeacherResults.length === 0;

    const blockers: string[] = [];
    if (truncated) blockers.push('full_ledger_scan_truncated');
    if (!canonicalCoverage.coverageCleanForFurtherDeltaDesign) blockers.push('canonical_coverage_not_clean');
    if (!legacyMonthCoverage.legacyMonthCoverageClean) blockers.push('legacy_month_coverage_not_clean');
    if (unsafeTeacherResults.length > 0) blockers.push('teacher_rollup_parity_not_clean');

    let applied = false;
    let preparedTeacherCount = 0;

    if (apply) {
      await setMonthReadiness(db, monthKey, {
        ready: false,
        state: monthReadyToApply ? 'preparing' : 'blocked',
        invalidReason: blockers.join(',') || null,
        requestedBy: request.auth?.uid || null,
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (monthReadyToApply) {
        for (let offset = 0; offset < teacherResults.length; offset += ROLLUP_BATCH_SIZE) {
          const chunk = teacherResults.slice(offset, offset + ROLLUP_BATCH_SIZE);
          const batch = db.batch();
          for (const result of chunk) {
            const rollupRef = db
              .collection('teachers')
              .doc(result.teacherId)
              .collection('earnings')
              .doc(monthKey);
            batch.set(
              rollupRef,
              {
                analyticsProjectionVersion: ANALYTICS_PROJECTION_VERSION,
                unclassifiedEarnings: 0,
                analyticsProjectionPreparedSessionEarnings: result.projection.sessionEarnings,
                analyticsProjectionPreparedLedgerCount: result.projection.selectedEarningCount,
                analyticsProjectionSource: ANALYTICS_PROJECTION_SOURCE,
                analyticsProjectionPreparedBy: request.auth?.uid || null,
                analyticsProjectionPreparedAt: admin.firestore.FieldValue.serverTimestamp(),
                analyticsProjectionInvalidReason: admin.firestore.FieldValue.delete(),
                analyticsProjectionInvalidatedAt: admin.firestore.FieldValue.delete(),
              },
              { merge: true },
            );
          }
          await batch.commit();
          preparedTeacherCount += chunk.length;
        }

        await setMonthReadiness(db, monthKey, {
          ready: true,
          state: 'ready',
          invalidReason: null,
          teacherCount: teacherResults.length,
          ledgerRowCount: targetMonthRows.length,
          activeLedgerRowCount: canonicalCoverage.activeRows,
          preparedBy: request.auth?.uid || null,
          preparedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        applied = true;
      }
    }

    return {
      ok: true,
      readOnly: !apply,
      applyRequested: apply,
      applied,
      monthKey,
      maxDocs,
      truncated,
      scannedRows: allRows.length,
      targetMonthRows: targetMonthRows.length,
      teacherCount: teacherResults.length,
      preparedTeacherCount,
      monthReadyToApply,
      blockers,
      canonicalCoverage,
      legacyMonthCoverage,
      unsafeTeacherCount: unsafeTeacherResults.length,
      unsafeTeachers: sample(
        unsafeTeacherResults.map((result) => ({
          teacherId: result.teacherId,
          rowCount: result.rowCount,
          reasons: result.parity.reasons,
          deltas: result.parity.deltas,
          unclassifiedEarningCount: result.projection.unclassifiedEarningCount,
          unclassifiedEarnings: result.projection.unclassifiedEarnings,
          classificationConflictCount: result.projection.classificationConflictCount,
        })),
        sampleLimit,
      ),
      note: apply
        ? applied
          ? 'Analytics readiness metadata was written only to derived teacher-month rollups; teacherEarnings source ledger was not modified.'
          : 'No teacher rollup was marked ready because one or more safety gates failed. The month readiness marker remains false.'
        : 'Dry-run only. Re-run with apply=true only after reviewing a clean result.',
    };
  },
);
