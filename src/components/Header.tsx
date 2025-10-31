import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const courseLinks = [
  { label: "All Courses Overview", to: "/courses" },
  { label: "Phonics Foundations", to: "/courses/phonics" },
  { label: "Grammar & Writing", to: "/courses/grammar" },
  { label: "Public Speaking", to: "/courses/public-speaking" },
];

// External / legacy (static) pages stay as <a href="...">
const legacyLinks: Array<{ label: string; to: string } | { label: string; href: string }> = [
  { label: "Blog", to: "/blog" },
  { label: "Teachers", to: "/roles/teacher" },
  { label: "Learning Managers", to: "/roles/rm" },
  { label: "Kids", to: "/roles/kids" },
];

// SPA internal pages
const appLinks = [
  { label: "Parents", to: "/parents" },
  { label: "Curriculum", to: "/curriculum" },
  { label: "FAQ", to: "/faq" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // Close popovers/drawer when navigating (mobile)
  const onNavigate = () => {
    setOpen(false);
    setMobileOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-gray-100 transition-colors ${
        scrolled
          ? "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70"
          : "bg-white/80 backdrop-blur"
      }`}
      role="banner"
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="Tiny Steps Home" onClick={onNavigate}>
          <img src="/assets/images/logo.png" alt="" width={40} height={40} className="h-10 w-10" />
          <span className="text-2xl font-extrabold tracking-tight text-[#e05c0a]">
            Tiny<span className="mx-0.5" />Steps
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="ml-auto hidden lg:flex items-center gap-1.5 text-sm font-semibold tracking-tight text-gray-700"
          aria-label="Primary"
        >
          {/* Courses dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 transition-colors hover:bg-[#fff4ec] hover:text-[#e05c0a]"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="menu"
            >
              Courses
              <svg width="16" height="16" viewBox="0 0 20 20" className="opacity-70">
                <path
                  fill="currentColor"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                />
              </svg>
            </button>
            {open && (
              <div
                className="absolute left-0 mt-3 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl p-2"
                role="menu"
              >
                {courseLinks.map((l) => (
                  <NavLink
                    key={l.label}
                    to={l.to}
                    className={({ isActive }) =>
                      `block rounded-xl px-3 py-2 text-sm font-semibold ${
                        isActive ? "bg-[#fff3ec] text-[#e05c0a]" : "text-gray-800 hover:bg-gray-50"
                      }`
                    }
                    role="menuitem"
                    onClick={onNavigate}
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Internal SPA links */}
          {appLinks.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) =>
                `inline-flex items-center rounded-full px-3.5 py-2 transition-colors ${
                  isActive ? "bg-[#fff4ec] text-[#e05c0a]" : "hover:bg-[#fff4ec] text-gray-700 hover:text-[#e05c0a]"
                }`
              }
              onClick={onNavigate}
            >
              {l.label}
            </NavLink>
          ))}

          {/* Legacy/static links */}
          {legacyLinks.map((l) =>
            "to" in l ? (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `inline-flex items-center rounded-full px-3.5 py-2 transition-colors ${
                    isActive ? "bg-[#fff4ec] text-[#e05c0a]" : "hover:bg-[#fff4ec] hover:text-[#e05c0a]"
                  }`
                }
                onClick={onNavigate}
              >
                {l.label}
              </NavLink>
            ) : (
              <a
                key={l.label}
                href={l.href}
                className="inline-flex items-center rounded-full px-3.5 py-2 transition-colors hover:bg-[#fff4ec] hover:text-[#e05c0a]"
              >
                {l.label}
              </a>
            ),
          )}

          <Link
            to="/#book-trial"
            className="ml-2 inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-[#ff8a4c]/40 transition hover:-translate-y-0.5"
            style={{ backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }}
            onClick={onNavigate}
          >
            Book Trial
          </Link>

        </nav>

        {/* Mobile menu button */}
        <button
          className="ml-auto rounded-xl border border-gray-200 p-2 text-xl text-gray-700 lg:hidden"
          aria-label="Menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100">
          <nav className="mx-auto max-w-6xl px-4 py-3 grid gap-2" aria-label="Mobile">
            <details>
              <summary className="cursor-pointer font-semibold text-gray-800">Courses</summary>
              <div className="mt-2 grid">
                {courseLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="py-2 text-gray-700 border-b last:border-0"
                    onClick={onNavigate}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </details>

            {/* Internal SPA links */}
            {appLinks.map((l) => (
              <Link key={l.label} to={l.to} className="py-2 text-gray-700 border-b last:border-0" onClick={onNavigate}>
                {l.label}
              </Link>
            ))}

            {/* Legacy/static links */}
            {legacyLinks.map((l) =>
              "to" in l ? (
                <Link
                  key={l.label}
                  to={l.to}
                  className="py-2 text-gray-700 border-b last:border-0"
                  onClick={onNavigate}
                >
                  {l.label}
                </Link>
              ) : (
                <a key={l.label} href={l.href} className="py-2 text-gray-700 border-b last:border-0">
                  {l.label}
                </a>
              ),
            )}

            <div className="flex gap-3 pt-2">
              <Link
                to="/#book-trial"
                className="flex-1 text-center rounded-full px-4 py-2 text-white font-extrabold"
                style={{ backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }}
                onClick={onNavigate}
              >
                Book Trial
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
