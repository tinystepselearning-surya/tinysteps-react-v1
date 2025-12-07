const admin = require('firebase-admin');

// Initialize admin SDK for emulator
admin.initializeApp({
  projectId: 'tinysteps-react-v1'
});

async function setTeacherClaims() {
  const uid = 'FVPZZaari22zf7U4eors2NjyWpJF';
  
  try {
    await admin.auth().setCustomUserClaims(uid, {
      role: 'teacher'
    });
    
    console.log(`Successfully set custom claims for teacher user: ${uid}`);
    console.log('Custom claims:', { role: 'teacher' });
    
    // Verify the claims were set
    const userRecord = await admin.auth().getUser(uid);
    console.log('Verified custom claims:', userRecord.customClaims);
    
  } catch (error) {
    console.error('Error setting custom claims:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

setTeacherClaims();