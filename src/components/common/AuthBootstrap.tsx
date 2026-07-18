import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
import useAuthStore, {
  type AuthRole,
  type AuthUser,
} from '../../store/useAuthStore';
import { logFirebaseAuthKeyPresence } from '../../lib/nativeAuthDiagnostics';

const validRoles = new Set<AuthRole>([
  'admin',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
]);

const logBootstrap = (event: string) => {
  console.info(`[auth-bootstrap] ${event}`);
};

const sameResolvedState = (
  status: 'authenticated' | 'unauthenticated',
  user: AuthUser | null,
): boolean => {
  const current = useAuthStore.getState();
  return current.authStatus === status &&
    current.user?.uid === user?.uid &&
    current.user?.email === user?.email &&
    current.user?.role === user?.role;
};

export default function AuthBootstrap() {
  useEffect(() => {
    let active = true;
    let callbackVersion = 0;
    let unsubscribe: (() => void) | null = null;

    const resolveUnauthenticated = () => {
      if (!active) return;
      if (sameResolvedState('unauthenticated', null)) {
        logBootstrap('unchanged');
        return;
      }
      useAuthStore.getState().resolveAuth(
        'unauthenticated',
        null,
        'firebase-auth-state-null',
      );
      logBootstrap('unauthenticated');
    };

    const attachListenerAfterStateReady = async () => {
      logFirebaseAuthKeyPresence('before-auth-state-ready');
      try {
        await auth.authStateReady();
      } catch (error) {
        const code =
          error && typeof error === 'object' && 'code' in error &&
          typeof (error as { code?: unknown }).code === 'string'
            ? (error as { code: string }).code
            : undefined;
        console.warn('[auth-bootstrap] state-ready:error', { code });
      }
      if (!active) return;
      logBootstrap('state-ready');
      logFirebaseAuthKeyPresence('after-auth-state-ready');
      logBootstrap('listener:attach');

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!active) return;
        const currentVersion = ++callbackVersion;
        logBootstrap('callback');

        if (!firebaseUser) {
          resolveUnauthenticated();
          return;
        }

        let role: AuthRole = 'kid';
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const claimedRole = tokenResult.claims.role;
          if (typeof claimedRole === 'string' && validRoles.has(claimedRole as AuthRole)) {
            role = claimedRole as AuthRole;
          }
        } catch (error) {
          const code =
            error && typeof error === 'object' && 'code' in error &&
            typeof (error as { code?: unknown }).code === 'string'
              ? (error as { code: string }).code
              : undefined;
          console.warn('[auth-bootstrap] claims:error', { code });
        }

        if (!active || currentVersion !== callbackVersion) return;
        const user: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          role,
        };
        if (sameResolvedState('authenticated', user)) {
          logBootstrap('unchanged');
          return;
        }
        useAuthStore.getState().resolveAuth(
          'authenticated',
          user,
          'firebase-auth-state-user',
        );
        logBootstrap('authenticated');
      }, () => {
        ++callbackVersion;
        logBootstrap('callback');
        resolveUnauthenticated();
      });
    };

    void attachListenerAfterStateReady();

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
        logBootstrap('listener:detach');
      }
    };
  }, []);

  return null;
}
