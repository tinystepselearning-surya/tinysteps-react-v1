import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const stats = [
    { label: '3500+ students', detail: 'India • US • UK • Canada • Singapore • Malaysia • Vietnam • UAE • Australia' },
    { label: '95% parent satisfaction', detail: 'Weekly AI insights + mentor calls' },
    { label: 'AI-driven curriculum', detail: 'Personalised learning path + dashboard' }
];
export default function StatsStrip() {
    return (_jsx("section", { "data-animate": "fade-up", className: "bg-white/80 px-6 py-6", children: _jsx("div", { className: "mx-auto grid max-w-6xl gap-4 rounded-3xl border border-orange-100 bg-gradient-to-r from-[#fff1cc] via-white to-[#cfe9ff] p-6 text-sm font-semibold text-gray-800 md:grid-cols-3", children: stats.map((stat, index) => (_jsxs("div", { "data-animate": "fade-up", "data-animate-delay": `${index * 0.05}s`, children: [_jsx("div", { className: "text-lg text-gray-900", children: stat.label }), _jsx("div", { className: "text-xs text-gray-600", children: stat.detail })] }, stat.label))) }) }));
}
