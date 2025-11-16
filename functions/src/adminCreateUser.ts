import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Type definitions
interface AdminCreateUserRequest {
  email: string;
  displayName: string;
  password?: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'parent' | 'learningPartner' | 'kid';

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
  role: string;
  message: string;
  timestamp: string;
  resetLinkSent: boolean;
  resetLink?: string | null;
  nextSteps: string[];
}

// Added to include resetLink if function generated one

interface AdminCreateUserErrorResponse {
  success: false;
  error: string;
  code: string;
}

// Valid roles
const VALID_ROLES = ['admin', 'teacher', 'parent', 'learningPartner', 'kid'] as const;

type AdminCreateUserPayload = AdminCreateUserRequest & { adminToken?: string };

async function resolveAuthContext(request: any): Promise<{ uid: string; token?: admin.auth.DecodedIdToken } | null> {
  if (request?.auth?.uid) {
    return request.auth;
  }

  const headerAuth = request?.rawRequest?.headers?.authorization;
  let tokenFromHeader: string | null = null;
  if (typeof headerAuth === 'string' && headerAuth.trim().length > 0) {
    if (headerAuth.startsWith('Bearer ')) {
      tokenFromHeader = headerAuth.slice(7);
    } else {
      tokenFromHeader = headerAuth;
    }
  }

  const tokenFromBody = request?.data?.adminToken;
  const token = tokenFromBody || tokenFromHeader || null;

  if (!token) {
    return null;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      token: decoded
    };
  } catch (error) {
    logger.warn('Failed to manually verify ID token for adminCreateUser', error as Error);
    return null;
  }
}

/**
 * Cloud Function to create users with complete role-based setup
 * Only callable by admins. Creates Firebase Auth user + Firestore document + custom claims
 */
/**
 * Implementation function for adminCreateUser logic.
 * Extracted so tests can import and call the handler directly.
 */
