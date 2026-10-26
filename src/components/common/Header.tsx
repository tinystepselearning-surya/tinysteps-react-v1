// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

type LinkItem = {
  label: string;
  href: string;
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
  { label: 'Courses', href: '/courses' },
  { label: 'Curriculum', href: '/curriculum' },
  { label: 'Resources', href: '/resources' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

const LOGIN_LINK: LinkItem = { label: 'Login', href: '/login' };

const matchesPrimaryLink = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export default function Header() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const progressRef = useRef<HTMLSpanElement | null>(null);

  const isHomePage = location.pathname === '/';
  const isSchoolsPage = location.pathname === '/for-schools';
  const isCareersPage = location.pathname === '/careers';

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let rafId = 0;
    const updateScrollUI = () => {
      const nextSticky = isHomePage ? window.scrollY > 50 : true;
      setIsSticky((prev) => (prev === nextSticky ? prev : nextSticky));
      // Compositor-only progress update in the header's existing animation frame.
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      rafId = 0;
    };
    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateScrollUI);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isHomePage, location.pathname]);

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
    if (location.pathname === '/contact') {
      navigate('/book-demo');
      return;
    }

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
        <div data-testid="desktop-primary-navigation" className="hidden items-center gap-1 text-[13px] font-semibold text-slate-700 xl:flex">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              aria-current={matchesPrimaryLink(location.pathname, link.href) ? 'page' : undefined}
              className={`rounded-full px-3 py-2 transition-[background-color,color,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:bg-[#EDF5FE] hover:text-[#453A78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#755E96] ${
                matchesPrimaryLink(location.pathname, link.href) ? 'bg-[#F1EDFC] text-[#604577] shadow-[inset_0_0_0_1px_#E1D5F0]' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-[#D7E5F4]" />
          {user ? (
            <>
              <Link
                to={dashboardPaths[user.role] || `/${user.role}`}
                className="rounded-full px-2.5 py-2 transition-colors hover:bg-[#EDF5FE] hover:text-[#453A78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#755E96]"
              >
                Dashboard
              </Link>
              <button
                type="button"
                className="rounded-full px-2.5 py-2 text-rose-700 transition-colors hover:bg-rose-50 hover:text-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to={LOGIN_LINK.href} className="rounded-full px-2.5 py-2 transition-colors hover:bg-[#EDF5FE] hover:text-[#453A78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#755E96]">
              {LOGIN_LINK.label}
            </Link>
          )}
        </div>

        <div className="hidden items-center md:flex">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isCareersPage}
            aria-label={isCareersPage ? 'Teacher recruitment closed on 11 October 2026' : undefined}
            data-no-booking-intercept={location.pathname === '/contact' ? '1' : undefined}
            className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition ${
              isCareersPage
                ? 'cursor-default border-slate-300 bg-slate-100 text-slate-600 shadow-none'
                : isSchoolsPage
                ? 'border-[#CBB7E0] bg-gradient-to-r from-[#F1EDFC] to-[#F6CF7E] text-[#17284C] hover:from-[#E5DDF8] hover:to-[#FFE5B4]'
                : 'border-slate-900 bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800 motion-reduce:transform-none'
            }`}
          >
            {isCareersPage ? 'Recruitment Closed' : isSchoolsPage ? 'School Partnership Options' : 'Book Free 35-Minute Demo'}
          </button>
        </div>
      </>
    ),
    [handleLogout, handlePrimaryAction, isCareersPage, isSchoolsPage, location.pathname, user]
  );

  return (
    <nav
      aria-label="Tiny Steps main navigation"
      className={`fixed left-0 right-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ${
        isSticky
          ? 'border-b border-[#D7E5F4] bg-white/95 shadow-[0_14px_34px_rgba(8,15,40,0.14)] backdrop-blur-xl'
          : 'border-b border-[#D7E5F4]/65 bg-white/82 shadow-[0_8px_22px_rgba(8,15,40,0.1)] backdrop-blur-lg'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
        <button
          type="button"
          className="flex min-w-0 shrink items-center gap-1.5 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#755E96] sm:gap-2"
          onClick={() => navigate('/')}
          aria-label="Go to Tiny Steps home page"
        >
          <img
            src="/logo-header-compact.webp"
            alt="Tiny Steps Logo"
            width={44}
            height={44}
            decoding="async"
            className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
          />
          <div className="min-w-0">
            <div className="whitespace-nowrap text-base font-bold leading-none text-orange-500 sm:text-xl">Tiny Steps</div>
            <div className="hidden text-[11px] uppercase tracking-[0.24em] text-gray-500 sm:block">Foundations Forever</div>
          </div>
        </button>

        {desktopHeaderContent}

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 xl:hidden">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isCareersPage}
            aria-label={isCareersPage ? 'Teacher recruitment closed on 11 October 2026' : isSchoolsPage ? 'School partnership options' : 'Book Free 35-Minute Demo'}
            data-no-booking-intercept={location.pathname === '/contact' ? '1' : undefined}
            className={`min-h-10 shrink-0 rounded-full border px-2.5 py-2 text-[11px] font-semibold sm:px-3.5 sm:text-xs ${
              isCareersPage
                ? 'cursor-default border-slate-300 bg-slate-100 text-slate-600'
                : isSchoolsPage
                ? 'border-[#CBB7E0] bg-[#F1EDFC] text-[#17284C]'
                : 'border-slate-900 bg-slate-900 text-white'
            }`}
          >
            {isCareersPage ? 'Recruitment Closed' : isSchoolsPage ? 'School Options' : (
              <>
                <span className="sm:hidden">Free 35-min Demo</span>
                <span className="hidden sm:inline">Book Free 35-Minute Demo</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="flex h-10 w-9 shrink-0 flex-col items-center justify-center gap-1 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#755E96] sm:w-10"
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
        className={`overflow-hidden border-t border-[#D7E5F4] bg-white/96 transition-[max-height] duration-300 motion-reduce:transition-none backdrop-blur xl:hidden ${
          isOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-5 px-5 py-6 text-sm font-semibold text-slate-700">
          <div className="space-y-3">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                aria-current={matchesPrimaryLink(location.pathname, link.href) ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
                className={`block rounded-lg px-3 py-2 transition-colors hover:bg-[#EDF5FE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#755E96] ${
                  matchesPrimaryLink(location.pathname, link.href) ? 'bg-[#F1EDFC] text-[#604577]' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{user ? 'Account' : 'Login'}</p>
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
      <div data-testid="public-scroll-progress" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] overflow-hidden">
        <span ref={progressRef} className="block h-full w-full origin-left bg-gradient-to-r from-[#6E95D2] via-[#AFA1D9] to-[#F6CF7E] will-change-transform" style={{ transform: 'scaleX(0)' }} />
      </div>
    </nav>
  );
}
