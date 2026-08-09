import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';
import {
  applyRoleMirrorTransition,
  buildRoleClaims,
  normalizeRole,
} from './helpers/roles';

if (!admin.apps.length) {
  admin.initializeApp();
}

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

    if (normalizeRole(lp.role) !== 'learningPartner') {
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

    if (normalizeRole(lp.role) !== 'learningPartner') {
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

export const adminSetUserRole = onCall(
  { region: 'asia-south1' },
  async (request) => {
    await ensureAdmin(request.auth);

    const uid =
      typeof request.data?.uid === 'string'
        ? request.data.uid.trim()
        : '';

    const role =
      normalizeRole(request.data?.role);

    if (!uid) {
      throw new HttpsError(
        'invalid-argument',
        'uid is required',
      );
    }

    if (!role) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid role',
      );
    }

    const db = admin.firestore();
    const userRef =
      db.collection('users').doc(uid);

    const userSnap =
      await userRef.get();

    if (!userSnap.exists) {
      throw new HttpsError(
        'not-found',
        'User not found',
      );
    }

    const before =
      userSnap.data() || {};

    const previousRole =
      normalizeRole(
        before.role ??
        before.rawRole,
      );

    const displayName =
      String(
        before.displayName ||
        before.name ||
        '',
      ).trim() || 'User';

    const email =
      String(before.email || '')
        .trim()
        .toLowerCase();

    const phone =
      typeof before.phone === 'string'
        ? before.phone
        : null;

    const status =
      typeof before.status === 'string'
        ? before.status
        : 'active';

    const ts =
      admin.firestore.FieldValue
        .serverTimestamp();

    const batch = db.batch();

    batch.set(
      userRef,
      {
        role,
        rawRole: role,
        roles: [role],
        updatedAt: ts,
        updatedBy:
          request.auth?.uid || null,
      },
      { merge: true },
    );

    applyRoleMirrorTransition({
      db,
      batch,
      uid,
      previousRole,
      nextRole: role,
      profile: {
        email,
        displayName,
        phone,
        status,
        updatedAt: ts,
        updatedBy:
          request.auth?.uid || null,
      },
    });

    await batch.commit();

    const authUser =
      await admin.auth().getUser(uid);

    const claims =
      buildRoleClaims(
        authUser.customClaims || {},
        role,
      );

    await admin.auth()
      .setCustomUserClaims(
        uid,
        claims,
      );

    logger.info(
      'Admin changed user role',
      {
        adminUid:
          request.auth?.uid,
        uid,
        previousRole,
        nextRole: role,
      },
    );

    return {
      ok: true,
      uid,
      role,
    };
  },
);
