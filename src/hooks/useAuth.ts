import { useEffect } from 'react';
import useAuthStore, { AuthUser } from '../store/useAuthStore';

export function useAuth() {
  const { user, isLoading, setUser, clearUser, setLoading } = useAuthStore();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mounted = true;

    // Dynamically import firebase modules only when auth is needed.
    (async () => {
      setLoading(true);
      try {
        const [{ onAuthStateChanged }, { auth }] = await Promise.all([
          import('firebase/auth'),
          import('../lib/firebaseConfig'),
        ] as any);

        if (!mounted) return;

        unsub = onAuthStateChanged(auth, async (firebaseUser: any) => {
          if (firebaseUser) {
            try {
              const idTokenResult = await firebaseUser.getIdTokenResult(true);
              const role = (idTokenResult.claims.role as AuthUser['role']) || 'kid';
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'User',
                role,
              });
            } catch (err) {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'User',
                role: 'kid',
              });
            }
          } else {
            clearUser();
          }
          setLoading(false);
        });
      } catch (err) {
        // If dynamic import or auth setup fails, clear loading so UI continues.
        console.warn('Auth initialization failed', err);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser, clearUser, setLoading]);

  return { user, isLoading };
}

export default useAuth;
