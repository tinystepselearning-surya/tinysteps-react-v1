const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Initialize Firebase (using emulator)
const app = initializeApp({
  projectId: 'tinysteps-react-v1',
  apiKey: 'demo-key', // Not needed for emulator
});

// Use emulator
const functions = getFunctions(app);
functions.customDomain = 'http://localhost:5001'; // Emulator host

async function testSetUserRole() {
  const setUserRole = httpsCallable(functions, 'setUserRole');

  try {
    // Test 1: Call without auth (should fail)
    console.log('Test 1: Calling without auth...');
    const result1 = await setUserRole({ uid: 'test12345678901234567890123456', role: 'teacher' });
    console.log('Unexpected success:', result1.data);
  } catch (error) {
    console.log('Expected error (no auth):', error.message);
  }

  // Note: To test with auth, need to sign in, but for simplicity, this shows the function is callable.
  // In a real test, use Firebase Auth emulator and sign in as admin.
}

testSetUserRole();