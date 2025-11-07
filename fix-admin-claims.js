/**
 * Fix Admin Custom Claims
 * Run this script to set admin custom claims for your account
 * 
 * Usage: node fix-admin-claims.js
 */

const admin = require('./functions/node_modules/firebase-admin');
const serviceAccount = require('./functions/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function fixAdminClaims() {
  try {
    console.log('🔍 Finding admin user...\n');
    
    // Get admin user from Firestore
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error('❌ No admin user found in Firestore!');
      console.log('\nPlease create an admin user first or specify the email below.');
      process.exit(1);
    }
    
    const adminDoc = usersSnapshot.docs[0];
    const adminData = adminDoc.data();
    const uid = adminDoc.id;
    
    console.log('📧 Admin user found:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   UID: ${uid}`);
    console.log(`   Name: ${adminData.displayName || adminData.firstName + ' ' + adminData.lastName}`);
    console.log('');
    
    // Set custom claims
    console.log('⚙️  Setting custom claims...');
    await auth.setCustomUserClaims(uid, { 
      role: 'admin',
      name: adminData.displayName || `${adminData.firstName} ${adminData.lastName}`
    });
    
    console.log('✅ Custom claims set successfully!');
    console.log('');
    console.log('🔐 Admin permissions granted:');
    console.log('   - Can access /surya/dashboard');
    console.log('   - Can create/edit/delete users');
    console.log('   - Can manage all platform resources');
    console.log('');
    console.log('⚠️  IMPORTANT: Please logout and login again for changes to take effect');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing admin claims:', error);
    process.exit(1);
  }
}

// If you know your admin email, you can specify it here:
const ADMIN_EMAIL = process.argv[2]; // Pass email as command line argument

if (ADMIN_EMAIL) {
  console.log(`🔍 Looking for user with email: ${ADMIN_EMAIL}\n`);
  
  auth.getUserByEmail(ADMIN_EMAIL)
    .then(async (userRecord) => {
      console.log('📧 User found:');
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log('');
      
      // Get user data from Firestore
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      const userData = userDoc.data();
      
      if (!userData) {
        console.error('❌ User not found in Firestore!');
        process.exit(1);
      }
      
      console.log(`   Role in Firestore: ${userData.role}`);
      console.log('');
      
      if (userData.role !== 'admin') {
        console.error('❌ User is not an admin in Firestore!');
        console.log('Please update the role in Firestore first, then run this script again.');
        process.exit(1);
      }
      
      console.log('⚙️  Setting custom claims...');
      await auth.setCustomUserClaims(userRecord.uid, { 
        role: 'admin',
        name: userData.displayName || `${userData.firstName} ${userData.lastName}`
      });
      
      console.log('✅ Custom claims set successfully!');
      console.log('');
      console.log('⚠️  IMPORTANT: Please logout and login again for changes to take effect');
      console.log('');
      
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
} else {
  fixAdminClaims();
}
