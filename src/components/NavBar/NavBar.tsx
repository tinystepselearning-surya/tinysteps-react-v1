import React, { useEffect, useRef, useState, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./NavBar.css";

type NavItem = { label: string; to: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Curriculum", to: "/curriculum" },
  { label: "Blog", to: "/blog" },
  { label: "Pricing", to: "/pricing" },
  { label: "Parent Login", to: "/parent/login" },
];

const MORE_ITEMS: NavItem[] = [
  { label: "Teachers", to: "/teacher" },
  { label: "Learning Partner", to: "/learning-partner" },
  { label: "Kids", to: "/kids" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
  { label: "Dashboard", to: "/dashboard" },
];

export default function NavBar(): JSX.Element {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const underlineRef = useRef<HTMLDivElement | null>(null);

  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const moreWrapRef = useRef<HTMLLIElement | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showCta, setShowCta] = useState<boolean>(true);
  const [moreOpen, setMoreOpen] = useState(false);

  const isHome = location.pathname === "/";

  // compute active index from pathname
  useEffect(() => {
    const idx = NAV_ITEMS.findIndex((n) => n.to === location.pathname);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [location.pathname]);

  // close More on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Hide CTA while hero is visible (home only)
  useEffect(() => {
    if (!isHome) {
      setShowCta(true);
      return;
    }

    const hero = document.getElementById("home-hero");
    if (!hero) {
      setShowCta(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => setShowCta(!entry.isIntersecting),
      { threshold: 0.35 }
    );

    obs.observe(hero);
    return () => obs.disconnect();
  }, [isHome]);

  function scrollToHeroForm() {
    try {
      const input = document.getElementById("hero-lead-parentName") as HTMLInputElement | null;
      const hero = document.getElementById("home-hero");
      (input ?? hero)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => input?.focus?.(), 450);
    } catch {
      // no-op
    }
  }

  const handleCtaClick = () => {
    if (!isHome) {
      navigate("/");
      setTimeout(scrollToHeroForm, 100);
      return;
    }
    scrollToHeroForm();
  };

  // --- underline helpers ---
  const moveUnderlineToEl = useCallback((el: HTMLElement | null) => {
    const container = containerRef.current;
    const u = underlineRef.current;
    if (!container || !el || !u) return;

    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();

    const left = eRect.left - cRect.left;
    const targetWidth = Math.max(28, Math.round(eRect.width));
    u.style.width = `${targetWidth}px`;
    u.style.transform = `translateX(${left}px)`;
  }, []);

  const moveUnderlineTo = useCallback(
    (index: number) => {
      const el = itemRefs.current[index];
      if (!el) return;
      moveUnderlineToEl(el);
    },
    [moveUnderlineToEl]
  );

  // underline placement on activeIndex + resize
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (moreOpen) moveUnderlineToEl(moreBtnRef.current);
      else moveUnderlineTo(activeIndex);
    });

    const onResize = () => {
      if (moreOpen) moveUnderlineToEl(moreBtnRef.current);
      else moveUnderlineTo(activeIndex);
    };

    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [activeIndex, moreOpen, moveUnderlineTo, moveUnderlineToEl]);

  // hover preview underline only (More does NOT open on hover)
  const handleHover = (i: number) => {
    if (moreOpen) return;
    moveUnderlineTo(i);
  };
  const handleLeave = () => {
    if (moreOpen) {
      moveUnderlineToEl(moreBtnRef.current);
      return;
    }
    moveUnderlineTo(activeIndex);
  };

  // close on Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ✅ close on outside click (capture, so overlays can't block it)
  useEffect(() => {
    if (!moreOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const wrap = moreWrapRef.current;
      const path = (e.composedPath?.() ?? []) as EventTarget[];
      if (wrap && path.includes(wrap)) return; // inside → keep open
      setMoreOpen(false); // outside → close
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [moreOpen]);

  return (
    <header className="ts-nav-wrapper">
      <nav className="ts-nav" ref={containerRef} aria-label="Main navigation">
        <ul className="ts-nav-list" onMouseLeave={handleLeave}>
          {NAV_ITEMS.map((item, i) => (
            <li key={item.label} className="ts-nav-item">
              <NavLink
                to={item.to}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={({ isActive }) => `ts-nav-link ${isActive ? "active" : ""}`}
                onMouseEnter={() => handleHover(i)}
                onFocus={() => handleHover(i)}
                onBlur={() => handleLeave()}
                aria-current={i === activeIndex ? "page" : undefined}
              >
                {item.label}
              </NavLink>
            </li>
          ))}

          {/* ✅ More (CLICK ONLY) */}
          <li ref={moreWrapRef} className="ts-nav-item ts-nav-more">
            <button
              ref={moreBtnRef}
              type="button"
              className={`ts-nav-link ts-nav-more-btn ${moreOpen ? "active" : ""}`}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => {
                setMoreOpen((v) => !v);
                setTimeout(() => moveUnderlineToEl(moreBtnRef.current), 0);
              }}
              onMouseEnter={() => {
                if (!moreOpen) moveUnderlineToEl(moreBtnRef.current);
              }}
              onFocus={() => {
                if (!moreOpen) moveUnderlineToEl(moreBtnRef.current);
              }}
            >
Priya <span className="ts-nav-caret">▾</span>
            </button>

            {moreOpen && (
              <div className="ts-nav-more-menu" role="menu">
                {MORE_ITEMS.map((it) => (
                  <NavLink
                    key={it.label}
                    to={it.to}
                    role="menuitem"
                    className="ts-nav-more-link"
                    onClick={() => setMoreOpen(false)}
                  >
                    {it.label}
                  </NavLink>
                ))}
              </div>
            )}
          </li>

          {/* ✅ CTA */}
          {showCta && (
            <li className="ts-nav-item">
              <button type="button" className="ts-nav-link" onClick={handleCtaClick}>
                Book Free 35-Minute Demo
              </button>
            </li>
          )}
        </ul>

        <div className="ts-underline" ref={underlineRef} aria-hidden="true">
          <span className="streak" />
          <span className="particles" aria-hidden="true" />
        </div>
      </nav>
    </header>
  );
}
