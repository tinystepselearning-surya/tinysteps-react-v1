import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function StatsBar() {
    const stats = [
        { label: "Students coached", value: "3,500+", description: "Across India & the Middle East" },
        { label: "Certified educators", value: "45+", description: "Cambridge CELTA • Jolly Phonics • Trinity" },
        { label: "Years of expertise", value: "12", description: "Blending literacy, writing & speaking" },
    ];
    return (_jsx("section", { className: "bg-gradient-to-r from-[#f5f0ff] via-[#f0f9ff] to-[#fff4ec] py-10", children: _jsx("div", { className: "mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between", children: stats.map((stat) => (_jsxs("div", { className: "rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-gray-200/60", children: [_jsx("p", { className: "text-3xl md:text-4xl font-black text-[#0f172a]", children: stat.value }), _jsx("p", { className: "mt-2 text-sm font-semibold uppercase tracking-[0.28em] text-[#7c3aed]", children: stat.label }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: stat.description })] }, stat.label))) }) }));
}
//# sourceMappingURL=StatsBar.js.map