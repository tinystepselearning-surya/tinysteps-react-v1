'use strict';

const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');
const {
  analyzeTeacherEarningsCanonicalCoverage,
} = require('../lib/helpers/teacherEarningsCanonicalAudit');
const {
  analyzeTeacherEarningsCanonicalServiceMonthCoverage,
} = require('../lib/helpers/teacherEarningsServiceMonthEvidence');
const {
  evaluateTeacherEarningsSessionCreateFastPathReadiness,
} = require('../lib/helpers/teacherEarningsSessionCreateFastPath');

function readArg(name, fallback = '') {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function main() {
  const projectId = readArg('project', process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '');
  const monthKey = readArg('month');
  const maxDocs = positiveInt(readArg('max-docs', '10000'), 10000);
  const sampleLimit = positiveInt(readArg('sample-limit', '100'), 100);
  const outputPath = readArg('output', 'artifacts/b6-production-session-create-evidence-v2.json');

  if (!projectId) throw new Error('Missing --project');
  if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new Error('Missing/invalid --month=YYYY-MM');
  if (maxDocs > 10000) throw new Error('--max-docs must be <= 10000 to match the deployed audit bound');

  if (!admin.apps.length) admin.initializeApp({ projectId });
  const db = admin.firestore();

  // READ ONLY: one bounded source-ledger read. No source or derived Firestore writes occur here.
  const snapshot = await db.collection('teacherEarnings').limit(maxDocs + 1).get();
  const truncated = snapshot.docs.length > maxDocs;
  const docs = truncated ? snapshot.docs.slice(0, maxDocs) : snapshot.docs;
  const rows = docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));
  const targetMonthRows = rows.filter((row) => String(row.monthKey || '').trim() === monthKey);

  // Mirrors deployed 7D2A certification evidence, but never executes apply/write behavior.
  const coverage = analyzeTeacherEarningsCanonicalCoverage(targetMonthRows, sampleLimit);
  const legacyMonthCoverage = await analyzeTeacherEarningsCanonicalServiceMonthCoverage(
    db,
    rows,
    monthKey,
    sampleLimit,
  );
  const fullLedgerEvidenceComplete = !truncated;
  const readiness = evaluateTeacherEarningsSessionCreateFastPathReadiness({
    fullLedgerEvidenceComplete,
    coverage,
    legacyMonthCoverage,
  });

  const report = {
    ok: true,
    readOnly: true,
    source: 'b6_production_session_create_evidence_v2_canonical_service_month',
    projectId,
    deployedMainSha: '4381b2593e1fc46817ed8e9f1ec4e283b7a51cd7',
    monthKey,
    maxDocs,
    truncated,
    scannedRows: rows.length,
    analyzedTargetMonthRows: targetMonthRows.length,
    fullLedgerEvidenceComplete,
    coverage,
    legacyMonthCoverage,
    readyForSessionCreateFastPath: readiness.ready,
    blockers: readiness.blockers,
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('B6 production teacher-earnings v2 evidence summary');
  console.log(JSON.stringify({
    projectId,
    deployedMainSha: report.deployedMainSha,
    monthKey,
    scannedRows: rows.length,
    analyzedTargetMonthRows: targetMonthRows.length,
    truncated,
    fullLedgerEvidenceComplete,
    activeRows: coverage.activeRows,
    archivedRows: coverage.archivedRows,
    voidRows: coverage.voidRows,
    standaloneRows: coverage.standaloneRows,
    sessionLinkedRows: coverage.sessionLinkedRows,
    canonicalSessionRows: coverage.canonicalSessionRows,
    nonCanonicalSessionRows: coverage.nonCanonicalSessionRows,
    duplicateSessionIdGroups: coverage.duplicateSessionIdGroups,
    duplicateSessionRows: coverage.duplicateSessionRows,
    sessionSourceMissingSessionIdRows: coverage.sessionSourceMissingSessionIdRows,
    missingTeacherIdRows: coverage.missingTeacherIdRows,
    uniqueTeacherCount: coverage.uniqueTeacherCount,
    activeRowsMissingOrInvalidMonthKey: legacyMonthCoverage.activeRowsMissingOrInvalidMonthKey,
    derivedTargetRowsMissingOrInvalidMonthKey: legacyMonthCoverage.derivedTargetRowsMissingOrInvalidMonthKey,
    derivedTargetRowsStoredInDifferentMonth: legacyMonthCoverage.derivedTargetRowsStoredInDifferentMonth,
    storedTargetRowsDerivedIntoDifferentMonth: legacyMonthCoverage.storedTargetRowsDerivedIntoDifferentMonth,
    undatedRowsMissingOrInvalidMonthKey: legacyMonthCoverage.undatedRowsMissingOrInvalidMonthKey,
    sessionEvidence: legacyMonthCoverage.sessionEvidence,
    legacyMonthCoverageClean: legacyMonthCoverage.legacyMonthCoverageClean,
    coverageCleanForFurtherDeltaDesign: coverage.coverageCleanForFurtherDeltaDesign,
    readyForSessionCreateFastPath: readiness.ready,
    blockers: readiness.blockers,
    outputPath,
  }, null, 2));
}

main().catch((error) => {
  console.error('B6 production v2 evidence audit failed', error);
  process.exitCode = 1;
});
