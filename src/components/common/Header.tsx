// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const scrollRef = useRef(0);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const primaryLinks = [
    { label: 'Courses', href: '/courses' },
    { label: 'Curriculum', href: '/curriculum' },
    { label: 'Blog', href: '/blog' },
    { label: 'Pricing', href: '/pricing' }
  ];

  const moreLinks = [
    { label: 'Teachers', href: '/teacher' },
    { label: 'Learning Partner', href: '/learning-partner' },
    { label: 'Kids', href: '/parent/kids' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Parent', href: '/parent/login' },
  ];

  const ctaLink = { label: 'Why Tiny Steps', href: '/why-tiny-steps' };

  const dashboardPaths: Record<string, string> = {
    admin: '/surya',
    teacher: '/teacher',
    parent: '/parent',
    learningPartner: '/learning-partner',
    kid: '/parent/kids',
  };

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (isHomePage) {
        setIsSticky(current > 50);
      } else {
        setIsSticky(true);
      }
      scrollRef.current = current;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const handleLogout = async () => {
    // Sign out via firebase only when user actually logs out. Importing
    // firebase/auth and the app config lazily keeps the public pages free
    // of the Firebase SDK until needed.
    try {
      const [{ signOut }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('../../lib/firebaseConfig'),
      ] as any);
      await signOut(auth);
    } catch (err) {
      // ignore firebase signout error (we still clear local state)
      console.error('Error signing out of Firebase', err);
    }
    // capture role first
    const currentRole = user?.role;
  clearUser();
    const loginMap: Record<string, string> = {
      admin: '/surya/login',
      teacher: '/teacher/login',
      parent: '/parent/login',
      learningPartner: '/learning-partner/login',
      kid: '/parent/login',
    };
    const destination = currentRole ? (loginMap[currentRole] || '/login') : '/login';
    navigate(destination);
  };

  const navbarVariants = {
    hidden: { opacity: 0, y: -12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isSticky ? 'bg-white/85 backdrop-blur-lg shadow-[0_15px_35px_rgba(8,15,40,0.12)]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <motion.div
          className="flex cursor-pointer items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
        >
          <img src="/logo.png" alt="Tiny Steps Logo" className="h-11 w-11 object-contain" />
          <div>
            <div className="font-bold text-gray-900">Tiny Steps</div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Foundations Forever</div>
          </div>
        </motion.div>

        <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-700">
          {primaryLinks.map((link) => (
            <Link key={link.href} to={link.href} className="hover:text-tiny-blue-600 transition-colors">
              {link.label}
            </Link>
          ))}
          <div
            className="relative"
            ref={moreMenuRef}
            onMouseEnter={() => setShowMore(true)}
          >
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-tiny-blue-600"
              onClick={(event) => {
                event.preventDefault();
                setShowMore((prev) => !prev);
              }}
              onFocus={() => setShowMore(true)}
            >
              More ▾
            </button>
            {showMore && (
              <div className="absolute left-0 mt-3 w-56 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-2xl backdrop-blur">
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="hover:text-tiny-blue-600"
                      onClick={() => setShowMore(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user && (
                    <Link
                      to={dashboardPaths[user.role] || `/${user.role}`}
                      className="hover:text-tiny-blue-600"
                      onClick={() => setShowMore(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link
            to={ctaLink.href}
            className="ml-4 inline-flex items-center rounded-full bg-gradient-to-r from-[#0f172a] via-[#2563eb] to-[#7c3aed] px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(15,23,42,0.35)] transition hover:shadow-[0_20px_40px_rgba(37,99,235,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {ctaLink.label}
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {!user && (
            <a
              href="https://wa.me/919618398383"
              className="flex items-center gap-2 rounded-full border border-tiny-green-200/70 bg-white/80 px-4 py-1.5 text-sm font-semibold text-tiny-green-700 shadow-sm"
            >
              💬 +91 96183 98383
            </a>
          )}
          <button
            onClick={() => document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-full bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(255,143,92,0.35)]"
          >
            Book Free Trial
          </button>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-full bg-gradient-to-r from-[#ff8f5c] to-[#59c3ff] px-4 py-2 text-xs font-semibold text-white"
          >
            Book Trial
          </button>
          <motion.button onClick={() => setIsOpen(!isOpen)} className="flex flex-col gap-1">
            {[0, 1, 2].map((line) => (
              <motion.div
                key={line}
                className="h-0.5 w-6 bg-gray-900"
                animate={{
                  rotate: isOpen ? (line === 0 ? 45 : line === 2 ? -45 : 0) : 0,
                  y: isOpen ? (line === 0 ? 6 : line === 2 ? -6 : 0) : 0,
                  opacity: isOpen && line === 1 ? 0 : 1,
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </motion.button>
        </div>
      </div>

          <motion.div
        initial={{ height: 0 }}
        animate={{ height: isOpen ? 'auto' : 0 }}
        className="md:hidden overflow-hidden bg-white/95 backdrop-blur"
      >
        <div className="space-y-4 px-5 py-6 text-sm font-semibold text-gray-700">
          {primaryLinks.concat(moreLinks).map((link) => (
            <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)} className="block">
              {link.label}
            </Link>
          ))}
          <Link
            to={ctaLink.href}
            onClick={() => setIsOpen(false)}
            className="mt-2 block rounded-full bg-gradient-to-r from-[#0f172a] via-[#2563eb] to-[#7c3aed] px-5 py-2 text-center font-semibold text-white shadow-md"
          >
            {ctaLink.label}
          </Link>
          {user ? (
            <button className="text-left text-red-600" onClick={() => { handleLogout(); setIsOpen(false); }}>
              Logout
            </button>
          ) : (
            <button className="text-left" onClick={() => { navigate('/login'); setIsOpen(false); }}>
              Sign in
            </button>
          )}
          {!user && (
            <a href="https://wa.me/919618398383" className="block text-tiny-green-700">WhatsApp: +91 96183 98383</a>
          )}
        </div>
      </motion.div>
    </motion.nav>
  );
}
