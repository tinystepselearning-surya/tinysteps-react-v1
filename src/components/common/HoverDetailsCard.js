import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { cn } from '../lib/utils';
export const HoverDetailsCard = ({ header, preview, details, className }) => {
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { className: cn('rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 transition-all hover:shadow-2xl', className), onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false), children: [_jsxs("div", { className: "p-6", children: [_jsx("div", { className: "mb-4 text-lg font-semibold text-gray-900", children: header }), _jsx("div", { className: "text-sm text-gray-700", children: preview })] }), _jsx("div", { className: cn('hover-details-body px-6 pb-6', open ? 'open' : ''), children: _jsx("div", { className: "text-sm text-gray-800", children: details }) })] }));
};
