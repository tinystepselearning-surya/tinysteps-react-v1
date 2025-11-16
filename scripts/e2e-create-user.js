#!/usr/bin/env node
/*
  E2E script (emulator) to create a user via the adminCreateUser callable.
  Steps:
  - Requires Firebase emulators to be running (auth, firestore, functions).
  - Creates an admin user using the Admin SDK and sets custom claims.
  - Generates a custom token for the admin user, exchanges it for an ID token using the Auth emulator REST API.
  - Calls the callable function endpoint using the ID token and prints the response.

  Usage:
    FIREBASE_PROJECT_ID=tinysteps-react-v1 node scripts/e2e-create-user.js
    Ensure the emulator is running (`firebase emulators:start --only auth,firestore,functions`) and the env variables
    FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 and FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001 are set.
*/

const fetch = global.fetch || require('node-fetch');
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || 'tinysteps-react-v1';
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const functionsHost = process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST || 'localhost:5001';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = functionsHost;

admin.initializeApp({ projectId });

async function main() {
  try {
    // Create admin user
    const adminEmail = `emulator-admin-${Date.now()}@example.com`;
    const adminPassword = 'Password123!';
    console.log('Creating admin user', adminEmail);
    const user = await admin.auth().createUser({ email: adminEmail, password: adminPassword, displayName: 'E2E Admin' });
    console.log('Admin user created', user.uid);

    await admin.auth().setCustomUserClaims(user.uid, { admin: true, role: 'admin' });
    console.log('Custom claims set for admin user');

    // Create a custom token for the admin user
    const customToken = await admin.auth().createCustomToken(user.uid, { admin: true, role: 'admin' });
    console.log('Custom token created (first 10 chars):', customToken.slice(0, 10));

    // Exchange custom token for ID token via emulator REST API
    const signInUrl = `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`;
    const signInResp = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });
    const signInJson = await signInResp.json();
    if (!signInJson.idToken) {
      console.error('Failed to sign in with custom token', signInJson);
      process.exit(1);
    }
    const idToken = signInJson.idToken;
    console.log('Obtained ID token (first 10 chars):', idToken.slice(0, 10));

    // Now call the callable function endpoint
    const createUrl = `http://${functionsHost}/${projectId}/asia-south1/adminCreateUser`;
    const data = { email: `newuser-${Date.now()}@example.com`, password: 'Newpass123!', displayName: 'New User', role: 'parent' };
    console.log('Calling adminCreateUser with data:', data);
    const resp = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ data }),
    });
    const json = await resp.json();
    console.log('adminCreateUser response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('E2E error', err);
    process.exit(1);
  }
}

main();
