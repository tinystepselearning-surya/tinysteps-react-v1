// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { handleLogin, handleLoginWithGoogle } from '../lib/auth';
import type { AuthRole } from '../store/useAuthStore';

const VALID_ROLES: AuthRole[] = [
  'admin',
  'teacher',
  'parent',
  'kid',
  'learningPartner',
];

const ROLE_LABELS: Record<AuthRole, string> = {
  admin: 'Administrator',
  teacher: 'Teacher',
  parent: 'Parent',
  kid: 'Kid',
  learningPartner: 'Learning Partner',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Map URL segment → AuthRole
  const pathToRoleMap: Record<string, AuthRole> = {
    admin: 'admin',
    surya: 'admin', // not actually used here (Surya has its own Login.tsx), but safe
    teacher: 'teacher',
    parent: 'parent',
    'learning-partner': 'learningPartner',
    learningpartner: 'learningPartner',
    kid: 'kid',
  };

  const getExpectedRole = (): AuthRole | null => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const roleFromPath = (pathSegments[0] || '').toLowerCase(); // e.g. 'parent' from '/parent/login'

    // 1) Prefer role inferred from the path
    if (pathToRoleMap[roleFromPath]) {
      return pathToRoleMap[roleFromPath];
    }

    // 2) Fallback to ?role= query param if valid
    const qpRole = searchParams.get('role') as AuthRole | null;
    if (qpRole && VALID_ROLES.includes(qpRole)) {
      return qpRole;
    }

    // 3) Otherwise, generic login (no role banner)
    return null;
  };

  const expectedRole = getExpectedRole();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const normalizedEmail = email.trim();
      await handleLogin(
        normalizedEmail,
        password,
        expectedRole || undefined,
      );
      // handleLogin will redirect based on role
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleMessage = () => {
    if (!expectedRole) return null;
    const label = ROLE_LABELS[expectedRole] || expectedRole;
    return `Please log in with your ${label} credentials.`;
  };

  const title =
    expectedRole && ROLE_LABELS[expectedRole]
      ? `${ROLE_LABELS[expectedRole]} Login`
      : 'Login';

  const showGoogleButton = expectedRole === 'parent';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>

        {expectedRole && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
            {getRoleMessage()}
          </div>
        )}

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 border rounded"
            required
            aria-label="email"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
            required
            aria-label="password"
          />

          <button
            type="submit"
            className={`w-full px-4 py-2 rounded ${
              isSubmitting ? 'bg-gray-400' : 'bg-blue-600 text-white'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>

          {/* Google Sign-in for parent role only */}
          {showGoogleButton && (
            <div>
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  setIsSubmitting(true);
                  try {
                    await handleLoginWithGoogle('parent');
                  } catch (err: any) {
                    setError(err?.message || 'Google sign-in failed');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className={`w-full mt-2 px-4 py-2 rounded border ${
                  isSubmitting ? 'opacity-60' : 'bg-white'
                }`}
              >
                Sign in with Google
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
