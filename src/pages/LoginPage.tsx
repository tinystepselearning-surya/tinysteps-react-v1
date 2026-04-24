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

const isNativeCapacitorRuntime = () => {
  if (typeof window === 'undefined') return false;

  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    try {
      return Boolean(cap.isNativePlatform());
    } catch {
      // Ignore runtime bridge errors and fall back to protocol checks.
    }
  }

  const protocol = window.location.protocol;
  return protocol === 'capacitor:' || protocol === 'ionic:';
};

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
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
  const isNativeRuntime = isNativeCapacitorRuntime();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const normalizedLoginId = loginId.trim();
      await handleLogin(normalizedLoginId, password, expectedRole || undefined);
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

  const loginPlaceholder = 'Email, username, or phone number';
  const passwordResetWhatsAppUrl = `https://wa.me/919618398383?text=${encodeURIComponent(
    'Hi Tiny Steps Admin, I need help with my login.'
  )}`;

  if (isNativeRuntime) {
    return (
      <div className="relative min-h-[100svh] w-full overflow-hidden bg-[linear-gradient(180deg,#f5faff_0%,#edf5ff_56%,#f8fbff_100%)]">
        <div className="pointer-events-none absolute left-1/2 top-[28%] h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.45)_0%,rgba(191,219,254,0)_72%)]" />
        <div className="mx-auto flex min-h-[100svh] w-full flex-col items-center justify-center px-0 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),1.1rem)]">
          <div className="-mt-5 mb-6 flex w-[calc(100%-40px)] max-w-[360px] flex-col items-center text-center">
            <img
              src="/logo-header-compact.png"
              alt="Tiny Steps logo"
              className="h-[76px] w-[76px] rounded-[20px] object-contain shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
            />
            <h1 className="mt-4 text-[23px] font-extrabold leading-tight tracking-[-0.015em] text-slate-900">
              Tiny Steps Online School Login
            </h1>
          </div>

          <div className="w-[calc(100%-40px)] max-w-[360px] rounded-[26px] border border-[rgba(15,23,42,0.06)] bg-white p-[22px] shadow-[0_16px_34px_rgba(15,23,42,0.10)]">
            {error ? (
              <div className="mb-4 rounded-2xl border border-red-200/80 bg-red-50/85 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form className="space-y-3.5 pb-[max(env(safe-area-inset-bottom),0px)]" onSubmit={onSubmit}>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                type="text"
                placeholder={loginPlaceholder}
                autoComplete="username"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-[52px] w-full rounded-2xl border border-slate-200 bg-[#fbfdff] px-4 text-[15px] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                required
                aria-label="Email, username, or phone number"
              />

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-[52px] w-full rounded-2xl border border-slate-200 bg-[#fbfdff] px-4 text-[15px] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                required
                aria-label="Password"
              />

              <button
                type="submit"
                className={`h-[52px] w-full rounded-2xl text-[15px] font-semibold text-white transition ${
                  isSubmitting
                    ? 'cursor-not-allowed bg-slate-400'
                    : 'bg-slate-900 shadow-[0_12px_26px_rgba(15,23,42,0.20)] hover:bg-slate-800'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-600">
              You’ll be taken to your workspace automatically.
            </p>

            <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-600">
              Need help?{' '}
              <a
                href={passwordResetWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-700 underline underline-offset-2"
              >
                Chat on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-b from-[#8ecfff] via-[#bde6ff] to-[#eaf7ff] ${
        isNativeRuntime ? 'min-h-[100svh]' : 'h-[100svh]'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_10%,rgba(255,255,255,0.55),rgba(255,255,255,0.16)_22%,rgba(255,255,255,0)_46%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.94),transparent_58%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[53%] h-[1180px] w-[1180px] -translate-x-1/2 rounded-full border border-white/95" />
      <div className="pointer-events-none absolute left-1/2 top-[57%] h-[940px] w-[940px] -translate-x-1/2 rounded-full border border-white/80" />
      <div className="pointer-events-none absolute left-1/2 top-[61%] h-[760px] w-[760px] -translate-x-1/2 rounded-full border border-white/66" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-[radial-gradient(ellipse_at_14%_102%,rgba(255,255,255,0.98),transparent_56%),radial-gradient(ellipse_at_50%_104%,rgba(255,255,255,0.98),transparent_60%),radial-gradient(ellipse_at_86%_102%,rgba(255,255,255,0.96),transparent_56%)]" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-120px] h-[320px] w-[520px] rounded-full bg-white/90 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-130px] left-[26%] h-[300px] w-[440px] rounded-full bg-white/85 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-120px] h-[320px] w-[520px] rounded-full bg-white/90 blur-2xl" />

      <div
        className={`relative mx-auto h-full w-full max-w-6xl px-4 sm:px-6 ${
          isNativeRuntime ? 'pb-[max(env(safe-area-inset-bottom),1rem)]' : ''
        }`}
      >
        <div className="absolute left-4 top-[max(env(safe-area-inset-top),1rem)] z-10 sm:left-6">
          <div className="relative inline-flex">
            <TinyStepsBrand
              className="relative z-10 hover:bg-transparent"
              subtitle="Online School"
              to="/"
              logoClassName="h-32 w-32 rounded-[2rem] object-cover object-center shadow-none ring-0 [clip-path:inset(7%_7%_7%_7%_round_2rem)]"
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
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  type="text"
                  placeholder={loginPlaceholder}
                  autoComplete="username"
                  inputMode="text"
                  className="h-full w-full bg-transparent text-white outline-none placeholder:text-white/95"
                  required
                  aria-label="Email, username, or phone number"
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
                  aria-label="Password"
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
              You will be taken to your workspace automatically.
            </p>

            <p className="mt-2 text-center text-xs text-slate-600">
              Need help?{' '}
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
