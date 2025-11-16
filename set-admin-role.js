const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('./tinysteps-react-v1-firebase-adminsdk-fbsvc-75997bbcea.json')),
});

const setAdminRole = async (uid) => {
  try {
    console.log('Initializing role assignment for UID:', uid);

    // Set custom user claims for the user
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log(`Admin role set successfully for user with UID: ${uid}`);
  } catch (error) {
    console.error('Error setting admin role:', error);

    // Additional debugging information
    if (error.code === 'auth/invalid-credential') {
      console.error('Invalid service account credentials. Ensure tinysteps-react-v1-firebase-adminsdk-fbsvc-75997bbcea.json is correct.');
    } else if (error.code === 'auth/user-not-found') {
      console.error('User not found. Verify the UID exists in Firebase Authentication.');
    } else {
      console.error('Unexpected error:', error.message);
    }
  }
};

// Replace with the UID of the user you want to set as admin
const userUID = 'cwEYiYRydtOeeNRoCO0j3VSI2vE3';
setAdminRole(userUID);