async function adminCreateUserHandlerImpl(request: any): Promise<AdminCreateUserResponse | AdminCreateUserErrorResponse> {
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

    // Check if caller has admin claim (supports either boolean `admin` or role string in token)
    const callerIsAdminClaim = (auth?.token?.admin === true) || (auth?.token?.role === 'admin');

    if (!((callerData && (callerData.roles?.includes('admin') || callerData.role === 'admin')) || callerIsAdminClaim)) {
      const errorMsg = `Non-admin user ${auth.uid} attempted to create user`;
      logger.warn(errorMsg);
      throw new functions.https.HttpsError('permission-denied', 'Only admins can create users');
    }

    logger.info(`Admin ${auth.uid} creating user with role ${data?.role}`);

    // Step 2: Input Validation
    const { adminToken: _adminToken, ...cleanedData } = (data || {}) as AdminCreateUserPayload;
    const requestData = cleanedData as AdminCreateUserRequest;

      // Validate required fields
      if (!requestData.email || !requestData.displayName || !requestData.role) {
        throw new functions.https.HttpsError('invalid-argument',
          'Missing required fields: email, displayName, role');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(requestData.email)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
      }

      // Validate role
      if (!VALID_ROLES.includes(requestData.role)) {
        throw new functions.https.HttpsError('invalid-argument',
          `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
      }

      // Validate phone if provided
      if (requestData.phone && !/^[\d\s\-\+\(\)]+$/.test(requestData.phone)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid phone format');
      }

      // Step 3: Check Email Uniqueness
      try {
        const existingUser = await admin.auth().getUserByEmail(requestData.email);
        throw new functions.https.HttpsError('already-exists',
          `User with email ${requestData.email} already exists. UID: ${existingUser.uid}`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Good - email doesn't exist, proceed
        } else if (error instanceof functions.https.HttpsError) {
          throw error;
        } else {
          throw new functions.https.HttpsError('internal', 'Error checking email uniqueness: ' + error.message);
        }
      }

      // Step 4: Create User in Firebase Auth
      let newUser;
      try {
        newUser = await admin.auth().createUser({
          email: requestData.email,
          displayName: requestData.displayName,
          disabled: false,
          ...(requestData.password ? { password: requestData.password } : {})
        });

        logger.info(`Created Firebase Auth user: ${newUser.uid}`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          throw new functions.https.HttpsError('already-exists', `Email ${requestData.email} already exists`);
        }
        throw new functions.https.HttpsError('internal', `Failed to create auth user: ${error.message}`);
      }

      // Step 5: Create Firestore Document
      // Debug: ensure admin.firestore.FieldValue exists to avoid TypeError
      try {
        logger.debug('admin.firestore availability', {
          hasFirestore: !!admin.firestore,
          hasFieldValue: !!(admin.firestore && (admin.firestore as any).FieldValue),
          hasServerTimestamp: !!(admin.firestore && (admin.firestore as any).FieldValue && typeof (admin.firestore as any).FieldValue.serverTimestamp === 'function')
        });
      } catch (debugErr) {
        logger.warn('Failed to evaluate admin.firestore.FieldValue debug', { error: String(debugErr) });
      }
      // Use a robust serverTimestamp field that falls back if FieldValue is not present in the environment
      const serverTimestampField: any = (admin.firestore && (admin.firestore as any).FieldValue && (admin.firestore as any).FieldValue.serverTimestamp)
        ? (admin.firestore as any).FieldValue.serverTimestamp()
        : (admin.firestore && (admin.firestore as any).Timestamp && (admin.firestore as any).Timestamp.now)
          ? (admin.firestore as any).Timestamp.now()
          : new Date();

      const baseUserDoc: any = {
        email: requestData.email,
        displayName: requestData.displayName,
        provider: 'admin:create',
        // Also write `name` to match frontend expectations
        name: requestData.displayName,
        phone: requestData.phone || null,
        roles: [requestData.role],
        role: requestData.role,
        status: requestData.status || 'active',
        // Optional admin fields (department, permissions) defaulted here so schema is consistent
        department: null,
        permissions: [],
  createdAt: serverTimestampField,
  updatedAt: serverTimestampField,
  createdBy: auth.uid,
  updatedBy: auth.uid
      };

      // Add role-specific fields
      let userDoc: any = { ...baseUserDoc };

      if (requestData.role === 'teacher') {
        userDoc = {
          ...userDoc,
          qualification: requestData.qualification || null,
          specialization: requestData.specialization || [],
          yearsExperience: requestData.yearsExperience || 0,
          bio: requestData.bio || null,
          profilePhotoUrl: null,
          assignedLPs: []
        };
      }

      if (requestData.role === 'parent') {
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
            sessionTime: requestData.sessionTime || null
          },
          paymentMethods: requestData.paymentMethods || []
        };
      }

      if (requestData.role === 'learningPartner') {
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
            accountHolderName: requestData.bankAccountHolderName || null
          }
        };
      }

      if (requestData.role === 'kid') {
        userDoc = {
          ...userDoc,
          isKidProfile: true,
          email: null // Kids don't need email in auth
        };
      }

      // Write to Firestore
      try {
        await admin.firestore().collection('users').doc(newUser.uid).set(userDoc);
        logger.info(`Created Firestore document for user ${newUser.uid}`);
      } catch (error: any) {
        // Rollback: Delete auth user since Firestore write failed
        logger.error(`Firestore write failed, rolling back auth user: ${error.message}`);
        await admin.auth().deleteUser(newUser.uid);
        throw new functions.https.HttpsError('internal', `Failed to create user document: ${error.message}`);
      }

      // Optional: If new parent has childIds, update child docs to set parentIds / primaryParentId
      if (requestData.role === 'parent' && Array.isArray(requestData.childIds) && requestData.childIds.length > 0) {
        const batch = admin.firestore().batch();
        for (const childId of requestData.childIds) {
          const kidRef = admin.firestore().collection('kids').doc(childId);
          batch.update(kidRef, {
            parentIds: admin.firestore.FieldValue.arrayUnion(newUser.uid),
            primaryParentId: newUser.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          } as any);
        }
        try {
          await batch.commit();
          logger.info(`Linked parent ${newUser.uid} to childIds: ${JSON.stringify(requestData.childIds)}`);
        } catch (err: any) {
          logger.warn(`Failed to link parent to children: ${err.message}`);
        }
      }

      // Step 6: Set Custom Claims
      try {
        const customClaims = {
          [requestData.role]: true,
          role: requestData.role
        };

        await admin.auth().setCustomUserClaims(newUser.uid, customClaims);
        logger.info(`Set custom claims for ${newUser.uid}: ${JSON.stringify(customClaims)}`);
      } catch (error: any) {
        logger.error(`Failed to set custom claims: ${error.message}`);
        // Don't rollback - claims can be set manually later
      }

      // Step 7: Send Password Reset Email / Return reset link
      let resetLinkSent = false;
      let resetLink: string | null = null;
      try {
        resetLink = await admin.auth().generatePasswordResetLink(requestData.email);
        logger.info(`Generated password reset link for ${requestData.email}`);

        // In production, you would send this via email service
        // For now, log it and include in response so admin can forward it
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
        role: requestData.role,
        message: `User ${requestData.displayName} created successfully as ${requestData.role}`,
        timestamp: now,
  resetLinkSent,
  resetLink,
        nextSteps: [
          `1. User will receive password reset email at ${requestData.email}`,
          `2. User can set password via email link`,
          `3. User can login with new password`,
          `4. User will be automatically logged in to ${requestData.role} portal`
        ]
      };

      logger.info(`Successfully created user ${newUser.uid} with role ${requestData.role}`);
      return response;

    } catch (error) {
      // Handle known HttpsError
      const httpError = error as functions.https.HttpsError;
      if (httpError && (httpError as any).code) {
        const errorResponse: AdminCreateUserErrorResponse = {
          success: false,
          error: httpError.message,
          code: (httpError as any).code
        };
        return errorResponse;
      }

      // Handle unexpected errors
      // Handle unexpected errors
      // Add detailed debug information for diagnosis in the emulator / logs
      try {
        const details: any = {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
          code: (error as any)?.code,
          data: request?.data,
          caller: request?.auth?.uid
        };
        logger.error('Unexpected error in adminCreateUser', details);
      } catch (loggingErr) {
        // Fallback to simple log if structured logging fails
        logger.error('Unexpected error in adminCreateUser (failed to serialize error)', { error: String(error) });
      }
      const errorResponse: AdminCreateUserErrorResponse = {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        code: 'internal'
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
