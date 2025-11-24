import React from 'react';
interface AnimatedCounterProps {
    value: number;
    duration?: number;
    suffix?: string;
    decimals?: number;
    className?: string;
}
declare const AnimatedCounter: React.FC<AnimatedCounterProps>;
export default AnimatedCounter;
