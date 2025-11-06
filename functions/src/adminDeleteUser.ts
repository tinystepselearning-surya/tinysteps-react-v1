/**
 * Admin Delete User Cloud Function
 * Allows admins to delete users (Auth + Firestore)
 * Uses Firebase Admin SDK to delete users server-side
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

interface DeleteUserData {
  uid: string;
}

export const adminDeleteUser = onCall({
  region: 'asia-south1',
  cors: true
}, async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user has admin role
  if (request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can delete users');
  }

  const data = request.data as DeleteUserData;

  // Validate required fields
  if (!data.uid) {
    throw new HttpsError('invalid-argument', 'Missing required field: uid');
  }

  // Prevent self-deletion
  if (data.uid === request.auth.uid) {
    throw new HttpsError('invalid-argument', 'Cannot delete your own admin account');
  }

  try {
    const db = getFirestore();
    const auth = getAuth();

    // Get user data before deletion
    const userDoc = await db.collection('users').doc(data.uid).get();
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const userRole = userData?.role;
    const username = userData?.usernameLower;

    // Use batch for atomic operations
    const batch = db.batch();

    // 1. Delete user document from /users collection
    const userRef = db.collection('users').doc(data.uid);
    batch.delete(userRef);

    // 2. Delete username mapping
    if (username) {
      const usernameRef = db.collection('usernames').doc(username);
      batch.delete(usernameRef);
    }

    // 3. Role-specific cleanup
    switch (userRole) {
      case 'student':
        // Delete from /students collection
        const studentRef = db.collection('students').doc(data.uid);
        const studentDoc = await studentRef.get();
        
        if (studentDoc.exists) {
          batch.delete(studentRef);
          
          const studentData = studentDoc.data();
          const parentId = studentData?.parentId;
          
          // Remove child link from parent
          if (parentId) {
            // Remove from parent's children subcollection
            const childLinkRef = db.collection('parents').doc(parentId).collection('children').doc(data.uid);
            batch.delete(childLinkRef);
            
            // Remove from parent's children array in users collection
            const parentUserRef = db.collection('users').doc(parentId);
            batch.update(parentUserRef, {
              children: FieldValue.arrayRemove(data.uid)
            });
          }
        }
        break;

      case 'parent':
        // Delete from /parents collection
        const parentRef = db.collection('parents').doc(data.uid);
        const parentDoc = await parentRef.get();
        
        if (parentDoc.exists) {
          batch.delete(parentRef);
          
          // Get all children from subcollection
          const childrenSnapshot = await db.collection('parents').doc(data.uid).collection('children').get();
          
          // Delete all child links
          for (const childDoc of childrenSnapshot.docs) {
            batch.delete(childDoc.ref);
          }
          
          // Note: We don't delete the actual student records, just the parent link
          // Optionally update students to remove parent reference
          if (userData?.children && Array.isArray(userData.children)) {
            for (const childId of userData.children) {
              const studentRef = db.collection('students').doc(childId);
              const studentDoc = await studentRef.get();
              
              if (studentDoc.exists) {
                batch.update(studentRef, {
                  parentId: null,
                  updatedAt: new Date().toISOString(),
                  updatedBy: request.auth.uid
                });
              }
            }
          }
        }
        break;

      case 'teacher':
        // Delete from /teachers collection
        const teacherRef = db.collection('teachers').doc(data.uid);
        const teacherDoc = await teacherRef.get();
        
        if (teacherDoc.exists) {
          batch.delete(teacherRef);
        }
        break;

      case 'learning-partner':
        // Delete from /rms collection
        const rmRef = db.collection('rms').doc(data.uid);
        batch.delete(rmRef);
        break;
    }

    // Commit all Firestore changes
    await batch.commit();

    // Delete from Firebase Authentication (must be done after Firestore)
    try {
      await auth.deleteUser(data.uid);
      console.log(`✅ User deleted from Firebase Auth: ${data.uid}`);
    } catch (authError: any) {
      // If auth deletion fails, log but don't fail the entire operation
      // User data is already deleted from Firestore
      console.warn(`⚠️ Failed to delete user from Firebase Auth: ${authError.message}`);
    }

    console.log(`✅ User deleted successfully: ${userData?.displayName} (${userRole}) by admin ${request.auth.uid}`);

    return {
      success: true,
      uid: data.uid,
      displayName: userData?.displayName || 'Unknown',
      role: userRole,
      message: 'User deleted successfully'
    };

  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    // If it's already an HttpsError, rethrow it
    if (error instanceof HttpsError) {
      throw error;
    }

    // Generic error
    throw new HttpsError('internal', error.message || 'Failed to delete user');
  }
});
