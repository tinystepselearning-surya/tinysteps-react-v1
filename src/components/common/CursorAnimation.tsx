import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const CursorAnimation: React.FC = () => {
	const [enabled, setEnabled] = useState(false);
	const cursorX = useMotionValue(-100);
	const cursorY = useMotionValue(-100);
	const smoothX = useSpring(cursorX, { stiffness: 300, damping: 30 });
	const smoothY = useSpring(cursorY, { stiffness: 300, damping: 30 });
	const scrollProgress = useMotionValue(0);
	const smoothProgress = useSpring(scrollProgress, { stiffness: 200, damping: 30 });
	const progressWidth = useTransform(smoothProgress, (value) => `${value}%`);

	useEffect(() => {
		if (typeof window === 'undefined' || typeof document === 'undefined') return;
		const prefersFinePointer = window.matchMedia('(pointer: fine)').matches;
		if (!prefersFinePointer) return;
		setEnabled(true);
		document.body.classList.add('custom-cursor-enabled');
		return () => {
			document.body.classList.remove('custom-cursor-enabled');
		};
	}, []);

	useEffect(() => {
		if (!enabled) return;
		const handleMove = (event: MouseEvent) => {
			cursorX.set(event.clientX);
			cursorY.set(event.clientY);
		};
		const handleLeave = () => {
			cursorX.set(-100);
			cursorY.set(-100);
		};

		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseleave', handleLeave);
		return () => {
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseleave', handleLeave);
		};
	}, [cursorX, cursorY, enabled]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const updateProgress = () => {
			const doc = document.documentElement;
			const scrollHeight = doc.scrollHeight - window.innerHeight;
			const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
			scrollProgress.set(progress);
		};
		updateProgress();
		window.addEventListener('scroll', updateProgress, { passive: true });
		return () => {
			window.removeEventListener('scroll', updateProgress);
		};
	}, [scrollProgress]);

	return (
		<>
			<motion.div
				className="pointer-events-none fixed left-0 top-0 z-[1000] h-1 origin-left bg-gradient-to-r from-primary-500 to-secondary-500"
				style={{ width: progressWidth }}
			/>
			{enabled && (
				<motion.div
					className="pointer-events-none fixed z-[1000] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/60 shadow-[0_0_20px_rgba(0,82,204,0.4)]"
					style={{ x: smoothX, y: smoothY }}
				/>
			)}
		</>
	);
};

export default CursorAnimation;
