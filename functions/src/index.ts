/**
 * Main Cloud Functions entry point.
 * Exposes:
 *  - setUserRole, getUidByEmail, adminResetPassword, subscribeNewsletter
 *  - plus re-exports of other modules (adminCreateUser, onAuthUserCreate, etc.)
 */

import { setGlobalOptions } from 'firebase-functions';
import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

// Ensure admin SDK talks to emulators when running locally so emulator-issued
// ID tokens verify correctly (avoids "invalid signature" errors).
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
}

// Limit max instances per function (cost + safety)
setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// ---------- Types ----------

interface SetUserRoleRequest {
  uid: string;
  role: 'admin' | 'teacher' | 'parent' | 'kid' | 'learningPartner';
}

interface SetUserRoleSuccessResponse {
  success: true;
  uid: string;
  role: string;
  message: string;
  timestamp: string;
}

interface SetUserRoleErrorResponse {
  success: false;
  error: string;
  code: string;
}

interface GetUidByEmailRequest {
  email: string;
}

interface GetUidByEmailResponse {
  uid: string;
}

interface AdminResetPasswordRequest {
  uid: string;
  newPassword: string;
}

interface AdminResetPasswordResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

interface SubscribeRequest {
  email: string;
}
interface SubscribeResponse {
  success: boolean;
}

interface GroqKidIdeaResponse {
  idea: string;
}

// Allowed roles for setUserRole
const ALLOWED_ROLES = ['admin', 'teacher', 'parent', 'kid', 'learningPartner'] as const;

// ---------- Helper: ensureAdmin ----------

/**
 * Ensure caller is admin:
 *  - token.admin === true OR token.role === 'admin'
 *  - OR /users/{uid}.role === 'admin' OR roles includes 'admin'
 */
async function ensureAdmin(auth: any) {
  if (!auth) {
    logger.warn('Admin callable called without auth');
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const callerUid = auth.uid;
  const tokenIsAdmin =
    auth.token?.admin === true || auth.token?.role === 'admin';

  if (tokenIsAdmin) return;

  try {
    const doc = await admin.firestore().collection('users').doc(callerUid).get();
    const data = doc.data();
    const docIsAdmin =
      !!data &&
      (
        data.role === 'admin' ||
        (Array.isArray(data.roles) && data.roles.includes('admin'))
      );

    if (!docIsAdmin) {
      logger.warn('ensureAdmin: caller not admin', { callerUid });
      throw new HttpsError('permission-denied', 'Admin access required');
    }
  } catch (err) {
    logger.error('ensureAdmin: error verifying admin via Firestore', {
      callerUid,
      error: String(err),
    });
    // Throw a standard error for HTTP functions
    const httpError = new Error('Admin access required');
    (httpError as any).code = 'permission-denied';
    throw httpError;
  }
}

// ---------- setUserRole ----------

export async function setUserRoleHandler(
  request: any
): Promise<SetUserRoleSuccessResponse | SetUserRoleErrorResponse> {
  const now = new Date().toISOString();
  const { data, auth } = request;

  try {
    await ensureAdmin(auth);

    const { uid, role } = data as SetUserRoleRequest;

    // Input validation
    if (!uid || typeof uid !== 'string' || uid.length !== 28) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid uid: must be a 28-character string'
      );
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      throw new HttpsError(
        'invalid-argument',
        `Invalid role: must be one of ${ALLOWED_ROLES.join(', ')}`
      );
    }

    // Get current role for logging
    let oldRole = 'none';
    try {
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      if (userDoc.exists) {
        oldRole = userDoc.data()?.role || 'none';
      }
    } catch (err) {
      logger.warn('Failed to fetch current role for user', { uid, error: String(err) });
    }

    // Update Firestore
    await admin.firestore().collection('users').doc(uid).update({
      role,
      roles: admin.firestore.FieldValue.arrayUnion(role),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update custom claims
    const customClaims = { role, [role]: true };
    await admin.auth().setCustomUserClaims(uid, customClaims);

    logger.info('setUserRole: Updated user role and claims', {
      uid,
      oldRole,
      newRole: role,
    });

    return {
      success: true,
      uid,
      role,
      message: `Role updated from ${oldRole} to ${role}`,
      timestamp: now,
    };
  } catch (error: any) {
    logger.error('setUserRole: Failed to update role', {
      error: error.message || String(error),
    });

    return {
      success: false,
      error: error.message || 'Unknown error',
      code: error.code || 'unknown',
    };
  }
}

export const setUserRole = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  setUserRoleHandler
);

