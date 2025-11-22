import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
const bands = [
    { label: 'Not Started', min: 0, max: 20 },
    { label: 'Emerging', min: 21, max: 40 },
    { label: 'Developing', min: 41, max: 60 },
    { label: 'Proficient', min: 61, max: 80 },
    { label: 'Mastered', min: 81, max: 100 }
];
export const MasteryProgress = ({ percent, size = 100 }) => {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const band = bands.find((b) => clamped >= b.min && clamped <= b.max) || bands[0];
    const gradient = `conic-gradient(#10B981 ${clamped}%, #E5E7EB ${clamped}% 100%)`;
    return (_jsxs("div", { className: "inline-flex flex-col items-center text-center", children: [_jsx("div", { className: "grid place-items-center rounded-full", style: { width: size, height: size, background: gradient }, children: _jsx("div", { className: "grid place-items-center rounded-full bg-white", style: { width: size - 18, height: size - 18 }, children: _jsxs("div", { className: "text-sm font-semibold text-gray-900", children: [clamped, "%"] }) }) }), _jsx("div", { className: "mt-2 text-xs font-semibold text-gray-600 leading-tight", children: band.label })] }));
};
