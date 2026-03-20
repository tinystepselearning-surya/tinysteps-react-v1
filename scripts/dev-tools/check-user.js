import admin from 'firebase-admin';
import { credentialModeLabel, initializeAdminApp } from './adminInit.js';

process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8085';

initializeAdminApp({ projectId: 'tinysteps-react-v1' });

const uid = process.argv[2] || 'cwEYiYRydtOeeNRoCO0j3VSI2vE3';
console.log(`Using ${credentialModeLabel()}`);
console.log(`Checking users/${uid}...`);

const db = admin.firestore();

db.collection('users').doc(uid).get()
  .then((doc) => {
    if (doc.exists) {
      console.log('User document:', doc.data());
    } else {
      console.log('User document does not exist');
    }
  })
  .catch((err) => {
    console.error('Error getting user document:', err);
  })
  .finally(() => {
    process.exit(0);
  });
