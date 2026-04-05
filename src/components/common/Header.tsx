// @ts-nocheck
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

type LinkItem = { label: string; href: string };

const dashboardPaths: Record<string, string> = {
  admin: '/surya',
  teacher: '/teacher',
  parent: '/parent',
  kid: '/kids/games/english-excellence',
  learningPartner: '/learning-partner/dashboard',
  learningpartner: '/learning-partner/dashboard',
};

const TICKER_VERSION = '2026-03-06';
const DISMISS_KEY = `ts_ticker_dismissed_${TICKER_VERSION}`;
const TICKER_ITEMS = [
  'Summer Camp 2026 • New batches starting weekly',
];
const TICKER_MARQUEE_ITEMS = [...TICKER_ITEMS, ...TICKER_ITEMS];

const PRIMARY_LINKS: LinkItem[] = [
  { label: 'Courses', href: '/courses' },
  { label: 'Curriculum', href: '/curriculum' },
  { label: 'Blog', href: '/blog' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Summer Camp', href: '/summer-camps' },
  { label: 'Contact', href: '/contact' },
];

const LOGIN_LINKS: LinkItem[] = [
  { label: 'Parent Login', href: '/parent/login' },
  { label: 'Teacher Login', href: '/teacher/login' },
  { label: 'Learning Partner Login', href: '/learning-partner/login' },
];

const PublicAnnouncementTicker = memo(function PublicAnnouncementTicker({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
  if (isLoggedIn || isDismissed || isMobileViewport) return null;

  return (
    <div className="hidden border-b border-slate-200/80 bg-white/65 text-slate-600 backdrop-blur sm:block">
      <style>{`
        @keyframes tsMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ts-marquee { animation: tsMarquee 52s linear infinite; will-change: transform; }
        .group:hover .ts-marquee { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .ts-marquee { animation: none; transform: none; } }
      `}</style>
      <div className="group relative overflow-hidden px-4 py-1">
        <div className="ts-marquee flex w-max items-center gap-12 whitespace-nowrap pr-12 text-[11px] font-medium">
          {TICKER_MARQUEE_ITEMS.map((item, index) => (
            <span key={`${item}-${index}`} className="inline-flex items-center gap-2.5">
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              {item}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-slate-600"
          aria-label="Dismiss announcement"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(DISMISS_KEY, '1');
            }
            setIsDismissed(true);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
});

export default function Header() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const loginMenuRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setShowLoginMenu(false);
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showLoginMenu) return;

    const onPointerDownCapture = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (loginMenuRef.current?.contains(target)) return;
      setShowLoginMenu(false);
    };

    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => document.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, [showLoginMenu]);

  useEffect(() => {
    let rafId = 0;
    const updateSticky = () => {
      const nextSticky = isHomePage ? window.scrollY > 50 : true;
      setIsSticky((prev) => (prev === nextSticky ? prev : nextSticky));
      rafId = 0;
    };
    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateSticky);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isHomePage]);

  const handleLogout = useCallback(async () => {
    try {
      const [{ signOut }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('../../lib/firebaseConfig'),
      ]);
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out of Firebase', error);
    }

    const currentRole = user?.role;
    clearUser();

    const loginMap: Record<string, string> = {
      admin: '/surya/login',
      teacher: '/teacher/login',
      parent: '/parent/login',
      learningPartner: '/learning-partner/login',
      kid: '/parent/login',
    };

    navigate(currentRole ? loginMap[currentRole] || '/login' : '/login');
  }, [clearUser, navigate, user?.role]);

  const handleBookAssessment = useCallback(() => {
    const params = new URLSearchParams(location.search);
    params.set('book', '1');
    navigate(
      {
        pathname: location.pathname,
        search: `?${params.toString()}`,
      },
      { replace: false }
    );
  }, [location.pathname, location.search, navigate]);

  const desktopHeaderContent = useMemo(
    () => (
      <>
        <div className="hidden items-center gap-6 text-sm font-semibold text-gray-700 lg:flex">
          {PRIMARY_LINKS.map((link) => (
            <Link key={link.href} to={link.href} className="transition-colors hover:text-tiny-blue-600">
              {link.label}
            </Link>
          ))}

          <div className="relative" ref={loginMenuRef}>
            <button
              type="button"
              className="flex items-center gap-1 transition-colors hover:text-tiny-blue-600"
              aria-haspopup="menu"
              aria-expanded={showLoginMenu}
              onClick={() => setShowLoginMenu((current) => !current)}
            >
              Login ▾
            </button>

            {showLoginMenu ? (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur" role="menu">
                <div className="flex flex-col gap-1 text-sm text-slate-700">
                  {LOGIN_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="rounded-xl px-3 py-2 transition hover:bg-slate-50 hover:text-slate-900"
                      role="menuitem"
                      onClick={() => setShowLoginMenu(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user ? (
                    <>
                      <Link
                        to={dashboardPaths[user.role] || `/${user.role}`}
                        className="rounded-xl px-3 py-2 transition hover:bg-slate-50 hover:text-slate-900"
                        role="menuitem"
                        onClick={() => setShowLoginMenu(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        className="rounded-xl px-3 py-2 text-left text-rose-600 transition hover:bg-rose-50"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <button
            type="button"
            onClick={handleBookAssessment}
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
          >
            Book Free Assessment
          </button>
        </div>
      </>
    ),
    [handleBookAssessment, handleLogout, showLoginMenu, user]
  );

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isSticky
          ? 'border-b border-slate-200/90 bg-white/95 shadow-[0_14px_34px_rgba(8,15,40,0.14)] backdrop-blur-xl'
          : 'border-b border-white/45 bg-white/72 shadow-[0_8px_22px_rgba(8,15,40,0.1)] backdrop-blur-lg'
      }`}
    >
      <PublicAnnouncementTicker isLoggedIn={!!user} />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3.5 sm:px-4 sm:py-4">
        <button
          type="button"
          className="flex items-center gap-2 text-left"
          onClick={() => navigate('/')}
          aria-label="Go to Tiny Steps home page"
        >
          <img
            src="/logo-header.webp"
            alt="Tiny Steps Logo"
            width={44}
            height={44}
            decoding="async"
            fetchPriority="high"
            className="h-11 w-11 object-contain"
          />
          <div>
            <div className="text-xl font-bold leading-none text-orange-500">Tiny Steps</div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-gray-500 max-[360px]:hidden">Foundations Forever</div>
          </div>
        </button>

        {desktopHeaderContent}

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={handleBookAssessment}
            className="rounded-full border border-slate-900 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white max-[380px]:px-3 max-[380px]:text-[11px]"
          >
            Book Free Assessment
          </button>
          <button
            type="button"
            className="flex flex-col gap-1"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setIsOpen((current) => !current)}
          >
            {[0, 1, 2].map((line) => (
              <div
                key={line}
                className={`h-0.5 w-6 bg-gray-900 transition-all duration-200 ${
                  isOpen
                    ? line === 0
                      ? "translate-y-[6px] rotate-45"
                      : line === 2
                      ? "-translate-y-[6px] -rotate-45"
                      : "opacity-0"
                    : ""
                }`}
              />
            ))}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav-menu"
        className={`overflow-hidden border-t border-slate-200/80 bg-white/96 transition-[max-height] duration-300 backdrop-blur lg:hidden ${
          isOpen ? "max-h-[520px]" : "max-h-0"
        }`}
      >
        <div className="space-y-5 px-5 py-6 text-sm font-semibold text-slate-700">
          <div className="space-y-3">
            {PRIMARY_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)} className="block">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Login</p>
            <div className="mt-3 space-y-3">
              {LOGIN_LINKS.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)} className="block">
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to={dashboardPaths[user.role] || `/${user.role}`}
                    onClick={() => setIsOpen(false)}
                    className="block"
                  >
                    Dashboard
                  </Link>
                  <button type="button" className="block text-left text-rose-600" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
