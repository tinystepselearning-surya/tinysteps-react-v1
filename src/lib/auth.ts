import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useAuthStore, AuthUser } from '../store/useAuthStore';

export async function handleLogin(email: string, password: string, expectedRole?: string) {
  try {
    const normalizedEmail = email.trim();
    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const firebaseUser = credential.user;
    const idTokenResult = await firebaseUser.getIdTokenResult();

    // Extract role from custom claims; default to 'kid' if missing
    const roleClaim = (idTokenResult.claims as any).role as string | undefined;
    const role = (roleClaim as any) || 'kid';

    // If expectedRole is specified and doesn't match the user's actual role, throw error
    if (expectedRole && role !== expectedRole) {
      throw new Error(`Invalid credentials for ${expectedRole} role. Please use the correct login button.`);
    }

    useAuthStore.setState({
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        role: role as AuthUser['role'],
      },
    });

    const roleRedirectMap: Record<AuthUser['role'], string> = {
      admin: '/surya',
      teacher: '/teacher',
      parent: '/parent',
      kid: '/parent/kids',
      learningPartner: '/learning-partner',
    };

    const destination = roleRedirectMap[role as AuthUser['role']] || `/${role}`;
    window.location.href = destination;
  } catch (err) {
    // Re-throw so callers can show UI errors
    throw err;
  }
}

export async function handleLoginWithGoogle(expectedRole?: string) {
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const firebaseUser = credential.user;
    const idTokenResult = await firebaseUser.getIdTokenResult();
    const roleClaim = (idTokenResult.claims as any).role as string | undefined;
    const role = (roleClaim as any) || 'parent';

    if (expectedRole && role !== expectedRole) {
      throw new Error(`Invalid Google account for ${expectedRole} role`);
    }

    useAuthStore.setState({
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        role: role as AuthUser['role'],
      }
    });

    const roleRedirectMap: Record<AuthUser['role'], string> = {
      admin: '/surya',
      teacher: '/teacher',
      parent: '/parent',
      kid: '/parent/kids',
      learningPartner: '/learning-partner',
    };
    const destination = roleRedirectMap[role as AuthUser['role']] || `/${role}`;
    window.location.href = destination;
  } catch (err) {
    throw err;
  }
}

export async function handleLogout() {
  // Clear local auth store only; callers should also sign out from Firebase if desired
  useAuthStore.setState({ user: null });
}