// ---------- getUidByEmail ----------

export const getUidByEmail = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request): Promise<GetUidByEmailResponse> => {
    const { data, auth } = request;

    await ensureAdmin(auth);

    const { email } = data as GetUidByEmailRequest;
    if (!email || typeof email !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid email');
    }

    try {
      const user = await admin.auth().getUserByEmail(email);
      return { uid: user.uid };
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', 'No user found with that email');
      }
      logger.error('getUidByEmail: unexpected error', {
        email,
        error: String(error),
      });
      throw new HttpsError('internal', 'Failed to get UID');
    }
  }
);

// ---------- adminResetPassword ----------

export const adminResetPassword = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request): Promise<AdminResetPasswordResponse> => {
    const now = new Date().toISOString();
    const { data, auth } = request;

    await ensureAdmin(auth);

    const { uid, newPassword } = data as AdminResetPasswordRequest;

    if (!uid || typeof uid !== 'string' || uid.length !== 28) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid uid: must be a 28-character string'
      );
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid password: must be at least 6 characters'
      );
    }

    try {
      await admin.auth().updateUser(uid, { password: newPassword });

      logger.info('Password reset', {
        uid,
        changedBy: auth?.uid,
        timestamp: now,
      });

      return {
        success: true,
        message: 'Password reset successfully',
        timestamp: now,
      };
    } catch (error: any) {
      const httpError = error as HttpsError;
      if (httpError && (httpError as any).code) {
        throw httpError;
      }

      logger.error('Unexpected error in adminResetPassword', {
        error: String(error),
        uid,
        caller: auth?.uid,
      });
      throw new HttpsError(
        'internal',
        'An unexpected error occurred. Please try again.'
      );
    }
  }
);

// ---------- adminDeleteUser ----------

