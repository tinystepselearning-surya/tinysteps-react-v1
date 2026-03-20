import admin from 'firebase-admin';
import { credentialModeLabel, initializeAdminApp } from './adminInit.js';

async function setRole(uid, role = 'admin') {
  initializeAdminApp({ projectId: 'tinysteps-react-v1' });
  console.log(`Using ${credentialModeLabel()}`);
  console.log(`Setting role "${role}" for UID: ${uid}`);

  await admin.auth().setCustomUserClaims(uid, { role });
  console.log(`Role "${role}" set successfully for user ${uid}`);
}

async function main() {
  const uid = process.argv[2] || 'cwEYiYRydtOeeNRoCO0j3VSI2vE3';
  const role = process.argv[3] || 'admin';

  try {
    await setRole(uid, role);
    process.exit(0);
  } catch (error) {
    console.error('Error setting role:', error);
    process.exit(1);
  }
}

main();
