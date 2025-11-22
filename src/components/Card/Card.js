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
import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
const Card = (_a) => {
    var { gradient = false, withBorder = false, className, children } = _a, rest = __rest(_a, ["gradient", "withBorder", "className", "children"]);
    return (_jsx(motion.div, Object.assign({ className: cn('relative rounded-lg bg-white p-6 text-slate-800 shadow-md transition-all duration-300 hover:shadow-xl', gradient && 'bg-gradient-card text-slate-900', withBorder && 'border-l-4 border-primary-500', className), whileHover: { y: -10, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)' }, transition: { duration: 0.3 } }, rest, { children: children })));
};
export default Card;