export const adminDeleteUser = onRequest(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request, response) => {
    // Always set CORS headers (even on errors) so the browser accepts the response
    const origin = request.headers.origin;
    if (origin && ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:5176'].includes(origin)) {
      response.set('Access-Control-Allow-Origin', origin);
    }
    response.set('Vary', 'Origin');
    response.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.set('Access-Control-Allow-Credentials', 'true');

    // Short-circuit preflight before any auth/logic
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    // Reject other HTTP verbs
    if (request.method !== 'POST') {
      response.status(405).send({ error: 'Method Not Allowed' });
      return;
    }

    try {
      const now = new Date().toISOString();

      // Ensure admin authentication
      const authHeader = request.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ')
        ? authHeader.split('Bearer ')[1]
        : null;

      if (!idToken) {
        logger.warn('adminDeleteUser: Missing Authorization header');
        response.status(401).send({ error: 'Unauthorized: Missing token' });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      await ensureAdmin({ uid: decodedToken.uid, token: decodedToken });

      // Parse request body
      const { uid } = request.body as { uid?: string };

      if (!uid || typeof uid !== 'string' || uid.length !== 28) {
        logger.warn('adminDeleteUser: Invalid UID in request body', { uid });
        response.status(400).send({ error: 'Invalid uid: must be a 28-character string' });
        return;
      }

      // Delete from Firebase Auth
      await admin.auth().deleteUser(uid);

      logger.info('adminDeleteUser: deleted user from Auth', {
        uid,
        deletedBy: decodedToken.uid,
        timestamp: now,
      });

      // Also delete from Firestore 'users' collection
      const userDocRef = admin.firestore().collection('users').doc(uid);
      await userDocRef.delete();
      logger.info('adminDeleteUser: deleted user from Firestore', { uid });

      response.status(200).send({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      logger.error('Unexpected error in adminDeleteUser', {
        error: String(error),
        code: error.code,
      });

      if (error.code === 'auth/user-not-found') {
        response.status(404).send({ error: 'User not found' });
      } else if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        response.status(403).send({ error: 'Permission denied' });
      } else {
        response.status(500).send({ error: 'Failed to delete user', details: error.message });
      }
    }
  }
);

// ---------- Re-exports from other modules ----------

export { adminCreateUser } from './adminCreateUser';
export { onAuthUserCreate } from './onAuthUserCreate';
export {
  onSessionComplete,
  onSessionCompleteTrigger,
} from './onSessionComplete';
export { adminGenerateResetLink } from './adminGenerateResetLink';
export { onEnrollmentUpdate } from './onEnrollmentUpdate';
export { adminProcessEnrollmentCSV } from './adminProcessEnrollmentCSV';
export { webhookPhonePe } from './webhookPhonePe';
export { createPhonePeOrder, verifyPhonePePayment } from './phonepePayments';
export {
  assignLPToParent,
  unassignLPFromParent,
  assignLPToTeacher,
  unassignLPFromTeacher,
} from './assignLP';

// ---------- subscribeNewsletter (callable) ----------

export const subscribeNewsletter = onCall(
  { region: 'asia-south1', memory: '128MiB', timeoutSeconds: 30 },
  async (request): Promise<SubscribeResponse> => {
    const { data, auth, rawRequest } = request;

    try {
      const { email } = data as SubscribeRequest;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new HttpsError('invalid-argument', 'Valid email required');
      }

      const db = admin.firestore();
      await db
        .collection('newsletter_subscribers')
        .doc(email.toLowerCase())
        .set(
          {
            email: email.toLowerCase(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: rawRequest?.headers?.referer || 'website',
            uid: auth?.uid || null,
          },
          { merge: true }
        );

      return { success: true };
    } catch (err: any) {
      logger.error('subscribeNewsletter error', { error: String(err) });
      throw new HttpsError('internal', 'Subscription failed');
    }
  }
);

export { checkSubscriptionAccess } from './checkSubscriptionAccess';
export { fetchAdminStats } from './fetchAdminStats';
export { soundDetectiveRound } from './soundDetective';
export { askTinySteps } from './ai/askTinySteps';

// ---------- groqKidIdea (callable for real-time use) ----------

/**
 * Callable function:
 * Input: { topic: string }  e.g. { topic: "animals" }
 * Output: { idea: string }
 *
 * Use from frontend with httpsCallable("groqKidIdea").
 */
export const groqKidIdea = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: ['GROQ_API_KEY'],
  },
  async (request): Promise<GroqKidIdeaResponse> => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      logger.error('groqKidIdea: GROQ_API_KEY missing in environment');
      throw new HttpsError(
        'failed-precondition',
        'GROQ_API_KEY is not set on the server.'
      );
    }

    const { data, auth } = request;
    const topic = (data?.topic as string | undefined)?.trim() || 'animals';

    logger.info('groqKidIdea called', {
      topic,
      callerUid: auth?.uid ?? null,
    });

    try {
      const groqResponse = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            temperature: 0.4,
            messages: [
              {
                role: 'system',
                content:
                  'You are a friendly Tiny Steps assistant. Create short, fun ideas for kids (ages 5–10) to speak or play based on a topic. Keep it to 2–3 sentences, simple, positive, and kid-friendly.',
              },
              {
                role: 'user',
                content: `Give me one fun speaking or activity idea for a child about the topic: "${topic}".`,
              },
            ],
            max_tokens: 120,
          }),
        }
      );

      const dataJson = await groqResponse.json();

      if (!groqResponse.ok) {
        logger.error('groqKidIdea: Groq error', {
          status: groqResponse.status,
          body: dataJson,
        });
        throw new HttpsError(
          'internal',
          `Groq error: ${groqResponse.status}`
        );
      }

      const idea =
        dataJson?.choices?.[0]?.message?.content?.trim() ??
        'Here is a Tiny Steps idea, but the AI did not send content.';

      return { idea };
    } catch (err: any) {
      logger.error('groqKidIdea: Groq call failed', {
        error: String(err),
      });
      throw new HttpsError(
        'internal',
        'Unable to generate idea right now. Please try again.'
      );
    }
  }
);

