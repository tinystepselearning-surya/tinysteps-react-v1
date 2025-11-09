import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';

export async function handleLogin(email: string, password: string) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;
    const idTokenResult = await firebaseUser.getIdTokenResult();

    // Extract role from custom claims; default to 'kid' if missing
    const roleClaim = (idTokenResult.claims as any).role as string | undefined;
    const role = (roleClaim as any) || 'kid';

    useAuthStore.setState({
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        // cast to union defined in store
        role: role as any,
      },
    });

    // Navigate to role home
    window.location.href = `/${role}`;
  } catch (err) {
    // Re-throw so callers can show UI errors
    throw err;
  }
}

export async function handleLogout() {
  // Clear local auth store only; callers should also sign out from Firebase if desired
  useAuthStore.setState({ user: null });
}
