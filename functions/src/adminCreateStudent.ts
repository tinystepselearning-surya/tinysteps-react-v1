import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const VALID_STATUS = ['active', 'suspended', 'archived'] as const;

type StudentStatus = (typeof VALID_STATUS)[number];

interface AdminCreateStudentRequest {
  parentId: string;
  fullName: string;
  ageYears: number;
  grade: string;
  status?: StudentStatus;
}

function normalizeNameForCompare(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeNameForStore(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function validateRequest(data: AdminCreateStudentRequest) {
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Request data is required');
  }

  if (!data.parentId || typeof data.parentId !== 'string') {
    throw new HttpsError('invalid-argument', 'parentId is required');
  }

  if (!data.fullName || typeof data.fullName !== 'string') {
    throw new HttpsError('invalid-argument', 'fullName is required');
  }
  const fullName = normalizeNameForStore(data.fullName);
  if (fullName.length < 2 || fullName.length > 100) {
    throw new HttpsError('invalid-argument', 'fullName must be between 2 and 100 characters');
  }

  if (typeof data.ageYears !== 'number' || !Number.isInteger(data.ageYears) || data.ageYears < 2 || data.ageYears > 15) {
    throw new HttpsError('invalid-argument', 'ageYears must be an integer between 2 and 15');
  }

  if (!data.grade || typeof data.grade !== 'string' || !data.grade.trim()) {
    throw new HttpsError('invalid-argument', 'grade is required');
  }

  if (data.status != null && !VALID_STATUS.includes(data.status)) {
    throw new HttpsError('invalid-argument', `status must be one of: ${VALID_STATUS.join(', ')}`);
  }
}

export const adminCreateStudent = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    await ensureAdmin(request.auth);

    const payload = (request.data || {}) as AdminCreateStudentRequest;
    validateRequest(payload);

    const parentId = payload.parentId.trim();
    const fullName = normalizeNameForStore(payload.fullName);
    const normalizedRequestedName = normalizeNameForCompare(fullName);
    const grade = payload.grade.trim();
    const ageYears = payload.ageYears;
    const status: StudentStatus = payload.status || 'active';

    const db = admin.firestore();

    const parentSnap = await db.collection('users').doc(parentId).get();
    if (!parentSnap.exists) {
      throw new HttpsError('not-found', 'Selected parent was not found');
    }
    const parentData = parentSnap.data() || {};
    const parentRole = typeof parentData.role === 'string' ? parentData.role : '';
    const isParentRole =
      parentRole === 'parent' ||
      (Array.isArray(parentData.roles) && parentData.roles.includes('parent'));
    if (!isParentRole) {
      throw new HttpsError('failed-precondition', 'Selected user is not a parent account');
    }

    // Prevent duplicate child names under the same parent.
    const existingKidsSnap = await db
      .collection('kids')
      .where('parentIds', 'array-contains', parentId)
      .select('fullName', 'name', 'displayName')
      .get();

    const duplicate = existingKidsSnap.docs.find((docSnap) => {
      const kid = docSnap.data() as { fullName?: string; name?: string; displayName?: string };
      const existingName =
        (typeof kid.fullName === 'string' && kid.fullName) ||
        (typeof kid.name === 'string' && kid.name) ||
        (typeof kid.displayName === 'string' && kid.displayName) ||
        '';
      return existingName && normalizeNameForCompare(existingName) === normalizedRequestedName;
    });

    if (duplicate) {
      throw new HttpsError(
        'already-exists',
        `A student named "${fullName}" already exists under this parent. Use a different name or update the existing student.`
      );
    }

    const kidRef = db.collection('kids').doc();
    const ts = admin.firestore.FieldValue.serverTimestamp();

    const batch = db.batch();
    batch.set(kidRef, {
      fullName,
      age: ageYears,
      grade,
      status,
      parentId,
      parentIds: [parentId],
      primaryParentId: parentId,
      summary: {
        phonicsMastery: 0,
        grammarMastery: 0,
        speakingMastery: 0,
        attendanceRate30d: 0,
        creditsRemaining: 0,
      },
      createdAt: ts,
      updatedAt: ts,
      createdBy: request.auth?.uid || null,
      updatedBy: request.auth?.uid || null,
    }, { merge: true });

    batch.set(db.collection('users').doc(parentId), {
      childIds: admin.firestore.FieldValue.arrayUnion(kidRef.id),
      updatedAt: ts,
      updatedBy: request.auth?.uid || null,
    }, { merge: true });

    await batch.commit();

    logger.info('adminCreateStudent: created student', {
      studentId: kidRef.id,
      parentId,
      fullName,
      createdBy: request.auth?.uid || null,
    });

    return {
      success: true,
      kidId: kidRef.id,
      parentId,
      fullName,
      message: `Student "${fullName}" created successfully`,
      timestamp: new Date().toISOString(),
    };
  }
);

