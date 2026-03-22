// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { applySeo } from '../lib/seo';
import { useSearchParams, useLocation } from 'react-router-dom';
import { handleLogin } from '../lib/auth';
import type { AuthRole } from '../store/useAuthStore';
import TinyStepsBrand from '../components/common/TinyStepsBrand';
import { Mail, Lock } from 'lucide-react';

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

  const emailPlaceholder =
    expectedRole === 'parent'
      ? 'parent@tinysteps.com'
      : expectedRole === 'teacher'
        ? 'teacher@tinysteps.com'
        : 'your@email.com';

  const supportRole = expectedRole && ROLE_LABELS[expectedRole] ? ROLE_LABELS[expectedRole] : 'account';
  const passwordResetWhatsAppUrl = `https://wa.me/919618398383?text=${encodeURIComponent(
    `Hi Tiny Steps Admin, I need support with password reset for my ${supportRole.toLowerCase()} login.`
  )}`;

  return (
    <div className="relative h-[100svh] overflow-hidden bg-gradient-to-b from-[#8ecfff] via-[#bde6ff] to-[#eaf7ff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_10%,rgba(255,255,255,0.55),rgba(255,255,255,0.16)_22%,rgba(255,255,255,0)_46%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.94),transparent_58%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[53%] h-[1180px] w-[1180px] -translate-x-1/2 rounded-full border border-white/95" />
      <div className="pointer-events-none absolute left-1/2 top-[57%] h-[940px] w-[940px] -translate-x-1/2 rounded-full border border-white/80" />
      <div className="pointer-events-none absolute left-1/2 top-[61%] h-[760px] w-[760px] -translate-x-1/2 rounded-full border border-white/66" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-[radial-gradient(ellipse_at_14%_102%,rgba(255,255,255,0.98),transparent_56%),radial-gradient(ellipse_at_50%_104%,rgba(255,255,255,0.98),transparent_60%),radial-gradient(ellipse_at_86%_102%,rgba(255,255,255,0.96),transparent_56%)]" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-120px] h-[320px] w-[520px] rounded-full bg-white/90 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-130px] left-[26%] h-[300px] w-[440px] rounded-full bg-white/85 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-120px] h-[320px] w-[520px] rounded-full bg-white/90 blur-2xl" />

      <div className="relative mx-auto h-full w-full max-w-6xl px-4 sm:px-6">
        <div className="absolute left-4 top-[max(env(safe-area-inset-top),1rem)] z-10 sm:left-6">
          <div className="relative inline-flex">
            <div className="pointer-events-none absolute left-[10px] top-[10px] h-[108px] w-[108px] rounded-full bg-white" />
            <TinyStepsBrand
              className="relative z-10 hover:bg-transparent"
              subtitle="Online School"
              to="/"
              logoClassName="h-32 w-32 ring-0"
              titleClassName="text-xl leading-none text-[#ff6a00]"
              subtitleClassName="text-[11px] font-semibold tracking-[0.28em] text-[#ff7d00]"
            />
          </div>
        </div>

        <div className="flex h-full items-center justify-center">
          <div className="w-full max-w-[400px] rounded-[28px] border border-white/85 bg-gradient-to-b from-white/78 to-white/68 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-7">
            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form className="space-y-3.5" onSubmit={onSubmit}>
              <div className="group flex h-12 items-center gap-2 rounded-xl border border-white/75 bg-[#6fa8cd]/45 px-3 shadow-inner transition focus-within:border-white/90 focus-within:ring-4 focus-within:ring-white/25">
                <Mail className="h-4 w-4 text-white/90" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder={emailPlaceholder}
                  autoComplete="username"
                  inputMode="email"
                  className="h-full w-full bg-transparent text-white outline-none placeholder:text-white/95"
                  required
                  aria-label="email"
                />
              </div>

              <div className="group flex h-12 items-center gap-2 rounded-xl border border-white/75 bg-[#6fa8cd]/45 px-3 shadow-inner transition focus-within:border-white/90 focus-within:ring-4 focus-within:ring-white/25">
                <Lock className="h-4 w-4 text-white/90" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  className="h-full w-full bg-transparent text-white outline-none placeholder:text-white/95"
                  required
                  aria-label="password"
                />
              </div>

              <button
                type="submit"
                className={`mt-1 h-12 w-full rounded-xl font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.25)] transition ${
                  isSubmitting
                    ? 'cursor-not-allowed bg-slate-400'
                    : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:brightness-110'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-600">
              Need support?{' '}
              <a
                href={passwordResetWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
              >
                Chat on WhatsApp
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
