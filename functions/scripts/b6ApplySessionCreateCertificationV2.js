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

const CERTIFICATION_VERSION = 2;
const EXPECTED_SOURCE_CODE_CONTRACT = 'canonical_session_earning_id_and_service_month_v2';

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
  const outputPath = readArg('output', 'artifacts/b6-session-create-certification-v2.json');

  if (projectId !== 'tinysteps-react-v1') throw new Error(`Refusing unexpected project: ${projectId}`);
  if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new Error('Missing/invalid --month=YYYY-MM');
  if (maxDocs > 10000) throw new Error('--max-docs must be <= 10000');

  if (!admin.apps.length) admin.initializeApp({ projectId });
  const db = admin.firestore();

  const snapshot = await db.collection('teacherEarnings').limit(maxDocs + 1).get();
  const truncated = snapshot.docs.length > maxDocs;
  const docs = truncated ? snapshot.docs.slice(0, maxDocs) : snapshot.docs;
  const scannedRows = docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));
  const targetMonthRows = scannedRows.filter((row) => String(row.monthKey || '').trim() === monthKey);

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

  if (!readiness.ready || readiness.blockers.length !== 0) {
    throw new Error(`Refusing certification: ready=${readiness.ready}, blockers=${JSON.stringify(readiness.blockers)}`);
  }
  if (!fullLedgerEvidenceComplete || !legacyMonthCoverage.legacyMonthCoverageClean) {
    throw new Error('Refusing certification: full-ledger or canonical service-month evidence is not clean');
  }

  const certificationRef = db
    .collection('adminStats')
    .doc('teacherEarningsSessionCreateFastPath')
    .collection('months')
    .doc(monthKey);

  const certificationPayload = {
    monthKey,
    ready: true,
    certificationVersion: CERTIFICATION_VERSION,
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
    blockers: [],
    sourceCodeContract: EXPECTED_SOURCE_CODE_CONTRACT,
    source: 'b6_brick_7d2a_full_ledger_certification',
    evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
    certifiedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // The only production mutation in this script: one derived certification document.
  await certificationRef.set(certificationPayload, { merge: true });

  const verifiedSnap = await certificationRef.get();
  if (!verifiedSnap.exists) throw new Error('Certification read-back missing');
  const verified = verifiedSnap.data() || {};
  const verificationChecks = {
    monthKey: verified.monthKey === monthKey,
    ready: verified.ready === true,
    certificationVersion: verified.certificationVersion === CERTIFICATION_VERSION,
    fullLedgerEvidenceComplete: verified.fullLedgerEvidenceComplete === true,
    legacyMonthCoverageClean: verified.legacyMonthCoverageClean === true,
    duplicateSessionIdGroups: verified.duplicateSessionIdGroups === 0,
    nonCanonicalSessionRows: verified.nonCanonicalSessionRows === 0,
    sessionSourceMissingSessionIdRows: verified.sessionSourceMissingSessionIdRows === 0,
    missingTeacherIdRows: verified.missingTeacherIdRows === 0,
    blockers: Array.isArray(verified.blockers) && verified.blockers.length === 0,
    sourceCodeContract: verified.sourceCodeContract === EXPECTED_SOURCE_CODE_CONTRACT,
  };
  const verificationPassed = Object.values(verificationChecks).every(Boolean);
  if (!verificationPassed) {
    throw new Error(`Certification read-back verification failed: ${JSON.stringify(verificationChecks)}`);
  }

  const report = {
    ok: true,
    projectId,
    monthKey,
    mutationScope: `adminStats/teacherEarningsSessionCreateFastPath/months/${monthKey}`,
    sourceLedgerWrites: 0,
    certificationVersion: CERTIFICATION_VERSION,
    fullLedgerEvidenceComplete,
    scannedRows: scannedRows.length,
    analyzedTargetMonthRows: targetMonthRows.length,
    legacyMonthCoverageClean: legacyMonthCoverage.legacyMonthCoverageClean,
    readyForSessionCreateFastPath: readiness.ready,
    blockers: readiness.blockers,
    verificationPassed,
    verificationChecks,
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log('B6 v2 session-create certification applied and verified');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error('B6 v2 session-create certification failed', error);
  process.exitCode = 1;
});
