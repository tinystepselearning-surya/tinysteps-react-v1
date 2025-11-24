import React from 'react';
type AnimationType = 'fade' | 'slide' | 'scale' | 'letters' | 'words';
interface AnimatedTextProps {
    text: string;
    as?: keyof JSX.IntrinsicElements;
    className?: string;
    animation?: AnimationType;
    delay?: number;
    gradient?: boolean;
    glitchOnHover?: boolean;
}
declare const AnimatedText: React.FC<AnimatedTextProps>;
export default AnimatedText;
