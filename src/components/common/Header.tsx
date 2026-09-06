// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

type LinkItem = {
  label: string;
  href: string;
  desktop?: boolean;
  mobile?: boolean;
};

const dashboardPaths: Record<string, string> = {
  admin: '/surya',
  teacher: '/teacher',
  parent: '/parent',
  kid: '/kids/games/english-excellence',
  learningPartner: '/learning-partner/dashboard',
  learningpartner: '/learning-partner/dashboard',
  'learning-partner': '/learning-partner/dashboard',
  schoolAdmin: '/school',
  schooladmin: '/school',
  'school-admin': '/school',
};

const PRIMARY_LINKS: LinkItem[] = [
  { label: 'Courses', href: '/courses', desktop: false },
  { label: 'Curriculum', href: '/curriculum' },
  { label: 'Blog', href: '/blog' },
  { label: 'Pricing', href: '/pricing', desktop: false },
  { label: 'For Schools', href: '/for-schools' },
  { label: 'Class Samples', href: '/class-samples' },
  { label: 'Contact', href: '/contact' },
];

const LOGIN_LINK: LinkItem = { label: 'Login', href: '/login' };

export default function Header() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  const isHomePage = location.pathname === '/';
  const isSchoolsPage = location.pathname === '/for-schools';
  const isCareersPage = location.pathname === '/careers';

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

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
      const { performAppLogout } = await import('../../lib/auth');
      await performAppLogout('user-clicked-logout');
    } catch (error) {
      console.error('Error signing out of Firebase', error);
    }
    navigate('/login');
  }, [navigate]);

  const handleBookAssessment = useCallback(() => {
    if (location.pathname === '/book-demo') {
      const assessmentForm = document.getElementById('assessment-form');
      if (assessmentForm) {
        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const top = assessmentForm.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
        return;
      }
      navigate('/book-demo#assessment-form');
      return;
    }

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

  const handlePrimaryAction = useCallback(() => {
    if (isCareersPage) {
      const applicationSection = document.getElementById('apply');
      if (applicationSection) {
        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        applicationSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      navigate('/careers#apply');
      return;
    }

    if (isSchoolsPage) {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        pricingSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      navigate('/for-schools#pricing');
      return;
    }
    handleBookAssessment();
  }, [handleBookAssessment, isCareersPage, isSchoolsPage, navigate]);

  const desktopHeaderContent = useMemo(
    () => (
      <>
        <div data-testid="desktop-primary-navigation" className="hidden items-center gap-6 text-sm font-semibold text-gray-700 lg:flex">
          {PRIMARY_LINKS.filter((link) => link.desktop !== false).map((link) => (
            <Link
              key={link.href}
              to={link.href}
              aria-current={location.pathname === link.href ? 'page' : undefined}
              className={`rounded-sm transition-colors hover:text-tiny-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 ${
                location.pathname === link.href ? 'text-orange-700 underline decoration-orange-400 decoration-2 underline-offset-8' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to={dashboardPaths[user.role] || `/${user.role}`}
                className="transition-colors hover:text-tiny-blue-600"
              >
                Dashboard
              </Link>
              <button
                type="button"
                className="transition-colors text-rose-600 hover:text-rose-700"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to={LOGIN_LINK.href} className="transition-colors hover:text-tiny-blue-600">
              {LOGIN_LINK.label}
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition ${
              isCareersPage
                ? 'border-blue-700 bg-gradient-to-r from-blue-700 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-500'
                : isSchoolsPage
                ? 'border-orange-400 bg-gradient-to-r from-orange-400 to-amber-300 text-slate-950 hover:from-orange-300 hover:to-amber-200'
                : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isCareersPage ? 'Apply to Teach' : isSchoolsPage ? 'School Partnership Options' : 'Book Free 35-Minute Demo'}
          </button>
        </div>
      </>
    ),
    [handleLogout, handlePrimaryAction, isCareersPage, isSchoolsPage, location.pathname, user]
  );

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isSticky
          ? 'border-b border-slate-200/90 bg-white/95 shadow-[0_14px_34px_rgba(8,15,40,0.14)] backdrop-blur-xl'
          : 'border-b border-white/45 bg-white/72 shadow-[0_8px_22px_rgba(8,15,40,0.1)] backdrop-blur-lg'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3.5 sm:px-4 sm:py-4">
        <button
          type="button"
          className="flex items-center gap-2 text-left"
          onClick={() => navigate('/')}
          aria-label="Go to Tiny Steps home page"
        >
          <img
            src="/logo-header-compact.webp"
            alt="Tiny Steps Logo"
            width={44}
            height={44}
            decoding="async"
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
            onClick={handlePrimaryAction}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold max-[380px]:px-3 max-[380px]:text-[11px] ${
              isCareersPage
                ? 'border-blue-700 bg-gradient-to-r from-blue-700 to-cyan-600 text-white'
                : isSchoolsPage
                ? 'border-orange-400 bg-orange-400 text-slate-950'
                : 'border-slate-900 bg-slate-900 text-white'
            }`}
          >
            {isCareersPage ? 'Apply to Teach' : isSchoolsPage ? 'School Options' : 'Book Free 35-Minute Demo'}
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
            {PRIMARY_LINKS.filter((link) => link.mobile !== false).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                aria-current={location.pathname === link.href ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
                className={`block rounded-sm py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 ${
                  location.pathname === link.href ? 'text-orange-700' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Login</p>
            <div className="mt-3 space-y-3">
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
              ) : (
                <Link to={LOGIN_LINK.href} onClick={() => setIsOpen(false)} className="block">
                  {LOGIN_LINK.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
