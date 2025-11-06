/**
 * One-time migration script to create /parents/{uid} documents 
 * for existing parent users who don't have them
 * 
 * Run this manually via Firebase Functions shell or as a callable function
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const migrateParents = onCall({
  region: 'asia-south1',
  cors: true
}, async (request) => {
  // Verify user is authenticated and is admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can run migrations');
  }

  const db = getFirestore();
  
  try {
    // Get all users with role === 'parent' from /users collection
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'parent')
      .get();

    console.log(`Found ${usersSnapshot.size} parent users to migrate`);

    const batch = db.batch();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      // Check if parent document already exists
      const parentDoc = await db.collection('parents').doc(uid).get();
      
      if (parentDoc.exists) {
        console.log(`Parent document already exists for ${userData.displayName} (${uid}), skipping`);
        skippedCount++;
        continue;
      }

      // Create parent document
      const parentRef = db.collection('parents').doc(uid);
      batch.set(parentRef, {
        uid,
        email: userData.email || '',
        displayName: userData.displayName || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        learningPartnerId: userData.learningPartnerId || null,
        status: userData.status || 'active',
        createdAt: userData.createdAt || new Date().toISOString(),
        createdBy: userData.createdBy || 'migration',
        updatedAt: new Date().toISOString(),
        updatedBy: request.auth.uid
      });

      console.log(`Created parent document for ${userData.displayName} (${uid})`);
      migratedCount++;

      // If user has children in the users document, create child links
      if (userData.children && Array.isArray(userData.children) && userData.children.length > 0) {
        for (const childUid of userData.children) {
          // Get student data
          const studentDoc = await db.collection('users').doc(childUid).get();
          if (studentDoc.exists) {
            const studentData = studentDoc.data();
            
            // Create child link in parent's children subcollection
            const childLinkRef = db.collection('parents').doc(uid).collection('children').doc(childUid);
            batch.set(childLinkRef, {
              studentId: childUid,
              displayName: studentData?.displayName || '',
              isPrimary: false,
              addedAt: new Date().toISOString(),
              addedBy: request.auth.uid
            });

            console.log(`  - Linked child ${studentData?.displayName} (${childUid})`);
          }
        }
      }
    }

    // Commit all changes
    await batch.commit();

    const message = `Migration complete! Created ${migratedCount} parent documents, skipped ${skippedCount} existing.`;
    console.log(message);

    return {
      success: true,
      migratedCount,
      skippedCount,
      totalParents: usersSnapshot.size,
      message
    };

  } catch (error: any) {
    console.error('Migration error:', error);
    throw new HttpsError('internal', error.message || 'Migration failed');
  }
});
