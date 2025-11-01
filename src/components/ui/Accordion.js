import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function Accordion({ items }) {
    return (_jsx("div", { className: "divide-y rounded-2xl border overflow-hidden", children: items.map((it, i) => (_jsx(AccordionItem, { ...it }, i))) }));
}
function AccordionItem({ question, answer }) {
    const [open, setOpen] = useState(false);
    return (_jsxs("details", { className: "group", open: open, onToggle: (e) => setOpen(e.target.open), children: [_jsxs("summary", { className: "cursor-pointer select-none list-none px-5 py-4 flex items-center justify-between text-lg font-medium", children: [_jsx("span", { children: question }), _jsx("span", { className: "ml-4 text-gray-500 transition-transform group-open:rotate-180", children: "\u2304" })] }), _jsx("div", { className: "px-5 pb-5 text-gray-700", children: answer })] }));
}
//# sourceMappingURL=Accordion.js.map