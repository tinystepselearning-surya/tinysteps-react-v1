// src/components/common/Header.tsx
// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { Link, useLocation, useNavigate } from "react-router-dom";

type LinkItem = { label: string; href: string };

const dashboardPaths: Record<string, string> = {
  admin: "/surya",
  teacher: "/teacher",
  parent: "/parent",
  kid: "/kids",
  learningPartner: "/learning-partner",
  learningpartner: "/learning-partner",
};

export default function Header() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // ✅ CLICK-ONLY dropdown state
  const [showMore, setShowMore] = useState(false);
  const moreWrapRef = useRef<HTMLDivElement | null>(null);

  const parentHref = user?.role === "parent" ? "/parent" : "/parent/login";

  const primaryLinks: LinkItem[] = [
    { label: "Courses", href: "/courses" },
    { label: "Curriculum", href: "/curriculum" },
    { label: "Parent", href: parentHref },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
  ];

  const moreLinks: LinkItem[] = [
    { label: "Teachers", href: "/teacher" },
    { label: "Learning Partner", href: "/learning-partner" },
    { label: "Kids", href: "/parent/kids" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ];

  // ✅ This is the blue gradient button in header (like your screenshot)
  const ctaLink: LinkItem = { label: "Why Tiny Steps", href: "/why-us" };

  const isHomePage = location.pathname === "/";

  // ✅ Close dropdown on route change
  useEffect(() => {
    setShowMore(false);
    setIsOpen(false);
  }, [location.pathname]);

  // ✅ Click outside closes dropdown (capture so nothing steals the click)
  useEffect(() => {
    if (!showMore) return;

    const onPointerDownCapture = (event: PointerEvent) => {
      const t = event.target as Node | null;
      if (!t) return;
      if (moreWrapRef.current?.contains(t)) return; // inside dropdown/button
      setShowMore(false);
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => document.removeEventListener("pointerdown", onPointerDownCapture, true);
  }, [showMore]);

  // ✅ Esc closes dropdown
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMore(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (isHomePage) setIsSticky(current > 50);
      else setIsSticky(true);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  const handleLogout = async () => {
    try {
      const [{ signOut }, { auth }] = await Promise.all([
        import("firebase/auth"),
        import("../../lib/firebaseConfig"),
      ]);
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out of Firebase", err);
    }

    const currentRole = user?.role;
    clearUser();

    const loginMap: Record<string, string> = {
      admin: "/surya/login",
      teacher: "/teacher/login",
      parent: "/parent/login",
      learningPartner: "/learning-partner/login",
      kid: "/parent/login",
    };

    const destination = currentRole ? loginMap[currentRole] || "/login" : "/login";
    navigate(destination);
  };

  const handleBookAssessment = () => {
    if (location.pathname === "/") {
      document.getElementById("book-trial")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate("/?book=1");
  };

  const navbarVariants = {
    hidden: { opacity: 0, y: -12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isSticky
          ? "bg-white/85 backdrop-blur-lg shadow-[0_15px_35px_rgba(8,15,40,0.12)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <motion.div
          className="flex cursor-pointer items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")}
        >
          <img src="/logo.png" alt="Tiny Steps Logo" className="h-11 w-11 object-contain" />
          <div>
            <div className="font-bold text-gray-900">Tiny Steps</div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
              Foundations Forever
            </div>
          </div>
        </motion.div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-700">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="hover:text-tiny-blue-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* ✅ CLICK ONLY dropdown */}
          <div className="relative" ref={moreWrapRef}>
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-tiny-blue-600"
              aria-haspopup="menu"
              aria-expanded={showMore}
              onClick={(e) => {
                e.preventDefault();
                setShowMore((prev) => !prev);
              }}
            >
              More ▾
            </button>

            {showMore && (
              <div
                className="absolute left-0 mt-3 w-56 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-2xl backdrop-blur"
                role="menu"
              >
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="hover:text-tiny-blue-600"
                      role="menuitem"
                      onClick={() => setShowMore(false)}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {user && (
                    <Link
                      to={dashboardPaths[user.role] || `/${user.role}`}
                      className="hover:text-tiny-blue-600"
                      role="menuitem"
                      onClick={() => setShowMore(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Blue CTA */}
          <Link
            to={ctaLink.href}
            className="ml-4 inline-flex items-center justify-center h-12 rounded-full bg-gradient-to-r from-[#0f172a] via-[#2563eb] to-[#7c3aed] px-5 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(15,23,42,0.35)] transition hover:shadow-[0_20px_40px_rgba(37,99,235,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {ctaLink.label}
          </Link>
        </div>

        {/* Desktop book button */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={handleBookAssessment}
            aria-label="Book Free Assessment Class"
            className="inline-flex items-center justify-center h-12 rounded-full bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] px-5 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(255,143,92,0.35)]"
            type="button"
          >
            Book Free Assessment Class
          </button>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={handleBookAssessment}
            aria-label="Book Free Assessment Class"
            className="rounded-full bg-gradient-to-r from-[#ff8f5c] to-[#59c3ff] px-4 py-2 text-xs font-semibold text-white"
            type="button"
          >
            Book Free Assessment Class
          </button>

          <motion.button onClick={() => setIsOpen(!isOpen)} className="flex flex-col gap-1" type="button">
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

      {/* Mobile drawer */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: isOpen ? "auto" : 0 }}
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
            <button
              className="text-left text-red-600"
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              type="button"
            >
              Logout
            </button>
          ) : (
            <button
              className="text-left"
              onClick={() => {
                navigate("/login");
                setIsOpen(false);
              }}
              type="button"
            >
              Sign in
            </button>
          )}
        </div>
      </motion.div>
    </motion.nav>
  );
}
