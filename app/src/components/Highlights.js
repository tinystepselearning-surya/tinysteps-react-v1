import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const items = [
    { h: "Phonics", p: "SATPIN to long vowels and beyond." },
    { h: "Grammar", p: "From simple sentences to tenses." },
    { h: "Public Speaking", p: "Confidence, clarity, and expression." },
];
export default function Highlights() {
    return (_jsx("section", { className: "py-12 bg-white", children: _jsx("div", { className: "mx-auto max-w-7xl px-4 grid gap-6 md:grid-cols-3", children: items.map((x) => (_jsxs("article", { className: "rounded-3xl border border-gray-100 shadow-sm p-6 bg-white", children: [_jsx("h3", { className: "text-lg font-semibold", children: x.h }), _jsx("p", { className: "mt-2 text-gray-600", children: x.p }), _jsx("a", { href: "#", className: "mt-4 inline-block text-sm underline", children: "Learn more" })] }, x.h))) }) }));
}
//# sourceMappingURL=Highlights.js.map