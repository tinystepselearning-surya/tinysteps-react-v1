import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from '../AnimatedCounter/AnimatedCounter';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { shadowPresets } from '../../styles/designTokens';
import { cn } from '../lib/utils';

interface StatCardProps {
	label: string;
	value: number;
	suffix?: string;
	icon?: React.ReactNode;
	decimals?: number;
	className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, suffix = '', icon, decimals = 0, className }) => {
	const { ref, isInView } = useScrollAnimation(0.2);

	return (
		<motion.div
			ref={ref as React.RefObject<HTMLDivElement>}
			className={cn(
				'flex cursor-pointer flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-md transition-all duration-300 hover:bg-gradient-card',
				className
			)}
			initial={{ opacity: 0, y: 50 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
			whileHover={{ y: -10, boxShadow: shadowPresets.hoverShadow }}
			transition={{ duration: 0.3, ease: 'easeOut' }}
		>
			{icon && <div className="text-5xl text-primary-500">{icon}</div>}
			<AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
			<p className="text-base text-gray-600">{label}</p>
		</motion.div>
	);
};

export default StatCard;
