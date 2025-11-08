/**
 * One-time migration script to create /rms/{uid} documents
 * for existing learning-partner users who don't have them
 *
 * Run this manually via Firebase Functions shell or as a callable function
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const migrateRMs = onCall({
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
    // Get all users with role === 'learning-partner' from /users collection
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'learning-partner')
      .get();

    console.log(`Found ${usersSnapshot.size} learning-partner users to migrate`);

    const batch = db.batch();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      // Check if RM document already exists
      const rmDoc = await db.collection('rms').doc(uid).get();

      if (rmDoc.exists) {
        console.log(`RM document already exists for ${userData.displayName} (${uid}), skipping`);
        skippedCount++;
        continue;
      }

      // Create RM document
      const rmRef = db.collection('rms').doc(uid);
      batch.set(rmRef, {
        userId: uid,
        displayName: userData.displayName || '',
        email: userData.email || '',
        phone: userData.phoneNumber || '',
        status: userData.status || 'active',
        createdBy: userData.createdBy || 'migration',
        createdAt: userData.createdAt || new Date(),
        updatedBy: request.auth.uid,
        updatedAt: new Date()
      });

      console.log(`Created RM document for ${userData.displayName} (${uid})`);
      migratedCount++;
    }

    // Commit all changes
    await batch.commit();

    const message = `Migration complete! Created ${migratedCount} RM documents, skipped ${skippedCount} existing.`;
    console.log(message);

    return {
      success: true,
      migratedCount,
      skippedCount,
      totalRMs: usersSnapshot.size,
      message
    };

  } catch (error: any) {
    console.error('Migration error:', error);
    throw new HttpsError('internal', error.message || 'Migration failed');
  }
});