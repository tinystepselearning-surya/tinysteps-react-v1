import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { cn } from '../lib/utils';
// Performance-focused collapsible card: animates max-height (not height:auto),
// rotates chevron, and avoids page reflow jank.
export const CollapsibleCard = ({ title, subtext, icon, children, defaultOpen = false, className, cta }) => {
    const [open, setOpen] = useState(defaultOpen);
    const panelId = useId();
    return (_jsxs("div", { className: cn('group rounded-2xl bg-white/90 ring-1 ring-slate-200 transition-colors hover:bg-white shadow-sm hover:shadow-md', className), children: [_jsxs("button", { type: "button", className: "flex w-full items-center gap-3 px-5 py-4", "aria-expanded": open, "aria-controls": panelId, onClick: () => setOpen((v) => !v), children: [_jsx("div", { className: "text-xl", children: icon }), _jsxs("div", { className: "flex-1 text-left", children: [_jsx("div", { className: "text-base font-semibold text-gray-900", children: title }), subtext && _jsx("div", { className: "text-sm text-gray-600", children: subtext })] }), _jsx("span", { className: cn('inline-block transition-transform duration-300 text-gray-500', open ? 'rotate-180' : 'rotate-0'), children: "\u25BC" })] }), _jsxs("div", { id: panelId, className: cn('collapsible-body px-5 pb-4', open ? 'open' : ''), children: [_jsx("div", { className: "text-sm text-gray-700", children: children }), cta && _jsx("div", { className: "mt-3", children: cta })] })] }));
};
