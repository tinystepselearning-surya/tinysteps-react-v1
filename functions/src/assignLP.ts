import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Canonical roles used across Tiny Steps
 */
type CanonicalRole = 'parent' | 'teacher' | 'learning-partner';

/**
 * Fetch and validate a user document
 */
async function getUser(uid: string) {
  try {
    const snap = await admin.firestore().collection('users').doc(uid).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', `User ${uid} not found`);
    }
    return snap.data() as any;
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error('getUser failed', { uid, error: String(err) });
    throw new HttpsError('internal', 'Failed to fetch user');
  }
}

/**
 * Normalize role values (legacy → canonical)
 */
function normalizeRole(role?: string): CanonicalRole | null {
  if (!role) return null;
  if (role === 'learningPartner') return 'learning-partner';
  if (role === 'learning-partner' || role === 'parent' || role === 'teacher') {
    return role;
  }
  return null;
}

/**
 * Core assignment logic (shared)
 */
async function updateAssignment(
  userId: string,
  lpId: string,
  userRole: 'parent' | 'teacher',
  assign: boolean
) {
  const db = admin.firestore();
  const batch = db.batch();

  const userRef = db.collection('users').doc(userId);
  const lpRef = db.collection('users').doc(lpId);

  const lpReverseField =
    userRole === 'parent' ? 'assignedParents' : 'assignedTeachers';

  batch.update(userRef, {
    assignedLPs: assign
      ? admin.firestore.FieldValue.arrayUnion(lpId)
      : admin.firestore.FieldValue.arrayRemove(lpId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.update(lpRef, {
    [lpReverseField]: assign
      ? admin.firestore.FieldValue.arrayUnion(userId)
      : admin.firestore.FieldValue.arrayRemove(userId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

/* ------------------------------------------------------------------ */
/* -------------------- ASSIGN LP → PARENT --------------------------- */
/* ------------------------------------------------------------------ */

export const assignLPToParent = onCall(
  { region: 'asia-south1' },
  async ({ data, auth }) => {
    await ensureAdmin(auth);

    const { parentId, lpId } = data || {};

    if (!parentId || !lpId) {
      throw new HttpsError('invalid-argument', 'parentId and lpId are required');
    }

    if (parentId === lpId) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot assign learning partner to themselves'
      );
    }

    const parent = await getUser(parentId);
    const lp = await getUser(lpId);

    if (normalizeRole(parent.role) !== 'parent') {
      throw new HttpsError('invalid-argument', 'parentId must be a parent');
    }

    if (normalizeRole(lp.role) !== 'learning-partner') {
      throw new HttpsError(
        'invalid-argument',
        'lpId must be a learning partner'
      );
    }

    await updateAssignment(parentId, lpId, 'parent', true);

    logger.info('LP assigned to parent', {
      adminUid: auth?.uid,
      parentId,
      lpId,
    });

    return { success: true };
  }
);

export const unassignLPFromParent = onCall(
  { region: 'asia-south1' },
  async ({ data, auth }) => {
    await ensureAdmin(auth);

    const { parentId, lpId } = data || {};

    if (!parentId || !lpId) {
      throw new HttpsError('invalid-argument', 'parentId and lpId are required');
    }

    await updateAssignment(parentId, lpId, 'parent', false);

    logger.info('LP unassigned from parent', {
      adminUid: auth?.uid,
      parentId,
      lpId,
    });

    return { success: true };
  }
);

/* ------------------------------------------------------------------ */
/* -------------------- ASSIGN LP → TEACHER -------------------------- */
/* ------------------------------------------------------------------ */

export const assignLPToTeacher = onCall(
  { region: 'asia-south1' },
  async ({ data, auth }) => {
    await ensureAdmin(auth);

    const { teacherId, lpId } = data || {};

    if (!teacherId || !lpId) {
      throw new HttpsError(
        'invalid-argument',
        'teacherId and lpId are required'
      );
    }

    if (teacherId === lpId) {
      throw new HttpsError(
        'invalid-argument',
        'Cannot assign learning partner to themselves'
      );
    }

    const teacher = await getUser(teacherId);
    const lp = await getUser(lpId);

    if (normalizeRole(teacher.role) !== 'teacher') {
      throw new HttpsError('invalid-argument', 'teacherId must be a teacher');
    }

    if (normalizeRole(lp.role) !== 'learning-partner') {
      throw new HttpsError(
        'invalid-argument',
        'lpId must be a learning partner'
      );
    }

    await updateAssignment(teacherId, lpId, 'teacher', true);

    logger.info('LP assigned to teacher', {
      adminUid: auth?.uid,
      teacherId,
      lpId,
    });

    return { success: true };
  }
);

export const unassignLPFromTeacher = onCall(
  { region: 'asia-south1' },
  async ({ data, auth }) => {
    await ensureAdmin(auth);

    const { teacherId, lpId } = data || {};

    if (!teacherId || !lpId) {
      throw new HttpsError(
        'invalid-argument',
        'teacherId and lpId are required'
      );
    }

    await updateAssignment(teacherId, lpId, 'teacher', false);

    logger.info('LP unassigned from teacher', {
      adminUid: auth?.uid,
      teacherId,
      lpId,
    });

    return { success: true };
  }
);

/* ------------------------------------------------------------------ */
/* -------------------- ADMIN SET USER ROLE -------------------------- */
/* ------------------------------------------------------------------ */

export const adminSetUserRole = onCall({ region: 'asia-south1' }, async (request) => {
  const { uid, role } = request.data;
  const callerUid = request.auth?.uid;

  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  // Ensure caller is an admin
  const callerSnap = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerSnap.data();
  const isAdmin = callerData?.role === 'admin' || callerData?.superUser === true;

  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Only admins can set user roles.');
  }

  // Validate role
  const validRoles = ['parent', 'kid', 'teacher', 'rm', 'admin'];
  if (!validRoles.includes(role)) {
    throw new HttpsError('invalid-argument', `Invalid role: ${role}`);
  }

  // Update user role
  await admin.firestore().collection('users').doc(uid).set(
    {
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: callerUid,
    },
    { merge: true }
  );

  return { ok: true };
});
