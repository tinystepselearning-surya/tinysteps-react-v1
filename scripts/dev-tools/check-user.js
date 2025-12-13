import admin from 'firebase-admin';
import serviceAccount from './tinysteps-react-v1-firebase-adminsdk-fbsvc-54979d3c19.json' assert { type: 'json' };

process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8085';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tinysteps-react-v1',
});

const uid = 'cwEYiYRydtOeeNRoCO0j3VSI2vE3';

const db = admin.firestore();

db.collection('users').doc(uid).get().then(doc => {
  if (doc.exists) {
    console.log('User document:', doc.data());
  } else {
    console.log('User document does not exist');
  }
}).catch(err => {
  console.error('Error getting user document:', err);
}).finally(() => {
  process.exit(0);
});