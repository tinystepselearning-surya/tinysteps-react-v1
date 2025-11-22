import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const SessionStartView = () => {
    return (_jsx("div", { className: "p-6", children: _jsxs(motion.div, { className: "bg-green-100 rounded-3xl p-8 text-center", initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 200 }, children: [_jsx("div", { className: "text-8xl mb-4", children: "\uD83C\uDF89" }), _jsx("h1", { className: "text-4xl font-bold text-green-800 mb-4", children: "Great! Let's Go!" }), _jsx("p", { className: "text-xl text-green-700", children: "Your session is starting now!" }), _jsx(motion.div, { className: "mt-6", animate: { rotate: 360 }, transition: { duration: 2, repeat: Infinity, ease: "linear" }, children: _jsx("span", { className: "text-6xl", children: "\uD83C\uDF1F" }) })] }) }));
};
export default SessionStartView;
