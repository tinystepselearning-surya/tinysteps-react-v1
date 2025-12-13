#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require('firebase-admin');

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function hasArg(name) {
  return process.argv.includes(name);
}

const uid = getArg('--uid') || process.argv[2] || 'FVPZZaari22zf7U4eors2NjyWpJF';
const role = getArg('--role') || process.argv[3] || 'teacher';

const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  'tinysteps-react-v1';

function help() {
  console.log(`
Usage:
  node scripts/set-teacher-claims.js --uid <UID> --role teacher

Examples:
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GOOGLE_CLOUD_PROJECT=${projectId} node scripts/set-teacher-claims.js --uid ${uid} --role teacher

Prod (guarded):
  CONFIRM_PROD=yes node scripts/set-teacher-claims.js --uid ${uid} --role teacher
`);
  process.exit(1);
}

if (hasArg('--help') || hasArg('-h')) help();
if (!uid) help();

if (!isEmulator && process.env.CONFIRM_PROD !== 'yes') {
  console.error('❌ REFUSING to run against production Auth without CONFIRM_PROD=yes');
  console.error(`   Detected project: ${projectId}`);
  console.error('   To run against emulator:');
  console.error(`   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GOOGLE_CLOUD_PROJECT=${projectId} node scripts/set-teacher-claims.js --uid ${uid} --role ${role}`);
  process.exit(1);
}

if (!admin.apps.length) {
  // Using ADC: will work for emulator without any key file.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
}

async function main() {
  console.log('--- Set Custom Claims (Teacher) ---');
  console.log(`Project: ${projectId}`);
  console.log(`Auth Emulator: ${isEmulator ? `YES (${process.env.FIREBASE_AUTH_EMULATOR_HOST})` : 'NO (production)'}`);
  console.log(`Target UID: ${uid}`);
  console.log(`Role: ${role}`);
  console.log('----------------------------------');

  await admin.auth().setCustomUserClaims(uid, { role });
  console.log(`✅ Custom claims set for user ${uid}: { role: "${role}" }`);

  const userRecord = await admin.auth().getUser(uid);
  console.log('✅ Verified custom claims:', userRecord.customClaims || {});
}

main().catch((err) => {
  console.error('❌ Error setting custom claims:', err);
  process.exit(1);
});
