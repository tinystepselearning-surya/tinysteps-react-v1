#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require('firebase-admin');

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

const uid = getArg('--uid') || 'cwEYiYRydtOeeNRoCO0j3VSI2vE3';
const role = getArg('--role') || 'admin';

const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  'tinysteps-react-v1';

const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!isEmulator && process.env.CONFIRM_PROD !== 'yes') {
  console.error('❌ REFUSING: This would run against PRODUCTION Auth.');
  console.error('   To run against emulator, set: FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099');
  console.error('   Or to force prod (danger): CONFIRM_PROD=yes');
  process.exit(1);
}

if (!admin.apps.length) {
  // Emulator does NOT need a service account key.
  // Prod will use ADC if you have `gcloud auth application-default login` done.
  admin.initializeApp({ projectId });
}

async function main() {
  console.log('--- Set Custom Claims ---');
  console.log(`Project: ${projectId}`);
  console.log(`Auth Emulator: ${isEmulator ? `YES (${process.env.FIREBASE_AUTH_EMULATOR_HOST})` : 'NO (PROD)'}`);
  console.log(`UID: ${uid}`);
  console.log(`role: ${role}`);
  console.log('------------------------');

  await admin.auth().setCustomUserClaims(uid, { role });
  console.log(`✅ Set claims for ${uid}: { role: "${role}" }`);

  const user = await admin.auth().getUser(uid);
  console.log('✅ Verified customClaims:', user.customClaims || {});
}

main().catch((e) => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
