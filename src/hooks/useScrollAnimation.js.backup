import { useRef } from 'react';
import { useInView } from 'framer-motion';
export const useScrollAnimation = (threshold = 0.3) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: threshold });
    return { ref: ref, isInView };
};
