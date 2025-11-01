import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const steps = [
    {
        title: "Book a free trial",
        description: "Pick a slot and share details about your child’s goals.",
        icon: "🗓️",
    },
    {
        title: "Meet your teacher",
        description: "Experience a live class and receive a personalised roadmap within 24 hours.",
        icon: "🎓",
    },
    {
        title: "Weekly digital practice",
        description: "Receive interactive worksheets, Wordwall games, and joyful home tasks.",
        icon: "💻",
    },
    {
        title: "Track progress",
        description: "Monitor dashboards, 5-star ratings, and video clips after every class.",
        icon: "📊",
    },
];
export default function HowItWorks() {
    return (_jsx("section", { className: "bg-white py-16", id: "how-it-works", children: _jsxs("div", { className: "mx-auto max-w-6xl px-4", children: [_jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-[#7c3aed]", children: "How it works" }), _jsx("h2", { className: "mt-2 text-3xl md:text-4xl font-black text-[#0f172a]", children: "A clear path from trial to transformation" }), _jsx("p", { className: "mt-3 text-lg text-gray-600", children: "Parents know exactly what happens next\u2014no surprises, just joyful learning with measurable outcomes." })] }), _jsx("div", { className: "mt-10 grid gap-6 md:grid-cols-4", children: steps.map((step, index) => (_jsxs("article", { className: "rounded-3xl border border-gray-100 bg-[#f9f7ff] p-6 text-center shadow-inner shadow-white", children: [_jsx("span", { className: "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl", children: step.icon }), _jsxs("p", { className: "mt-4 text-xs font-semibold uppercase tracking-[0.32em] text-[#7c3aed]", children: ["Step ", index + 1] }), _jsx("h3", { className: "mt-2 text-lg font-semibold text-[#0f172a]", children: step.title }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: step.description })] }, step.title))) })] }) }));
}
//# sourceMappingURL=HowItWorks.js.map