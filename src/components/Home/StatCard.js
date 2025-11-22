import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import AnimatedCounter from '../AnimatedCounter/AnimatedCounter';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { shadowPresets } from '../../styles/designTokens';
import { cn } from '../lib/utils';
const StatCard = ({ label, value, suffix = '', icon, decimals = 0, className }) => {
    const { ref, isInView } = useScrollAnimation(0.2);
    return (_jsxs(motion.div, { ref: ref, className: cn('flex cursor-pointer flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-md transition-all duration-300 hover:bg-gradient-card', className), initial: { opacity: 0, y: 50 }, animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }, whileHover: { y: -10, boxShadow: shadowPresets.hoverShadow }, transition: { duration: 0.3, ease: 'easeOut' }, children: [icon && _jsx("div", { className: "text-5xl text-primary-500", children: icon }), _jsx(AnimatedCounter, { value: value, suffix: suffix, decimals: decimals }), _jsx("p", { className: "text-base text-gray-600", children: label })] }));
};
export default StatCard;
