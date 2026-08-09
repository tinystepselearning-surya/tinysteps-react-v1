import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';

import { normalizeRole, type CanonicalRole } from './roles';
import { normalizeSchoolStatus } from './schools';

export type SchoolManagerKind = 'admin' | 'learningPartner';
export type SchoolReaderKind = SchoolManagerKind | 'schoolAdmin';

export interface AuthorizedSchoolManager {
  uid: string;
  kind: SchoolManagerKind;
  user: admin.firestore.DocumentData;
  school: admin.firestore.DocumentData;
  schoolRef: admin.firestore.DocumentReference;
}

export interface AuthorizedSchoolReader {
  uid: string;
  kind: SchoolReaderKind;
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
  role: CanonicalRole,
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

async function getSchoolOrThrow(
  schoolId: string,
): Promise<{
  school: admin.firestore.DocumentData;
  schoolRef: admin.firestore.DocumentReference;
}> {
  if (!schoolId || typeof schoolId !== 'string' || !schoolId.trim()) {
    throw new HttpsError('invalid-argument', 'schoolId is required');
  }

  const schoolRef = admin.firestore().collection('schools').doc(schoolId.trim());
  const schoolSnap = await schoolRef.get();
  if (!schoolSnap.exists) {
    throw new HttpsError('not-found', 'School not found');
  }

  return {
    school: schoolSnap.data() || {},
    schoolRef,
  };
}

async function schoolAdminHasMembership(
  uid: string,
  schoolId: string,
): Promise<boolean> {
  const snap = await admin.firestore().collection('schoolUsers').doc(uid).get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  if (data.role !== 'schoolAdmin' || data.status !== 'active') return false;
  if (!Array.isArray(data.schoolIds)) return false;
  return data.schoolIds.some(
    (value: unknown) => typeof value === 'string' && value.trim() === schoolId,
  );
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

export async function ensureSchoolReader(
  auth: { uid?: string } | null | undefined,
  schoolIdInput: string,
): Promise<AuthorizedSchoolReader> {
  const schoolId = schoolIdInput.trim();
  const current = await requireCurrentUser(auth);
  const { school, schoolRef } = await getSchoolOrThrow(schoolId);
  const status = normalizeSchoolStatus(school.status) || 'active';

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

  if (
    hasCanonicalRole(current.data, 'schoolAdmin') &&
    status !== 'archived' &&
    await schoolAdminHasMembership(current.uid, schoolId)
  ) {
    return {
      uid: current.uid,
      kind: 'schoolAdmin',
      user: current.data,
      school,
      schoolRef,
    };
  }

  throw new HttpsError(
    'permission-denied',
    'You are not authorized to read this school',
  );
}

export async function ensureSchoolManager(
  auth: { uid?: string } | null | undefined,
  schoolIdInput: string,
  options: { allowArchived?: boolean } = {},
): Promise<AuthorizedSchoolManager> {
  const schoolId = schoolIdInput.trim();
  const current = await requireCurrentUser(auth);
  const { school, schoolRef } = await getSchoolOrThrow(schoolId);
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
