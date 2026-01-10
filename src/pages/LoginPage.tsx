// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { applySeo } from '../lib/seo';
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
      await handleLogin(normalizedEmail, password, expectedRole || undefined);
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

  useEffect(() => {
    applySeo({
      title,
      canonicalPath: location.pathname || '/login',
      robots: 'noindex, nofollow',
    });
  }, [title, location.pathname]);

  const showGoogleButton = expectedRole === 'parent';
  const isParent = expectedRole === 'parent';
  const emailPlaceholder = isParent ? 'parent@tinysteps.com' : 'Email';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-orange-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/85 p-7 shadow-[0_18px_60px_rgba(2,6,23,0.12)] backdrop-blur sm:p-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Use the login details shared by Tiny Steps.
            </p>
          </div>

          {expectedRole && (
            <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              {getRoleMessage()}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder={emailPlaceholder}
                autoComplete="username"
                inputMode="email"
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                required
                aria-label="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                required
                aria-label="password"
              />
            </div>

            <button
              type="submit"
              className={`h-11 w-full rounded-xl font-semibold shadow-sm transition ${
                isSubmitting
                  ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                  : 'bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99]'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>

            {/* Google Sign-in for parent role only */}
            {showGoogleButton && (
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
                className={`h-11 w-full rounded-xl border font-semibold transition ${
                  isSubmitting
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                Sign in with Google
              </button>
            )}
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Trouble signing in? Message us on WhatsApp and we’ll help.
          </p>
        </div>
      </div>
    </div>
  );
}
