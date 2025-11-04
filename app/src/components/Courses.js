import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useScrollReveal } from "../hooks/useScrollReveal";
const courses = [
    {
        img: "/assets/images/phonics.jpg",
        h: "Phonics Foundations",
        p: "Sound, blend, and read through play and songs.",
        href: "/main/courses/phonics/",
    },
    {
        img: "/assets/images/grammar.jpg",
        h: "Grammar & Writing",
        p: "Creative writing and grammar made fun and interactive.",
        href: "/main/courses/grammar/",
    },
    {
        img: "/assets/images/speaking.jpg",
        h: "Public Speaking",
        p: "Build stage presence, confidence, and clarity in speech.",
        href: "/main/courses/public-speaking/",
    },
];
export default function Courses() {
    const sectionRef = useScrollReveal({ variant: "up" });
    return (_jsxs("section", { ref: sectionRef, id: "kids", className: "mx-auto max-w-6xl px-4 my-16 text-center", children: [_jsxs("div", { className: "mx-auto max-w-2xl", children: [_jsx("h2", { "data-reveal-child": true, className: "text-[#e05c0a] text-2xl md:text-3xl font-extrabold", children: "Explore Our Programs" }), _jsx("p", { "data-reveal-child": true, style: { "--reveal-child-delay": "80ms" }, className: "text-gray-600 mt-1", children: "Short, playful lessons that make learning joyful and meaningful." })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-5 mt-8", children: courses.map((c, idx) => (_jsxs("article", { "data-reveal-child": true, style: { "--reveal-child-delay": `${180 + idx * 90}ms` }, className: "relative h-72 rounded-2xl overflow-hidden shadow", children: [_jsx("img", { src: c.img, alt: "", className: "absolute inset-0 h-full w-full object-cover" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" }), _jsxs("div", { className: "absolute inset-0 p-4 mt-auto flex flex-col justify-end text-left text-white", children: [_jsx("h3", { className: "text-xl font-extrabold", children: c.h }), _jsx("p", { className: "text-white/90 text-sm mt-1", children: c.p }), _jsx("a", { href: c.href, className: "inline-block mt-2 px-3 py-2 rounded-full text-sm font-extrabold bg-white/90 text-gray-900", children: "Learn More" })] })] }, c.h))) })] }));
}
//# sourceMappingURL=Courses.js.map