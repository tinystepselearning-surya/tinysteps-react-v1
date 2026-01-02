// functions/src/parentStundent.ts
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Ensure Admin SDK is initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// ---------- Constants ----------

const VALID_GENDERS = ['male', 'female', 'other', 'prefer-not-to-say'] as const;
const VALID_STATUSES = ['active', 'inactive', 'trial'] as const;

// ✅ Keep your existing limits (3–25) as in your current file
const MAX_STUDENT_AGE_YEARS = 25;
const MIN_STUDENT_AGE_YEARS = 3;

// ---------- Types ----------

type CallerRole =
  | 'admin'
  | 'teacher'
  | 'parent'
  | 'learningPartner'
  | 'learning-partner'
  | 'unknown';

interface CreateStudentRequest {
  parentId: string;

  fullName: string;
  preferredName?: string;

  grade?: string; // e.g. "Grade 1", "UKG"
  board?: string; // e.g. "CBSE", "ICSE", "IB", "State"

  // ✅ NEW: store age instead of dob
  // Accept number or string (some clients send strings)
  ageYears?: number | string;

  // ✅ Optional legacy input: if an old client still sends dob, we can compute ageYears.
  // We will NOT store dob in Firestore.
  dob?: string; // "YYYY-MM-DD" (legacy / optional)

  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  status?: 'active' | 'inactive' | 'trial';

  courses?: string[]; // e.g. ["phonics-foundation", "basic-grammar"]
  notes?: string;

  emergencyContact?: string;
  medicalNotes?: string;
  profilePhotoUrl?: string;
}

interface CreateStudentResponse {
  success: true;
  parentId: string;
  studentId: string;
  message: string;
  timestamp: string;
}

interface CreateStudentErrorResponse {
  success: false;
  error: string;
  code: string;
}

// ---------- Helpers ----------

async function getCallerRole(
  auth: { uid: string; token?: admin.auth.DecodedIdToken } | null,
): Promise<CallerRole> {
  if (!auth?.uid) return 'unknown';

  // Prefer custom claims (faster)
  const tokenRole = auth.token?.role as CallerRole | undefined;
  if (tokenRole) {
    logger.debug('getCallerRole: using token role', { uid: auth.uid, role: tokenRole });
    return tokenRole;
  }

  // Fallback to Firestore users doc
  try {
    const userDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    if (!userDoc.exists) {
      logger.warn('getCallerRole: user doc not found', { uid: auth.uid });
      return 'unknown';
    }

    const data = userDoc.data();
    const role = data?.role as CallerRole | undefined;

    logger.debug('getCallerRole: using Firestore role', { uid: auth.uid, role });
    return role || 'unknown';
  } catch (err) {
    logger.warn('getCallerRole: failed to read users doc', {
      uid: auth.uid,
      error: String(err),
    });
    return 'unknown';
  }
}

function validateDobFormatIfProvided(dob: string): void {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dob)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'dob must be in ISO format YYYY-MM-DD (e.g., 2015-03-25)',
    );
  }

  const date = new Date(dob);
  if (isNaN(date.getTime())) {
    throw new functions.https.HttpsError('invalid-argument', 'dob must be a valid date');
  }

  if (date > new Date()) {
    throw new functions.https.HttpsError('invalid-argument', 'dob cannot be in the future');
  }
}

function computeAgeYearsFromDob(dob: string): number | null {
  try {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

    const birth = new Date(y, mo - 1, d);
    if (Number.isNaN(birth.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const hasHadBirthdayThisYear =
      now.getMonth() > birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hasHadBirthdayThisYear) age -= 1;

    return age >= 0 && age <= 60 ? age : null;
  } catch {
    return null;
  }
}

function parseAndValidateAgeYears(value: any): number {
  let n: number;

  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new functions.https.HttpsError('invalid-argument', 'ageYears is required');
    }
    n = Number(trimmed);
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'ageYears is required');
  }

  if (!Number.isFinite(n)) {
    throw new functions.https.HttpsError('invalid-argument', 'ageYears must be a number');
  }
  if (!Number.isInteger(n)) {
    throw new functions.https.HttpsError('invalid-argument', 'ageYears must be a whole number');
  }

  if (n < MIN_STUDENT_AGE_YEARS) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Student must be at least ${MIN_STUDENT_AGE_YEARS} years old`,
    );
  }

  if (n > MAX_STUDENT_AGE_YEARS) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Student must be younger than ${MAX_STUDENT_AGE_YEARS} years`,
    );
  }

  return n;
}

