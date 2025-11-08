import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
const courseLinks = [
    { label: "All Courses Overview", to: "/courses" },
    { label: "Phonics Foundations", to: "/courses/phonics" },
    { label: "Grammar & Writing", to: "/courses/grammar" },
    { label: "Public Speaking", to: "/courses/public-speaking" },
];
export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [coursesOpen, setCoursesOpen] = useState(false);
    const [educatorsOpen, setEducatorsOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const coursesRef = useRef(null);
    const educatorsRef = useRef(null);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    useEffect(() => {
        function handleClick(event) {
            const target = event.target;
            if (coursesRef.current && !coursesRef.current.contains(target)) {
                setCoursesOpen(false);
            }
            if (educatorsRef.current && !educatorsRef.current.contains(target)) {
                setEducatorsOpen(false);
            }
        }
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);
    // Close popovers/drawer when navigating (mobile)
    const onNavigate = () => {
        setCoursesOpen(false);
        setEducatorsOpen(false);
        setMobileOpen(false);
    };
    return (_jsxs("header", { className: `sticky top-0 z-50 border-b border-gray-100 transition-colors ${scrolled
            ? "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70"
            : "bg-white/80 backdrop-blur"}`, role: "banner", children: [_jsxs("div", { className: "mx-auto max-w-6xl px-4 h-16 flex items-center gap-4", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2.5", "aria-label": "Tiny Steps Home", onClick: onNavigate, children: [_jsx("img", { src: "/assets/images/logo.png", alt: "", width: 40, height: 40, className: "h-10 w-10" }), _jsxs("span", { className: "text-2xl font-extrabold tracking-tight text-[#e05c0a]", children: ["Tiny", _jsx("span", { className: "mx-0.5" }), "Steps"] })] }), _jsxs("nav", { className: "ml-auto hidden lg:flex items-center gap-1.5 text-sm font-semibold tracking-tight text-gray-700", "aria-label": "Primary", children: [_jsx(NavLink, { to: "/kids", className: ({ isActive }) => `inline-flex items-center rounded-full px-3.5 py-2 transition-colors ${isActive ? "bg-[#fff4ec] text-[#e05c0a]" : "hover:bg-[#fff4ec] text-gray-700 hover:text-[#e05c0a]"}`, onClick: onNavigate, children: "Kids" }), _jsx(NavLink, { to: "/parent-login", className: ({ isActive }) => `inline-flex items-center rounded-full px-3.5 py-2 transition-colors ${isActive ? "bg-[#fff4ec] text-[#e05c0a]" : "hover:bg-[#fff4ec] text-gray-700 hover:text-[#e05c0a]"}`, onClick: onNavigate, children: "Parents" }), _jsxs("div", { className: "relative", ref: coursesRef, children: [_jsxs("button", { type: "button", className: "inline-flex items-center gap-1 rounded-full px-3.5 py-2 transition-colors hover:bg-[#fff4ec] hover:text-[#e05c0a]", onClick: () => setCoursesOpen((v) => !v), "aria-expanded": coursesOpen, "aria-haspopup": "menu", children: ["Courses", _jsx("svg", { width: "16", height: "16", viewBox: "0 0 20 20", className: "opacity-70", children: _jsx("path", { fill: "currentColor", d: "M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" }) })] }), coursesOpen && (_jsx("div", { className: "absolute left-0 mt-3 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl p-2", role: "menu", children: courseLinks.map((l) => (_jsx(NavLink, { to: l.to, className: ({ isActive }) => `block rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? "bg-[#fff3ec] text-[#e05c0a]" : "text-gray-800 hover:bg-gray-50"}`, role: "menuitem", onClick: onNavigate, children: l.label }, l.label))) }))] }), _jsx(NavLink, { to: "/curriculum", className: ({ isActive }) => `inline-flex items-center rounded-full px-3.5 py-2 transition-colors ${isActive ? "bg-[#fff4ec] text-[#e05c0a]" : "hover:bg-[#fff4ec] text-gray-700 hover:text-[#e05c0a]"}`, onClick: onNavigate, children: "Curriculum" }), _jsx(NavLink, { to: "/blog", className: ({ isActive }) => `inline-flex items-center rounded-full px-3.5 py-2 transition-colors ${isActive ? "bg-[#fff4ec] text-[#e05c0a]" : "hover:bg-[#fff4ec] text-gray-700 hover:text-[#e05c0a]"}`, onClick: onNavigate, children: "Blog" }), _jsx(NavLink, { to: "/faq", className: ({ isActive }) => `inline-flex items-center rounded-full px-3.5 py-2 transition-colors ${isActive ? "bg-[#fff4ec] text-[#e05c0a]" : "hover:bg-[#fff4ec] text-gray-700 hover:text-[#e05c0a]"}`, onClick: onNavigate, children: "FAQ" }), _jsxs("div", { className: "relative", ref: educatorsRef, children: [_jsxs("button", { type: "button", className: "inline-flex items-center gap-1 rounded-full px-3.5 py-2 transition-colors hover:bg-[#fff4ec] hover:text-[#e05c0a]", onClick: () => setEducatorsOpen((v) => !v), "aria-expanded": educatorsOpen, "aria-haspopup": "menu", children: ["Educators", _jsx("svg", { width: "16", height: "16", viewBox: "0 0 20 20", className: "opacity-70", children: _jsx("path", { fill: "currentColor", d: "M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" }) })] }), educatorsOpen && (_jsxs("div", { className: "absolute left-0 mt-3 w-60 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl", role: "menu", children: [_jsx(Link, { to: "/login/teachers", className: "block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50", onClick: onNavigate, children: "Teacher login" }), _jsx(Link, { to: "/login/learning-partners", className: "mt-1 block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50", onClick: onNavigate, children: "Learning Partner login" })] }))] }), _jsx(Link, { to: "/#book-trial", className: "ml-2 inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-[#ff8a4c]/40 transition hover:-translate-y-0.5", style: { backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }, onClick: onNavigate, children: "Book Trial" })] }), _jsx("button", { className: "ml-auto rounded-xl border border-gray-200 p-2 text-xl text-gray-700 lg:hidden", "aria-label": "Menu", onClick: () => setMobileOpen((v) => !v), children: "\u2630" })] }), mobileOpen && (_jsx("div", { className: "md:hidden border-t border-gray-100", children: _jsxs("nav", { className: "mx-auto max-w-6xl px-4 py-3 grid gap-2", "aria-label": "Mobile", children: [_jsx(Link, { to: "/kids", className: "py-2 text-gray-700 border-b last:border-0", onClick: onNavigate, children: "Kids" }), _jsx(Link, { to: "/parent-login", className: "py-2 text-gray-700 border-b last:border-0", onClick: onNavigate, children: "Parents" }), _jsxs("details", { children: [_jsx("summary", { className: "cursor-pointer font-semibold text-gray-800", children: "Courses" }), _jsx("div", { className: "mt-2 grid", children: courseLinks.map((l) => (_jsx(Link, { to: l.to, className: "py-2 text-gray-700 border-b last:border-0", onClick: onNavigate, children: l.label }, l.label))) })] }), _jsx(Link, { to: "/curriculum", className: "py-2 text-gray-700 border-b last:border-0", onClick: onNavigate, children: "Curriculum" }), _jsx(Link, { to: "/blog", className: "py-2 text-gray-700 border-b last:border-0", onClick: onNavigate, children: "Blog" }), _jsx(Link, { to: "/faq", className: "py-2 text-gray-700 border-b last:border-0", onClick: onNavigate, children: "FAQ" }), _jsxs("details", { children: [_jsx("summary", { className: "cursor-pointer font-semibold text-gray-800", children: "Educators" }), _jsxs("div", { className: "mt-2 grid", children: [_jsx(Link, { to: "/login/teachers", className: "py-2 text-gray-700 border-b last:border-0", onClick: onNavigate, children: "Teacher login" }), _jsx(Link, { to: "/login/learning-partners", className: "py-2 text-gray-700 border-b last:border-0", onClick: onNavigate, children: "Learning Partner login" })] })] }), _jsx("div", { className: "flex gap-3 pt-2", children: _jsx(Link, { to: "/#book-trial", className: "flex-1 text-center rounded-full px-4 py-2 text-white font-extrabold", style: { backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }, onClick: onNavigate, children: "Book Trial" }) })] }) }))] }));
}
//# sourceMappingURL=Header.js.map