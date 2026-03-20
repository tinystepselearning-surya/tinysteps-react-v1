import admin from 'firebase-admin';
import { credentialModeLabel, initializeAdminApp } from './adminInit.js';

async function verifyUid(uid) {
  initializeAdminApp({ projectId: 'tinysteps-react-v1' });
  console.log(`Using ${credentialModeLabel()}`);

  const userRecord = await admin.auth().getUser(uid);
  console.log(`UID: ${uid}`);
  console.log(`Email: ${userRecord.email || '<none>'}`);
  console.log(`Display Name: ${userRecord.displayName || '<none>'}`);
  console.log(`Custom Claims: ${JSON.stringify(userRecord.customClaims || {})}`);
}

async function main() {
  const uid = process.argv[2] || 'cwEYiYRydtOeeNRoCO0j3VSI2vE3';
  try {
    await verifyUid(uid);
    process.exit(0);
  } catch (error) {
    console.error('Error fetching user data:', error);
    process.exit(1);
  }
}

main();
