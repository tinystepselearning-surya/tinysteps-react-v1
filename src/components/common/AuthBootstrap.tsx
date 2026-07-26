import { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, ensureNativeAuthPersistence } from '../../lib/firebaseConfig';
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
  const [attempt, setAttempt] = useState(0);
  const authRecoveryError = useAuthStore((state) => state.authRecoveryError);

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
        await ensureNativeAuthPersistence();
        await auth.authStateReady();
      } catch (error) {
        const code =
          error && typeof error === 'object' && 'code' in error &&
          typeof (error as { code?: unknown }).code === 'string'
            ? (error as { code: string }).code
            : undefined;
        console.warn('[auth-bootstrap] state-ready:error', { code });
        if (active) {
          useAuthStore.getState().setAuthRecoveryError(
            'We could not restore your secure session. Check your connection and try again.',
          );
        }
        return;
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
      }, (error) => {
        if (!active) return;
        ++callbackVersion;
        const code =
          typeof (error as unknown as { code?: unknown })?.code === 'string'
            ? (error as unknown as { code: string }).code
            : undefined;
        console.warn('[auth-bootstrap] listener:error', { code });
        useAuthStore.getState().setAuthRecoveryError(
          'Your session could not be refreshed. Try again without signing in again.',
        );
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
  }, [attempt]);

  useEffect(() => {
    let active = true;
    let removeListener: (() => Promise<void>) | null = null;

    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      console.info('[app-lifecycle] state', {
        isActive,
        authenticated: Boolean(auth.currentUser),
      });
    }).then((handle) => {
      if (!active) {
        void handle.remove();
        return;
      }
      removeListener = () => handle.remove();
    }).catch(() => {
      // The web runtime may not expose the native app-state bridge.
    });

    return () => {
      active = false;
      if (removeListener) void removeListener();
    };
  }, []);

  if (!authRecoveryError) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-[120] rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-700 shadow-lg"
    >
      <p>{authRecoveryError}</p>
      <button
        type="button"
        className="mt-2 rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white"
        onClick={() => {
          useAuthStore.getState().setAuthRecoveryError(null);
          setAttempt((value) => value + 1);
        }}
      >
        Retry session restore
      </button>
    </div>
  );
}
