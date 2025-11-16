import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

export async function adminCreateUserHandler(data: any, context: any) {
  console.log('Debug: adminCreateUserHandler called with data:', data);

  // Check if the user is authenticated
  if (!context?.auth) {
    logger.warn('Debug: Unauthenticated request');
    throw new HttpsError('unauthenticated', 'Must be logged in to create users.');
  }

  // Check if the user has admin privileges
  const callerUid = context.auth.uid;
  logger.info('caller auth token:', { uid: context.auth.uid, tokenClaims: context.auth.token });
  let callerUser;
  try {
    callerUser = await admin.auth().getUser(callerUid);
  } catch (err) {
    logger.error('Debug: Failed to fetch caller user:', err);
    throw new HttpsError('internal', 'Failed to verify admin privileges.');
  }

  let isAdmin = callerUser.customClaims?.role === 'admin' || callerUser.customClaims?.admin === true;
  if (!isAdmin) {
    // Fallback to check the Firestore users collection for role assignment
    try {
      const userDoc = await admin.firestore().collection('users').doc(callerUid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        isAdmin = true;
      }
    } catch (err) {
      logger.warn('Could not fetch caller user doc to validate admin role', { err });
    }
  }

  if (!isAdmin) {
    logger.warn('Debug: Caller does not have admin privileges');
    throw new HttpsError('permission-denied', 'Only admins can create users.');
  }

  try {
    const { email, password, displayName, role, specialization, paymentMethods } = data;

    // Validate required fields
    if (!email || !password || !displayName || !role) {
      throw new HttpsError('invalid-argument', 'Missing required fields: email, password, displayName, or role.');
    }

    // Create the new user
    const newUser = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    console.log('Debug: New user created:', newUser);

  // Set custom claims for the new user
  await admin.auth().setCustomUserClaims(newUser.uid, { role });

    // Add user details to Firestore
    const userDoc = {
      uid: newUser.uid,
      email,
      displayName,
      role,
      specialization: specialization || [],
      paymentMethods: paymentMethods || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection('users').doc(newUser.uid).set(userDoc);

    console.log('Debug: User document created in Firestore:', userDoc);

    return {
      success: true,
      uid: newUser.uid,
      resetLink: `https://example.com/reset-password?uid=${newUser.uid}`,
    };
  } catch (error: any) {
    logger.error('Debug: Error in adminCreateUser:', error);
    const message = error?.message || 'Failed to create user.';
    throw new HttpsError('internal', message);
  }
}

export const adminCreateUser = onCall({ region: 'asia-south1' }, adminCreateUserHandler as any);