import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

type UserRole = 'parent' | 'teacher';

async function ensureAdmin(context: any) {
  if (!context.auth || !context.auth.token || !context.auth.token.admin) {
    logger.warn('Unauthorized callable call', { caller: context.auth?.uid });
    throw new HttpsError('permission-denied', 'Admin access required');
  }
}

async function ensureUserExists(uid: string) {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', `User ${uid} not found`);
    }
    return userDoc.data();
  } catch (err:any) {
    if (err instanceof HttpsError) throw err;
    logger.error('ensureUserExists error', { err, uid });
    throw new HttpsError('internal', 'Failed to verify user');
  }
}

async function updateAssignment(userId: string, lpId: string, userRole: UserRole, assign: boolean) {
  const db = admin.firestore();
  const batch = db.batch();

  const userRef = db.collection('users').doc(userId);
  const lpRef = db.collection('users').doc(lpId);

  if (assign) {
    batch.update(userRef, { assignedLPs: admin.firestore.FieldValue.arrayUnion(lpId) as any });
    const lpField = userRole === 'parent' ? 'assignedParents' : 'assignedTeachers';
    batch.update(lpRef, { [lpField]: admin.firestore.FieldValue.arrayUnion(userId) as any });
  } else {
    batch.update(userRef, { assignedLPs: admin.firestore.FieldValue.arrayRemove(lpId) as any });
    const lpField = userRole === 'parent' ? 'assignedParents' : 'assignedTeachers';
    batch.update(lpRef, { [lpField]: admin.firestore.FieldValue.arrayRemove(userId) as any });
  }

  await batch.commit();
}

// assign LP to parent
export const assignLPToParent = onCall({ region: 'asia-south1' }, async (data, context) => {
  await ensureAdmin(context);
  const { parentId, lpId } = (data as any) as { parentId: string; lpId: string };
  if (!parentId || !lpId) throw new HttpsError('invalid-argument', 'parentId and lpId required');
  await ensureUserExists(parentId);
  const lpData = await ensureUserExists(lpId);
  if (!lpData || (lpData as any).role !== 'learningPartner') throw new HttpsError('invalid-argument', 'lpId must be a learning partner');
  await updateAssignment(parentId, lpId, 'parent', true);
  return { success: true };
});

export const unassignLPFromParent = onCall({ region: 'asia-south1' }, async (data, context) => {
  await ensureAdmin(context);
  const { parentId, lpId } = (data as any) as { parentId: string; lpId: string };
  if (!parentId || !lpId) throw new HttpsError('invalid-argument', 'parentId and lpId required');
  await ensureUserExists(parentId);
  await ensureUserExists(lpId);
  await updateAssignment(parentId, lpId, 'parent', false);
  return { success: true };
});

export const assignLPToTeacher = onCall({ region: 'asia-south1' }, async (data, context) => {
  await ensureAdmin(context);
  const { teacherId, lpId } = (data as any) as { teacherId: string; lpId: string };
  if (!teacherId || !lpId) throw new HttpsError('invalid-argument', 'teacherId and lpId required');
  await ensureUserExists(teacherId);
  const lpData = await ensureUserExists(lpId);
  if (!lpData || (lpData as any).role !== 'learningPartner') throw new HttpsError('invalid-argument', 'lpId must be a learning partner');
  await updateAssignment(teacherId, lpId, 'teacher', true);
  return { success: true };
});

export const unassignLPFromTeacher = onCall({ region: 'asia-south1' }, async (data, context) => {
  await ensureAdmin(context);
  const { teacherId, lpId } = (data as any) as { teacherId: string; lpId: string };
  if (!teacherId || !lpId) throw new HttpsError('invalid-argument', 'teacherId and lpId required');
  await ensureUserExists(teacherId);
  await ensureUserExists(lpId);
  await updateAssignment(teacherId, lpId, 'teacher', false);
  return { success: true };
});
