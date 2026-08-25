'use strict';

const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');
const {
  analyzeTeacherEarningsCanonicalCoverage,
  analyzeTeacherEarningsLegacyMonthCoverage,
} = require('../lib/helpers/teacherEarningsCanonicalAudit');
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
  const sampleLimit = positiveInt(readArg('sample-limit', '20'), 20);
  const outputPath = readArg(
    'output',
    'artifacts/b6-production-session-create-evidence.json',
  );

  if (!projectId) throw new Error('Missing --project');
  if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new Error('Missing/invalid --month=YYYY-MM');
  if (maxDocs > 10000) throw new Error('--max-docs must be <= 10000 to match the deployed audit bound');

  if (!admin.apps.length) admin.initializeApp({ projectId });
  const db = admin.firestore();

  const snapshot = await db.collection('teacherEarnings').limit(maxDocs + 1).get();
  const truncated = snapshot.docs.length > maxDocs;
  const docs = truncated ? snapshot.docs.slice(0, maxDocs) : snapshot.docs;
  const rows = docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));

  const coverage = analyzeTeacherEarningsCanonicalCoverage(rows, sampleLimit);
  const legacyMonthCoverage = analyzeTeacherEarningsLegacyMonthCoverage(rows, monthKey, sampleLimit);
  const fullLedgerEvidenceComplete = !truncated;
  const readiness = evaluateTeacherEarningsSessionCreateFastPathReadiness({
    fullLedgerEvidenceComplete,
    coverage,
    legacyMonthCoverage,
  });

  const report = {
    ok: true,
    readOnly: true,
    source: 'b6_production_session_create_evidence_v1',
    projectId,
    monthKey,
    maxDocs,
    truncated,
    scannedRows: rows.length,
    fullLedgerEvidenceComplete,
    coverage,
    legacyMonthCoverage,
    readyForSessionCreateFastPath: readiness.ready,
    blockers: readiness.blockers,
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('B6 production teacher-earnings evidence summary');
  console.log(JSON.stringify({
    projectId,
    monthKey,
    scannedRows: rows.length,
    truncated,
    fullLedgerEvidenceComplete,
    activeRows: coverage.activeRows,
    sessionLinkedRows: coverage.sessionLinkedRows,
    canonicalSessionRows: coverage.canonicalSessionRows,
    nonCanonicalSessionRows: coverage.nonCanonicalSessionRows,
    duplicateSessionIdGroups: coverage.duplicateSessionIdGroups,
    sessionSourceMissingSessionIdRows: coverage.sessionSourceMissingSessionIdRows,
    missingTeacherIdRows: coverage.missingTeacherIdRows,
    legacyMonthCoverageClean: legacyMonthCoverage.legacyMonthCoverageClean,
    readyForSessionCreateFastPath: readiness.ready,
    blockers: readiness.blockers,
    outputPath,
  }, null, 2));
}

main().catch((error) => {
  console.error('B6 production evidence audit failed', error);
  process.exitCode = 1;
});
