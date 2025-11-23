// src/lib/auth.ts
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';
import type { AuthUser, AuthRole } from '../store/useAuthStore';

const VALID_ROLES: AuthRole[] = [
  'admin',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
];

const roleRedirectMap: Record<AuthRole, string> = {
  admin: '/surya',
  teacher: '/teacher',
  parent: '/parent',
  kid: '/parent/kids',
  learningPartner: '/learning-partner',
};

/**
 * STRICT admin login – used only for Surya (/surya/login).
 * Requires Firebase custom claims:
 *   - claims.admin === true  OR
 *   - claims.role === 'admin'
 */
async function handleAdminLogin(email: string, password: string) {
  const normalizedEmail = email.trim();

  const credential = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password,
  );
  const firebaseUser = credential.user;

  // Force refresh token so we read latest custom claims
  const tokenResult = await firebaseUser.getIdTokenResult(true);
  const claims = tokenResult.claims as any;

  const isAdmin =
    claims.admin === true || claims.role === 'admin';

  if (!isAdmin) {
    // This account is NOT allowed to be an admin → sign out + hard error
    await signOut(auth);
    throw new Error(
      'This account is not authorized for Surya Admin access.',
    );
  }

  const authUser: AuthUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'Admin',
    role: 'admin',
  };

  useAuthStore.getState().setUser(authUser);

  // Hard redirect to ensure full app re-evaluates RoleGate, etc.
  window.location.href = roleRedirectMap.admin;
}

/**
 * Resolve role for non-admin users (parent/teacher/LP/kid)
 * 1) Trust valid Firebase claim if present
 * 2) Else, trust expectedRole (from URL)
 * 3) Else, fallback to 'kid'
 */
function normalizeNonAdminRole(
  fromClaims?: string | null,
  fromExpected?: string | null,
): AuthRole {
  if (fromClaims && VALID_ROLES.includes(fromClaims as AuthRole)) {
    return fromClaims as AuthRole;
  }

  if (fromExpected && VALID_ROLES.includes(fromExpected as AuthRole)) {
    return fromExpected as AuthRole;
  }

  return 'kid';
}

async function handleNonAdminLogin(
  email: string,
  password: string,
  expectedRole?: string,
) {
  const normalizedEmail = email.trim();

  const credential = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password,
  );
  const firebaseUser = credential.user;

  const tokenResult = await firebaseUser.getIdTokenResult();
  const claims = tokenResult.claims as any;
  const roleFromClaims = claims.role as string | undefined;

  const role = normalizeNonAdminRole(roleFromClaims, expectedRole ?? null);

  // Only hard-fail if claims explicitly say a DIFFERENT role
  if (
    expectedRole &&
    roleFromClaims &&
    roleFromClaims !== expectedRole
  ) {
    await signOut(auth);
    throw new Error(
      `This account is not a ${expectedRole} account. Please use the correct login page.`,
    );
  }

  const authUser: AuthUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'User',
    role,
  };

  useAuthStore.getState().setUser(authUser);

  const destination = roleRedirectMap[role] ?? '/';
  window.location.href = destination;
}

// ---------- PUBLIC API USED BY LoginPage & Surya Login ----------

export async function handleLogin(
  email: string,
  password: string,
  expectedRole?: string,
) {
  // Surya/admin path → STRICT admin check
  if (expectedRole === 'admin') {
    return handleAdminLogin(email, password);
  }

  // Everyone else → non-admin path
  return handleNonAdminLogin(email, password, expectedRole);
}

export async function handleLoginWithGoogle(expectedRole?: string) {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const firebaseUser = credential.user;

  const tokenResult = await firebaseUser.getIdTokenResult();
  const claims = tokenResult.claims as any;
  const roleFromClaims = claims.role as string | undefined;

  const role = normalizeNonAdminRole(
    roleFromClaims,
    expectedRole ?? 'parent',
  );

  // Only hard-fail if claims explicitly contradict the expected role
  if (
    expectedRole &&
    roleFromClaims &&
    roleFromClaims !== expectedRole
  ) {
    await signOut(auth);
    throw new Error(
      `This Google account is not a ${expectedRole} account.`,
    );
  }

  const authUser: AuthUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'User',
    role,
  };

  useAuthStore.getState().setUser(authUser);

  const destination = roleRedirectMap[role] ?? '/';
  window.location.href = destination;
}

export async function handleLogout() {
  await signOut(auth);
  useAuthStore.getState().clearUser();
}
