import { RefObject, useRef } from 'react';
import { useInView } from 'framer-motion';

export const useScrollAnimation = (threshold: number = 0.3): { ref: RefObject<HTMLElement>; isInView: boolean } => {
	const ref = useRef<HTMLElement | null>(null);
	const isInView = useInView(ref, { once: true, amount: threshold });

	return { ref: ref as RefObject<HTMLElement>, isInView };
};
