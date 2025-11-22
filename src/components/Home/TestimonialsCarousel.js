import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
const testimonials = [
    {
        name: 'Anita Rao',
        city: 'Bengaluru',
        age: 'Child: 5 years',
        quote: "Within 3 months, Kavya is decoding storybooks confidently and loves sharing them at bedtime.",
        video: '/images/hero/parent-video-1.jpg'
    },
    {
        name: 'Siddharth & Nisha',
        city: 'Ahmedabad',
        age: 'Child: 6 years',
        quote: 'The SATPIN playbooks turned phonics into a game. He now blends new words on his own.',
        video: '/images/hero/parent-video-2.jpg'
    },
    {
        name: 'Parent Name',
        city: 'Pune',
        age: 'Child: 8 years',
        quote: 'Grammar is no longer a mystery—our weekend writing tasks are full paragraphs now.',
        video: '/images/hero/parent-video-3.jpg'
    }
];
const Badge = ({ label }) => (_jsx("span", { className: "rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 bg-white/70", children: label }));
export default function TestimonialsCarousel() {
    const [active, setActive] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setActive((prev) => (prev + 1) % testimonials.length), 6000);
        return () => clearInterval(id);
    }, []);
    const testimonial = testimonials[active];
    return (_jsx("section", { className: "relative py-16", children: _jsxs("div", { className: "mx-auto max-w-6xl px-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "gradient-chip mx-auto w-max", children: "Real Families, Real Results" }), _jsx("h2", { className: "mt-2 text-3xl font-semibold text-gray-900", children: "Parent Testimonial Carousel" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Five-star stories from across India." })] }), _jsxs("div", { className: "mt-10 grid items-center gap-6 lg:grid-cols-[1fr_auto]", children: [_jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.6 }, className: "rounded-3xl bg-white/90 p-8 shadow-2xl border border-gray-100", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "h-12 w-12 rounded-full bg-gradient-to-br from-tiny-blue-500 to-tiny-purple-500" }), _jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold text-gray-900", children: testimonial.name }), _jsx("div", { className: "text-sm text-gray-500", children: testimonial.city })] }), _jsx("div", { className: "ml-auto text-xs text-gray-600", children: testimonial.age })] }), _jsxs("div", { className: "mt-4 text-gray-700 leading-relaxed", children: ["\u201C", testimonial.quote, "\u201D"] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsx(Badge, { label: "Live Coaching" }), _jsx(Badge, { label: "Parent-recommended" }), _jsx(Badge, { label: "\u2605\u2605\u2605\u2605\u2605" })] })] }, testimonial.name) }), _jsxs(motion.div, { className: "relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-tiny-purple-500 to-tiny-blue-500 p-1 shadow-xl", whileHover: { scale: 1.02 }, transition: { type: 'spring', stiffness: 260 }, children: [_jsx("img", { src: testimonial.video, alt: "Video testimonial", className: "h-64 w-full object-cover brightness-90" }), _jsx(motion.button, { className: "absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg", whileHover: { scale: 1.1 }, children: _jsx("span", { className: "text-2xl", children: "\u25B6" }) })] })] }), _jsxs("div", { className: "mt-6 flex justify-between", children: [_jsx("button", { className: "text-sm font-semibold text-gray-600 hover:text-gray-900", onClick: () => setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length), children: "Previous" }), _jsx("button", { className: "text-sm font-semibold text-gray-600 hover:text-gray-900", onClick: () => setActive((prev) => (prev + 1) % testimonials.length), children: "Next" })] })] }) }));
}
