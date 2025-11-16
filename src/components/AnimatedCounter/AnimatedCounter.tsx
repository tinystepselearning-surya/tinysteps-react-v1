import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../lib/utils';

interface AnimatedCounterProps {
	value: number;
	duration?: number;
	suffix?: string;
	decimals?: number;
	className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
	value,
	duration = 2,
	suffix = '',
	decimals = 0,
	className
}) => {
	const motionValue = useMotionValue(0);
	const [formatted, setFormatted] = useState('0');
	const controlsRef = useRef<ReturnType<typeof animate> | null>(null);
	const transformer = useTransform(motionValue, (latest: number) => Number(latest).toFixed(decimals));

	useEffect(() => {
	const unsubscribe = transformer.on('change', (val: string) => setFormatted(val));
		return () => {
			unsubscribe();
		};
	}, [transformer]);

	useEffect(() => {
		controlsRef.current?.stop();
		motionValue.set(0);
		controlsRef.current = animate(motionValue, value, {
			duration,
			ease: 'easeOut'
		});

		return () => {
			controlsRef.current?.stop();
		};
	}, [motionValue, value, duration]);

	const MSpan: any = motion.span;

	return (
		<MSpan
			aria-live="polite"
			className={cn('text-4xl font-extrabold text-gray-900 md:text-5xl', className)}
		>
			{formatted}
			{suffix}
	</MSpan>
	);
};

export default AnimatedCounter;
