import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useState } from 'react';
const LevelTabs = ({ levels }) => {
    const [active, setActive] = useState(levels[0]);
    return (_jsx("section", { className: "px-6 py-12", children: _jsxs("div", { className: "mx-auto max-w-5xl rounded-3xl bg-white/90 p-6 shadow-card-hover", children: [_jsx("div", { className: "flex flex-wrap gap-3", children: levels.map((level) => (_jsx("button", { onClick: () => setActive(level), className: `rounded-full px-4 py-2 text-sm font-semibold transition ${active.name === level.name ? 'bg-gradient-to-r from-[#ff8f5c] to-[#59c3ff] text-white' : 'bg-gray-100 text-gray-700'}`, children: level.name }, level.name))) }), _jsxs("div", { className: "mt-6 grid gap-4 md:grid-cols-2", children: [_jsx("ul", { className: "space-y-2 text-sm text-gray-700", children: active.outcomes.map((item) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { children: "\u2705" }), item] }, item))) }), _jsxs("div", { className: "rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600", children: [_jsx("div", { className: "font-semibold text-gray-900", children: "Download curriculum" }), _jsxs("p", { children: ["Get the full weekly plan for ", active.name, ". Includes home practice + assessments."] }), _jsx("a", { href: active.pdf || '/curriculum', className: "mt-2 inline-flex items-center text-tiny-blue-600", children: "Download PDF \u2192" })] })] })] }) }));
};
export default LevelTabs;
