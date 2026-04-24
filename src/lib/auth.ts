// src/lib/auth.ts
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import { callFunction } from './callFunctions';
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
  learningPartner: '/learning-partner/dashboard',
};

const LOGIN_ID_NOT_FOUND_MESSAGE =
  "We couldn't find this login ID. Please check your phone number, username, or email.";
const LOGIN_TIMEOUT_MESSAGE =
  'Login is taking longer than expected. Please check your internet connection and try again.';

const RESOLVER_TIMEOUT_MS = 12_000;
const SIGN_IN_TIMEOUT_MS = 15_000;
const CLAIMS_TIMEOUT_MS = 10_000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class LoginTimeoutError extends Error {
  constructor(public readonly label: string) {
    super(LOGIN_TIMEOUT_MESSAGE);
    this.name = 'LoginTimeoutError';
  }
}

const isNativeCapacitorRuntime = () => {
  if (typeof window === 'undefined') return false;

  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    try {
      return Boolean(cap.isNativePlatform());
    } catch {
      // Ignore bridge/runtime issues.
    }
  }

  const protocol = window.location?.protocol;
  return protocol === 'capacitor:' || protocol === 'ionic:';
};

const shouldLogLoginDebug = () =>
  import.meta.env.DEV || isNativeCapacitorRuntime();

const logLoginStage = (event: string, data?: Record<string, unknown>) => {
  if (!shouldLogLoginDebug()) return;
  if (data) {
    console.info(`[auth] ${event}`, data);
    return;
  }
  console.info(`[auth] ${event}`);
};

const redirectAfterLogin = (destination: string) => {
  if (typeof window === 'undefined') return;

  const isNativeRuntime = isNativeCapacitorRuntime();
  const mode = isNativeRuntime ? 'native-spa' : 'web-reload';
  logLoginStage('login:redirect', { path: destination, mode });

  if (!isNativeRuntime) {
    window.location.href = destination;
    return;
  }

  try {
    const targetUrl = new URL(destination, window.location.origin);
    const nextPath = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentPath !== nextPath) {
      window.history.replaceState(window.history.state, '', nextPath);
    }
  } catch {
    window.history.replaceState(window.history.state, '', destination);
  }

  window.dispatchEvent(new PopStateEvent('popstate'));
};

const getErrorCode = (err: unknown): string | undefined =>
  typeof (err as any)?.code === 'string' ? (err as any).code : undefined;

const isLoginTimeoutError = (err: unknown): err is LoginTimeoutError =>
  err instanceof LoginTimeoutError ||
  (typeof err === 'object' &&
    err !== null &&
    (err as { name?: string }).name === 'LoginTimeoutError');

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await new Promise<T>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new LoginTimeoutError(label));
      }, timeoutMs);

      promise.then(resolve).catch(reject);
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

const normalizeEmail = (value: string): string | null => {
  const normalized = value.trim().toLowerCase();
  return EMAIL_REGEX.test(normalized) ? normalized : null;
};

const normalizeUsername = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, '');

const normalizePhoneForLookup = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const startsWithPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return startsWithPlus ? `+${digits}` : digits;
};

async function resolveLoginEmail(loginId: string): Promise<string> {
  const input = loginId.trim();
  if (!input) {
    throw new Error(LOGIN_ID_NOT_FOUND_MESSAGE);
  }

  if (input.includes('@')) {
    return input.toLowerCase();
  }

  const email = normalizeEmail(input);
  if (email) return email;

  const normalizedPhone = normalizePhoneForLookup(input);
  const loginType = normalizedPhone ? 'phone' : 'username';
  const lookupValue = normalizedPhone || normalizeUsername(input);
  if (!lookupValue) {
    throw new Error(LOGIN_ID_NOT_FOUND_MESSAGE);
  }

  logLoginStage('login:resolver:start', { loginType });
  try {
    const result = await withTimeout(
      callFunction<
        { found?: boolean; email?: string },
        { loginId: string; loginType: 'phone' | 'username' }
      >('resolveLoginIdentifier', {
        loginId: lookupValue,
        loginType,
      }),
      RESOLVER_TIMEOUT_MS,
      'resolver',
    );

    const resolved = typeof result?.email === 'string' ? result.email.trim().toLowerCase() : '';
    if (result?.found && EMAIL_REGEX.test(resolved)) {
      logLoginStage('login:resolver:success', { loginType });
      return resolved;
    }

    logLoginStage('login:resolver:fail', { loginType, reason: 'not-found' });
  } catch (err) {
    if (isLoginTimeoutError(err)) {
      logLoginStage('login:resolver:timeout', { loginType });
      throw new Error(LOGIN_TIMEOUT_MESSAGE);
    }

    logLoginStage('login:resolver:fail', {
      loginType,
      code: getErrorCode(err),
    });
    // Fall through to user-friendly identifier error.
  }

  throw new Error(LOGIN_ID_NOT_FOUND_MESSAGE);
}

