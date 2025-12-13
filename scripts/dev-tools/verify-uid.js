const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('./tinysteps-react-v1-firebase-adminsdk-fbsvc-75997bbcea.json')),
});

const verifyUID = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    console.log(`UID: ${uid}`);
    console.log(`Email: ${userRecord.email}`);
    console.log(`Display Name: ${userRecord.displayName}`);
    console.log(`Custom Claims: ${JSON.stringify(userRecord.customClaims)}`);
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

// Replace with the UID you want to verify
verifyUID('cwEYiYRydtOeeNRoCO0j3VSI2vE3');