var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';
export function handleLogin(email, password, expectedRole) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const normalizedEmail = email.trim();
            const credential = yield signInWithEmailAndPassword(auth, normalizedEmail, password);
            const firebaseUser = credential.user;
            const idTokenResult = yield firebaseUser.getIdTokenResult();
            // Extract role from custom claims; default to 'kid' if missing
            const roleClaim = idTokenResult.claims.role;
            const role = roleClaim || 'kid';
            // If expectedRole is specified and doesn't match the user's actual role, throw error
            if (expectedRole && role !== expectedRole) {
                throw new Error(`Invalid credentials for ${expectedRole} role. Please use the correct login button.`);
            }
            useAuthStore.setState({
                user: {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || 'User',
                    role: role,
                },
            });
            const roleRedirectMap = {
                admin: '/surya',
                teacher: '/teacher',
                parent: '/parent',
                kid: '/parent/kids',
                learningPartner: '/learning-partner',
            };
            const destination = roleRedirectMap[role] || `/${role}`;
            window.location.href = destination;
        }
        catch (err) {
            // Re-throw so callers can show UI errors
            throw err;
        }
    });
}
export function handleLoginWithGoogle(expectedRole) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const provider = new GoogleAuthProvider();
            const credential = yield signInWithPopup(auth, provider);
            const firebaseUser = credential.user;
            const idTokenResult = yield firebaseUser.getIdTokenResult();
            const roleClaim = idTokenResult.claims.role;
            const role = roleClaim || 'parent';
            if (expectedRole && role !== expectedRole) {
                throw new Error(`Invalid Google account for ${expectedRole} role`);
            }
            useAuthStore.setState({
                user: {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || 'User',
                    role: role,
                }
            });
            const roleRedirectMap = {
                admin: '/surya',
                teacher: '/teacher',
                parent: '/parent',
                kid: '/parent/kids',
                learningPartner: '/learning-partner',
            };
            const destination = roleRedirectMap[role] || `/${role}`;
            window.location.href = destination;
        }
        catch (err) {
            throw err;
        }
    });
}
export function handleLogout() {
    return __awaiter(this, void 0, void 0, function* () {
        // Clear local auth store only; callers should also sign out from Firebase if desired
        useAuthStore.setState({ user: null });
    });
}
