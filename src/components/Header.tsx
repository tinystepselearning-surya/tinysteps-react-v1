import { useEffect, useRef, useState } from "react";

const courseLinks = [
  { label: "All Courses Overview", href: "/main/courses/" },
  { label: "Phonics Foundations", href: "/main/courses/phonics/" },
  { label: "Grammar & Writing", href: "/main/courses/grammar/" },
  { label: "Public Speaking", href: "/main/courses/public-speaking/" },
];

const mainLinks = [
  { label: "Teachers", href: "/roles/teacher/" },
  { label: "Kids", href: "/roles/kid/" },
  { label: "Relationship Manager", href: "/roles/rm/" },
  { label: "Parents", href: "/main/parents/" },
  { label: "Blog", href: "/blog/" },
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

  return (
    <header
      className={`sticky top-0 z-50 border-b border-gray-100 transition-colors ${
        scrolled ? "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70" : "bg-white/80 backdrop-blur"
      }`}
      role="banner"
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2" aria-label="Tiny Steps Home">
          <img src="/assets/images/logo.png" alt="" width={40} height={40} className="h-10 w-10" />
          <span className="text-xl font-extrabold text-[#e05c0a]">Tiny<span className="mx-0.5" />Steps</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 ml-auto" aria-label="Primary">
          <div className="relative" ref={menuRef}>
            <button
              className="inline-flex items-center gap-1 px-3 py-2 font-semibold text-gray-800 hover:text-[#e05c0a]"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              Courses
              <svg width="16" height="16" viewBox="0 0 20 20" className="opacity-70">
                <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
              </svg>
            </button>
            {open && (
              <div
                className="absolute left-0 mt-2 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl p-2"
                role="menu"
              >
                {courseLinks.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    role="menuitem"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {mainLinks.map((l) => (
            <a key={l.label} href={l.href} className="px-3 py-2 font-semibold text-gray-800 hover:text-[#e05c0a]">
              {l.label}
            </a>
          ))}

          <a
            href="/main/book-demo/"
            className="ml-1 rounded-full px-4 py-2 text-white font-extrabold shadow"
            style={{ backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }}
          >
            Book Trial
          </a>

          <a
            id="authBtn"
            href="/auth.html"
            className="ml-2 rounded-full px-4 py-2 border font-bold text-[#e05c0a] border-gray-200"
            aria-live="polite"
          >
            Sign in
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden ml-auto p-2 rounded-xl border border-gray-200"
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
                  <a key={l.label} href={l.href} className="py-2 text-gray-700 border-b last:border-0">
                    {l.label}
                  </a>
                ))}
              </div>
            </details>
            {mainLinks.map((l) => (
              <a key={l.label} href={l.href} className="py-2 text-gray-700 border-b last:border-0">
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <a
                href="/main/book-demo/"
                className="flex-1 text-center rounded-full px-4 py-2 text-white font-extrabold"
                style={{ backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }}
              >
                Book Trial
              </a>
              <a href="/auth.html" className="flex-1 text-center rounded-full px-4 py-2 border font-semibold">
                Sign in
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
