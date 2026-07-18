// src/pages/Login.tsx
import { useState } from 'react';
import type { FormEvent, FC } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import AuthPageBrandHeader from '../components/common/AuthPageBrandHeader';
import { performAppLogout } from '../lib/auth';
import { schedulePostLoginAuthDiagnostics } from '../lib/nativeAuthDiagnostics';

interface LoginProps {
  // Optional override (e.g. for tests or future refactor).
  // Can be sync or async.
  onLogin?: (email: string, password: string) => Promise<void> | void;
}

const Login: FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get setter from Zustand store so RoleGate / dashboards can see admin
  const { setUser } = useAuthStore();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInfoMessage('');
    setError('');

    try {
      const normalizedEmail = email.trim();

      // Allow optional custom handler (tests / future)
      if (onLogin) {
        await Promise.resolve(onLogin(normalizedEmail, password));
        return;
      }

      // Default strict admin login flow
      const cred = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );
      schedulePostLoginAuthDiagnostics();

      const result = await cred.user.getIdTokenResult(true);
      const claims = result.claims as any;
      const isAdmin = claims.admin === true || claims.role === 'admin';

      if (!isAdmin) {
        setError(
          'Access denied: this account does not have admin privileges.',
        );
        await performAppLogout('admin-security-rejection');
        return;
      }

      // ✅ Store admin in Zustand so RoleGate sees it
      setUser({
        uid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || 'Admin',
        role: 'admin',
      });

      // Success → go to /surya (AdminDashboard behind RoleGate)
      navigate('/surya', { replace: true });
    } catch (err: any) {
      switch (err?.code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError(
            'Incorrect email or password. You can reset the admin password using the link below.',
          );
          break;
        case 'auth/user-not-found':
          setError(
            'No admin account found for this email. Double-check the address or create an admin user via Firebase.',
          );
          break;
        default:
          setError(err?.message || 'Unable to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setInfoMessage('');
    setError('');
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Enter the admin email first to receive a reset link.');
      return;
    }
    try {
      setIsResetting(true);
      await sendPasswordResetEmail(auth, normalizedEmail);
      setInfoMessage(
        'Password reset email sent. Check your inbox (and spam folder) for instructions.',
      );
    } catch (err: any) {
      switch (err?.code) {
        case 'auth/user-not-found':
          setError('No user exists with that email. Verify the address.');
          break;
        default:
          setError(err?.message || 'Could not send reset email.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-orange-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:py-10">
        <AuthPageBrandHeader label="Admin Login" />

        <div className="flex flex-1 items-center justify-center py-6">
          <div className="max-w-md w-full space-y-8 rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-[0_18px_60px_rgba(2,6,23,0.12)]">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                Admin Login
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sign in to access the admin panel
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              {(error || infoMessage) && (
                <div
                  className={`text-sm text-center ${
                    error ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {error || infoMessage}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="mt-3 w-full text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  {isResetting
                    ? 'Sending reset link…'
                    : 'Forgot password? Send reset email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
