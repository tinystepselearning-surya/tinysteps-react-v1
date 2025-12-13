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
const MAX_STUDENT_AGE_YEARS = 25;
const MIN_STUDENT_AGE_YEARS = 3;

// ---------- Types ----------

type CallerRole = 'admin' | 'teacher' | 'parent' | 'learningPartner' | 'learning-partner' | 'unknown';

interface CreateStudentRequest {
  parentId: string;

  fullName: string;
  preferredName?: string;

  grade?: string;        // e.g. "Grade 1", "UKG"
  board?: string;        // e.g. "CBSE", "ICSE", "IB", "State"
  dob?: string;          // ISO string "YYYY-MM-DD"
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';

  status?: 'active' | 'inactive' | 'trial';

  // Courses the child is enrolled in
  courses?: string[];    // e.g. ["phonics-foundation", "basic-grammar"]

  notes?: string;        // internal notes for teachers/RMs only
  
  // Optional additional fields
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
  auth: { uid: string; token?: admin.auth.DecodedIdToken } | null
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
    const doc = await admin.firestore().collection('users').doc(auth.uid).get();
    if (!doc.exists) {
      logger.warn('getCallerRole: user doc not found', { uid: auth.uid });
      return 'unknown';
    }
    
    const data = doc.data();
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

function validateDateOfBirth(dob: string): void {
  // Check ISO format YYYY-MM-DD
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dob)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'dob must be in ISO format YYYY-MM-DD (e.g., 2015-03-25)'
    );
  }
  
  const date = new Date(dob);
  if (isNaN(date.getTime())) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'dob must be a valid date'
    );
  }
  
  // Check if date is reasonable (not in future, not too old)
  const now = new Date();
  const maxDate = new Date(now.getFullYear() - MIN_STUDENT_AGE_YEARS, now.getMonth(), now.getDate());
  const minDate = new Date(now.getFullYear() - MAX_STUDENT_AGE_YEARS, 0, 1);
  
  if (date > now) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'dob cannot be in the future'
    );
  }
  
  if (date > maxDate) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Student must be at least ${MIN_STUDENT_AGE_YEARS} years old`
    );
  }
  
  if (date < minDate) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Student must be younger than ${MAX_STUDENT_AGE_YEARS} years`
    );
  }
}

function validateCreateStudentInput(data: CreateStudentRequest) {
  // Parent ID
  if (!data.parentId || typeof data.parentId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'parentId is required and must be a string'
    );
  }

  // Full name
  if (!data.fullName || typeof data.fullName !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'fullName is required'
    );
  }

  if (data.fullName.length < 2 || data.fullName.length > 100) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'fullName must be between 2 and 100 characters'
    );
  }

  // Preferred name
  if (data.preferredName && data.preferredName.length > 50) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'preferredName must be at most 50 characters'
    );
  }

  // Grade
  if (data.grade && data.grade.length > 50) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'grade must be at most 50 characters'
    );
  }

  // Board
  if (data.board && data.board.length > 50) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'board must be at most 50 characters'
    );
  }

  // Date of birth
  if (data.dob) {
    validateDateOfBirth(data.dob);
  }

  // Gender validation (runtime)
  if (data.gender && !VALID_GENDERS.includes(data.gender)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `gender must be one of: ${VALID_GENDERS.join(', ')}`
    );
  }

  // Status validation (runtime)
  if (data.status && !VALID_STATUSES.includes(data.status)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `status must be one of: ${VALID_STATUSES.join(', ')}`
    );
  }

  // Notes
  if (data.notes && data.notes.length > 2000) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'notes must be at most 2000 characters'
    );
  }

  // Emergency contact
  if (data.emergencyContact && data.emergencyContact.length > 200) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'emergencyContact must be at most 200 characters'
    );
  }

  // Medical notes
  if (data.medicalNotes && data.medicalNotes.length > 1000) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'medicalNotes must be at most 1000 characters'
    );
  }

  // Courses validation
  if (data.courses) {
    if (!Array.isArray(data.courses)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'courses must be an array'
      );
    }

    if (data.courses.length > 20) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Maximum 20 courses allowed'
      );
    }

    // Validate each course is a non-empty string
    for (const course of data.courses) {
      if (typeof course !== 'string' || course.trim().length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Each course must be a non-empty string'
        );
      }
      if (course.length > 100) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Course name must be at most 100 characters'
        );
      }
    }
  }
}

// ---------- Core Implementation ----------

async function createStudentForParentHandlerImpl(
  request: any
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
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required'
      );
    }

    if (!rawData) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Request data is required'
      );
    }

    // 2. Role-based authorization: **ONLY ADMIN**
    const callerRole = await getCallerRole(auth);

    if (callerRole !== 'admin') {
      logger.warn('createStudentForParent: non-admin attempted student creation', {
        callerUid: auth.uid,
        callerRole,
        requestedParentId: rawData.parentId,
      });
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can create students'
      );
    }

    // 3. Comprehensive validation
    validateCreateStudentInput(rawData);

    const {
      parentId,
      fullName,
      preferredName,
      grade,
      board,
      dob,
      gender,
      status = 'active',
      courses = [],
      notes,
      emergencyContact,
      medicalNotes,
      profilePhotoUrl,
    } = rawData;

    logger.info('createStudentForParent: validated input', {
      parentId,
      fullName,
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
      throw new functions.https.HttpsError(
        'not-found',
        'Parent account not found'
      );
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
        'Cannot add students to an inactive parent account'
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
        `An active student named "${fullName}" already exists under this parent. Use a different name or update the existing student.`
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
      dob: dob || null,
      gender: gender || null,

      status,                       // 'active' | 'inactive' | 'trial'
      courses,                      // string[]
      notes: notes || null,

      // Additional fields for education platform
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

/**
 * Callable function to create a student under a parent's account.
 * 
 * @access Admin only
 * @path /parents/{parentId}/students/{autoId}
 * @param {CreateStudentRequest} data - Student details
 * @returns {CreateStudentResponse | CreateStudentErrorResponse}
 * 
 * Security:
 * - Only admins can call this function
 * - Parent must exist and be active
 * - Duplicate students (by name) are rejected
 * - Comprehensive input validation
 * 
 * Students are Firestore-only (no Firebase Auth account)
 * and live as subcollections under their parent.
 */
export const createStudentForParent = functions.https.onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
    // enforceAppCheck: true, // Enable once App Check is configured
  },
  createStudentForParentHandlerImpl
);
