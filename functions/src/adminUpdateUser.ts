import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';
import {
  applyRoleMirrorTransition,
  buildRoleClaims,
  normalizeRole,
} from './helpers/roles';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;
const MAX_CUSTOM_CLAIMS_BYTES = 1000;

const USER_ID_UNAVAILABLE_MESSAGE =
  'This user ID is already taken or not available. Please try another user ID.';
const PHONE_ALREADY_IN_USE_MESSAGE =
  'This phone number is already in use. Please use a different phone number.';

const VALID_STATUS = ['active', 'suspended', 'archived'] as const;

type UserStatus = (typeof VALID_STATUS)[number];

interface AdminUpdateUserRequest {
  uid: string;
  displayName: string;
  email: string;
  phone?: string | null;
  role: string;
  status: UserStatus;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string | null): string | null {
  if (typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  return digits || null;
}

function validateRequest(data: AdminUpdateUserRequest) {
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Request data is required');
  }

  if (!data.uid || typeof data.uid !== 'string') {
    throw new HttpsError('invalid-argument', 'uid is required');
  }

  if (!data.displayName || typeof data.displayName !== 'string') {
    throw new HttpsError('invalid-argument', 'displayName is required');
  }
  const displayName = data.displayName.trim();
  if (displayName.length < 2 || displayName.length > 100) {
    throw new HttpsError('invalid-argument', 'displayName must be 2–100 chars');
  }

  if (!data.email || typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email.trim().toLowerCase())) {
    throw new HttpsError('invalid-argument', 'Valid email is required');
  }

  const normalizedRole =
    normalizeRole(data.role);

  if (!normalizedRole) {
    throw new HttpsError(
      'invalid-argument',
      'Invalid user role'
    );
  }

  if (!data.status || !VALID_STATUS.includes(data.status)) {
    throw new HttpsError(
      'invalid-argument',
      `status must be one of: ${VALID_STATUS.join(', ')}`
    );
  }

  if (data.phone != null) {
    if (typeof data.phone !== 'string') {
      throw new HttpsError('invalid-argument', 'Invalid phone. Use digits/spaces/+/-/()');
    }
    const trimmedPhone = data.phone.trim();
    if (trimmedPhone) {
      if (!PHONE_REGEX.test(trimmedPhone) || !normalizePhone(trimmedPhone)) {
        throw new HttpsError('invalid-argument', 'Invalid phone. Use digits/spaces/+/-/()');
      }
    }
  }
}

async function assertUniqueEmailAndPhone(params: {
  db: admin.firestore.Firestore;
  uid: string;
  normalizedEmail: string;
  normalizedPhone: string | null;
}) {
  const { db, uid, normalizedEmail, normalizedPhone } = params;
  const usersSnap = await db.collection('users').select('email', 'phone').get();

  for (const userDoc of usersSnap.docs) {
    if (userDoc.id === uid) continue;
    const data = userDoc.data() || {};

    const existingEmail = typeof data.email === 'string' ? normalizeEmail(data.email) : '';
    if (existingEmail && existingEmail === normalizedEmail) {
      throw new HttpsError('already-exists', USER_ID_UNAVAILABLE_MESSAGE);
    }

    if (normalizedPhone) {
      const existingPhone = typeof data.phone === 'string' ? normalizePhone(data.phone) : null;
      if (existingPhone && existingPhone === normalizedPhone) {
        throw new HttpsError('already-exists', PHONE_ALREADY_IN_USE_MESSAGE);
      }
    }
  }
}

async function assertAuthEmailAvailable(uid: string, email: string) {
  try {
    const authUser = await admin.auth().getUserByEmail(email);
    if (authUser.uid !== uid) {
      throw new HttpsError('already-exists', USER_ID_UNAVAILABLE_MESSAGE);
    }
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    if (err?.code === 'auth/user-not-found') return;
    if (err?.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', USER_ID_UNAVAILABLE_MESSAGE);
    }
    throw new HttpsError('internal', 'Failed checking existing user');
  }
}

function validateClaimsSize(claims: Record<string, unknown>) {
  const bytes = Buffer.byteLength(JSON.stringify(claims), 'utf8');
  if (bytes > MAX_CUSTOM_CLAIMS_BYTES) {
    throw new HttpsError(
      'invalid-argument',
      `Custom claims too large (${bytes} bytes). Max ${MAX_CUSTOM_CLAIMS_BYTES}.`
    );
  }
}

export const adminUpdateUser = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    await ensureAdmin(request.auth);

    const payload = (request.data || {}) as AdminUpdateUserRequest;
    validateRequest(payload);

    const uid = payload.uid.trim();
    const displayName = payload.displayName.trim();
    const email = normalizeEmail(payload.email);
    const role = normalizeRole(payload.role)!;
    const rawRole = role;
    const status = payload.status;
    const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
    const phoneKey = normalizePhone(phone);
    const db = admin.firestore();

    const userRef = db.collection('users').doc(uid);
    const beforeSnap = await userRef.get();
    if (!beforeSnap.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    await assertUniqueEmailAndPhone({
      db,
      uid,
      normalizedEmail: email,
      normalizedPhone: phoneKey,
    });
    await assertAuthEmailAvailable(uid, email);

    const beforeData = beforeSnap.data() || {};
    const beforeRole =
      normalizeRole(
        beforeData.role ??
        beforeData.rawRole,
      );

    // Keep Auth profile in sync so login identity and display name update immediately.
    try {
      await admin.auth().updateUser(uid, {
        email,
        displayName,
        disabled: status !== 'active',
      });
    } catch (err: any) {
      if (err?.code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', USER_ID_UNAVAILABLE_MESSAGE);
      }
      if (err?.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', 'Authentication user not found');
      }
      logger.error('adminUpdateUser: auth update failed', { uid, error: String(err) });
      throw new HttpsError('internal', 'Failed to update authentication user');
    }

    const ts = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    batch.set(userRef, {
      userId: uid,
      uid,
      name: displayName,
      displayName,
      email,
      phone: phone || null,
      role,
      rawRole: role,
      roles: [role],
      status,
      updatedAt: ts,
      updatedBy: request.auth?.uid || null,
    }, { merge: true });

    applyRoleMirrorTransition({
      db,
      batch,
      uid,
      previousRole: beforeRole,
      nextRole: role,
      profile: {
        email,
        displayName,
        phone: phone || null,
        status,
        updatedAt: ts,
        updatedBy: request.auth?.uid || null,
      },
    });

    await batch.commit();

    try {
      const authUser =
        await admin.auth().getUser(uid);

      const claims = buildRoleClaims(
        authUser.customClaims || {},
        role,
      );

      validateClaimsSize(claims);

      await admin.auth().setCustomUserClaims(
        uid,
        claims,
      );
    } catch (err) {
      logger.warn('adminUpdateUser: failed to refresh claims', { uid, error: String(err) });
    }

    logger.info('adminUpdateUser: updated user', {
      uid,
      updatedBy: request.auth?.uid || null,
      role,
      status,
    });

    return {
      success: true,
      uid,
      email,
      displayName,
      role,
      rawRole,
      status,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
    };
  }
);
