#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require('firebase-admin');

/**
 * Safe Admin Claims Setter
 *
 * - Uses ADC by default (recommended)
 * - Supports Auth emulator when FIREBASE_AUTH_EMULATOR_HOST is set
 * - Requires CONFIRM_PROD=yes when running against real Firebase Auth
 *
 * Usage:
 *   node scripts/set-admin-claims.js --uid <UID> --role admin
 *
 * Optional:
 *   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json node scripts/set-admin-claims.js --uid <UID> --role admin
 *
 * Emulator:
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GOOGLE_CLOUD_PROJECT=<projectId> node scripts/set-admin-claims.js --uid <UID> --role admin
 */

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function hasArg(name) {
  return process.argv.includes(name);
}

const DEFAULT_UID = 'cwEYiYRydtOeeNRoCO0j3VSI2vE3';

const uid = getArg('--uid') || process.argv[2] || DEFAULT_UID;
const role = getArg('--role') || process.argv[3] || 'admin';

const isEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Project id is useful for logging sanity.
// (Admin SDK can still work without explicitly setting it, but we log what we know.)
const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  '(unknown)';

function printHelpAndExit() {
  console.log(`
Usage:
  node scripts/set-admin-claims.js --uid <UID> --role <role>

Examples:
  node scripts/set-admin-claims.js --uid ${DEFAULT_UID} --role admin

Prod (guarded):
  CONFIRM_PROD=yes node scripts/set-admin-claims.js --uid ${DEFAULT_UID} --role admin

With explicit credentials (stored OUTSIDE repo):
  GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/key.json CONFIRM_PROD=yes node scripts/set-admin-claims.js --uid ${DEFAULT_UID} --role admin

Auth Emulator:
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GOOGLE_CLOUD_PROJECT=tinysteps-react-v1 node scripts/set-admin-claims.js --uid ${DEFAULT_UID} --role admin
`);
  process.exit(1);
}

if (hasArg('--help') || hasArg('-h')) {
  printHelpAndExit();
}

if (!uid) {
  console.error('❌ Missing uid.');
  printHelpAndExit();
}

if (!role) {
  console.error('❌ Missing role.');
  printHelpAndExit();
}

// Safety gate: do not allow accidental production writes
if (!isEmulator && process.env.CONFIRM_PROD !== 'yes') {
  console.error('❌ REFUSING to run against production Auth without CONFIRM_PROD=yes');
  console.error(`   Detected project: ${projectId}`);
  console.error('   If you really intend to set claims in production, run:');
  console.error(`   CONFIRM_PROD=yes node scripts/set-admin-claims.js --uid ${uid} --role ${role}`);
  process.exit(1);
}

if (!admin.apps.length) {
  // ADC: uses GOOGLE_APPLICATION_CREDENTIALS if set, otherwise local gcloud login / workload identity.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

async function main() {
  console.log('--- Set Custom Claims ---');
  console.log(`Project: ${projectId}`);
  console.log(`Auth Emulator: ${isEmulator ? `YES (${process.env.FIREBASE_AUTH_EMULATOR_HOST})` : 'NO (production)'}`);
  console.log(`Target UID: ${uid}`);
  console.log(`Role: ${role}`);
  console.log('-------------------------');

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`✅ Custom claims set for user ${uid}: { role: "${role}" }`);

    // Optional: verify
    const user = await admin.auth().getUser(uid);
    console.log('✅ Verified claims on user record:', user.customClaims || {});
  } catch (error) {
    console.error('❌ Failed to set custom claims:', error);
    process.exit(1);
  }
}

main();
