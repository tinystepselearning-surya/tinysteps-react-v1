import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
const baseVariants = {
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    slide: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
    scale: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } }
};
const AnimatedText = ({ text, as = 'span', className, animation = 'fade', delay = 0, gradient = false, glitchOnHover = false }) => {
    const Tag = as;
    const content = useMemo(() => {
        var _a;
        if (animation === 'letters') {
            return (_jsx(motion.span, { initial: "hidden", whileInView: "visible", viewport: { once: true, amount: 0.4 }, transition: { staggerChildren: 0.05, delay }, className: "inline-flex flex-wrap", children: text.split('').map((char, index) => (_jsx(motion.span, { variants: {
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                    }, children: char === ' ' ? '\u00A0' : char }, `${char}-${index}`))) }));
        }
        if (animation === 'words') {
            return (_jsx(motion.span, { initial: "hidden", whileInView: "visible", viewport: { once: true, amount: 0.4 }, transition: { staggerChildren: 0.15, delay }, className: "inline-flex flex-wrap gap-1", children: text.split(' ').map((word, index) => (_jsx(motion.span, { variants: {
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0 }
                    }, children: word }, `${word}-${index}`))) }));
        }
        const variant = (_a = baseVariants[animation]) !== null && _a !== void 0 ? _a : baseVariants.fade;
        return (_jsx(motion.span, { initial: variant.initial, whileInView: variant.animate, viewport: { once: true, amount: 0.4 }, transition: { duration: 0.6, delay }, children: text }));
    }, [animation, delay, text]);
    return (_jsx(Tag, { className: cn('inline-block', className, gradient && 'animated-gradient-text', glitchOnHover && 'glitch-text'), "data-glitch": glitchOnHover ? text : undefined, children: content }));
};
export default AnimatedText;
