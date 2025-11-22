import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

type UserRole = 'parent' | 'teacher';

/**
 * Ensure the caller is an admin.
 * Checks:
 *  - auth.token.admin === true, OR
 *  - auth.token.role === 'admin', OR
 *  - /users/{uid}.role === 'admin' OR roles includes 'admin'
 */
async function ensureAdmin(auth: any) {
  if (!auth) {
    logger.warn('assignLP: unauthenticated callable call');
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const callerUid = auth.uid;
  const tokenIsAdmin =
    auth.token?.admin === true || auth.token?.role === 'admin';

  if (tokenIsAdmin) return;

  // Fallback: check Firestore /users/{uid}
  try {
    const doc = await admin.firestore().collection('users').doc(callerUid).get();
    const data = doc.data();
    const docIsAdmin =
      !!data &&
      (
        data.role === 'admin' ||
        (Array.isArray(data.roles) && data.roles.includes('admin'))
      );

    if (!docIsAdmin) {
      logger.warn('assignLP: caller is not admin', { callerUid });
      throw new HttpsError('permission-denied', 'Admin access required');
    }
  } catch (err) {
    logger.error('assignLP: error verifying admin status via Firestore', {
      callerUid,
      error: String(err),
    });
    throw new HttpsError('permission-denied', 'Admin access required');
  }
}

/**
 * Ensure a user document exists at /users/{uid}
 */
async function ensureUserExists(uid: string) {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', `User ${uid} not found`);
    }
    return userDoc.data();
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    logger.error('ensureUserExists error', { uid, error: String(err) });
    throw new HttpsError('internal', 'Failed to verify user');
  }
}

/**
 * Assign or unassign a Learning Partner (LP) to/from a Parent or Teacher.
 */
async function updateAssignment(
  userId: string,
  lpId: string,
  userRole: UserRole,
  assign: boolean
) {
  const db = admin.firestore();
  const batch = db.batch();

  const userRef = db.collection('users').doc(userId);
  const lpRef = db.collection('users').doc(lpId);

  const lpField = userRole === 'parent' ? 'assignedParents' : 'assignedTeachers';

  if (assign) {
    batch.update(userRef, {
      assignedLPs: admin.firestore.FieldValue.arrayUnion(lpId) as any,
    });
    batch.update(lpRef, {
      [lpField]: admin.firestore.FieldValue.arrayUnion(userId) as any,
    });
  } else {
    batch.update(userRef, {
      assignedLPs: admin.firestore.FieldValue.arrayRemove(lpId) as any,
    });
    batch.update(lpRef, {
      [lpField]: admin.firestore.FieldValue.arrayRemove(userId) as any,
    });
  }

  await batch.commit();
}

// ---------- assign LP to PARENT ----------
export const assignLPToParent = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { data, auth } = request;

    await ensureAdmin(auth);

    const { parentId, lpId } = (data || {}) as {
      parentId?: string;
      lpId?: string;
    };

    if (!parentId || !lpId) {
      throw new HttpsError('invalid-argument', 'parentId and lpId are required');
    }

    await ensureUserExists(parentId);
    const lpData = await ensureUserExists(lpId);

    const lpRole = (lpData as any)?.role;
    // Accept both legacy 'learningPartner' and new 'learning-partner'
    if (lpRole !== 'learningPartner' && lpRole !== 'learning-partner') {
      throw new HttpsError(
        'invalid-argument',
        'lpId must be a learning partner'
      );
    }

    await updateAssignment(parentId, lpId, 'parent', true);
    return { success: true };
  }
);

export const unassignLPFromParent = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { data, auth } = request;

    await ensureAdmin(auth);

    const { parentId, lpId } = (data || {}) as {
      parentId?: string;
      lpId?: string;
    };

    if (!parentId || !lpId) {
      throw new HttpsError('invalid-argument', 'parentId and lpId are required');
    }

    await ensureUserExists(parentId);
    await ensureUserExists(lpId);

    await updateAssignment(parentId, lpId, 'parent', false);
    return { success: true };
  }
);

// ---------- assign LP to TEACHER ----------
export const assignLPToTeacher = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { data, auth } = request;

    await ensureAdmin(auth);

    const { teacherId, lpId } = (data || {}) as {
      teacherId?: string;
      lpId?: string;
    };

    if (!teacherId || !lpId) {
      throw new HttpsError(
        'invalid-argument',
        'teacherId and lpId are required'
      );
    }

    await ensureUserExists(teacherId);
    const lpData = await ensureUserExists(lpId);

    const lpRole = (lpData as any)?.role;
    if (lpRole !== 'learningPartner' && lpRole !== 'learning-partner') {
      throw new HttpsError(
        'invalid-argument',
        'lpId must be a learning partner'
      );
    }

    await updateAssignment(teacherId, lpId, 'teacher', true);
    return { success: true };
  }
);

export const unassignLPFromTeacher = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { data, auth } = request;

    await ensureAdmin(auth);

    const { teacherId, lpId } = (data || {}) as {
      teacherId?: string;
      lpId?: string;
    };

    if (!teacherId || !lpId) {
      throw new HttpsError(
        'invalid-argument',
        'teacherId and lpId are required'
      );
    }

    await ensureUserExists(teacherId);
    await ensureUserExists(lpId);

    await updateAssignment(teacherId, lpId, 'teacher', false);
    return { success: true };
  }
);
