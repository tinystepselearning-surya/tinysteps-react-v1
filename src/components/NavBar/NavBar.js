import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./NavBar.css";
const NAV_ITEMS = [
    { label: "Home", to: "/" },
    { label: "Book Trial", to: "#book-trial" },
];
export default function NavBar() {
    const containerRef = useRef(null);
    const itemRefs = useRef([]);
    const underlineRef = useRef(null);
    const location = useLocation();
    const [activeIndex, setActiveIndex] = useState(0);
    // compute active index from pathname
    useEffect(() => {
        const idx = NAV_ITEMS.findIndex((n) => n.to === location.pathname);
        setActiveIndex(idx >= 0 ? idx : 0);
    }, [location.pathname]);
    // move underline to the index
    function moveUnderlineTo(index) {
        const container = containerRef.current;
        const el = itemRefs.current[index];
        const u = underlineRef.current;
        if (!container || !el || !u)
            return;
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
    const handleHover = (i) => moveUnderlineTo(i);
    const handleLeave = () => moveUnderlineTo(activeIndex);
    return (_jsx("header", { className: "ts-nav-wrapper", children: _jsxs("nav", { className: "ts-nav", ref: containerRef, "aria-label": "Main navigation", children: [_jsx("ul", { className: "ts-nav-list", onMouseLeave: handleLeave, children: NAV_ITEMS.map((item, i) => (_jsx("li", { className: "ts-nav-item", children: _jsx(NavLink, { to: item.to, ref: (el) => { itemRefs.current[i] = el; }, className: ({ isActive }) => `ts-nav-link ${isActive ? "active" : ""}`, onMouseEnter: () => handleHover(i), onFocus: () => handleHover(i), onBlur: () => handleLeave(), "aria-current": i === activeIndex ? "page" : undefined, children: item.label }) }, item.label))) }), _jsxs("div", { className: "ts-underline", ref: underlineRef, "aria-hidden": "true", children: [_jsx("span", { className: "streak" }), _jsx("span", { className: "particles", "aria-hidden": "true" })] })] }) }));
}
