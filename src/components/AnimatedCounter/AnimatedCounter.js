import { jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../lib/utils';
const AnimatedCounter = ({ value, duration = 2, suffix = '', decimals = 0, className }) => {
    const motionValue = useMotionValue(0);
    const [formatted, setFormatted] = useState('0');
    const controlsRef = useRef(null);
    const transformer = useTransform(motionValue, (latest) => Number(latest).toFixed(decimals));
    useEffect(() => {
        const unsubscribe = transformer.on('change', (val) => setFormatted(val));
        return () => {
            unsubscribe();
        };
    }, [transformer]);
    useEffect(() => {
        var _a;
        (_a = controlsRef.current) === null || _a === void 0 ? void 0 : _a.stop();
        motionValue.set(0);
        controlsRef.current = animate(motionValue, value, {
            duration,
            ease: 'easeOut'
        });
        return () => {
            var _a;
            (_a = controlsRef.current) === null || _a === void 0 ? void 0 : _a.stop();
        };
    }, [motionValue, value, duration]);
    const MSpan = motion.span;
    return (_jsxs(MSpan, { "aria-live": "polite", className: cn('text-4xl font-extrabold text-gray-900 md:text-5xl', className), children: [formatted, suffix] }));
};
export default AnimatedCounter;