/**
 * STRICT admin login – used only for Surya (/surya/login).
 * Requires Firebase custom claims:
 *   - claims.admin === true  OR
 *   - claims.role === 'admin'
 */
async function handleAdminLogin(loginId: string, password: string) {
  const normalizedEmail = await resolveLoginEmail(loginId);

  logLoginStage('login:firebase:start', { mode: 'admin' });
  let credential;
  try {
    credential = await withTimeout(
      signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      ),
      SIGN_IN_TIMEOUT_MS,
      'firebase',
    );
    logLoginStage('login:firebase:success', { mode: 'admin' });
  } catch (err) {
    if (isLoginTimeoutError(err)) {
      logLoginStage('login:firebase:timeout', { mode: 'admin' });
      throw new Error(LOGIN_TIMEOUT_MESSAGE);
    }

    logLoginStage('login:firebase:fail', {
      mode: 'admin',
      code: getErrorCode(err),
    });
    throw err;
  }
  const firebaseUser = credential.user;

  // Force refresh token so we read latest custom claims
  logLoginStage('login:claims:start', { mode: 'admin' });
  let tokenResult;
  try {
    tokenResult = await withTimeout(
      firebaseUser.getIdTokenResult(true),
      CLAIMS_TIMEOUT_MS,
      'claims',
    );
    logLoginStage('login:claims:success', { mode: 'admin' });
  } catch (err) {
    if (isLoginTimeoutError(err)) {
      logLoginStage('login:claims:timeout', { mode: 'admin' });
      throw new Error(LOGIN_TIMEOUT_MESSAGE);
    }

    logLoginStage('login:claims:fail', {
      mode: 'admin',
      code: getErrorCode(err),
    });
    throw err;
  }
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

  redirectAfterLogin(roleRedirectMap.admin);
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
  loginId: string,
  password: string,
  expectedRole?: string,
) {
  const normalizedEmail = await resolveLoginEmail(loginId);

  logLoginStage('login:firebase:start', {
    mode: 'non-admin',
    expectedRole: expectedRole ?? null,
  });
  let credential;
  try {
    credential = await withTimeout(
      signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      ),
      SIGN_IN_TIMEOUT_MS,
      'firebase',
    );
    logLoginStage('login:firebase:success', { mode: 'non-admin' });
  } catch (err) {
    if (isLoginTimeoutError(err)) {
      logLoginStage('login:firebase:timeout', { mode: 'non-admin' });
      throw new Error(LOGIN_TIMEOUT_MESSAGE);
    }

    logLoginStage('login:firebase:fail', {
      mode: 'non-admin',
      code: getErrorCode(err),
    });
    throw err;
  }
  const firebaseUser = credential.user;

  logLoginStage('login:claims:start', { mode: 'non-admin' });
  let tokenResult;
  try {
    tokenResult = await withTimeout(
      firebaseUser.getIdTokenResult(),
      CLAIMS_TIMEOUT_MS,
      'claims',
    );
    logLoginStage('login:claims:success', { mode: 'non-admin' });
  } catch (err) {
    if (isLoginTimeoutError(err)) {
      logLoginStage('login:claims:timeout', { mode: 'non-admin' });
      throw new Error(LOGIN_TIMEOUT_MESSAGE);
    }

    logLoginStage('login:claims:fail', {
      mode: 'non-admin',
      code: getErrorCode(err),
    });
    throw err;
  }
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
  redirectAfterLogin(destination);
}

// ---------- PUBLIC API USED BY LoginPage & Surya Login ----------

export async function handleLogin(
  loginId: string,
  password: string,
  expectedRole?: string,
) {
  const input = loginId.trim();
  const loginType = input.includes('@')
    ? 'email'
    : normalizePhoneForLookup(input)
      ? 'phone'
      : 'username';

  logLoginStage('login:start', {
    expectedRole: expectedRole ?? null,
    loginType,
  });

  // Surya/admin path → STRICT admin check
  if (expectedRole === 'admin') {
    return handleAdminLogin(loginId, password);
  }

  // Everyone else → non-admin path
  return handleNonAdminLogin(loginId, password, expectedRole);
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
  redirectAfterLogin(destination);
}

export async function handleLogout() {
  await signOut(auth);
  useAuthStore.getState().clearUser();
}