function validateCreateStudentInput(data: CreateStudentRequest) {
  // Parent ID
  if (!data.parentId || typeof data.parentId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'parentId is required and must be a string');
  }

  // Full name
  if (!data.fullName || typeof data.fullName !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'fullName is required');
  }

  if (data.fullName.length < 2 || data.fullName.length > 100) {
    throw new functions.https.HttpsError('invalid-argument', 'fullName must be between 2 and 100 characters');
  }

  // Preferred name
  if (data.preferredName && data.preferredName.length > 50) {
    throw new functions.https.HttpsError('invalid-argument', 'preferredName must be at most 50 characters');
  }

  // Grade
  if (data.grade && data.grade.length > 50) {
    throw new functions.https.HttpsError('invalid-argument', 'grade must be at most 50 characters');
  }

  // Board
  if (data.board && data.board.length > 50) {
    throw new functions.https.HttpsError('invalid-argument', 'board must be at most 50 characters');
  }

  // ✅ Age validation (required). If missing but dob provided (legacy), compute ageYears.
  const hasAge =
    data.ageYears !== undefined && data.ageYears !== null && String(data.ageYears).trim() !== '';
  const hasDob = !!data.dob;

  if (!hasAge && !hasDob) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ageYears is required (or provide dob for legacy clients)',
    );
  }

  if (!hasAge && hasDob && data.dob) {
    validateDobFormatIfProvided(data.dob);
    const computed = computeAgeYearsFromDob(data.dob);
    if (computed == null) {
      throw new functions.https.HttpsError('invalid-argument', 'Unable to compute ageYears from dob');
    }
    data.ageYears = computed;
  }

  // Normalize + validate ageYears
  data.ageYears = parseAndValidateAgeYears(data.ageYears);

  // Gender validation (runtime)
  if (data.gender && !VALID_GENDERS.includes(data.gender)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `gender must be one of: ${VALID_GENDERS.join(', ')}`,
    );
  }

  // Status validation (runtime)
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `status must be one of: ${VALID_STATUSES.join(', ')}`,
    );
  }

  // Notes
  if (data.notes && data.notes.length > 2000) {
    throw new functions.https.HttpsError('invalid-argument', 'notes must be at most 2000 characters');
  }

  // Emergency contact
  if (data.emergencyContact && data.emergencyContact.length > 200) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'emergencyContact must be at most 200 characters',
    );
  }

  // Medical notes
  if (data.medicalNotes && data.medicalNotes.length > 1000) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'medicalNotes must be at most 1000 characters',
    );
  }

  // Courses validation
  if (data.courses) {
    if (!Array.isArray(data.courses)) {
      throw new functions.https.HttpsError('invalid-argument', 'courses must be an array');
    }

    if (data.courses.length > 20) {
      throw new functions.https.HttpsError('invalid-argument', 'Maximum 20 courses allowed');
    }

    for (const course of data.courses) {
      if (typeof course !== 'string' || course.trim().length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Each course must be a non-empty string');
      }
      if (course.length > 100) {
        throw new functions.https.HttpsError('invalid-argument', 'Course name must be at most 100 characters');
      }
    }
  }
}

// ---------- Core Implementation ----------

