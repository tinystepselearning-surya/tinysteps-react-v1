const admin = require('firebase-admin');

// Initialize with project ID
admin.initializeApp({
  projectId: 'tinysteps-react-v1'
});

const db = admin.firestore();
const auth = admin.auth();

async function fixParentUser() {
  const uid = '2asSYwm7UkgOoegh6KQNPxfOZ3q1';
  
  try {
    // 1. Update Firestore document to add role
    await db.collection('users').doc(uid).update({
      role: 'parent'
    });
    console.log('✅ Updated Firestore document with role: parent');
    
    // 2. Set custom claims in Firebase Auth
    await auth.setCustomUserClaims(uid, { role: 'parent' });
    console.log('✅ Set custom claims: {"role":"parent"}');
    
    console.log('\n🎉 Parent user is now fixed! They can login at /parent-login');
    console.log('   Email: parentv1@tinysteps.com');
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixParentUser();