// ---------- Groq secrets + test endpoints ----------

/**
 * Simple HTTPS function to verify that GROQ_API_KEY
 * is available to Cloud Functions from Secret Manager.
 */
export const checkGroqSecret = onRequest(
  {
    region: 'asia-south1',
    secrets: ['GROQ_API_KEY'],
  },
  (req, res) => {
    const hasKey = !!process.env.GROQ_API_KEY;

    if (hasKey) {
      res
        .status(200)
        .send('✅ GROQ_API_KEY is available to Cloud Functions.');
    } else {
      res
        .status(500)
        .send('❌ GROQ_API_KEY is NOT available to Cloud Functions.');
    }
  }
);

/**
 * Test function that actually calls Groq once and returns a short message.
 * Use this to confirm network + key + model are all working end-to-end.
 */
export const testGroq = onRequest(
  {
    region: 'asia-south1',
    secrets: ['GROQ_API_KEY'],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      logger.error('testGroq: GROQ_API_KEY missing in environment');
      res.status(500).send('GROQ_API_KEY is not set for this function.');
      return;
    }

    try {
      const groqResponse = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            temperature: 0, // make it deterministic
            messages: [
              {
                role: 'system',
                content:
                  'You are a test bot. Answer ONLY this exact sentence: "Groq is working for Tiny Steps ✅". Do not add anything else.',
              },
              {
                role: 'user',
                content: 'Test the connection.',
              },
            ],
            max_tokens: 30,
          }),
        }
      );

      const data = await groqResponse.json();

      logger.info('testGroq: Groq HTTP status', {
        status: groqResponse.status,
      });

      if (!groqResponse.ok) {
        logger.error('testGroq: Groq error body', { data });
        res
          .status(500)
          .send(`Groq error: ${groqResponse.status} - see logs for details.`);
        return;
      }

      const message =
        data?.choices?.[0]?.message?.content ||
        'Groq call succeeded but no content returned.';

      res.status(200).send(message);
    } catch (err: any) {
      logger.error('testGroq: Groq call failed', {
        error: String(err),
      });
      res.status(500).send('Groq call failed. Check logs for details.');
    }
  }
);

// ---------- suspendUserHandler ----------

export async function suspendUserHandler(
  request: any
): Promise<{ success: boolean; message: string }> {
  const { data, auth } = request;

  try {
    await ensureAdmin(auth);

    const { uid } = data;

    if (!uid || typeof uid !== 'string' || uid.length !== 28) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid uid: must be a 28-character string'
      );
    }

    // Update Firestore to set status as suspended
    await admin.firestore().collection('users').doc(uid).update({
      status: 'suspended',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update custom claims to include suspended status
    const customClaims = { status: 'suspended' };
    await admin.auth().setCustomUserClaims(uid, customClaims);

    logger.info('suspendUserHandler: User suspended successfully', { uid });

    return { success: true, message: 'User suspended successfully' };
  } catch (error: any) {
    logger.error('suspendUserHandler: Failed to suspend user', {
      error: error.message || String(error),
    });

    return { success: false, message: error.message || 'Unknown error' };
  }
}
