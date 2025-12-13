/**
 * Tiny Steps – Cloud Functions Entry Point (Clean Architecture Edition)
 *
 * Responsibilities of index.ts:
 * 1) Initialize Firebase Admin SDK
 * 2) Configure emulator & global options
 * 3) Export handlers from modular function files
 *
 * ❌ NO BUSINESS LOGIC HERE
 * ❌ NO inline admin checks
 * ❌ NO try/catch blocks
 * ❌ NO role logic
 * ❌ NO custom claim logic
 *
 * All logic lives in dedicated modules.
 */

import { setGlobalOptions } from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// ---------------------------------------------------------------------------
// Emulator & App Initialization
// ---------------------------------------------------------------------------

if (process.env.FUNCTIONS_EMULATOR === 'true') {
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8085';
}

setGlobalOptions({ maxInstances: 10 });

if (!admin.apps.length) {
  admin.initializeApp();
}

// ---------------------------------------------------------------------------
// Local Helpers (Only minimal helpers allowed here)
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUid(uid: string) {
  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'UID is required');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(uid) || uid.length < 20 || uid.length > 128) {
    throw new HttpsError('invalid-argument', 'Invalid UID format');
  }
}

// Small helper to normalize role
function normalizeRole(role: string): 'admin' | 'teacher' | 'parent' | 'learning-partner' {
  if (role === 'admin' || role === 'teacher' || role === 'parent') {
    return role;
  }
  if (role === 'learning-partner' || role === 'learningPartner') {
    return 'learning-partner';
  }
  throw new HttpsError('invalid-argument', `Unsupported role: ${role}`);
}

// ---------------------------------------------------------------------------
// 1) setUserRole
// ---------------------------------------------------------------------------

export const setUserRole = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const { ensureAdmin } = await import('./helpers/adminGuard');
    await ensureAdmin(request.auth);

    const { uid, role } = request.data;
    validateUid(uid);

    const normalizedRole = normalizeRole(role);

    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();

    const oldRole = userDoc.exists ? userDoc.data()?.role ?? 'none' : 'none';

    await userRef.set(
      {
        role: normalizedRole,
        rawRole: role,
        roles: admin.firestore.FieldValue.arrayUnion(normalizedRole),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: request.auth?.uid,
      },
      { merge: true }
    );

    const existingClaims = (await admin.auth().getUser(uid)).customClaims ?? {};
    await admin.auth().setCustomUserClaims(uid, {
      ...existingClaims,
      role: normalizedRole,
      rawRole: role,
      [normalizedRole]: true,
    });

    return {
      success: true,
      uid,
      role,
      normalizedRole,
      message: `Role updated from ${oldRole} → ${normalizedRole}`,
      timestamp: new Date().toISOString(),
    };
  }
);

// ---------------------------------------------------------------------------
// 2) getUidByEmail
// ---------------------------------------------------------------------------

export const getUidByEmail = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const { ensureAdmin } = await import('./helpers/adminGuard');
    await ensureAdmin(request.auth);

    const email = request.data?.email?.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      throw new HttpsError('invalid-argument', 'Valid email required');
    }

    try {
      const user = await admin.auth().getUserByEmail(email);
      return { uid: user.uid };
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', 'No user found');
      }
      throw new HttpsError('internal', 'Failed to lookup user');
    }
  }
);

// ---------------------------------------------------------------------------
// 3) adminResetPassword
// ---------------------------------------------------------------------------

export const adminResetPassword = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const { ensureAdmin } = await import('./helpers/adminGuard');
    await ensureAdmin(request.auth);

    const { uid, newPassword } = request.data;
    validateUid(uid);

    if (!newPassword || newPassword.length < 6) {
      throw new HttpsError('invalid-argument', 'Password must be ≥ 6 chars');
    }

    await admin.auth().updateUser(uid, { password: newPassword });

    return {
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString(),
    };
  }
);

// ---------------------------------------------------------------------------
// 4) adminDeleteUser
// ---------------------------------------------------------------------------

export const adminDeleteUser = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const { ensureAdmin } = await import('./helpers/adminGuard');
    await ensureAdmin(request.auth);

    const { uid } = request.data;
    validateUid(uid);

    await admin.auth().deleteUser(uid);
    await admin.firestore().collection('users').doc(uid).delete();

    return { success: true, message: 'User deleted', timestamp: new Date().toISOString() };
  }
);

// ---------------------------------------------------------------------------
// 5) suspendUser
// ---------------------------------------------------------------------------

export const suspendUser = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const { ensureAdmin } = await import('./helpers/adminGuard');
    await ensureAdmin(request.auth);

    const { uid } = request.data;
    validateUid(uid);

    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.update({
      status: 'suspended',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth?.uid,
    });

    const existingClaims = (await admin.auth().getUser(uid)).customClaims ?? {};
    await admin.auth().setCustomUserClaims(uid, {
      ...existingClaims,
      status: 'suspended',
    });

    await admin.auth().updateUser(uid, { disabled: true });

    return { success: true, message: 'User suspended', timestamp: new Date().toISOString() };
  }
);

// ---------------------------------------------------------------------------
// 6) subscribeNewsletter
// ---------------------------------------------------------------------------

export const subscribeNewsletter = onCall(
  { region: 'asia-south1', memory: '128MiB', timeoutSeconds: 30 },
  async (request) => {
    const email = request.data?.email?.toLowerCase().trim();

    if (!EMAIL_REGEX.test(email)) {
      throw new HttpsError('invalid-argument', 'Valid email required');
    }

    await admin.firestore().collection('newsletter_subscribers').doc(email).set(
      {
        email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        uid: request.auth?.uid ?? null,
        source: request.rawRequest?.headers?.referer ?? 'website',
      },
      { merge: true }
    );

    return { success: true };
  }
);

// ---------------------------------------------------------------------------
// 7) groqKidIdea
// ---------------------------------------------------------------------------

export const groqKidIdea = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60, secrets: ['GROQ_API_KEY'] },
  async (request) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'GROQ_API_KEY not set');
    }

    const topic = request.data?.topic?.trim() || 'animals';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content: 'You are a friendly Tiny Steps assistant...',
          },
          {
            role: 'user',
            content: `Give me a fun speaking idea for kids about: ${topic}`,
          },
        ],
      }),
    });

    const json = await response.json();
    return { idea: json?.choices?.[0]?.message?.content?.trim() ?? 'No idea generated' };
  }
);

// ---------------------------------------------------------------------------
// Additional Function Modules (Auto-exported)
// ---------------------------------------------------------------------------

export { adminCreateUser } from './adminCreateUser';
export { createStudentForParent } from './parentStudents';
export { onSessionComplete, onSessionCompleteTrigger } from './onSessionComplete';
export { adminGenerateResetLink } from './adminGenerateResetLink';
export { webhookPhonePe } from './webhookPhonePe';
export { createPhonePeOrder, verifyPhonePePayment } from './phonepePayments';
export {
  assignLPToParent,
  unassignLPFromParent,
  assignLPToTeacher,
  unassignLPFromTeacher,
} from './assignLP';
export { askTinySteps } from './ai/askTinySteps';
