import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useScrollReveal } from "../hooks/useScrollReveal";
const items = [
    {
        id: "01",
        img: "/assets/images/joyfullearning.jpg",
        h: "Joyful Learning",
        p: "Children thrive in an environment filled with stories, play, and creativity.",
        accent: { glow: "from-[#ff8a4c]/30 via-[#ff751f]/20 to-transparent", badge: "bg-[#ffefe6] text-[#e05c0a]" },
    },
    {
        id: "02",
        img: "/assets/images/onetoone.jpg",
        h: "One-to-One Guidance",
        p: "Personal attention helps every child feel seen, supported, and celebrated.",
        accent: { glow: "from-[#60a5fa]/25 via-[#a855f7]/25 to-transparent", badge: "bg-[#edf2ff] text-[#1d4ed8]" },
    },
    {
        id: "03",
        img: "/assets/images/professionalteachers.jpg",
        h: "Professional Teachers",
        p: "Certified educators bring patience, expertise, and warmth to every class.",
        accent: { glow: "from-[#34d399]/30 via-[#0f9d75]/25 to-transparent", badge: "bg-[#e6f9f1] text-[#047857]" },
    },
];
export default function Why() {
    const sectionRef = useScrollReveal({ variant: "up" });
    return (_jsxs("section", { ref: sectionRef, id: "why", className: "mx-auto max-w-6xl px-4 my-20", children: [_jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [_jsx("p", { "data-reveal-child": true, className: "uppercase tracking-[0.26em] text-sm md:text-base font-semibold text-[#7c3aed]", children: "Why Tiny Steps Works" }), _jsx("h2", { "data-reveal-child": true, style: { "--reveal-child-delay": "60ms" }, className: "mt-2 text-4xl md:text-5xl font-black text-gray-900 tracking-tight", children: "Purposeful teaching, playful classrooms, measurable progress" }), _jsx("p", { "data-reveal-child": true, style: { "--reveal-child-delay": "120ms" }, className: "mt-4 text-lg sm:text-xl text-gray-600 leading-relaxed", children: "Every Tiny Steps session blends research-backed pedagogy with joyful rituals so kids feel energised, parents stay informed, and communication skills grow term after term." })] }), _jsx("div", { className: "mt-12 grid gap-8 md:grid-cols-3", children: items.map((x, idx) => (_jsxs("article", { "data-reveal-child": true, style: { "--reveal-child-delay": `${160 + idx * 80}ms` }, className: "group relative isolate overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-xl shadow-gray-200/60 transition hover:-translate-y-2 hover:shadow-2xl", children: [_jsx("span", { "aria-hidden": true, className: `pointer-events-none absolute -top-20 left-1/2 h-44 w-[120%] -translate-x-1/2 rounded-full blur-3xl opacity-70 bg-gradient-to-br ${x.accent.glow}` }), _jsx("img", { src: x.img, alt: x.h, className: "h-48 w-full object-cover transition duration-700 group-hover:scale-105", loading: "lazy" }), _jsxs("div", { className: "relative flex h-full flex-col gap-4 p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: `inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${x.accent.badge}`, children: [_jsx("span", { className: "inline-flex h-2 w-2 rounded-full bg-current", "aria-hidden": true }), _jsx("span", { children: x.id })] }), _jsx("span", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-gray-300", children: "Learn" })] }), _jsx("h3", { className: "text-xl font-extrabold text-gray-900", children: x.h }), _jsx("p", { className: "text-gray-600 leading-relaxed", children: x.p }), _jsx("div", { className: "mt-auto pt-2 text-sm font-semibold text-[#e05c0a]/80 opacity-0 transition group-hover:opacity-100", children: "Tailored lesson plans \u00B7 Weekly parent updates" })] })] }, x.h))) })] }));
}
//# sourceMappingURL=Why.js.map