async function createStudentForParentHandlerImpl(
  request: any,
): Promise<CreateStudentResponse | CreateStudentErrorResponse> {
  const now = new Date().toISOString();

  try {
    const rawData = request?.data as CreateStudentRequest | undefined;
    const auth = request?.auth as
      | { uid: string; token?: admin.auth.DecodedIdToken }
      | undefined;

    // 1. Auth check
    if (!auth?.uid) {
      logger.warn('createStudentForParent: unauthenticated call', {
        ip: request?.rawRequest?.ip,
      });
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    if (!rawData) {
      throw new functions.https.HttpsError('invalid-argument', 'Request data is required');
    }

    // 2. Role-based authorization: **ONLY ADMIN**
    const callerRole = await getCallerRole(auth);

    if (callerRole !== 'admin') {
      logger.warn('createStudentForParent: non-admin attempted student creation', {
        callerUid: auth.uid,
        callerRole,
        requestedParentId: rawData.parentId,
      });
      throw new functions.https.HttpsError('permission-denied', 'Only admins can create students');
    }

    // 3. Comprehensive validation (also normalizes ageYears to number)
    validateCreateStudentInput(rawData);

    const {
      parentId,
      fullName,
      preferredName,
      grade,
      board,
      gender,
      status = 'active',
      courses = [],
      notes,
      emergencyContact,
      medicalNotes,
      profilePhotoUrl,
    } = rawData;

    const ageYears = rawData.ageYears as number;

    logger.info('createStudentForParent: validated input', {
      parentId,
      fullName,
      ageYears,
      callerUid: auth.uid,
    });

    // 4. Ensure parent doc exists and is active
    const db = admin.firestore();
    const parentRef = db.collection('parents').doc(parentId);
    const parentSnap = await parentRef.get();

    if (!parentSnap.exists) {
      logger.warn('createStudentForParent: parent not found', {
        parentId,
        callerUid: auth.uid,
      });
      throw new functions.https.HttpsError('not-found', 'Parent account not found');
    }

    // Verify parent is active
    const parentData = parentSnap.data();
    if (parentData?.status && parentData.status !== 'active') {
      logger.warn('createStudentForParent: parent not active', {
        parentId,
        status: parentData.status,
        callerUid: auth.uid,
      });
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cannot add students to an inactive parent account',
      );
    }

    // 5. Check for duplicate students (by fullName)
    const studentsCol = parentRef.collection('students');
    const existingStudents = await studentsCol
      .where('fullName', '==', fullName)
      .where('status', 'in', ['active', 'trial'])
      .get();

    if (!existingStudents.empty) {
      logger.warn('createStudentForParent: duplicate student detected', {
        parentId,
        fullName,
        existingCount: existingStudents.size,
        callerUid: auth.uid,
      });

      throw new functions.https.HttpsError(
        'already-exists',
        `An active student named "${fullName}" already exists under this parent. Use a different name or update the existing student.`,
      );
    }

    // 6. Create student doc under /parents/{parentId}/students/{studentId}
    const studentRef = studentsCol.doc(); // auto-ID
    const studentId = studentRef.id;

    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    const studentDoc: any = {
      parentId,
      studentId,
      fullName,
      preferredName: preferredName || null,
      grade: grade || null,
      board: board || null,

      // ✅ Store age only (NOT dob)
      ageYears,

      gender: gender || null,

      status, // 'active' | 'inactive' | 'trial'
      courses, // string[]
      notes: notes || null,

      emergencyContact: emergencyContact || null,
      medicalNotes: medicalNotes || null,
      profilePhotoUrl: profilePhotoUrl || null,

      // Learning metrics (initialized to defaults)
      enrollmentDate: serverTimestamp,
      lastActiveDate: null,
      totalSessionsCompleted: 0,
      currentLevel: grade || 'beginner',

      // Metadata
      createdAt: serverTimestamp,
      updatedAt: serverTimestamp,
      createdBy: auth.uid,
      updatedBy: auth.uid,
      createdByRole: callerRole,
    };

    await studentRef.set(studentDoc);

    logger.info('createStudentForParent: student created successfully', {
      parentId,
      studentId,
      fullName,
      ageYears,
      callerUid: auth.uid,
      callerRole,
      hasPhoto: !!profilePhotoUrl,
      coursesCount: courses.length,
    });

    return {
      success: true,
      parentId,
      studentId,
      message: `Student "${fullName}" created successfully under parent ${parentId}`,
      timestamp: now,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      const errResp: CreateStudentErrorResponse = {
        success: false,
        error: error.message,
        code: error.code,
      };
      logger.warn('createStudentForParent: known error', {
        code: error.code,
        message: error.message,
      });
      return errResp;
    }

    logger.error('createStudentForParent: unexpected error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errResp: CreateStudentErrorResponse = {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'internal',
    };
    return errResp;
  }
}

// ---------- Exported Callable ----------

export const createStudentForParent = functions.https.onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
    // enforceAppCheck: true, // Enable once App Check is configured
  },
  createStudentForParentHandlerImpl,
);
