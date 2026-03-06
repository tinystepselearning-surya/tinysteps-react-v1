// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

type LinkItem = { label: string; href: string };

const dashboardPaths: Record<string, string> = {
  admin: '/surya',
  teacher: '/teacher',
  parent: '/parent',
  kid: '/kids',
  learningPartner: '/learning-partner/dashboard',
  learningpartner: '/learning-partner/dashboard',
};

const TICKER_VERSION = '2026-03-06';
const DISMISS_KEY = `ts_ticker_dismissed_${TICKER_VERSION}`;
const TICKER_ITEMS = [
  'Summer Camp 2026 • New batches starting weekly',
  'Ages 4–10 • 35–40 min live classes',
  'Phonics + Reading + Speaking • Daily practice',
  'Parents get weekly progress updates',
];

function PublicAnnouncementTicker({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (isLoggedIn || isDismissed) return null;

  const doubledItems = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="border-b border-slate-200 bg-white/80 text-slate-700 backdrop-blur">
      <style>{`
        @keyframes tsMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ts-marquee { animation: tsMarquee 34s linear infinite; will-change: transform; }
        .group:hover .ts-marquee { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .ts-marquee { animation: none; transform: none; } }
      `}</style>
      <div className="group relative overflow-hidden px-4 py-1.5">
        <div className="ts-marquee flex w-max items-center gap-8 whitespace-nowrap pr-10 text-xs font-medium">
          {doubledItems.map((item, index) => (
            <span key={`${item}-${index}`} className="inline-flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              {item}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition hover:text-slate-800"
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
}

export default function Header() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const loginMenuRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  const primaryLinks: LinkItem[] = [
    { label: 'Courses', href: '/courses' },
    { label: 'Curriculum', href: '/curriculum' },
    { label: 'Blog', href: '/blog' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Summer Camp', href: '/summer-camps' },
    { label: 'Contact', href: '/contact' },
  ];

  const loginLinks: LinkItem[] = [
    { label: 'Parent Login', href: '/parent/login' },
    { label: 'Teacher Login', href: '/teacher/login' },
    { label: 'Kids Login', href: '/kid/login' },
    { label: 'Learning Partner Login', href: '/learning-partner/login' },
  ];

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
    const handleScroll = () => {
      const current = window.scrollY;
      if (isHomePage) setIsSticky(current > 50);
      else setIsSticky(true);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const handleLogout = async () => {
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
  };

  const handleBookAssessment = () => {
    if (location.pathname === '/') {
      document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate('/?book=1');
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isSticky ? 'bg-white/88 shadow-[0_15px_35px_rgba(8,15,40,0.12)] backdrop-blur-lg' : 'bg-transparent'
      }`}
    >
      <PublicAnnouncementTicker isLoggedIn={!!user} />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <button
          type="button"
          className="flex items-center gap-2 text-left"
          onClick={() => navigate('/')}
          aria-label="Go to Tiny Steps home page"
        >
          <img src="/logo.png" alt="Tiny Steps Logo" className="h-11 w-11 object-contain" />
          <div>
            <div className="font-bold text-gray-900">Tiny Steps</div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Foundations Forever</div>
          </div>
        </button>

        <div className="hidden items-center gap-6 text-sm font-semibold text-gray-700 lg:flex">
          {primaryLinks.map((link) => (
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
                  {loginLinks.map((link) => (
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

        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={handleBookAssessment}
            className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
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
              <motion.div
                key={line}
                className="h-0.5 w-6 bg-gray-900"
                animate={{
                  rotate: isOpen ? (line === 0 ? 45 : line === 2 ? -45 : 0) : 0,
                  y: isOpen ? (line === 0 ? 6 : line === 2 ? -6 : 0) : 0,
                  opacity: isOpen && line === 1 ? 0 : 1,
                }}
                transition={{ duration: 0.25 }}
              />
            ))}
          </button>
        </div>
      </div>

      <motion.div
        id="mobile-nav-menu"
        initial={{ height: 0 }}
        animate={{ height: isOpen ? 'auto' : 0 }}
        className="overflow-hidden bg-white/96 backdrop-blur lg:hidden"
      >
        <div className="space-y-5 px-5 py-6 text-sm font-semibold text-slate-700">
          <div className="space-y-3">
            {primaryLinks.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)} className="block">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Login</p>
            <div className="mt-3 space-y-3">
              {loginLinks.map((link) => (
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
      </motion.div>
    </motion.nav>
  );
}
