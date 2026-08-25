'use strict';

const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

const FIREBASE_WEB_API_KEY = 'AIzaSyBZ5h2M3hataZjWM7480e76QAiFmEVK37Y';
const CERTIFICATION_VERSION = 2;
const SOURCE_CODE_CONTRACT = 'canonical_session_earning_id_and_service_month_v2';
const AUTOMATION_UID = 'b6-session-create-certification-automation';

function readArg(name, fallback = '') {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function parseJsonResponse(response, label) {
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${label} returned non-JSON HTTP ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`${label} failed HTTP ${response.status}: ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

function loadScopedServiceAccount(projectId) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Missing scoped FIREBASE_SERVICE_ACCOUNT_JSON secret');

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }

  if (!serviceAccount || serviceAccount.project_id !== projectId) {
    throw new Error('Refusing service account for unexpected Firebase project');
  }
  if (
    typeof serviceAccount.client_email !== 'string' ||
    !serviceAccount.client_email.trim() ||
    typeof serviceAccount.private_key !== 'string' ||
    !serviceAccount.private_key.includes('BEGIN PRIVATE KEY')
  ) {
    throw new Error('Service account secret is missing required signing material');
  }

  return serviceAccount;
}

async function main() {
  const projectId = readArg('project');
  const monthKey = readArg('month');
  const outputPath = readArg('output', 'artifacts/b6-session-create-certification-callable-v2.json');

  if (projectId !== 'tinysteps-react-v1') throw new Error(`Refusing unexpected project: ${projectId}`);
  if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new Error('Missing/invalid --month=YYYY-MM');

  // Initialize from the already-stored service-account JSON so Firebase Admin signs the short-lived
  // custom token locally with the private key. This deliberately avoids IAM signBlob permission.
  const serviceAccount = loadScopedServiceAccount(projectId);
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId,
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const customToken = await admin.auth().createCustomToken(AUTOMATION_UID, {
    role: 'admin',
    admin: true,
    purpose: 'b6_session_create_certification_v2',
  });

  const signInResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const signIn = await parseJsonResponse(signInResponse, 'Firebase custom-token exchange');
  const idToken = String(signIn.idToken || '');
  if (!idToken) throw new Error('Firebase custom-token exchange returned no ID token');

  const callableUrl = `https://asia-south1-${projectId}.cloudfunctions.net/certifyTeacherEarningsSessionCreateFastPath`;
  const callableResponse = await fetch(callableUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        monthKey,
        maxDocs: 10000,
        sampleLimit: 100,
        apply: true,
      },
    }),
  });
  const callablePayload = await parseJsonResponse(callableResponse, 'Certification callable');
  const result = callablePayload.result || callablePayload.data || {};

  const callableChecks = {
    ok: result.ok === true,
    applied: result.applied === true,
    readOnlyFalse: result.readOnly === false,
    monthKey: result.monthKey === monthKey,
    fullLedgerEvidenceComplete: result.fullLedgerEvidenceComplete === true,
    notTruncated: result.truncated === false,
    readyForSessionCreateFastPath: result.readyForSessionCreateFastPath === true,
    blockersEmpty: Array.isArray(result.blockers) && result.blockers.length === 0,
    certificationVersion: result.certificationVersion === CERTIFICATION_VERSION,
  };
  if (!Object.values(callableChecks).every(Boolean)) {
    throw new Error(`Certification callable safety checks failed: ${JSON.stringify(callableChecks)}`);
  }

  // Read-only verification using the same least-privilege service account after the callable
  // runtime performs the sole production write.
  const db = admin.firestore();
  const certificationRef = db
    .collection('adminStats')
    .doc('teacherEarningsSessionCreateFastPath')
    .collection('months')
    .doc(monthKey);
  const snap = await certificationRef.get();
  if (!snap.exists) throw new Error('Persisted certification document missing');
  const persisted = snap.data() || {};

  const persistedChecks = {
    monthKey: persisted.monthKey === monthKey,
    ready: persisted.ready === true,
    certificationVersion: persisted.certificationVersion === CERTIFICATION_VERSION,
    fullLedgerEvidenceComplete: persisted.fullLedgerEvidenceComplete === true,
    legacyMonthCoverageClean: persisted.legacyMonthCoverageClean === true,
    duplicateSessionIdGroups: persisted.duplicateSessionIdGroups === 0,
    nonCanonicalSessionRows: persisted.nonCanonicalSessionRows === 0,
    sessionSourceMissingSessionIdRows: persisted.sessionSourceMissingSessionIdRows === 0,
    missingTeacherIdRows: persisted.missingTeacherIdRows === 0,
    blockersEmpty: Array.isArray(persisted.blockers) && persisted.blockers.length === 0,
    sourceCodeContract: persisted.sourceCodeContract === SOURCE_CODE_CONTRACT,
  };
  if (!Object.values(persistedChecks).every(Boolean)) {
    throw new Error(`Persisted certification verification failed: ${JSON.stringify(persistedChecks)}`);
  }

  const report = {
    ok: true,
    projectId,
    monthKey,
    callableUrl,
    directFirestoreWritesByCi: 0,
    tokenSigningMode: 'local_service_account_private_key',
    callableChecks,
    persistedChecks,
    persistedSummary: {
      scannedRows: persisted.scannedRows,
      analyzedTargetMonthRows: persisted.analyzedTargetMonthRows,
      canonicalSessionRows: persisted.canonicalSessionRows,
      sessionLinkedRows: persisted.sessionLinkedRows,
      sessionEvidence: persisted.sessionEvidence,
      certificationVersion: persisted.certificationVersion,
      sourceCodeContract: persisted.sourceCodeContract,
    },
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log('B6 session-create v2 callable certification applied and verified');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error('B6 callable certification failed', error);
  process.exitCode = 1;
});
