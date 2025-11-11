// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Link, useLocation } from 'react-router-dom';

// Create a motion-enabled Link for animated nav items
const MotionLink = motion(Link);
export default function Header() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const scrollRef = useRef(0);

  const handleLogout = async () => {
    clearUser();
    navigate('/login');
  };

  // Determine if we're on the home page
  const isHomePage = location.pathname === '/';

  type NavItem = { label: string; href: string; variant?: 'pill' };
  const marketingNav: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses', variant: 'pill' },
    { label: 'Curriculum', href: '/curriculum', variant: 'pill' },
    { label: 'Blog', href: '/blog' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
  ];
  const navItems: NavItem[] = user
    ? [
        { label: 'Dashboard', href: `/${user.role}` },
        { label: 'Profile', href: `/${user.role}/profile` },
      ]
    : marketingNav;

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      // Only make navbar sticky on home page, otherwise keep it fixed
      if (isHomePage) {
        setIsSticky(currentScroll > 50);
      } else {
        setIsSticky(true); // Always sticky on other pages
      }

      if (currentScroll > scrollRef.current) {
        setIsScrollingUp(false); // Scrolling down
      } else {
        setIsScrollingUp(true);  // Scrolling up
      }
      scrollRef.current = currentScroll;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const navbarVariants = {
    hidden: { opacity: 0, y: -12, x: 0 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.3 },
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.08, duration: 0.3 },
    }),
  };

  return (
    <>
      {/* Single Navbar - Fixed at top */}
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={navbarVariants}
        className={`fixed top-0 left-0 right-0 z-50 ${
          isHomePage && !isSticky ? 'pt-6 px-6' : ''
        }`}
      >
        {/* Glassmorphism Container */}
        <div className={`relative backdrop-blur-md bg-gradient-to-r from-white/90 via-white/70 to-white/60 rounded-3xl px-6 py-4 shadow-2xl border border-white/30 ${
          isHomePage && !isSticky ? 'max-w-7xl mx-auto' : 'rounded-none'
        }`}>
          {/* Animated Background Blur Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center justify-between max-w-7xl mx-auto">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
            >
              <img
                src="/logo.png"
                alt="Tiny Steps Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="hidden sm:inline font-bold text-base text-gray-900">
                Tiny Steps
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-wrap items-center gap-5">
              {navItems.map((item, idx) => (
                <MotionLink
                  key={item.label}
                  to={item.href}
                  className={`text-sm font-semibold relative group transition-colors ${
                    item.variant === 'pill'
                      ? 'px-4 py-2 rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-400 text-white shadow-sm hover:shadow-lg'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                  whileHover={{ color: '#3b82f6' }}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.28 }}
                >
                  {item.label}
                  {item.variant !== 'pill' && (
                    <motion.div
                      className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 w-0 group-hover:w-full"
                      transition={{ duration: 0.25 }}
                      layoutId={`underline-${item.label}`}
                    />
                  )}
                </MotionLink>
              ))}
            </div>

            {/* Right Side Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {/* Role buttons always visible for login */}
              <div className="flex items-center gap-2">
                <motion.button
                  className="px-3 py-2 bg-blue-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/parent/login')}
                >
                  Parent
                </motion.button>
                <motion.button
                  className="px-3 py-2 bg-green-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/learningpartner/login')}
                >
                  LP
                </motion.button>
                <motion.button
                  className="px-3 py-2 bg-purple-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/teacher/login')}
                >
                  Teacher
                </motion.button>
              </div>
              {!user && (
                <>
                  <motion.button
                    className="text-gray-700 font-medium text-sm px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                  >
                    Sign in
                  </motion.button>
                  <motion.button
                    className="px-6 py-2 bg-black text-white rounded-full font-medium text-sm"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/contact')}
                  >
                    Contact Us
                  </motion.button>
                </>
              )}
              {user && (
                <>
                  <span className="text-sm text-gray-600">{user.displayName} ({user.role})</span>
                  <motion.button
                    className="text-red-600 font-medium text-sm px-4 py-2 rounded-full hover:bg-red-100 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                  >
                    Logout
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden flex flex-col gap-1.5"
              onClick={() => setIsOpen(!isOpen)}
            >
              {[0, 1, 2].map((line) => (
                <motion.div
                  key={line}
                  className="w-5 h-0.5 bg-gray-900"
                  animate={{
                    rotate: isOpen ? (line === 0 ? 45 : line === 2 ? -45 : 0) : 0,
                    y: isOpen ? (line === 0 ? 8 : line === 2 ? -8 : 0) : 0,
                    opacity: isOpen && line === 1 ? 0 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </motion.button>
          </div>

          {/* Mobile Menu */}
          <motion.div
            initial="closed"
            animate={isOpen ? 'open' : 'closed'}
            variants={mobileMenuVariants}
            className="md:hidden absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-xl border border-gray-100"
          >
            <div className="px-6 py-4 space-y-3">
              {navItems.map((item, i) => (
                <MotionLink
                  key={item.label}
                  to={item.href}
                  className={`block font-medium py-2 text-sm transition-colors ${
                    item.variant === 'pill'
                      ? 'px-4 text-center rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                  custom={i}
                  variants={itemVariants}
                >
                  {item.label}
                </MotionLink>
              ))}
              <motion.div
                className="pt-3 border-t border-gray-100 space-y-3"
                variants={itemVariants}
                custom={navItems.length}
              >
                {!user && (
                  <>
                    <button
                      className="w-full text-gray-700 font-medium py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => navigate('/login')}
                    >
                      Sign in
                    </button>
                    <div className="flex justify-center gap-2 py-2">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                        onClick={() => navigate('/parent/login')}
                      >
                        Parent
                      </button>
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                        onClick={() => navigate('/learningpartner/login')}
                      >
                        LP
                      </button>
                      <button
                        className="px-3 py-1 bg-purple-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                        onClick={() => navigate('/teacher/login')}
                      >
                        Teacher
                      </button>
                    </div>
                    <button
                      className="w-full bg-black text-white font-medium py-2 rounded-lg text-sm"
                      onClick={() => navigate('/contact')}
                    >
                      Contact Us
                    </button>
                  </>
                )}
                {user && (
                  <>
                    <span className="block text-sm text-gray-600 py-2">{user.displayName} ({user.role})</span>
                    <button
                      className="w-full text-red-600 font-medium py-2 text-sm hover:bg-red-100 rounded-lg transition-colors"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.nav>
    </>
  );
}
