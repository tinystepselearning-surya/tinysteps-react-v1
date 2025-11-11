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
    { label: 'Teachers', href: '/teachers' },
    { label: 'Learning Partner', href: '/learning-partner' },
    { label: 'Kids', href: '/kid' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' }
  ];

  const isHomePage = location.pathname === '/';

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

  const handleLogout = () => {
    clearUser();
    navigate('/login');
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
          <img src="/logo.png" alt="Tiny Steps Logo" className="h-9 w-9 object-contain" />
          <div>
            <div className="font-bold text-gray-900">Tiny Steps</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500">English Lab</div>
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
            onMouseLeave={() => setShowMore(false)}
            onFocus={() => setShowMore(true)}
            onBlur={(event) => {
              if (!moreMenuRef.current?.contains(event.relatedTarget as Node)) {
                setShowMore(false);
              }
            }}
          >
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-tiny-blue-600"
              onClick={(event) => {
                event.preventDefault();
                setShowMore((prev) => !prev);
              }}
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
                    <Link to={`/${user.role}`} className="hover:text-tiny-blue-600" onClick={() => setShowMore(false)}>
                      Dashboard
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://wa.me/919618398383"
            className="flex items-center gap-2 rounded-full border border-tiny-green-200/70 bg-white/80 px-4 py-1.5 text-sm font-semibold text-tiny-green-700 shadow-sm"
          >
            💬 +91 96183 98383
          </a>
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
          {user ? (
            <button className="text-left text-red-600" onClick={() => { handleLogout(); setIsOpen(false); }}>
              Logout
            </button>
          ) : (
            <button className="text-left" onClick={() => { navigate('/login'); setIsOpen(false); }}>
              Sign in
            </button>
          )}
          <a href="https://wa.me/919618398383" className="block text-tiny-green-700">WhatsApp: +91 96183 98383</a>
        </div>
      </motion.div>
    </motion.nav>
  );
}
