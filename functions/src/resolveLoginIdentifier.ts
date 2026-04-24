import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

type LoginType = 'email' | 'phone' | 'username';

interface ResolveLoginIdentifierRequest {
  loginId?: string;
  loginType?: LoginType;
}

interface ResolveLoginIdentifierResponse {
  found: boolean;
  email?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !EMAIL_REGEX.test(trimmed)) return null;
  return trimmed;
};

const normalizeUsername = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, '');

const buildPhoneCandidates = (value: string): string[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const startsWithPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return [];

  const candidates = new Set<string>();
  candidates.add(digits);
  if (startsWithPlus) candidates.add(`+${digits}`);

  if (digits.length === 10) {
    candidates.add(`+91${digits}`);
    candidates.add(`91${digits}`);
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    const local = digits.slice(2);
    candidates.add(local);
    candidates.add(`+${digits}`);
    candidates.add(`+91${local}`);
  }

  if (digits.length === 13 && digits.startsWith('091')) {
    const local = digits.slice(3);
    candidates.add(local);
    candidates.add(`+91${local}`);
    candidates.add(`91${local}`);
  }

  return Array.from(candidates);
};

const resolveEmailFromAliasData = async (
  data: Record<string, unknown> | undefined,
): Promise<string | null> => {
  if (!data) return null;

  const directEmail =
    normalizeEmail(data.email) ||
    normalizeEmail(data.authEmail) ||
    normalizeEmail(data.loginEmail);
  if (directEmail) return directEmail;

  const uid =
    (typeof data.uid === 'string' && data.uid.trim()) ||
    (typeof data.userId === 'string' && data.userId.trim()) ||
    (typeof data.authUid === 'string' && data.authUid.trim()) ||
    '';
  if (!uid) return null;

  try {
    const authUser = await admin.auth().getUser(uid);
    return normalizeEmail(authUser.email) || null;
  } catch {
    return null;
  }
};

const resolveFromLoginAliases = async (keys: string[]): Promise<string | null> => {
  const db = admin.firestore();
  for (const key of keys) {
    if (!key) continue;

    const doc = await db.collection('loginAliases').doc(key).get();
    if (!doc.exists) continue;

    const email = await resolveEmailFromAliasData(doc.data() as Record<string, unknown> | undefined);
    if (email) return email;
  }

  return null;
};

const resolveFromUsersByField = async (
  field: string,
  value: string,
): Promise<string | null> => {
  const db = admin.firestore();
  const snap = await db.collection('users').where(field, '==', value).limit(2).get();
  if (snap.empty) return null;
  if (snap.size > 1) return null;

  const doc = snap.docs[0];
  const data = doc.data() as Record<string, unknown>;
  return (
    normalizeEmail(data.email) ||
    normalizeEmail(data.authEmail) ||
    normalizeEmail(data.loginEmail) ||
    (await resolveEmailFromAliasData({ uid: doc.id }))
  );
};

const resolveByUsername = async (loginId: string): Promise<string | null> => {
  const db = admin.firestore();
  const usernameLower = normalizeUsername(loginId);
  if (!usernameLower) return null;

  const usernameDoc = await db.collection('usernames').doc(usernameLower).get();
  if (usernameDoc.exists) {
    const email = await resolveEmailFromAliasData(
      usernameDoc.data() as Record<string, unknown> | undefined,
    );
    if (email) return email;
  }

  const aliasEmail = await resolveFromLoginAliases([
    `username:${usernameLower}`,
    usernameLower,
  ]);
  if (aliasEmail) return aliasEmail;

  const fromUserLower = await resolveFromUsersByField('usernameLower', usernameLower);
  if (fromUserLower) return fromUserLower;

  const fromUsername = await resolveFromUsersByField('username', loginId.trim());
  if (fromUsername) return fromUsername;

  return resolveFromUsersByField('userName', loginId.trim());
};

const resolveByPhone = async (loginId: string): Promise<string | null> => {
  const candidates = buildPhoneCandidates(loginId);
  if (!candidates.length) return null;

  const aliasKeys = new Set<string>();
  for (const value of candidates) {
    aliasKeys.add(`phone:${value}`);
    aliasKeys.add(value);
  }

  const aliasEmail = await resolveFromLoginAliases(Array.from(aliasKeys));
  if (aliasEmail) return aliasEmail;

  for (const value of candidates) {
    const email = await resolveFromUsersByField('phone', value);
    if (email) return email;
  }

  const digitsOnly = candidates
    .map((value) => value.replace(/\D/g, ''))
    .find((value) => value.length >= 10);
  if (!digitsOnly) return null;

  const local = digitsOnly.slice(-10);
  const fromPhoneLocal = await resolveFromUsersByField('phoneLocal', local);
  if (fromPhoneLocal) return fromPhoneLocal;

  return resolveFromUsersByField('phoneNormalized', local);
};

export const resolveLoginIdentifier = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 20,
  },
  async (request): Promise<ResolveLoginIdentifierResponse> => {
    const data = (request.data || {}) as ResolveLoginIdentifierRequest;
    const loginId = typeof data.loginId === 'string' ? data.loginId.trim() : '';
    if (!loginId) {
      throw new HttpsError('invalid-argument', 'Missing loginId');
    }

    const normalizedEmail = normalizeEmail(loginId);
    if (normalizedEmail) {
      return { found: true, email: normalizedEmail };
    }

    const loginType: LoginType =
      data.loginType === 'phone' || data.loginType === 'username' || data.loginType === 'email'
        ? data.loginType
        : buildPhoneCandidates(loginId).length
          ? 'phone'
          : 'username';

    const email =
      loginType === 'phone'
        ? await resolveByPhone(loginId)
        : await resolveByUsername(loginId);

    if (!email) return { found: false };
    return { found: true, email };
  },
);
