import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
export const Carousel = ({ children, autoRotateMs = 5000, className }) => {
    const [index, setIndex] = useState(0);
    const containerRef = useRef(null);
    const total = children.length;
    useEffect(() => {
        const id = setInterval(() => setIndex((i) => (i + 1) % total), autoRotateMs);
        return () => clearInterval(id);
    }, [autoRotateMs, total]);
    const prev = () => setIndex((i) => (i - 1 + total) % total);
    const next = () => setIndex((i) => (i + 1) % total);
    return (_jsxs("div", { className: cn('relative overflow-hidden', className), children: [_jsx("div", { ref: containerRef, className: "flex transition-transform duration-500 will-change-transform", style: { transform: `translateX(-${index * 100}%)`, width: `${total * 100}%` }, children: React.Children.map(children, (child, i) => (_jsx("div", { className: "w-full shrink-0 grow-0 basis-full px-2", children: child }))) }), _jsxs("div", { className: "mt-4 flex items-center justify-center gap-4", children: [_jsx("button", { className: "rounded-full border px-3 py-1 text-sm", onClick: prev, "aria-label": "Previous", children: "\u2190 Previous" }), _jsxs("span", { className: "text-sm text-gray-600", children: ["Slide ", index + 1, " of ", total] }), _jsx("button", { className: "rounded-full border px-3 py-1 text-sm", onClick: next, "aria-label": "Next", children: "Next \u2192" })] })] }));
};
