import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./NavBar.css";

type NavItem = { label: string; to: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Book Free Assessment Class", to: "#book-trial" },
];

export default function NavBar(): JSX.Element {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const underlineRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  const [activeIndex, setActiveIndex] = useState<number>(0);

  // compute active index from pathname
  useEffect(() => {
    const idx = NAV_ITEMS.findIndex((n) => n.to === location.pathname);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [location.pathname]);

  // move underline to the index
  function moveUnderlineTo(index: number) {
    const container = containerRef.current;
    const el = itemRefs.current[index];
    const u = underlineRef.current;
    if (!container || !el || !u) return;

    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();

    const left = eRect.left - cRect.left;
    const targetWidth = Math.max(28, Math.round(eRect.width));
    u.style.width = `${targetWidth}px`;
    u.style.transform = `translateX(${left}px)`;
  }

  // initial placement and on activeIndex change and resize
  useEffect(() => {
    // place after layout
    const raf = requestAnimationFrame(() => moveUnderlineTo(activeIndex));
    const onResize = () => moveUnderlineTo(activeIndex);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [activeIndex]);

  // hover preview: move to hovered index but don't change activeIndex
  const handleHover = (i: number) => moveUnderlineTo(i);
  const handleLeave = () => moveUnderlineTo(activeIndex);

  return (
    <header className="ts-nav-wrapper">
      <nav className="ts-nav" ref={containerRef} aria-label="Main navigation">
        <ul className="ts-nav-list" onMouseLeave={handleLeave}>
          {NAV_ITEMS.map((item, i) => (
            <li key={item.label} className="ts-nav-item">
              <NavLink
                to={item.to}
                ref={(el) => { itemRefs.current[i] = el; }}
                className={({ isActive }) =>
                  `ts-nav-link ${isActive ? "active" : ""}`
                }
                onMouseEnter={() => handleHover(i)}
                onFocus={() => handleHover(i)}
                onBlur={() => handleLeave()}
                aria-current={i === activeIndex ? "page" : undefined}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ts-underline" ref={underlineRef} aria-hidden="true">
          <span className="streak" />
          <span className="particles" aria-hidden="true" />
        </div>
      </nav>
    </header>
  );
}