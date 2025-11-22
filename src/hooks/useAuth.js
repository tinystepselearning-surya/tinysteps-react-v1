var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import useAuthStore from '../store/useAuthStore';
export function useAuth() {
    const { user, isLoading, setUser, clearUser, setLoading } = useAuthStore();
    useEffect(() => {
        setLoading(true);
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => __awaiter(this, void 0, void 0, function* () {
            if (firebaseUser) {
                try {
                    // Force token refresh to ensure updated claims
                    const idTokenResult = yield firebaseUser.getIdTokenResult(true);
                    const role = idTokenResult.claims.role || 'kid';
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        displayName: firebaseUser.displayName || 'User',
                        role,
                    });
                }
                catch (err) {
                    // fallback
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        displayName: firebaseUser.displayName || 'User',
                        role: 'kid',
                    });
                }
            }
            else {
                clearUser();
            }
            setLoading(false);
        }));
        return () => unsubscribe();
    }, [setUser, clearUser, setLoading]);
    return { user, isLoading };
}
export default useAuth;
