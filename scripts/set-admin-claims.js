#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require('firebase-admin');

const keyPath = process.argv[2];
const uid = process.argv[3] || 'cwEYiYRydtOeeNRoCO0j3VSI2vE3';
const role = process.argv[4] || 'admin';

if (!keyPath) {
  console.error('Usage: node scripts/set-admin-claims.js <service-account-key.json> [uid] [role]');
  process.exit(1);
}

if (!admin.apps.length) {
  const serviceAccount = require(keyPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function setAdminClaims() {
  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`Custom claims set for user ${uid}: { role: "${role}" }`);
  } catch (error) {
    console.error('Failed to set custom claims:', error);
  }
}

setAdminClaims();