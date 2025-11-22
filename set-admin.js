import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Load service account JSON without using import assertions for compatibility
const serviceAccountPath = path.resolve(process.cwd(), 'tinysteps-react-v1-firebase-adminsdk-fbsvc-54979d3c19.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8085';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tinysteps-react-v1',
});

const uid = 'cwEYiYRydtOeeNRoCO0j3VSI2vE3';
console.log('Setting claims and document for UID:', uid);

// Create the user if it doesn't exist
admin.auth().createUser({
  uid: uid,
  email: 'admin@test.com',
  password: 'password123',
  displayName: 'Admin User',
}).then(() => {
  console.log('User created');
}).catch((error) => {
  if (error.code === 'auth/uid-already-exists') {
    console.log('User already exists');
  } else {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}).then(() => {
  // Set custom claims
  return admin.auth().setCustomUserClaims(uid, {
    admin: true,
    role: 'admin',
    teacher: false,
    parent: false,
    kid: false,
    learningPartner: false,
  });
}).then(() => {
  // Also set the user document
  const db = admin.firestore();
  return db.collection('users').doc(uid).set({
    uid: uid,
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true }); // Use merge to update without overwriting
}).then(() => {
  console.log('Admin claims set and document updated successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});