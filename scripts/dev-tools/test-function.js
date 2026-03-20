import { initializeApp } from 'firebase/app';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getFirestore, doc, getDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, connectAuthEmulator } from 'firebase/auth';
import fetch from 'node-fetch';
import admin from 'firebase-admin';
import { credentialModeLabel, initializeAdminApp } from './adminInit.js';

// Initialize Firebase (using emulator)
const app = initializeApp({
  projectId: 'tinysteps-react-v1',
  apiKey: 'demo-key', // Not needed for emulator
});

// Use emulator
const functions = getFunctions(app);
connectFunctionsEmulator(functions, 'localhost', 5001);
const db = getFirestore(app);
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://localhost:9099'); // Auth emulator
// Ensure fetch is available for Firebase in Node.js
if (!globalThis.fetch) {
  // node-fetch returns a function we can assign
  globalThis.fetch = fetch;
}

// Connect Firestore to emulator
connectFirestoreEmulator(db, 'localhost', 8085);

initializeAdminApp({
  projectId: 'tinysteps-react-v1',
  requireServiceAccount: true,
});
console.log(`Using ${credentialModeLabel()}`);

async function generateAdminToken() {
  // Create a proper Firebase custom token (client will use signInWithCustomToken).
  const uid = 'local-admin-test-uid';
  // Ensure there is a user created in the Auth emulator and set custom claims
  // on the user so security rules that check `request.auth.token.admin` pass.
  try {
    await admin.auth().getUser(uid);
  } catch (err) {
    // If user does not exist, create it in the auth emulator
    await admin.auth().createUser({ uid, email: 'local-admin@localhost' });
  }

  // Set custom claims explicitly on the user record in the emulator
  await admin.auth().setCustomUserClaims(uid, { role: 'admin', admin: true });

  const customToken = await admin.auth().createCustomToken(uid);
  return customToken;
}

async function testFetchAdminStats() {
  try {
    // Generate and sign in with admin token
    const adminToken = await generateAdminToken();
    await signInWithCustomToken(auth, adminToken);

    // Test Firestore query
    console.log('Fetching admin stats...');
    const adminStatsDoc = doc(db, 'adminStats', 'testAdminDoc');
    const adminStats = await getDoc(adminStatsDoc);

    if (adminStats.exists()) {
      console.log('Admin stats fetched successfully:', adminStats.data());
    } else {
      console.log('No admin stats found.');
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error.message);
  }
}

testFetchAdminStats();
