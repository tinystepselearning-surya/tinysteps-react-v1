// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';

// Create a motion-enabled Link for animated nav items
const MotionLink = motion(Link);
export default function Header() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const scrollRef = useRef(0);

  const handleLogout = async () => {
    clearUser();
    navigate('/login');
  };

  const navItems = user ? [
    { label: 'Dashboard', href: `/${user.role}` },
    { label: 'Profile', href: `/${user.role}/profile` },
  ] : [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      // Show navbar when scrolling up
      setIsSticky(currentScroll > 50);

      if (currentScroll > scrollRef.current) {
        setIsScrollingUp(false); // Scrolling down
      } else {
        setIsScrollingUp(true);  // Scrolling up
      }
      scrollRef.current = currentScroll;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Floating Navbar - Fixed at top when scrolling */}
      <motion.nav
        initial="hidden"
        animate={isSticky ? 'visible' : 'hidden'}
        variants={navbarVariants}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Glassmorphism Container */}
        <div className="relative backdrop-blur-md bg-white/70 rounded-none px-8 py-4 shadow-2xl border-b border-white/30">
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
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item, idx) => (
                <MotionLink
                  key={item.label}
                  to={item.href}
                  className="text-gray-700 font-medium text-sm relative group"
                  whileHover={{ color: '#3b82f6' }}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.28 }}
                >
                  {item.label}
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 w-0 group-hover:w-full"
                    transition={{ duration: 0.25 }}
                    layoutId={`underline-${item.label}`}
                  />
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
                  onClick={() => navigate('/login?role=parent')}
                >
                  Parent
                </motion.button>
                <motion.button
                  className="px-3 py-2 bg-green-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login?role=learning-partner')}
                >
                  LP
                </motion.button>
                <motion.button
                  className="px-3 py-2 bg-purple-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login?role=teacher')}
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
                  className="block text-gray-700 font-medium py-2 text-sm hover:text-blue-600 transition-colors"
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
                        onClick={() => navigate('/login?role=parent')}
                      >
                        Parent
                      </button>
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                        onClick={() => navigate('/login?role=learning-partner')}
                      >
                        LP
                      </button>
                      <button
                        className="px-3 py-1 bg-purple-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                        onClick={() => navigate('/login?role=teacher')}
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

      {/* Static Navbar at Top (always visible) */}
      {!isSticky && (
        <div className="fixed top-0 left-0 right-0 z-40 pt-6 px-6">
          <div className="relative backdrop-blur-md bg-white/70 rounded-full px-8 py-4 shadow-lg border border-white/30 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
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

              <div className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-gray-700 font-medium text-sm hover:text-blue-600 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-4">
                {/* Role buttons always visible for login */}
                <div className="flex items-center gap-2">
                  <motion.button
                    className="px-3 py-2 bg-blue-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login?role=parent')}
                  >
                    Parent
                  </motion.button>
                  <motion.button
                    className="px-3 py-2 bg-green-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login?role=learning-partner')}
                  >
                    LP
                  </motion.button>
                  <motion.button
                    className="px-3 py-2 bg-purple-600 text-white rounded-full font-medium text-xs hover:shadow-lg transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login?role=teacher')}
                  >
                    Teacher
                  </motion.button>
                </div>
                {!user && (
                  <>
                    <button
                      className="text-gray-700 font-medium text-sm px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                      onClick={() => navigate('/login')}
                    >
                      Sign in
                    </button>
                    <button
                      className="px-6 py-2 bg-black text-white rounded-full font-medium text-sm hover:bg-gray-900 transition-colors"
                      onClick={() => navigate('/contact')}
                    >
                      Contact Us
                    </button>
                  </>
                )}
                {user && (
                  <>
                    <span className="text-sm text-gray-600">{user.displayName} ({user.role})</span>
                    <button
                      className="text-red-600 font-medium text-sm px-4 py-2 rounded-full hover:bg-red-100 transition-colors"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>

              <motion.button
                className="md:hidden flex flex-col gap-1.5"
                onClick={() => setIsOpen(!isOpen)}
              >
                {[0, 1, 2].map((line) => (
                  <div key={line} className="w-5 h-0.5 bg-gray-900" />
                ))}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}