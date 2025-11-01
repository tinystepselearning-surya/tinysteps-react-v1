import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const accents = {
    orange: "bg-orange-50 border-orange-200",
    teal: "bg-teal-50 border-teal-200",
    violet: "bg-violet-50 border-violet-200",
    indigo: "bg-indigo-50 border-indigo-200",
};
export default function PricingCard({ title, price, period = "/ month", blurb, features, ctaText, ctaHref, accent = "indigo", }) {
    return (_jsxs("div", { className: `rounded-2xl border p-6 shadow-sm ${accents[accent]}`, children: [_jsx("h3", { className: "text-2xl font-bold", children: title }), _jsxs("div", { className: "mt-3 text-3xl font-extrabold", children: [price, " ", _jsx("span", { className: "text-base font-semibold text-gray-600", children: period })] }), blurb && _jsx("p", { className: "mt-2 text-gray-700", children: blurb }), _jsx("ul", { className: "mt-4 space-y-2 text-gray-800", children: features.map((f, i) => (_jsxs("li", { className: "flex gap-2", children: [_jsx("span", { className: "mt-1", children: "\u2705" }), _jsx("span", { children: f })] }, i))) }), _jsx("a", { href: ctaHref, className: "mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition", children: ctaText })] }));
}
//# sourceMappingURL=PricingCard.js.map