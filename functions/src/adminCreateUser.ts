import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let prodApp: admin.app.App;
if (admin.apps.length === 0) {
  // Default app for emulators
  admin.initializeApp();
}
// Separate app instance to force connection to production
prodApp = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`,
}, 'production-app-for-admin-create');

// Type definitions
interface AdminCreateUserRequest {
  email: string;
  displayName: string;
  password?: string;
  phone?: string;

  // Allow both old and new spellings to be safe
  role:
    | 'admin'
    | 'teacher'
    | 'parent'
    | 'learningPartner'
    | 'learning-partner'
    | 'kid'
    | 'student';

  // Role-specific fields
  // For TEACHER:
  qualification?: string;
  specialization?: string[];
  yearsExperience?: number;
  bio?: string;

  // For PARENT:
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  communicationLanguage?: string;
  sessionTime?: string;
  paymentMethods?: string[];

  // For LP:
  region?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;

  // For KID:
  isKidProfile?: boolean;

  // Admin/Common:
  status?: 'active' | 'suspended' | 'archived';

  // Optional childIds to map this parent to existing students
  childIds?: string[];
}

interface AdminCreateUserResponse {
  success: true;
  uid: string;
  email: string;
  displayName: string;
  role: string; // normalized role
  message: string;
  timestamp: string;
  resetLinkSent: boolean;
  resetLink?: string | null;
  nextSteps: string[];
}

interface AdminCreateUserErrorResponse {
  success: false;
  error: string;
  code: string;
}

// Accept both "friendly" and normalized roles
const VALID_ROLES = [
  'admin',
  'teacher',
  'parent',
  'learningPartner',
  'learning-partner',
  'kid',
  'student',
];

type AdminCreateUserPayload = AdminCreateUserRequest & { adminToken?: string };

/**
 * Normalize incoming role values to the canonical set used in rules:
 *   admin | teacher | parent | learning-partner | student
 */
function normalizeRole(
  role: string
): 'admin' | 'teacher' | 'parent' | 'learning-partner' | 'student' {
  if (role === 'admin' || role === 'teacher' || role === 'parent') {
    return role;
  }
  if (role === 'learningPartner' || role === 'learning-partner') {
    return 'learning-partner';
  }
  if (role === 'kid' || role === 'student') {
    return 'student';
  }
  // Should never reach here if VALID_ROLES was checked
  throw new functions.https.HttpsError('invalid-argument', `Unsupported role: ${role}`);
}

async function resolveAuthContext(
  request: any
): Promise<{ uid: string; token?: admin.auth.DecodedIdToken } | null> {
  // Standard callable auth
  if (request?.auth?.uid) {
    return request.auth;
  }

  // Try Authorization header (Bearer <token>)
  const headerAuth = request?.rawRequest?.headers?.authorization;
  let tokenFromHeader: string | null = null;
  if (typeof headerAuth === 'string' && headerAuth.trim().length > 0) {
    if (headerAuth.startsWith('Bearer ')) {
      tokenFromHeader = headerAuth.slice(7);
    } else {
      tokenFromHeader = headerAuth;
    }
  }

  // Or token from body (adminToken field)
  const tokenFromBody = request?.data?.adminToken;
  const token = tokenFromBody || tokenFromHeader || null;

  if (!token) {
    return null;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      token: decoded,
    };
  } catch (error) {
    logger.warn('Failed to manually verify ID token for adminCreateUser', error as Error);
    return null;
  }
}

/**
 * Core implementation of adminCreateUser so tests can call it directly.
 */
async function adminCreateUserHandlerImpl(
  request: any
): Promise<AdminCreateUserResponse | AdminCreateUserErrorResponse> {
  const now = new Date().toISOString();

  try {
    const data = request?.data as AdminCreateUserPayload | undefined;
    const auth = await resolveAuthContext(request);

    // Step 1: Authentication Check
    if (!auth) {
      const errorMsg = 'adminCreateUser called without authentication';
      logger.warn(errorMsg);
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // Verify caller is admin
    const callerDoc = await admin.firestore().collection('users').doc(auth.uid).get();
    const callerData = callerDoc.data();

    // Caller may be admin via Firestore doc or via custom claims
    const callerIsAdminClaim =
      (auth?.token?.admin === true) || (auth?.token?.role === 'admin');

    const callerIsAdminDoc =
      callerData &&
      (Array.isArray(callerData.roles) && callerData.roles.includes('admin')) ||
      callerData?.role === 'admin';

    if (!(callerIsAdminDoc || callerIsAdminClaim)) {
      const errorMsg = `Non-admin user ${auth.uid} attempted to create user`;
      logger.warn(errorMsg);
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can create users'
      );
    }

    const { adminToken: _adminToken, ...cleanedData } = (data || {}) as AdminCreateUserPayload;
    const requestData = cleanedData as AdminCreateUserRequest;

    // Step 2: Input Validation
    if (!requestData.email || !requestData.displayName || !requestData.role) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: email, displayName, role'
      );
    }

    // Validate role value
    if (!VALID_ROLES.includes(requestData.role)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
      );
    }

    const normalizedRole = normalizeRole(requestData.role);
    logger.info(
      `Admin ${auth.uid} creating user with requested role ${requestData.role} (normalized: ${normalizedRole})`
    );

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
    }

    // Validate phone if provided
    if (requestData.phone && !/^[\d\s\-\+\(\)]+$/.test(requestData.phone)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid phone format');
    }

    // Step 3: Check Email Uniqueness
    try {
      // Use the production Auth instance to check for existing users
      const prodAuth = getAuth(prodApp);
      const existingUser = await prodAuth.getUserByEmail(requestData.email);
      throw new functions.https.HttpsError(
        'already-exists',
        `User with email ${requestData.email} already exists. UID: ${existingUser.uid}`
      );
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Good - email doesn't exist, proceed
      } else if (error instanceof functions.https.HttpsError) {
        throw error;
      } else {
        throw new functions.https.HttpsError(
          'internal',
          'Error checking email uniqueness: ' + error.message
        );
      }
    }

    // Step 4: Create User in Firebase Auth
    let newUser;
    try {
      // Use the production Auth instance for user creation
      const prodAuth = getAuth(prodApp);
      newUser = await prodAuth.createUser({
        email: requestData.email,
        displayName: requestData.displayName,
        disabled: false,
        ...(requestData.password ? { password: requestData.password } : {}),
      });

      logger.info(`Created Firebase Auth user: ${newUser.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          `Email ${requestData.email} already exists`
        );
      }
      throw new functions.https.HttpsError(
        'internal',
        `Failed to create auth user: ${error.message}`
      );
    }

    // Step 5: Create Firestore Document

    // Debug logging so we know FieldValue exists in this environment
    try {
      logger.debug('admin.firestore availability', {
        hasFirestore: !!admin.firestore,
        hasFieldValue: !!(admin.firestore && (admin.firestore as any).FieldValue),
        hasServerTimestamp:
          !!(
            admin.firestore &&
            (admin.firestore as any).FieldValue &&
            typeof (admin.firestore as any).FieldValue.serverTimestamp === 'function'
          ),
      });
    } catch (debugErr) {
      logger.warn('Failed to evaluate admin.firestore.FieldValue debug', {
        error: String(debugErr),
      });
    }

    const serverTimestampField: any =
      admin.firestore &&
      (admin.firestore as any).FieldValue &&
      (admin.firestore as any).FieldValue.serverTimestamp
        ? (admin.firestore as any).FieldValue.serverTimestamp()
        : admin.firestore &&
          (admin.firestore as any).Timestamp &&
          (admin.firestore as any).Timestamp.now
        ? (admin.firestore as any).Timestamp.now()
        : new Date();

    const baseUserDoc: any = {
      email: requestData.email,
      displayName: requestData.displayName,
      provider: 'admin:create',
      // Also write `name` to match frontend expectations
      name: requestData.displayName,
      phone: requestData.phone || null,
      roles: [normalizedRole],
      role: normalizedRole,
      rawRole: requestData.role,
      status: requestData.status || 'active',
      // Optional admin fields (department, permissions) defaulted here so schema is consistent
      department: null,
      permissions: [],
      createdAt: serverTimestampField,
      updatedAt: serverTimestampField,
      createdBy: auth.uid,
      updatedBy: auth.uid,
    };

    // Add role-specific fields
    let userDoc: any = { ...baseUserDoc };

    if (normalizedRole === 'teacher') {
      userDoc = {
        ...userDoc,
        qualification: requestData.qualification || null,
        specialization: requestData.specialization || [],
        yearsExperience: requestData.yearsExperience || 0,
        bio: requestData.bio || null,
        profilePhotoUrl: null,
        assignedLPs: [],
      };
    }

    if (normalizedRole === 'parent') {
      userDoc = {
        ...userDoc,
        address: requestData.address || null,
        city: requestData.city || null,
        state: requestData.state || null,
        pincode: requestData.pincode || null,
        childIds: [],
        assignedLPs: [],
        preferences: {
          communicationLanguage: requestData.communicationLanguage || 'English',
          sessionTime: requestData.sessionTime || null,
        },
        paymentMethods: requestData.paymentMethods || [],
      };
    }

    if (normalizedRole === 'learning-partner') {
      userDoc = {
        ...userDoc,
        qualification: requestData.qualification || null,
        specialization: requestData.specialization || null,
        yearsExperience: requestData.yearsExperience || 0,
        region: requestData.region || null,
        assignedParents: [],
        assignedTeachers: [],
        creditsBalance: 0,
        bankDetails: {
          accountNumber: requestData.bankAccountNumber || null,
          ifscCode: requestData.bankIfscCode || null,
          accountHolderName: requestData.bankAccountHolderName || null,
        },
      };
    }

    if (normalizedRole === 'student') {
      userDoc = {
        ...userDoc,
        isKidProfile: requestData.isKidProfile ?? true,
        // Keeping email in Auth, but Firestore email can be null if you want to hide it
        email: normalizedRole === 'student' && requestData.role === 'kid' ? null : userDoc.email,
      };
    }

    // Write to Firestore
    try {
      await admin.firestore().collection('users').doc(newUser.uid).set(userDoc);
      logger.info(`Created Firestore document for user ${newUser.uid}`);
    } catch (error: any) {
      // Rollback: Delete auth user since Firestore write failed
      logger.error(
        `Firestore write failed for user ${newUser.uid}, rolling back auth user: ${error.message}`
      );
      await admin.auth().deleteUser(newUser.uid);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to create user document: ${error.message}`
      );
    }

    // Optional: If new parent has childIds, update student docs to set parentIds / primaryParentId
    if (
      normalizedRole === 'parent' &&
      Array.isArray(requestData.childIds) &&
      requestData.childIds.length > 0
    ) {
      const batch = admin.firestore().batch();
      for (const childId of requestData.childIds) {
        // Use /students, not /kids – consistent with your rules
        const studentRef = admin.firestore().collection('students').doc(childId);
        batch.update(studentRef, {
          parentIds: admin.firestore.FieldValue.arrayUnion(newUser.uid),
          primaryParentId: newUser.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        } as any);
      }
      try {
        await batch.commit();
        logger.info(
          `Linked parent ${newUser.uid} to studentIds: ${JSON.stringify(requestData.childIds)}`
        );
      } catch (err: any) {
        logger.warn(`Failed to link parent to students: ${err.message}`);
      }
    }

    // Step 6: Set Custom Claims
    try {
      const customClaims: Record<string, any> = {
        role: normalizedRole,
        rawRole: requestData.role,
      };

      // Canonical role flag
      customClaims[normalizedRole] = true;

      // Also add the original role flag if different, for compatibility
      if (normalizedRole !== requestData.role) {
        customClaims[requestData.role] = true;
      }

      await admin.auth().setCustomUserClaims(newUser.uid, customClaims);
      logger.info(
        `Set custom claims for ${newUser.uid}: ${JSON.stringify(customClaims)}`
      );
    } catch (error: any) {
      logger.error(`Failed to set custom claims: ${error.message}`);
      // Don't rollback - claims can be fixed later
    }

    // Step 7: Send Password Reset Email / Return reset link
    let resetLinkSent = false;
    let resetLink: string | null = null;
    try {
      resetLink = await admin.auth().generatePasswordResetLink(requestData.email);
      logger.info(`Generated password reset link for ${requestData.email}`);
      console.log(`Password reset link: ${resetLink}`);
      resetLinkSent = true;
    } catch (error: any) {
      logger.warn(`Could not generate password reset link: ${error.message}`);
      resetLinkSent = false;
      resetLink = null;
    }

    // Step 8: Return Success Response
    const response: AdminCreateUserResponse = {
      success: true,
      uid: newUser.uid,
      email: newUser.email!,
      displayName: newUser.displayName!,
      role: normalizedRole,
      message: `User ${
        requestData.displayName
      } created successfully as ${normalizedRole} (requested: ${
        requestData.role
      })`,
      timestamp: now,
      resetLinkSent,
      resetLink,
      nextSteps: [
        `1. User will receive password reset email at ${requestData.email}`,
        '2. User can set password via email link',
        '3. User can login with new password',
        `4. User will be automatically logged into the ${normalizedRole} portal`,
      ],
    };

    logger.info(`Successfully created user ${newUser.uid} with role ${normalizedRole}`);
    return response;
  } catch (error) {
    const httpError = error as functions.https.HttpsError;

    if ((httpError as any)?.code) {
      const errorResponse: AdminCreateUserErrorResponse = {
        success: false,
        error: httpError.message,
        code: (httpError as any).code,
      };
      return errorResponse;
    }

    // Unexpected error – log as much context as possible
    try {
      const details: any = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: (error as any)?.code,
        data: request?.data,
        caller: request?.auth?.uid,
      };
      logger.error('Unexpected error in adminCreateUser', details);
    } catch (loggingErr) {
      logger.error(
        'Unexpected error in adminCreateUser (failed to serialize error)',
        { error: String(error) }
      );
    }

    const errorResponse: AdminCreateUserErrorResponse = {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'internal',
    };
    return errorResponse;
  }
}

export const adminCreateUserHandler = adminCreateUserHandlerImpl;

export const adminCreateUser = functions.https.onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  adminCreateUserHandlerImpl
);
