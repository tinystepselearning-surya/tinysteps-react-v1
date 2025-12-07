const admin = require('firebase-admin');

// Initialize with emulator settings
admin.initializeApp({ projectId: 'tinysteps-react-v1' });

async function createTeacherUserDoc() {
  const uid = 'FVPZZaari22zf7U4eors2NjyWpJF';
  const db = admin.firestore();
  
  const userDoc = {
    role: 'teacher',
    email: 'teacher@tinysteps.test',
    displayName: 'Test Teacher',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    provider: 'emulator:test',
    name: 'Test Teacher'
  };

  await db.collection('users').doc(uid).set(userDoc, { merge: true });
  console.log('Teacher user document created with UID:', uid);
  
  // Verify the document
  const doc = await db.collection('users').doc(uid).get();
  console.log('Document data:', doc.data());
  
  process.exit(0);
}

createTeacherUserDoc().catch(console.error);