const admin = require('firebase-admin');

// Initialize with explicit project id for emulator
admin.initializeApp({ projectId: 'demo-tinysteps' });

(async function() {
  try {
    // Create admin user
    const adminUser = await admin.auth().createUser({
      email: 'admin@example.com',
      displayName: 'Admin User',
      password: 'secret123'
    });
    console.log('Admin UID:', adminUser.uid);
    await admin.auth().setCustomUserClaims(adminUser.uid, { admin: true, role: 'admin' });
    console.log('Admin claims set');

    // Create LP user
    const lpUser = await admin.auth().createUser({
      email: 'lp@example.com',
      displayName: 'LP User',
      password: 'secret123'
    });
    console.log('LP UID:', lpUser.uid);
    await admin.auth().setCustomUserClaims(lpUser.uid, { learningPartner: true, role: 'learningPartner' });
    console.log('LP claims set');

    // Create parent user
    const parentUser = await admin.auth().createUser({
      email: 'parent@example.com',
      displayName: 'Parent User',
      password: 'secret123'
    });
    console.log('Parent UID:', parentUser.uid);
    await admin.auth().setCustomUserClaims(parentUser.uid, { parent: true, role: 'parent' });
    console.log('Parent claims set');

    // Create kid doc with lpId and parentId
    const db = admin.firestore();
    const kidRef = db.collection('kids').doc('kid-test-001');
    await kidRef.set({
      fullName: 'Test Kid',
      parentId: parentUser.uid,
      lpId: lpUser.uid,
      teacherId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Kid doc created with lpId');

    // Confirm kid doc
    const kid = await kidRef.get();
    console.log('Kid data:', kid.data());

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
