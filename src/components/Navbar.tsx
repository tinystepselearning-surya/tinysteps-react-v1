import { useState } from "react";

const links = [
  { label: "Teachers", href: "#" },
  { label: "Kids", href: "#" },
  { label: "Learning Manager", href: "#" },
  { label: "Parents", href: "#" },
  { label: "Blog", href: "#" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">
        {/* left: logo + brand */}
        <a href="/" className="flex items-center gap-2">
          {/* sunrise dot as logo placeholder */}
          <span
            aria-hidden
            className="h-8 w-8 rounded-full shrink-0"
            style={{
              background:
                "conic-gradient(from 200deg, #ffd699, #ffa94d 40%, #ff8a4c 75%, #ffd699 100%)",
            }}
          />
          <span className="text-xl font-semibold text-gray-900">Tiny Steps</span>
        </a>

        {/* center: main nav */}
        <nav className="ml-auto hidden lg:flex items-center gap-6 text-sm">
          <div
            className="relative"
            onMouseEnter={() => setCoursesOpen(true)}
            onMouseLeave={() => setCoursesOpen(false)}
          >
            <button
              className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
              onClick={() => setCoursesOpen((v) => !v)}
            >
              Courses
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/>
              </svg>
            </button>
            {coursesOpen && (
              <div className="absolute left-0 mt-2 w-60 rounded-xl border border-gray-100 bg-white shadow-lg p-2">
                {[
                  { label: "Phonics", href: "#" },
                  { label: "Grammar", href: "#" },
                  { label: "Public Speaking", href: "#" },
                ].map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {c.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-gray-700 hover:text-gray-900">
              {l.label}
            </a>
          ))}

          <a
            href="#"
            className="inline-flex items-center rounded-full px-4 py-2 text-white text-sm font-medium"
            style={{ backgroundImage: "linear-gradient(90deg,#ffa94d,#ff8a4c)" }}
          >
            Book Trial
          </a>

          <a href="#" className="text-gray-700 hover:text-gray-900">
            Sign in
          </a>
        </nav>

        {/* right: mobile menu button */}
        <button
          className="ml-auto lg:hidden p-2 rounded-lg border border-gray-200"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="lg:hidden border-t border-gray-100">
          <nav className="mx-auto max-w-7xl px-4 py-3 grid gap-2 text-sm">
            <details className="group">
              <summary className="cursor-pointer text-gray-700 hover:text-gray-900 list-none flex items-center justify-between">
                <span>Courses</span>
                <span>▾</span>
              </summary>
              <div className="mt-2 grid">
                {["Phonics","Grammar","Public Speaking"].map((x) => (
                  <a key={x} href="#" className="text-gray-700 py-2 border-b last:border-0">
                    {x}
                  </a>
                ))}
              </div>
            </details>
            {links.map((l) => (
              <a key={l.label} href={l.href} className="text-gray-700">
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <a
                href="#"
                className="flex-1 text-center rounded-full px-4 py-2 text-white font-medium"
                style={{ backgroundImage: "linear-gradient(90deg,#ffa94d,#ff8a4c)" }}
              >
                Book Trial
              </a>
              <a href="#" className="flex-1 text-center rounded-full px-4 py-2 border border-gray-200">
                Sign in
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
