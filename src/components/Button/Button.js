var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
const variantClasses = {
    primary: 'text-white bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] border border-white/30 shadow-[0_18px_40px_rgba(255,143,92,0.35)]',
    secondary: 'text-gray-900 bg-white/90 border border-gray-200 backdrop-blur-sm shadow-[0_12px_30px_rgba(15,23,42,0.08)]',
    outline: 'text-gray-900 border-2 border-gray-200 bg-white/70 hover:border-[#ff8f5c] hover:text-[#ff8f5c]'
};
const sizeClasses = {
    sm: 'h-9 px-4 text-sm md:text-base',
    md: 'h-12 px-6 text-base md:text-lg',
    lg: 'h-14 px-8 text-lg md:text-xl'
};
const Button = (_a) => {
    var _b;
    var { variant = 'primary', size = 'md', type = 'button', loading = false, disabled, children, className, onFocus, onBlur, onClick } = _a, rest = __rest(_a, ["variant", "size", "type", "loading", "disabled", "children", "className", "onFocus", "onBlur", "onClick"]);
    const [isFocused, setIsFocused] = useState(false);
    const isDisabled = disabled || loading;
    const ariaLabel = (_b = rest['aria-label']) !== null && _b !== void 0 ? _b : (typeof children === 'string' ? children : undefined);
    const [ripples, setRipples] = useState([]);
    const spinnerBorder = variant === 'outline' ? 'border-primary-500' : 'border-white';
    const createRipple = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        const newRipple = { id: Date.now(), x, y, size };
        setRipples((prev) => [...prev, newRipple]);
        setTimeout(() => {
            setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
        }, 600);
    };
    const handleClick = (event) => {
        if (!isDisabled) {
            createRipple(event);
        }
        onClick === null || onClick === void 0 ? void 0 : onClick(event);
    };
    const MButton = motion.button;
    return (_jsxs(MButton, Object.assign({ type: type, "aria-label": ariaLabel, disabled: isDisabled, className: cn('relative inline-flex overflow-hidden rounded-2xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60', variantClasses[variant], sizeClasses[size], isFocused && 'ring-2 ring-primary-500 ring-offset-2', className), whileHover: !isDisabled
            ? {
                scale: 1.05,
                boxShadow: '0 15px 30px rgba(0, 82, 204, 0.25)'
            }
            : undefined, whileTap: !isDisabled ? { scale: 0.95 } : undefined, transition: { type: 'spring', stiffness: 400, damping: 17 }, onFocus: (event) => {
            setIsFocused(true);
            onFocus === null || onFocus === void 0 ? void 0 : onFocus(event);
        }, onBlur: (event) => {
            setIsFocused(false);
            onBlur === null || onBlur === void 0 ? void 0 : onBlur(event);
        }, onClick: handleClick }, rest, { children: [ripples.map((ripple) => (_jsx("span", { className: "pointer-events-none absolute rounded-full bg-white/40 button-ripple", style: { top: ripple.y, left: ripple.x, width: ripple.size, height: ripple.size } }, ripple.id))), loading && (_jsx("span", { className: cn('mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent', spinnerBorder), style: { animation: 'spin 1s linear infinite' } })), _jsx("span", { className: "flex items-center gap-2", children: children })] })));
};
export default Button;
