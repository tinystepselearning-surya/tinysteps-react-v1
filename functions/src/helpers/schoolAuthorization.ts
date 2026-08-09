import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';

import { normalizeRole } from './roles';
import { normalizeSchoolStatus } from './schools';

export type SchoolManagerKind = 'admin' | 'learningPartner';

export interface AuthorizedSchoolManager {
  uid: string;
  kind: SchoolManagerKind;
  user: admin.firestore.DocumentData;
  school: admin.firestore.DocumentData;
  schoolRef: admin.firestore.DocumentReference;
}

function isActiveOrLegacyStatus(data: admin.firestore.DocumentData): boolean {
  if (data.status === undefined || data.status === null) return true;
  return typeof data.status === 'string' && data.status.trim().toLowerCase() === 'active';
}

function hasCanonicalRole(
  data: admin.firestore.DocumentData,
  role: 'admin' | 'learningPartner',
): boolean {
  if (normalizeRole(data.role) === role) return true;
  if (!Array.isArray(data.roles)) return false;
  return data.roles.some((value: unknown) => normalizeRole(value) === role);
}

async function requireCurrentUser(
  auth: { uid?: string } | null | undefined,
): Promise<{ uid: string; data: admin.firestore.DocumentData }> {
  const uid = auth?.uid;
  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const snap = await admin.firestore().collection('users').doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError('permission-denied', 'Current user record was not found');
  }

  const data = snap.data() || {};
  if (!isActiveOrLegacyStatus(data)) {
    throw new HttpsError('permission-denied', 'This account is not active');
  }

  return { uid, data };
}

export async function ensureCurrentActiveAdmin(
  auth: { uid?: string } | null | undefined,
): Promise<{ uid: string; user: admin.firestore.DocumentData }> {
  const current = await requireCurrentUser(auth);
  if (!hasCanonicalRole(current.data, 'admin')) {
    logger.warn('school-domain admin authorization denied', {
      uid: current.uid,
      role: current.data.role,
      status: current.data.status,
    });
    throw new HttpsError('permission-denied', 'Admin access required');
  }
  return { uid: current.uid, user: current.data };
}

export async function ensureSchoolManager(
  auth: { uid?: string } | null | undefined,
  schoolId: string,
  options: { allowArchived?: boolean } = {},
): Promise<AuthorizedSchoolManager> {
  if (!schoolId || typeof schoolId !== 'string') {
    throw new HttpsError('invalid-argument', 'schoolId is required');
  }

  const current = await requireCurrentUser(auth);
  const db = admin.firestore();
  const schoolRef = db.collection('schools').doc(schoolId.trim());
  const schoolSnap = await schoolRef.get();

  if (!schoolSnap.exists) {
    throw new HttpsError('not-found', 'School not found');
  }

  const school = schoolSnap.data() || {};
  const status = normalizeSchoolStatus(school.status) || 'active';
  if (!options.allowArchived && status === 'archived') {
    throw new HttpsError('failed-precondition', 'Archived schools cannot be modified');
  }

  if (hasCanonicalRole(current.data, 'admin')) {
    return {
      uid: current.uid,
      kind: 'admin',
      user: current.data,
      school,
      schoolRef,
    };
  }

  if (
    hasCanonicalRole(current.data, 'learningPartner') &&
    typeof school.learningPartnerId === 'string' &&
    school.learningPartnerId === current.uid
  ) {
    return {
      uid: current.uid,
      kind: 'learningPartner',
      user: current.data,
      school,
      schoolRef,
    };
  }

  throw new HttpsError(
    'permission-denied',
    'You are not authorized to manage this school',
  );
}

export async function ensureSchoolReadableByManager(
  auth: { uid?: string } | null | undefined,
  schoolId: string,
): Promise<AuthorizedSchoolManager> {
  return ensureSchoolManager(auth, schoolId, { allowArchived: true });
}
