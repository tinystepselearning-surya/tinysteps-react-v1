var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
import { useNavigate, Link, useLocation } from 'react-router-dom';
export default function Header() {
    const { user, clearUser } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const scrollRef = useRef(0);
    const moreMenuRef = useRef(null);
    const primaryLinks = [
        { label: 'Courses', href: '/courses' },
        { label: 'Curriculum', href: '/curriculum' },
        { label: 'Blog', href: '/blog' },
        { label: 'Pricing', href: '/pricing' }
    ];
    const moreLinks = [
        { label: 'Teachers', href: '/teacher' },
        { label: 'Learning Partner', href: '/learning-partner' },
        { label: 'Kids', href: '/parent/kids' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact', href: '/contact' },
        { label: 'Parent', href: '/parent/login' },
    ];
    const ctaLink = { label: 'Why Tiny Steps', href: '/why-tiny-steps' };
    const dashboardPaths = {
        admin: '/surya',
        teacher: '/teacher',
        parent: '/parent',
        learningPartner: '/learning-partner',
        kid: '/parent/kids',
    };
    const isHomePage = location.pathname === '/';
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setShowMore(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            if (isHomePage) {
                setIsSticky(current > 50);
            }
            else {
                setIsSticky(true);
            }
            scrollRef.current = current;
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHomePage]);
    const handleLogout = () => __awaiter(this, void 0, void 0, function* () {
        // sign out of firebase as well
        try {
            yield signOut(auth);
        }
        catch (err) {
            // ignore firebase signout error (we still clear local state)
            console.error('Error signing out of Firebase', err);
        }
        // capture role first
        const currentRole = user === null || user === void 0 ? void 0 : user.role;
        clearUser();
        const loginMap = {
            admin: '/surya/login',
            teacher: '/teacher/login',
            parent: '/parent/login',
            learningPartner: '/learning-partner/login',
            kid: '/parent/login',
        };
        const destination = currentRole ? (loginMap[currentRole] || '/login') : '/login';
        navigate(destination);
    });
    const navbarVariants = {
        hidden: { opacity: 0, y: -12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
    };
    return (_jsxs(motion.nav, { initial: "hidden", animate: "visible", variants: navbarVariants, className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isSticky ? 'bg-white/85 backdrop-blur-lg shadow-[0_15px_35px_rgba(8,15,40,0.12)]' : 'bg-transparent'}`, children: [_jsxs("div", { className: "mx-auto flex max-w-6xl items-center justify-between px-4 py-4", children: [_jsxs(motion.div, { className: "flex cursor-pointer items-center gap-2", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => navigate('/'), children: [_jsx("img", { src: "/logo.png", alt: "Tiny Steps Logo", className: "h-11 w-11 object-contain" }), _jsxs("div", { children: [_jsx("div", { className: "font-bold text-gray-900", children: "Tiny Steps" }), _jsx("div", { className: "text-[11px] uppercase tracking-[0.3em] text-gray-500", children: "Foundations Forever" })] })] }), _jsxs("div", { className: "hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-700", children: [primaryLinks.map((link) => (_jsx(Link, { to: link.href, className: "hover:text-tiny-blue-600 transition-colors", children: link.label }, link.href))), _jsxs("div", { className: "relative", ref: moreMenuRef, onMouseEnter: () => setShowMore(true), children: [_jsx("button", { type: "button", className: "flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-tiny-blue-600", onClick: (event) => {
                                            event.preventDefault();
                                            setShowMore((prev) => !prev);
                                        }, onFocus: () => setShowMore(true), children: "More \u25BE" }), showMore && (_jsx("div", { className: "absolute left-0 mt-3 w-56 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-2xl backdrop-blur", children: _jsxs("div", { className: "flex flex-col gap-2 text-sm text-gray-700", children: [moreLinks.map((link) => (_jsx(Link, { to: link.href, className: "hover:text-tiny-blue-600", onClick: () => setShowMore(false), children: link.label }, link.href))), user && (_jsx(Link, { to: dashboardPaths[user.role] || `/${user.role}`, className: "hover:text-tiny-blue-600", onClick: () => setShowMore(false), children: "Dashboard" }))] }) }))] }), _jsx(Link, { to: ctaLink.href, className: "ml-4 inline-flex items-center rounded-full bg-gradient-to-r from-[#0f172a] via-[#2563eb] to-[#7c3aed] px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(15,23,42,0.35)] transition hover:shadow-[0_20px_40px_rgba(37,99,235,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500", children: ctaLink.label })] }), _jsxs("div", { className: "hidden md:flex items-center gap-4", children: [!user && (_jsx("a", { href: "https://wa.me/919618398383", className: "flex items-center gap-2 rounded-full border border-tiny-green-200/70 bg-white/80 px-4 py-1.5 text-sm font-semibold text-tiny-green-700 shadow-sm", children: "\uD83D\uDCAC +91 96183 98383" })), _jsx("button", { onClick: () => { var _a; return (_a = document.getElementById('book-trial')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' }); }, className: "rounded-full bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(255,143,92,0.35)]", children: "Book Free Trial" })] }), _jsxs("div", { className: "flex items-center gap-3 lg:hidden", children: [_jsx("button", { onClick: () => { var _a; return (_a = document.getElementById('book-trial')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' }); }, className: "rounded-full bg-gradient-to-r from-[#ff8f5c] to-[#59c3ff] px-4 py-2 text-xs font-semibold text-white", children: "Book Trial" }), _jsx(motion.button, { onClick: () => setIsOpen(!isOpen), className: "flex flex-col gap-1", children: [0, 1, 2].map((line) => (_jsx(motion.div, { className: "h-0.5 w-6 bg-gray-900", animate: {
                                        rotate: isOpen ? (line === 0 ? 45 : line === 2 ? -45 : 0) : 0,
                                        y: isOpen ? (line === 0 ? 6 : line === 2 ? -6 : 0) : 0,
                                        opacity: isOpen && line === 1 ? 0 : 1,
                                    }, transition: { duration: 0.3 } }, line))) })] })] }), _jsx(motion.div, { initial: { height: 0 }, animate: { height: isOpen ? 'auto' : 0 }, className: "md:hidden overflow-hidden bg-white/95 backdrop-blur", children: _jsxs("div", { className: "space-y-4 px-5 py-6 text-sm font-semibold text-gray-700", children: [primaryLinks.concat(moreLinks).map((link) => (_jsx(Link, { to: link.href, onClick: () => setIsOpen(false), className: "block", children: link.label }, link.href))), _jsx(Link, { to: ctaLink.href, onClick: () => setIsOpen(false), className: "mt-2 block rounded-full bg-gradient-to-r from-[#0f172a] via-[#2563eb] to-[#7c3aed] px-5 py-2 text-center font-semibold text-white shadow-md", children: ctaLink.label }), user ? (_jsx("button", { className: "text-left text-red-600", onClick: () => { handleLogout(); setIsOpen(false); }, children: "Logout" })) : (_jsx("button", { className: "text-left", onClick: () => { navigate('/login'); setIsOpen(false); }, children: "Sign in" })), !user && (_jsx("a", { href: "https://wa.me/919618398383", className: "block text-tiny-green-700", children: "WhatsApp: +91 96183 98383" }))] }) })] }));
}
