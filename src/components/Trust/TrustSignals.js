import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const StatCard = ({ value, label }) => (
    _jsxs(motion.div, {
        whileHover: { scale: 1.03, y: -4 },
        transition: { type: 'spring', stiffness: 280 },
        className: "rounded-2xl bg-gradient-to-br from-tiny-blue-50 via-white to-tiny-purple-50 p-6 shadow-lg shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 border border-gray-100",
        children: [
            _jsx("div", { className: "text-3xl font-extrabold text-gray-900 tracking-tight", children: value }),
            _jsx("div", { className: "mt-1 text-sm text-gray-600", children: label })
        ]
    })
);

const Testimonial = ({ name, city, text }) => (
    _jsxs(motion.div, {
        whileHover: { scale: 1.02 },
        className: "rounded-2xl bg-white/80 backdrop-blur p-5 border border-gray-100 shadow-lg",
        children: [
            _jsxs("div", {
                className: "flex items-center gap-3",
                children: [
                    _jsx("div", { className: "h-10 w-10 rounded-full bg-gradient-to-br from-tiny-blue-500 to-tiny-purple-500 ring-2 ring-white" }),
                    _jsxs("div", {
                        children: [
                            _jsx("div", { className: "text-sm font-semibold text-gray-900", children: name }),
                            _jsx("div", { className: "text-xs text-gray-600", children: city })
                        ]
                    }),
                    _jsx("div", { className: "ml-auto text-tiny-orange-600", children: "★★★★★" })
                ]
            }),
            _jsx("p", { className: "mt-3 text-sm text-gray-700", children: text })
        ]
    })
);

const TeacherCard = ({ name, role, quals }) => (
    _jsxs(motion.div, {
        whileHover: { scale: 1.02, rotateX: 1, rotateY: -1 },
        className: "rounded-2xl p-5 bg-white shadow-neumorphic border border-gray-100",
        children: [
            _jsxs("div", {
                className: "flex items-center gap-4",
                children: [
                    _jsx("div", { className: "h-12 w-12 rounded-full bg-gradient-to-br from-tiny-purple-500 to-tiny-blue-500" }),
                    _jsxs("div", {
                        children: [
                            _jsx("div", { className: "font-semibold text-gray-900", children: name }),
                            _jsx("div", { className: "text-xs text-gray-600", children: role })
                        ]
                    })
                ]
            }),
            _jsx("div", { className: "mt-3 text-xs text-gray-700", children: quals })
        ]
    })
);

