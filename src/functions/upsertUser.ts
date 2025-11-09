import * as admin from 'firebase-admin';
import { User } from '../types/User';

/**
 * Creates or updates a user document in Firestore.
 * @param uid - The Firebase Auth UID of the user.
 * @param userData - The user data to store.
 */
export async function upsertUser(uid: string, userData: Partial<User>): Promise<void> {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);

  const userDoc = await userRef.get();

  if (userDoc.exists) {
    // Update existing user
    await userRef.update({
      ...userData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Create new user
    await userRef.set({
      ...userData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}