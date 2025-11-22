import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// React default import removed (not needed with new JSX transform)
import { useAuthStore } from '../../store/useAuthStore';
const socialLinks = [
    { label: 'Instagram', href: 'https://instagram.com', icon: '📸' },
    { label: 'YouTube', href: 'https://youtube.com', icon: '▶️' },
    { label: 'LinkedIn', href: 'https://linkedin.com', icon: '💼' }
];
const courseLinks = [
    { label: 'Phonics Foundation', href: '/courses/phonics-foundation' },
    { label: 'Phonics Advanced', href: '/courses/phonics-advanced' },
    { label: 'Grammar Essentials', href: '/courses/grammar-essentials' },
    { label: 'Grammar Mastery', href: '/courses/grammar-mastery' },
    { label: 'Public Speaking Foundations', href: '/courses/public-speaking-foundations' },
    { label: 'Public Speaking Excellence', href: '/courses/public-speaking-excellence' }
];
const resourceLinks = [
    { label: 'Curriculum', href: '/curriculum' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' }
];
const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund & Guarantee', href: '/guarantee' }
];
const Footer = () => {
    const { user } = useAuthStore();
    return (_jsx("footer", { className: "bg-[#060a16] text-gray-200", children: _jsxs("div", { className: "mx-auto max-w-6xl px-6 py-12 space-y-10", children: [_jsx("div", { className: "rounded-3xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 p-6 shadow-2xl", children: _jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-white text-xl font-semibold", children: "Get the Tiny Steps parent newsletter" }), _jsx("p", { className: "text-white/80 text-sm", children: "Weekly phonics, grammar, and speaking tips plus printable resources." })] }), _jsxs("form", { className: "flex w-full max-w-md gap-2", children: [_jsx("input", { className: "flex-1 rounded-xl px-4 py-2 text-gray-900", placeholder: "Email address" }), _jsx("button", { className: "rounded-xl bg-white/90 px-4 py-2 text-tiny-blue-700 font-semibold", children: "Subscribe" })] })] }) }), _jsxs("div", { className: "grid gap-8 md:grid-cols-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-10 w-10 rounded-full bg-gradient-to-br from-tiny-blue-500 to-tiny-purple-500 flex items-center justify-center font-bold", children: "TS" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-white", children: "Tiny Steps \u2022 Foundations Forever" }), _jsx("p", { className: "text-xs text-white/70", children: "Hyderabad \u2022 Serving families PAN India" })] })] }), _jsx("p", { className: "mt-4 text-sm text-white/80", children: "Live 1:1 phonics, grammar, and public speaking programs for ages 3\u201312. 3500+ families across 8 countries, 95% satisfaction. Foundations today, confidence forever." }), _jsx("div", { className: "mt-4 flex gap-4", children: socialLinks.map((link) => (_jsx("a", { href: link.href, className: "text-white/70 hover:text-white transition", "aria-label": link.label, children: link.icon }, link.label))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-white mb-3", children: "Courses" }), _jsx("ul", { className: "space-y-2 text-sm", children: courseLinks.map((link) => (_jsx("li", { children: _jsx("a", { href: link.href, className: "hover:text-tiny-blue-300 transition", children: link.label }) }, link.label))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-white mb-3", children: "Explore" }), _jsx("ul", { className: "space-y-2 text-sm", children: resourceLinks.map((link) => (_jsx("li", { children: _jsx("a", { href: link.href, className: "hover:text-tiny-blue-300 transition", children: link.label }) }, link.label))) }), _jsx("h3", { className: "font-semibold text-white mt-6 mb-3", children: "Legal" }), _jsx("ul", { className: "space-y-2 text-sm", children: legalLinks.map((link) => (_jsx("li", { children: _jsx("a", { href: link.href, className: "hover:text-tiny-blue-300 transition", children: link.label }) }, link.label))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-white mb-3", children: "Contact" }), _jsxs("ul", { className: "space-y-2 text-sm", children: [_jsx("li", { children: _jsx("a", { href: "tel:+919618398383", className: "hover:text-tiny-green-300 transition", children: "Call: +91-96183-98383" }) }), !user && (_jsx("li", { children: _jsx("a", { href: "https://wa.me/919618398383", className: "hover:text-tiny-green-300 transition", children: "WhatsApp: Chat with advisor" }) })), _jsx("li", { children: _jsx("a", { href: "mailto:hello@tinystepslearning.com", className: "hover:text-tiny-blue-300 transition", children: "Email: hello@tinystepslearning.com" }) }), _jsx("li", { className: "text-xs text-white/60", children: "Hours: Mon\u2013Fri 9 AM\u20136 PM \u2022 Sat 10 AM\u20132 PM" })] }), _jsx("p", { className: "text-xs text-white/60 mt-4", children: "Made with \u2764\uFE0F in India" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80", children: [_jsx("span", { children: "\uD83D\uDD12 SSL Secure" }), _jsx("span", { children: "\uD83D\uDCB3 UPI / Cards / Netbanking" }), _jsx("span", { children: "\uD83D\uDEE1\uFE0F Data protection compliant" }), _jsx("span", { children: "\u2705 Satisfaction guarantee" })] }), _jsxs("div", { className: "text-center text-xs text-white/70", children: ["\u00A9 ", new Date().getFullYear(), " Tiny Steps Online School. Built for joyful learning in India."] })] }) }));
};
export default Footer;