export default function TrustSignals() {
    const [expanded, setExpanded] = useState(false);

    return (
        _jsx("section", {
            "data-animate": "fade-up",
            className: "relative py-14",
            children: _jsxs("div", {
                className: "mx-auto max-w-6xl px-6",
                children: [
                    _jsxs("div", {
                        className: "text-center",
                        children: [
                            _jsx("div", { className: "gradient-chip mx-auto w-max", children: "Why Parents Trust Us" }),
                            _jsx("h2", { className: "mt-2 text-2xl font-bold text-gray-900 md:text-3xl", children: "Proof, Not Promises" }),
                            _jsx("p", { className: "mt-2 text-gray-700", children: "Tap to scan the outcomes, testimonials, and mentor credentials that back Tiny Steps." }),
                            _jsxs("button", {
                                type: "button",
                                onClick: () => setExpanded((prev) => !prev),
                                className: "mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-5 py-2 text-sm font-semibold text-gray-800 shadow-sm",
                                children: [
                                    expanded ? 'Hide detailed proof' : 'View detailed proof',
                                    _jsx("span", {
                                        className: `transition-transform ${expanded ? 'rotate-180' : ''}`,
                                        children: "▼"
                                    })
                                ]
                            })
                        ]
                    }),
                    _jsx(AnimatePresence, {
                        initial: false,
                        children: expanded && (
                            _jsxs(motion.div, {
                                initial: { opacity: 0, y: -12 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, y: -12 },
                                transition: { duration: 0.3 },
                                children: [
                                    _jsxs("div", {
                                        className: "mt-8 grid gap-4 sm:grid-cols-3",
                                        children: [
                                            _jsx(StatCard, { value: "3500+", label: "Students taught worldwide" }),
                                            _jsx(StatCard, { value: "95%", label: "Parent satisfaction" }),
                                            _jsx(StatCard, { value: "9+", label: "Countries (IN, US, UK, CA, SG, MY, VN, UAE, AU)" })
                                        ]
                                    }),
                                    _jsxs("div", {
                                        className: "mt-8 grid gap-3 sm:grid-cols-3",
                                        children: [
                                            _jsxs("div", {
                                                className: "rounded-2xl bg-white/80 backdrop-blur p-4 border border-gray-100 text-sm text-gray-700 flex items-center gap-3",
                                                children: [
                                                    _jsx("span", {
                                                        className: "h-8 w-8 rounded-full bg-tiny-green-500/20 text-tiny-green-600 grid place-items-center",
                                                        children: "🔒"
                                                    }),
                                                    "SSL secure • Safe payments"
                                                ]
                                            }),
                                            _jsxs("div", {
                                                className: "rounded-2xl bg-white/80 backdrop-blur p-4 border border-gray-100 text-sm text-gray-700 flex items-center gap-3",
                                                children: [
                                                    _jsx("span", {
                                                        className: "h-8 w-8 rounded-full bg-tiny-purple-500/20 text-tiny-purple-600 grid place-items-center",
                                                        children: "🤖"
                                                    }),
                                                    "AI-curated lessons + parent insight reports"
                                                ]
                                            }),
                                            _jsxs("div", {
                                                className: "rounded-2xl bg-white/80 backdrop-blur p-4 border border-gray-100 text-sm text-gray-700 flex items-center gap-3",
                                                children: [
                                                    _jsx("span", {
                                                        className: "h-8 w-8 rounded-full bg-tiny-orange-500/20 text-tiny-orange-600 grid place-items-center",
                                                        children: "✅"
                                                    }),
                                                    "Refund policy • Transparent terms"
                                                ]
                                            })
                                        ]
                                    }),
                                    _jsxs("div", {
                                        className: "mt-10 grid gap-4 md:grid-cols-3",
                                        children: [
                                            _jsx(Testimonial, { name: "Anita Rao", city: "Bengaluru", text: "My daughter's reading improved 40% in 3 months." }),
                                            _jsx(Testimonial, { name: "S. Patel", city: "Ahmedabad", text: "SATPIN routine made reading feel like playtime." }),
                                            _jsx(Testimonial, { name: "R. Sharma", city: "Pune", text: "Grammar finally clicked, writing is clear now." })
                                        ]
                                    }),
                                    _jsxs("div", {
                                        className: "mt-10 grid gap-4 md:grid-cols-3",
                                        children: [
                                            _jsx(TeacherCard, { name: "Dr. Meera Iyer", role: "Lead Phonics", quals: "Cambridge Phonics Cert • 7 yrs" }),
                                            _jsx(TeacherCard, { name: "Mr. Arjun Desai", role: "Grammar", quals: "MA Eng • 8 yrs" }),
                                            _jsx(TeacherCard, { name: "Ms. Neha", role: "Public Speaking", quals: "CELTA • 6 yrs" })
                                        ]
                                    }),
                                    _jsxs("div", {
                                        className: "mt-10 rounded-2xl border border-gray-100 bg-white/80 backdrop-blur p-4 text-xs text-gray-600 flex flex-wrap items-center justify-center gap-4",
                                        children: [
                                            _jsxs("span", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    _jsx("span", { children: "🔒" }),
                                                    "SSL"
                                                ]
                                            }),
                                            _jsxs("span", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    _jsx("span", { children: "💳" }),
                                                    "UPI / Cards / Netbanking"
                                                ]
                                            }),
                                            _jsxs("span", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    _jsx("span", { children: "🛡️" }),
                                                    "Data protection"
                                                ]
                                            }),
                                            _jsxs("span", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    _jsx("span", { children: "⭐" }),
                                                    "100% Parent Satisfaction"
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        )
                    })
                ]
            })
        })
    );
}
